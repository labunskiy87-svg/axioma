import assert from 'node:assert/strict';
import sharp from 'sharp';
import {rewriteFixture} from './rewrite-fixture.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const png=await sharp({create:{width:1024,height:576,channels:3,background:'#20b8a5'}}).png().toBuffer();
const browser=await chromium.launch({headless:true,channel:'chrome'});let f;
try {
  for(const width of [1440,390]) {
    f=await rewriteFixture(async()=>{throw new Error('No paid model call expected');});
    const context=await browser.newContext({viewport:{width,height:850}});
    await context.route('https://images.example.test/image.png',route=>route.fulfill({contentType:'image/png',body:png}));
    await context.route('**/api/**',async route=>{
      const req=route.request(),url=new URL(req.url());
      const result=await f.app.inject({method:req.method(),url:url.pathname+url.search,headers:{...req.headers(),cookie:f.cookie},payload:req.postData()??undefined});
      await route.fulfill({status:result.statusCode,headers:{'content-type':result.headers['content-type']??'application/json'},body:result.rawPayload});
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${f.origin}/customer/materials`);
    await page.getByRole('button',{name:'Добавить материал',exact:true}).click();
    const title=`QA image tools ${width}`;
    await page.getByPlaceholder('Введите заголовок материала').fill(title);
    const editor=page.getByRole('textbox',{name:'Текст материала'});await editor.fill('Текст перед изображением.');
    await page.getByRole('button',{name:'Изображение',exact:true}).click();
    await page.getByPlaceholder('https://example.com/image.jpg').fill('https://images.example.test/image.png');
    await page.getByRole('button',{name:'Вставить по URL',exact:true}).click();
    const image=editor.locator('img');await image.waitFor();await page.waitForFunction(()=>document.querySelector('.tiptap img')?.naturalWidth===1024);
    await image.click();const caption=page.getByRole('textbox',{name:'Подпись изображения',exact:true});await caption.waitFor();
    await page.getByRole('button',{name:'Изображение',exact:true}).click();await caption.waitFor({state:'hidden'});await image.click();await caption.waitFor();
    assert.equal(await editor.locator('[data-resize-handle]').count(),4);
    await page.getByRole('button',{name:'50%',exact:true}).click();
    const half=await image.boundingBox();assert.ok(half.width>80&&half.width<(await editor.boundingBox()).width*.55);
    await page.getByRole('spinbutton',{name:'Ширина изображения в пикселях'}).fill('160');
    assert.ok(Math.abs((await image.boundingBox()).width-160)<2);
    await caption.fill('Подпись к иллюстрации');
    await page.getByRole('textbox',{name:'Альтернативный текст изображения'}).fill('График результатов');
    assert.equal(await editor.locator('figcaption').innerText(),'Подпись к иллюстрации');
    assert.equal(await image.getAttribute('alt'),'График результатов');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await caption.scrollIntoViewIfNeeded();await page.screenshot({path:`/tmp/axioma-image-tools-${width}.png`});
    await page.getByRole('button',{name:'Сохранить черновик',exact:true}).click();
    await page.getByText(title,{exact:true}).first().waitFor();
    const saved=(await f.db.query('SELECT * FROM materials WHERE title=$1',[title])).rows[0];
    assert.match(saved.body,/width="160"/);assert.match(saved.body,/<figcaption>Подпись к иллюстрации/);assert.match(saved.body,/alt="График результатов"/);
    await page.getByText(title,{exact:true}).first().click();
    await page.getByRole('button',{name:'Редактировать материал',exact:true}).click();
    await editor.waitFor();await editor.locator('img').click();
    assert.equal(await caption.inputValue(),'Подпись к иллюстрации');
    assert.equal(await page.getByRole('spinbutton',{name:'Ширина изображения в пикселях'}).inputValue(),'160');
    await page.getByRole('button',{name:'Удалить изображение',exact:true}).click();assert.equal(await editor.locator('img').count(),0);assert.equal(await editor.locator('figcaption').count(),0);
    assert.deepEqual(await f.balance(),{available:10000,reserved:0});assert.deepEqual(errors,[]);
    await context.close();await f.close();f=null;
  }
  console.log('Image click tools, resize, caption, alt text, save/reopen and removal verified on desktop/mobile');
} finally {await browser.close();if(f)await f.close();}
