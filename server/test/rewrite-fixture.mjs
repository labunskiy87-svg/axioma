import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {buildApp,createUser} from '../app.mjs';
import {migrate} from '../db.mjs';
import {transfer} from '../finance.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export async function rewriteFixture(fetchImpl) {
  const pg=new PGlite(),wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
  const db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx)))};
  await migrate(db);
  const user=await db.transaction(tx=>createUser(tx,`${randomUUID()}@example.test`,'rewrite-test-password'));
  const other=await db.transaction(tx=>createUser(tx,`${randomUUID()}@example.test`,'rewrite-test-password'));
  const admin=await db.transaction(tx=>createUser(tx,`${randomUUID()}@example.test`,'rewrite-test-password','admin'));
  await db.transaction(tx=>transfer(tx,'external:clearing',`${user.id}:available`,10000,'rewrite-fixture'));
  const storageRoot=await mkdtemp(join(tmpdir(),'axioma-ai-test-'));
  const app=await buildApp({db,fetchImpl,storageRoot}),origin='http://127.0.0.1:5173';
  const login=async account=>{
    const r=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin},payload:{email:account.email,password:'rewrite-test-password'}});
    return r.headers['set-cookie'].split(';')[0];
  };
  const cookie=await login(user),otherCookie=await login(other),adminCookie=await login(admin);
  await app.inject({method:'PUT',url:'/api/admin/reputation/integrations/openrouter',headers:{cookie:adminCookie,origin},payload:{apiKey:'rewrite-test-openrouter-key',enabled:true,settings:{model:'test-model'}}});
  const request=(body,key=randomUUID(),who=cookie)=>app.inject({method:'POST',url:'/api/materials/ai-rewrite',headers:{origin,cookie:who,'idempotency-key':key},payload:body});
  const balance=async()=>Object.fromEntries((await db.query('SELECT id,balance FROM accounts WHERE id=ANY($1::text[])',[[`${user.id}:available`,`${user.id}:reserved`]])).rows.map(x=>[x.id.split(':')[1],Number(x.balance)]));
  return {db,app,user,cookie,otherCookie,adminCookie,origin,request,balance,storageRoot,close:async()=>{await app.close();await pg.close();await rm(storageRoot,{recursive:true,force:true});}};
}
