import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const account=JSON.parse(await readFile('.local-demo-accounts.json','utf8')).find(item=>item.role==='customer');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const context=await browser.newContext({acceptDownloads:true});
  const login=await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}});
  assert.equal(login.status(),200);
  const documents=await (await context.request.get(`${base}/api/closing-documents`)).json();
  const page=await context.newPage();
  for(const [width,height] of [[1440,900],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto(`${base}/customer/balance`);
    await page.getByRole('heading',{name:'Финансы и документы'}).waitFor();
    const rows=page.getByText('Акт оказанных услуг',{exact:false});
    assert.equal(await rows.count(),documents.length);
    if(documents.length)await page.getByText(`№${documents[0].orderNumber}`,{exact:false}).first().waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.getByRole('heading',{name:'Закрывающие документы'}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`/tmp/axioma-closing-documents-${width}.png`,fullPage:true});
  }
  const csv=await context.request.get(`${base}/api/closing-documents/export.csv`);
  assert.equal(csv.status(),200);
  assert.match(await csv.text(),/Стоимость услуг/);
  console.log('Customer closing documents view and financial export verified on desktop and mobile');
} finally {await browser.close();}
