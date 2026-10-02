const endpoint='https://www.searchapi.io/api/v1/search';
const locations={'Москва':'Moscow,Russia','Санкт-Петербург':'Saint Petersburg,Russia','Россия':'Russia'};
const phrase=query=>String(query).trim().replace(/^"|"$/g,'');
const markdownLabel=value=>String(value??'').replace(/[\\\[\]]/g,'\\$&').replace(/\s+/g,' ').trim();

async function request(engine,params,connection,fetchImpl) {
  const query=new URLSearchParams({engine,hl:'ru',gl:'ru',...params});
  const response=await fetchImpl(`${endpoint}?${query}`,{
    headers:{Authorization:`Bearer ${connection.apiKey}`},signal:AbortSignal.timeout(45000),
  });
  if(!response.ok)throw new Error(`SearchAPI ответил HTTP ${response.status}`);
  const data=await response.json();
  if(!data||typeof data!=='object'||data.error||data.search_metadata?.status==='Error')throw new Error('SearchAPI не выполнил запрос');
  return data;
}

export async function searchApiGoogle(query,region,connection,fetchImpl=globalThis.fetch,{pages=5,periodDays}={}) {
  const params={q:phrase(query),location:locations[region]??region,link:'resolved'};
  if(periodDays===14) {
    const date=value=>`${value.getUTCMonth()+1}/${value.getUTCDate()}/${value.getUTCFullYear()}`;
    params.time_period_min=date(new Date(Date.now()-14*86400000));
    params.time_period_max=date(new Date());
  } else if(periodDays)params.time_period=periodDays===7?'last_week':'last_month';
  const items=[],rawItems=[],seen=new Set();let searchId=null,pageError=null;
  for(let page=1;page<=pages;page++) {
    let raw;
    try {raw=await request('google',{...params,page:String(page)},connection,fetchImpl);}
    catch(error) {if(page===1)throw error;pageError=error.message;break;}
    if(!Array.isArray(raw.organic_results)&&raw.search_metadata?.status!=='Success')throw new Error('SearchAPI вернул неизвестный формат выдачи');
    searchId??=raw.search_metadata?.id??null;
    const rows=(raw.organic_results??[]).slice(0,10);let added=0;
    for(const [index,row] of rows.entries()) {
      let url;
      try {url=new URL(row.link);if(!['http:','https:'].includes(url.protocol))continue;url.hash='';}
      catch {continue;}
      if(seen.has(url.href))continue;
      seen.add(url.href);added++;
      const offset=(page-1)*10,rank=Number(row.position)||index+1;
      items.push({url:url.href,title:row.title??url.hostname,snippet:row.snippet??'',position:rank>offset?rank:offset+rank,date:row.date??null});
      rawItems.push({link:url.href,title:row.title,snippet:row.snippet,position:row.position,date:row.date});
    }
    if(!added||(rows.length<10&&!raw.pagination?.next))break;
  }
  const markdown=items.map(item=>`${item.position}. [${markdownLabel(item.title)}](${item.url.replaceAll('(','%28').replaceAll(')','%29')})${item.snippet?`\n   ${markdownLabel(item.snippet)}`:''}`).join('\n\n');
  return {items,raw:rawItems,markdown,searchId,pageError,source:'SearchAPI'};
}

export async function searchApiAiMode(prompt,region,connection,fetchImpl=globalThis.fetch) {
  const raw=await request('google_ai_mode',{q:prompt,location:locations[region]??region},connection,fetchImpl);
  if(typeof raw.markdown!=='string'||!raw.markdown.trim())throw new Error('Google AI не вернул ответ');
  const sources=(raw.reference_links??[]).flatMap(source=>{
    try {const url=new URL(source.link);return ['http:','https:'].includes(url.protocol)?[{url:url.href,title:source.title??'',index:source.index}]:[];}
    catch {return [];}
  });
  return {markdown:raw.markdown.trim(),sources,source:'SearchAPI AI Mode',searchId:raw.search_metadata?.id??null};
}

export async function testSearchApiIntegration(apiKey,fetchImpl=globalThis.fetch) {
  const connection={apiKey};
  return Promise.all([
    {id:'google',name:'Google-поиск',load:()=>searchApiGoogle('Google','Москва',connection,fetchImpl,{pages:1})},
    {id:'google_ai',name:'Google AI',load:()=>searchApiAiMode('Что такое Google? Ответь кратко на русском.','Москва',connection,fetchImpl)},
  ].map(async check=>{
    let status='success';
    try {await check.load();}catch {status='failed';}
    return {id:check.id,name:check.name,status,message:status==='success'?'Доступен':'Недоступен'};
  }));
}
