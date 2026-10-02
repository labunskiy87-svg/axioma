import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {rewriteFixture} from './rewrite-fixture.mjs';
import {generateRewrite,expireRewrites} from '../ai-rewrite.mjs';

const payload={body:'<p>Компания открыла завод в 2026 году.</p>',prompt:'Сделать короче'};
const response=body=>Response.json({model:'test-model',choices:[{message:{content:JSON.stringify({body})}}]});
test('rewrite bills once per request and each repeat is separately paid',async()=>{
  let calls=0;
  const f=await rewriteFixture(async(url,options)=>{
    calls++;const request=JSON.parse(options.body);
    assert.equal(request.response_format.json_schema.name,'material_rewrite');
    assert.equal(request.model,'test-model');
    assert.match(request.messages[0].content,/сохрани смысл/);
    assert.equal(JSON.parse(request.messages[1].content).materialHtml,payload.body);
    return response('<p>В 2026 году компания открыла завод.</p>');
  });
  try {
    const key=randomUUID(),first=await f.request(payload,key),again=await f.request(payload,key);
    assert.equal(first.statusCode,200);assert.equal(first.json().status,'completed');
    assert.deepEqual(again.json(),first.json());assert.equal(calls,1);
    assert.deepEqual(await f.balance(),{available:7000,reserved:0});
    assert.equal((await f.request({...payload,prompt:'Иное ТЗ'},key)).statusCode,409);
    assert.equal((await f.request(payload)).json().status,'completed');assert.equal(calls,2);
    assert.deepEqual(await f.balance(),{available:4000,reserved:0});
    assert.equal((await f.app.inject({method:'GET',url:`/api/materials/ai-rewrite/${first.json().id}`,headers:{cookie:f.otherCookie}})).statusCode,404);
  } finally {await f.close();}
});
test('concurrent duplicate requests do not run or charge twice; failed requests refund',async()=>{
  let release,started,calls=0;
  const startedPromise=new Promise(resolve=>started=resolve),gate=new Promise(resolve=>release=resolve);
  const f=await rewriteFixture(async()=>{calls++;started();await gate;return Response.json({}, {status:503});});
  try {
    const key=randomUUID(),first=f.request(payload,key);await startedPromise;
    const duplicate=await f.request(payload,key);assert.equal(duplicate.statusCode,202);
    assert.deepEqual(await f.balance(),{available:7000,reserved:3000});
    release();const done=await first;
    assert.equal(done.json().status,'failed');assert.match(done.json().error,/возвращена/);
    assert.equal(calls,1);assert.deepEqual(await f.balance(),{available:10000,reserved:0});
    assert.equal((await f.request(payload,key)).json().status,'failed');assert.equal(calls,1);
  } finally {release();await f.close();}
});
test('invalid input, unavailable integration and low balance make no model call; interrupted jobs refund once',async()=>{
  let calls=0;const f=await rewriteFixture(async()=>{calls++;return response('<p>Текст</p>');});
  try {
    assert.equal((await f.request({...payload,body:'<p></p>'})).statusCode,400);
    assert.equal((await f.request(payload,randomUUID(),f.otherCookie)).statusCode,409);
    await f.db.query("UPDATE reputation_integrations SET enabled=false WHERE provider='openrouter'");
    assert.equal((await f.request(payload)).statusCode,409);assert.equal(calls,0);
    const id=randomUUID();await f.db.transaction(async tx=>{
      const {transfer}=await import('../finance.mjs');await transfer(tx,`${f.user.id}:available`,`${f.user.id}:reserved`,3000,`rewrite-reserve:${id}`);
      await tx.query("INSERT INTO ai_rewrites(id,owner_id,status,expires_at) VALUES ($1,$2,'running',now()-interval '1 minute')",[id,f.user.id]);
    });
    assert.equal(await expireRewrites(f.db),1);assert.equal(await expireRewrites(f.db),0);
    assert.deepEqual(await f.balance(),{available:10000,reserved:0});
  } finally {await f.close();}
});
test('rewrite retains original links and images, sanitizes HTML and rejects missing or invented assets',async()=>{
  const body='<p>Факт <a href="https://example.org">Источник</a></p><img src="/api/files/example/image" alt="Фото" />';
  const connection={apiKey:'test-key',settings:{model:'test-model'}};
  const result=await generateRewrite(body,'Рерайт',connection,{fetchImpl:async()=>response(body+'<script>bad()</script>')});
  assert.doesNotMatch(result.body,/<script/);assert.match(result.body,/https:\/\/example.org/);
  for(const candidate of ['<p>Текст без источников</p>',body+'<a href="https://invented.org">Новый</a>','<p></p>'])await assert.rejects(generateRewrite(body,'Рерайт',connection,{fetchImpl:async()=>response(candidate)}));
});
