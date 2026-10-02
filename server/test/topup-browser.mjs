import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const account=JSON.parse(await readFile('.local-demo-accounts.json','utf8')).find(item=>item.role==='customer');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL??'chrome'});
const base='http://127.0.0.1:5173';
try {
  const context=await browser.newContext();
  const login=await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}});
  assert.equal(login.status(),200);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [width,height] of [[2822,1444],[1440,900],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto(`${base}/customer/topup`);
    const action=page.getByRole('button',{name:'Скачать счет на оплату'});
    await action.waitFor();
    assert.equal(await action.isEnabled(),true);
    assert.match(await page.getByText('Информационные услуги платформы, 15%').locator('..').innerText(),/75\s?000/);
    assert.equal(await page.getByText('Не возвращаются').count(),1);
    const box=await action.boundingBox();
    assert.ok(box&&box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=height+1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
    await page.screenshot({path:`/tmp/axioma-topup-${width}.png`,fullPage:true});
    await page.getByLabel('Сумма платежа').fill('101');
    assert.match(await page.getByText('Информационные услуги платформы, 15%').locator('..').innerText(),/15,15/);
    assert.match(await page.getByText('К зачислению',{exact:true}).locator('..').innerText(),/85,85/);
  }
  const keys=[];
  await page.route('**/api/topups',async route=>{
    if(route.request().method()!=='POST')return route.continue();
    keys.push(route.request().headers()['idempotency-key']);
    await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Тестовый сбой связи'})});
  });
  for(let attempt=0;attempt<2;attempt++) {
    await page.getByRole('button',{name:'Скачать счет на оплату'}).click();
    await page.getByRole('alertdialog').waitFor();
    await page.getByRole('button',{name:'Закрыть',exact:true}).click();
  }
  assert.equal(keys.length,2);
  assert.ok(keys[0]);
  assert.equal(keys[0],keys[1]);
  await page.getByLabel('Сумма платежа').fill('102');
  await page.getByRole('button',{name:'Скачать счет на оплату'}).click();
  await page.getByRole('alertdialog').waitFor();
  assert.notEqual(keys[2],keys[0]);
  assert.deepEqual(errors,[]);
  console.log('Top-up view verified on desktop and mobile');
} finally {await browser.close();}
