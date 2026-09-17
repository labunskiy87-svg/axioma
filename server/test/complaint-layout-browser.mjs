import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const account=JSON.parse(await readFile('.local-demo-accounts.json','utf8')).find(item=>item.role==='customer');
const base='http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(15000);
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password,expectedRole:'customer'}})).status(),200);
  await page.goto(`${base}/customer/complaint`);
  const description=page.getByRole('textbox',{name:'Описание',exact:true});
  await description.waitFor();assert.equal(await description.inputValue(),'');
  assert.match(await description.getAttribute('placeholder'),/Опишите/);
  await page.getByRole('button',{name:'Прикрепить файл',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'/tmp/axioma-complaint-1440.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'/tmp/axioma-complaint-390.png',fullPage:true});
  await context.close();console.log('Complaint form empty state and layout verified');
} finally {await browser.close();}
