import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import sharp from 'sharp';
import {fileTypeFromBuffer} from 'file-type';
import {z} from 'zod';
import {role,fail} from './security.mjs';
import {once,transfer,audit} from './finance.mjs';
import {reputationIntegration} from './reputation.mjs';

export const IMAGE_MODEL='openai/gpt-image-2.5-flare';
const input=z.object({prompt:z.string().trim().min(1).max(4000)}).strict();
const publicResult=row=>({id:row.id,status:row.status,...(row.status==='completed'?row.result:{}),...(row.status==='failed'?{error:row.error}:{})});

export async function generateImage(prompt,connection,{fetchImpl=globalThis.fetch,appOrigin}={}) {
  const response=await fetchImpl('https://openrouter.ai/api/v1/images',{
    method:'POST',signal:AbortSignal.timeout(240000),
    headers:{Authorization:`Bearer ${connection.apiKey}`,'Content-Type':'application/json',...(appOrigin?{'HTTP-Referer':appOrigin}:{})},
    body:JSON.stringify({model:IMAGE_MODEL,prompt,n:1,aspect_ratio:'16:9',quality:'medium',output_format:'png'}),
  });
  if(!response.ok)throw new Error('Image provider failed');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;if(size>30*1024*1024)throw new Error('Image response too large');
      chunks.push(value);
    }
  } catch(error) {await reader.cancel().catch(()=>{});throw error;}
  const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const encoded=result.data?.[0]?.b64_json;
  if(typeof encoded!=='string'||!encoded.length||encoded.length>28*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw new Error('Invalid image response');
  const source=Buffer.from(encoded,'base64'),type=await fileTypeFromBuffer(source);
  if(!['image/png','image/jpeg','image/webp'].includes(type?.mime))throw new Error('Invalid image format');
  const image=sharp(source,{limitInputPixels:16000000,failOn:'warning'});
  const meta=await image.metadata();
  if(!meta.width||!meta.height||meta.pages>1||Math.abs(meta.width/meta.height-16/9)>0.04)throw new Error('Invalid image dimensions');
  const {data,info}=await image.rotate().resize({width:1024}).png().toBuffer({resolveWithObject:true});
  return {buffer:data,width:info.width,height:info.height,model:IMAGE_MODEL,usage:result.usage};
}

export async function expireImages(db) {
  return db.transaction(async tx=>{
    const rows=(await tx.query("SELECT * FROM ai_images WHERE status IN ('queued','running') AND expires_at<=now() ORDER BY expires_at LIMIT 20 FOR UPDATE SKIP LOCKED")).rows;
    for(const row of rows) {
      await transfer(tx,`${row.owner_id}:reserved`,`${row.owner_id}:available`,row.amount,`image-refund:${row.id}`);
      await tx.query("UPDATE ai_images SET status='failed',error=$2,completed_at=now() WHERE id=$1",[row.id,'Генерация прервана. Сумма возвращена на баланс.']);
      await audit(tx,row.owner_id,'material.image.refund',row.id,{reason:'expired',amount:row.amount});
    }
    return rows.length;
  });
}

export function registerAiImage(app,db,{integrationSecret,fetchImpl,appOrigin,storageRoot}) {
  const root=resolve(storageRoot);let timer;
  app.addHook('onReady',()=>{timer=setInterval(()=>expireImages(db).catch(error=>app.log.error({err:error},'Image refund failed')),30000);timer.unref();});
  app.addHook('onClose',()=>clearInterval(timer));
  app.get('/api/materials/ai-image/:id',async req=>{
    role(req.user,'customer');const id=z.uuid().parse(req.params.id);
    await expireImages(db);
    const row=(await db.query('SELECT * FROM ai_images WHERE id=$1 AND owner_id=$2',[id,req.user.id])).rows[0];
    if(!row)fail(404,'Генерация не найдена');return publicResult(row);
  });
  app.post('/api/materials/ai-image',async(req,reply)=>{
    role(req.user,'customer');const {prompt}=input.parse(req.body);
    await expireImages(db);
    const connection=await reputationIntegration(db,'openrouter',integrationSecret);
    if(!connection)fail(409,'OpenRouter не подключен');
    const operation=await once(db,req,'material.image',async tx=>{
      const id=randomUUID();
      await transfer(tx,`${req.user.id}:available`,`${req.user.id}:reserved`,5000,`image-reserve:${id}`);
      await tx.query("INSERT INTO ai_images(id,owner_id,status) VALUES ($1,$2,'queued')",[id,req.user.id]);
      await audit(tx,req.user.actorId??req.user.id,'material.image.start',id,{amount:5000,model:IMAGE_MODEL});
      return {id};
    });
    const claimed=(await db.query("UPDATE ai_images SET status='running' WHERE id=$1 AND owner_id=$2 AND status='queued' RETURNING id",[operation.id,req.user.id])).rows[0];
    if(claimed) {
      let image,error,written;
      try {image=await generateImage(prompt,connection,{fetchImpl,appOrigin});}
      catch {error='Не удалось сгенерировать изображение. Сумма возвращена на баланс.';}
      try {
        await db.transaction(async tx=>{
          const row=(await tx.query('SELECT * FROM ai_images WHERE id=$1 FOR UPDATE',[operation.id])).rows[0];
          if(row.status!=='running')return;
          let result;
          if(!error) {
            await tx.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[row.owner_id]);
            const usage=(await tx.query('SELECT coalesce(sum(size),0) AS total FROM files WHERE owner_id=$1',[row.owner_id])).rows[0];
            if(Number(usage.total)+image.buffer.length>500*1024*1024)error='Превышен лимит хранения файлов. Сумма возвращена на баланс.';
            else {
              const id=randomUUID(),path=join(root,id);
              try {await mkdir(root,{recursive:true,mode:0o700});await writeFile(path,image.buffer,{flag:'wx',mode:0o600});written=path;}
              catch {error='Не удалось сохранить изображение. Сумма возвращена на баланс.';}
              if(!error) {
                const file=(await tx.query('INSERT INTO files(id,owner_id,name,mime,size) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,mime,size',[id,row.owner_id,`ai-image-${row.id}.png`,'image/png',image.buffer.length])).rows[0];
                result={file,url:`/api/files/${id}/image`,width:image.width,height:image.height,model:image.model,usage:image.usage};
              }
            }
          }
          if(error)await transfer(tx,`${row.owner_id}:reserved`,`${row.owner_id}:available`,row.amount,`image-refund:${row.id}`);
          else await transfer(tx,`${row.owner_id}:reserved`,'platform:revenue',row.amount,`image:${row.id}`);
          await tx.query('UPDATE ai_images SET status=$2,result=$3,error=$4,completed_at=now() WHERE id=$1',[row.id,error?'failed':'completed',result?JSON.stringify(result):null,error??null]);
          await audit(tx,req.user.actorId??req.user.id,error?'material.image.refund':'material.image.complete',row.id,{amount:row.amount});
        });
      } catch(error) {if(written)await unlink(written).catch(()=>{});throw error;}
    }
    const row=(await db.query('SELECT * FROM ai_images WHERE id=$1 AND owner_id=$2',[operation.id,req.user.id])).rows[0];
    return reply.code(['queued','running'].includes(row.status)?202:200).send(publicResult(row));
  });
}
