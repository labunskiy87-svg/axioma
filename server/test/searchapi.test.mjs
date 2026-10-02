import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {buildApp,createUser} from '../app.mjs';
import {migrate} from '../db.mjs';
import {collectReputationScan} from '../reputation-worker.mjs';
import {searchApiGoogle,searchApiAiMode,testSearchApiIntegration} from '../searchapi.mjs';

test('SearchAPI collects 100 results with unquoted queries, absolute ranks and Markdown',async()=>{
  const pages=[];
  const result=await searchApiGoogle('Николаев Станислав Юрьевич','Москва',{apiKey:'private-key'},async(url,options)=>{
    const params=new URL(url).searchParams,page=Number(params.get('page'));pages.push(page);
    assert.equal(params.get('q'),'Николаев Станислав Юрьевич');
    assert.equal(params.get('location'),'Moscow,Russia');
    assert.equal(params.get('hl'),'ru');assert.equal(params.get('gl'),'ru');
    assert.equal(params.has('api_key'),false);assert.equal(options.headers.Authorization,'Bearer private-key');
    return Response.json({search_metadata:{status:'Success',id:'search-1'},organic_results:Array.from({length:10},(_,index)=>({link:`https://example.org/${(page-1)*10+index+1}`,title:`Материал [${index}]`,snippet:'Очищенный сниппет',position:index+1}))});
  });
  assert.deepEqual(pages,[1,2,3,4,5,6,7,8,9,10]);
  assert.equal(result.items.length,100);assert.equal(result.items[99].position,100);
  assert.match(result.markdown,/100\. \[Материал/);assert.doesNotMatch(JSON.stringify(result),/private-key/);
});

test('SearchAPI keeps collected pages on a later failure and deduplicates normalized URLs',async()=>{
  let page=0;
  const result=await searchApiGoogle('Бренд','Москва',{apiKey:'secret'},async()=>{
    if(++page===2)return Response.json({}, {status:503});
    return Response.json({organic_results:[{link:'https://example.org/story#a',title:'Статья'},{link:'https://example.org/story#b',title:'Копия'}],pagination:{next:'https://google.com/search?start=10'}});
  });
  assert.equal(result.items.length,1);assert.match(result.pageError,/HTTP 503/);
});

test('SearchAPI publication date filters preserve unquoted queries',async()=>{
  for(const periodDays of [7,14,30])await searchApiGoogle('Бренд','Санкт-Петербург',{apiKey:'secret'},async url=>{
    const params=new URL(url).searchParams;
    assert.equal(params.get('q'),'Бренд');assert.equal(params.has('verbatim'),false);
    if(periodDays===14){assert.match(params.get('time_period_min'),/^\d{1,2}\/\d{1,2}\/\d{4}$/);assert.ok(params.get('time_period_max'));}
    else assert.equal(params.get('time_period'),periodDays===7?'last_week':'last_month');
    return Response.json({search_metadata:{status:'Success'},organic_results:[]});
  },{pages:1,periodDays});
});

test('SearchAPI AI Mode retains Markdown and resolved reference URLs',async()=>{
  const answer=await searchApiAiMode('Все запросы: ФИО; ФИО Меркатор','Москва',{apiKey:'secret'},async url=>{
    const params=new URL(url).searchParams;
    assert.equal(params.get('engine'),'google_ai_mode');assert.equal(params.get('q'),'Все запросы: ФИО; ФИО Меркатор');
    return Response.json({markdown:'Ответ со [ссылкой](https://example.org/story).',reference_links:[{index:0,link:'https://example.org/story',title:'Статья'},{link:'javascript:alert(1)'}]});
  });
  assert.equal(answer.sources.length,1);assert.equal(answer.sources[0].url,'https://example.org/story');
  assert.match(answer.markdown,/\[ссылкой\]/);
  const checks=await testSearchApiIntegration('secret',async url=>new URL(url).searchParams.get('engine')==='google'?Response.json({organic_results:[]}):Response.json({error:'private provider details'}));
  assert.deepEqual(checks.map(x=>x.status),['success','failed']);
  assert.doesNotMatch(JSON.stringify(checks),/private provider details/);
});

test('monitoring prefers SearchAPI and sends each key separately before one shared Google AI prompt',async()=>{
  const requests=[],queries=['Николаев Станислав Юрьевич','Станислав Николаев Меркатор'];
  const result=await collectReputationScan({name:queries[0],type:'person',region:'Москва',periodDays:30,queries,profile:{},officialSources:[]},{integrations:{searchapi:{apiKey:'new-key'},serpapi:{apiKey:'old-key'}},fetchImpl:async url=>{
    assert.equal(new URL(url).host,'www.searchapi.io');
    const params=new URL(url).searchParams;requests.push(Object.fromEntries(params));
    if(params.get('engine')==='google_ai_mode')return Response.json({markdown:'Сводный ответ Google AI',reference_links:[{link:'https://example.org/story'}]});
    const page=Number(params.get('page'));
    return Response.json({search_metadata:{status:'Success'},organic_results:Array.from({length:10},(_,index)=>({link:`https://example.org/${params.get('q').includes('Юрьевич')?'full':'brand'}-${page}-${index}`,title:'Материал',snippet:'Текст',position:index+1}))});
  }});
  assert.deepEqual(result.searches.map(x=>x.items.length),[100,100]);
  assert.deepEqual(result.publicationSearches.map(x=>x.items.length),[100,100]);
  for(const query of queries)assert.equal(requests.filter(x=>x.q===query&&!x.time_period).length,10);
  const ai=requests.filter(x=>x.engine==='google_ai_mode');assert.equal(ai.length,1);
  assert.ok(queries.every(q=>ai[0].q.includes(q)));assert.match(ai[0].q,/до 1000 символов/);
  assert.equal(result.publicationSearches.length,2);assert.equal(result.googleAi[0].sources[0].url,'https://example.org/story');
  assert.equal(result.availability.googleAi,'success');assert.match(result.searches[0].markdown,/https:\/\/example.org/);
});

test('SearchAPI integration encrypts the key and records both service checks',async()=>{
  const pg=new PGlite(),wrap=client=>({query:async(sql,args)=>args?client.query(sql,args):(await client.exec(sql)).at(-1)});
  const db={...wrap(pg),transaction:fn=>pg.transaction(tx=>fn(wrap(tx)))};let app;
  try {
    await migrate(db);const user=await db.transaction(tx=>createUser(tx,`${randomUUID()}@example.test`,'test-password-long','admin'));
    app=await buildApp({db,fetchImpl:async url=>Response.json(new URL(url).searchParams.get('engine')==='google_ai_mode'?{markdown:'Google AI ответ'}:{organic_results:[]})});
    const origin='http://127.0.0.1:5173';
    const login=await app.inject({method:'POST',url:'/api/auth/login',headers:{origin},payload:{email:user.email,password:'test-password-long'}});
    assert.equal(login.statusCode,200);const headers={origin,cookie:login.headers['set-cookie'].split(';')[0]};
    const key='searchapi-private-test-key';
    const saved=await app.inject({method:'PUT',url:'/api/admin/reputation/integrations/searchapi',headers,payload:{apiKey:key,enabled:true,settings:{}}});
    assert.equal(saved.statusCode,200);assert.doesNotMatch(saved.body,new RegExp(key));
    const checked=await app.inject({method:'POST',url:'/api/admin/reputation/integrations/searchapi/test',headers,payload:{}});
    assert.equal(checked.statusCode,200);assert.equal(checked.json().status,'success');assert.equal(checked.json().checks.length,2);
    const stored=(await db.query("SELECT encrypted_secret,test_details FROM reputation_integrations WHERE provider='searchapi'")).rows[0];
    assert.notEqual(stored.encrypted_secret,key);assert.equal(stored.test_details.length,2);
  } finally {await app?.close();await pg.close();}
});
