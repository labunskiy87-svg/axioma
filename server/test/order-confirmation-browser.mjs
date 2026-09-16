import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const account=JSON.parse(await readFile('.local-demo-accounts.json','utf8')).find(a=>a.role==='customer');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
try {
  const context=await browser.newContext();
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}})).status(),200);
  for(const [width,height] of [[1440,900],[1280,600],[390,844]]) {
    await page.setViewportSize({width:1440,height:900});
    await page.goto(`${base}/customer/catalog`);
    await page.getByRole('button',{name:'Выбрать площадку для массового размещения'}).first().click();
    await page.getByRole('button',{name:'Разместить на выбранных',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Подтверждение заказа'});
    await dialog.waitFor();
    await page.setViewportSize({width,height});
    await dialog.getByText('1 площадка',{exact:true}).waitFor();
    for(const target of [dialog,dialog.getByRole('button',{name:'Создать заказ',exact:true}),dialog.getByRole('button',{name:'Закрыть окно'})]) {
      const box=await target.boundingBox();
      assert.ok(box && box.x>=0 && box.y>=0 && box.x+box.width<=width+1 && box.y+box.height<=height+1);
    }
    const button=dialog.getByRole('button',{name:'Создать заказ',exact:true});
    const limitConfirmation=dialog.getByRole('checkbox',{name:/Подтверждаю заказ сверх лимита/});
    if(await limitConfirmation.count()) {
      assert.ok(await button.isDisabled());
      await limitConfirmation.check();
    }
    await button.click({trial:true});
    assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));
    await page.screenshot({path:`/tmp/axioma-confirmation-${width}.png`});
    await dialog.getByRole('button',{name:'Отмена',exact:true}).click();
    await dialog.waitFor({state:'hidden'});
  }
  assert.deepEqual(errors,[]);
  console.log('Order confirmation: desktop, short viewport and mobile verified without creating orders');
} finally {await browser.close();}
