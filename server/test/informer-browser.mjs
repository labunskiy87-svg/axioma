import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
let admin;
try {
 const sessions={};
 for(const role of ['admin','customer']) {
  const a=accounts.find(a=>a.role===role),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(15000);
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:a.email,password:a.password}})).status(),200);
  sessions[role]=page;
 }
 admin=sessions.admin;
 await admin.goto(`${base}/admin/informer`);
 await admin.getByRole('button',{name:'Создать карточку',exact:true}).click();
 await admin.locator('button').filter({hasText:'Подборка площадок'}).click();
 await admin.getByRole('option',{name:'Внешняя ссылка',exact:true}).click();
 const title=`Демо: информер ${Date.now()}`;
 for(const [label,value] of [['Подзаголовок','Новости платформы'],['Заголовок',title],['Текст','Тестовая карточка для проверки показа и сохранения.'],['Текст кнопки','Открыть новость']]) {
  await admin.locator('label').filter({has:admin.getByText(label,{exact:true})}).locator('input,textarea').fill(value);
 }
 await admin.getByPlaceholder('https://example.ru/page').fill('https://example.test/news');
 await admin.getByRole('button',{name:'Опубликовать',exact:true}).click();
 await admin.locator('tbody').getByText(title,{exact:true}).waitFor();
 await admin.reload();await admin.locator('tbody').getByText(title,{exact:true}).waitFor();
 await sessions.customer.goto(`${base}/customer`);
 await sessions.customer.getByText(title,{exact:true}).waitFor();
 await sessions.customer.screenshot({path:'/tmp/axioma-informer-customer.png'});
 await admin.locator('tbody').getByText(title,{exact:true}).click();
 await admin.getByRole('button',{name:'Приостановить',exact:true}).click();
 await admin.locator('tbody').getByText(title,{exact:true}).waitFor();
 await sessions.customer.reload();await sessions.customer.locator('aside').waitFor();
 assert.equal(await sessions.customer.getByText(title,{exact:true}).count(),0);
 await admin.screenshot({path:'/tmp/axioma-informer-admin.png'});
 console.log('Informer created, persisted, displayed and paused through UI');
}catch(error){if(admin){console.log(await admin.locator('body').innerText());await admin.screenshot({path:'/tmp/axioma-informer-error.png'});}throw error;}
finally {await browser.close();}
