import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  page.setDefaultTimeout(15000);
  const account=accounts.find(a=>a.role==='customer');
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}})).status(),200);
  const get=async path=>(await context.request.get(base+'/api'+path)).json();
  const put=async(path,data)=>context.request.put(base+'/api'+path,{headers:{origin:base},data});
  const originalLimits=await get('/settings/limits'),originalFavorites=await get('/favorites');
  const orders=await get('/orders'),projects=await get('/projects');
  const order=orders.find(o=>!['completed','refunded','rejected'].includes(o.status));
  let outletId;
  try {
    await page.goto(base+'/customer/catalog');
    const row=page.locator('tbody tr').first();
    const favorite=row.getByRole('button',{name:/В избранно/});
    await favorite.waitFor();
    const originallyOn=(await favorite.innerText()).includes('В избранном');
    const response=page.waitForResponse(r=>r.url().includes('/api/favorites/')&&r.request().method()==='PUT');
    await favorite.click();
    const r=await response;assert.equal(r.status(),200);outletId=r.url().split('/').at(-1);
    await page.reload();
    await row.getByRole('button',{name:originallyOn?'В избранное':'В избранном',exact:true}).waitFor();
    assert.equal((await get('/favorites')).includes(outletId),!originallyOn);
    await page.goto(base+'/customer/settings');
    await page.getByLabel('Лимит без дополнительного подтверждения, ₽').fill('20 000 ₽');
    await page.getByRole('button',{name:'Сохранить лимиты',exact:true}).click();
    await page.getByRole('status').getByText('Лимиты сохранены').waitFor();
    await page.reload();
    assert.equal(await page.getByLabel('Лимит без дополнительного подтверждения, ₽').inputValue(),'20000');
    await page.goto(base+'/customer');
    await page.getByRole('row').filter({hasText:`№${order.number}`}).click();
    assert.ok(page.url().includes(order.id));
    await page.getByRole('heading',{name:order.snapshot.title,exact:true}).waitFor();
    const target=order.project_id?null:projects[0];
    await page.getByRole('button',{name:/Изменить проект:/}).click();
    const dialog=page.getByRole('dialog',{name:'Изменить проект заказа?'});
    await dialog.locator('button[aria-haspopup="listbox"]').click();
    await page.getByRole('option',{name:target?.name??'Без проекта',exact:true}).click();
    await dialog.getByRole('button',{name:'Изменить проект',exact:true}).click();
    await dialog.waitFor({state:'hidden'});
    await page.reload();
    await page.getByRole('button',{name:`Изменить проект: ${target?.name??'Без проекта'}`,exact:true}).waitFor();
    assert.equal((await get('/orders')).find(o=>o.id===order.id).project_id,target?.id??null);
    await page.goto(base+'/customer/order-detail');
    await page.getByText('Заказ не найден или недоступен.').waitFor();
  } finally {
    await put('/settings/limits',originalLimits);
    if(outletId)await put(`/favorites/${outletId}`,{favorite:originalFavorites.includes(outletId)});
    await context.request.post(`${base}/api/orders/${order.id}/project`,{headers:{origin:base},data:{projectId:order.project_id}});
  }
  const publisher=accounts.find(a=>a.role==='publisher');
  await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:publisher.email,password:publisher.password}});
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(base+'/publisher/settings');
    const section=page.locator('div').filter({has:page.getByRole('heading',{name:'Безопасность',exact:true})}).filter({has:page.getByRole('button',{name:'Сменить пароль'})}).last();
    await page.getByLabel('Текущий пароль').waitFor();
    await page.getByLabel('Текущий пароль').scrollIntoViewIfNeeded();
    assert.equal(await page.getByLabel('Текущий пароль').inputValue(),'');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`/tmp/axioma-security-${width}.png`});
  }
  assert.deepEqual(errors,[]);
  console.log('Favorites, saved limits, dashboard order project persistence and security layouts verified; original data restored');
} finally {await browser.close();}
