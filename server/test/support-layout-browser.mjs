import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const accounts=JSON.parse(await readFile('.local-demo-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
const base='http://127.0.0.1:5173';
try {
  for(const role of ['customer','publisher']) {
    const account=accounts.find(item=>item.role===role),context=await browser.newContext(),page=await context.newPage();
    page.setDefaultTimeout(15000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    assert.equal((await context.request.post(`${base}/api/auth/login`,{headers:{origin:base},data:{email:account.email,password:account.password}})).status(),200);
    for(const [width,height] of [[1440,1000],[390,844]]) {
      await page.setViewportSize({width,height});
      await page.goto(`${base}/${role}/support`);
      try { await page.getByRole('heading',{name:'Поддержка',exact:true}).waitFor(); }
      catch(error) { console.error(role,width,errors,await page.locator('body').innerText()); throw error; }
      await page.getByRole('button',{name:'Тикеты',exact:true}).waitFor();
      await page.getByRole('button',{name:'Жалобы и споры',exact:true}).waitFor();
      await page.getByText('Список тикетов',{exact:true}).waitFor();
      try { await page.getByLabel('Сообщение менеджеру').waitFor(); }
      catch(error) { console.error(role,width,await page.locator('body').innerText()); await page.screenshot({path:`/tmp/axioma-support-failure-${role}-${width}.png`,fullPage:true}); throw error; }
      await page.getByRole('button',{name:'Прикрепить файл',exact:true}).waitFor();
      const ownMessages=page.locator('[data-message-owner="self"]'),receivedMessages=page.locator('[data-message-owner="other"]');
      if(!await ownMessages.count()) {
        const ticketButtons=page.locator('aside > div:nth-child(2) > button');
        for(let index=0;index<await ticketButtons.count()&&!await ownMessages.count();index++)await ticketButtons.nth(index).click();
      }
      assert.ok(await ownMessages.count(),'At least one demo ticket must contain a message from the current user');
      assert.ok(await ownMessages.first().evaluate(node=>node.classList.contains('ml-auto')));
      if(await receivedMessages.count())assert.equal(await receivedMessages.first().evaluate(node=>node.classList.contains('ml-auto')),false);
      await page.getByRole('button',{name:'Создать тикет',exact:true}).click();
      await page.getByRole('heading',{name:'Новый тикет',exact:true}).waitFor();
      await page.getByRole('button',{name:'Отмена',exact:true}).click();
      await page.getByRole('button',{name:'Жалобы и споры',exact:true}).click();
      await page.getByRole('heading',{name:'Жалобы и споры',exact:true}).waitFor();
      await page.getByRole('button',{name:'Перейти к заказам',exact:true}).waitFor();
      await page.screenshot({path:`/tmp/axioma-disputes-${role}-${width}.png`,fullPage:true});
      const openDispute=page.getByRole('button',{name:'Открыть',exact:true}).first();
      if(await openDispute.count()) {
        await openDispute.click();
        await page.getByRole('heading',{name:/Спор #C-020/}).waitFor();
        await page.getByRole('heading',{name:'Что происходит сейчас',exact:true}).waitFor();
        await page.screenshot({path:`/tmp/axioma-dispute-card-${role}-${width}.png`,fullPage:true});
        await page.goto(`${base}/${role}/support`);
      }
      await page.getByRole('button',{name:'Тикеты',exact:true}).click();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:`/tmp/axioma-support-${role}-${width}.png`,fullPage:true});
    }
    await context.close();
  }
  console.log('Original support layout verified for customer and publisher on desktop and mobile');
} finally {await browser.close();}
