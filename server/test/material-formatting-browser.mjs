import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const account=JSON.parse(await readFile('.local-demo-accounts.json','utf8')).find(row=>row.role==='customer');
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  const context=await browser.newContext();
  assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}})).status(),200);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const original=(await (await context.request.get(`${base}/api/materials`)).json()).find(row=>row.number===1151);
  assert.ok(original);
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(`${base}/customer/materials`);
    await page.getByText(original.title,{exact:true}).first().click();
    const body=page.locator('.material-content');await body.waitFor();
    const styles=await body.evaluate(node=>({heading:getComputedStyle(node.querySelector('h2')).fontFamily,margin:getComputedStyle(node.querySelector('p')).marginBottom,link:getComputedStyle(node.querySelector('a')).color,decoration:getComputedStyle(node.querySelector('a')).textDecorationLine}));
    assert.doesNotMatch(styles.heading,/Unbounded|Manrope/);
    assert.equal(styles.margin,'12px');assert.equal(styles.link,'rgb(0, 107, 255)');assert.equal(styles.decoration,'underline');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`/tmp/axioma-material-1151-${width}.png`,fullPage:true});
    for(const section of ['materials','projects','balance','topup']) {
      await page.evaluate(path=>{history.pushState(null,'',path);window.dispatchEvent(new PopStateEvent('popstate'));},`/customer/${section}`);
      await page.locator('.workspace-content > *').first().waitFor();
      const bounds=await page.locator('.workspace-content').evaluate(node=>{const child=node.firstElementChild;return {outer:node.getBoundingClientRect().x,inner:child.getBoundingClientRect().x,width:node.clientWidth,childWidth:child.getBoundingClientRect().width};});
      assert.ok(Math.abs(bounds.outer-bounds.inner)<1,section);
      assert.ok(Math.abs(bounds.width-bounds.childWidth)<1,section);
    }
  }
  const title=`QA typography ${randomUUID().slice(0,8)}`;
  const create=await context.request.post(`${base}/api/materials/batch`,{headers:{origin:base,'idempotency-key':randomUUID()},data:[{title,body:'<h2>Heading</h2><p>First paragraph</p><p><a href="https://example.test">Second paragraph</a></p>',format:'article',advertiserId:null,projectId:null,metadata:{}}]});
  assert.equal(create.status(),200,await create.text());
  const [sample]=await create.json();
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${base}/customer/materials`);
  await page.getByText(title,{exact:true}).click();
  await page.getByRole('button',{name:'Редактировать материал',exact:true}).click();
  const editor=page.getByRole('textbox',{name:'Текст материала'});await editor.waitFor();
  await editor.click();await page.keyboard.press('ArrowRight');
  await page.getByRole('button',{name:'Arial',exact:true}).click();
  await page.getByRole('option',{name:'Georgia',exact:true}).click();
  await page.getByRole('button',{name:'16 px',exact:true}).click();
  await page.getByRole('option',{name:'24 px',exact:true}).click();
  const spans=await editor.locator('span').evaluateAll(nodes=>nodes.map(node=>({font:node.style.fontFamily,size:node.style.fontSize})));
  assert.ok(spans.length>=3);assert.ok(spans.every(span=>span.font==='Georgia'&&span.size==='24px'));
  await page.getByRole('button',{name:'Сохранить изменения',exact:true}).click();
  await page.getByRole('button',{name:'Отправить на модерацию',exact:true}).click();
  await page.getByRole('button',{name:'Отозвать с модерации',exact:true}).waitFor();
  const saved=(await (await context.request.get(`${base}/api/materials`)).json()).find(row=>row.id===sample.id);
  assert.equal(saved.status,'pending');assert.match(saved.body,/font-family:Georgia/);assert.match(saved.body,/font-size:24px/);
  await page.getByRole('button',{name:'Отозвать с модерации',exact:true}).click();
  await page.getByRole('button',{name:'Отправить на модерацию',exact:true}).waitFor();
  await page.reload();
  const restored=(await (await context.request.get(`${base}/api/materials`)).json()).find(row=>row.id===sample.id);
  assert.equal(restored.status,'draft');assert.equal(restored.body,saved.body);
  const untouched=(await (await context.request.get(`${base}/api/materials`)).json()).find(row=>row.id===original.id);
  assert.equal(untouched.body,original.body);assert.equal(untouched.status,original.status);
  assert.deepEqual(errors,[]);
  console.log('Material 1151 layout, unified gutters, typography, submission and withdrawal verified');
} finally {await browser.close();}
