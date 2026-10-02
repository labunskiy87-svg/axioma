import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';
import {rewriteFixture} from './rewrite-fixture.mjs';
import {generateImage,expireImages,IMAGE_MODEL} from '../ai-image.mjs';

export const png=await sharp({create:{width:1536,height:864,channels:3,background:'#20b8a5'}}).png().toBuffer();
const response=()=>Response.json({data:[{b64_json:png.toString('base64'),media_type:'image/png'}],usage:{cost:0.03}});
const request=(f,key=randomUUID(),prompt='Иллюстрация',cookie=f.cookie)=>f.app.inject({method:'POST',url:'/api/materials/ai-image',headers:{origin:f.origin,cookie,'idempotency-key':key},payload:{prompt}});

test('image generation uses Flare 16:9, stores 1024px file, bills once and bills repeats separately',async()=>{
  let calls=0;
  const f=await rewriteFixture(async(url,options)=>{
    calls++;assert.equal(url,'https://openrouter.ai/api/v1/images');
    const body=JSON.parse(options.body);assert.equal(body.model,IMAGE_MODEL);assert.equal(body.aspect_ratio,'16:9');assert.equal(body.n,1);assert.equal(body.prompt,'Иллюстрация');
    assert.equal(options.headers.Authorization,'Bearer rewrite-test-openrouter-key');return response();
  });
  try {
    const key=randomUUID(),first=await request(f,key),result=first.json();assert.equal(first.statusCode,200);assert.equal(result.status,'completed');
    assert.equal(result.width,1024);assert.equal(result.height,576);
    assert.deepEqual((await request(f,key)).json(),result);assert.equal(calls,1);
    assert.deepEqual(await f.balance(),{available:5000,reserved:0});
    assert.equal((await request(f,key,'Иное ТЗ')).statusCode,409);
    const file=await readFile(join(f.storageRoot,result.file.id));assert.equal((await sharp(file).metadata()).width,1024);
    assert.equal((await f.app.inject({method:'GET',url:result.url,headers:{cookie:f.cookie}})).statusCode,200);
    assert.equal((await f.app.inject({method:'GET',url:result.url,headers:{cookie:f.otherCookie}})).statusCode,404);
    assert.equal((await f.app.inject({method:'GET',url:`/api/materials/ai-image/${result.id}`,headers:{cookie:f.otherCookie}})).statusCode,404);
    assert.equal((await request(f)).json().status,'completed');assert.equal(calls,2);
    assert.deepEqual(await f.balance(),{available:0,reserved:0});
    assert.equal((await request(f)).statusCode,409);assert.equal(calls,2);
  } finally {await f.close();}
});

test('image storage failure refunds immediately without retaining an attachment',async()=>{
  const f=await rewriteFixture(async()=>response());
  try {
    await rm(f.storageRoot,{recursive:true});await writeFile(f.storageRoot,'not a directory');
    const result=(await request(f)).json();assert.equal(result.status,'failed');assert.match(result.error,/сохранить/);
    assert.deepEqual(await f.balance(),{available:10000,reserved:0});
    assert.equal((await f.db.query('SELECT id FROM files WHERE owner_id=$1',[f.user.id])).rows.length,0);
  } finally {await f.close();}
});

test('concurrent image requests have one provider call; failed, invalid and expired generations refund once',async()=>{
  let release,started,calls=0;
  const gate=new Promise(resolve=>release=resolve),ready=new Promise(resolve=>started=resolve);
  const f=await rewriteFixture(async()=>{calls++;started();await gate;return Response.json({}, {status:502});});
  try {
    assert.equal((await request(f,randomUUID(),' ')).statusCode,400);assert.equal(calls,0);
    const key=randomUUID(),pending=request(f,key);await ready;
    const duplicate=await request(f,key);assert.equal(duplicate.statusCode,202);assert.equal(calls,1);
    assert.deepEqual(await f.balance(),{available:5000,reserved:5000});
    release();assert.equal((await pending).json().status,'failed');assert.equal((await request(f,key)).json().status,'failed');
    assert.deepEqual(await f.balance(),{available:10000,reserved:0});
    await f.db.query('UPDATE accounts SET balance=5000 WHERE id=$1',[`${f.user.id}:available`]);
    await f.db.query('UPDATE accounts SET balance=5000 WHERE id=$1',[`${f.user.id}:reserved`]);
    await f.db.query("INSERT INTO ai_images(id,owner_id,status,expires_at) VALUES ($1,$2,'running',now()-interval '1 second')",[randomUUID(),f.user.id]);
    assert.equal(await expireImages(f.db),1);assert.equal(await expireImages(f.db),0);
    assert.deepEqual(await f.balance(),{available:10000,reserved:0});
  } finally {await f.close();}
});

test('image validation rejects text, malformed base64, wrong orientation and storage quota returns funds',async()=>{
  for(const data of [{data:[]},{data:[{b64_json:'not an image'}]},{data:[{b64_json:Buffer.from('not an image').toString('base64')}]}]) {
    await assert.rejects(generateImage('test',{apiKey:'test'},{fetchImpl:async()=>Response.json(data)}));
  }
  const portrait=await sharp({create:{width:576,height:1024,channels:3,background:'#20b8a5'}}).png().toBuffer();
  await assert.rejects(generateImage('test',{apiKey:'test'},{fetchImpl:async()=>Response.json({data:[{b64_json:portrait.toString('base64')}]})}));
  const f=await rewriteFixture(async()=>response());
  try {
    for(let i=0;i<25;i++)await f.db.query('INSERT INTO files(id,owner_id,name,mime,size) VALUES ($1,$2,$3,$4,$5)',[randomUUID(),f.user.id,'quota.png','image/png',20*1024*1024]);
    const result=(await request(f)).json();assert.equal(result.status,'failed');assert.match(result.error,/лимит/);
    assert.deepEqual(await f.balance(),{available:10000,reserved:0});
    await f.db.query("UPDATE reputation_integrations SET enabled=false WHERE provider='openrouter'");
    assert.equal((await request(f)).statusCode,409);
  } finally {await f.close();}
});
