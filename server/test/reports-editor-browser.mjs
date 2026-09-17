import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const [account]=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const base='http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password,expectedRole:'customer'}})).status(),200);
  const materials=await (await context.request.get(`${base}/api/materials`)).json();
  assert.ok(materials.length);assert.ok(materials.every(material=>Number.isInteger(material.number)));
  await page.goto(`${base}/customer/materials`);
  await page.getByText(`№${materials[0].number}`,{exact:false}).first().waitFor().catch(()=>{});
  await page.getByText(materials[0].title,{exact:true}).first().click();
  await page.getByText(`Материал №${materials[0].number}`,{exact:true}).waitFor();
  await page.goto(`${base}/customer/reports`);
  await page.getByRole('heading',{name:'Отчеты',exact:true}).waitFor();
  const rows=page.locator('tbody tr');assert.ok(await rows.count()>0);
  await rows.first().click();
  await page.getByRole('heading',{name:'Отчет по размещению',exact:true}).waitFor();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Скачать отчет',exact:true}).click()]);
  assert.match(download.suggestedFilename(),/placement-\d+\.pdf/);
  await page.goto(`${base}/customer/reports`);
  const [csv]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Скачать таблицу',exact:true}).click()]);
  assert.equal(csv.suggestedFilename(),'placements.csv');
  await page.screenshot({path:'/tmp/axioma-reports.png',fullPage:true});
  await context.close();
  console.log('Material numbers and report downloads verified');
} finally {await browser.close();}

