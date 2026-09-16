import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
 const errors=[];
try {
 const sessions={};
 for(const a of accounts) {
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);
  console.log('Checking',a.role);
  page.on('pageerror',e=>errors.push(e.message));
  const res=await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:a.email,password:a.password,expectedRole:a.role}});
  assert.equal(res.status(),200);
  sessions[a.role]={context,page};
  await page.goto(`${base}/`);await page.getByRole('button',{name:'В кабинет',exact:true}).waitFor();
  await page.getByRole('button',{name:'В кабинет',exact:true}).click();await page.locator('aside').waitFor();
  await page.goto(`${base}/${a.role}/orders`);
  const orders=await (await context.request.get(`${base}/api/orders`)).json();
  const search=page.getByRole('textbox').first();await search.fill(`№${orders[0].number}`);
  await page.getByText(`№${orders[0].number}`,{exact:true}).first().waitFor();
  assert.equal(await page.locator('tbody tr').count(),1);
  console.log('Search passed',a.role);
 }
 const {page:admin,context:adminContext}=sessions.admin;
 for(const section of ['users','advertisers','balances','audit']) {
  await admin.goto(`${base}/admin/${section}`);
  try {await admin.locator('tbody tr').first().waitFor();}catch(error){console.log(await admin.locator('body').innerText());await admin.screenshot({path:'/tmp/axioma-admin-error.png'});throw error;}
  await admin.screenshot({path:`/tmp/axioma-admin-${section}.png`});
  console.log('List passed',section);
 }
 const outlets=await (await adminContext.request.get(`${base}/api/outlets`)).json();
 const outlet=outlets.find(o=>o.status==='approved'&&o.active);
 await admin.goto(`${base}/admin/platform-detail?outlet=${outlet.id}`);
 await admin.getByRole('button',{name:'Деактивировать площадку',exact:true}).click();
 await admin.getByRole('button',{name:'Активировать площадку',exact:true}).waitFor();
 await admin.reload();await admin.getByRole('button',{name:'Активировать площадку',exact:true}).click();
 await admin.getByRole('button',{name:'Деактивировать площадку',exact:true}).waitFor();
 const orders=await (await adminContext.request.get(`${base}/api/orders`)).json();
 const order=orders[0];const body=`Проверка чата ${Date.now()}`;
 const customer=sessions.customer.page;
 await customer.goto(`${base}/customer/order-chat?order=${order.id}`);
 await customer.getByRole('textbox',{name:'Сообщение',exact:true}).fill(body);
 await customer.getByRole('button',{name:'Отправить сообщение'}).click();
 await customer.getByText(body,{exact:true}).waitFor();
 await sessions.publisher.page.goto(`${base}/publisher/order-chat?order=${order.id}`);
 await sessions.publisher.page.getByText(body,{exact:true}).waitFor();
 await admin.goto(`${base}/admin/support`);
 await admin.getByRole('button',{name:/Демо: проверка резерва/}).click();
 const reply=`Проверка ответа ${Date.now()}`;
 await admin.getByRole('textbox',{name:'Сообщение',exact:true}).fill(reply);
 await admin.getByRole('button',{name:'Отправить сообщение'}).click();
 await admin.getByText(reply,{exact:true}).waitFor();
 await customer.goto(`${base}/customer/support`);
 await customer.getByRole('button',{name:/Демо: проверка резерва/}).click();
 await customer.getByText(reply,{exact:true}).waitFor();
 await customer.screenshot({path:'/tmp/axioma-support.png'});
 await admin.goto(`${base}/admin/informer`);
 console.log('Informer controls:',await admin.getByRole('button').allTextContents());
 assert.deepEqual(errors,[]);
 console.log('Landing, role order search, admin lists, activation, order chat and support verified');
}finally {await browser.close();}
