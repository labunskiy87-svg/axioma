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
const storageRoot=await mkdtemp(join(tmpdir(),'axioma-dadata-browser-'));
let app,browser;
try {
  await migrate(db);
  const users=await db.transaction(async tx=>{
    const result={};
    for(const role of ['customer','publisher','admin'])result[role]=await createUser(tx,`${role}-${randomUUID()}@example.test`,'browser-test-password',role);
    return result;
  });
  const fetchImpl=async(url)=>({ok:true,json:async()=>url.endsWith('/suggest/address')
    ?{suggestions:[{value:'г Москва, ул Тверская, д 1',unrestricted_value:'125009, г Москва, ул Тверская, д 1'}]}
    :{suggestions:[{value:'ООО Тест',data:{name:{full_with_opf:'ООО Тест'},inn:'7707083893',kpp:'770701001',ogrn:'1027700132195',address:{unrestricted_value:'125009, г Москва, ул Тверская, д 1'},type:'LEGAL',state:{status:'ACTIVE'},branch_type:'MAIN'}}]}});
  app=await buildApp({db,storageRoot,dadataKey:'browser-test-key',fetchImpl});
  const cookies={};
  for(const [role,user] of Object.entries(users)){
    const response=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:base},payload:{email:user.email,password:'browser-test-password'}});
    assert.equal(response.statusCode,200,response.body);
    cookies[role]=response.headers['set-cookie'].split(';')[0];
  }
  const createdResponse=await app.inject({method:'POST',url:'/api/advertisers',headers:{origin:base,cookie:cookies.customer},payload:{name:'ООО Тест',inn:'7707083893',details:{kind:'legal',kpp:'770701001',ogrn:'1027700132195',address:'125009, г Москва, ул Тверская, д 1'}}});
  assert.equal(createdResponse.statusCode,200,createdResponse.body);
  const advertiserId=createdResponse.json().id;
  await db.query("UPDATE advertisers SET verification='pending' WHERE id=$1",[advertiserId]);
  browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const [width,height] of [[1440,900],[390,844]]){
    for(const role of ['admin','customer','publisher']){
      const context=await browser.newContext({viewport:{width,height}});
      await context.route('**/api/**',async route=>{
        const request=route.request(),url=new URL(request.url());
        const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie:cookies[role]},payload:request.postData()??undefined});
        await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
      });
      const page=await context.newPage();
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      if(role==='admin'){
        await page.goto(`${base}/admin/integrations`);
        await page.getByText('DaData',{exact:true}).waitFor();
        const row=page.locator('section').filter({has:page.getByText('DaData',{exact:true})}).last();
        await row.getByRole('textbox',{name:'API-ключ'}).waitFor();
        const openRouter=page.locator('section').filter({has:page.getByText('OpenRouter',{exact:true})}).last();
        assert.equal(await openRouter.getByRole('textbox',{name:'Модель OpenRouter'}).inputValue(),'openai/gpt-5.6-terra');
        await page.screenshot({path:`/tmp/axioma-integrations-${width}.png`});
        await page.goto(`${base}/admin/advertisers?admin_advertiser=${advertiserId}`);
        await page.getByRole('button',{name:'Сверить с реестром'}).click();
        await page.getByText('Подтвержден по реестру').waitFor();
      } else {
        await page.goto(`${base}/${role}/settings`);
        const inn=page.getByRole('textbox',{name:'ИНН',exact:true}).first();
        await inn.fill('7707083893');
        await page.getByRole('button',{name:'Заполнить по ИНН'}).click();
        await page.getByText('Реквизиты подставлены. Проверьте данные перед сохранением.').waitFor();
        assert.equal(await page.getByRole('textbox',{name:'КПП'}).first().inputValue(),'770701001');
        assert.equal(await page.getByRole('textbox',{name:'ОГРН'}).first().inputValue(),'1027700132195');
        assert.equal(await page.getByRole('combobox',{name:'Юридический адрес'}).first().inputValue(),'125009, г Москва, ул Тверская, д 1');
        if(role==='publisher')assert.equal(await page.getByRole('textbox',{name:'Получатель'}).first().inputValue(),'ООО Тест');
        await page.getByText('НДС',{exact:true}).first().waitFor();
        const vat=page.getByText('НДС',{exact:true}).first().locator('..').getByRole('button');
        await vat.click();
        assert.equal(await vat.getAttribute('aria-expanded'),'true');
        await page.getByRole('option',{name:'22%'}).waitFor();
        await page.getByRole('option',{name:'УСН + НДС 5%'}).waitFor();
        await page.mouse.move(Math.max(5,width-10),Math.max(5,height-10));
        await page.mouse.wheel(0,150);
        await page.getByRole('option',{name:'22%'}).waitFor({state:'hidden'});
        assert.equal(await page.getByRole('option',{name:'22%'}).count(),0);
        const address=page.getByRole('combobox',{name:'Юридический адрес'}).first();
        await address.fill('Москва');
        await page.getByRole('option',{name:'г Москва, ул Тверская, д 1'}).waitFor();
        await page.getByRole('option',{name:'г Москва, ул Тверская, д 1'}).click();
        assert.equal(await address.inputValue(),'125009, г Москва, ул Тверская, д 1');
        if(role==='customer'){
          await page.goto(`${base}/customer/advertiser-detail?advertiser=${advertiserId}`);
          await page.getByRole('heading',{name:'Реквизиты',exact:true}).waitFor();
          assert.equal((await page.locator('main').innerText()).includes(advertiserId.slice(0,8)),false);
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
          await page.screenshot({path:`/tmp/axioma-advertiser-detail-${width}.png`,fullPage:true});
        }
      }
      assert.deepEqual(errors,[]);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      await page.screenshot({path:`/tmp/axioma-dadata-${role}-${width}.png`});
      await context.close();
    }
  }
  console.log('DaData integration, OpenRouter model, VAT selectors, address suggestions and scroll behavior checked on desktop/mobile');
} finally {
  await browser?.close();await app?.close();await pg.close();await rm(storageRoot,{recursive:true,force:true});
}
