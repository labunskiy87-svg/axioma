import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
try {
  const account=accounts.find(item=>item.role==='publisher'),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(15000);
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}})).status(),200);
  await page.goto(`${base}/publisher/orders`);
  const firstOrder=page.locator('tbody tr').first();
  await firstOrder.waitFor();
  await firstOrder.click();
  await page.getByText('Назад к списку',{exact:true}).waitFor();
  await page.getByText('Данные для маркировки',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'Прикрепленные файлы',exact:true}).waitFor();
  await page.getByRole('heading',{name:'Параметры размещения',exact:true}).waitFor();
  await page.getByText('Ссылки в тексте материала',{exact:true}).waitFor();
  await page.getByText('Дополнительные настройки материала',{exact:true}).waitFor();
  assert.ok(await page.locator('text=Заказ №').count());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'/tmp/axioma-publisher-order-1440.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'/tmp/axioma-publisher-order-390.png',fullPage:true});
  await context.close();
  console.log('Original publisher order composition verified on desktop and mobile');
} finally {await browser.close();}
