import assert from 'node:assert/strict';
import {rewriteFixture} from './rewrite-fixture.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
let calls=0;
const f=await rewriteFixture(async(url,options)=>{
  const request=JSON.parse(options.body);assert.equal(request.response_format.json_schema.name,'material_rewrite');
  calls++;
  return Response.json({model:'test-model',choices:[{message:{content:JSON.stringify({body:`<p>Рерайт ${calls}: компания открыла завод в 2026 году.</p>`})}}]});
});
const browser=await chromium.launch({headless:true,channel:'chrome'}),base=f.origin;
try {
  for(const width of [1440,390]) {
    await f.db.query('UPDATE accounts SET balance=10000 WHERE id=$1',[`${f.user.id}:available`]);
    const context=await browser.newContext({viewport:{width,height:950}});
    await context.route('**/api/**',async route=>{
      const req=route.request(),url=new URL(req.url());
      const result=await f.app.inject({method:req.method(),url:url.pathname+url.search,headers:{...req.headers(),cookie:f.cookie},payload:req.postData()??undefined});
      await route.fulfill({status:result.statusCode,headers:{'content-type':'application/json'},body:result.body});
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/customer/materials`);
    await page.getByRole('button',{name:'Добавить материал',exact:true}).click();
    const editor=page.getByRole('textbox',{name:'Текст материала'}).first();
    await editor.fill('Компания открыла завод в 2026 году.');
    const button=page.getByRole('button',{name:'Рерайт с помощью ИИ · 30 ₽',exact:true}).first();
    assert.equal(await button.evaluate(node=>getComputedStyle(node).backgroundColor),'rgb(0, 107, 255)');
    const toolbar=button.locator('..'),bounds=await toolbar.boundingBox(),buttonBounds=await button.boundingBox();
    assert.ok(buttonBounds.x+buttonBounds.width<=bounds.x+bounds.width+1);
    assert.ok(Math.abs(buttonBounds.x+buttonBounds.width-(bounds.x+bounds.width-12))<3);
    await button.click();
    const dialog=page.getByRole('dialog',{name:'Рерайт с помощью ИИ'});
    await dialog.waitFor();await page.screenshot({path:`/tmp/axioma-rewrite-modal-${width}.png`});
    const before=calls;
    await dialog.getByRole('button',{name:'Запустить рерайт за 30 ₽',exact:true}).click();
    await dialog.waitFor({state:'hidden'});assert.match(await editor.innerText(),new RegExp(`Рерайт ${before+1}`));
    assert.deepEqual(await f.balance(),{available:7000,reserved:0});
    await button.click();await dialog.getByRole('button',{name:'Запустить рерайт за 30 ₽',exact:true}).click();
    await dialog.waitFor({state:'hidden'});assert.match(await editor.innerText(),new RegExp(`Рерайт ${before+2}`));
    assert.deepEqual(await f.balance(),{available:4000,reserved:0});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await button.scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/axioma-rewrite-editor-${width}.png`});
    assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Rewrite toolbar, direct insertion and two separately paid generations verified on desktop/mobile');
} finally {await browser.close();await f.close();}
