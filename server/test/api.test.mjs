import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { migrate,database } from '../db.mjs';
import { buildApp,createUser } from '../app.mjs';
import { transfer,quote } from '../finance.mjs';

// The same suite runs against PostgreSQL in CI. Embedded Postgres is a local fallback.
async function fixture(t) {
  let db;
  if(process.env.TEST_DATABASE_URL) db=database(process.env.TEST_DATABASE_URL);
  else {
    const pg=new PGlite();
    const wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
    db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx))),close:()=>pg.close()};
  }
  await migrate(db); await migrate(db);
  const users=await db.transaction(async tx=>{
    const result={};
    for(const role of ['customer','publisher','admin']) result[role]=await createUser(tx,`${randomUUID()}@example.test`,'a-valid-test-password',role);
    result.other=await createUser(tx,`${randomUUID()}@example.test`,'a-valid-test-password');
    await transfer(tx,'external:clearing',`${result.customer.id}:available`,1000000,'test-only');
    return result;
  });
  const storageRoot=await mkdtemp(join(tmpdir(),'axioma-files-'));
  const app=await buildApp({db,storageRoot});
  t.after(async()=>{await app.close();await db.close();await rm(storageRoot,{recursive:true,force:true});});
  const cookies={};
  for(const [key,u] of Object.entries(users)) {
    const res=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:u.email,password:'a-valid-test-password'}});
    assert.equal(res.statusCode,200,res.body); cookies[key]=res.headers['set-cookie'].split(';')[0];
  }
  const call=(who,method,url,payload,key=randomUUID())=>app.inject({method,url,payload,headers:{cookie:cookies[who]??'',origin:'http://127.0.0.1:5173','idempotency-key':key}});
  const ok=async(who,method,url,payload,key)=>{const r=await call(who,method,url,payload,key);assert.ok(r.statusCode<300,r.body);return r.json();};
  const ad=await ok('customer','POST','/api/advertisers',{name:'Test advertiser',inn:'7700000000'});
  // Only test fixtures bypass the external advertiser verification adapter.
  await db.query("UPDATE advertisers SET verification='verified' WHERE id=$1",[ad.id]);
  const input={advertiserId:ad.id,title:'Original news',body:'Publication text',format:'news'};
  const [material]=await ok('customer','POST','/api/materials/batch',[input]);
  const outlet=await ok('publisher','POST','/api/outlets',{name:'Outlet',url:'https://example.test',kind:'media',geography:'federal',details:{goals:['pr']},prices:{article:150000,news:85000},discountBps:1000,discountUntil:'2099-08-31'});
  await ok('admin','POST',`/api/admin/outlets/${outlet.id}`,{approved:true});
  return {db,app,cookies,users,call,ok,material,outlet,input};
}

test('administration, persistent conversations and informers enforce role boundaries',async t=>{
 const {ok,call,material,outlet,users}=await fixture(t);
 const listed=await ok('admin','GET','/api/admin/users');
 assert.equal(Number(listed.find(u=>u.id===users.customer.id).available),1000000);
 assert.ok((await ok('admin','GET','/api/admin/advertisers')).length);
 assert.equal((await call('customer','GET','/api/admin/users')).statusCode,403);
 await ok('admin','POST',`/api/outlets/${outlet.id}/active`,{active:false});
 assert.equal((await ok('customer','GET','/api/outlets')).length,0);
 await ok('admin','POST',`/api/outlets/${outlet.id}/active`,{active:true});
 await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
 await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
 const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
 await ok('customer','POST',`/api/orders/${order.id}/messages`,{body:'Please check the link'});
 await ok('publisher','POST',`/api/orders/${order.id}/messages`,{body:'Confirmed'});
 assert.equal((await ok('admin','GET',`/api/orders/${order.id}/messages`)).length,2);
 assert.equal((await call('other','GET',`/api/orders/${order.id}/messages`)).statusCode,404);
 const ticket=await ok('customer','POST','/api/tickets',{subject:'Help',body:'Question'});
 await ok('admin','POST',`/api/tickets/${ticket.id}/messages`,{body:'Answer'});
 assert.equal((await ok('customer','GET',`/api/tickets/${ticket.id}/messages`)).length,2);
 assert.equal((await call('other','GET',`/api/tickets/${ticket.id}/messages`)).statusCode,404);
 await ok('admin','PATCH',`/api/tickets/${ticket.id}`,{status:'closed'});
 assert.equal((await call('customer','POST',`/api/tickets/${ticket.id}/messages`,{body:'Late'})).statusCode,409);
 const informer=await ok('admin','POST','/api/informers',{title:'Test notice',status:'Опубликован'});
 assert.ok((await ok('customer','GET','/api/informers')).some(i=>i.id===informer.id));
 const {id,updatedAt,...data}=informer;
 await ok('admin','PUT',`/api/informers/${id}`,{...data,status:'Приостановлен'});
 assert.equal((await ok('customer','GET','/api/informers')).length,0);
 await ok('admin','PUT',`/api/informers/${id}`,{...data,status:'Запланирован',startsAt:'01.01.2099'});
 assert.equal((await ok('customer','GET','/api/informers')).length,0);
 assert.equal((await call('admin','PUT',`/api/informers/${id}`,{...data,startsAt:'31.02.2026'})).statusCode,400);
 assert.equal((await call('publisher','POST','/api/informers',{title:'Denied',status:'Черновик'})).statusCode,403);
 assert.ok((await ok('admin','GET','/api/admin/audit')).some(a=>a.action==='order.message'));
 assert.ok((await ok('admin','GET','/api/admin/ledger')).length);
});

