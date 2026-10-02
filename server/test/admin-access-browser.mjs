import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  for(const [width,height] of [[1440,900],[390,844]]) {
    const context=await browser.newContext({viewport:{width,height}});
    const errors=[];
    const admin=accounts.find(account=>account.role==='admin');
    assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:admin.email,password:admin.password}})).status(),200);
    const users=await (await context.request.get(`${base}/api/admin/users`)).json();
    const customer=users.find(user=>user.role==='customer'&&user.email==='demo@axioma.local');
    assert.ok(customer);
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/admin/settings`);
    await page.getByText('Администраторы',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Редактировать',exact:true}).first().click();
    await page.getByRole('button',{name:'Администратор',exact:true}).last().click();
    await page.getByRole('option',{name:'Модератор'}).waitFor();
    await page.getByRole('option',{name:'Суперадминистратор'}).waitFor();
    await page.keyboard.press('Escape');
    await page.screenshot({path:`/tmp/axioma-admin-roles-${width}.png`});
    await page.goto(`${base}/admin/users?admin_user=${customer.id}&user_tab=finance`);
    await page.getByText('Комиссия платформы',{exact:true}).first().waitFor();
    await page.getByRole('textbox',{name:'Ставка, %'}).waitFor();
    await page.screenshot({path:`/tmp/axioma-personal-commission-${width}.png`});
    await page.goto(`${base}/admin/users?admin_user=${customer.id}&user_tab=orders`);
    const order=page.locator('button').filter({hasText:/Заказ №\d+/}).first();
    if(await order.count()) {
      await order.click();
      assert.match(page.url(),/\/admin\/order-detail\?/);
      await page.getByRole('button',{name:/К пользователю/}).first().click();
      assert.match(page.url(),/\/admin\/users\?admin_user=/);
    }
    assert.deepEqual(errors,[]);
    const adminProfile=await (await context.request.get(`${base}/api/auth/me`)).json();
    await page.route('**/api/auth/me',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...adminProfile,teamRole:'moderator'})}));
    await page.goto(`${base}/admin/moderation`);
    await page.getByText('Модерация',{exact:true}).first().waitFor({state:'attached'});
    assert.equal(await page.getByText('Финансы',{exact:true}).count(),0);
    await page.screenshot({path:`/tmp/axioma-moderator-${width}.png`});
    await context.close();
  }
  const customer=accounts.find(account=>account.role==='customer');
  const customerContext=await browser.newContext({viewport:{width:1440,height:900}});
  assert.equal((await customerContext.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:customer.email,password:customer.password}})).status(),200);
  assert.equal((await customerContext.request.get(`${base}/api/settings/commission`)).status(),200);
  const customerPage=await customerContext.newPage();
  await customerPage.route('**/api/settings/commission',route=>route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({error:'Not Found'})}));
  await customerPage.goto(`${base}/customer`);
  await customerPage.getByText('Панель заказчика',{exact:true}).first().waitFor();
  assert.equal(await customerPage.getByRole('alertdialog',{name:'Ошибка операции'}).count(),0);
  await customerContext.close();
  const publisher=accounts.find(account=>account.role==='publisher');
  const context=await browser.newContext({viewport:{width:390,height:844}});
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:publisher.email,password:publisher.password}})).status(),200);
  const page=await context.newPage();
  await page.goto(`${base}/publisher/payout-request`);
  const amount=page.getByRole('textbox',{name:'Сумма к выводу'});
  await amount.fill('1000');
  assert.equal(await amount.inputValue(),'1000');
  await page.screenshot({path:'/tmp/axioma-payout-input-390.png'});
  await context.close();
  console.log('Login, moderator navigation, admin roles, personal commission, order navigation and payout input checked on desktop/mobile');
} finally {await browser.close();}
