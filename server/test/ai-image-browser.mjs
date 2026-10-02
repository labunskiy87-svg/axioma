import assert from 'node:assert/strict';
import sharp from 'sharp';
import {rewriteFixture} from './rewrite-fixture.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const png=await sharp({create:{width:1536,height:864,channels:3,background:'#20b8a5'}}).png().toBuffer();
let calls=0;
const createFixture=()=>rewriteFixture(async(url,options)=>{
  assert.equal(JSON.parse(options.body).model,'openai/gpt-image-2.5-flare');calls++;
  return Response.json({data:[{b64_json:png.toString('base64'),media_type:'image/png'}]});
});
const browser=await chromium.launch({headless:true,channel:'chrome'});
let f;
try {
  for(const width of [1440,390]) {
    f=await createFixture();
    await f.db.query('UPDATE accounts SET balance=20000 WHERE id=$1',[`${f.user.id}:available`]);
    const context=await browser.newContext({viewport:{width,height:950}});
    await context.route('**/api/**',async route=>{
      const req=route.request(),url=new URL(req.url());
      const result=await f.app.inject({method:req.method(),url:url.pathname+url.search,headers:{...req.headers(),cookie:f.cookie},payload:req.postData()??undefined});
      await route.fulfill({status:result.statusCode,headers:{'content-type':result.headers['content-type']??'application/json'},body:result.rawPayload});
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${f.origin}/customer/materials`);
    await page.getByRole('button',{name:'Добавить материал',exact:true}).click();
    const editor=page.getByRole('textbox',{name:'Текст материала'}).first();await editor.fill('Исходный текст материала.');
    assert.equal(await page.getByRole('button',{name:'Генерация изображения · 50 ₽',exact:true}).count(),0);
    await page.getByRole('button',{name:'Изображение',exact:true}).first().click();
    await page.getByRole('button',{name:'Сгенерировать · 50 ₽',exact:true}).click();
    const modal=page.getByRole('dialog',{name:'Генерация изображения с помощью ИИ'});
    await modal.getByRole('button',{name:'Сгенерировать за 50 ₽',exact:true}).click();
    const preview=modal.getByAltText('Сгенерированное изображение');await preview.waitFor();
    await page.waitForFunction(()=>document.querySelector('img[alt="Сгенерированное изображение"]')?.naturalWidth===1024);
    assert.equal(await editor.locator('img').count(),1);assert.match(await editor.innerText(),/Исходный текст/);
    assert.deepEqual(await f.balance(),{available:15000,reserved:0});
    await page.screenshot({path:`/tmp/axioma-image-result-${width}.png`});
    await modal.getByRole('button',{name:'Закрыть',exact:true}).click();
    await page.getByRole('button',{name:'сгенерируйте изображение с помощью ИИ за 50 ₽',exact:true}).click();
    await modal.getByRole('button',{name:'Сгенерировать за 50 ₽',exact:true}).click();
    await preview.waitFor();assert.equal(await editor.locator('img').count(),1);
    assert.deepEqual(await f.balance(),{available:10000,reserved:0});
    await modal.getByRole('button',{name:'Сгенерировать ещё за 50 ₽',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('[role="dialog"] textarea')?.disabled);
    assert.deepEqual(await f.balance(),{available:5000,reserved:0});assert.equal(await editor.locator('img').count(),1);
    await modal.getByRole('button',{name:'Закрыть',exact:true}).click();
    const attachments=page.getByRole('button',{name:/^Удалить файл ai-image-/});await attachments.first().waitFor();
    assert.equal(await attachments.count(),3);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.getByRole('button',{name:'Изображение',exact:true}).first().click();
    await page.getByRole('button',{name:'Сгенерировать · 50 ₽',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`/tmp/axioma-image-panel-${width}.png`});
    assert.deepEqual(errors,[]);await context.close();await f.close();f=null;
  }
  assert.equal(calls,6);console.log('Image panel, preview, editor insertion, attachment-only generation and paid repeat verified on desktop/mobile');
} finally {await browser.close();if(f)await f.close();}
