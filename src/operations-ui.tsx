import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronDown,ChevronLeft,Paperclip} from 'lucide-react';
import {orderLabels,useBackend} from './prototype-backend';
import {api} from './api';
const panel='rounded-lg border border-[#d4e0ed] bg-white p-6';
const input='w-full rounded-lg border border-[#476788] p-3 text-sm';
const button='rounded-lg bg-[#006bff] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50';
const money=(v:any)=>v===null||v===undefined||!Number.isFinite(Number(v))?'—':`${(Number(v)/100).toLocaleString('ru-RU')} ₽`;
const ledgerAccount=(value:string,email?:string)=>{
 if(value==='platform:revenue')return 'Платформа · доход';
 if(value==='platform:clearing')return 'Платформа · расчеты';
 if(value==='external:clearing')return 'Внешний расчет';
 if(email)return `${email} · ${value.endsWith(':reserved')?'Резерв':'Баланс'}`;
 return value;
};
const ledgerReason=(row:any)=>{
 const reference=String(row.reference||'');
 if(reference==='demo:opening-balance')return 'Начальный баланс';
 if(reference.startsWith('demo:order:'))return row.order_number?`Выплата паблишеру · заказ №${row.order_number}`:'Выплата паблишеру по заказу';
 if(reference.startsWith('topup:'))return 'Пополнение баланса';
 if(reference.startsWith('adjustment:'))return 'Ручная корректировка баланса';
 if(reference.startsWith('payout:'))return 'Заявка на выплату';
 if(reference.startsWith('moderation-refund:'))return row.material_number?`Возврат ускоренной модерации материала №${row.material_number}`:'Возврат ускоренной модерации';
 if(reference.startsWith('moderation:'))return row.material_number?`Ускоренная модерация материала №${row.material_number}`:'Ускоренная модерация';
 if(reference.startsWith('order:')){
  const action=reference.split(':').slice(2).join(':');
  const label=action==='reserve'?'Резерв оплаты':action==='refund'?'Возврат оплаты':action==='payout'?'Выплата паблишеру':action==='commission'?'Комиссия платформы':action.includes('dispute')?'Решение спора':'Операция по заказу';
  return row.order_number?`${label} · заказ №${row.order_number}`:`${label} по заказу`;
 }
 return 'Прочая операция';
};
const activityAction=(row:any)=>{
 const path=String(row.path||'');
 if(path==='/api/auth/login')return 'Вход в кабинет';
 if(path==='/api/auth/logout')return 'Выход из кабинета';
 if(path==='/api/auth/register')return 'Регистрация';
 const section=path.split('/')[2];
 const name:Record<string,string>={materials:'Материалы',projects:'Проекты',orders:'Заказы',outlets:'Площадки',advertisers:'Рекламодатели',balance:'Баланс',transactions:'Операции',reports:'Отчеты',files:'Файлы',tickets:'Поддержка',topups:'Пополнения',notifications:'Уведомления',settings:'Настройки',admin:'Администрирование',auth:'Учетная запись'};
 return `${row.method==='GET'?'Просмотр':row.method==='DELETE'?'Удаление':'Изменение'} · ${name[section]||path}`;
};
const auditAction=(action:string)=>({
 'material.withdraw':'Материал отозван с модерации',
 'project.create':'Создан проект','project.status':'Изменен статус проекта','project.delete':'Удален проект',
 'material.create':'Создан материал','material.save':'Сохранен материал','material.edit':'Изменен материал','material.submit':'Материал отправлен на модерацию','material.moderate':'Материал проверен','material.project':'Изменен проект материала',
 'outlet.create':'Создана площадка','outlet.edit':'Изменена площадка','outlet.activity':'Изменена активность площадки','outlet.moderate':'Площадка проверена','outlet.favorite':'Измено избранное',
 'advertiser.create':'Создан рекламодатель','order.create':'Создан заказ','order.project':'Изменен проект заказа','order.message':'Отправлено сообщение по заказу','order.resolve':'Закрыт спор по заказу',
 'settings.limits':'Изменены лимиты','auth.password.change':'Изменен пароль','auth.sessions.revoke':'Завершены сеансы',
}[action]??action.split('.').join(' · '));
export function useRows(path:string) {
 const backend=useBackend(),[rows,setRows]=useState<any[]>([]),[loading,setLoading]=useState(true);
 const reload=async()=>{setRows(await api(path));setLoading(false);};
 useEffect(()=>{let active=true;setLoading(true);api(path).then(r=>{if(active){setRows(r);setLoading(false);}}).catch(e=>{if(active){backend.setError(e.message);setLoading(false);}});return()=>{active=false;};},[path]);
 return {rows,reload,loading};
}
export function AdminRecords({kind,SelectComponent,onOpenOutlet,onOpenOrder,onOpenAdvertiser,onOpenMaterial,onReturnToUser}:{kind:string;SelectComponent:React.ComponentType<any>;onOpenOutlet?:(id:string,userId:string)=>void;onOpenOrder?:(id:string,userId:string)=>void;onOpenAdvertiser?:(id:string,userId:string)=>void;onOpenMaterial?:(id:string,userId:string)=>void;onReturnToUser?:(id:string)=>void}) {
 const endpoint=kind==='balances'?'users':kind;
 const recordKey=kind==='advertisers'?'admin_advertiser':'admin_user';
 const [query,setQuery]=useState(''),[selectedId,setSelectedId]=useState<string|null>(()=>new URLSearchParams(location.search).get(recordKey));
 const backend=useBackend(),{rows,reload,loading}=useRows(`/admin/${endpoint}${kind==='audit'&&query.trim()?`?q=${encodeURIComponent(query.trim())}`:''}`);
 useEffect(()=>{const restore=()=>setSelectedId(new URLSearchParams(location.search).get(recordKey));restore();window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);},[recordKey]);
 const selectRecord=(id:string|null)=>{const url=new URL(location.href);url.searchParams.delete('user_tab');if(id)url.searchParams.set(recordKey,id);else url.searchParams.delete(recordKey);history.pushState(null,'',url.pathname+url.search);setSelectedId(id);};
 const selected=new URLSearchParams(location.search).get(recordKey)===selectedId?rows.find(row=>row.id===selectedId):null;
 const titles={users:'Пользователи',balances:'Балансы пользователей',advertisers:'Рекламодатели',audit:'Аудит',ledger:'Движение средств'};
 const visible=rows.filter(r=>(kind!=='balances'||['customer','publisher'].includes(r.role)&&!r.account_owner_id)&&(kind==='audit'||JSON.stringify(r).toLowerCase().includes(query.toLowerCase())));
 if(kind==='users'&&selectedId)return <AdminUserRecord id={selectedId} onBack={()=>selectRecord(null)} onOpenOutlet={onOpenOutlet} onOpenOrder={onOpenOrder} onOpenAdvertiser={onOpenAdvertiser} onOpenMaterial={onOpenMaterial} onOpenUser={selectRecord} />;
 if(selected && kind==='balances'){
  const current=rows.find(row=>row.id===selected.id)??selected;
  return <div className="space-y-5"><button onClick={()=>selectRecord(null)}>← К пользователям</button>
    <div className={panel}><h1 className="font-display text-xl font-bold">{current.email}</h1><div className="mt-4 flex flex-wrap items-center gap-5"><span>Доступно: {money(current.available)}</span><span>В резерве: {money(current.reserved)}</span></div></div>
    {['customer','publisher'].includes(current.role)&&<BalanceAdjustmentPanel user={current} onBalanceChange={reload} SelectComponent={SelectComponent} />}
    <UserLedger user={current} refreshKey={`${current.available}:${current.reserved}`} />
  </div>;
 }
 if(kind==='advertisers'&&selectedId)return <AdminAdvertiserRecord id={selectedId} onBack={()=>{const origin=new URLSearchParams(location.search).get('from_user');if(origin&&onReturnToUser)onReturnToUser(origin);else selectRecord(null);}} onChanged={reload} SelectComponent={SelectComponent} />;
 return <div className="space-y-5"><h1 className="font-display text-2xl font-bold">{titles[kind]}</h1><input aria-label="Поиск" className={input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск" /><div className={`${panel} overflow-x-auto`}>
 {loading?'Загрузка…':!visible.length?'Записей нет':<table className="w-full text-left text-sm"><thead><tr>{(kind==='users'?['Email','Дата регистрации','Роль','Статус','Доступно','В резерве']:kind==='balances'?['Email','Роль','Доступно','В резерве']:kind==='advertisers'?['Название','ИНН','Владелец','Проверка']:kind==='audit'?['Дата','Пользователь','Действие','Объект']:['Дата','Списание','Зачисление','Сумма','Основание']).map(s=><th key={s} className="border-b p-3 text-[#476788]">{s}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id} className={`${['users','balances','advertisers'].includes(kind)?'cursor-pointer hover:bg-[#f8f9fb]':''} border-b`} onClick={()=>{if(['users','balances','advertisers'].includes(kind))selectRecord(r.id);}}>{(kind==='users'?[r.email,new Date(r.created_at).toLocaleDateString('ru-RU'),({customer:'Заказчик',publisher:'Паблишер',admin:'Администратор'})[r.role],r.blocked_at?'Заблокирован':'Активен',money(r.available),money(r.reserved)]:kind==='balances'?[r.email,({customer:'Заказчик',publisher:'Паблишер',admin:'Администратор'})[r.role],money(r.available),money(r.reserved)]:kind==='advertisers'?[r.name,r.inn,r.email,({verified:'Проверен',pending:'На проверке',blocked:'Заблокирован'})[r.verification]]:kind==='audit'?[new Date(r.created_at).toLocaleString('ru-RU'),r.email||'Система',auditAction(r.action),r.entity_label||'—']:[new Date(r.created_at).toLocaleString('ru-RU'),ledgerAccount(r.debit_account,r.debit_email),ledgerAccount(r.credit_account,r.credit_email),money(r.amount),ledgerReason(r)]).map((cell,i)=><td key={i} className="p-3 break-words">{cell}</td>)}</tr>)}</tbody></table>}
 </div></div>;
}
const userRole:Record<string,string>={customer:'Заказчик',publisher:'Паблишер',admin:'Администратор'};
const accountLabels:Record<string,string>={company:'Компания',responsible:'Ответственный',workEmail:'Рабочая почта',phone:'Телефон',timezone:'Часовой пояс',language:'Язык',legalName:'Юридическое название',responsibleEditor:'Ответственный редактор',orderEmail:'Почта для заказов',workingHours:'Рабочие часы',autoReply:'Автоответ',payerStatus:'Статус плательщика',payeeStatus:'Статус получателя',paymentSchedule:'График выплат',recipient:'Получатель',inn:'ИНН',kpp:'КПП',ogrn:'ОГРН',account:'Расчетный счет',bank:'Банк',bic:'БИК',bik:'БИК',vat:'НДС',legalAddress:'Юридический адрес',documentFlow:'Документооборот',edoId:'Идентификатор ЭДО',personName:'ФИО',personInn:'ИНН физлица',birthDate:'Дата рождения',snils:'СНИЛС',passport:'Паспортные данные',registrationAddress:'Адрес регистрации',personDocumentFlow:'Документооборот',taxStatus:'Налоговый статус',personBank:'Банк',personBik:'БИК',personAccount:'Расчетный счет',kind:'Тип рекламодателя',address:'Юридический адрес',advertisedObject:'Объект рекламирования',targetUrl:'Целевая ссылка',contractType:'Тип договора',contractNumber:'Номер договора',contractDate:'Дата договора',executorName:'Первый исполнитель',executorInn:'ИНН первого исполнителя'};
const dateTime=(value:any)=>value?new Date(value).toLocaleString('ru-RU'):'—';
function Details({data,empty='Данные не заполнены.'}:{data:Record<string,any>;empty?:string}) {
 const fields=Object.entries(data||{}).filter(([,value])=>value!==null&&value!==undefined&&value!==''&&typeof value!=='object');
 return fields.length?<dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{fields.map(([key,value])=><div key={key} className="min-w-0 border-b border-[#d4e0ed] pb-3 text-sm"><dt className="text-[#476788]">{accountLabels[key]||key}</dt><dd className="mt-1 break-words font-medium text-[#0b3558]">{String(value)}</dd></div>)}</dl>:<p className="text-sm text-[#476788]">{empty}</p>;
}
function AdvertiserList({items,onOpen}:{items:any[];onOpen?:(id:string)=>void}) {
 const [expanded,setExpanded]=useState<string|null>(null);
 const verification:Record<string,string>={verified:'Проверен',pending:'На проверке',blocked:'Заблокирован'};
 return items.length?<div className="divide-y divide-[#d4e0ed]">{items.map(item=><div key={item.id}>
  <div className="flex items-center gap-2 py-2">
   <button type="button" className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2 rounded-lg px-1 py-2 text-left hover:bg-[#f8f9fb] focus-visible:outline-[#006bff]" onClick={()=>onOpen?.(item.id)}><span className="min-w-0 flex-1"><strong className="block break-words text-sm">{item.name}</strong><span className="mt-1 block text-xs text-[#476788]">ИНН {item.inn}</span></span><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${item.verification==='verified'?'bg-[#dcfce7] text-[#15803d]':item.verification==='blocked'?'bg-[#fee2e2] text-[#b91c1c]':'bg-[#e6f0ff] text-[#004eba]'}`}>{verification[item.verification]||item.verification}</span></button>
   <button type="button" aria-label={`${expanded===item.id?'Скрыть':'Показать'} данные рекламодателя ${item.name}`} aria-expanded={expanded===item.id} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#476788] hover:bg-[#f8f9fb] focus-visible:outline-[#006bff]" onClick={()=>setExpanded(expanded===item.id?null:item.id)}><ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${expanded===item.id?'rotate-180':''}`} /></button>
  </div>
  {expanded===item.id&&<div className="pb-5 pl-0 sm:pl-4"><Details data={Object.fromEntries(Object.entries(item.details||{}).map(([key,value])=>[key,key==='kind'?value==='entrepreneur'?'Индивидуальный предприниматель':value==='legal'?'Юридическое лицо':value:key==='contractType'?value==='intermediary'?'Посреднический договор':value==='services'?'Договор оказания услуг':value:value]))} /></div>}
 </div>)}</div>:<p className="text-sm text-[#476788]">Рекламодателей нет.</p>;
}
function CustomerAssets({record,onOpenAdvertiser,onOpenMaterial}:{record:any;onOpenAdvertiser?:(id:string)=>void;onOpenMaterial?:(id:string)=>void}) {
 const materialStatus:Record<string,string>={draft:'Черновик',pending:'На проверке',approved:'Одобрен',rejected:'Отклонен'};
 return <div className="space-y-5">
  <section className={panel}><h2 className="mb-3 font-display text-lg font-bold">Рекламодатели</h2><AdvertiserList items={record.advertisers} onOpen={onOpenAdvertiser} /></section>
  <section className={panel}><h2 className="mb-3 font-display text-lg font-bold">Проекты</h2>{record.projects.length?<div className="divide-y divide-[#d4e0ed]">{record.projects.map((item:any)=><div key={item.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 py-4 text-sm"><span className="min-w-0 break-words font-medium">{item.name}</span><time className="shrink-0 text-xs text-[#476788]">{dateTime(item.created_at)}</time></div>)}</div>:<p className="text-sm text-[#476788]">Проектов нет.</p>}</section>
  <section className={panel}><h2 className="mb-3 font-display text-lg font-bold">Материалы</h2>{record.materials.length?<div className="divide-y divide-[#d4e0ed]">{record.materials.map((item:any)=>item.status==='pending'&&onOpenMaterial?<button key={item.id} type="button" className="flex w-full flex-wrap items-center justify-between gap-x-5 gap-y-2 py-4 text-left text-sm hover:bg-[#f8f9fb] focus-visible:outline-[#006bff]" onClick={()=>onOpenMaterial(item.id)}><span className="min-w-0 break-words font-medium">№{item.number} · {item.title}</span><span className="flex shrink-0 items-center gap-4"><span className="text-[#476788]">{materialStatus[item.status]}</span><time className="hidden text-xs text-[#476788] sm:inline">{dateTime(item.created_at)}</time></span></button>:<div key={item.id} className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 py-4 text-sm"><span className="min-w-0 break-words font-medium">№{item.number} · {item.title}</span><span className="flex shrink-0 items-center gap-4"><span className="text-[#476788]">{materialStatus[item.status]||item.status}</span><time className="hidden text-xs text-[#476788] sm:inline">{dateTime(item.created_at)}</time></span></div>)}</div>:<p className="text-sm text-[#476788]">Материалов нет.</p>}</section>
 </div>;
}
function UserOrders({record,onOpen}:{record:any;onOpen?:(id:string)=>void}) {
 const tone:Record<string,string>={pending:'bg-[#e6f0ff] text-[#004eba]',accepted:'bg-[#fef3c7] text-[#92400e]',submitted:'bg-[#e6f0ff] text-[#004eba]',completed:'bg-[#dcfce7] text-[#15803d]',rejected:'bg-[#fee2e2] text-[#b91c1c]',disputed:'bg-[#fee2e2] text-[#b91c1c]',refunded:'bg-[#f0f3f8] text-[#476788]'};
 return <section className={panel}><h2 className="mb-3 font-display text-lg font-bold">Заказы</h2>{record.orders.length?<div className="divide-y divide-[#d4e0ed]">{record.orders.map((item:any)=><button key={item.id} type="button" className="grid w-full min-w-0 gap-3 py-5 text-left hover:bg-[#f8f9fb] focus-visible:outline-[#006bff] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6" onClick={()=>onOpen?.(item.id)}><span className="min-w-0"><span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"><strong className="whitespace-nowrap">Заказ №{item.number}</strong><span className="min-w-0 break-words font-medium">{item.outlet_name}</span></span><span className="mt-1 block break-words text-sm text-[#476788]">{item.material_title}</span><span className="mt-2 block break-all text-xs text-[#476788]">{record.role==='publisher'?'Заказчик':'Паблишер'}: {record.role==='publisher'?item.customer_email:item.publisher_email}</span><span className="mt-1 block text-xs text-[#476788]">{dateTime(item.created_at)}</span></span><span className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start"><span className={`rounded-full px-3 py-1 text-xs font-medium ${tone[item.status]||tone.pending}`}>{orderLabels[item.status]||item.status}</span><span className="whitespace-nowrap text-sm font-semibold tabular-nums">{money(item.amount)}</span></span></button>)}</div>:<p className="text-sm text-[#476788]">Заказов нет.</p>}</section>;
}
function AdminUserRecord({id,onBack,onOpenOutlet,onOpenOrder,onOpenAdvertiser,onOpenMaterial,onOpenUser}:{id:string;onBack:()=>void;onOpenOutlet?:(id:string,userId:string)=>void;onOpenOrder?:(id:string,userId:string)=>void;onOpenAdvertiser?:(id:string,userId:string)=>void;onOpenMaterial?:(id:string,userId:string)=>void;onOpenUser?:(id:string)=>void}) {
 const backend=useBackend(),[record,setRecord]=useState<any>(null),[loading,setLoading]=useState(true),[tab,setTab]=useState(()=>new URLSearchParams(location.search).get('user_tab')||'overview');
 const tabsRef=useRef<HTMLElement>(null);
 const refresh=async()=>{setRecord(await api(`/admin/users/${id}/overview`));setLoading(false);};
 useEffect(()=>{let active=true;setLoading(true);api(`/admin/users/${id}/overview`).then(data=>{if(active){setRecord(data);setLoading(false);}}).catch(error=>{if(active){setLoading(false);backend.setError(error.message);}});return()=>{active=false;};},[id]);
 useEffect(()=>{const restore=()=>setTab(new URLSearchParams(location.search).get('user_tab')||'overview');window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);},[]);
 useEffect(()=>{const nav=tabsRef.current,active=nav?.querySelector<HTMLElement>('[aria-current="page"]');if(nav&&active)nav.scrollLeft=active.offsetLeft-nav.offsetLeft-(nav.clientWidth-active.clientWidth)/2;},[tab,loading]);
 const selectTab=(value:string)=>{const url=new URL(location.href);if(value==='overview')url.searchParams.delete('user_tab');else url.searchParams.set('user_tab',value);history.pushState(null,'',url.pathname+url.search);setTab(value);};
 if(loading)return <div className={panel}>Загрузка…</div>;
 if(!record)return <div className={panel}><button onClick={onBack}>← К пользователям</button><p className="mt-4">Пользователь не найден.</p></div>;
 const tabs=[['overview','Обзор'],['profile','Профиль и реквизиты'],['assets',record.role==='publisher'?'Площадки':'Рекламодатели'],['orders','Заказы'],['finance','Финансы'],['activity','Команда и активность']];
 const owner=record.account_owner_id&&record.account_owner_id!==record.id;
 return <div className="admin-user-record mx-auto max-w-7xl space-y-5 text-[#0b3558]"><button className="text-sm text-[#476788]" onClick={onBack}>← К пользователям</button>
  <header className={panel}><div className="flex flex-wrap items-center gap-3"><h1 className="min-w-0 break-all font-display text-xl font-bold">{record.email}</h1><span className="rounded-full border border-[#d4e0ed] px-3 py-1 text-xs font-medium">{userRole[record.role]||record.role}{record.team_role?` · ${record.team_role}`:''}</span><span className={record.blocked_at?'text-red-700':'text-emerald-700'}>{record.blocked_at?'Заблокирован':'Активен'}</span></div>
   <p className="mt-2 text-sm text-[#476788]">Дата регистрации: {dateTime(record.created_at)}{owner?' · Участник команды':''}</p>
   <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span>Доступно: {money(record.available)}</span><span>В резерве: {money(record.reserved)}</span></div>
   <div className="mt-5 flex flex-wrap gap-3"><button className={button} disabled={backend.busy||record.id===backend.user.id} onClick={()=>backend.perform(async()=>{await api(`/admin/users/${id}/access`,'PATCH',{blocked:!record.blocked_at});await refresh();})}>{record.blocked_at?'Разблокировать':'Заблокировать'}</button><button className="rounded-lg border border-[#d4e0ed] px-5 py-3 text-sm font-semibold" disabled={backend.busy} onClick={()=>backend.perform(async()=>{await api(`/admin/users/${id}/revoke-sessions`,'POST',{});await refresh();})}>Завершить все сеансы</button></div>
  </header>
  <nav ref={tabsRef} className="flex gap-1 overflow-x-auto border-b border-[#d4e0ed]" aria-label="Разделы карточки пользователя">{tabs.map(([value,label])=><button key={value} type="button" className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${tab===value?'border-[#006bff] text-[#006bff]':'border-transparent text-[#476788]'}`} aria-current={tab===value?'page':undefined} onClick={()=>selectTab(value)}>{label}</button>)}</nav>
  {tab==='overview'&&<div className="grid gap-5 lg:grid-cols-2"><section className={panel}><h2 className="mb-4 font-display text-lg font-bold">Контакты</h2><Details data={{Email:record.email,...record.profile}} /></section><section className={panel}><h2 className="mb-4 font-display text-lg font-bold">Аккаунт</h2><Details data={{'Роль':userRole[record.role]||record.role,'Дата регистрации':dateTime(record.created_at),'Двухфакторная защита':record.two_factor_enabled?'Включена':'Выключена','Активных сеансов':record.active_sessions,'Проверка реквизитов':({draft:'Не отправлены',pending:'На проверке',verified:'Подтверждены',rejected:'Отклонены'} as any)[record.requisites_status]||record.requisites_status,'Площадок':record.outlets.length,'Рекламодателей':record.advertisers.length,'Заказов':record.orders.length}} /></section></div>}
  {tab==='profile'&&<div className="grid gap-5 lg:grid-cols-2"><section className={panel}><h2 className="mb-4 font-display text-lg font-bold">Профиль и контакты</h2><Details data={record.profile} /></section>{record.role!=='admin'?<RequisitesReview user={record} />:<section className={panel}><h2 className="font-display text-lg font-bold">Реквизиты</h2><p className="mt-3 text-sm text-[#476788]">Не применяются к администратору.</p></section>}</div>}
  {tab==='assets'&&(record.role==='publisher'?<section className={panel}><h2 className="mb-3 font-display text-lg font-bold">Площадки</h2>{record.outlets.length?<div className="divide-y divide-[#d4e0ed]">{record.outlets.map((item:any)=><button key={item.id} className="flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left hover:text-[#006bff] focus-visible:outline-[#006bff]" onClick={()=>onOpenOutlet?.(item.id,id)}><span><strong>{item.name}</strong><span className="mt-1 block break-all text-sm text-[#476788]">{item.url} · {item.kind} · {item.geography}</span></span><span className="text-sm text-[#476788]">{item.status==='approved'?(item.active?'Активна':'На паузе'):item.status==='pending'?'На проверке':'Отклонена'}</span></button>)}</div>:<p className="text-sm text-[#476788]">Площадок нет.</p>}</section>:<CustomerAssets record={record} onOpenAdvertiser={advertiserId=>onOpenAdvertiser?.(advertiserId,id)} onOpenMaterial={materialId=>onOpenMaterial?.(materialId,id)} />)}
  {tab==='orders'&&<UserOrders record={record} onOpen={orderId=>onOpenOrder?.(orderId,id)} />}
  {tab==='finance'&&<div className="space-y-5">{['customer','publisher'].includes(record.role)&&<UserCommission record={record} onChanged={refresh} />}<UserLedger user={record} refreshKey={`${record.available}:${record.reserved}`} /></div>}
  {tab==='activity'&&<div className="space-y-5"><section className={panel}><h2 className="mb-4 font-display text-lg font-bold">Команда</h2>{record.team.length?<div className="divide-y divide-[#d4e0ed]">{record.team.map((member:any)=><button key={member.id} type="button" className="flex w-full flex-wrap justify-between gap-2 py-3 text-left text-sm hover:bg-[#f8f9fb] focus-visible:outline-[#006bff]" onClick={()=>onOpenUser?.(member.id)}><span className="break-all font-medium">{member.email}</span><span className="text-[#476788]">{member.team_role} · {member.blocked_at?'Заблокирован':'Активен'}</span></button>)}</div>:<p className="text-sm text-[#476788]">Участников команды нет.</p>}</section><UserActivity user={record} /></div>}
 </div>;
}
function UserCommission({record,onChanged}:{record:any;onChanged:()=>Promise<void>}) {
 const backend=useBackend();
 const [value,setValue]=useState('');
 useEffect(()=>setValue(String((record.personal_commission_bps??record.default_commission_bps)/100).replace('.',',')),[record.id,record.personal_commission_bps,record.default_commission_bps]);
 const percent=Number(value.replace(',','.'));
 const bps=Math.round(percent*100);
 const valid=/^\d+(?:[.,]\d{0,2})?$/.test(value)&&Number.isInteger(bps)&&bps>=0&&bps<=10000;
 const save=async(next:number|null)=>backend.perform(async()=>{await api(`/admin/users/${record.id}/commission`,'PATCH',{commissionBps:next});await onChanged();});
 return <section className={panel}><h2 className="font-display text-lg font-bold">Комиссия платформы</h2>
  <p className="mt-1 text-sm text-[#476788]">{record.role==='customer'?'Удерживается при пополнении баланса.':'Удерживается из суммы новых заказов до начисления выплаты.'} Изменение не затрагивает созданные счета и заказы.</p>
  <div className="mt-5 flex flex-wrap items-end gap-3"><label className="min-w-40 flex-1 text-sm font-medium text-[#476788]">Ставка, %<input inputMode="decimal" aria-invalid={value!==''&&!valid} className={`${input} mt-2`} value={value} onChange={event=>setValue(event.target.value.replace(/[^\d.,]/g,'').slice(0,6))} /></label><button type="button" className={button} disabled={!valid||backend.busy||bps===record.personal_commission_bps} onClick={()=>save(bps)}>Сохранить</button>{record.personal_commission_bps!==null&&<button type="button" className="rounded-lg border border-[#d4e0ed] px-5 py-3 text-sm font-semibold" disabled={backend.busy} onClick={()=>save(null)}>Вернуть стандартную</button>}</div>
  <p className="mt-3 text-xs text-[#476788]">{record.personal_commission_bps===null?'Стандартная':'Индивидуальная'} ставка · стандартная {record.default_commission_bps/100}%</p>
 </section>;
}
function AdminAdvertiserRecord({id,onBack,onChanged,SelectComponent}:{id:string;onBack:()=>void;onChanged:()=>Promise<void>;SelectComponent:React.ComponentType<any>}) {
 const backend=useBackend(),[record,setRecord]=useState<any>(null),[decision,setDecision]=useState('verified'),[note,setNote]=useState('');
 const [registry,setRegistry]=useState<any>(null),[registryError,setRegistryError]=useState(''),[checking,setChecking]=useState(false);
 const refresh=async()=>setRecord(await api(`/admin/advertisers/${id}`));
 useEffect(()=>{setRegistry(null);setRegistryError('');refresh().catch(error=>backend.setError(error.message));},[id]);
 const checkRegistry=async()=>{
  setChecking(true);setRegistryError('');setRegistry(null);
  try {
   const result=await api(`/admin/advertisers/${id}/registry-check`,'POST',{});
   if(!result.found)setRegistryError('Организация не найдена в реестре DaData.');
   else {setRegistry(result.party);await refresh();await onChanged();}
  } catch(error) {setRegistryError(error instanceof Error?error.message:'Проверка недоступна');}
  finally {setChecking(false);}
 };
 const submit=async(event:React.FormEvent)=>{event.preventDefault();const ok=await backend.perform(async()=>{await api(`/admin/advertisers/${id}/review`,'POST',{decision,evidence:note,note});await refresh();await onChanged();});if(ok)setNote('');};
 return <div className="mx-auto max-w-6xl space-y-6"><button onClick={onBack} className="text-sm text-[#476788]">← К рекламодателям</button>
  {!record?<div className={panel}>Загрузка…</div>:<>
   <header><h1 className="font-display text-2xl font-bold text-[#0b3558]">{record.name}</h1><p className="mt-2 text-sm text-[#476788]">ИНН {record.inn} · {record.email} · {record.verification==='verified'&&record.reviewed_by===null?'Подтвержден по реестру':({pending:'На проверке',verified:'Проверен вручную',blocked:'Заблокирован'} as any)[record.verification]}</p></header>
   <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]"><section className={panel}><h2 className="font-display text-lg font-bold">Данные для маркировки</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2">{Object.entries({
    'Тип рекламодателя':record.details?.kind==='entrepreneur'?'Индивидуальный предприниматель':record.details?.kind==='legal'?'Юридическое лицо':'',
    'Юридическое название':record.name,ИНН:record.inn,КПП:record.details?.kpp,
    'ОГРН / ОГРНИП':record.details?.ogrn,'Юридический адрес':record.details?.address,
    'Объект рекламирования':record.details?.advertisedObject,'Целевая ссылка в материале':record.details?.targetUrl,
    'Тип договора':record.details?.contractType==='intermediary'?'Посреднический договор':record.details?.contractType==='services'?'Договор оказания услуг':'',
    'Номер договора':record.details?.contractNumber,'Дата договора':record.details?.contractDate?new Date(record.details.contractDate).toLocaleDateString('ru-RU'):'',
    'Первый исполнитель по договору':record.details?.executorName,'ИНН первого исполнителя':record.details?.executorInn,
   }).filter(([,value])=>value).map(([label,value])=><div key={label} className="border-b border-[#d4e0ed] pb-2 text-sm"><dt className="text-[#476788]">{label}</dt><dd className="mt-1 break-words font-medium">{String(value)}</dd></div>)}</dl>
    <h3 className="mt-7 font-semibold">Связанные заказы</h3><div className="mt-2 divide-y divide-[#d4e0ed]">{record.orders.map((order:any)=><div key={order.id} className="py-3 text-sm">№{order.number} · {order.snapshot?.title} · {order.status}</div>)}{!record.orders.length&&<p className="py-3 text-sm text-[#476788]">Заказов нет.</p>}</div>
   </section><section className={panel}><h2 className="font-display text-lg font-bold">Проверка</h2>
    <button type="button" className={`${button} mt-4 w-full`} disabled={checking} onClick={checkRegistry}>{checking?'Проверка…':'Сверить с реестром'}</button>
    {registryError&&<p role="status" className="mt-3 text-sm text-[#b42318]">{registryError}</p>}
    {registry&&<div className="mt-4 space-y-3 text-sm">
      <div className={`font-semibold ${registry.status==='ACTIVE'?'text-emerald-700':'text-[#b42318]'}`}>{registry.status==='ACTIVE'?'Действующая организация':({LIQUIDATING:'Ликвидируется',LIQUIDATED:'Ликвидирована',BANKRUPT:'Банкротство',REORGANIZING:'Реорганизация'} as Record<string,string>)[registry.status]||'Статус не определён'}</div>
      {([['Юридическое название',record.name,registry.name],['ИНН',record.inn,registry.inn],['КПП',record.details?.kpp,registry.kpp],['ОГРН / ОГРНИП',record.details?.ogrn,registry.ogrn],['Юридический адрес',record.details?.address,registry.address]] as [string,string,string][]).map(([label,entered,official])=>{
        const normalize=(value:string)=>String(value||'').trim().toLowerCase().replace(/[«»"']/g,'').replace(/\s+/g,' ');
        const same=label==='Юридическое название'?[registry.name,registry.shortName].some((name:string)=>normalize(entered)===normalize(name)):normalize(entered)===normalize(official);
        return <div key={label} className="border-t border-[#d4e0ed] pt-2"><div className="font-medium">{label} <span className={same?'text-emerald-700':'text-[#b46b00]'}>· {same?'совпадает':'сверьте'}</span></div><div className="mt-1 break-words text-[#476788]">Реестр: {official||'не указан'}</div>{!same&&<div className="mt-1 break-words">Карточка: {entered||'не указано'}</div>}</div>;
      })}
    </div>}
    <form className="mt-5 space-y-4 border-t border-[#d4e0ed] pt-4" onSubmit={submit}><label className="block text-sm">Решение<SelectComponent className="mt-2" value={decision} onChange={setDecision} options={[{value:'verified',label:'Подтвердить вручную'},{value:'blocked',label:'Заблокировать'},{value:'pending',label:'Вернуть на проверку'}]} /></label><label className="block text-sm">Комментарий<textarea className={`${input} mt-2 min-h-24`} required minLength={10} maxLength={2000} value={note} onChange={event=>setNote(event.target.value)} /></label><button className={button} disabled={backend.busy||record.verification===decision}>Сохранить решение</button></form></section></div>
   <section className={panel}><h2 className="font-display text-lg font-bold">История решений</h2><div className="mt-3 divide-y divide-[#d4e0ed]">{record.reviews.map((review:any)=><div key={review.id} className="py-3 text-sm"><div className="font-semibold">{review.decision} · {review.reviewer_email} · {new Date(review.created_at).toLocaleString('ru-RU')}</div><p className="mt-1 break-words text-[#476788]">{review.evidence===review.note?review.note:[review.evidence,review.note].filter(Boolean).join(' · ')}</p></div>)}{!record.reviews.length&&<p className="py-3 text-sm text-[#476788]">Решений пока нет.</p>}</div></section>
  </>}
 </div>;
}
function RequisitesReview({user}:{user:any}) {
 const backend=useBackend(),[account,setAccount]=useState<any>(null),[comment,setComment]=useState('');
 useEffect(()=>{let active=true;api(`/admin/users/${user.id}/account`).then(data=>{if(active)setAccount(data);}).catch(error=>{if(active)backend.setError(error.message);});return()=>{active=false;};},[user.id]);
 const decide=async(status:'verified'|'rejected')=>{
   const ok=await backend.perform(async()=>{
     await api(`/admin/users/${user.id}/requisites`,'PATCH',{status,comment});
     setAccount(await api(`/admin/users/${user.id}/account`));setComment('');
   });
   return ok;
 };
 const labels=accountLabels;
 const statusLabel:Record<string,string>={draft:'Не отправлены',pending:'На проверке',verified:'Подтверждены',rejected:'Отклонены'};
 return <section className={panel}><h2 className="font-display text-lg font-bold">Реквизиты</h2>
   {!account?<p className="mt-3 text-sm text-[#476788]">Загрузка…</p>:<>
     <p className="mt-2 text-sm text-[#476788]">{statusLabel[account.requisites_status]||account.requisites_status}</p>
     <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">{Object.entries(account.requisites).filter(([,value])=>Boolean(value)).map(([key,value])=><div key={key} className="min-w-0 border-b border-[#d4e0ed] pb-2"><dt className="text-[#476788]">{labels[key]||key}</dt><dd className="mt-1 break-words font-medium">{String(value)}</dd></div>)}</dl>
     {account.requisites_review_comment&&<p className="mt-4 text-sm text-[#476788]">Причина: {account.requisites_review_comment}</p>}
     {account.requisites_status==='pending'&&<div className="mt-5 space-y-3"><textarea aria-label="Комментарий по реквизитам" className={`${input} min-h-20`} maxLength={2000} value={comment} onChange={event=>setComment(event.target.value)} placeholder="Причина отклонения" /><div className="flex flex-wrap gap-3"><button className={button} disabled={backend.busy} onClick={()=>decide('verified')}>Подтвердить реквизиты</button><button className="rounded-lg border border-red-500 px-5 py-3 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={backend.busy||!comment.trim()} onClick={()=>decide('rejected')}>Отклонить</button></div></div>}
   </>}
 </section>;
}
function UserOutlets({user,onOpenOutlet}:{user:any;onOpenOutlet?:(id:string)=>void}) {
 const {rows,loading}=useRows(`/admin/users/${user.id}/outlets`);
 const kind:Record<string,string>={media:'СМИ',telegram:'Telegram',vk:'ВКонтакте',max:'MAX',dzen:'Дзен'};
 return <section className={panel}><h2 className="font-display text-lg font-bold">Площадки паблишера</h2>
  {loading?<p className="mt-4 text-sm text-[#476788]">Загрузка…</p>:!rows.length?<p className="mt-4 text-sm text-[#476788]">Площадок нет.</p>:<div className="mt-4 divide-y divide-[#d4e0ed]">{rows.map(row=><button key={row.id} type="button" className="flex w-full items-center justify-between gap-4 py-3 text-left text-sm hover:text-[#006bff]" onClick={()=>onOpenOutlet?.(row.id)}><span className="font-semibold">{row.name}</span><span className="text-[#476788]">{kind[row.kind]||row.kind} · {row.status==='approved'?(row.active?'Активна':'На паузе'):row.status==='pending'?'На модерации':'Отклонена'}</span></button>)}</div>}
 </section>;
}
function UserActivity({user}:{user:any}) {
 const {rows,loading}=useRows(`/admin/users/${user.id}/activity`);
 return <section className={panel}><h2 className="font-display text-lg font-bold">Действия пользователя</h2>
  {loading?<p className="mt-4 text-sm text-[#476788]">Загрузка…</p>:!rows.length?<p className="mt-4 text-sm text-[#476788]">Действий пока нет.</p>:<>
   <div className="mt-4 divide-y divide-[#d4e0ed] md:hidden">{rows.map(row=><div key={row.id} className="py-3 text-sm" title={row.user_agent||undefined}><div className="font-medium">{activityAction(row)}</div><div className="mt-1 text-[#476788]">{new Date(row.created_at).toLocaleString('ru-RU')} · {row.status_code<400?'Успешно':`Ошибка ${row.status_code}`}</div><div className="mt-1 text-xs text-[#476788]">{row.actor_id===null?'Попытка без входа · ':''}IP: {row.ip_address||'—'}</div></div>)}</div>
   <div className="mt-4 hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead><tr>{['Дата','Действие','Результат','IP-адрес'].map(label=><th key={label} className="border-b border-[#d4e0ed] p-3 text-[#476788]">{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-b border-[#e6edf5]" title={row.user_agent||undefined}><td className="whitespace-nowrap p-3">{new Date(row.created_at).toLocaleString('ru-RU')}</td><td className="p-3">{activityAction(row)}{row.actor_id===null&&<span className="block text-xs text-[#476788]">Попытка без входа</span>}</td><td className="p-3">{row.status_code<400?'Успешно':`Ошибка ${row.status_code}`}</td><td className="p-3">{row.ip_address||'—'}</td></tr>)}</tbody></table></div>
  </>}
 </section>;
}
function UserLedger({user,refreshKey}:{user:any;refreshKey:string}) {
 const {rows,reload,loading}=useRows('/admin/ledger');
 useEffect(()=>{reload().catch(()=>{});},[refreshKey]);
 const entries=rows.filter(r=>r.debit_account.startsWith(user.id+':')||r.credit_account.startsWith(user.id+':'));
 const account=(value:string,email?:string)=>value.startsWith(user.id+':')?(value.endsWith(':reserved')?'Резерв':'Баланс'):ledgerAccount(value,email);
 return <section className={panel}><h2 className="font-display text-lg font-bold">Операции пользователя</h2>
  {loading?<p className="mt-4 text-sm text-[#476788]">Загрузка…</p>:!entries.length?<p className="mt-4 text-sm text-[#476788]">Операций пока нет.</p>:<>
   <div className="mt-4 divide-y divide-[#d4e0ed] md:hidden">{entries.map(row=><div key={row.id} className="py-3 text-sm"><div className="flex items-start justify-between gap-3"><span className="font-medium">{ledgerReason(row)}</span><span className="shrink-0 font-semibold">{money(row.amount)}</span></div><div className="mt-1 text-[#476788]">{account(row.debit_account,row.debit_email)} → {account(row.credit_account,row.credit_email)}</div><div className="mt-1 text-xs text-[#476788]">{new Date(row.created_at).toLocaleString('ru-RU')}</div></div>)}</div>
   <div className="mt-4 hidden overflow-x-auto md:block"><table className="w-full text-left text-sm"><thead><tr>{['Дата','Операция','Движение','Сумма'].map(label=><th key={label} className="border-b border-[#d4e0ed] p-3 text-[#476788]">{label}</th>)}</tr></thead><tbody>{entries.map(row=><tr key={row.id} className="border-b border-[#e6edf5]"><td className="whitespace-nowrap p-3">{new Date(row.created_at).toLocaleString('ru-RU')}</td><td className="p-3 font-medium">{ledgerReason(row)}</td><td className="p-3 text-[#476788]">{account(row.debit_account,row.debit_email)} → {account(row.credit_account,row.credit_email)}</td><td className="whitespace-nowrap p-3 font-semibold">{money(row.amount)}</td></tr>)}</tbody></table></div>
  </>}
 </section>;
}

function BalanceAdjustmentPanel({user,onBalanceChange,SelectComponent}:{user:any;onBalanceChange:()=>Promise<void>;SelectComponent:React.ComponentType<any>}) {
 const backend=useBackend();
 const {rows,reload,loading}=useRows(`/admin/adjustments?userId=${encodeURIComponent(user.id)}`);
 const [direction,setDirection]=useState('credit');
 const [amount,setAmount]=useState('');
 const [reason,setReason]=useState('');
 const [rejectReasons,setRejectReasons]=useState<Record<string,string>>({});
 const cents=()=>{const value=amount.trim().replace(',','.');if(!/^\d+(?:\.\d{1,2})?$/.test(value))return 0;const [whole,fraction='']=value.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));};
 const submit=async(event:React.FormEvent)=>{
  event.preventDefault();
  const value=cents();if(!Number.isSafeInteger(value)||value<=0||reason.trim().length<10)return;
  const ok=await backend.perform(async()=>{await api('/admin/adjustments','POST',{userId:user.id,direction,amount:value,reason:reason.trim()},crypto.randomUUID());await reload();});
  if(ok){setAmount('');setReason('');}
 };
 const decide=async(id:string,decision:'approved'|'rejected')=>{
  const reviewReason=rejectReasons[id]?.trim()||'';
  if(decision==='rejected'&&reviewReason.length<5)return;
  await backend.perform(async()=>{await api(`/admin/adjustments/${id}/decision`,'POST',{decision,reason:reviewReason});await reload();await onBalanceChange();});
 };
 const statusLabel:Record<string,string>={pending:'Ожидает второго администратора',approved:'Подтверждена',rejected:'Отклонена'};
 return <section className={panel}>
  <h2 className="font-display text-lg font-bold text-[#0b3558]">Ручная корректировка</h2>
  <p className="mt-1 text-sm text-[#476788]">Основание и решение сохраняются в журнале. Деньги изменятся только после подтверждения другим администратором.</p>
  <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
   <div className="text-sm font-medium text-[#476788]">Тип операции<SelectComponent className="mt-2" options={['Начислить','Списать']} value={direction==='credit'?'Начислить':'Списать'} onChange={(value:string)=>setDirection(value==='Начислить'?'credit':'debit')} /></div>
   <label className="text-sm font-medium text-[#476788]">Сумма, ₽<input className={`${input} mt-2`} inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="0,00" /></label>
   <label className="text-sm font-medium text-[#476788] sm:col-span-2">Основание<textarea className={`${input} mt-2 min-h-24`} minLength={10} maxLength={2000} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Укажите документ или обстоятельства корректировки" /></label>
   <div className="sm:col-span-2 flex justify-end"><button className={button} disabled={backend.busy||!cents()||reason.trim().length<10}>Создать и отправить на подтверждение</button></div>
  </form>
  <h3 className="mt-8 border-t border-[#d4e0ed] pt-5 text-sm font-semibold text-[#0b3558]">История корректировок</h3>
  {loading?<p className="mt-3 text-sm text-[#476788]">Загрузка…</p>:rows.length===0?<p className="mt-3 text-sm text-[#476788]">Корректировок пока нет.</p>:<div className="mt-3 divide-y divide-[#d4e0ed]">{rows.map(item=><article key={item.id} className="py-4 text-sm">
   <div className="flex flex-wrap justify-between gap-2"><div className="font-semibold text-[#0b3558]">№{item.number} · {item.direction==='credit'?'+':'−'}{money(item.amount)}</div><span className="text-[#476788]">{statusLabel[item.status]}</span></div>
   <p className="mt-1 break-words text-[#476788]">{item.reason}</p>
   <p className="mt-1 text-xs text-[#476788]">Создал: {item.creator_email} · {new Date(item.created_at).toLocaleString('ru-RU')}</p>
   {item.reviewed_at&&<p className="mt-1 text-xs text-[#476788]">Решение: {item.reviewer_email} · {new Date(item.reviewed_at).toLocaleString('ru-RU')}{item.review_reason?` · ${item.review_reason}`:''}</p>}
   {item.status==='pending'&&item.created_by!==backend.user.id&&<div className="mt-3 flex flex-wrap items-center gap-2"><input className={`${input} min-w-48 flex-1`} aria-label={`Причина отклонения №${item.number}`} value={rejectReasons[item.id]||''} onChange={event=>setRejectReasons({...rejectReasons,[item.id]:event.target.value})} placeholder="Причина отклонения" /><button type="button" className="rounded-lg border border-[#d4e0ed] px-4 py-2.5 font-semibold" disabled={backend.busy||!rejectReasons[item.id]?.trim()||rejectReasons[item.id].trim().length<5} onClick={()=>decide(item.id,'rejected')}>Отклонить</button><button type="button" className={button} disabled={backend.busy} onClick={()=>decide(item.id,'approved')}>Подтвердить</button></div>}
  </article>)}</div>}
 </section>;
}
export function Conversation({path,title}:{path:string;title:string}) {
 const backend=useBackend(),{rows,reload}=useRows(path),[body,setBody]=useState('');
 useEffect(()=>{const timer=setInterval(()=>{reload().catch(()=>{});},5000);return()=>clearInterval(timer);},[path]);
 return <section className={panel}><h2 className="mb-5 font-display text-xl font-bold">{title}</h2><div className="space-y-4">{rows.map(m=><article key={m.id} className="border-b pb-4"><div className="text-xs text-[#476788]">{m.email} · {new Date(m.created_at).toLocaleString('ru-RU')}</div><p className="mt-2 whitespace-pre-wrap break-words">{m.body}</p></article>)}{!rows.length&&<p>Сообщений пока нет</p>}</div><form className="mt-5 space-y-3" onSubmit={e=>{e.preventDefault();backend.perform(async()=>{await api(path,'POST',{body});setBody('');await reload();});}}><textarea aria-label="Сообщение" required maxLength={10000} className={input} value={body} onChange={e=>setBody(e.target.value)} /><button className={button} disabled={backend.busy||!body.trim()}>Отправить сообщение</button></form></section>;
}
export function OrderConversation({orderId,onBack}:{orderId:any;onBack?:()=>void}) {
 const backend=useBackend();const order=backend.data.orders.find(o=>o.id===orderId);
 if(!order)return <div className={panel}>Сначала выберите заказ в списке.</div>;
 return <OrderChat order={order} onBack={onBack} />;
}
function OrderChat({order,onBack}:{order:any;onBack?:()=>void}) {
 const backend=useBackend(),{rows,reload}=useRows(`/orders/${order.id}/messages`),[body,setBody]=useState('');
 useEffect(()=>{const timer=setInterval(()=>reload().catch(()=>{}),5000);return()=>clearInterval(timer);},[order.id]);
 const events=['Заказ создан',...(order.apiStatus==='pending'?[]:['Площадка приняла заказ']),...(['submitted','completed','disputed','refunded'].includes(order.apiStatus)?['Площадка загрузила ссылку']:[]),...(order.apiStatus==='disputed'?['Заказчик открыл спор']:[]),...(order.apiStatus==='completed'?['Заказ завершен']:[]),...(order.apiStatus==='rejected'?['Площадка отказалась от заказа']:[]),...(order.apiStatus==='refunded'?['Средства возвращены заказчику']:[])];
 return <div className="mx-auto max-w-6xl space-y-6">
   {onBack&&<button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={onBack}><ChevronLeft className="h-4 w-4" />К карточке заказа</button>}
   <div><h1 className="font-display text-2xl font-bold text-[#0b3558]">Чат заказа №{order.number}</h1><p className="mt-1 text-sm text-[#476788]">Сообщения, файлы и системные события по заказу.</p></div>
   <section className="grid grid-cols-1 overflow-hidden rounded-lg border border-[#d4e0ed] bg-white lg:grid-cols-3">
     <div className="flex min-h-[620px] flex-col lg:col-span-2">
       <header className="border-b border-[#d4e0ed] bg-[#f8f9fb] px-6 py-4"><h2 className="font-display text-sm font-bold text-[#0b3558]">Сообщения и системные события</h2></header>
       <div className="flex-1 space-y-5 overflow-y-auto bg-[#f8f9fb] p-6">
         {events.map(event=><div key={event} className="flex justify-center"><div className="rounded-lg border border-[#d4e0ed] bg-white px-3 py-2 text-xs text-[#476788]">{event}</div></div>)}
         {rows.map(message=>{const own=message.author_id===backend.user.id;return <article key={message.id} data-message-owner={own?'self':'other'} className={`max-w-[82%] rounded-2xl border p-4 text-sm ${own?'ml-auto border-[#0b3558] bg-[#0b3558] text-white':'border-[#d4e0ed] bg-white text-[#0b3558]'}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><div className={`mt-2 text-[11px] ${own?'text-white/70':'text-[#6885a2]'}`}>{message.email} · {new Date(message.created_at).toLocaleString('ru-RU')}</div></article>;})}
         {!rows.length&&<div className="flex min-h-40 items-center justify-center text-sm text-[#476788]">Напишите первое сообщение по заказу</div>}
       </div>
       <form className="border-t border-[#d4e0ed] bg-white p-4" onSubmit={event=>{event.preventDefault();backend.perform(async()=>{await api(`/orders/${order.id}/messages`,'POST',{body});setBody('');await reload();});}}><div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Сообщение" required maxLength={10000} className="min-h-[44px] flex-1 rounded-lg border border-[#476788] px-4 py-2 text-sm" placeholder="Написать сообщение..." value={body} onChange={event=>setBody(event.target.value)} /><button className={button} disabled={backend.busy||!body.trim()}>Отправить</button></div></form>
     </div>
     <aside className="space-y-5 border-t border-[#d4e0ed] p-6 lg:border-l lg:border-t-0"><div><h3 className="mb-3 text-sm font-semibold text-[#0b3558]">Файлы и версии</h3><div className="border-b border-[#d4e0ed] py-2 text-sm text-[#006bff]">Материал версия {order.snapshot?.version||1}</div></div><div><h3 className="mb-3 text-sm font-semibold text-[#0b3558]">События</h3><div className="space-y-2">{events.map(event=><div key={event} className="text-xs text-[#476788]">{event}</div>)}</div></div></aside>
   </section>
 </div>;
}
function TicketConversation({ticket,onStatusChange,onReply}:{ticket:any;onStatusChange:()=>Promise<void>;onReply:()=>Promise<void>}) {
 const backend=useBackend(),{rows,reload}=useRows(`/tickets/${ticket.id}/messages`),[body,setBody]=useState('');
 useEffect(()=>{const timer=setInterval(()=>reload().catch(()=>{}),5000);return()=>clearInterval(timer);},[ticket.id]);
 const closed=ticket.status==='closed';
 return <section className="flex h-[min(580px,calc(100dvh-16rem))] min-h-[390px] flex-col overflow-hidden rounded-lg border border-[#d4e0ed] bg-white">
   <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d4e0ed] bg-[#f8f9fb] px-6 py-4">
     <div><h2 className="font-semibold text-[#0b3558]">T-{ticket.number} · {ticket.subject}</h2><p className="mt-1 text-xs text-[#476788]">Менеджер: Операции Аксиомы · SLA 4 часа</p></div>
     {backend.user.role==='admin'&&<button className="rounded-lg border border-[#d4e0ed] bg-white px-3 py-2 text-xs font-semibold text-[#0b3558]" onClick={()=>backend.perform(onStatusChange)}>{closed?'Открыть тикет':'Закрыть тикет'}</button>}
   </header>
   <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
     {rows.map(message=>{
       const manager=message.role==='admin',own=message.author_id===backend.user.id;
       return <article key={message.id} data-message-owner={own?'self':'other'} className={`max-w-[82%] rounded-2xl border p-4 text-sm text-[#0b3558] ${own?'ml-auto border-[#cfe0ff] bg-[#e6f0ff]':'border-[#d4e0ed] bg-[#f8f9fb]'}`}>
         <p className="whitespace-pre-wrap break-words">{message.body}</p>
         <div className="mt-2 text-[11px] text-[#6885a2]">{manager?'Менеджер поддержки':message.email} · {new Date(message.created_at).toLocaleString('ru-RU')}</div>
       </article>;
     })}
     {!rows.length&&<p className="text-sm text-[#476788]">Сообщений пока нет</p>}
   </div>
   <form className="shrink-0 border-t border-[#d4e0ed] p-3 sm:p-4" onSubmit={event=>{event.preventDefault();backend.perform(async()=>{await api(`/tickets/${ticket.id}/messages`,'POST',{body});setBody('');await reload();await onReply();});}}>
     <textarea aria-label="Сообщение менеджеру" required maxLength={10000} disabled={closed} className="h-16 w-full resize-y rounded-lg border border-[#476788] px-4 py-3 text-sm disabled:bg-[#f8f9fb]" placeholder={closed?'Тикет закрыт':'Напишите сообщение менеджеру'} value={body} onChange={event=>setBody(event.target.value)} />
     <div className="mt-2 flex flex-wrap justify-between gap-2">
       <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d4e0ed] bg-white px-4 py-3 text-sm font-semibold text-[#0b3558]" title="Ожидает подключения"><Paperclip className="h-4 w-4" />Прикрепить файл</button>
       <button className={button} disabled={backend.busy||closed||!body.trim()}>Отправить</button>
     </div>
   </form>
 </section>;
}

type SupportListItem={id:string;title:string;description:string;status:string;tone:'blue'|'green'|'amber'|'gray';awaitingReply?:boolean};
function SupportList({title,items,onOpen,empty,action,className=''}:{title:string;items:SupportListItem[];onOpen:(id:string)=>void;empty:string;action?:React.ReactNode;className?:string}) {
 const tones={blue:'bg-[#e6f0ff] text-[#004eba] border-[#e6f0ff]',green:'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',amber:'bg-[#f0f3f8] text-[#0b3558] border-[#d4e0ed]',gray:'bg-[#f0f3f8] text-[#476788] border-[#f0f3f8]'};
 return <section className={`support-list min-w-0 ${className}`}>
  <div className="flex flex-wrap items-center justify-between gap-4 px-4"><h2 className="font-display text-lg font-bold text-[#0b3558]">{title}</h2>{action}</div>
  <div className="mt-6 divide-y divide-[#d4e0ed]">
   {items.map(item=><button key={item.id} type="button" data-awaiting-reply={Boolean(item.awaitingReply)} aria-label={item.awaitingReply?`${item.title}. Ожидает вашего ответа`:undefined} className="support-list-row flex w-full flex-col justify-between gap-4 px-4 py-5 text-left hover:bg-[#f8f9fb] focus-visible:outline-[#006bff] sm:flex-row sm:items-center" onClick={()=>onOpen(item.id)}>
    <span className="min-w-0"><span className="flex items-start gap-2 break-words text-sm font-semibold text-[#0b3558]"><span aria-hidden="true" data-reply-indicator={Boolean(item.awaitingReply)} className={`mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#ef4444] ${item.awaitingReply?'':'invisible'}`} /><span className="min-w-0 break-words">{item.title}</span></span><span className="mt-1 block pl-4 text-sm text-[#476788]">{item.description}</span></span>
    <span className="flex shrink-0 items-center gap-3"><span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${tones[item.tone]}`}>{item.status}</span><span className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl border border-[#d4e0ed] bg-white px-5 text-sm font-semibold text-[#0b3558]">Открыть</span></span>
   </button>)}
   {!items.length&&<p className="text-sm text-[#476788]">{empty}</p>}
  </div>
 </section>;
}

export function DisputeList({onOpen,className=''}:{onOpen:(id:string)=>void;className?:string}) {
 const {data}=useBackend();
 const items=data.orders.filter(order=>order.dispute_number).sort((a,b)=>Number(b.dispute_number)-Number(a.dispute_number)).map(order=>({id:order.id,title:`#C-${String(order.dispute_number).padStart(4,'0')} · Заказ №${order.number} · ${order.platform}`,description:'Доказательства, переписка и решение модератора',status:order.apiStatus==='disputed'?'на рассмотрении':'решен',tone:order.apiStatus==='disputed'?'amber' as const:'green' as const,awaitingReply:order.awaiting_reply}));
 return <SupportList title="Жалобы и споры" items={items} onOpen={onOpen} empty="Жалоб и споров пока нет." className={className} />;
}

export function SupportDesk({navigate=()=>{},onOpenDispute}:{navigate?:(view:string)=>void;onOpenDispute?:(id:any)=>void}) {
 const backend=useBackend(),isAdmin=backend.user.role==='admin',{rows,reload,loading}=useRows('/tickets'),[selectedId,setSelectedId]=useState<any>(()=>new URLSearchParams(location.search).get('ticket')),[creating,setCreating]=useState(false),[subject,setSubject]=useState(''),[body,setBody]=useState('');
 useEffect(()=>{const url=new URL(location.href);const disputes=url.searchParams.get('support_tab')==='disputes';if(url.searchParams.has('support_tab')){url.searchParams.delete('support_tab');history.replaceState(null,'',url.pathname+url.search);if(isAdmin&&disputes)navigate('admin_complaints');}},[isAdmin]);
 useEffect(()=>{const restore=()=>setSelectedId(new URLSearchParams(location.search).get('ticket'));window.addEventListener('popstate',restore);const timer=setInterval(()=>reload().catch(()=>{}),15000);return()=>{window.removeEventListener('popstate',restore);clearInterval(timer);};},[]);
 const changeLocation=(id:string|null=null)=>{const url=new URL(location.href);url.searchParams.delete('support_tab');if(id)url.searchParams.set('ticket',id);else url.searchParams.delete('ticket');history.pushState(null,'',url.pathname+url.search);setSelectedId(id);};
 const selected=rows.find(ticket=>ticket.id===selectedId);
 const createTicket=async event=>{event.preventDefault();await backend.perform(async()=>{const ticket=await api('/tickets','POST',{subject,body});setCreating(false);setSubject('');setBody('');await reload();changeLocation(ticket.id);});};
 return <div className="space-y-6">
   <h1 className="font-display text-2xl font-bold text-[#0b3558]">Поддержка</h1>
   {selected?<div className="space-y-4"><button className="text-sm text-[#476788]" onClick={()=>changeLocation()}>← К тикетам</button><TicketConversation ticket={selected} onReply={reload} onStatusChange={async()=>{await api(`/tickets/${selected.id}`,'PATCH',{status:selected.status==='closed'?'open':'closed'});await reload();}} /></div>:<>
     <SupportList title="Список тикетов" items={rows.map(ticket=>({id:ticket.id,title:`T-${ticket.number} · ${ticket.subject}`,description:'Переписка с поддержкой',status:ticket.status==='closed'?'Закрыт':'Открыт',tone:ticket.status==='closed'?'gray':'blue',awaitingReply:ticket.awaiting_reply}))} onOpen={changeLocation} empty={loading?'Загрузка…':'Тикетов пока нет.'} action={!isAdmin&&<button className={button} onClick={()=>setCreating(true)}>Создать тикет</button>} />
     {!isAdmin&&<SupportDisputes navigate={navigate} onOpen={onOpenDispute||(()=>{})} />}
   </>}
   {creating&&createPortal(<div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0b3558]/20 p-4 backdrop-blur-sm" onClick={()=>setCreating(false)}><form className="w-full max-w-lg rounded-2xl border border-[#d4e0ed] bg-white p-6 shadow-xl" onClick={event=>event.stopPropagation()} onSubmit={createTicket}><h2 className="font-display text-xl font-bold text-[#0b3558]">Новый тикет</h2><label className="mt-5 block text-sm text-[#476788]">Тема<input aria-label="Тема обращения" required maxLength={200} className={`${input} mt-2`} value={subject} onChange={event=>setSubject(event.target.value)} /></label><label className="mt-4 block text-sm text-[#476788]">Сообщение<textarea aria-label="Текст обращения" required maxLength={10000} className={`${input} mt-2 min-h-[140px]`} value={body} onChange={event=>setBody(event.target.value)} /></label><div className="mt-5 flex justify-end gap-3"><button type="button" className="rounded-lg border border-[#d4e0ed] px-5 py-3 text-sm font-semibold text-[#0b3558]" onClick={()=>setCreating(false)}>Отмена</button><button className={button} disabled={backend.busy}>Создать тикет</button></div></form></div>,document.body)}
 </div>;
}

function SupportDisputes({navigate,onOpen}:{navigate:(view:string)=>void;onOpen:(id:any)=>void}) {
 const backend=useBackend(),isPublisher=backend.user.role==='publisher',isAdmin=backend.user.role==='admin';
 return <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
   <DisputeList onOpen={onOpen} className={isAdmin?'lg:col-span-3':'lg:col-span-2'} />
   {!isAdmin&&<aside className="support-list self-start">
     <h2 className="font-display text-lg font-bold text-[#0b3558]">{isPublisher?'Ответ по спору':'Новая жалоба'}</h2>
     <p className="mt-3 text-sm leading-6 text-[#476788]">{isPublisher?'Ответ и доказательства отправляются из карточки спора, чтобы сохранить связь с заказом, публикацией и выплатой.':'Жалоба открывается из карточки заказа, чтобы сохранить связь с публикацией, деньгами и доказательствами.'}</p>
     <button className={`${button} mt-5 w-full`} onClick={()=>navigate(isPublisher?'pub_orders':backend.user.role==='admin'?'admin_orders':'orders')}>Перейти к заказам</button>
   </aside>}
 </div>;
}
export function Disputes({orderId=null}:{orderId?:any}) {
 const backend=useBackend(),[selected,setSelected]=useState(orderId),[reason,setReason]=useState('');
 const order=backend.data.orders.find(o=>o.id===selected);
 const act=(action)=>backend.perform(async()=>{await api(`/orders/${order.id}/action`,'POST',{action,reason},crypto.randomUUID());setReason('');await backend.refresh();});
 if(!order)return <div className="space-y-5"><h1 className="font-display text-2xl font-bold">Жалобы и споры</h1><div className={panel}>{backend.data.orders.filter(o=>o.dispute_number).map(o=><button key={o.id} className="block w-full border-b py-4 text-left" onClick={()=>setSelected(o.id)}>Спор №{o.dispute_number} · Заказ №{o.number} · {o.material} · {o.status}</button>)}</div></div>;
 return <div className="space-y-5"><button onClick={()=>setSelected(null)}>← К спорам</button><div className={panel}><h1 className="text-xl font-bold">{order.dispute_number?`Спор №${order.dispute_number}`:`Жалоба по заказу №${order.number}`}</h1><p className="my-4">{order.reason||order.material}</p><p>{order.status} · {money(order.amount)}</p>{((backend.user.role==='customer'&&order.apiStatus==='submitted')||(backend.user.role==='admin'&&order.apiStatus==='disputed'))&&<div className="mt-4 space-y-3"><textarea aria-label="Причина" className={input} value={reason} onChange={e=>setReason(e.target.value)} /><div className="flex flex-wrap gap-3">{backend.user.role==='admin'?<><button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('refund')}>Вернуть заказчику</button><button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('release')}>Начислить паблишеру</button></>:<button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('dispute')}>Открыть спор</button>}</div></div>}</div><OrderConversation orderId={order.id} /></div>;
}
