import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  let numbers;
  for(const account of accounts) {
    const context=await browser.newContext();const page=await context.newPage();
    await page.goto(`http://127.0.0.1:5173/${account.role}`);
    const res=await page.request.post('http://127.0.0.1:5173/api/auth/login',{headers:{origin:'http://127.0.0.1:5173'},data:{email:account.email,password:account.password,expectedRole:account.role}});
    assert.equal(res.status(),200);
    await page.goto(`http://127.0.0.1:5173/${account.role}/orders`);
    await page.locator('aside').getByText(account.email,{exact:true}).waitFor();
    const orders=await (await page.request.get('http://127.0.0.1:5173/api/orders')).json();
    for(const order of orders) assert.ok(Number.isInteger(order.number)&&order.number>=1001);
    const current=orders.map(o=>o.number).sort();
    if(numbers)assert.deepEqual(current,numbers);else numbers=current;
    assert.equal(new Set(current).size,current.length);
    await page.getByText(`№${orders[0].number}`,{exact:true}).first().waitFor();
    assert.equal(await page.getByText(orders[0].id,{exact:true}).count(),0);
    await page.screenshot({path:`/tmp/axioma-order-numbers-${account.role}.png`});
    await context.close();
  }
  console.log('Short order numbers verified across all three roles');
} finally {await browser.close();}
