import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {buildApp,createUser} from '../app.mjs';
import {migrate} from '../db.mjs';
import {processNextReputationScan} from '../reputation-worker.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const base='http://127.0.0.1:5173';
const longUrl='https://repost.news/news/12030-krestnyj_otets_tenevogo_rossijskogo_biznesa__predsedatelj_soveta_direktorov_merkator_stanislav_nikolaev';
const pg=new PGlite();
const wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
const db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx)))};
let app,browser;
try {
  await migrate(db);
  const user=await db.transaction(tx=>createUser(tx,`customer-${randomUUID()}@example.test`,'browser-test-password','customer'));
  const admin=await db.transaction(tx=>createUser(tx,`admin-${randomUUID()}@example.test`,'browser-test-password','admin'));
  const fetchImpl=async(url,options={})=>{
    if(String(url).endsWith('/web/search'))return Response.json({rawData:Buffer.from(`<yandexsearch><response><results><grouping><group><doc><url>${longUrl}</url><title>Крестный отец теневого российского бизнеса — председатель совета директоров</title></doc></group></grouping></results></response></yandexsearch>`).toString('base64')});
    if(String(url).endsWith('/gen/search'))return Response.json({message:{content:'Ответ Алисы'}});
    if(String(url).endsWith('/wordstat/topRequests'))return Response.json({totalCount:0});
    if(String(url).startsWith('https://serpapi.com/search.md'))return new Response(new URL(url).searchParams.get('engine')==='google_ai_mode'?'---\nstatus: Success\n---\nGoogle AI: ответ о тестовой марке. [0]\n\nЕсли нужны подробности, дайте знать.\n\n## References\n\n[0] [Источник](https://example.org/story) — описание источника.':'# Google results');
    if(String(url).startsWith('https://serpapi.com/search.json'))return Response.json({search_metadata:{id:'search-1'},organic_results:[{link:longUrl,title:'Крестный отец теневого российского бизнеса — председатель совета директоров',snippet:'Текст публикации',position:1,date:'20240611T054603'},...[2,3,4,5,6].map(position=>({link:`https://example.org/article-${position}`,title:`Проверенный материал ${position}`,snippet:'Текст публикации',position})),{link:'https://zachestnyibiznes.ru/fl/123',title:'Справочная карточка',snippet:'Сведения реестра',position:8}]});
    if(String(url).endsWith('/scrape'))return Response.json({success:true,data:{markdown:'Текст публикации о тестовой марке',metadata:{}}});
    if(String(url).endsWith('/chat/completions')){
      const format=JSON.parse(options.body).response_format?.json_schema?.name;
      if(format==='reputation_preselection')return Response.json({model:'model-test',choices:[{message:{content:JSON.stringify({results:JSON.parse(JSON.parse(options.body).messages[1].content).items.map(item=>({url:item.url,decision:'include',confidence:0.9,reason:'Релевантный текст'}))})}}]});
      if(['reputation_negative_topics','reputation_material_topics'].includes(format)) {
        const articles=JSON.parse(JSON.parse(options.body).messages[1].content).articles;
        return Response.json({model:'model-test',choices:[{message:{content:JSON.stringify({topics:[{name:'Обвинения по контрактам',description:'Содержательный сюжет из текстов',materialUrls:articles.map(item=>item.url),...(format==='reputation_material_topics'?{importance:90,tone:'negative'}:{})}]})}}]});
      }
      const content=format==='reputation_analysis'?JSON.stringify({relevance:'relevant',sourceType:'media',significant:true,sentiment:'negative',topics:['Тестовая марка'],claims:[],risk:'high',confidence:0.9,summary:'Содержательный материал'}):format==='reputation_synthesis'?JSON.stringify({assessment:'Репутация тестовой марки в найденном материале нейтральная.',risk:'low',mainTopic:'Тестовая марка',mainChange:'Подтвержденного изменения репутационного фона за выбранный период не установлено; найденные публикации требуют проверки в сравнении с предыдущим снимком.',riskSource:'Публикации с атрибутированными утверждениями о тестовой марке, которые следует проверять по первичным источникам.',nextStep:'Проверить первоисточники утверждений, сопоставить их с прошлыми результатами и продолжить наблюдение за поисковой выдачей.',topics:[{name:'Тестовая марка',importance:90,tone:'neutral',description:'Сведения о тестовой марке в найденной публикации'}],recommendations:[]}):'Краткий ответ о тестовой марке';
      return Response.json({model:'model-test',choices:[{message:{content}}]});
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  app=await buildApp({db,fetchImpl});
  const login=async account=>{
    const response=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin:base},payload:{email:account.email,password:'browser-test-password'}});
    assert.equal(response.statusCode,200,response.body);return response.headers['set-cookie'].split(';')[0];
  };
  const cookie=await login(user),adminCookie=await login(admin);
  const inject=async(method,url,payload,who=cookie)=>{
    const response=await app.inject({method,url,headers:{cookie:who,origin:base,'idempotency-key':randomUUID()},payload});
    assert.ok(response.statusCode<300,response.body);return response.json();
  };
  await inject('PUT','/api/admin/reputation/integrations/serpapi',{apiKey:'browser-serpapi-key',enabled:true,settings:{}},adminCookie);
  await inject('PUT','/api/admin/reputation/integrations/yandex_search',{apiKey:'browser-yandex-key',enabled:true,settings:{folderId:'folder'}},adminCookie);
  await inject('PUT','/api/admin/reputation/integrations/firecrawl',{apiKey:'browser-firecrawl-key',enabled:true,settings:{}},adminCookie);
  await inject('PUT','/api/admin/reputation/integrations/openrouter',{apiKey:'browser-openrouter-key',enabled:true,settings:{model:'model-test'}},adminCookie);
  const subject=await inject('POST','/api/reputation/subjects',{name:'Тестовая марка',type:'Бренд',queries:['Тестовая марка'],region:'Москва',periodDays:30,officialSources:[]});
  await inject('POST',`/api/reputation/subjects/${subject.id}/scans`,{});
  assert.equal((await processNextReputationScan(db,{fetchImpl})).status,'completed');
  browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const [width,height] of [[1440,900],[1180,900],[390,844]]) {
    const context=await browser.newContext({viewport:{width,height}});
    await context.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url());
      const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie},payload:request.postData()??undefined});
      await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
    });
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(`${base}/customer/reputation`);
    await page.getByText('Тестовая марка',{exact:true}).first().waitFor();
    await page.getByText('Общая оценка репутации',{exact:true}).first().waitFor();
    await page.getByText('Репутация тестовой марки в найденном материале нейтральная.',{exact:true}).waitFor();
    for(const label of ['Хронология сигнала','Структура спроса'])assert.equal(await page.getByRole('heading',{name:label,exact:true}).count(),0);
    const presence=page.getByRole('heading',{name:'Каналы присутствия'}).locator('..').locator('..');
    assert.equal(await presence.getByText('Поиск',{exact:true}).locator('..').getByText('6',{exact:true}).count(),1);
    assert.equal(await page.getByText(/Часть найденных URL не вошла в анализ/).count(),0);
    assert.equal(await page.getByText('12 430',{exact:true}).count(),0);
    assert.equal(await page.getByText('1,4 млн',{exact:true}).count(),0);
    assert.equal(await page.getByText('Не подключен',{exact:true}).count()>0,true);
    await page.screenshot({path:`/tmp/pr-market-reputation-${width}.png`,fullPage:true});
    for(const label of ['Главное изменение','Источник риска','Следующий шаг'])assert.equal(await page.getByText(label,{exact:true}).count(),0);
    await page.screenshot({path:`/tmp/pr-market-reputation-assessment-${width}.png`});
    await page.getByRole('button',{name:'Аналитика',exact:true}).click();
    assert.equal(await page.getByRole('main').getByRole('button',{name:'Каналы',exact:true}).count(),0);
    await page.getByRole('main').getByRole('button',{name:'Материалы',exact:true}).click();
    await page.getByText('Крестный отец теневого российского бизнеса — председатель совета директоров',{exact:true}).first().waitFor();
    const materialButton=page.getByText('Крестный отец теневого российского бизнеса — председатель совета директоров',{exact:true}).first().locator('xpath=ancestor::button[1]');
    assert.doesNotMatch(await materialButton.innerText(),/#1|20240611T054603/);
    assert.equal(await materialButton.getByText('Яндекс',{exact:true}).count(),1);
    assert.equal(await materialButton.getByText('Google',{exact:true}).count(),1);
    await page.getByText('6 значимых текстовых материалов из Top-100 поисковой выдачи',{exact:true}).waitFor();
    const materialBox=await materialButton.boundingBox();
    const badgeBox=await materialButton.getByText('Негативная',{exact:true}).boundingBox();
    assert.ok(badgeBox.x>materialBox.x+materialBox.width/2);
    assert.equal(await page.getByText(longUrl,{exact:true}).count(),0);
    const sourceLink=page.getByRole('link',{name:'Открыть источник: repost.news'});
    assert.equal(await sourceLink.count(),1);
    assert.equal(await sourceLink.getAttribute('href'),longUrl);
    await page.screenshot({path:`/tmp/pr-market-reputation-analytics-${width}.png`,fullPage:true});
    await sourceLink.scrollIntoViewIfNeeded();
    const sourceBox=await sourceLink.boundingBox();
    assert.ok(sourceBox&&sourceBox.x>=0&&sourceBox.x+sourceBox.width<=width+1);
    await page.screenshot({path:`/tmp/pr-market-reputation-detail-${width}.png`});
    await page.getByRole('button',{name:'Следующая страница'}).click();
    await page.getByText('Проверенный материал 6',{exact:true}).first().waitFor();
    assert.equal(await page.getByRole('button').filter({hasText:'Справочная карточка'}).count(),0);
    await page.getByRole('button',{name:'Темы',exact:true}).click();
    await page.getByRole('heading',{name:'Обвинения по контрактам',exact:true}).waitFor();
    assert.equal(await page.getByText('90',{exact:true}).count(),1);
    await page.getByRole('button',{name:'Поисковая выдача',exact:true}).click();
    await page.getByRole('tab',{name:'Google AI'}).click();
    await page.getByText('Google AI: ответ о тестовой марке.').waitFor();
    await page.getByText('Источники в ответе',{exact:true}).waitFor();
    assert.equal(await page.getByRole('heading',{name:'References',exact:true}).count(),0);
    assert.equal(await page.getByText('Если нужны подробности, дайте знать.',{exact:true}).count(),0);
    assert.equal(await page.getByRole('tabpanel').getByRole('link',{name:'1',exact:true}).getAttribute('href'),'https://example.org/story');
    assert.equal(await page.getByText('Источник: SerpApi',{exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'Показать полностью'}).count(),0);
    assert.equal(await page.getByRole('link',{name:'example.org'}).count(),1);
    await page.screenshot({path:`/tmp/pr-market-reputation-google-ai-${width}.png`});
    await page.getByRole('main').getByRole('tab',{name:'Google',exact:true}).click();
    await page.getByText('repost.news',{exact:true}).first().waitFor();
    const referenceRow=page.getByRole('link',{name:/Справочная карточка/});
    assert.match(await referenceRow.innerText(),/Нейтральный/);
    await page.screenshot({path:`/tmp/pr-market-reputation-serp-${width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Негатив',exact:true}).click();
    await page.getByText('Влияющие на цифровой портрет',{exact:true}).waitFor();
    await page.getByRole('heading',{name:'Тематики негатива'}).waitFor();
    assert.match(await page.getByRole('img',{name:/Обвинения по контрактам: 100%/}).getAttribute('style'),/conic-gradient/);
    assert.equal(await page.getByText('Прочие',{exact:true}).count(),0);
    const chartBox=await page.getByRole('heading',{name:'Тематики негатива'}).locator('..').boundingBox();
    const publicationsBox=await page.getByRole('heading',{name:'Негативные публикации'}).locator('..').locator('..').boundingBox();
    if(width>=1024) {
      assert.ok(Math.abs(chartBox.y-publicationsBox.y)<2,'Desktop chart must remain beside the publication list');
      assert.ok(chartBox.x>publicationsBox.x,'Desktop chart must be on the right');
    } else assert.ok(chartBox.y<publicationsBox.y,'Mobile chart must precede the publication list');
    await page.getByRole('heading',{name:'Тематики негатива'}).locator('..').screenshot({path:`/tmp/pr-market-reputation-negative-chart-${width}.png`});
    await page.screenshot({path:`/tmp/pr-market-reputation-negative-${width}.png`,fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    assert.deepEqual(errors,[]);
    await context.close();
  }
  const profileUser=await db.transaction(tx=>createUser(tx,`profile-${randomUUID()}@example.test`,'browser-test-password','customer'));
  const profileCookie=await login(profileUser);
  const fullName='Николаев Станислав Юрьевич';
  const profileSubject=await inject('POST','/api/reputation/subjects',{name:fullName,type:'Человек',queries:[fullName],region:'Москва',periodDays:30,officialSources:[]},profileCookie);
  const profileScan=await inject('POST',`/api/reputation/subjects/${profileSubject.id}/scans`,{},profileCookie);
  await db.query("UPDATE reputation_scans SET status='running',started_at=now() WHERE id=$1",[profileScan.id]);
  for(const [width,height] of [[1440,900],[390,844]]) {
    const context=await browser.newContext({viewport:{width,height}});
    await context.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url());
      const response=await app.inject({method:request.method(),url:url.pathname+url.search,headers:{...request.headers(),cookie:profileCookie},payload:request.postData()??undefined});
      await route.fulfill({status:response.statusCode,headers:{'content-type':response.headers['content-type']??'application/json'},body:response.body});
    });
    const page=await context.newPage();
    await page.goto(`${base}/customer/reputation`);
    await page.getByRole('button',{name:'Идет сканирование'}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Сканирование в очереди'}).count(),0);
    await page.getByRole('status',{name:'Идет сканирование'}).waitFor();
    assert.equal(await page.locator('.reputation-scan-progress').evaluate(element=>getComputedStyle(element).animationName),'reputation-scan-sweep');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`/tmp/pr-market-reputation-running-${width}.png`,fullPage:true});
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.reputation-scan-progress').evaluate(element=>getComputedStyle(element).animationName),'none');
    await page.getByRole('button',{name:'Настройки мониторинга'}).click();
    await page.getByRole('heading',{name:'Настройки мониторинга'}).waitFor();
    assert.equal(await page.getByRole('textbox',{name:/Официальный сайт или профиль/}).count(),width===1440?1:2);
    assert.equal(await page.getByText('По одному адресу в строке.',{exact:true}).count(),0);
    const officialBox=await page.getByRole('heading',{name:'Официальные сайты и профили'}).boundingBox();
    const regionBox=await page.getByRole('heading',{name:'Регион поиска'}).boundingBox();
    const periodBox=await page.getByRole('heading',{name:'Период публикаций'}).boundingBox();
    assert.ok(officialBox.y<regionBox.y&&regionBox.y<periodBox.y);
    const queryAddBox=await page.getByRole('button',{name:'Добавить запрос'}).boundingBox();
    const officialAddBox=await page.getByRole('button',{name:'Добавить адрес'}).boundingBox();
    assert.ok(Math.abs(queryAddBox.x+queryAddBox.width-officialAddBox.x-officialAddBox.width)<2,JSON.stringify({width,queryAddBox,officialAddBox}));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.screenshot({path:`/tmp/pr-market-reputation-settings-${width}.png`,fullPage:true});
    if(width===1440){
      await page.getByRole('textbox',{name:'Официальный сайт или профиль 1'}).fill('https://example.org');
      await page.getByRole('button',{name:'Добавить адрес'}).click();
      await page.getByRole('textbox',{name:'Официальный сайт или профиль 2'}).fill('https://example.net');
      await page.getByRole('button',{name:'Удалить официальный сайт или профиль 2'}).click();
      await page.getByRole('button',{name:'Добавить адрес'}).click();
      await page.getByRole('textbox',{name:'Официальный сайт или профиль 2'}).fill('https://example.net');
      await page.getByRole('button',{name:'Сохранить настройки'}).click();
      const subjects=await inject('GET','/api/reputation/subjects',undefined,profileCookie);
      assert.deepEqual(subjects.find(item=>item.id===profileSubject.id).officialSources,['https://example.org','https://example.net']);
    }
    await context.close();
  }
} finally {await browser?.close();await app?.close();await pg.close();}
