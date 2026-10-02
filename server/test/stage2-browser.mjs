import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
const account=role=>accounts.find(item=>item.role===role);
let informerId;
let adminContext;

async function login(context,role) {
  const current=account(role);
  const response=await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:current.email,password:current.password}});
  assert.equal(response.status(),200,await response.text());
}

try {
  adminContext=await browser.newContext();
  await login(adminContext,'admin');
  const existingInformers=await (await adminContext.request.get(`${base}/api/informers`)).json();
  for(const item of existingInformers.filter(item=>item.title==='Проверка единой цены')) {
    await adminContext.request.delete(`${base}/api/informers/${item.id}`,{headers:{origin:base}});
  }
  const outletsResponse=await adminContext.request.get(`${base}/api/outlets`);
  assert.equal(outletsResponse.status(),200);
  const outlets=(await outletsResponse.json()).filter(item=>item.active&&item.status==='approved').slice(0,2);
  assert.equal(outlets.length,2);
  const informerResponse=await adminContext.request.post(`${base}/api/informers`,{
    headers:{origin:base},
    data:{title:'Проверка единой цены',status:'Опубликован',format:'Подборка площадок',action:'Выбрать подборку',target:'Каталог',packagePrice:'123456',selectionIds:outlets.map(item=>item.id)},
  });
  assert.equal(informerResponse.status(),200,await informerResponse.text());
  informerId=(await informerResponse.json()).id;

  for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]) {
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
    await login(context,'customer');
    const page=await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(`${base}/customer/catalog?informer=${encodeURIComponent(informerId)}`);
    await page.getByRole('heading',{name:'Каталог площадок'}).waitFor();
    assert.match(await page.getByText('Выбрано:').locator('..').innerText(),/2[\s\S]*123\s*456/);
    await page.getByRole('button',{name:'Разместить на выбранных'}).click();
    const modal=page.getByRole('dialog',{name:'Подтверждение заказа'});
    await modal.waitFor();
    assert.match(await modal.innerText(),/Единая цена подборки/i);
    assert.match(await modal.innerText(),/123\s*456/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    assert.ok(overflow<=1,`body overflow ${overflow}px at ${viewport.name}`);
    await page.screenshot({path:`/tmp/axioma-stage2-package-${viewport.name}.png`,fullPage:true});
    await context.close();
  }

  const publisherContext=await browser.newContext({viewport:{width:1440,height:1000}});
  await login(publisherContext,'publisher');
  const publisherPage=await publisherContext.newPage();
  await publisherPage.goto(`${base}/publisher/orders`);
  await publisherPage.getByRole('heading',{name:'Ваши заказы'}).waitFor();
  const before=await publisherPage.locator('tbody tr').count();
  await publisherPage.locator('button').filter({hasText:/^Статус заказа$/}).click();
  await publisherPage.getByRole('option',{name:'Новые заявки',exact:true}).click();
  const after=await publisherPage.locator('tbody tr').count();
  assert.ok(after<=before);
  assert.equal(await publisherPage.locator('tbody').getByText('Ожидает публикации',{exact:true}).count(),0);
  await publisherContext.close();
  console.log(JSON.stringify({packageOffer:true,desktop:true,mobile:true,publisherStatusFilter:true}));
} finally {
  if(adminContext&&informerId)await adminContext.request.delete(`${base}/api/informers/${informerId}`,{headers:{origin:base}}).catch(()=>{});
  if(adminContext)await adminContext.close().catch(()=>{});
  await browser.close();
}
