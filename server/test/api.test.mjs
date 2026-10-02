import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID,generateKeyPairSync,sign } from 'node:crypto';
import { mkdtemp,rm,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { migrate,database } from '../db.mjs';
import { buildApp,createUser } from '../app.mjs';
import { openRouterChat,testYandexIntegration } from '../reputation.mjs';
import { processNextReputationScan } from '../reputation-worker.mjs';
import {partyMatchesAdvertiser} from '../dadata.mjs';
import { transfer,quote } from '../finance.mjs';
import { reconcileTopupStatement } from '../topups.mjs';
import {TOTP} from 'otpauth';

test('notification read state persists per account and requires authentication',async t=>{
  const {ok,call,material}=await fixture(t);
  const key=`material:${material.id}:pending`;
  assert.deepEqual(await ok('admin','GET','/api/notifications/read'),[]);
  await ok('admin','POST','/api/notifications/read',{key});
  await ok('admin','POST','/api/notifications/read',{key});
  assert.deepEqual(await ok('admin','GET','/api/notifications/read'),[key]);
  assert.deepEqual(await ok('customer','GET','/api/notifications/read'),[]);
  assert.equal((await call('anonymous','GET','/api/notifications/read')).statusCode,401);
  assert.equal((await call('anonymous','POST','/api/notifications/read',{key})).statusCode,401);
  assert.equal((await call('admin','POST','/api/notifications/read',{key:'invalid'})).statusCode,400);
});

test('DaData verifies matching active legal advertisers and preserves manual blocks',async t=>{
  const requests=[];
  const fetchImpl=async(url,options)=>{
    requests.push({url,options});
    const item=url.endsWith('/suggest/address')
      ?{suggestions:[{value:'г Москва, ул Тверская, д 1',unrestricted_value:'125009, г Москва, ул Тверская, д 1'}]}
      :{suggestions:[{value:'ООО Тест',data:{name:{full_with_opf:'ООО Тест'},inn:'7707083893',kpp:'770701001',ogrn:'1027700132195',address:{unrestricted_value:'125009, г Москва, ул Тверская, д 1'},type:'LEGAL',state:{status:'ACTIVE',actuality_date:1790000000000},branch_type:'MAIN'}}]};
    return {ok:true,json:async()=>item};
  };
  const {ok,call,db}=await fixture(t,{fetchImpl,dadataKey:'server-only-test-key'});
  const addresses=await ok('customer','GET','/api/reference/addresses?query=Москва');
  assert.equal(addresses[0].value,'125009, г Москва, ул Тверская, д 1');
  const party=await ok('admin','GET','/api/reference/party?query=7707083893&kpp=770701001');
  assert.deepEqual({inn:party.party.inn,kpp:party.party.kpp,ogrn:party.party.ogrn,status:party.party.status},{inn:'7707083893',kpp:'770701001',ogrn:'1027700132195',status:'ACTIVE'});
  assert.equal(JSON.stringify(party).includes('server-only-test-key'),false);
  assert.equal(requests[0].options.headers.Authorization,'Token server-only-test-key');
  assert.equal((await call('other','GET','/api/reference/party?query=not-an-inn')).statusCode,400);
  assert.equal((await call('other','GET','/api/reference/party?query=7707083893')).statusCode,200);
  assert.equal((await call('customer','GET','/api/reference/party?query=abc')).statusCode,400);
  const details={kind:'legal',kpp:'770701001',ogrn:'1027700132195',address:'125009, г Москва, ул Тверская, д 1'};
  const created=await ok('customer','POST','/api/advertisers',{name:'ООО Тест',inn:'7707083893',details});
  assert.equal(created.verification,'verified');
  assert.equal((await db.query("SELECT count(*)::int AS total FROM advertiser_reviews")).rows[0].total,0);
  assert.equal((await db.query("SELECT count(*)::int AS total FROM audit WHERE entity_id=$1 AND action='advertiser.auto_verify'",[created.id])).rows[0].total,1);
  const mismatched=await ok('customer','PATCH',`/api/advertisers/${created.id}`,{name:'ООО Тест',inn:'7707083893',details:{...details,ogrn:'1027700132196'}});
  assert.equal(mismatched.verification,'pending');
  const checked=await ok('admin','POST',`/api/admin/advertisers/${created.id}/registry-check`,{});
  assert.equal(checked.matched,false);
  assert.equal(checked.verification,'pending');
  const corrected=await ok('customer','PATCH',`/api/advertisers/${created.id}`,{name:'ООО Тест',inn:'7707083893',details});
  assert.equal(corrected.verification,'verified');
  assert.equal((await ok('customer','PATCH',`/api/advertisers/${created.id}`,{name:'ООО Другое',inn:'7707083893',details})).verification,'pending');
  await db.query("UPDATE advertisers SET name='ООО Тест' WHERE id=$1",[created.id]);
  const autoChecked=await ok('admin','POST',`/api/admin/advertisers/${created.id}/registry-check`,{});
  assert.equal(autoChecked.matched,true);
  assert.equal(autoChecked.verification,'verified');
  await ok('admin','POST',`/api/admin/advertisers/${created.id}/review`,{decision:'blocked',evidence:'Ручная блокировка после проверки',note:'Ручная блокировка после проверки'});
  assert.equal((await ok('customer','PATCH',`/api/advertisers/${created.id}`,{name:'ООО Тест',inn:'7707083893',details})).verification,'blocked');
});

test('DaData endpoints require a configured server key and authentication',async t=>{
  const {call}=await fixture(t,{dadataKey:''});
  assert.equal((await call('customer','GET','/api/reference/addresses?query=Москва')).statusCode,503);
  assert.equal((await call('customer','GET','/api/reference/party?query=7707083893')).statusCode,503);
  assert.equal((await call('anonymous','GET','/api/reference/addresses?query=Москва')).statusCode,401);
});

test('legal registry match requires every identifier, address, name and active status',()=>{
  const advertiser={name:'ООО Тест',inn:'7707083893',details:{kind:'legal',kpp:'770701001',ogrn:'1027700132195',address:'125009, г Москва, ул Тверская, д 1'}};
  const party={name:advertiser.name,inn:advertiser.inn,kpp:advertiser.details.kpp,ogrn:advertiser.details.ogrn,address:advertiser.details.address,kind:'legal',status:'ACTIVE'};
  assert.equal(partyMatchesAdvertiser(advertiser,party),true);
  assert.equal(partyMatchesAdvertiser(advertiser,{...party,name:'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТЕСТ"',shortName:'ООО «ТЕСТ»'}),true);
  for(const changed of [{status:'LIQUIDATED'},{kpp:'770701002'},{address:'Другой адрес'},{name:'ООО Другое'},{kind:'entrepreneur'}])assert.equal(partyMatchesAdvertiser(advertiser,{...party,...changed}),false);
  assert.equal(partyMatchesAdvertiser({...advertiser,details:{...advertiser.details,kpp:''}},party),false);
});

test('admin integration key enables DaData without exposing the secret',async t=>{
  const requests=[];
  const fetchImpl=async(url,options)=>{requests.push(options.headers.Authorization);return {ok:true,json:async()=>({suggestions:[]})};};
  const {ok,call}=await fixture(t,{dadataKey:'',fetchImpl});
  assert.equal((await call('customer','GET','/api/reference/addresses?query=Москва')).statusCode,503);
  await ok('admin','PUT','/api/admin/reputation/integrations/dadata',{apiKey:'private-dadata-token',enabled:true,settings:{}});
  const listed=await ok('admin','GET','/api/admin/reputation/integrations');
  const integration=listed.find(item=>item.id==='dadata');
  assert.equal(integration.configured,true);
  assert.equal(JSON.stringify(integration).includes('private-dadata-token'),false);
  await ok('customer','GET','/api/reference/addresses?query=Москва');
  assert.deepEqual(requests,['Token private-dadata-token']);
  await ok('admin','PUT','/api/admin/reputation/integrations/dadata',{clearKey:true,enabled:false,settings:{}});
  assert.equal((await call('customer','GET','/api/reference/addresses?query=Москва')).statusCode,503);
});

test('disabled admin integration overrides an environment fallback key',async t=>{
  const {ok,call}=await fixture(t,{dadataKey:'fallback-env-key',fetchImpl:async()=>({ok:true,json:async()=>({suggestions:[]})})});
  await ok('customer','GET','/api/reference/addresses?query=Москва');
  await ok('admin','PUT','/api/admin/reputation/integrations/dadata',{clearKey:true,enabled:false,settings:{}});
  assert.equal((await call('customer','GET','/api/reference/addresses?query=Москва')).statusCode,503);
});

test('support highlights only open tickets awaiting the current side and keeps ownership boundaries',async t=>{
  const {ok,call}=await fixture(t);
  const ticket=await ok('customer','POST','/api/tickets',{subject:'Reply tracking',body:'Question'});
  const pending=async role=>(await ok(role,'GET','/api/tickets')).find(row=>row.id===ticket.id)?.awaiting_reply;
  const initialMessage=(await ok('admin','GET','/api/tickets')).find(row=>row.id===ticket.id).last_message_id;
  assert.match(initialMessage,/^[0-9a-f-]{36}$/);
  assert.equal(await pending('admin'),true);
  assert.equal(await pending('customer'),false);
  assert.equal(await pending('other'),undefined);
  assert.equal((await call('other','POST',`/api/tickets/${ticket.id}/messages`,{body:'Unauthorized reply'})).statusCode,404);
  await ok('admin','POST',`/api/tickets/${ticket.id}/messages`,{body:'Answer'});
  const answerMessage=(await ok('customer','GET','/api/tickets')).find(row=>row.id===ticket.id).last_message_id;
  assert.notEqual(answerMessage,initialMessage);
  assert.equal(await pending('admin'),false);
  assert.equal(await pending('customer'),true);
  await ok('customer','POST',`/api/tickets/${ticket.id}/messages`,{body:'Follow-up question'});
  assert.notEqual((await ok('admin','GET','/api/tickets')).find(row=>row.id===ticket.id).last_message_id,answerMessage);
  assert.equal(await pending('admin'),true);
  assert.equal(await pending('customer'),false);
  await ok('admin','PATCH',`/api/tickets/${ticket.id}`,{status:'closed'});
  assert.equal(await pending('admin'),false);
  assert.equal(await pending('customer'),false);
  await ok('admin','PATCH',`/api/tickets/${ticket.id}`,{status:'open'});
  assert.equal(await pending('admin'),true);
  const publisherTicket=await ok('publisher','POST','/api/tickets',{subject:'Publisher question',body:'Help'});
  assert.equal((await ok('admin','GET','/api/tickets')).find(row=>row.id===publisherTicket.id).awaiting_reply,true);
  assert.equal((await ok('customer','GET','/api/tickets')).some(row=>row.id===publisherTicket.id),false);
  await ok('admin','POST',`/api/tickets/${publisherTicket.id}/messages`,{body:'Publisher answer'});
  assert.equal((await ok('publisher','GET','/api/tickets')).find(row=>row.id===publisherTicket.id).awaiting_reply,true);
});

test('dispute reply highlights respect the selected evidence recipient and resolved state',async t=>{
  const {ok,material,outlet}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/publication',markingConfirmed:true});
  await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'dispute',reason:'Please check placement'});
  const pending=async role=>(await ok(role,'GET','/api/orders')).find(row=>row.id===order.id)?.awaiting_reply;
  assert.equal(await pending('admin'),true);
  assert.equal(await pending('customer'),false);
  assert.equal(await pending('publisher'),false);
  await ok('admin','POST',`/api/admin/orders/${order.id}/evidence-request`,{recipient:'customer'});
  assert.equal(await pending('admin'),false);
  assert.equal(await pending('customer'),true);
  assert.equal(await pending('publisher'),false);
  await ok('customer','POST',`/api/orders/${order.id}/messages`,{body:'Additional evidence'});
  assert.equal(await pending('admin'),true);
  assert.equal(await pending('customer'),false);
  await ok('admin','POST',`/api/admin/orders/${order.id}/evidence-request`,{recipient:'publisher'});
  assert.equal(await pending('publisher'),true);
  assert.equal(await pending('customer'),false);
  await ok('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'no_sanctions',reason:'The placement meets requirements'});
  for(const role of ['admin','customer','publisher'])assert.equal(await pending(role),false);
});

