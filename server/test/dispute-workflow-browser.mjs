import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const base='http://127.0.0.1:5173';
const browser=await chromium.launch({headless:true,channel:'chrome'});

try {
  const sessions={};
  for(const role of ['customer','publisher','admin']) {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const account=accounts.find(item=>item.role===role);
    const login=await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password,expectedRole:role}});
    assert.equal(login.status(),200);
    sessions[role]={context,page:await context.newPage()};
  }

  const customer=sessions.customer.context.request;
  const publisher=sessions.publisher.context.request;
  const admin=sessions.admin.context.request;
  const post=(request,url,data,idempotent=false)=>request.post(url,{data,headers:{origin:base,...(idempotent?{'Idempotency-Key':randomUUID()}: {})}});
  const publisherUser=await (await publisher.get(`${base}/api/auth/me`)).json();
  const outlets=await (await customer.get(`${base}/api/outlets`)).json();
  const outlet=outlets.find(item=>item.owner_id===publisherUser.id&&item.active&&item.status==='approved'&&item.prices?.article);
  assert.ok(outlet,'An approved publisher outlet with an article tariff is required');

  const title=`Browser dispute ${Date.now()}`;
  const materialResponse=await post(customer,`${base}/api/materials/save-batch`,{items:[{clientKey:randomUUID(),title,body:'<p>Материал для проверки полного решения спора.</p>',format:'article',metadata:{}}],submit:false,expedited:false},true);
  assert.equal(materialResponse.status(),200);
  const {ids:[materialId]}=await materialResponse.json();
  assert.equal((await post(customer,`${base}/api/materials/submit`,{ids:[materialId],expedited:false},true)).status(),200);
  assert.equal((await post(admin,`${base}/api/moderation/${materialId}`,{approved:true})).status(),200);
  const orderResponse=await post(customer,`${base}/api/orders`,{materialId,placements:[{outletId:outlet.id,format:'article'}],autoAccept:false},true);
  assert.equal(orderResponse.status(),200);
  const [order]=await orderResponse.json();
  assert.equal((await post(publisher,`${base}/api/orders/${order.id}/action`,{action:'accept'},true)).status(),200);
  assert.equal((await post(publisher,`${base}/api/orders/${order.id}/action`,{action:'publish',url:'https://example.test/browser-dispute',markingConfirmed:true},true)).status(),200);
  const disputeResponse=await post(customer,`${base}/api/orders/${order.id}/action`,{action:'dispute',reason:'Проверка полной выплаты через интерфейс'},true);
  assert.equal(disputeResponse.status(),200);
  const dispute=await disputeResponse.json();

  const page=sessions.admin.page;
  page.setDefaultTimeout(15000);
  await page.goto(`${base}/admin/complaints`);
  await page.getByRole('heading',{name:'Жалобы и споры',exact:true}).first().waitFor();
  assert.equal(await page.getByRole('button',{name:'Тикеты',exact:true}).count(),0);
  assert.equal(await page.getByText('Новая жалоба',{exact:true}).count(),0);
  const disputeText=`#C-${String(dispute.dispute_number).padStart(4,'0')} · Заказ №${order.number} · ${outlet.name}`;
  const row=page.getByText(disputeText,{exact:true}).locator('..').locator('..');
  await row.getByRole('button',{name:'Открыть',exact:true}).click();
  await page.getByRole('heading',{name:new RegExp(`Спор #C-${String(dispute.dispute_number).padStart(4,'0')}`)}).waitFor();
  await page.getByPlaceholder('Обоснование решения обязательно и будет доступно обеим сторонам').fill('Площадка выполнила обязательства полностью.');
  await page.getByRole('button',{name:'Полная выплата',exact:true}).click();
  await page.getByRole('heading',{name:'Жалобы и споры',exact:true}).first().waitFor();
  const resolvedRow=page.getByText(disputeText,{exact:true}).locator('..').locator('..');
  await resolvedRow.getByText('решен',{exact:true}).waitFor();
  await page.reload();
  await page.getByText(disputeText,{exact:true}).waitFor();
  await page.screenshot({path:'/tmp/axioma-admin-disputes.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/tmp/axioma-admin-disputes-mobile.png',fullPage:true});
  await page.goto(`${base}/admin/support`);
  await page.getByRole('heading',{name:'Поддержка',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Жалобы и споры',exact:true}).count(),0);
  assert.equal(await page.getByText('Новая жалоба',{exact:true}).count(),0);

  const orders=await (await admin.get(`${base}/api/orders`)).json();
  const resolved=orders.find(item=>item.id===order.id);
  assert.equal(resolved.status,'completed');
  assert.equal(resolved.snapshot.disputeResolution.decision,'full_payout');
  assert.equal(resolved.snapshot.disputeResolution.publisherAmount,resolved.amount);
  console.log('Admin dispute list and full payout resolution verified end to end');
} finally {
  await browser.close();
}
