import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const accounts=JSON.parse(await readFile('.local-accounts.json','utf8'));
const browser=await chromium.launch({headless:true,channel:'chrome'});
try {
  for(const account of accounts) {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    await page.goto('http://127.0.0.1:5173/');
    assert.equal(await page.getByText('Вход для администратора',{exact:true}).count(),0);
    if(account.role==='admin')await page.goto('http://127.0.0.1:5173/admin/login');
    else {
      await page.getByRole('button',{name:'Вход',exact:true}).first().click();
      assert.equal(await page.getByRole('button',{name:'Администратор',exact:true}).count(),0);
      await page.getByRole('button',{name:'Паблишер',exact:true}).click();
    }
    await page.locator('input[autocomplete=username]').fill(account.email);
    await page.locator('input[autocomplete=current-password]').fill(account.password);
    await page.getByRole('button',{name:'Войти',exact:true}).last().click();
    await page.locator('aside').getByText(account.email,{exact:true}).waitFor();
    const me=await page.request.get('http://127.0.0.1:5173/api/auth/me');
    assert.equal((await me.json()).role,account.role);
    assert.equal(new URL(page.url()).pathname,`/${account.role}`);
    await page.reload();
    await page.locator('aside').getByText(account.email,{exact:true}).waitFor();
    await page.screenshot({path:`/tmp/axioma-${account.role}.png`});
    await context.close();
  }
  console.log('Publisher and admin login checks passed');
} finally {await browser.close();}