test('publisher application deletion preserves audit and invalidates invitations',async t=>{
  const {db,ok,call,users}=await fixture(t);
  const application=await ok('admin','POST','/api/admin/publisher-applications',{email:`delete-${randomUUID()}@example.test`,platform:'Deleted outlet',legalName:'Publisher LLC'});
  await ok('admin','PATCH',`/api/admin/publisher-applications/${application.id}`,{status:'Одобрена',checks:{resource:true,legal:true,representative:true,duplicate:true}});
  const invite=await ok('admin','POST',`/api/admin/publisher-applications/${application.id}/invite`,{});
  assert.equal((await call('customer','DELETE',`/api/admin/publisher-applications/${application.id}`)).statusCode,403);
  await ok('admin','DELETE',`/api/admin/publisher-applications/${application.id}`);
  assert.ok(!(await ok('admin','GET','/api/admin/publisher-applications')).some(row=>row.id===application.id));
  assert.ok((await db.query('SELECT deleted_at FROM publisher_applications WHERE id=$1',[application.id])).rows[0].deleted_at);
  assert.equal((await call('other','GET',`/api/team/invitation/${invite.token}`)).statusCode,404);
  assert.equal((await call('other','POST','/api/team/accept',{token:invite.token,password:'deleted-invite-password'})).statusCode,404);
  assert.equal((await call('admin','PATCH',`/api/admin/publisher-applications/${application.id}`,{status:'Новая'})).statusCode,404);
  assert.equal((await call('admin','DELETE',`/api/admin/publisher-applications/${application.id}`)).statusCode,404);
  assert.equal((await db.query("SELECT * FROM audit WHERE action='publisher.application.delete' AND entity_id=$1",[application.id])).rows.length,1);
  const linked=await ok('admin','POST','/api/admin/publisher-applications',{email:`linked-${randomUUID()}@example.test`,platform:'Linked outlet',legalName:'Publisher LLC'});
  await db.query('UPDATE publisher_applications SET publisher_user_id=$2 WHERE id=$1',[linked.id,users.publisher.id]);
  await ok('admin','DELETE',`/api/admin/publisher-applications/${linked.id}`);
  assert.equal((await ok('publisher','GET','/api/auth/me')).id,users.publisher.id);
  assert.equal((await db.query('SELECT publisher_user_id FROM publisher_applications WHERE id=$1',[linked.id])).rows[0].publisher_user_id,users.publisher.id);
});

test('only primary administrator can invite or revoke administrative access',async t=>{
  const {db,app,ok,call,users}=await fixture(t);
  assert.equal((await call('admin','POST','/api/team/invitations',{email:'new-admin@example.test',teamRole:'admin'})).statusCode,403);
  await db.query('UPDATE users SET is_primary_admin=true WHERE id=$1',[users.admin.id]);
  assert.equal((await ok('admin','GET','/api/auth/me')).isPrimaryAdmin,true);
  const invite=await ok('admin','POST','/api/team/invitations',{email:`admin-${randomUUID()}@example.test`,teamRole:'admin'});
  await ok('other','POST','/api/team/accept',{token:invite.token,password:'another-admin-password'});
  const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:invite.email,password:'another-admin-password'}});
  assert.equal(login.statusCode,200,login.body);
  const cookie=login.headers['set-cookie'].split(';')[0];
  const adminCall=(method,url,payload)=>app.inject({method,url,payload,headers:{cookie,origin:'http://127.0.0.1:5173'}});
  assert.equal((await adminCall('GET','/api/team')).statusCode,403);
  assert.equal((await adminCall('POST','/api/team/invitations',{email:'unauthorized@example.test',teamRole:'admin'})).statusCode,403);
  assert.equal((await adminCall('PATCH',`/api/admin/users/${users.admin.id}/access`,{blocked:true})).statusCode,400);
  const independent=await db.transaction(tx=>createUser(tx,`independent-${randomUUID()}@example.test`,'independent-admin-password','admin'));
  assert.equal((await adminCall('PATCH',`/api/admin/users/${independent.id}/access`,{blocked:true})).statusCode,403);
  await ok('admin','PATCH',`/api/team/members/${login.json().id}`,{teamRole:null});
  assert.equal((await adminCall('GET','/api/auth/me')).statusCode,401);
  assert.ok((await db.query('SELECT id FROM users WHERE id=$1',[login.json().id])).rows.length);
});

test('primary administrator assigns moderator and superadmin roles with server-side permissions',async t=>{
  const {db,app,ok,call,users,material,outlet}=await fixture(t);
  await db.query('UPDATE users SET is_primary_admin=true WHERE id=$1',[users.admin.id]);
  const login=async invite=>{
    await ok('other','POST','/api/team/accept',{token:invite.token,password:'new-admin-password'});
    const response=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:invite.email,password:'new-admin-password'}});
    assert.equal(response.statusCode,200,response.body);
    const cookie=response.headers['set-cookie'].split(';')[0];
    return (method,url,payload)=>app.inject({method,url,payload,headers:{origin:'http://127.0.0.1:5173',cookie}});
  };
  const moderatorInvite=await ok('admin','POST','/api/team/invitations',{email:`moderator-${randomUUID()}@example.test`,teamRole:'moderator'});
  const moderator=await login(moderatorInvite);
  assert.equal((await moderator('GET','/api/auth/me')).json().teamRole,'moderator');
  assert.equal((await moderator('GET','/api/materials')).statusCode,200);
  assert.equal((await moderator('GET','/api/outlets')).statusCode,200);
  assert.equal((await moderator('GET','/api/admin/advertisers')).statusCode,200);
  assert.equal((await moderator('GET','/api/orders')).statusCode,403);
  assert.equal((await moderator('GET','/api/admin/users')).statusCode,403);
  assert.equal((await moderator('GET','/api/admin/ledger')).statusCode,403);
  assert.equal((await moderator('GET','/api/team')).statusCode,403);
  assert.equal((await moderator('POST','/api/team/invitations',{email:'denied@example.test',teamRole:'superadmin'})).statusCode,403);
  assert.equal((await moderator('POST',`/api/admin/outlets/${outlet.id}`,{approved:false})).statusCode,200);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  assert.equal((await moderator('POST',`/api/moderation/${material.id}`,{approved:true})).statusCode,200);
  const superInvite=await ok('admin','POST','/api/team/invitations',{email:`super-${randomUUID()}@example.test`,teamRole:'superadmin'});
  const superadmin=await login(superInvite);
  assert.equal((await superadmin('GET','/api/auth/me')).json().teamRole,'superadmin');
  assert.equal((await superadmin('GET','/api/admin/users')).statusCode,200);
  assert.equal((await superadmin('GET','/api/admin/ledger')).statusCode,200);
  assert.equal((await superadmin('POST','/api/team/invitations',{email:'denied-super@example.test',teamRole:'admin'})).statusCode,403);
  assert.equal((await call('customer','POST','/api/team/invitations',{email:'denied-customer@example.test',teamRole:'superadmin'})).statusCode,400);
});

