import multipart from '@fastify/multipart';
import { fileTypeFromBuffer } from 'file-type';
import { randomUUID } from 'node:crypto';
import { mkdir,writeFile,unlink,readFile } from 'node:fs/promises';
import { resolve,join } from 'node:path';
import { fail,role } from './security.mjs';
import { uuid } from './validation.mjs';

export async function registerFiles(app,db,storageRoot) {
  const root=resolve(storageRoot);
  await app.register(multipart,{limits:{fileSize:20*1024*1024,files:1,fields:0,parts:1}});
  async function accessible(req) {
    role(req.user,'customer','publisher','admin');const id=uuid.parse(req.params.id);
    const file=(await db.query('SELECT * FROM files WHERE id=$1',[id])).rows[0];
    if(!file) fail(404,'File not found');
    if(req.user.role==='admin'||file.owner_id===req.user.id) return file;
    const logo=(await db.query("SELECT id FROM outlets WHERE details->>'logoFileId'=$1 AND active AND status='approved' LIMIT 1",[id])).rows[0];
    if(logo)return file;
    const order=(await db.query("SELECT id FROM orders WHERE publisher_id=$1 AND snapshot->'metadata'->'attachments' ? $2 LIMIT 1",[req.user.id,id])).rows[0];
    if(!order) fail(404,'File not found');return file;
  }
  app.post('/api/files',async req=>{
    role(req.user,'customer','publisher');
    const part=await req.file();if(!part) fail(400,'File required');
    const buffer=await part.toBuffer();
    if(!buffer.length || part.file.truncated) fail(413,'File exceeds 20 MB');
    const type=await fileTypeFromBuffer(buffer);
    const allowed=['image/png','image/jpeg','image/webp','application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    let mime=type?.mime;
    if(!type && /\.txt$/i.test(part.filename) && !buffer.includes(0)) {
      try { new TextDecoder('utf-8',{fatal:true}).decode(buffer);mime='text/plain'; } catch { fail(400,'Invalid UTF-8 text'); }
    }
    if(!allowed.includes(mime) && mime!=='text/plain') fail(400,'Allowed: PNG, JPEG, WEBP, PDF, DOCX, UTF-8 TXT');
    const id=randomUUID();const name=part.filename.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,240)||'file';
    await mkdir(root,{recursive:true,mode:0o700});
    await writeFile(join(root,id),buffer,{flag:'wx',mode:0o600});
    try {
      return await db.transaction(async tx=>{
        // Serialize per-user quota checks with concurrent uploads.
        await tx.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[req.user.id]);
        const usage=(await tx.query('SELECT coalesce(sum(size),0) AS total FROM files WHERE owner_id=$1',[req.user.id])).rows[0];
        if(Number(usage.total)+buffer.length>500*1024*1024) fail(413,'Account file quota exceeded');
        return (await tx.query('INSERT INTO files(id,owner_id,name,mime,size) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,mime,size',[id,req.user.id,name,mime,buffer.length])).rows[0];
      });
    } catch(error) {await unlink(join(root,id));throw error;}
  });
  app.get('/api/files/:id/meta',async req=>{const {id,name,mime,size}=await accessible(req);return {id,name,mime,size};});
  app.get('/api/files/:id/image',async(req,reply)=>{
    const file=await accessible(req);
    if(!['image/png','image/jpeg','image/webp'].includes(file.mime))fail(400,'Not an image');
    return reply.header('Content-Disposition','inline').type(file.mime).send(await readFile(join(root,file.id)));
  });
  app.get('/api/files/:id',async(req,reply)=>{
    const file=await accessible(req);const buffer=await readFile(join(root,file.id));
    reply.header('Content-Disposition',`attachment; filename="attachment"; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    reply.header('Content-Security-Policy',"sandbox; default-src 'none'");
    return reply.type(file.mime).send(buffer);
  });
}
