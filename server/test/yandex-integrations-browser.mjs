import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {buildApp,createUser} from '../app.mjs';
import {migrate} from '../db.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const pg=new PGlite();
const wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
const db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx)))};
let app,browser;
try {
  await migrate(db);
  const user=await db.transaction(tx=>createUser(tx,`admin-${randomUUID()}@example.test`,'browser-test-password','admin'));
  const fetchImpl=async url=>url.includes('dadata.ru')
    ?{ok:true,json:async()=>({suggestions:url.endsWith('/findById/party')?[{data:{inn:'7707083893'}}]:[{value:'Москва'}]})}
    :url.endsWith('/gen/search')
    ?{ok:false,status:403}
    :url.endsWith('/web/search')?{ok:true,json:async()=>({rawData:'PHhtbC8+'})}:{ok:true,json:async()=>({results:[]})};
  app=await buildApp({db,fetchImpl});
  const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:base},payload:{email:user.email,password:'browser-test-password'}});
  assert.equal(login.statusCode,200,login.body);
  const cookie=login.headers['set-cookie'].split(';')[0];
  const configured=await app.inject({method:'PUT',url:'/api/admin/reputation/integrations/yandex_search',headers:{cookie,origin:base},payload:{apiKey:'yandex-browser-test-key',enabled:true,settings:{folderId:'folder-test'}}});
  assert.equal(configured.statusCode,200,configured.body);
  const dadata=await app.inject({method:'PUT',url:'/api/admin/reputation/integrations/dadata',headers:{cookie,origin:base},payload:{apiKey:'dadata-browser-test-key',enabled:true,settings:{}}});
  assert.equal(dadata.statusCode,200,dadata.body);
  browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const [width,height] of [[1440,900],[390,844]]) {
    const context=await browser.newContext({viewport:{width,height}});
    await context.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url());
      const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie},payload:request.postData()??undefined});
      await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/admin/integrations`);
    await page.getByRole('heading',{name:'Яндекс',exact:true}).waitFor();
    assert.equal(await page.getByRole('heading',{name:'Wordstat',exact:true}).count(),0);
    assert.equal(await page.getByText('Поиск, генеративный ответ и Wordstat').count(),1);
    const yandex=page.locator('section').filter({has:page.getByRole('heading',{name:'Яндекс',exact:true})});
    await yandex.getByRole('button',{name:'Проверить'}).click();
    const details=yandex.getByRole('button',{name:/Проверка сервисов/});
    await details.getByText('2 из 3 доступны').waitFor();
    assert.equal(await details.getAttribute('aria-expanded'),'false');
    await details.click();
    assert.equal(await details.getAttribute('aria-expanded'),'true');
    await yandex.locator('#yandex_search-check-details').getByText('Недоступен',{exact:true}).waitFor();
    assert.equal(await yandex.getByText('HTTP 403').count(),0);
    assert.equal(await page.getByRole('status').getByText('Часть сервисов Яндекса недоступна').count(),1);
    assert.equal(await yandex.getByText('Веб-поиск', {exact:true}).count(),1);
    assert.equal(await yandex.getByText('Wordstat', {exact:true}).count(),1);
    const dadataRow=page.locator('section').filter({has:page.getByRole('heading',{name:'DaData',exact:true})});
    await dadataRow.getByRole('button',{name:'Проверить'}).click();
    const dadataDetails=dadataRow.getByRole('button',{name:/Проверка сервисов/});
    await dadataDetails.getByText('2 из 2 доступны').waitFor();
    await dadataDetails.click();
    assert.equal(await dadataRow.locator('#dadata-check-details').getByText('Доступен',{exact:true}).count(),2);
    assert.equal(await dadataRow.getByText('Неожиданный тип ответа').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`/tmp/pr-market-yandex-integrations-${width}.png`,fullPage:true});
    await yandex.screenshot({path:`/tmp/pr-market-yandex-row-${width}.png`});
    assert.deepEqual(errors,[]);
    await context.close();
  }
} finally {
  await browser?.close();
  await app?.close();
  await pg.close();
}
