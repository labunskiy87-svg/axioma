import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {buildApp,createUser} from '../app.mjs';
import {migrate} from '../db.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const pg=new PGlite();
const wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
const db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx)))};
const storageRoot=await mkdtemp(join(tmpdir(),'notifications-browser-'));
let app,browser;
try {
  await migrate(db);
  const users=await db.transaction(async tx=>({
    customer:await createUser(tx,`customer-${randomUUID()}@example.test`,'browser-test-password','customer'),
    admin:await createUser(tx,`admin-${randomUUID()}@example.test`,'browser-test-password','admin'),
  }));
  app=await buildApp({db,storageRoot});
  const cookies={};
  for(const [role,user] of Object.entries(users)){
    const response=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:base},payload:{email:user.email,password:'browser-test-password'}});
    assert.equal(response.statusCode,200,response.body);
    cookies[role]=response.headers['set-cookie'].split(';')[0];
  }
  const call=async(role,method,url,payload)=>{
    const response=await app.inject({method,url,payload,headers:{cookie:cookies[role],origin:base,'idempotency-key':randomUUID()}});
    assert.ok(response.statusCode<300,response.body);
    return response.json();
  };
  const advertiser=await call('customer','POST','/api/advertisers',{name:'Рекламодатель для теста',inn:'7700000000'});
  await db.query("UPDATE advertisers SET verification='verified' WHERE id=$1",[advertiser.id]);
  const materials=await call('customer','POST','/api/materials/batch',Array.from({length:5},(_,index)=>({advertiserId:advertiser.id,title:`Уведомление ${index+1}`,body:'Материал для проверки',format:'news'})));
  await call('customer','POST','/api/materials/submit',{ids:materials.map(item=>item.id),expedited:false});
  assert.equal((await call('admin','GET','/api/materials')).filter(item=>item.status==='pending').length,5);

  browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const [width,height] of [[1440,900],[390,844]]){
    await db.query('DELETE FROM notification_reads');
    const context=await browser.newContext({viewport:{width,height}});
    await context.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url());
      const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie:cookies.admin},payload:request.postData()??undefined});
      await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/admin/moderation`);
    const bell=page.getByRole('button',{name:/Уведомления:/});
    await bell.waitFor();
    await bell.click();
    await page.getByText('5 новых').waitFor();
    assert.equal(await page.getByRole('button',{name:/Новый материал на модерации/}).count(),4);
    await page.getByRole('button',{name:'Показать все'}).click();
    assert.equal(await page.getByRole('button',{name:/Новый материал на модерации/}).count(),5);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`/tmp/pr-market-notifications-${width}.png`});
    await page.getByRole('button',{name:/Новый материал на модерации/}).first().click();
    await page.waitForURL(url=>url.searchParams.has('material'));
    await page.reload();
    const readBell=page.getByRole('button',{name:/Уведомления: 4 новых/});
    await readBell.waitFor();
    await readBell.click();
    await page.getByText('4 новых').waitFor();
    assert.deepEqual(errors,[]);
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.route('**/api/**',async route=>{
    const request=route.request(),url=new URL(request.url());
    const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie:cookies.customer},payload:request.postData()??undefined});
    await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
  });
  const page=await context.newPage();
  await page.goto(`${base}/customer/advertisers`);
  const advertiserRow=page.locator('tr').filter({hasText:'Рекламодатель для теста'});
  await advertiserRow.waitFor();
  assert.equal((await advertiserRow.innerText()).includes(advertiser.id.slice(0,8)),false);
  await page.screenshot({path:'/tmp/pr-market-advertisers-clean.png'});
  await context.close();
  const ticketAdmin=await db.transaction(tx=>createUser(tx,`ticket-admin-${randomUUID()}@example.test`,'browser-test-password','admin'));
  const ticketLogin=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:base},payload:{email:ticketAdmin.email,password:'browser-test-password'}});
  assert.equal(ticketLogin.statusCode,200,ticketLogin.body);
  cookies.admin=ticketLogin.headers['set-cookie'].split(';')[0];
  const ticket=await call('customer','POST','/api/tickets',{subject:'Вопрос по заказу',body:'Нужна помощь'});
  for(const role of ['admin','customer']){
    if(role==='customer')await call('admin','POST',`/api/tickets/${ticket.id}/messages`,{body:'Ответ поддержки'});
    const ticketContext=await browser.newContext({viewport:{width:1440,height:900}});
    await ticketContext.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url());
      const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie:cookies[role]},payload:request.postData()??undefined});
      await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
    });
    const ticketPage=await ticketContext.newPage();
    await ticketPage.goto(`${base}/${role}/support`);
    await ticketPage.getByRole('button',{name:/Уведомления:/}).click();
    if(role==='admin')await ticketPage.getByRole('button',{name:'Показать все'}).click();
    await ticketPage.getByRole('button',{name:new RegExp(role==='admin'?'Новое обращение в поддержку':'Ответ поддержки')}).click();
    await ticketPage.waitForURL(url=>url.searchParams.get('ticket')===ticket.id);
    await ticketPage.getByRole('button',{name:'Отправить',exact:true}).waitFor();
    await ticketContext.close();
  }
  console.log('Notifications verified on desktop and mobile.');
} finally {
  await browser?.close();
  await app?.close();
  await pg.close();
  await rm(storageRoot,{recursive:true,force:true});
}