test('uploaded attachments persist and are only shared through the publication snapshot',async t=>{
  const {app,cookies,ok,call,input,outlet}=await fixture(t);
  const upload=async(name,body)=>app.inject({method:'POST',url:'/api/files',headers:{cookie:cookies.customer,origin:'http://127.0.0.1:5173','content-type':'multipart/form-data; boundary=axioma-test'},payload:Buffer.from(`--axioma-test\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: text/plain\r\n\r\n${body}\r\n--axioma-test--\r\n`)});
  const response=await upload('brief.txt','Persistent attached text');
  assert.equal(response.statusCode,200,response.body);
  const file=response.json();
  assert.equal((await call('customer','GET',`/api/files/${file.id}`)).body,'Persistent attached text');
  assert.equal((await call('other','GET',`/api/files/${file.id}/meta`)).statusCode,404);
  assert.equal((await call('publisher','GET',`/api/files/${file.id}`)).statusCode,404);
  assert.equal((await upload('payload.html','<script>alert(1)</script>')).statusCode,400);
  const foreignAd=await ok('other','POST','/api/advertisers',{name:'Other',inn:'7700000000'});
  assert.equal((await call('other','POST','/api/materials/batch',[{...input,advertiserId:foreignAd.id,metadata:{attachments:[file.id]}}])).statusCode,404);
  const [material]=await ok('customer','POST','/api/materials/batch',[{...input,metadata:{attachments:[file.id]}}]);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('customer','PUT',`/api/materials/${material.id}`,{...input,version:1});
  assert.equal((await call('publisher','GET',`/api/files/${file.id}`)).body,'Persistent attached text');
});

test('saving batch drafts updates existing forms without duplication and rejects stale quotes atomically',async t=>{
  const {ok,call,input,outlet}=await fixture(t);
  const item={...input,clientKey:randomUUID()};
  const first=await ok('customer','POST','/api/materials/save-batch',{items:[item],submit:false,expedited:false});
  const second=await ok('customer','POST','/api/materials/save-batch',{items:[{...item,title:'Updated title'},{...input,clientKey:randomUUID()}],submit:false,expedited:false});
  assert.ok(second.ids.includes(first.ids[0]));
  assert.equal((await ok('customer','GET','/api/materials')).find(m=>m.id===first.ids[0]).title,'Updated title');
  assert.equal((await ok('customer','GET','/api/materials')).length,3);
  await ok('customer','POST','/api/materials/submit',{ids:[first.ids[0]],expedited:false});
  await ok('admin','POST',`/api/moderation/${first.ids[0]}`,{approved:true});
  assert.equal((await call('customer','POST','/api/orders',{materialId:first.ids[0],outletIds:[outlet.id],expectedAmount:1})).statusCode,409);
  assert.equal((await ok('customer','GET','/api/orders')).length,0);
  assert.equal((await ok('customer','GET','/api/balance')).reserved,0);
});

