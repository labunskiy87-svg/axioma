import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { audit, once } from './finance.mjs';
import { fail, role } from './security.mjs';
import { uuid } from './validation.mjs';

const OPENROUTER_BASE_URL='https://openrouter.ai/api/v1';
const YANDEX_BASE_URL='https://searchapi.api.cloud.yandex.net/v2';
const providers={
  dadata:{name:'DaData',description:'Подсказки адресов и проверка рекламодателей по реестру',settings:{}},
  openrouter:{name:'OpenRouter',description:'LLM-анализ материалов',settings:{model:'openai/gpt-5.6-terra'}},
  yandex_search:{name:'Яндекс',description:'Поиск, генеративный ответ и Wordstat',settings:{folderId:''}},
  serpapi:{name:'SerpApi',description:'Выдача Google',settings:{}},
  ahrefs:{name:'Ahrefs',description:'AI-ответы и backlink-анализ',settings:{}},
  tgstat:{name:'TGStat',description:'Публикации и метрики Telegram',settings:{}},
  firecrawl:{name:'Firecrawl',description:'Извлечение полных текстов',settings:{}},
};
const providerId=z.enum(Object.keys(providers));
const subjectTypes={Бренд:'brand',Человек:'person',Компания:'company'};
const subjectLabels={brand:'Бренд',person:'Человек',company:'Компания'};
const subjectInput=z.object({
  name:z.string().trim().min(1).max(160),
  type:z.enum(['Бренд','Человек','Компания']),
  queries:z.array(z.string().trim().min(1).max(200)).min(1).max(5),
  region:z.string().trim().min(1).max(120).default('Москва'),
  periodDays:z.union([z.literal(7),z.literal(14),z.literal(30)]).default(30),
  officialSources:z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  profile:z.object({
    relation:z.string().trim().max(500).default(''),
    aliases:z.array(z.string().trim().min(1).max(200)).max(30).default([]),
    relatedObjects:z.array(z.string().trim().min(1).max(200)).max(30).default([]),
    description:z.string().trim().max(5000).default(''),
  }).strict().default({}),
}).strict().refine(data=>new Set(data.queries.map(query=>query.toLocaleLowerCase('ru-RU'))).size===data.queries.length,'Duplicate queries are not allowed');
const integrationInput=z.object({
  apiKey:z.string().trim().min(8).max(4096).optional(),
  clearKey:z.boolean().optional(),
  enabled:z.boolean().default(true),
  settings:z.object({model:z.string().trim().min(1).max(200).optional(),folderId:z.string().trim().max(200).optional()}).strict().default({}),
}).strict().refine(data=>!(data.apiKey&&data.clearKey),'Cannot set and clear a key at the same time');

