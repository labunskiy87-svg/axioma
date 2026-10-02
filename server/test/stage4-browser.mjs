import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});

async function session(role) {
  const account=accounts.find(item=>item.role===role);
  const context=await browser.newContext();
  const login=await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}});
  assert.equal(login.status(),200);
  return context;
}

try {
  const customer=await session('customer');
  const advertisers=await (await customer.request.get(`${base}/api/advertisers`)).json();
  assert.ok(advertisers.length);
  const page=await customer.newPage();
  for(const [width,height] of [[1440,900],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.goto(`${base}/customer/advertiser-detail?advertiser=${advertisers[0].id}`);
    await page.getByRole('heading',{name:advertisers[0].name}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`/tmp/axioma-stage4-advertiser-${width}.png`});
    await page.getByRole('button',{name:'Изменить данные'}).click();
    await page.getByRole('heading',{name:'Редактирование рекламодателя'}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(`${base}/customer/catalog`);
  await page.getByRole('heading',{name:'Каталог площадок'}).waitFor();
  await page.getByRole('button',{name:'Тип площадки'}).click();
  await page.getByRole('option',{name:'ТГ-канал'}).click();
  const catalogRows=page.locator('table tbody tr');
  const catalogCount=await catalogRows.count();
  const outlets=await (await customer.request.get(`${base}/api/outlets`)).json();
  assert.equal(catalogCount,outlets.filter(item=>item.kind==='telegram').length);
  await page.getByRole('button',{name:'ТГ-канал'}).click();
  await page.getByRole('option',{name:'Все типы'}).click();
  await page.getByRole('button',{name:'Формат',exact:true}).click();
  await page.getByRole('option',{name:'Новость'}).click();
  await page.getByRole('button',{name:'Срок публикации'}).click();
  await page.getByRole('option',{name:'1 день'}).click();
  assert.equal(await catalogRows.count(),outlets.filter(item=>item.prices.news&&Number(item.details.publicationDaysByFormat?.news??item.details.publicationDays)===1).length);
  const customerOrders=await (await customer.request.get(`${base}/api/orders`)).json();
  const submitted=customerOrders.find(item=>item.status==='submitted');
  if(submitted) {
    await page.goto(`${base}/customer`);
    await page.getByRole('heading',{name:'Панель заказчика'}).waitFor();
    await page.locator('header button:has(svg.lucide-bell)').click();
    await page.getByRole('button',{name:new RegExp(`Заказ №${submitted.number} ожидает приемки`)}).click();
    await page.waitForURL(url=>url.pathname.endsWith('/order-detail')&&url.searchParams.get('order')===submitted.id);
  }

  const publisher=await session('publisher');
  const publisherOrders=await (await publisher.request.get(`${base}/api/orders`)).json();
  const pubPage=await publisher.newPage();
  await pubPage.goto(`${base}/publisher/orders`);
  await pubPage.getByRole('heading',{name:'Ваши заказы'}).waitFor();
  await pubPage.getByRole('button',{name:'Статус заказа'}).click();
  await pubPage.getByRole('option',{name:'Новые заявки'}).click();
  assert.equal(await pubPage.locator('table tbody tr').count(),publisherOrders.filter(item=>item.status==='pending').length);
  const pending=publisherOrders.find(item=>item.status==='pending');
  if(pending) {
    await pubPage.goto(`${base}/publisher`);
    await pubPage.getByRole('heading',{name:'Панель паблишера'}).waitFor();
    await pubPage.locator('header button:has(svg.lucide-bell)').click();
    await pubPage.getByRole('button',{name:new RegExp(`Заказ №${pending.number} ожидает решения`)}).click();
    await pubPage.waitForURL(url=>url.pathname.endsWith('/order-new-detail')&&url.searchParams.get('order')===pending.id);
  }
  await pubPage.goto(`${base}/publisher/orders`);
  await pubPage.setViewportSize({width:390,height:844});
  assert.equal(await pubPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await pubPage.screenshot({path:'/tmp/axioma-stage4-publisher-390.png'});
  await publisher.close();
  await customer.close();
  console.log('Stage 4 advertiser routing and catalogue/publisher filters verified on desktop and mobile');
} finally {await browser.close();}
