import {z} from 'zod';
import {fail,role} from './security.mjs';

const endpoint='https://suggestions.dadata.ru/suggestions/api/4_1/rs';

export function createDadataClient({key,fetchImpl=globalThis.fetch}={}) {
  const request=async(path,body)=>{
    const token=typeof key==='function'?await key():key;
    if(!token)fail(503,'Подсказки DaData не настроены');
    let response;
    try {
      response=await fetchImpl(`${endpoint}/${path}`,{
        method:'POST',
        headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:`Token ${token}`},
        body:JSON.stringify(body),
        signal:AbortSignal.timeout(5000),
      });
    } catch { fail(502,'DaData временно недоступна'); }
    if(!response.ok)fail(502,'DaData временно недоступна');
    try { return await response.json(); }
    catch { fail(502,'Некорректный ответ DaData'); }
  };

  const addresses=async query=>{
    const result=await request('suggest/address',{query,count:5});
    return (result.suggestions??[]).slice(0,5).map(item=>({
      value:String(item.unrestricted_value||item.value||'').slice(0,1000),
      label:String(item.value||item.unrestricted_value||'').slice(0,300),
    })).filter(item=>item.value);
  };

  const party=async(query,kpp)=>{
    const result=await request('findById/party',{query,count:10,...(kpp?{kpp}:{branch_type:'MAIN'})});
    const suggestions=Array.isArray(result.suggestions)?result.suggestions:[];
    const found=suggestions.find(item=>kpp&&item.data?.kpp===kpp)??suggestions.find(item=>item.data?.branch_type==='MAIN')??suggestions[0];
    if(!found)return {found:false};
    const data=found.data??{};
    return {found:true,party:{
      name:String(data.name?.full_with_opf||found.value||'').slice(0,300),
      shortName:String(data.name?.short_with_opf||'').slice(0,300),
      inn:String(data.inn||'').slice(0,12),
      kpp:String(data.kpp||'').slice(0,9),
      ogrn:String(data.ogrn||'').slice(0,15),
      address:String(data.address?.unrestricted_value||data.address?.value||'').slice(0,1000),
      kind:data.type==='INDIVIDUAL'?'entrepreneur':'legal',
      status:String(data.state?.status||''),
      actualityDate:data.state?.actuality_date??null,
    }};
  };
  return {addresses,party};
}

const normalize=value=>String(value||'').trim().toLowerCase().replace(/[«»"']/g,'').replace(/\s+/g,' ');

export function partyMatchesAdvertiser(advertiser,party) {
  const details=advertiser.details??{};
  if(!party||details.kind!=='legal'||party.kind!=='legal'||party.status!=='ACTIVE')return false;
  const name=normalize(advertiser.name);
  if(!name||![party.name,party.shortName].some(official=>name===normalize(official)))return false;
  return [
    [advertiser.inn,party.inn,10],
    [details.kpp,party.kpp,9],
    [details.ogrn,party.ogrn,13],
  ].every(([entered,official,length])=>String(entered||'').length>=length&&entered===official)
    && Boolean(normalize(details.address))&&normalize(details.address)===normalize(party.address);
}

export function registerDadata(app,client) {
  app.get('/api/reference/addresses',{config:{rateLimit:{max:30,timeWindow:'1 minute'}}},async req=>{
    role(req.user,'customer','publisher','admin');
    const {query}=z.object({query:z.string().trim().min(3).max(300)}).strict().parse(req.query);
    return client.addresses(query);
  });
  app.get('/api/reference/party',{config:{rateLimit:{max:20,timeWindow:'1 minute'}}},async req=>{
    role(req.user,'customer','publisher','admin');
    const {query,kpp}=z.object({query:z.string().regex(/^(\d{10}|\d{12}|\d{13}|\d{15})$/),kpp:z.string().regex(/^\d{9}$/).optional()}).strict().parse(req.query);
    return client.party(query,kpp);
  });
}