test('personal commission is role-specific, audited and fixed on invoices and orders',async t=>{
  const sellerConfig={name:'ООО Аксиома',inn:'7700000000',address:'Москва',bank:'Тестовый банк',bic:'044525225',account:'40702810000000000001'};
  const {db,ok,call,users,material,outlet}=await fixture(t,{sellerConfig});
  assert.equal((await call('customer','PATCH',`/api/admin/users/${users.customer.id}/commission`,{commissionBps:700})).statusCode,403);
  assert.equal((await call('admin','PATCH',`/api/admin/users/${users.admin.id}/commission`,{commissionBps:700})).statusCode,400);
  assert.equal((await call('admin','PATCH',`/api/admin/users/${users.customer.id}/commission`,{commissionBps:10001})).statusCode,400);
  await db.query(`INSERT INTO account_settings(user_id,profile,requisites,requisites_status) VALUES($1,$2,$3,'verified')`,[users.customer.id,JSON.stringify({company:'ООО Клиент'}),JSON.stringify({payerStatus:'Юридическое лицо',inn:'7800000000',legalAddress:'Санкт-Петербург'})]);
  const originalInvoice=await ok('customer','POST','/api/topups',{amount:100000,method:'transfer'});
  assert.equal(originalInvoice.feeAmount,15000);
  await ok('admin','PATCH',`/api/admin/users/${users.customer.id}/commission`,{commissionBps:700});
  assert.equal((await ok('customer','GET','/api/settings/commission')).commissionBps,700);
  const customInvoice=await ok('customer','POST','/api/topups',{amount:100000,method:'transfer'});
  assert.equal(customInvoice.feeAmount,7000);
  assert.equal(customInvoice.commissionBps,700);
  assert.equal((await ok('customer','GET','/api/topups')).find(row=>row.id===originalInvoice.id).feeAmount,15000);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [originalOrder]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  assert.equal(originalOrder.snapshot.commissionBps,1500);
  await ok('admin','PATCH',`/api/admin/users/${users.publisher.id}/commission`,{commissionBps:1000});
  assert.equal((await ok('publisher','GET','/api/settings/commission')).commissionBps,1000);
  const [secondMaterial]=await ok('customer','POST','/api/materials/batch',[{advertiserId:material.advertiser_id,title:'Second news',body:'Second publication',format:'news'}]);
  await ok('customer','POST','/api/materials/submit',{ids:[secondMaterial.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${secondMaterial.id}`,{approved:true});
  const [customOrder]=await ok('customer','POST','/api/orders',{materialId:secondMaterial.id,outletIds:[outlet.id]});
  assert.equal(customOrder.snapshot.commissionBps,1000);
  assert.equal(Number(customOrder.payout),Number(customOrder.amount)-Math.round(Number(customOrder.amount)*0.1));
  assert.equal((await db.query('SELECT snapshot FROM orders WHERE id=$1',[originalOrder.id])).rows[0].snapshot.commissionBps,1500);
  await ok('admin','PATCH',`/api/admin/users/${users.publisher.id}/commission`,{commissionBps:null});
  assert.equal((await ok('publisher','GET','/api/settings/commission')).commissionBps,1500);
  assert.equal((await db.query("SELECT count(*)::int AS count FROM audit WHERE action='user.commission.change'")).rows[0].count,3);
});

test('two factor login requires a real code and rejects reused OTP and backup codes',async t=>{
  const {db,app,ok,call,users}=await fixture(t);
  const setup=await ok('admin','POST','/api/auth/two-factor/setup',{password:'a-valid-test-password'});
  assert.match(setup.qr,/^data:image\/png;base64,/);
  const stored=(await db.query('SELECT pending_secret FROM user_two_factor WHERE user_id=$1',[users.admin.id])).rows[0];
  assert.ok(!stored.pending_secret.includes(setup.secret));
  const instance=new TOTP({secret:setup.secret});
  const invalidCode=Array.from({length:10},(_,i)=>String(i).padStart(6,'0')).find(token=>instance.validate({token,window:1})===null);
  assert.equal((await call('admin','POST','/api/auth/two-factor/enable',{code:invalidCode})).statusCode,400);
  const enabled=await ok('admin','POST','/api/auth/two-factor/enable',{code:instance.generate()});
  assert.equal(enabled.backupCodes.length,10);
  const login=otp=>app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:users.admin.email,password:'a-valid-test-password',...(otp?{otp}:{})}});
  const challenge=await login();assert.equal(challenge.json().requiresTwoFactor,true);assert.equal(challenge.headers['set-cookie'],undefined);
  const backup=await login(enabled.backupCodes[0]);assert.equal(backup.statusCode,200,backup.body);
  assert.equal((await login(enabled.backupCodes[0])).statusCode,401);
  const code=instance.generate({timestamp:Date.now()+30000});
  assert.equal((await login(code)).statusCode,200);
  assert.equal((await login(code)).statusCode,401);
  assert.equal((await call('admin','POST','/api/auth/two-factor/disable',{password:'wrong-password',code:enabled.backupCodes[1]})).statusCode,400);
  await ok('admin','POST','/api/auth/two-factor/disable',{password:'a-valid-test-password',code:enabled.backupCodes[1]});
  assert.equal((await ok('admin','GET','/api/auth/two-factor')).enabled,false);
  assert.equal((await db.query("SELECT * FROM audit WHERE actor_id=$1 AND action IN ('auth.two_factor.enable','auth.two_factor.disable')",[users.admin.id])).rows.length,2);
});

// The same suite runs against PostgreSQL in CI. Embedded Postgres is a local fallback.
async function fixture(t,{fetchImpl,sellerConfig,tochkaConfig,dadataKey}={}) {
  let db;
  let closeDb;
  if(process.env.TEST_DATABASE_URL) {
    const schema=`test_${randomUUID().replaceAll('-','')}`;
    const adminDb=database(process.env.TEST_DATABASE_URL);
    await adminDb.query(`CREATE SCHEMA ${schema}`);
    db=database(process.env.TEST_DATABASE_URL,{schema});
    closeDb=async()=>{
      await db.close();
      await adminDb.query(`DROP SCHEMA ${schema} CASCADE`);
      await adminDb.close();
    };
  } else {
    const pg=new PGlite();
    const wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
    db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx))),close:()=>pg.close()};
    closeDb=()=>db.close();
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
  const app=await buildApp({db,storageRoot,...(fetchImpl?{fetchImpl}:{}),dadataKey,sellerConfig,tochkaConfig});
  t.after(async()=>{await app.close();await closeDb();await rm(storageRoot,{recursive:true,force:true});});
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
  return {db,app,cookies,users,call,ok,material,outlet,input,storageRoot};
}

test('advertiser detail is owner-scoped and reflects saved edits without claiming verification',async t=>{
  const {ok,call,material,outlet}=await fixture(t);
  const advertiser=await ok('customer','POST','/api/advertisers',{name:'Первое название',inn:'7800000000',details:{address:'Москва'}});
  assert.equal((await ok('customer','GET',`/api/advertisers/${advertiser.id}`)).name,'Первое название');
  assert.equal((await call('other','GET',`/api/advertisers/${advertiser.id}`)).statusCode,404);
  assert.equal((await call('publisher','GET',`/api/advertisers/${advertiser.id}`)).statusCode,403);
  assert.equal((await call('customer','GET',`/api/advertisers/${randomUUID()}`)).statusCode,404);
  const updated=await ok('customer','PATCH',`/api/advertisers/${advertiser.id}`,{name:'Новое название',inn:'7800000000',details:{address:'Санкт-Петербург'}});
  assert.equal(updated.verification,'pending');
  const detail=await ok('customer','GET',`/api/advertisers/${advertiser.id}`);
  assert.equal(detail.name,'Новое название');
  assert.equal(detail.details.address,'Санкт-Петербург');
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  assert.equal(order.snapshot.advertiser.id,material.advertiser_id);
});

test('account profile, team invitations and staff permissions persist across sessions',async t=>{
  const {app,db,ok,call,users,material}=await fixture(t);
  await ok('customer','PUT','/api/settings/account/profile',{company:'Customer LLC'});
  assert.equal((await ok('customer','GET','/api/settings/account')).profile.company,'Customer LLC');
  assert.deepEqual((await ok('other','GET','/api/settings/account')).profile,{});
  const email=`staff-${randomUUID()}@example.test`;
  const invitation=await ok('customer','POST','/api/team/invitations',{email,teamRole:'content'});
  const invitationInfo=await ok('other','GET',`/api/team/invitation/${invitation.token}`);
  assert.equal(invitationInfo.email,email);
  await ok('other','POST','/api/team/accept',{token:invitation.token,password:'staff-valid-password'});
  assert.equal((await call('other','POST','/api/team/accept',{token:invitation.token,password:'staff-valid-password'})).statusCode,404);
  const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email,password:'staff-valid-password'}});
  assert.equal(login.statusCode,200,login.body);
  const cookie=login.headers['set-cookie'].split(';')[0];
  const staff=(method,url,payload)=>app.inject({method,url,payload,headers:{cookie,origin:'http://127.0.0.1:5173'}});
  assert.equal((await staff('GET','/api/auth/me')).json().accountOwnerId,users.customer.id);
  assert.ok((await staff('GET','/api/materials')).json().some(row=>row.id===material.id));
  const created=await staff('POST','/api/projects',{name:'Staff project'});
  assert.equal(created.statusCode,200,created.body);
  const actor=(await db.query("SELECT actor_id FROM audit WHERE action='project.create' AND entity_id=$1",[created.json().id])).rows[0];
  assert.equal(actor.actor_id,login.json().id);
  assert.equal((await staff('POST','/api/orders',{materialId:material.id,outletIds:[]})).statusCode,403);
  assert.equal((await staff('PUT','/api/settings/account/requisites',{inn:'7700000000'})).statusCode,403);
  assert.equal((await staff('GET','/api/auth/sessions')).json().length,1);
  assert.equal((await staff('POST','/api/auth/password',{currentPassword:'staff-valid-password',newPassword:'staff-new-password'})).statusCode,200);
  const oldPassword=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email,password:'staff-valid-password'}});
  assert.equal(oldPassword.statusCode,401);
  assert.equal((await call('customer','GET','/api/auth/me')).statusCode,200);
  const member=(await ok('customer','GET','/api/team')).members.find(row=>row.email===email);
  assert.equal(member.team_role,'content');
  await ok('customer','PATCH',`/api/team/members/${member.id}`,{teamRole:null});
  assert.equal((await staff('GET','/api/auth/me')).statusCode,401);
  assert.equal((await db.query('SELECT blocked_at FROM users WHERE id=$1',[member.id])).rows[0].blocked_at!==null,true);
});

test('publisher applications require review before invite and admin can revoke account access',async t=>{
  const {db,app,ok,call,users}=await fixture(t);
  await db.query('UPDATE users SET is_primary_admin=true WHERE id=$1',[users.admin.id]);
  const email=`publisher-${randomUUID()}@example.test`;
  const data={applicant:'Editor',email,platform:'Newsroom',legalName:'Newsroom LLC'};
  const submitted=await ok('other','POST','/api/publisher-applications',data);
  assert.equal((await call('other','GET','/api/admin/publisher-applications')).statusCode,403);
  assert.equal((await call('admin','POST',`/api/admin/publisher-applications/${submitted.id}/invite`,{})).statusCode,409);
  const checks={resource:true,legal:true,representative:true,duplicate:true};
  const reviewed=await ok('admin','PATCH',`/api/admin/publisher-applications/${submitted.id}`,{checks,status:'Одобрена'});
  assert.equal(reviewed.status,'Одобрена');
  const invite=await ok('admin','POST',`/api/admin/publisher-applications/${submitted.id}/invite`,{});
  assert.equal((await ok('other','GET',`/api/team/invitation/${invite.token}`)).role,'publisher');
  await ok('other','POST','/api/team/accept',{token:invite.token,password:'publisher-valid-password'});
  const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email,password:'publisher-valid-password'}});
  assert.equal(login.statusCode,200,login.body);
  const cookie=login.headers['set-cookie'].split(';')[0];
  assert.equal((await app.inject({method:'GET',url:'/api/auth/me',headers:{cookie}})).statusCode,200);
  await ok('admin','PATCH',`/api/admin/users/${users.other.id}/access`,{blocked:true});
  assert.equal((await call('other','GET','/api/auth/me')).statusCode,401);
  assert.equal((await call('admin','PATCH',`/api/admin/users/${users.admin.id}/access`,{blocked:true})).statusCode,400);
  const staffEmail=`admin-staff-${randomUUID()}@example.test`;
  const teamInvite=await ok('admin','POST','/api/team/invitations',{email:staffEmail,teamRole:'admin'});
  await ok('other','POST','/api/team/accept',{token:teamInvite.token,password:'admin-staff-password'});
  const staffLogin=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:staffEmail,password:'admin-staff-password'}});
  assert.equal(staffLogin.statusCode,200,staffLogin.body);
  const staffCookie=staffLogin.headers['set-cookie'].split(';')[0];
  const blockOwner=await app.inject({method:'PATCH',url:`/api/admin/users/${users.admin.id}/access`,payload:{blocked:true},headers:{origin:'http://127.0.0.1:5173',cookie:staffCookie}});
  assert.equal(blockOwner.statusCode,400,blockOwner.body);
});

test('approved application can be rejected before account creation and invalidates its invite',async t=>{
  const {ok,call}=await fixture(t);
  const submitted=await ok('other','POST','/api/publisher-applications',{
    applicant:'Editor',email:`publisher-${randomUUID()}@example.test`,platform:'Newsroom',legalName:'Newsroom LLC',
  });
  const path=`/api/admin/publisher-applications/${submitted.id}`;
  await ok('admin','PATCH',path,{checks:{resource:true,legal:true,representative:true,duplicate:true},status:'Одобрена'});
  const invite=await ok('admin','POST',`${path}/invite`,{});
  const rejected=await ok('admin','PATCH',path,{status:'Отклонена',decisionComment:'Адрес почты уже используется'});
  assert.equal(rejected.status,'Отклонена');
  assert.equal(rejected.accountStatus,'Не создан');
  assert.equal((await call('other','GET',`/api/team/invitation/${invite.token}`)).statusCode,404);
  assert.equal((await call('admin','POST',`${path}/invite`,{})).statusCode,409);
});

test('activity records reads and failed sign-in without exposing it to another user',async t=>{
  const {app,ok,call,users}=await fixture(t);
  await ok('customer','GET','/api/projects');
  const failed=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:users.customer.email,password:'incorrect-password'}});
  assert.equal(failed.statusCode,401);
  assert.equal((await call('customer','GET',`/api/admin/users/${users.customer.id}/activity`)).statusCode,403);
  const activity=await ok('admin','GET',`/api/admin/users/${users.customer.id}/activity`);
  assert.ok(activity.some(row=>row.path==='/api/projects'&&row.method==='GET'&&row.status_code===200));
  assert.ok(activity.some(row=>row.path==='/api/auth/login'&&row.status_code===401&&row.actor_id===null));
  assert.ok(activity.every(row=>!JSON.stringify(row).includes('incorrect-password')));
});

test('requisites review is admin-only and resubmission reopens verification',async t=>{
  const {ok,call,users}=await fixture(t);
  await ok('publisher','PUT','/api/settings/account/requisites',{legalName:'Publisher LLC',inn:'7700000000'});
  assert.equal((await ok('publisher','GET','/api/settings/account')).requisites_status,'pending');
  assert.equal((await call('customer','GET',`/api/admin/users/${users.publisher.id}/account`)).statusCode,403);
  assert.equal((await call('customer','PATCH',`/api/admin/users/${users.publisher.id}/requisites`,{status:'verified'})).statusCode,403);
  const account=await ok('admin','GET',`/api/admin/users/${users.publisher.id}/account`);
  assert.equal(account.requisites.inn,'7700000000');
  assert.equal((await call('admin','PATCH',`/api/admin/users/${users.publisher.id}/requisites`,{status:'rejected'})).statusCode,400);
  await ok('admin','PATCH',`/api/admin/users/${users.publisher.id}/requisites`,{status:'rejected',comment:'Уточните ИНН'});
  assert.equal((await ok('publisher','GET','/api/settings/account')).requisites_review_comment,'Уточните ИНН');
  assert.equal((await call('admin','PATCH',`/api/admin/users/${users.publisher.id}/requisites`,{status:'verified'})).statusCode,409);
  await ok('publisher','PUT','/api/settings/account/requisites',{legalName:'Publisher LLC',inn:'7700000001'});
  assert.equal((await ok('publisher','GET','/api/settings/account')).requisites_review_comment,'');
  await ok('admin','PATCH',`/api/admin/users/${users.publisher.id}/requisites`,{status:'verified'});
  assert.equal((await ok('publisher','GET','/api/settings/account')).requisites_status,'verified');
});

test('favorites, limits, project changes and account security persist and enforce ownership',async t=>{
  const {ok,call,app,users,cookies,material,outlet}=await fixture(t);
  assert.deepEqual(await ok('customer','GET','/api/favorites'),[]);
  await ok('customer','PUT',`/api/favorites/${outlet.id}`,{favorite:true});
  await ok('customer','PUT',`/api/favorites/${outlet.id}`,{favorite:true});
  assert.deepEqual(await ok('customer','GET','/api/favorites'),[outlet.id]);
  assert.deepEqual(await ok('other','GET','/api/favorites'),[]);
  assert.equal((await call('publisher','PUT',`/api/favorites/${outlet.id}`,{favorite:true})).statusCode,403);
  await ok('customer','PUT',`/api/favorites/${outlet.id}`,{favorite:false});
  assert.deepEqual(await ok('customer','GET','/api/favorites'),[]);
  await ok('customer','PUT','/api/settings/limits',{orderLimit:10000,autoAccept:false});
  assert.equal((await ok('customer','GET','/api/settings/limits')).orderLimit,10000);
  assert.equal((await ok('other','GET','/api/settings/limits')).orderLimit,null);
  assert.equal((await call('customer','PUT','/api/settings/limits',{orderLimit:10000,autoAccept:true})).statusCode,400);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const before=await ok('customer','GET','/api/balance');
  const payload={materialId:material.id,outletIds:[outlet.id],autoAccept:true};
  assert.equal((await call('customer','POST','/api/orders',payload)).statusCode,409);
  assert.deepEqual(await ok('customer','GET','/api/balance'),before);
  const [order]=await ok('customer','POST','/api/orders',{...payload,limitConfirmed:true});
  const transactionsCsv=await call('customer','GET','/api/transactions/export.csv');
  assert.equal(transactionsCsv.statusCode,200,transactionsCsv.body);
  assert.match(transactionsCsv.headers['content-type'],/text\/csv/);
  assert.match(transactionsCsv.body,new RegExp(`order:${order.id}:reserve`));
  const otherTransactionsCsv=await call('other','GET','/api/transactions/export.csv');
  assert.doesNotMatch(otherTransactionsCsv.body,new RegExp(order.id));
  const project=await ok('customer','POST','/api/projects',{name:'Order project'});
  await ok('customer','POST',`/api/orders/${order.id}/project`,{projectId:project.id});
  assert.equal((await ok('customer','GET','/api/orders')).find(o=>o.id===order.id).project_id,project.id);
  assert.equal((await call('other','POST',`/api/orders/${order.id}/project`,{projectId:null})).statusCode,404);
  const extra=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:users.customer.email,password:'a-valid-test-password'}});
  const extraCookie=extra.headers['set-cookie'].split(';')[0];
  assert.equal((await call('customer','POST','/api/auth/password',{currentPassword:'wrong',newPassword:'a-new-test-password'})).statusCode,400);
  assert.equal((await call('customer','POST','/api/auth/password',{currentPassword:'a-valid-test-password',newPassword:'x'.repeat(129)})).statusCode,400);
  await ok('customer','POST','/api/auth/password',{currentPassword:'a-valid-test-password',newPassword:'a-new-test-password'});
  assert.equal((await app.inject({method:'GET',url:'/api/auth/me',headers:{cookie:extraCookie}})).statusCode,401);
  assert.equal((await ok('customer','GET','/api/auth/sessions')).length,1);
  const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:users.customer.email,password:'a-new-test-password'}});
  assert.equal(login.statusCode,200);
  await ok('customer','POST','/api/auth/sessions/revoke-others',{});
  assert.equal((await app.inject({method:'GET',url:'/api/auth/me',headers:{cookie:login.headers['set-cookie'].split(';')[0]}})).statusCode,401);
  assert.equal((await call('customer','GET','/api/auth/me')).statusCode,200);
});

test('administration, persistent conversations and informers enforce role boundaries',async t=>{
 const {ok,call,material,outlet,users}=await fixture(t);
 const listed=await ok('admin','GET','/api/admin/users');
 assert.equal(Number(listed.find(u=>u.id===users.customer.id).available),1000000);
 const customerOverview=await ok('admin','GET',`/api/admin/users/${users.customer.id}/overview`);
 assert.equal(customerOverview.role,'customer');
 assert.equal(customerOverview.email,users.customer.email);
 assert.ok(customerOverview.advertisers.every(item=>item.inn));
 assert.equal(customerOverview.outlets.length,0);
 const publisherOverview=await ok('admin','GET',`/api/admin/users/${users.publisher.id}/overview`);
 assert.equal(publisherOverview.role,'publisher');
 assert.ok(publisherOverview.outlets.some(item=>item.id===outlet.id));
 assert.equal(publisherOverview.advertisers.length,0);
 assert.equal((await call('customer','GET',`/api/admin/users/${users.customer.id}/overview`)).statusCode,403);
 assert.equal((await call('admin','GET',`/api/admin/users/${randomUUID()}/overview`)).statusCode,404);
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
 const auditRows=await ok('admin','GET','/api/admin/audit');
 assert.ok(auditRows.some(a=>a.action==='order.message'&&a.entity_label===`Заказ №${order.number}`));
 assert.ok(auditRows.every(a=>!a.action.startsWith('request.')));
 const byEmail=await ok('admin','GET',`/api/admin/audit?q=${encodeURIComponent(users.customer.email)}`);
 assert.ok(byEmail.some(a=>a.action==='order.message'));
 assert.ok(byEmail.every(a=>a.email===users.customer.email||a.entity_label?.includes(users.customer.email)));
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

test('materials have numeric public numbers and formatted content is sanitized',async t=>{
  const {ok,input,material}=await fixture(t);
  assert.ok(Number.isInteger(material.number) && material.number>=1001);
  const [formatted]=await ok('customer','POST','/api/materials/batch',[{...input,title:'Formatted',body:'<h1>Heading</h1><p><span style="font-size:10px"><strong>Safe</strong></span><script>alert(1)</script></p>'}]);
  assert.ok(Number.isInteger(formatted.number));
  assert.match(formatted.body,/<h1>Heading<\/h1>/);
  assert.match(formatted.body,/<strong>Safe<\/strong>/);
  assert.match(formatted.body,/font-size:10px/);
  assert.doesNotMatch(formatted.body,/<script/i);
  assert.equal((await ok('admin','GET','/api/materials')).find(row=>row.id===formatted.id).number,formatted.number);
});

test('materials can be submitted without an advertiser',async t=>{
  const {ok,call}=await fixture(t);
  const [material]=await ok('customer','POST','/api/materials/batch',[{advertiserId:null,title:'Independent editorial material',body:'No advertiser is required for moderation',format:'article'}]);
  assert.equal(material.advertiser_id,null);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  assert.equal((await ok('admin','GET','/api/moderation')).find(row=>row.id===material.id).advertiser_id,null);
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  assert.equal((await call('customer','PUT',`/api/materials/${material.id}`,{advertiserId:'not-an-id',title:'Bad',body:'Bad',format:'article',version:1})).statusCode,400);
});

test('orders use the format selected on the outlet card, not the material type',async t=>{
  const {ok,material,outlet}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,placements:[{outletId:outlet.id,format:'article'}],expectedAmount:135000});
  assert.equal(order.amount,135000);
  assert.equal(order.snapshot.format,'article');
  assert.equal(order.snapshot.autoAccept,false);
});

test('optional advertiser marking fields are copied into new orders without blocking empty cards',async t=>{
  const {ok,material,outlet}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [first]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  assert.deepEqual(first.snapshot.advertiser.details,{});
  const advertiser=(await ok('customer','GET','/api/advertisers'))[0];
  await ok('customer','PATCH',`/api/advertisers/${advertiser.id}`,{
    name:advertiser.name,inn:advertiser.inn,
    details:{advertisedObject:'Test product',contractType:'intermediary',contractNumber:'A-1',contractDate:'2026-09-01',executorName:'Test agency',executorInn:'7711111111'},
  });
  const otherOutlet=await ok('publisher','POST','/api/outlets',{name:'Second outlet',url:'https://second.example.test',kind:'media',geography:'federal',details:{goals:['pr']},prices:{news:85000}});
  await ok('admin','POST',`/api/admin/outlets/${otherOutlet.id}`,{approved:true});
  const [second]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[otherOutlet.id]});
  assert.equal(second.snapshot.advertiser.details.advertisedObject,'Test product');
  assert.equal(second.snapshot.advertiser.details.executorInn,'7711111111');
  assert.deepEqual(first.snapshot.advertiser.details,{});
  assert.equal((await ok('publisher','GET','/api/orders')).find(order=>order.id===second.id).snapshot.advertiser.details.contractNumber,'A-1');
});

test('publisher payout request reserves funds and admin review is audited and access-controlled',async t=>{
  const {db,ok,call,users}=await fixture(t);
  await db.transaction(tx=>transfer(tx,'external:clearing',`${users.publisher.id}:available`,100000,'test:payout-balance'));
  assert.equal((await call('publisher','POST','/api/payouts',{amount:40000})).statusCode,409);
  const details={payeeStatus:'Юридическое лицо',recipient:'Test publisher',inn:'7700000000',account:'40702810000000000000',bik:'044525000'};
  await ok('publisher','PUT','/api/settings/account/requisites',details);
  await ok('admin','PATCH',`/api/admin/users/${users.publisher.id}/requisites`,{status:'verified'});
  assert.equal((await call('customer','GET','/api/payouts')).statusCode,403);
  const key=randomUUID();
  const request=await ok('publisher','POST','/api/payouts',{amount:40000},key);
  assert.deepEqual(await ok('publisher','POST','/api/payouts',{amount:40000},key),request);
  assert.equal((await ok('publisher','GET','/api/balance')).available,60000);
  assert.equal((await ok('publisher','GET','/api/balance')).reserved,40000);
  assert.equal((await call('publisher','POST','/api/payouts',{amount:70000})).statusCode,409);
  assert.equal((await call('customer','POST',`/api/admin/payouts/${request.id}/decision`,{decision:'approved'})).statusCode,403);
  assert.equal((await call('admin','POST',`/api/admin/payouts/${request.id}/decision`,{decision:'rejected'})).statusCode,400);
  await ok('admin','POST',`/api/admin/payouts/${request.id}/decision`,{decision:'returned',comment:'Уточните счет'});
  assert.equal((await ok('publisher','GET','/api/balance')).available,100000);
  assert.equal((await ok('publisher','GET','/api/balance')).reserved,0);
  assert.equal((await call('admin','POST',`/api/admin/payouts/${request.id}/decision`,{decision:'approved'})).statusCode,409);
  const second=await ok('publisher','POST','/api/payouts',{amount:50000});
  await ok('admin','POST',`/api/admin/payouts/${second.id}/decision`,{decision:'approved'});
  assert.equal((await ok('publisher','GET','/api/balance')).reserved,50000);
  assert.equal((await ok('admin','GET','/api/admin/payouts')).find(item=>item.id===second.id).requisites.account,details.account);
  const exportResult=await call('admin','GET','/api/admin/payouts/export.csv');
  assert.equal(exportResult.statusCode,200);
  assert.match(exportResult.body,new RegExp(`W-${second.number}`));
  assert.equal((await call('publisher','GET','/api/admin/payouts/export.csv')).statusCode,403);
  assert.equal((await db.query("SELECT count(*)::int AS count FROM audit WHERE action='payout.review'")).rows[0].count,2);
});

test('balance adjustments require a second administrator and post exactly one ledger transfer',async t=>{
  const {db,app,ok,call,users}=await fixture(t);
  const second=await db.transaction(tx=>createUser(tx,`${randomUUID()}@example.test`,'second-admin-password','admin'));
  const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:'http://127.0.0.1:5173'},payload:{email:second.email,password:'second-admin-password'}});
  const secondCookie=login.headers['set-cookie'].split(';')[0];
  const secondCall=(method,url,payload)=>app.inject({method,url,payload,headers:{cookie:secondCookie,origin:'http://127.0.0.1:5173'}});
  const before=(await ok('customer','GET','/api/balance')).available;
  const data={userId:users.customer.id,direction:'credit',amount:25000,reason:'Исправление подтвержденного платежа №123'};
  assert.equal((await call('customer','POST','/api/admin/adjustments',data)).statusCode,403);
  assert.equal((await call('admin','POST','/api/admin/adjustments',{...data,reason:'коротко'})).statusCode,400);
  const key=randomUUID();
  const item=await ok('admin','POST','/api/admin/adjustments',data,key);
  assert.equal((await ok('admin','POST','/api/admin/adjustments',data,key)).id,item.id);
  assert.equal((await ok('customer','GET','/api/balance')).available,before);
  assert.equal((await call('admin','POST',`/api/admin/adjustments/${item.id}/decision`,{decision:'approved'})).statusCode,403);
  assert.equal((await secondCall('POST',`/api/admin/adjustments/${item.id}/decision`,{decision:'approved'})).statusCode,200);
  assert.equal((await ok('customer','GET','/api/balance')).available,before+25000);
  assert.equal((await secondCall('POST',`/api/admin/adjustments/${item.id}/decision`,{decision:'approved'})).statusCode,409);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM ledger WHERE reference=$1',[`adjustment:${item.id}:credit`])).rows[0].count,1);
  const debit=await ok('admin','POST','/api/admin/adjustments',{userId:users.customer.id,direction:'debit',amount:before+30000,reason:'Тест недостатка средств при списании'});
  assert.equal((await secondCall('POST',`/api/admin/adjustments/${debit.id}/decision`,{decision:'approved'})).statusCode,409);
  assert.equal((await ok('admin','GET','/api/admin/adjustments?userId='+users.customer.id)).find(row=>row.id===debit.id).status,'pending');
  assert.equal((await secondCall('POST',`/api/admin/adjustments/${debit.id}/decision`,{decision:'rejected',reason:'Недостаточно денег'})).statusCode,200);
  assert.equal((await ok('customer','GET','/api/balance')).available,before+25000);
  assert.equal((await call('publisher','GET','/api/admin/adjustments')).statusCode,403);
});

test('published informer applies one package price only to its full selection',async t=>{
  const {ok,call,material,outlet}=await fixture(t);
  const second=await ok('publisher','POST','/api/outlets',{name:'Package channel',url:'https://package.example.test',kind:'telegram',geography:'federal',details:{goals:['pr']},prices:{post:100000}});
  await ok('admin','POST',`/api/admin/outlets/${second.id}`,{approved:true});
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const informer=await ok('admin','POST','/api/informers',{title:'Package offer',status:'Опубликован',format:'Подборка площадок',packagePrice:'1500',selectionIds:[outlet.id,second.id]});
  const placements=[{outletId:outlet.id,format:'news'},{outletId:second.id,format:'post'}];
  const orders=await ok('customer','POST','/api/orders',{materialId:material.id,placements,informerId:informer.id,expectedAmount:150000});
  assert.equal(orders.reduce((sum,order)=>sum+Number(order.amount),0),150000);
  assert.ok(orders.every(order=>order.snapshot.informer.id===informer.id));
  assert.ok(orders.every(order=>Number(order.snapshot.standardAmount)>0));
  assert.equal((await call('customer','POST','/api/orders',{materialId:material.id,placements:[placements[0]],informerId:informer.id,expectedAmount:150000})).statusCode,409);
  assert.equal((await call('customer','POST','/api/orders',{materialId:material.id,placements,informerId:informer.id,expectedAmount:1})).statusCode,409);
  const {id,updatedAt,...data}=informer;
  await ok('admin','PUT',`/api/informers/${id}`,{...data,status:'Приостановлен'});
  assert.equal((await call('customer','POST','/api/orders',{materialId:material.id,placements,informerId:informer.id,expectedAmount:150000})).statusCode,409);
});

test('project reports persist and download as PDF and CSV',async t=>{
  const {ok,call,material,outlet}=await fixture(t);
  const project=await ok('customer','POST','/api/projects',{name:'Report project'});
  await ok('customer','POST',`/api/materials/${material.id}/project`,{projectId:project.id});
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/report-publication',markingConfirmed:true});
  const today=new Date().toISOString().slice(0,10);
  const report=await ok('customer','POST','/api/reports',{projectId:project.id,dateFrom:today,dateTo:today});
  const listed=await ok('customer','GET','/api/reports');
  assert.equal(listed.placements.find(row=>row.id===order.id).number,order.number);
  assert.equal(listed.saved.find(row=>row.id===report.id).snapshot.rows.length,1);
  const pdf=await call('customer','GET',`/api/reports/${report.id}/pdf`);
  assert.equal(pdf.statusCode,200,pdf.body);assert.equal(pdf.headers['content-type'],'application/pdf');assert.match(pdf.rawPayload.subarray(0,4).toString(),/%PDF/);
  const placementPdf=await call('customer','GET',`/api/orders/${order.id}/report.pdf`);
  assert.equal(placementPdf.statusCode,200,placementPdf.body);assert.match(placementPdf.rawPayload.subarray(0,4).toString(),/%PDF/);
  const csv=await call('customer','GET','/api/reports/export.csv');
  assert.equal(csv.statusCode,200,csv.body);assert.match(csv.body,/report-publication/);
  const filteredCsv=await call('customer','GET',`/api/reports/export.csv?projectId=${project.id}&dateFrom=${today}&dateTo=${today}`);
  assert.equal(filteredCsv.statusCode,200,filteredCsv.body);assert.match(filteredCsv.body,new RegExp(String(order.number)));
  assert.equal((await call('customer','GET',`/api/reports/export.csv?dateFrom=${today}&dateTo=2020-01-01`)).statusCode,400);
  assert.equal((await call('other','GET',`/api/reports/${report.id}/pdf`)).statusCode,404);
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
  assert.ok(order.snapshot.schedule.deadlineAt);
  assert.equal((await ok('customer','GET','/api/balance')).reserved,76500);
  assert.equal((await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]},orderKey))[0].id,order.id);
  assert.equal((await ok('publisher','GET','/api/orders'))[0].number,order.number);
  assert.equal((await ok('admin','GET','/api/orders')).find(o=>o.id===order.id).number,order.number);
  await ok('customer','PUT',`/api/materials/${material.id}`,{...input,title:'Edited after order',version:1});
  assert.equal((await ok('publisher','GET','/api/orders'))[0].snapshot.title,'Original news');
  assert.equal((await call('other','POST',`/api/orders/${order.id}/action`,{action:'complete'})).statusCode,404);
  const accepted=await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  assert.ok(accepted.snapshot.schedule.deadlineAt);
  assert.equal((await call('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/news'})).statusCode,400);
  const published=await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/news',markingConfirmed:true});
  assert.equal(published.snapshot.schedule.deadlineAt,null);
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
 const result=await ok('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'no_sanctions',reason:'Placement meets requirements'});
 assert.equal(result.dispute_number,dispute.dispute_number);
 assert.equal((await ok('publisher','GET','/api/balance')).available,65025);
 assert.equal((await ok('customer','GET','/api/balance')).reserved,0);
 assert.equal((await call('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'no_sanctions',reason:'Repeated'})).statusCode,409);
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
  await ok('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'full_refund',reason:'Complaint confirmed'});
  assert.equal((await ok('customer','GET','/api/balance')).available,1000000);
  assert.equal((await call('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'full_refund',reason:'Again'})).statusCode,409);
});

test('evidence request reaches only the selected dispute side',async t=>{
  const {ok,call,material,outlet,users}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/dispute',markingConfirmed:true});
  await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'dispute',reason:'Нужна проверка публикации'});
  const request=await ok('admin','POST',`/api/admin/orders/${order.id}/evidence-request`,{recipient:'publisher'});
  assert.equal(request.recipient_id,users.publisher.id);
  assert.equal((await ok('admin','GET',`/api/orders/${order.id}/messages`)).filter(row=>row.kind==='evidence_request').length,1);
  assert.equal((await ok('publisher','GET',`/api/orders/${order.id}/messages`)).filter(row=>row.kind==='evidence_request').length,1);
  assert.equal((await ok('customer','GET',`/api/orders/${order.id}/messages`)).filter(row=>row.kind==='evidence_request').length,0);
  assert.equal((await call('customer','POST',`/api/admin/orders/${order.id}/evidence-request`,{recipient:'publisher'})).statusCode,403);
  const ledger=await ok('admin','GET','/api/admin/ledger');
  assert.equal(ledger.find(row=>row.reference===`order:${order.id}:reserve`).order_number,order.number);
});

test('full dispute payout sends the gross amount to the publisher',async t=>{
  const {ok,material,outlet}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/full-payout',markingConfirmed:true});
  await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'dispute',reason:'Review requested'});
  const resolved=await ok('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'full_payout',reason:'Publisher fulfilled the order'});
  assert.equal(resolved.status,'completed');
  assert.equal(resolved.snapshot.disputeResolution.publisherAmount,76500);
  assert.equal((await ok('publisher','GET','/api/balance')).available,76500);
  assert.equal((await ok('customer','GET','/api/balance')).reserved,0);
});

test('partial dispute resolution splits the reserve once',async t=>{
  const {ok,call,material,outlet}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/partial',markingConfirmed:true});
  await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'dispute',reason:'Partial mismatch'});
  const resolved=await ok('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'partial',publisherAmount:25000,reason:'Partial compensation'});
  assert.equal(resolved.status,'completed');
  assert.equal(resolved.snapshot.disputeResolution.customerAmount,51500);
  assert.equal((await ok('publisher','GET','/api/balance')).available,25000);
  assert.equal((await ok('customer','GET','/api/balance')).available,975000);
  assert.equal((await call('admin','POST',`/api/orders/${order.id}/action`,{action:'resolve',decision:'partial',publisherAmount:25000,reason:'Again'})).statusCode,409);
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
  assert.equal(quote(outlet,'news','2026-09-01'),85000);
  assert.equal(quote({...outlet,season_start:'2026-07-01'},'news','2026-06-30'),85000);
  assert.equal(quote({...outlet,season_start:'2026-07-01'},'news','2026-07-01'),91800);
  assert.throws(()=>quote(outlet,'post'),/Format unavailable/);
});

test('outlet seasonal dates persist and reject an inverted period',async t=>{
  const {ok,call}=await fixture(t);
  const payload={name:'Seasonal outlet',url:'https://seasonal.example.test',kind:'media',geography:'federal',details:{goals:['pr']},prices:{news:85000},coefficientBps:12000,discountBps:1000,seasonStart:'2026-10-01',discountUntil:'2026-10-31'};
  const outlet=await ok('publisher','POST','/api/outlets',payload);
  assert.equal(String(outlet.season_start).slice(0,10),'2026-10-01');
  assert.equal(String(outlet.discount_until).slice(0,10),'2026-10-31');
  assert.equal(quote(outlet,'news','2026-09-30'),85000);
  assert.equal(quote(outlet,'news','2026-10-15'),91800);
  assert.equal(quote(outlet,'news','2026-11-01'),85000);
  assert.equal((await call('publisher','PUT',`/api/outlets/${outlet.id}`,{...payload,seasonStart:'2026-11-01'})).statusCode,400);
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

test('reputation subjects persist settings and queue one owned scan',async t=>{
  const {ok,call}=await fixture(t);
  const payload={name:'Test Brand',type:'Бренд',queries:['Test Brand','Test Brand отзывы'],region:'Москва',periodDays:30,officialSources:['https://example.test']};
  const subject=await ok('customer','POST','/api/reputation/subjects',payload);
  assert.equal(subject.name,payload.name);
  assert.deepEqual(subject.queries,payload.queries);
  assert.equal((await ok('other','GET','/api/reputation/subjects')).length,0);
  assert.equal((await call('other','DELETE',`/api/reputation/subjects/${subject.id}`)).statusCode,404);
  assert.equal((await call('customer','POST','/api/reputation/subjects',{...payload,name:'Too many',queries:['1','2','3','4','5','6']})).statusCode,400);
  const key=randomUUID();
  const first=await ok('customer','POST',`/api/reputation/subjects/${subject.id}/scans`,{},key);
  const repeated=await ok('customer','POST',`/api/reputation/subjects/${subject.id}/scans`,{},key);
  assert.equal(first.id,repeated.id);
  assert.equal(first.status,'queued');
  assert.equal((await call('customer','POST',`/api/reputation/subjects/${subject.id}/scans`,{},randomUUID())).statusCode,409);
  const updated=await ok('customer','PUT',`/api/reputation/subjects/${subject.id}`,{...payload,queries:['Test Brand новости'],periodDays:14,region:'Россия'});
  assert.equal(updated.periodDays,14);
  assert.deepEqual(updated.queries,['Test Brand новости']);
  await ok('customer','DELETE',`/api/reputation/subjects/${subject.id}`);
  assert.equal((await ok('customer','GET','/api/reputation/subjects')).length,0);
});

test('reputation worker completes a queued scan and exposes its real snapshot only to the owner',async t=>{
  const fetchImpl=async url=>{
    assert.match(String(url),/^https:\/\/serpapi\.com\/search\.(?:json|md)\?/);
    if(String(url).includes('/search.md?'))return new Response('# Google results');
    return Response.json({search_metadata:{id:'search-1'},organic_results:[{link:'https://example.test/article',title:'Test Brand article',snippet:'Source text',position:1}]});
  };
  const {ok,call,db}=await fixture(t,{fetchImpl});
  await ok('admin','PUT','/api/admin/reputation/integrations/serpapi',{apiKey:'private-serpapi-key',enabled:true,settings:{}});
  const subject=await ok('customer','POST','/api/reputation/subjects',{name:'Test Brand',type:'Бренд',queries:['Test Brand'],region:'Москва',periodDays:30,officialSources:['example.test']});
  const queued=await ok('customer','POST',`/api/reputation/subjects/${subject.id}/scans`,{});
  assert.deepEqual(await processNextReputationScan(db,{fetchImpl}),{id:queued.id,status:'completed'});
  const [scan]=await ok('customer','GET',`/api/reputation/subjects/${subject.id}/scans`);
  assert.equal(scan.status,'completed');
  assert.equal(scan.result.materials[0].controlled,true);
  assert.equal(scan.result.availability.telegram,'unavailable');
  assert.equal((await call('other','GET',`/api/reputation/subjects/${subject.id}/scans`)).statusCode,404);
});

test('admin integration keys are encrypted, masked and OpenRouter-compatible',async t=>{
  let request;
  const fetchImpl=async(url,options)=>{request={url,options};return {ok:true,status:200,json:async()=>({data:[{id:'openai/gpt-test'}]})};};
  const {ok,call,db}=await fixture(t,{fetchImpl});
  assert.equal((await call('customer','GET','/api/admin/reputation/integrations')).statusCode,403);
  const before=await ok('admin','GET','/api/admin/reputation/integrations');
  assert.ok(before.some(item=>item.id==='openrouter'&&!item.configured));
  const apiKey='sk-or-v1-super-secret-test-key';
  await ok('admin','PUT','/api/admin/reputation/integrations/openrouter',{apiKey,enabled:true,settings:{model:'openai/gpt-test'}});
  const stored=(await db.query("SELECT * FROM reputation_integrations WHERE provider='openrouter'")).rows[0];
  assert.ok(stored.encrypted_secret.startsWith('v1.'));
  assert.equal(stored.encrypted_secret.includes(apiKey),false);
  const listed=(await ok('admin','GET','/api/admin/reputation/integrations')).find(item=>item.id==='openrouter');
  assert.equal(listed.configured,true);
  assert.equal(listed.secretHint,'•••• -key');
  assert.equal(JSON.stringify(listed).includes(apiKey),false);
  const tested=await ok('admin','POST','/api/admin/reputation/integrations/openrouter/test',{});
  assert.equal(tested.status,'success');
  assert.equal(request.url,'https://openrouter.ai/api/v1/models');
  assert.equal(request.options.headers.Authorization,`Bearer ${apiKey}`);
  await ok('admin','PUT','/api/admin/reputation/integrations/openrouter',{clearKey:true,enabled:false,settings:{model:'openai/gpt-test'}});
  assert.equal((await db.query("SELECT encrypted_secret FROM reputation_integrations WHERE provider='openrouter'")).rows[0].encrypted_secret,null);
});

test('one Yandex integration checks web, generative search and Wordstat separately',async t=>{
  const requests=[];
  const fetchImpl=async(url,options)=>{
    requests.push({url,options});
    if(url.endsWith('/web/search'))return {ok:true,json:async()=>({rawData:'PHhtbC8+'})};
    if(url.endsWith('/gen/search'))return {ok:true,json:async()=>({message:{content:'Ответ'},sources:[]})};
    return {ok:true,json:async()=>({totalCount:'1',results:[],associations:[]})};
  };
  const {ok,call,db}=await fixture(t,{fetchImpl});
  const apiKey='yandex-private-service-key';
  await ok('admin','PUT','/api/admin/reputation/integrations/yandex_search',{apiKey,enabled:true,settings:{folderId:'folder-test'}});
  const listed=await ok('admin','GET','/api/admin/reputation/integrations');
  assert.equal(listed.some(item=>item.id==='wordstat'),false);
  assert.equal(JSON.stringify(listed).includes(apiKey),false);
  assert.equal(listed.find(item=>item.id==='yandex_search').settings.folderId,'folder-test');
  const result=await ok('admin','POST','/api/admin/reputation/integrations/yandex_search/test',{});
  assert.equal(result.status,'success');
  assert.deepEqual(result.checks.map(check=>check.id),['web','generative','wordstat']);
  assert.ok(result.checks.every(check=>check.status==='success'));
  assert.deepEqual(requests.map(request=>request.url),[
    'https://searchapi.api.cloud.yandex.net/v2/web/search',
    'https://searchapi.api.cloud.yandex.net/v2/gen/search',
    'https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests',
  ]);
  assert.ok(requests.every(request=>request.options.headers.Authorization===`Api-Key ${apiKey}`));
  assert.ok(requests.every(request=>JSON.parse(request.options.body).folderId==='folder-test'));
  assert.equal((await db.query("SELECT encrypted_secret FROM reputation_integrations WHERE provider='wordstat'")).rows.length,0);
  const tested=(await ok('admin','GET','/api/admin/reputation/integrations')).find(item=>item.id==='yandex_search');
  assert.equal(tested.testDetails.length,3);
  assert.equal(JSON.stringify(tested).includes(apiKey),false);
  assert.equal((await call('customer','POST','/api/admin/reputation/integrations/yandex_search/test',{})).statusCode,403);
});

test('Yandex integration records a partial failure without losing other checks',async t=>{
  const fetchImpl=async url=>url.endsWith('/gen/search')
    ?{ok:false,status:403}
    :url.endsWith('/web/search')?{ok:true,json:async()=>({rawData:'PHhtbC8+'})}:{ok:true,json:async()=>({results:[]})};
  const {ok}=await fixture(t,{fetchImpl});
  await ok('admin','PUT','/api/admin/reputation/integrations/yandex_search',{apiKey:'yandex-private-service-key',enabled:true,settings:{folderId:'folder-test'}});
  const result=await ok('admin','POST','/api/admin/reputation/integrations/yandex_search/test',{});
  assert.equal(result.status,'failed');
  assert.deepEqual(result.checks.map(check=>check.status),['success','failed','success']);
  assert.equal(result.checks[1].message,'HTTP 403');
});

test('Yandex generative check accepts valid responses without optional answer text',async()=>{
  const fetchImpl=async url=>url.endsWith('/gen/search')
    ?{ok:true,json:async()=>[{sources:[],isAnswerRejected:true}]}
    :url.endsWith('/web/search')?{ok:true,json:async()=>({rawData:'PHhtbC8+'})}:{ok:true,json:async()=>({results:[]})};
  const checks=await testYandexIntegration({apiKey:'test-key',folderId:'folder-test',fetchImpl});
  assert.deepEqual(checks.map(check=>check.status),['success','success','success']);
  assert.equal(checks[1].message,'Доступен, ответ без текста');
});

test('other integrations verify credentials without exposing provider responses',async t=>{
  const requests=[];
  const replies={
    dadata:{suggestions:[{value:'Москва'}]},serpapi:{account_id:'account-1'},ahrefs:{limits_and_usage:{subscription:'test'}},
    tgstat:{status:'ok',response:[]},firecrawl:{success:true,data:{remainingCredits:1}},
  };
  let partyAvailable=true;
  const fetchImpl=async(url,options)=>{
    const provider=url.includes('dadata.ru')?'dadata':url.includes('serpapi.com')?'serpapi':url.includes('ahrefs.com')?'ahrefs':url.includes('tgstat.ru')?'tgstat':'firecrawl';
    requests.push({provider,url,options});
    return {ok:true,json:async()=>provider==='dadata'&&url.endsWith('/findById/party')?{suggestions:partyAvailable?[{data:{inn:'7707083893'}}]:[]}:replies[provider]};
  };
  const {ok}=await fixture(t,{fetchImpl});
  for(const provider of Object.keys(replies)){
    const apiKey=`private-${provider}-key`;
    await ok('admin','PUT',`/api/admin/reputation/integrations/${provider}`,{apiKey,enabled:true,settings:{}});
    const result=await ok('admin','POST',`/api/admin/reputation/integrations/${provider}/test`,{});
    assert.equal(result.status,'success',provider);
    assert.equal(result.message,provider==='dadata'?'Адреса и организации доступны':'Подключение работает');
    const listed=(await ok('admin','GET','/api/admin/reputation/integrations')).find(item=>item.id===provider);
    assert.equal(listed.testStatus,'success');
    if(provider==='dadata')assert.deepEqual(listed.testDetails.map(check=>check.status),['success','success']);
    assert.equal(JSON.stringify(listed).includes(apiKey),false);
  }
  assert.deepEqual(requests.map(request=>request.provider),['dadata',...Object.keys(replies)]);
  assert.equal(requests[0].options.headers.Authorization,'Token private-dadata-key');
  assert.ok(requests[1].url.endsWith('/findById/party'));
  assert.equal(requests[3].options.headers.Authorization,'Bearer private-ahrefs-key');
  assert.equal(requests[5].options.headers.Authorization,'Bearer private-firecrawl-key');
  partyAvailable=false;
  const partial=await ok('admin','POST','/api/admin/reputation/integrations/dadata/test',{});
  assert.equal(partial.status,'failed');
  assert.deepEqual(partial.checks.map(check=>check.status),['success','failed']);
  replies.serpapi={error:'private provider error'};
  const failed=await ok('admin','POST','/api/admin/reputation/integrations/serpapi/test',{});
  assert.equal(failed.status,'failed');
  assert.equal(failed.message,'Не удалось проверить подключение');
  assert.equal(JSON.stringify(failed).includes('private provider error'),false);
});

test('OpenRouter LLM adapter uses the compatible chat completions contract',async()=>{
  let request;
  const result=await openRouterChat({
    apiKey:'secret',model:'openai/gpt-test',messages:[{role:'user',content:'Analyze'}],responseFormat:{type:'json_object'},appOrigin:'https://axioma.test',
    fetchImpl:async(url,options)=>{request={url,options};return {ok:true,status:200,json:async()=>({id:'chat-1',model:'openai/gpt-test',choices:[{message:{content:'{"risk":"low"}'}}],usage:{total_tokens:12}})};},
  });
  assert.equal(request.url,'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(request.options.headers.Authorization,'Bearer secret');
  assert.equal(request.options.headers['HTTP-Referer'],'https://axioma.test');
  assert.equal(JSON.parse(request.options.body).response_format.type,'json_object');
  assert.equal(result.content,'{"risk":"low"}');
});

test('material withdrawal removes moderation entry and refunds expedited fee exactly once',async t=>{
  const {db,ok,call,material,users,input}=await fixture(t);
  const balance=async()=>Number((await ok('customer','GET','/api/balance')).available);
  const before=await balance();
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:true});
  assert.equal(await balance(),before-5000);
  assert.equal((await call('other','POST',`/api/materials/${material.id}/withdraw`,{})).statusCode,404);
  assert.equal((await call('publisher','POST',`/api/materials/${material.id}/withdraw`,{})).statusCode,403);
  const draft=await ok('customer','POST',`/api/materials/${material.id}/withdraw`,{},'withdraw-material-1');
  assert.equal(draft.status,'draft');assert.equal(draft.expedited,false);assert.equal(draft.submitted_at,null);
  assert.equal(await balance(),before);
  await ok('customer','POST',`/api/materials/${material.id}/withdraw`,{},'withdraw-material-1');
  assert.equal(await balance(),before);
  assert.equal((await call('customer','POST',`/api/materials/${material.id}/withdraw`,{})).statusCode,409);
  assert.ok(!(await ok('admin','GET','/api/moderation')).some(row=>row.id===material.id));
  assert.equal((await call('admin','POST',`/api/moderation/${material.id}`,{approved:true})).statusCode,409);
  const edited=await ok('customer','PUT',`/api/materials/${material.id}`,{...input,version:draft.version,body:'<h2><span style="font-family:Georgia;font-size:24px">Heading</span></h2><p>First</p><p><a href="https://example.test">Link</a></p>'});
  assert.match(edited.body,/font-family:Georgia/);assert.match(edited.body,/font-size:24px/);assert.match(edited.body,/href="https:\/\/example.test"/);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('customer','POST',`/api/materials/${material.id}/withdraw`,{});
  assert.equal(await balance(),before);
  const audits=(await db.query("SELECT * FROM audit WHERE actor_id=$1 AND action='material.withdraw'",[users.customer.id])).rows;
  assert.equal(audits.length,2);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  assert.equal((await call('customer','POST',`/api/materials/${material.id}/withdraw`,{})).statusCode,409);
});

test('closing act draft is owned, immutable, and based on a completed placement',async t=>{
  const sellerConfig={name:'ООО Аксиома',inn:'7700000000',address:'Москва',bank:'Тестовый банк',bic:'044525225',account:'40702810000000000001'};
  const {db,ok,call,users,material,outlet}=await fixture(t,{sellerConfig});
  await db.query(`INSERT INTO account_settings(user_id,profile,requisites,requisites_status)
    VALUES($1,$2,$3,'verified')`,[users.customer.id,JSON.stringify({company:'ООО Заказчик'}),JSON.stringify({payerStatus:'Юридическое лицо',inn:'7800000000',legalAddress:'Санкт-Петербург'})]);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  assert.equal((await ok('customer','GET','/api/closing-documents')).length,0);
  assert.equal((await call('customer','POST',`/api/closing-documents/${order.id}`,{})).statusCode,404);
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/placement',markingConfirmed:true});
  await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'complete'});
  const listed=(await ok('customer','GET','/api/closing-documents'))[0];
  assert.equal(listed.orderId,order.id);assert.equal(listed.status,'not_issued');
  assert.equal((await call('other','POST',`/api/closing-documents/${order.id}`,{})).statusCode,404);
  assert.equal((await call('publisher','POST',`/api/closing-documents/${order.id}`,{})).statusCode,403);
  const issued=await ok('customer','POST',`/api/closing-documents/${order.id}`,{},'closing-act-1');
  assert.equal(issued.status,'draft');
  assert.equal((await ok('customer','POST',`/api/closing-documents/${order.id}`,{},'closing-act-1')).id,issued.id);
  assert.equal((await ok('customer','POST',`/api/closing-documents/${order.id}`,{},'closing-act-2')).id,issued.id);
  assert.equal((await call('other','GET',`/api/closing-documents/${issued.id}/pdf`)).statusCode,404);
  const pdf=await call('customer','GET',`/api/closing-documents/${issued.id}/pdf`);
  assert.equal(pdf.statusCode,200,pdf.body);assert.equal(pdf.rawPayload.subarray(0,4).toString(),'%PDF');
  await db.query("UPDATE account_settings SET profile=$2 WHERE user_id=$1",[users.customer.id,JSON.stringify({company:'Другое имя'})]);
  const snapshot=(await db.query('SELECT * FROM closing_documents WHERE id=$1',[issued.id])).rows[0];
  assert.equal(snapshot.snapshot.customer.name,'ООО Заказчик');
  assert.equal(Number(snapshot.amount),Number(order.amount));
  const csv=await call('customer','GET','/api/closing-documents/export.csv');
  assert.equal(csv.statusCode,200);assert.match(csv.body,new RegExp(`АКС-${issued.number}`));
  assert.equal((await db.query('SELECT count(*)::int AS count FROM closing_documents WHERE order_id=$1',[order.id])).rows[0].count,1);
});

test('period act from 1C reconciles completed orders, stays private, and versions PDFs',async t=>{
  const {db,ok,call,users,material,outlet,storageRoot}=await fixture(t);
  await ok('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await ok('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const [order]=await ok('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await ok('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/act-placement',markingConfirmed:true});
  await ok('customer','POST',`/api/orders/${order.id}/action`,{action:'complete'});
  const makePdf=async()=>{const id=randomUUID();await writeFile(join(storageRoot,id),'%PDF-1.4\n');await db.query('INSERT INTO files(id,owner_id,name,mime,size) VALUES($1,$2,$3,$4,$5)',[id,users.admin.id,'act.pdf','application/pdf',9]);return id;};
  const fileId=await makePdf();const day=new Date().toISOString().slice(0,10);
  const data={customerId:users.customer.id,number:'1C-100',issuedOn:day,dateFrom:day,dateTo:day,orderIds:[order.id],amount:Number(order.amount),fileId};
  assert.equal((await call('customer','POST','/api/admin/acts',data)).statusCode,403);
  assert.equal((await call('admin','POST','/api/admin/acts',{...data,amount:data.amount+1})).statusCode,409);
  const act=await ok('admin','POST','/api/admin/acts',data,'act-from-1c');
  assert.equal((await ok('admin','POST','/api/admin/acts',data,'act-from-1c')).id,act.id);
  assert.equal((await call('admin','POST','/api/admin/acts',{...data,number:'1C-101'})).statusCode,409);
  assert.equal((await ok('customer','GET','/api/acts'))[0].orders[0].id,order.id);
  assert.equal((await ok('other','GET','/api/acts')).length,0);
  assert.equal((await call('other','GET',`/api/acts/${act.id}/pdf`)).statusCode,404);
  assert.equal((await call('customer','GET',`/api/acts/${act.id}/pdf`)).rawPayload.subarray(0,4).toString(),'%PDF');
  const replacement=await makePdf();
  const revised=await ok('admin','POST',`/api/admin/acts/${act.id}/versions`,{fileId:replacement,reason:'Исправлена подпись и дата'});
  assert.equal(revised.revision,2);
  assert.equal((await ok('customer','GET','/api/acts'))[0].revision,2);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM period_act_versions WHERE act_id=$1',[act.id])).rows[0].count,2);
});

test('approved payout is not transferred until a bank reference is recorded exactly once',async t=>{
  const {db,ok,call,users}=await fixture(t);
  await db.transaction(tx=>transfer(tx,'external:clearing',`${users.publisher.id}:available`,100000,'test:payout-transfer'));
  await db.query(`INSERT INTO account_settings(user_id,requisites,requisites_status) VALUES($1,$2,'verified')`,[users.publisher.id,JSON.stringify({payeeStatus:'Юридическое лицо',recipient:'ООО Паблишер',inn:'7700000000',account:'40702810000000000002',bik:'044525225'})]);
  const payout=await ok('publisher','POST','/api/payouts',{amount:50000});
  assert.equal((await call('admin','POST',`/api/admin/payouts/${payout.id}/transfer`,{bankReference:'bank-ref-1',transferredAt:new Date().toISOString()})).statusCode,409);
  await ok('admin','POST',`/api/admin/payouts/${payout.id}/decision`,{decision:'approved'});
  assert.equal(Number((await ok('publisher','GET','/api/balance')).reserved),50000);
  const payload={bankReference:'bank-ref-1',transferredAt:new Date().toISOString()};
  const transferred=await ok('admin','POST',`/api/admin/payouts/${payout.id}/transfer`,payload,'transfer-1');
  assert.equal(transferred.status,'transferred');
  assert.equal((await ok('admin','POST',`/api/admin/payouts/${payout.id}/transfer`,payload,'transfer-1')).id,payout.id);
  assert.equal((await call('admin','POST',`/api/admin/payouts/${payout.id}/transfer`,payload)).statusCode,409);
  assert.equal(Number((await ok('publisher','GET','/api/balance')).reserved),0);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM ledger WHERE reference=$1',[`payout:${payout.id}:transferred`])).rows[0].count,1);
});

test('advertiser manual review requires recorded evidence and is visible in history',async t=>{
  const {ok,call,material}=await fixture(t);
  assert.equal((await call('customer','POST',`/api/admin/advertisers/${material.advertiser_id}/review`,{decision:'blocked',evidence:'Customer request',note:'Review pending'})).statusCode,403);
  assert.equal((await call('admin','POST',`/api/admin/advertisers/${material.advertiser_id}/review`,{decision:'blocked',evidence:'short',note:'too short'})).statusCode,400);
  const reviewed=await ok('admin','POST',`/api/admin/advertisers/${material.advertiser_id}/review`,{decision:'blocked',evidence:'Документ проверки от 28 сентября',note:'Реквизиты требуют уточнения'});
  assert.equal(reviewed.verification,'blocked');
  const detail=await ok('admin','GET',`/api/admin/advertisers/${material.advertiser_id}`);
  assert.equal(detail.reviews.length,1);
  assert.equal(detail.reviews[0].decision,'blocked');
});

test('top-up invoices are private and signed bank payments credit actual amounts once',async t=>{
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const sellerConfig={name:'ООО Аксиома',inn:'7700000000',address:'Москва',bank:'Тестовый банк',bic:'044525225',account:'40702810000000000001'};
  const tochkaConfig={customerCode:'customer-1',accountId:sellerConfig.account,webhookPublicKey:publicKey.export({type:'spki',format:'pem'})};
  const {db,app,call,ok,users,material}=await fixture(t,{sellerConfig,tochkaConfig});
  await db.query(`INSERT INTO account_settings(user_id,profile,requisites,requisites_status)
    VALUES($1,$2,$3,'verified')`,[users.customer.id,JSON.stringify({company:'ООО Клиент'}),JSON.stringify({payerStatus:'Юридическое лицо',inn:'7800000000',legalAddress:'Санкт-Петербург'})]);
  const issued=await ok('customer','POST','/api/topups',{amount:100000,method:'transfer'},'invoice-unique-1');
  assert.equal((await ok('customer','POST','/api/topups',{amount:100000,method:'transfer'},'invoice-unique-1')).id,issued.id);
  assert.equal((await call('other','GET',`/api/topups/${issued.id}/invoice.pdf`)).statusCode,404);
  const document=await call('customer','GET',`/api/topups/${issued.id}/invoice.pdf`);
  assert.equal(document.statusCode,200,document.body);
  assert.equal(document.rawPayload.subarray(0,4).toString(),'%PDF');
  const balance=()=>ok('customer','GET','/api/balance');
  const before=(await balance()).available;
  const send=async(id,amount,inn='7800000000')=>{
    const payload={webhookType:'incomingPayment',customerCode:'customer-1',paymentId:id,purpose:`Оплата информационных услуг платформы по счету АКС-${issued.number}, без НДС`,SidePayer:{inn,amount:String(amount/100),currency:'RUB'},SideRecipient:{account:sellerConfig.account,amount:String(amount/100),currency:'RUB'}};
    const header=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT'})).toString('base64url');
    const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
    const token=`${header}.${body}.${sign('RSA-SHA256',Buffer.from(`${header}.${body}`),privateKey).toString('base64url')}`;
    return app.inject({method:'POST',url:'/api/webhooks/tochka',headers:{'content-type':'text/plain'},payload:token});
  };
  const bankItem=(id,amount,inn='7800000000',type='Credit')=>({paymentId:id,creditDebitIndicator:type,description:`${type==='Debit'?'Возврат. ':''}Оплата информационных услуг платформы по счету АКС-${issued.number}, без НДС`,amount:{amount:String(amount/100),currency:'RUB'},debtorParty:{inn},creditorParty:{inn},creditorAccount:{identification:sellerConfig.account}});
  const reconcile=items=>reconcileTopupStatement(db,{accountId:tochkaConfig.accountId,status:'Ready',transaction:items},tochkaConfig.accountId);
  assert.equal((await send('bank-1',40000)).statusCode,200);
  assert.equal((await send('bank-1',40000)).statusCode,200);
  assert.equal((await balance()).available-before,0);
  assert.equal((await reconcile([bankItem('bank-1',40000)])).credited,1);
  assert.equal((await balance()).available-before,34000);
  assert.equal((await ok('customer','GET','/api/topups'))[0].status,'partial');
  assert.equal((await send('bank-2',70000)).statusCode,200);
  await reconcile([bankItem('bank-1',40000),bankItem('bank-2',70000)]);
  assert.equal((await balance()).available-before,93500);
  assert.equal((await ok('customer','GET','/api/topups'))[0].status,'overpaid');
  assert.equal((await send('bank-3',10000,'7900000000')).statusCode,200);
  await reconcile([bankItem('bank-3',10000,'7900000000')]);
  assert.equal((await balance()).available-before,93500);
  assert.equal((await ok('admin','GET','/api/admin/topups/review')).length,1);
  assert.equal((await reconcile([bankItem('bank-4',5000)])).credited,1);
  assert.equal((await balance()).available-before,97750);
  await db.transaction(tx=>transfer(tx,`${users.customer.id}:available`,'platform:revenue',1090000,'test-spending'));
  const platformBefore=Number((await db.query("SELECT balance FROM accounts WHERE id='platform:revenue'")).rows[0].balance);
  assert.equal((await reconcile([bankItem('refund-1',97750,'7800000000','Debit')])).reversed,1);
  assert.equal((await balance()).available,0);
  assert.equal(Number((await db.query("SELECT balance FROM accounts WHERE id='platform:revenue'")).rows[0].balance),platformBefore);
  assert.equal((await ok('customer','GET','/api/topups'))[0].status,'refunded');
  assert.equal((await call('customer','POST','/api/orders',{materialId:material.id,outletIds:[randomUUID()]})).statusCode,409);
  assert.equal((await reconcile([bankItem('refund-1',97750,'7800000000','Debit')])).reversed,0);
  assert.equal((await app.inject({method:'POST',url:'/api/webhooks/tochka',headers:{'content-type':'text/plain'},payload:'bad.jwt'})).statusCode,400);
  assert.equal((await send('bank-mismatch',20000)).statusCode,200);
  assert.equal((await reconcile([bankItem('bank-mismatch',10000)])).reviewed,1);
  assert.equal((await reconcile([bankItem('bank-mismatch',10000)])).credited,0);
  const disputed=(await ok('admin','GET','/api/admin/topups/review')).find(row=>row.provider_payment_id==='bank-mismatch');
  assert.equal(Number(disputed.amount),10000);
  assert.equal((await call('customer','POST',`/api/admin/topups/review/${disputed.id}/assign`,{invoiceId:issued.id,reason:'Проверено по выписке'})).statusCode,403);
  await ok('admin','POST',`/api/admin/topups/review/${disputed.id}/assign`,{invoiceId:issued.id,reason:'Проверено по выписке'});
  assert.equal((await balance()).available,8500);
  assert.equal((await ok('customer','GET','/api/topups'))[0].status,'partially_refunded');
  assert.equal((await call('admin','POST',`/api/admin/topups/review/${disputed.id}/assign`,{invoiceId:issued.id,reason:'Проверено по выписке'})).statusCode,404);
  await ok('admin','POST',`/api/admin/topups/holds/${users.customer.id}/settle`,{amount:1000,reason:'Погашение задолженности'},'settle-topup-1');
  await ok('admin','POST',`/api/admin/topups/holds/${users.customer.id}/settle`,{amount:1000,reason:'Погашение задолженности'},'settle-topup-1');
  assert.equal((await balance()).available,7500);
});
