import test from 'node:test';
import assert from 'node:assert/strict';
import { buildYandexPrompt,canonicalPersonName,collectReputationScan,isReferenceResult,needsIdentityReview,parseYandexResults } from '../reputation-worker.mjs';

const xml='<yandexsearch><response><results><grouping><group><doc><url>https://example.org/story</url><title>Заголовок</title><passages><passage>Сниппет</passage></passages></doc></group></grouping></results></response></yandexsearch>';
test('Yandex XML is decoded and normalized without losing the source URL',()=>{
  assert.deepEqual(parseYandexResults(Buffer.from(xml).toString('base64')),[{url:'https://example.org/story',title:'Заголовок',snippet:'Сниппет',position:1,date:null}]);
});
const analysis={relevance:'relevant',sourceType:'media',significant:true,sentiment:'neutral',topics:['Бренд'],claims:[],risk:'low',confidence:0.8,summary:'Краткий вывод'};
const synthesis={assessment:'Оценка на основе собранных материалов.',risk:'low',mainTopic:'Бренд',mainChange:'Нет предыдущего снимка',riskSource:'Не выявлен',nextStep:'Проверить источники',topics:[{name:'Бренд',importance:90,tone:'neutral',description:'Упоминания бренда в публикациях'}],recommendations:[]};
test('scan uses configured APIs, deduplicates URLs and never synthesizes unavailable sources',async()=>{
  const calls=[];
  let analysisPrompt='',synthesisPrompt='';
  const fetchImpl=async (url,options={})=>{
    calls.push(String(url));
    if(String(url).endsWith('/web/search'))return Response.json({rawData:Buffer.from(xml).toString('base64')});
    if(String(url).endsWith('/gen/search'))return Response.json([{message:{content:'Ответ Алисы'},sources:[{url:'https://example.org/story',used:true}]}]);
    if(String(url).endsWith('/wordstat/topRequests'))return Response.json({totalCount:'250',results:[{phrase:'Бренд отзывы',count:'40'}]});
    if(String(url).startsWith('https://serpapi.com/search.md'))return new Response(new URL(url).searchParams.get('engine')==='google_ai_mode'?'---\nstatus: Success\n---\n# Google AI answer':'# Google results');
    if(String(url).startsWith('https://serpapi.com/search.json')){assert.equal(new URL(url).searchParams.get('location'),'Moscow,Russia');return Response.json({organic_results:[{link:'https://example.org/story',title:'Заголовок',snippet:'Google сниппет',position:2}]});}
    if(String(url).endsWith('/scrape'))return Response.json({success:true,data:{markdown:'Полный текст публикации',metadata:{}}});
    if(String(url).endsWith('/chat/completions')){
      const request=JSON.parse(options.body);
      const name=request.response_format?.json_schema?.name;
      if(name==='reputation_analysis')analysisPrompt=request.messages[0].content;
      if(name==='reputation_synthesis')synthesisPrompt=request.messages[0].content;
      return Response.json({id:'chat-1',model:'model-test',choices:[{message:{content:name==='reputation_analysis'?JSON.stringify(analysis):name==='reputation_synthesis'?JSON.stringify(synthesis):'Ответ ChatGPT'}}]});
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const result=await collectReputationScan({name:'Бренд',type:'brand',region:'Москва',periodDays:30,queries:['Бренд'],profile:{},officialSources:[]},{fetchImpl,integrations:{yandex_search:{apiKey:'y',settings:{folderId:'folder'}},serpapi:{apiKey:'s',settings:{}},openrouter:{apiKey:'o',settings:{model:'model-test'}},firecrawl:{apiKey:'f'}}});
  assert.equal(result.materials.length,1);
  assert.equal(result.materials[0].discoveries.length,4);
  assert.equal(result.publicationSearches.length,2);
  assert.equal(result.materials[0].analysis.model,'model-test');
  assert.equal(result.wordstat.queries[0].totalCount,250);
  assert.equal(result.alice.text,'Ответ Алисы');
  assert.equal(result.materials[0].significant,true);
  assert.equal(result.assessment.assessment,synthesis.assessment);
  assert.equal(result.openaiAnswer.text,'Ответ ChatGPT');
  assert.equal(result.searches.find(item=>item.engine==='Google').markdown,'# Google results');
  assert.equal(result.googleAi[0].markdown,'# Google AI answer');
  assert.equal(result.availability.googleAi,'success');
  assert.equal(result.availability.telegram,'unavailable');
  assert.equal(result.availability.ahrefs,'unavailable');
  assert.equal(calls.filter(url=>url.endsWith('/chat/completions')).length,3);
  assert.match(analysisPrompt,/первое claims должно быть главным негативным утверждением автора/);
  assert.match(analysisPrompt,/ФИО, должность и связь с организацией используются только для идентификации/);
  assert.match(synthesisPrompt,/В topics\[\]\.name называй предмет обсуждения/);
  assert.match(synthesisPrompt,/не выдавай за факты/);
  assert.match(synthesisPrompt,/recommendations и nextStep — исключительно коммуникационные действия/);
  assert.match(synthesisPrompt,/Не предлагай судебные, юридические/);
});
test('Google AI Mode receives one synthesis prompt with all saved queries and no AI Overview token',async()=>{
  const queries=['Николаев Станислав Юрьевич','Николаев Станислав Юрьевич Меркатор'];
  const aiRequests=[];
  const fetchImpl=async url=>{
    const request=new URL(url);
    if(request.pathname==='/search.md'&&request.searchParams.get('engine')==='google_ai_mode'){
      aiRequests.push(request);
      return new Response('---\nstatus: Success\n---\nСводный ответ Google AI');
    }
    if(request.pathname==='/search.md')return new Response('# Google results');
    return Response.json({organic_results:[]});
  };
  const result=await collectReputationScan({name:queries[0],type:'person',region:'Москва',queries,profile:{},officialSources:[]},{integrations:{yandex_search:null,serpapi:{apiKey:'s'},openrouter:null,firecrawl:null},fetchImpl});
  assert.equal(aiRequests.length,1);
  assert.ok(queries.every(query=>aiRequests[0].searchParams.get('q').includes(query)));
  assert.match(aiRequests[0].searchParams.get('q'),/до 1000 символов/);
  assert.ok(!aiRequests[0].searchParams.get('q').includes(`"${queries[0]}"`));
  assert.ok(aiRequests.every(url=>url.searchParams.get('hl')==='ru'&&url.searchParams.get('gl')==='ru'));
  assert.deepEqual(result.googleAi.map(item=>item.markdown),['Сводный ответ Google AI']);
  assert.deepEqual(result.searches.map(item=>item.query),queries);
  assert.equal(result.availability.googleAi,'success');
});
test('Google organic search paginates to 50 distinct results while retaining the saved query',async()=>{
  const pages=[];
  const fetchImpl=async url=>{
    const request=new URL(url);
    if(request.pathname==='/search.md')return new Response('# Google results');
    if(request.searchParams.has('tbs'))return Response.json({organic_results:[]});
    const start=Number(request.searchParams.get('start'));
    pages.push(start);
    assert.equal(request.searchParams.get('q'),'"Тестовый бренд"');
    return Response.json({organic_results:Array.from({length:10},(_,index)=>({link:`https://example.org/story-${start+index+1}`,title:`Публикация ${start+index+1}`,snippet:'Текст',position:start+index+1}))});
  };
  const result=await collectReputationScan({name:'Тестовый бренд',type:'brand',region:'Москва',queries:['Тестовый бренд'],profile:{},officialSources:[]},{integrations:{yandex_search:null,serpapi:{apiKey:'s'},openrouter:null,firecrawl:null},fetchImpl});
  assert.deepEqual(pages,[0,10,20,30,40]);
  assert.equal(result.searches[0].items.length,50);
  assert.equal(result.searches[0].items[49].position,50);
  assert.equal(result.materials.length,50);
  assert.equal(result.evidence.serp[0].top10.length,10);
  assert.equal(result.searches[0].query,'Тестовый бренд');
});
test('source failure is reported while other sources still complete',async()=>{
  const result=await collectReputationScan({name:'Бренд',region:'Москва',queries:['Бренд'],officialSources:[]},{integrations:{yandex_search:{apiKey:'y',settings:{folderId:'f'}},serpapi:{apiKey:'s'},openrouter:null,firecrawl:null},fetchImpl:async url=>String(url).includes('yandex')?Response.json({}, {status:503}):Response.json({organic_results:[]})});
  assert.equal(result.availability.yandex,'failed');
  assert.equal(result.availability.google,'success');
  assert.ok(result.errors.length>=1);
});
test('Wordstat accepts zero phrase results with a valid total count',async()=>{
  const result=await collectReputationScan({name:'Бренд',region:'Москва',queries:['Бренд'],officialSources:[]},{integrations:{yandex_search:{apiKey:'y',settings:{folderId:'f'}},serpapi:null,openrouter:null,firecrawl:null},fetchImpl:async url=>String(url).endsWith('/web/search')?Response.json({rawData:Buffer.from(xml).toString('base64')}):String(url).endsWith('/gen/search')?Response.json({message:{content:''}}):Response.json({totalCount:'1'})});
  assert.equal(result.availability.wordstat,'success');
  assert.equal(result.wordstat.queries[0].totalCount,1);
});
test('Saint Petersburg is passed to Yandex search, Wordstat and Google',async()=>{
  const requests=[];
  const fetchImpl=async(url,options={})=>{
    requests.push({url:String(url),body:options.body?JSON.parse(options.body):null});
    if(String(url).endsWith('/web/search'))return Response.json({rawData:Buffer.from(xml).toString('base64')});
    if(String(url).endsWith('/gen/search'))return Response.json({message:{content:''}});
    if(String(url).endsWith('/wordstat/topRequests'))return Response.json({totalCount:0});
    return Response.json({organic_results:[]});
  };
  await collectReputationScan({name:'Бренд',region:'Санкт-Петербург',periodDays:30,queries:['Бренд'],officialSources:[]},{integrations:{yandex_search:{apiKey:'y',settings:{folderId:'f'}},serpapi:{apiKey:'s'},openrouter:null,firecrawl:null},fetchImpl});
  assert.equal(requests.find(item=>item.url.endsWith('/web/search')).body.region,'2');
  assert.deepEqual(requests.find(item=>item.url.endsWith('/wordstat/topRequests')).body.regions,['2']);
  assert.equal(new URL(requests.find(item=>item.url.startsWith('https://serpapi.com/')).url).searchParams.get('location'),'Saint Petersburg,Russia');
});
test('cache reuses extracted text and model output but refreshes search snapshots',async()=>{
  const stored=new Map(),calls=[];
  const cache={get:async key=>stored.get(key)??null,set:async(key,provider,value)=>{stored.set(key,value);}};
  const fetchImpl=async (url,options={})=>{
    calls.push(String(url));
    if(String(url).startsWith('https://serpapi.com/search.md'))return new Response('# Google results');
    if(String(url).startsWith('https://serpapi.com/'))return Response.json({organic_results:[{link:'https://example.org/story',title:'Заголовок',snippet:'Сниппет',position:1}]});
    if(String(url).endsWith('/scrape'))return Response.json({success:true,data:{markdown:'Полный текст',metadata:{}}});
    if(String(url).endsWith('/chat/completions')){
      const name=JSON.parse(options.body).response_format?.json_schema?.name;
      return Response.json({model:'model-test',choices:[{message:{content:name==='reputation_analysis'?JSON.stringify(analysis):name==='reputation_synthesis'?JSON.stringify(synthesis):'Ответ ChatGPT'}}]});
    }
    throw new Error('Unexpected request');
  };
  const input={name:'Бренд',type:'brand',region:'Москва',periodDays:30,queries:['Бренд'],officialSources:[],profile:{}};
  const options={integrations:{yandex_search:null,serpapi:{apiKey:'s'},openrouter:{apiKey:'o',settings:{model:'model-test'}},firecrawl:{apiKey:'f'}},fetchImpl,cache};
  await collectReputationScan(input,options);
  await collectReputationScan(input,options);
  assert.equal(calls.filter(url=>url.startsWith('https://serpapi.com/search.json')).length,4);
  assert.equal(calls.filter(url=>url.endsWith('/scrape')).length,1);
  assert.equal(calls.filter(url=>url.endsWith('/chat/completions')).length,3);
});
test('person prompt keeps every saved query and excludes namesakes',()=>{
  const prompt=buildYandexPrompt({name:'Иван Иванов',type:'person',queries:['Иванов Иван Иванович'],profile:{relation:'Компания А'}},['Иванов Иван Иванович','Иван Иван Иванович отзывы']);
  assert.match(prompt,/Иванов Иван Иванович/);
  assert.match(prompt,/Иван Иван Иванович отзывы/);
  assert.match(prompt,/Не смешивай сведения об однофамильцах/);
  assert.ok(prompt.includes('Компания А'));
  assert.equal(canonicalPersonName({name:'Станислав Николаев',type:'person',queries:['Николаев Станислав Юрьевич']}),'Николаев Станислав Юрьевич');
});
test('Yandex requests Top-100 with the whole full name and Wordstat uses saved phrases only',async()=>{
  const requests=[];
  const fetchImpl=async(url,options={})=>{
    requests.push({url:String(url),body:options.body?JSON.parse(options.body):null});
    if(String(url).endsWith('/web/search'))return Response.json({rawData:Buffer.from(xml).toString('base64')});
    if(String(url).endsWith('/gen/search'))return Response.json({message:{content:'Краткий ответ'}});
    return Response.json({totalCount:15});
  };
  const queries=['Иванов Иван Иванович','Иванов Иван Иванович отзывы'];
  const result=await collectReputationScan({name:queries[0],type:'person',region:'Москва',periodDays:30,queries,profile:{},officialSources:[]},{integrations:{yandex_search:{apiKey:'y',settings:{folderId:'folder'}},serpapi:null,openrouter:null,firecrawl:null},fetchImpl});
  const web=requests.filter(item=>item.url.endsWith('/web/search'));
  assert.deepEqual(web.slice(0,2).map(item=>item.body.query.queryText),queries);
  assert.ok(web.every(item=>item.body.groupSpec.groupsOnPage==='100'));
  assert.deepEqual(requests.filter(item=>item.url.endsWith('/wordstat/topRequests')).map(item=>item.body.phrase),queries);
  assert.deepEqual(result.wordstat.queries.map(item=>item.query),queries);
  assert.ok(requests.find(item=>item.url.endsWith('/gen/search')).body.messages[0].content.includes(queries[1]));
  assert.equal(requests.filter(item=>item.url.endsWith('/gen/search')).length,1);
});
test('each saved key has separate Yandex, Google and Wordstat requests before shared LLM synthesis',async()=>{
  const requests=[];
  const fetchImpl=async(url,options={})=>{
    const request={url:String(url),body:options.body?JSON.parse(options.body):null};
    requests.push(request);
    if(request.url.endsWith('/web/search'))return Response.json({rawData:Buffer.from(xml).toString('base64')});
    if(request.url.endsWith('/gen/search'))return Response.json({message:{content:'Общий ответ'}});
    if(request.url.endsWith('/wordstat/topRequests'))return Response.json({totalCount:7});
    if(request.url.startsWith('https://serpapi.com/search.md'))return new Response('# results');
    if(request.url.startsWith('https://serpapi.com/search.json'))return Response.json({organic_results:[]});
    if(request.url.endsWith('/chat/completions')){
      const name=request.body.response_format?.json_schema?.name;
      return Response.json({model:'model-test',choices:[{message:{content:name==='reputation_synthesis'?JSON.stringify(synthesis):'Общий ответ ChatGPT'}}]});
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const queries=['Николаев Станислав Юрьевич','Станислав Николаев Меркатор'];
  const result=await collectReputationScan({name:'Станислав Николаев',type:'person',region:'Москва',periodDays:30,queries,profile:{},officialSources:[]},{fetchImpl,integrations:{yandex_search:{apiKey:'y',settings:{folderId:'folder'}},serpapi:{apiKey:'s'},openrouter:{apiKey:'o',settings:{model:'model-test'}},firecrawl:null}});
  assert.deepEqual(requests.filter(item=>item.url.endsWith('/web/search')).map(item=>item.body.query.queryText),[...queries,...queries]);
  assert.deepEqual(requests.filter(item=>item.url.startsWith('https://serpapi.com/search.json')).map(item=>new URL(item.url).searchParams.get('q')),[...queries,...queries].map(query=>`"${query}"`));
  assert.deepEqual(requests.filter(item=>item.url.endsWith('/wordstat/topRequests')).map(item=>item.body.phrase),queries);
  assert.deepEqual(result.searches.map(item=>item.query),[queries[0],queries[0],queries[1],queries[1]]);
  assert.equal(requests.filter(item=>item.url.endsWith('/gen/search')).length,1);
  assert.equal(requests.filter(item=>item.url.endsWith('/chat/completions')).length,2);
  assert.match(result.alice.prompt,/Николаев Станислав Юрьевич/);
  assert.match(result.openaiAnswer.prompt,/Станислав Николаев Меркатор/);
  assert.equal(result.evidence.object.name,'Николаев Станислав Юрьевич');
});
test('registry results are excluded before text extraction',()=>{
  assert.equal(isReferenceResult({url:'https://checko.ru/company/123'}),true);
  assert.equal(isReferenceResult({url:'https://example.org/story'}),false);
});
test('uncertain person articles are reviewed when name and specific organization both match',()=>{
  const subject={name:'Николаев Станислав Юрьевич',type:'person',profile:{relation:'Меркатор Холдинг, председатель совета директоров'}};
  const item={title:'Крестный отец теневого российского бизнеса — председатель...',fullText:'В статье назван Станислав Николаев и упомянут Меркатор Холдинг.'};
  assert.equal(needsIdentityReview(subject,item,{relevance:'uncertain'}),true);
  assert.equal(needsIdentityReview(subject,{...item,fullText:'Статья о другом бизнесмене.'},{relevance:'uncertain'}),false);
  assert.equal(needsIdentityReview(subject,item,{relevance:'irrelevant'}),false);
});
test('scan rechecks an uncertain namesake against the saved organization context',async()=>{
  const articleUrl='https://example.org/stanislav-nikolaev';
  const article={...analysis,relevance:'uncertain',significant:false,sentiment:'negative',risk:'high',summary:'Отчество не указано'};
  const confirmed={...article,relevance:'relevant',significant:true,summary:'Имя и связь с организацией совпадают'};
  let analysisCalls=0;
  const fetchImpl=async(url,options={})=>{
    if(String(url).startsWith('https://serpapi.com/search.md'))return new Response('# Results');
    if(String(url).startsWith('https://serpapi.com/search.json'))return Response.json({organic_results:[{link:articleUrl,title:'Крестный отец теневого бизнеса — председатель...',snippet:'Публикация о компании',position:1}]});
    if(String(url).endsWith('/scrape'))return Response.json({success:true,data:{markdown:'Станислав Николаев — председатель совета директоров компании Меркатор Холдинг.',metadata:{}}});
    if(String(url).endsWith('/chat/completions')){
      const body=JSON.parse(options.body);
      const format=body.response_format?.json_schema?.name;
      if(format==='reputation_analysis'){
        assert.equal(JSON.parse(body.messages[1].content).relation,'Меркатор Холдинг, председатель совета директоров');
        return Response.json({model:'model-test',choices:[{message:{content:JSON.stringify(++analysisCalls===1?article:confirmed)}}]});
      }
      return Response.json({model:'model-test',choices:[{message:{content:format==='reputation_synthesis'?JSON.stringify(synthesis):'Ответ'}}]});
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  const result=await collectReputationScan({name:'Николаев Станислав Юрьевич',type:'person',region:'Москва',periodDays:30,queries:['Николаев Станислав Юрьевич'],officialSources:[],profile:{relation:'Меркатор Холдинг, председатель совета директоров'}},{fetchImpl,integrations:{yandex_search:null,serpapi:{apiKey:'s'},firecrawl:{apiKey:'f'},openrouter:{apiKey:'o',settings:{model:'model-test'}}}});
  assert.equal(analysisCalls,2);
  assert.equal(result.materials[0].significant,true);
  assert.equal(result.materials[0].analysis.sentiment,'negative');
  assert.equal(result.evidence.materials.length,1);
});
