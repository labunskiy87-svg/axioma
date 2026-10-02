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
  await page.route('**/api/settings/limits',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({orderLimit:100,autoAccept:false})}));
  for(const [width,height] of [[1440,900],[1280,600],[390,844]]) {
    await page.setViewportSize({width:1440,height:900});
    await page.goto(`${base}/customer/catalog`);
    const discountedRow=page.getByRole('row').filter({hasText:'Демо: Деловой обзор'});
    await discountedRow.getByText('−10%',{exact:true}).waitFor();
    await discountedRow.getByRole('button',{name:'Выбрать площадку для массового размещения'}).click();
    const selectedTotal=(await page.getByText('Выбрано:').locator('..').innerText()).match(/[\d\s]+\s*₽/)?.[0].replace(/\D/g,'');
    assert.equal(selectedTotal,'19800');
    await page.getByRole('button',{name:'Разместить на выбранных',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Подтверждение заказа'});
    await dialog.waitFor();
    await page.setViewportSize({width,height});
    await dialog.getByText('1 площадка',{exact:true}).waitFor();
    assert.match(await dialog.innerText(),/СМИ · Новость/);
    const confirmationTotal=(await dialog.getByText('К резервированию').locator('..').innerText()).match(/[\d\s]+\s*₽/)?.[0].replace(/\D/g,'');
    assert.equal(confirmationTotal,selectedTotal);
    for(const target of [dialog,dialog.getByRole('button',{name:'Создать заказ',exact:true}),dialog.getByRole('button',{name:'Закрыть окно'})]) {
      const box=await target.boundingBox();
      assert.ok(box && box.x>=0 && box.y>=0 && box.x+box.width<=width+1 && box.y+box.height<=height+1);
    }
    const button=dialog.getByRole('button',{name:'Создать заказ',exact:true});
    assert.equal(await dialog.getByRole('checkbox',{name:/Подтверждаю заказ сверх лимита/}).count(),0);
    assert.equal(await dialog.getByRole('checkbox',{name:/Автоприёмка/}).isChecked(),false);
    let confirmationShown=false;
    page.on('dialog',async nativeDialog=>{confirmationShown=true;await nativeDialog.dismiss();});
    await button.click({trial:true});
    assert.equal(confirmationShown,false);
    await dialog.getByRole('checkbox',{name:/Автоприёмка/}).check();
    await button.click();
    const limitDialog=page.getByRole('dialog',{name:'Превышен лимит автоприёмки'});
    await limitDialog.waitFor();
    assert.match(await limitDialog.innerText(),/1\s*₽/);
    assert.equal(confirmationShown,false);
    const limitBox=await limitDialog.boundingBox();
    assert.ok(limitBox && limitBox.x>=0 && limitBox.y>=0 && limitBox.x+limitBox.width<=width+1 && limitBox.y+limitBox.height<=height+1);
    await page.screenshot({path:`/tmp/axioma-limit-confirmation-${width}.png`});
    await limitDialog.getByRole('button',{name:'Отмена'}).click();
    await limitDialog.waitFor({state:'hidden'});
    assert.equal(await dialog.isVisible(),true);
    assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));
    await page.screenshot({path:`/tmp/axioma-confirmation-${width}.png`});
    if(width===390) {
      let submittedOrder=null;
      await page.route('**/api/orders',route=>{
        if(route.request().method()==='POST') {
          submittedOrder=route.request().postDataJSON();
          return route.fulfill({status:200,contentType:'application/json',body:'[]'});
        }
        return route.continue();
      });
      await button.click();
      await limitDialog.getByRole('button',{name:'Продолжить'}).click();
      await dialog.waitFor({state:'hidden'});
      assert.equal(submittedOrder?.limitConfirmed,true);
      assert.equal(submittedOrder?.autoAccept,true);
    } else {
      await dialog.getByRole('button',{name:'Отмена',exact:true}).click();
      await dialog.waitFor({state:'hidden'});
    }
  }
  assert.deepEqual(errors,[]);
  console.log('Order confirmation: desktop, short viewport and mobile verified without creating orders');
} finally {await browser.close();}
