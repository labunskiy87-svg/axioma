// Diagnostic checks for known unfinished screens, not release acceptance tests.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
try {
 for(const role of ['customer','publisher']) {
  const a=accounts.find(a=>a.role===role),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(15000);
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:a.email,password:a.password}})).status(),200);
  const balance=await (await context.request.get(`${base}/api/balance`)).json();
  await page.goto(`${base}/${role}/${role==='customer'?'balance':'finance'}`);
  await page.locator('main .text-4xl').first().waitFor();
  const displayed=await page.locator('main .text-4xl').first().innerText();
  console.log(JSON.stringify({finding:'finance-screen',role,displayed,actualAvailableRubles:Number(balance.available)/100}));
  await page.screenshot({path:`/tmp/axioma-audit-finance-${role}.png`});
  if(role==='customer') {
   const advertisers=await (await context.request.get(`${base}/api/advertisers`)).json();
   await page.goto(`${base}/customer/advertisers`);
   await page.getByText(advertisers[0].name,{exact:true}).click();
   await page.waitForURL('**/advertiser-detail*');
   const heading=await page.locator('main h1').innerText();
   console.log(JSON.stringify({finding:'advertiser-detail',selected:advertisers[0].name,heading,url:page.url()}));
   await page.goto(`${base}/customer/catalog`);
   await page.locator('tbody tr').first().waitFor();
   const before=await page.locator('tbody tr').count();
   await page.locator('button').filter({hasText:/^Тип площадки$/}).click();
   await page.getByRole('option',{name:'ТГ-канал',exact:true}).click();
   console.log(JSON.stringify({finding:'catalog-type-filter',before,after:await page.locator('tbody tr').count(),visibleMedia:await page.locator('tbody').getByText('СМИ',{exact:true}).count()}));
   await page.goto(`${base}/customer/reports`);await page.locator('tbody tr').first().waitFor();
   console.log(JSON.stringify({finding:'reports',firstRow:await page.locator('tbody tr').first().innerText()}));
  }
  await context.close();
 }
}finally {await browser.close();}