function secretKey(value) {
  if(typeof value!=='string'||value.length<16)throw new Error('INTEGRATION_SECRETS_KEY must contain at least 16 characters');
  return createHash('sha256').update(value).digest();
}
function encrypt(value,key) {
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join('.');
}
function decrypt(value,key) {
  const [version,iv,tag,data]=String(value).split('.');
  if(version!=='v1'||!iv||!tag||!data)throw new Error('Invalid encrypted integration secret');
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(iv,'base64url'));
  decipher.setAuthTag(Buffer.from(tag,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');
}
export async function integrationKey(db,provider,encryptionSecret) {
  const row=(await db.query('SELECT encrypted_secret,enabled FROM reputation_integrations WHERE provider=$1',[provider])).rows[0];
  if(!row)return undefined;
  return row?.enabled&&row.encrypted_secret?decrypt(row.encrypted_secret,secretKey(encryptionSecret)):null;
}
export async function reputationIntegration(db,provider,encryptionSecret) {
  const row=(await db.query('SELECT encrypted_secret,enabled,settings FROM reputation_integrations WHERE provider=$1',[provider])).rows[0];
  return row?.enabled&&row.encrypted_secret
    ?{apiKey:decrypt(row.encrypted_secret,secretKey(encryptionSecret)),settings:row.settings??{}}
    :null;
}
const hint=value=>value.length<=4?'••••':`•••• ${value.slice(-4)}`;
const settingsFor=(provider,settings)=>provider==='openrouter'
  ?{model:settings?.model||providers.openrouter.settings.model}
  :provider==='yandex_search'?{folderId:settings?.folderId||''}:{};

const yandexChecks=[
  {id:'web',name:'Веб-поиск',path:'/web/search',body:folderId=>({query:{searchType:'SEARCH_TYPE_RU',queryText:'Яндекс'},folderId,responseFormat:'FORMAT_XML'})},
  {id:'generative',name:'Генеративный поиск',path:'/gen/search',body:folderId=>({messages:[{role:'ROLE_USER',content:'Что такое Яндекс?'}],folderId,searchType:'SEARCH_TYPE_RU',getPartialResults:false})},
  {id:'wordstat',name:'Wordstat',path:'/wordstat/topRequests',body:folderId=>({phrase:'Яндекс',numPhrases:1,folderId})},
];

export async function testYandexIntegration({apiKey,folderId,fetchImpl=globalThis.fetch}) {
  const checks=[];
  for(const check of yandexChecks) {
    try {
      const response=await fetchImpl(`${YANDEX_BASE_URL}${check.path}`,{
        method:'POST',headers:{Authorization:`Api-Key ${apiKey}`,'Content-Type':'application/json'},
        body:JSON.stringify(check.body(folderId)),signal:AbortSignal.timeout(20000),
      });
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const payload=await response.json();
      const result=check.id==='generative'&&Array.isArray(payload)?payload.at(-1):payload;
      if(check.id==='web'&&typeof payload.rawData!=='string')throw new Error('Неизвестный формат ответа');
      if(check.id==='generative'&&(!result||typeof result!=='object'||Array.isArray(result)))throw new Error('Неизвестный формат ответа');
      if(check.id==='wordstat'&&!Array.isArray(payload.results))throw new Error('Неизвестный формат ответа');
      checks.push({id:check.id,name:check.name,status:'success',message:check.id==='generative'&&!result.message?'Доступен, ответ без текста':'Доступен'});
    } catch(error) {
      const message=error instanceof Error?error.message:'Ошибка запроса';
      const safeMessage=message.startsWith('HTTP ')?message
        :error?.name==='TimeoutError'||error?.name==='AbortError'?'Превышено время ожидания (20 с)'
        :error instanceof SyntaxError?'Некорректный формат ответа'
        :message==='Неизвестный формат ответа'?message:'Ошибка соединения';
      checks.push({id:check.id,name:check.name,status:'failed',message:safeMessage});
    }
  }
  return checks;
}

async function testProviderConnection(provider,apiKey,fetchImpl) {
  const checks={
    serpapi:{url:`https://serpapi.com/account.json?api_key=${encodeURIComponent(apiKey)}`,options:{},valid:data=>Boolean(data?.account_id)},
    ahrefs:{url:'https://api.ahrefs.com/v3/subscription-info/limits-and-usage',options:{headers:{Authorization:`Bearer ${apiKey}`,Accept:'application/json'}},valid:data=>Boolean(data?.limits_and_usage)},
    tgstat:{url:`https://api.tgstat.ru/usage/stat?token=${encodeURIComponent(apiKey)}`,options:{},valid:data=>data?.status==='ok'&&Array.isArray(data.response)},
    firecrawl:{url:'https://api.firecrawl.dev/v2/team/credit-usage',options:{headers:{Authorization:`Bearer ${apiKey}`}},valid:data=>data?.success===true&&Boolean(data.data)},
  };
  const check=checks[provider];
  if(!check)return false;
  try {
    const response=await fetchImpl(check.url,{...check.options,signal:AbortSignal.timeout(10000)});
    if(!response.ok||!check.valid(await response.json()))return false;
    return true;
  } catch { return false; }
}

async function testDadataIntegration(apiKey,fetchImpl) {
  const checks=[
    {id:'addresses',name:'Адреса',path:'suggest/address',body:{query:'Москва',count:1},valid:data=>Array.isArray(data?.suggestions)&&data.suggestions.length>0},
    {id:'parties',name:'Организации',path:'findById/party',body:{query:'7707083893',count:1},valid:data=>data?.suggestions?.some(item=>item.data?.inn==='7707083893')===true},
  ];
  return Promise.all(checks.map(async check=>{
    let status='failed';
    try {
      const response=await fetchImpl(`https://suggestions.dadata.ru/suggestions/api/4_1/rs/${check.path}`,{
        method:'POST',headers:{Authorization:`Token ${apiKey}`,'Content-Type':'application/json'},
        body:JSON.stringify(check.body),signal:AbortSignal.timeout(10000),
      });
      if(response.ok&&check.valid(await response.json()))status='success';
    } catch {}
    return {id:check.id,name:check.name,status,message:status==='success'?'Доступен':'Недоступен'};
  }));
}

export async function openRouterChat({apiKey,model,messages,responseFormat,fetchImpl=globalThis.fetch,appOrigin='http://127.0.0.1:5173'}) {
  const response=await fetchImpl(`${OPENROUTER_BASE_URL}/chat/completions`,{
    method:'POST',
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','HTTP-Referer':appOrigin,'X-OpenRouter-Title':'Axioma PR Market'},
    body:JSON.stringify({model,messages,temperature:0,...(responseFormat?{response_format:responseFormat}:{})}),
    signal:AbortSignal.timeout(60000),
  });
  if(!response.ok)throw Object.assign(new Error(`OpenRouter ответил ${response.status}`),{statusCode:502});
  const payload=await response.json();const choice=payload?.choices?.[0]?.message;
  if(!choice||typeof choice.content!=='string')throw Object.assign(new Error('OpenRouter вернул ответ неизвестного формата'),{statusCode:502});
  return {id:payload.id??null,model:payload.model??model,content:choice.content,usage:payload.usage??null};
}

async function replaceQueries(tx,subjectId,queries) {
  await tx.query('DELETE FROM reputation_queries WHERE subject_id=$1',[subjectId]);
  for(let index=0;index<queries.length;index++)await tx.query('INSERT INTO reputation_queries(subject_id,position,query) VALUES ($1,$2,$3)',[subjectId,index+1,queries[index]]);
}
async function listSubjects(db,ownerId) {
  const rows=(await db.query(`SELECT s.*,q.queries,scan.id latest_scan_id,scan.status latest_scan_status,scan.requested_at latest_scan_requested_at
    FROM reputation_subjects s
    LEFT JOIN LATERAL (SELECT jsonb_agg(query ORDER BY position) queries FROM reputation_queries WHERE subject_id=s.id) q ON true
    LEFT JOIN LATERAL (SELECT id,status,requested_at FROM reputation_scans WHERE subject_id=s.id ORDER BY requested_at DESC LIMIT 1) scan ON true
    WHERE s.owner_id=$1 ORDER BY s.updated_at DESC`,[ownerId])).rows;
  return rows.map(row=>({
    id:row.id,name:row.name,type:subjectLabels[row.subject_type],queries:row.queries??[],region:row.region,
    periodDays:row.period_days,officialSources:row.official_sources??[],profile:row.profile??{},createdAt:row.created_at,updatedAt:row.updated_at,
    latestScan:row.latest_scan_id?{id:row.latest_scan_id,status:row.latest_scan_status,requestedAt:row.latest_scan_requested_at}:null,
  }));
}
async function ownedSubject(db,id,ownerId,lock=false) {
  const row=(await db.query(`SELECT * FROM reputation_subjects WHERE id=$1 AND owner_id=$2${lock?' FOR UPDATE':''}`,[id,ownerId])).rows[0];
  if(!row)fail(404,'Not found');
  return row;
}

export function registerReputation(app,db,{integrationSecret='local-development-key-change-before-production',fetchImpl=globalThis.fetch,appOrigin='http://127.0.0.1:5173'}={}) {
  const encryptionKey=secretKey(integrationSecret);

  app.get('/api/reputation/subjects',async req=>{role(req.user,'customer');return listSubjects(db,req.user.id);});
  app.post('/api/reputation/subjects',async req=>{
    role(req.user,'customer');const data=subjectInput.parse(req.body);const id=randomUUID();
    await db.transaction(async tx=>{
      await tx.query('INSERT INTO reputation_subjects(id,owner_id,name,subject_type,region,period_days,official_sources,profile) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',[id,req.user.id,data.name,subjectTypes[data.type],data.region,data.periodDays,JSON.stringify(data.officialSources),JSON.stringify(data.profile)]);
      await replaceQueries(tx,id,data.queries);await audit(tx,req.user.actorId??req.user.id,'reputation.subject.create',id,{type:subjectTypes[data.type]});
    });
    return (await listSubjects(db,req.user.id)).find(item=>item.id===id);
  });
  app.put('/api/reputation/subjects/:id',async req=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);const data=subjectInput.parse(req.body);
    await db.transaction(async tx=>{
      await ownedSubject(tx,id,req.user.id,true);
      await tx.query('UPDATE reputation_subjects SET name=$2,subject_type=$3,region=$4,period_days=$5,official_sources=$6,profile=$7,updated_at=now() WHERE id=$1',[id,data.name,subjectTypes[data.type],data.region,data.periodDays,JSON.stringify(data.officialSources),JSON.stringify(data.profile)]);
      await replaceQueries(tx,id,data.queries);await audit(tx,req.user.actorId??req.user.id,'reputation.subject.update',id,{});
    });
    return (await listSubjects(db,req.user.id)).find(item=>item.id===id);
  });
  app.delete('/api/reputation/subjects/:id',async req=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    await db.transaction(async tx=>{await ownedSubject(tx,id,req.user.id,true);await audit(tx,req.user.actorId??req.user.id,'reputation.subject.delete',id,{});await tx.query('DELETE FROM reputation_subjects WHERE id=$1',[id]);});
    return {ok:true};
  });
  app.get('/api/reputation/subjects/:id/scans',async req=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);await ownedSubject(db,id,req.user.id);
    return (await db.query('SELECT id,status,parameters,result,error,requested_at,started_at,completed_at FROM reputation_scans WHERE subject_id=$1 ORDER BY requested_at DESC LIMIT 50',[id])).rows;
  });
  app.post('/api/reputation/subjects/:id/scans',async req=>{
    role(req.user,'customer');const subjectId=uuid.parse(req.params.id);
    return once(db,req,`reputation:${subjectId}:scan`,async tx=>{
      const subject=await ownedSubject(tx,subjectId,req.user.id,true);
      const active=(await tx.query("SELECT id FROM reputation_scans WHERE subject_id=$1 AND status IN ('queued','running')",[subjectId])).rows[0];
      if(active)fail(409,'Сканирование уже запущено');
      const queries=(await tx.query('SELECT query FROM reputation_queries WHERE subject_id=$1 ORDER BY position',[subjectId])).rows.map(row=>row.query);
      const id=randomUUID();
      const parameters={name:subject.name,type:subject.subject_type,region:subject.region,periodDays:subject.period_days,officialSources:subject.official_sources,profile:subject.profile,queries};
      const scan=(await tx.query('INSERT INTO reputation_scans(id,subject_id,owner_id,parameters) VALUES ($1,$2,$3,$4) RETURNING id,status,parameters,requested_at',[id,subjectId,req.user.id,JSON.stringify(parameters)])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'reputation.scan.queue',id,{subjectId});return scan;
    });
  });

  app.get('/api/admin/reputation/integrations',async req=>{
    role(req.user,'admin');const stored=new Map((await db.query('SELECT * FROM reputation_integrations')).rows.map(row=>[row.provider,row]));
    return Object.entries(providers).map(([id,definition])=>{const row=stored.get(id);return {
      id,name:definition.name,description:definition.description,configured:Boolean(row?.encrypted_secret),secretHint:row?.secret_hint??null,
      enabled:row?.enabled??true,settings:settingsFor(id,row?.settings??definition.settings),updatedAt:row?.updated_at??null,
      testedAt:row?.tested_at??null,testStatus:row?.test_status??null,testMessage:row?.test_message??null,testDetails:row?.test_details??[],
    };});
  });
  app.put('/api/admin/reputation/integrations/:provider',async req=>{
    role(req.user,'admin');const provider=providerId.parse(req.params.provider);const data=integrationInput.parse(req.body);
    const old=(await db.query('SELECT encrypted_secret,secret_hint FROM reputation_integrations WHERE provider=$1',[provider])).rows[0];
    const encrypted=data.apiKey?encrypt(data.apiKey,encryptionKey):data.clearKey?null:old?.encrypted_secret??null;
    const secretHint=data.apiKey?hint(data.apiKey):data.clearKey?null:old?.secret_hint??null;
    const settings=settingsFor(provider,{...providers[provider].settings,...data.settings});
    await db.transaction(async tx=>{
      await tx.query(`INSERT INTO reputation_integrations(provider,encrypted_secret,secret_hint,enabled,settings,updated_by,updated_at,tested_at,test_status,test_message,test_details)
        VALUES ($1,$2,$3,$4,$5,$6,now(),null,null,null,'[]')
        ON CONFLICT(provider) DO UPDATE SET encrypted_secret=excluded.encrypted_secret,secret_hint=excluded.secret_hint,enabled=excluded.enabled,settings=excluded.settings,updated_by=excluded.updated_by,updated_at=now(),tested_at=null,test_status=null,test_message=null,test_details='[]'`,[provider,encrypted,secretHint,data.enabled,JSON.stringify(settings),req.user.id]);
      await audit(tx,req.user.actorId??req.user.id,'reputation.integration.update',req.user.id,{provider,configured:Boolean(encrypted),enabled:data.enabled});
    });
    return {ok:true,configured:Boolean(encrypted),secretHint,enabled:data.enabled,settings};
  });
  app.post('/api/admin/reputation/integrations/:provider/test',async req=>{
    role(req.user,'admin');const provider=providerId.parse(req.params.provider);
    const row=(await db.query('SELECT * FROM reputation_integrations WHERE provider=$1',[provider])).rows[0];
    if(!row?.encrypted_secret)fail(409,'Сначала сохраните API-ключ');
    let status='failed',message='Не удалось подключиться',details=[];
    if(provider==='yandex_search') {
      const folderId=settingsFor(provider,row.settings).folderId;
      if(!folderId)fail(409,'Сначала укажите Folder ID');
      details=await testYandexIntegration({apiKey:decrypt(row.encrypted_secret,encryptionKey),folderId,fetchImpl});
      status=details.every(check=>check.status==='success')?'success':'failed';
      message=status==='success'?'Все сервисы Яндекса доступны':'Часть сервисов Яндекса недоступна';
    } else if(provider==='dadata') {
      details=await testDadataIntegration(decrypt(row.encrypted_secret,encryptionKey),fetchImpl);
      status=details.every(check=>check.status==='success')?'success':'failed';
      message=status==='success'?'Адреса и организации доступны':'Часть сервисов DaData недоступна';
    } else if(provider==='openrouter') {
      try {
        const response=await fetchImpl(`${OPENROUTER_BASE_URL}/models`,{headers:{Authorization:`Bearer ${decrypt(row.encrypted_secret,encryptionKey)}`,'HTTP-Referer':appOrigin,'X-OpenRouter-Title':'Axioma PR Market'}});
        if(!response.ok)throw Object.assign(new Error(`OpenRouter ответил ${response.status}`),{statusCode:response.status});
        const payload=await response.json();const model=settingsFor(provider,row.settings).model;
        const available=Array.isArray(payload.data)&&payload.data.some(item=>item.id===model||model.startsWith('~'));
        status='success';message=available?'Подключение работает, модель доступна':'Подключение работает, проверьте выбранную модель';
      } catch { message='Не удалось проверить подключение'; }
    } else {
      status=await testProviderConnection(provider,decrypt(row.encrypted_secret,encryptionKey),fetchImpl)?'success':'failed';
      message=status==='success'?'Подключение работает':'Не удалось проверить подключение';
    }
    await db.transaction(async tx=>{
      await tx.query('UPDATE reputation_integrations SET tested_at=now(),test_status=$2,test_message=$3,test_details=$4 WHERE provider=$1',[provider,status,message,JSON.stringify(details)]);
      await audit(tx,req.user.actorId??req.user.id,'reputation.integration.test',req.user.id,{provider,status});
    });
    if(provider==='openrouter'&&status==='failed')fail(502,message);
    return {ok:status==='success',status,message,checks:details};
  });
}
