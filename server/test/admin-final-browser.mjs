import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
try {
 const a=accounts.find(a=>a.role==='admin'),context=await browser.newContext(),page=await context.newPage();
 page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:a.email,password:a.password}})).status(),200);
 const orders=await (await context.request.get(`${base}/api/orders`)).json();
 await page.setViewportSize({width:1440,height:1000});
 await page.goto(`${base}/admin/orders`);
 await page.getByText(`№${orders[0].number}`,{exact:true}).click();
 await page.getByRole('heading',{name:`Заказ №${orders[0].number}`,exact:true}).waitFor();
 assert.ok(page.url().includes(orders[0].id));
 await page.reload();await page.getByText(orders[0].snapshot.title,{exact:true}).first().waitFor();
 await page.getByRole('button',{name:'Открыть чат заказа',exact:true}).click();
 await page.getByRole('heading',{name:`Чат заказа №${orders[0].number}`,exact:true}).waitFor();
 await page.goto(`${base}/admin/balances`);
 await page.getByRole('cell',{name:'demo@axioma.local',exact:true}).click();
 await page.getByRole('heading',{name:'Операции пользователя'}).waitFor();
 await page.screenshot({path:'/tmp/axioma-user-balance.png'});
 await page.goto(`${base}/admin`);
 await page.getByRole('heading',{name:'Ускоренная модерация',exact:true}).waitFor();
 assert.equal(await page.getByRole('heading',{name:'Админ-панель',exact:true}).count(),0);
 await page.screenshot({path:'/tmp/axioma-admin-dashboard.png'});
 for(const path of ['/admin/users','/admin/support','/admin/complaints']) {
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+path);await page.locator('main h1').waitFor();
  if(path.endsWith('/users'))await page.locator('tbody tr').first().waitFor();
  if(path.endsWith('/support'))await page.getByRole('button',{name:/Демо: проверка резерва/}).waitFor();
  if(path.endsWith('/complaints')) {
   await page.getByRole('button',{name:'Открыть',exact:true}).first().waitFor();
   assert.equal(await page.getByRole('button',{name:'Тикеты',exact:true}).count(),0);
   assert.equal(await page.getByText('Новая жалоба',{exact:true}).count(),0);
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  await page.screenshot({path:`/tmp/axioma-mobile-${path.split('/').at(-1)}.png`});
 }
 assert.deepEqual(errors,[]);
 console.log('Admin order links, real order data, user balance detail and mobile layouts verified');
}finally{await browser.close();}
