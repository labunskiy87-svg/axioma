import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {buildApp,createUser} from '../app.mjs';
import {migrate} from '../db.mjs';
import {transfer} from '../finance.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const pg=new PGlite();
const wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
const db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx)))};
const storageRoot=await mkdtemp(join(tmpdir(),'support-browser-'));
let app,browser;
try {
  await migrate(db);
  const users=await db.transaction(async tx=>{
    const result={};
    for(const role of ['customer','publisher','admin'])result[role]=await createUser(tx,`${role}-${randomUUID()}@example.test`,'browser-test-password',role);
    await transfer(tx,'external:clearing',`${result.customer.id}:available`,1000000,'test:opening');
    return result;
  });
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
  const unanswered=await call('customer','POST','/api/tickets',{subject:'Проверить публикацию',body:'Нужна помощь с публикацией'});
  const answered=await call('publisher','POST','/api/tickets',{subject:'Настройка площадки',body:'Как изменить срок?'});
  await call('admin','POST',`/api/tickets/${answered.id}/messages`,{body:'Измените срок в настройках площадки'});
  const closed=await call('customer','POST','/api/tickets',{subject:'Завершенный вопрос',body:'Спасибо'});
  await call('admin','PATCH',`/api/tickets/${closed.id}`,{status:'closed'});
  const ad=await call('customer','POST','/api/advertisers',{name:'Рекламодатель',inn:'7700000000'});
  await db.query("UPDATE advertisers SET verification='verified' WHERE id=$1",[ad.id]);
  const [material]=await call('customer','POST','/api/materials/batch',[{advertiserId:ad.id,title:'Материал для публикации',body:'Текст материала',format:'news'}]);
  await call('customer','POST','/api/materials/submit',{ids:[material.id],expedited:false});
  await call('admin','POST',`/api/moderation/${material.id}`,{approved:true});
  const outlet=await call('publisher','POST','/api/outlets',{name:'Городские новости',url:'https://example.test',kind:'media',geography:'federal',details:{topics:['Город'],publicationDays:1,storageMonths:24},prices:{news:100000}});
  await call('admin','POST',`/api/admin/outlets/${outlet.id}`,{approved:true});
  const [order]=await call('customer','POST','/api/orders',{materialId:material.id,outletIds:[outlet.id]});
  await call('publisher','POST',`/api/orders/${order.id}/action`,{action:'accept'});
  await call('publisher','POST',`/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/publication',markingConfirmed:true});
  await call('customer','POST',`/api/orders/${order.id}/action`,{action:'dispute',reason:'Проверить соответствие публикации'});

  browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const role of ['admin','customer','publisher']){
    const context=await browser.newContext();
    // Exercise the real API against an isolated database, without changing user data.
    await context.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url());
      const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie:cookies[role]},payload:request.postData()??undefined});
      await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    for(const [width,height] of [[1440,900],[390,844]]){
      await page.setViewportSize({width,height});
      await page.goto(`${base}/${role}/support`);
      await page.getByRole('heading',{name:'Список тикетов',exact:true}).waitFor();
      await page.locator('.support-list-row').first().waitFor();
      assert.equal(await page.getByRole('button',{name:'Тикеты',exact:true}).count(),0);
      assert.equal(await page.getByRole('button',{name:'Жалобы и споры',exact:true}).count(),0);
      const target=role==='publisher'?answered:unanswered;
      const row=page.locator('.support-list-row').filter({hasText:`T-${target.number} ·`});
      assert.equal(await row.getAttribute('data-awaiting-reply'),role==='customer'?'false':'true');
      assert.equal(await row.locator('[data-reply-indicator]').evaluate(element=>getComputedStyle(element).visibility),role==='customer'?'hidden':'visible');
      assert.equal(await row.evaluate(element=>getComputedStyle(element).boxShadow),'none');
      assert.equal(await row.evaluate(element=>getComputedStyle(element).borderRadius),'0px');
      assert.equal(await page.locator('.support-list').first().evaluate(element=>getComputedStyle(element).borderRadius),'24px');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      await page.screenshot({path:`/tmp/pr-market-support-${role}-${width}.png`,fullPage:true});
      await row.click();
      await page.waitForURL(url=>url.searchParams.get('ticket')===target.id);
      await page.getByRole('button',{name:'Отправить',exact:true}).waitFor();
      const send=await page.getByRole('button',{name:'Отправить',exact:true}).boundingBox();
      assert.ok(send.y+send.height<=height,`Send button below viewport: ${role} ${width}`);
      await page.getByRole('button',{name:'← К тикетам'}).click();
      assert.equal(new URL(page.url()).searchParams.has('ticket'),false);
      await page.goBack();
      await page.waitForURL(url=>url.searchParams.get('ticket')===target.id);
      await page.getByRole('button',{name:'Отправить',exact:true}).waitFor();
      await page.goForward();
      await page.waitForURL(url=>!url.searchParams.has('ticket'));
      if(role==='admin'){
        await page.goto(`${base}/admin/complaints`);
        await page.locator('.support-list-row').waitFor();
        assert.equal(await page.locator('.support-list-row').getAttribute('data-awaiting-reply'),'true');
        assert.equal(await page.locator('.support-list-row [data-reply-indicator]').first().evaluate(element=>getComputedStyle(element).visibility),'visible');
        assert.equal(await page.locator('.support-list-row').first().evaluate(element=>getComputedStyle(element).borderRadius),'0px');
        await page.screenshot({path:`/tmp/pr-market-complaints-${width}.png`,fullPage:true});
      }
    }
    const routes=role==='admin'?['users','advertisers','operations','platforms','orders']:role==='customer'?['materials','advertisers','balance','orders']:['platforms','orders'];
    await page.setViewportSize({width:1440,height:900});
    for(const section of routes){
      await page.goto(`${base}/${role}/${section}`);
      await page.locator('table').first().waitFor();
      const radii=await page.locator('table').evaluateAll(tables=>tables.map(table=>{let frame=table.parentElement;while(frame&&!frame.classList.contains('border'))frame=frame.parentElement;return frame?getComputedStyle(frame).borderRadius:null;}));
      assert.ok(radii.every(radius=>radius==='24px'),`${role}/${section}: ${radii}`);
    }
    assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log('Support/complaint styling, pending highlights, chat controls, history and table radii verified across all roles on desktop/mobile.');
} finally {
  await browser?.close();
  await app?.close();
  await pg.close();
  await rm(storageRoot,{recursive:true,force:true});
}