test('order lifecycle uses news tariff, snapshot, reserve, commission and idempotency',async t=>{
  const {db,ok,call,material,outlet,users,input}=await fixture(t);
  const key=randomUUID();
  const submission=await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:true},key);
  assert.equal(submission.fee,5000);
  assert.deepEqual(await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:true},key),submission);
  assert.equal((await ok('customer','GET','/api/balance')).available,995000);
  assert.equal((await ok('admin','GET','/api/moderation'))[0].id,material.id);
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const orderKey=randomUUID();
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]},orderKey);
  assert.equal(order.amount,76500);
  assert.ok(Number.isInteger(order.number) && order.number>=1001);
  assert.equal(order.payout,65025);
  assert.equal((await ok('customer','GET','/api/balance')).reserved,76500);
  assert.equal((await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]},orderKey))[0].id,order.id);
  assert.equal((await ok('publisher','GET','/api/orders'))[0].number,order.number);
  assert.equal((await ok('admin','GET','/api/orders')).find(o=>o.id===order.id).number,order.number);
  await ok('customer','PUT',`/api/materials/${material.id}`,{...input,title:'Edited after order',version:1});
  assert.equal((await ok('publisher','GET','/api/orders'))[0].snapshot.title,'Original news');
  assert.equal((await call('other','POST',`/api/orders/${order.id}/action`,{action:'complete'})).statusCode,404);
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  assert.equal((await call('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/news'})).statusCode,400);
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/news',markingConfirmed:true});
  await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'complete'});
  assert.equal((await call('customer','POST',`/api/orders/${order.id}/action`,{action:'complete'})).statusCode,409);
  assert.equal((await ok('publisher','GET','/api/balance')).available,65025);
  assert.equal((await ok('customer','GET','/api/balance')).reserved,0);
  const sum=(await db.query('SELECT sum(balance) AS total FROM accounts')).rows[0];
  assert.equal(Number(sum.total),0);
  const ledger=(await db.query('SELECT * FROM ledger WHERE credit_account=$1',[`${users.publisher.id}:available`])).rows;
  assert.equal(ledger.length,1);
});

test('batch operations roll back and prevent cross-account access',async t=>{
  const {ok,call,material,input}=await fixture(t);
  assert.equal((await call('other','PUT',`/api/materials/${material.id}`,{...input,version:1})).statusCode,404);
  assert.equal((await call('other','POST','/api/materials/batch',[input])).statusCode,404);
  assert.equal((await call('customer','POST','/api/materials/submit',{ids:[material.id,randomUUID()],expedited:true})).statusCode,404);
  assert.equal((await ok('customer','GET','/api/balance')).available,1000000);
  assert.equal((await ok('customer','GET','/api/materials'))[0].status,'draft');
  assert.equal((await call('customer','GET','/api/moderation')).statusCode,403);
  assert.equal((await call('other','GET','/api/materials')).json().length,0);
  const key=randomUUID();
  await ok('customer','POST','/api/materials/batch',[input],key);
  assert.equal((await call('customer','POST','/api/materials/batch',[{...input,title:'Different'}],key)).statusCode,409);
});

test('rejection and dispute release reconcile every account with ledger entries',async t=>{
 const {db,ok,call,material,outlet,users}=await fixture(t);
 const openingRevenue=Number((await db.query("SELECT balance FROM accounts WHERE id='platform:revenue'")).rows[0].balance);
 await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
 await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
 const create=async()=>(await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]}))[0];
 const rejected=await create();
 await ok('publisher','POST',`/api/orders/${rejected.id}/action`,{action:'reject',reason:'No capacity'});
 assert.equal((await ok('customer','GET','/api/balance')).available,1000000);
 const order=await create();
 await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
 await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/published',markingConfirmed:true});
 const dispute=await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'dispute',reason:'Check placement'});
 const result=await ok('admin','POST',`/api/orders/${order.id}/action`,{action:'release',reason:'Placement meets requirements'});
 assert.equal(result.dispute_number,dispute.dispute_number);
 assert.equal((await ok('publisher','GET','/api/balance')).available,65025);
 assert.equal((await ok('customer','GET','/api/balance')).reserved,0);
 assert.equal((await call('admin','POST',`/api/orders/${order.id}/action`,{action:'release',reason:'Repeated'})).statusCode,409);
 const ledger=await ok('admin','GET','/api/admin/ledger');
 const balances=(await db.query('SELECT * FROM accounts')).rows;
 for(const account of balances) {
  const derived=ledger.reduce((sum,e)=>sum+(e.credit_account===account.id?Number(e.amount):0)-(e.debit_account===account.id?Number(e.amount):0),0);
  assert.equal(Number(account.balance),derived,account.id);
 }
 const adminUsers=await ok('admin','GET','/api/admin/users');
 assert.equal(Number(adminUsers.find(u=>u.id===users.publisher.id).available),65025);
 assert.equal(Number(balances.find(a=>a.id==='platform:revenue').balance),openingRevenue+11475);
});

