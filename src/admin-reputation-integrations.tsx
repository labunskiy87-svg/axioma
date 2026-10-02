import React, {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle2, ChevronDown, KeyRound, LoaderCircle, PlugZap, Trash2} from 'lucide-react';
import {api} from './api';

type Integration={
  id:string;
  name:string;
  description:string;
  configured:boolean;
  secretHint:string|null;
  enabled:boolean;
  settings:{model?:string;folderId?:string};
  updatedAt:string|null;
  testedAt:string|null;
  testStatus:'success'|'failed'|null;
  testMessage:string|null;
  testDetails:{id:string;name:string;status:'success'|'failed';message:string}[];
};

const inputClass='h-11 w-full rounded-lg border border-[#476788] bg-white px-4 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10';
const checkedScope:Record<string,string>={
  serpapi:'Доступ к аккаунту API подтверждён',
  ahrefs:'Лимиты API получены',
  tgstat:'Статистика API получена',
  firecrawl:'Остаток кредитов API получен',
};

export function AdminReputationIntegrationsView(){
  const [items,setItems]=useState<Integration[]>([]);
  const [keys,setKeys]=useState<Record<string,string>>({});
  const [models,setModels]=useState<Record<string,string>>({});
  const [folderIds,setFolderIds]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});

  const load=async()=>{
    const result=await api<Integration[]>('/admin/reputation/integrations');
    setItems(result);setModels(Object.fromEntries(result.map(item=>[item.id,item.settings.model||''])));setFolderIds(Object.fromEntries(result.map(item=>[item.id,item.settings.folderId||''])));
  };
  useEffect(()=>{load().catch(cause=>setError(cause instanceof Error?cause.message:'Не удалось загрузить интеграции'));},[]);
  const run=async(id:string,action:()=>Promise<void>)=>{
    if(busy)return;setBusy(id);setError('');setNotice('');
    try{await action();await load();}catch(cause){setError(cause instanceof Error?cause.message:'Не удалось выполнить операцию');}finally{setBusy('');}
  };
  const save=(item:Integration)=>run(item.id,async()=>{
    await api(`/admin/reputation/integrations/${item.id}`,'PUT',{
      ...(keys[item.id]?.trim()?{apiKey:keys[item.id].trim()}:{}),
      enabled:true,
      settings:item.id==='openrouter'?{model:(models[item.id]||'openai/gpt-5.6-terra').trim()}:item.id==='yandex_search'?{folderId:(folderIds[item.id]||'').trim()}:{}
    });
    setKeys(current=>({...current,[item.id]:''}));setNotice(`${item.name}: настройки сохранены`);
  });
  const clear=(item:Integration)=>run(item.id,async()=>{
    await api(`/admin/reputation/integrations/${item.id}`,'PUT',{clearKey:true,enabled:false,settings:item.id==='openrouter'?{model:models[item.id]||'openai/gpt-5.6-terra'}:item.id==='yandex_search'?{folderId:folderIds[item.id]||''}:{}});
    setKeys(current=>({...current,[item.id]:''}));setNotice(`${item.name}: ключ удален`);
  });
  const test=(item:Integration)=>run(item.id,async()=>{
    const result=await api<{message:string;status:'success'|'failed'}>(`/admin/reputation/integrations/${item.id}/test`,'POST',{});
    if(result.status==='failed')setError(result.message);
    else setNotice(result.message);
  });

  return <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold text-[#0b3558]">API интеграции</h1><p className="mt-1 text-sm text-[#476788]">Ключи внешних сервисов платформы.</p></div>
    {(error||notice)&&<div role="status" className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${error?'border-[#ef4444] bg-[#fff7f7] text-[#b91c1c]':'border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]'}`}>{error?<AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/>:<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0"/>}<span>{error||notice}</span></div>}
    <div className="overflow-hidden rounded-xl border border-[#d4e0ed] bg-white">
      <div className="grid gap-3 border-b border-[#d4e0ed] px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><h2 className="font-display text-base font-bold text-[#0b3558]">Подключения</h2><p className="mt-1 text-sm text-[#476788]">Сохраненные ключи не выводятся в интерфейс и используются только сервером.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f0f3f8] px-3 py-1.5 text-xs font-medium text-[#476788]"><KeyRound className="h-3.5 w-3.5"/>{items.filter(item=>item.configured).length} из {items.length} подключено</span></div>
      <div className="divide-y divide-[#d4e0ed]">
        {items.map(item=><section key={item.id} className="px-5 py-5 sm:px-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)] xl:items-end xl:gap-6">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#006bff]"><PlugZap className="h-4 w-4"/></span><h3 className="font-semibold text-[#0b3558]">{item.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.testStatus==='success'?'bg-[#dcfce7] text-[#15803d]':item.testStatus==='failed'?'bg-[#fef2f2] text-[#b91c1c]':'bg-[#f0f3f8] text-[#476788]'}`}>{item.testStatus==='success'?'Доступен':item.testStatus==='failed'?'Недоступен':item.configured?'Не проверено':'Не настроено'}</span></div><p className="mt-2 text-sm text-[#476788]">{item.description}</p></div>
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <label className={`block min-w-0 ${item.id==='openrouter'||item.id==='yandex_search'?'':'md:col-span-2'}`}><span className="text-xs font-medium text-[#476788]">API-ключ</span><input type="password" autoComplete="new-password" value={keys[item.id]||''} onChange={event=>setKeys(current=>({...current,[item.id]:event.target.value}))} placeholder={item.secretHint||'Вставьте API-ключ'} className={`mt-2 ${inputClass}`}/></label>
              {item.id==='openrouter'?<label className="block min-w-0"><span className="text-xs font-medium text-[#476788]">Модель OpenRouter</span><input value={models[item.id]||''} onChange={event=>setModels(current=>({...current,[item.id]:event.target.value}))} placeholder="openai/gpt-5.6-terra" className={`mt-2 ${inputClass}`}/></label>:item.id==='yandex_search'&&<label className="block min-w-0"><span className="text-xs font-medium text-[#476788]">Folder ID</span><input value={folderIds[item.id]||''} onChange={event=>setFolderIds(current=>({...current,[item.id]:event.target.value}))} placeholder="Идентификатор каталога Yandex Cloud" className={`mt-2 ${inputClass}`}/></label>}
            </div>
            <div className="grid h-11 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_44px] gap-2"><button type="button" disabled={busy===item.id} onClick={()=>save(item)} className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg bg-[#006bff] px-2 text-sm font-semibold text-white hover:bg-[#0057d6] disabled:opacity-50">{busy===item.id?<LoaderCircle className="h-4 w-4 animate-spin"/>:'Сохранить'}</button>{item.configured?<button type="button" disabled={busy===item.id} onClick={()=>test(item)} className="h-11 min-w-0 rounded-lg border border-[#d4e0ed] bg-white px-2 text-sm font-semibold text-[#0b3558] hover:bg-[#f8f9fb] disabled:opacity-50">Проверить</button>:<span aria-hidden="true"/>}{item.configured?<button type="button" aria-label={`Удалить ключ ${item.name}`} title="Удалить ключ" disabled={busy===item.id} onClick={()=>clear(item)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] hover:border-[#ef4444] hover:text-[#ef4444] disabled:opacity-50"><Trash2 className="h-4 w-4"/></button>:<span aria-hidden="true"/>}</div>
          </div>
          <div className="mt-3 min-h-5 xl:ml-[284px]">
            {(item.id==='yandex_search'||item.id==='dadata')&&item.testDetails?.length>0?<div className="border-t border-[#d4e0ed] pt-3">
              <button type="button" aria-expanded={Boolean(expanded[item.id])} aria-controls={`${item.id}-check-details`} onClick={()=>setExpanded(current=>({...current,[item.id]:!current[item.id]}))} className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-[#0b3558]">
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><span className={`h-2 w-2 shrink-0 rounded-full ${item.testStatus==='success'?'bg-[#16a34a]':'bg-[#dc2626]'}`}/><span>Проверка сервисов</span><span className="text-[#476788]">{item.testDetails.filter(check=>check.status==='success').length} из {item.testDetails.length} доступны</span></span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-[#476788] transition-transform ${expanded[item.id]?'rotate-180':''}`}/>
              </button>
              {expanded[item.id]&&<div id={`${item.id}-check-details`} className={`mt-4 grid gap-x-6 gap-y-3 ${item.id==='dadata'?'sm:grid-cols-2':'sm:grid-cols-3'}`}>{item.testDetails.map(check=><div key={check.id} className="min-w-0"><div className="flex items-center gap-2"><span className={`h-2 w-2 shrink-0 rounded-full ${check.status==='success'?'bg-[#16a34a]':'bg-[#dc2626]'}`}/><span className="text-sm font-medium text-[#0b3558]">{check.name}</span></div><p className={`mt-1 pl-4 text-xs ${check.status==='success'?'text-[#15803d]':'text-[#b91c1c]'}`}>{check.status==='success'?'Доступен':'Недоступен'}</p></div>)}</div>}
            </div>:item.configured&&<p className={`flex items-center gap-2 text-xs ${item.testStatus==='success'?'text-[#15803d]':item.testStatus==='failed'?'text-[#b91c1c]':'text-[#476788]'}`}>
              <span className={`h-2 w-2 shrink-0 rounded-full ${item.testStatus==='success'?'bg-[#16a34a]':item.testStatus==='failed'?'bg-[#dc2626]':'bg-[#94a3b8]'}`}/>
              <span>{item.testStatus==='success'?(item.id==='openrouter'?(item.testMessage?.includes('модель доступна')?'Подключение работает, модель доступна':'Подключение работает, проверьте выбранную модель'):`Подключение работает. ${checkedScope[item.id]||'Ответ API получен'}`):item.testStatus==='failed'?'Проверка подключения не прошла':'Проверка ещё не запускалась'}</span>
            </p>}
          </div>
        </section>)}
        {!items.length&&!error&&<div className="px-6 py-10 text-center text-sm text-[#476788]">Загрузка интеграций...</div>}
      </div>
    </div>
  </div>;
}