test('refund holds funds during dispute and releases once',async t=>{
  const {ok,call,material,outlet}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/a',markingConfirmed:true});
  const dispute=await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'dispute',reason:'Wrong publication'});
  assert.ok(Number.isInteger(dispute.dispute_number)&&dispute.dispute_number>=1001);
  assert.equal((await ok('customer','GET','/api/balance')).reserved,76500);
  await ok('admin','POST',`/api/orders/${order.id}/action`,{action:'refund',reason:'Complaint confirmed'});
  assert.equal((await ok('customer','GET','/api/balance')).available,1000000);
  assert.equal((await call('admin','POST',`/api/orders/${order.id}/action`,{action:'refund',reason:'Again'})).statusCode,409);
});

test('auth, CSRF, validation, inactive outlets and insufficient funds',async t=>{
  const {app,ok,call,db,users,material,outlet}=await fixture(t);
  assert.equal((await app.inject({url:'/api/orders'})).statusCode,401);
  assert.equal((await app.inject({method:'POST',url:'/api/auth/login',payload:{}})).statusCode,403);
  assert.equal((await call('other','POST','/api/auth/register',{email:'attacker@example.test',password:'valid-long-password',role:'admin'})).statusCode,400);
  assert.equal((await call('customer','POST','/api/materials/batch',[{title:'No owner'}])).statusCode,400);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  await ok('publisher','POST',`/api/outlets/${outlet.id}/active`,{active:false});
  assert.equal((await call('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]})).statusCode,409);
  await ok('publisher','POST',`/api/outlets/${outlet.id}/active`,{active:true});
  await db.transaction(tx=>transfer(tx,`${users.customer.id}:available`,'external:clearing',999999,'test-withdraw'));
  assert.equal((await call('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]})).statusCode,409);
  assert.equal((await ok('customer','GET','/api/orders')).length,0);
  assert.equal((await ok('customer','GET','/api/balance')).reserved,0);
  assert.equal((await ok('customer','GET','/api/outlets?goal=seo')).length,0);
  await ok('customer','POST','/api/auth/logout',{});
  assert.equal((await call('customer','GET','/api/auth/me')).statusCode,401);
});

test('quote respects discount expiry and unavailable formats',()=>{
  const outlet={prices:{news:85000},coefficient_bps:12000,discount_bps:1000,discount_until:'2026-08-31'};
  assert.equal(quote(outlet,'news','2026-08-31'),91800);
  assert.equal(quote(outlet,'news','2026-09-01'),102000);
  assert.throws(()=>quote(outlet,'post'),/Format unavailable/);
});

test('project creation does not require advertisers',async t=>{
  const {ok,call}=await fixture(t);
  for(const fields of [{},{advertisers:[]}]) {
    const project=await ok('other','POST','/api/projects',{name:'Independent project',...fields});
    assert.deepEqual(project.advertisers,[]);
    assert.ok((await ok('other','GET','/api/projects')).some(p=>p.id===project.id));
  }
  assert.equal((await call('other','POST','/api/projects',{name:'  '})).statusCode,400);
});

test('role-specific login cannot grant another role',async t=>{
  const {call,users}=await fixture(t);
  for(const role of ['customer','publisher','admin']) {
    const login={email:users[role].email,password:'a-valid-test-password',expectedRole:role};
    const result=await call(role,'POST','/api/auth/login',login);
    assert.equal(result.statusCode,200,result.body);
    assert.equal(result.json().role,role);
    const denied=await call(role,'POST','/api/auth/login',{...login,expectedRole:role==='admin'?'publisher':'admin'});
    assert.equal(denied.statusCode,403);
    assert.equal(denied.headers['set-cookie'],undefined);
  }
});
