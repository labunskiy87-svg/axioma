import React,{useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Paperclip} from 'lucide-react';
import {useBackend} from './prototype-backend';
import {api} from './api';
const panel='rounded-lg border border-[#d4e0ed] bg-white p-6';
const input='w-full rounded-lg border border-[#476788] p-3 text-sm';
const button='rounded-lg bg-[#006bff] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50';
const money=(v:any)=>`${(Number(v)/100).toLocaleString('ru-RU')} ₽`;
export function useRows(path:string) {
 const backend=useBackend(),[rows,setRows]=useState<any[]>([]),[loading,setLoading]=useState(true);
 const reload=async()=>{setRows(await api(path));setLoading(false);};
 useEffect(()=>{let active=true;setLoading(true);api(path).then(r=>{if(active){setRows(r);setLoading(false);}}).catch(e=>{if(active){backend.setError(e.message);setLoading(false);}});return()=>{active=false;};},[path]);
 return {rows,reload,loading};
}
export function AdminRecords({kind}:{kind:string}) {
 const endpoint=kind==='balances'?'users':kind;
 const {rows,loading}=useRows(`/admin/${endpoint}`),[query,setQuery]=useState(''),[selected,setSelected]=useState<any>(null);
 const titles={users:'Пользователи',balances:'Балансы пользователей',advertisers:'Рекламодатели',audit:'Аудит',ledger:'Движение средств'};
 const visible=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));
 if(selected && ['users','balances'].includes(kind))return <div className="space-y-5"><button onClick={()=>setSelected(null)}>← К пользователям</button><div className={panel}><h1 className="text-xl font-bold">{selected.email}</h1><div className="mt-4 flex gap-8"><span>Доступно: {money(selected.available)}</span><span>В резерве: {money(selected.reserved)}</span></div></div><UserLedger user={selected} /></div>;
 return <div className="space-y-5"><h1 className="font-display text-2xl font-bold">{titles[kind]}</h1><input aria-label="Поиск" className={input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск" /><div className={`${panel} overflow-x-auto`}>
 {loading?'Загрузка…':!visible.length?'Записей нет':<table className="w-full text-left text-sm"><thead><tr>{(kind==='users'||kind==='balances'?['Email','Роль','Доступно','В резерве']:kind==='advertisers'?['Название','ИНН','Владелец','Проверка']:kind==='audit'?['Дата','Пользователь','Действие','Объект']:['Дата','Списание','Зачисление','Сумма','Основание']).map(s=><th key={s} className="border-b p-3 text-[#476788]">{s}</th>)}</tr></thead><tbody>{visible.map(r=><tr key={r.id} className="border-b hover:bg-[#f8f9fb]" onClick={()=>setSelected(r)}>{(kind==='users'||kind==='balances'?[r.email,({customer:'Заказчик',publisher:'Паблишер',admin:'Администратор'})[r.role],money(r.available),money(r.reserved)]:kind==='advertisers'?[r.name,r.inn,r.email,({verified:'Проверен',pending:'На проверке',blocked:'Заблокирован'})[r.verification]]:kind==='audit'?[new Date(r.created_at).toLocaleString('ru-RU'),r.email||'Система',r.action,r.entity_id||'—']:[new Date(r.created_at).toLocaleString('ru-RU'),r.debit_account,r.credit_account,money(r.amount),r.reference]).map((cell,i)=><td key={i} className="p-3 break-words">{cell}</td>)}</tr>)}</tbody></table>}
 </div></div>;
}
function UserLedger({user}) {
 const {rows}=useRows('/admin/ledger');
 return <section className={panel}><h2 className="mb-4 font-bold">Операции пользователя</h2>{rows.filter(r=>r.debit_account.startsWith(user.id+':')||r.credit_account.startsWith(user.id+':')).map(r=><div key={r.id} className="border-b py-3 text-sm"><div>{r.reference}</div><div>{money(r.amount)} · {r.debit_account.endsWith(':reserved')?'Резерв':'Доступный баланс'} → {r.credit_account=== 'platform:revenue'?'Комиссия платформы':r.credit_account.startsWith(user.id+':')?'Баланс пользователя':'Контрагент'}</div></div>)}</section>;
}
export function Conversation({path,title}:{path:string;title:string}) {
 const backend=useBackend(),{rows,reload}=useRows(path),[body,setBody]=useState('');
 useEffect(()=>{const timer=setInterval(()=>{reload().catch(()=>{});},5000);return()=>clearInterval(timer);},[path]);
 return <section className={panel}><h2 className="mb-5 font-display text-xl font-bold">{title}</h2><div className="space-y-4">{rows.map(m=><article key={m.id} className="border-b pb-4"><div className="text-xs text-[#476788]">{m.email} · {new Date(m.created_at).toLocaleString('ru-RU')}</div><p className="mt-2 whitespace-pre-wrap break-words">{m.body}</p></article>)}{!rows.length&&<p>Сообщений пока нет</p>}</div><form className="mt-5 space-y-3" onSubmit={e=>{e.preventDefault();backend.perform(async()=>{await api(path,'POST',{body});setBody('');await reload();});}}><textarea aria-label="Сообщение" required maxLength={10000} className={input} value={body} onChange={e=>setBody(e.target.value)} /><button className={button} disabled={backend.busy||!body.trim()}>Отправить сообщение</button></form></section>;
}
export function OrderConversation({orderId}:{orderId:any}) {
 const backend=useBackend();const order=backend.data.orders.find(o=>o.id===orderId);
 return order?<Conversation path={`/orders/${order.id}/messages`} title={`Чат заказа №${order.number}`} />:<div className={panel}>Сначала выберите заказ в списке.</div>;
}
function TicketConversation({ticket,onStatusChange}:{ticket:any;onStatusChange:()=>Promise<void>}) {
 const backend=useBackend(),{rows,reload}=useRows(`/tickets/${ticket.id}/messages`),[body,setBody]=useState('');
 useEffect(()=>{const timer=setInterval(()=>reload().catch(()=>{}),5000);return()=>clearInterval(timer);},[ticket.id]);
 const closed=ticket.status==='closed';
 return <section className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-[#d4e0ed] bg-white">
   <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#d4e0ed] bg-[#f8f9fb] px-6 py-4">
     <div><h2 className="font-semibold text-[#0b3558]">T-{ticket.number} · {ticket.subject}</h2><p className="mt-1 text-xs text-[#476788]">Менеджер: Операции Аксиомы · SLA 4 часа</p></div>
     {backend.user.role==='admin'&&<button className="rounded-lg border border-[#d4e0ed] bg-white px-3 py-2 text-xs font-semibold text-[#0b3558]" onClick={()=>backend.perform(onStatusChange)}>{closed?'Открыть тикет':'Закрыть тикет'}</button>}
   </header>
   <div className="flex-1 space-y-4 overflow-y-auto p-6">
     {rows.map(message=>{
       const manager=message.role==='admin',own=message.author_id===backend.user.id;
       return <article key={message.id} data-message-owner={own?'self':'other'} className={`max-w-[82%] rounded-2xl border p-4 text-sm text-[#0b3558] ${own?'ml-auto border-[#cfe0ff] bg-[#e6f0ff]':'border-[#d4e0ed] bg-[#f8f9fb]'}`}>
         <p className="whitespace-pre-wrap break-words">{message.body}</p>
         <div className="mt-2 text-[11px] text-[#6885a2]">{manager?'Менеджер поддержки':message.email} · {new Date(message.created_at).toLocaleString('ru-RU')}</div>
       </article>;
     })}
     {!rows.length&&<p className="text-sm text-[#476788]">Сообщений пока нет</p>}
   </div>
   <form className="border-t border-[#d4e0ed] p-4" onSubmit={event=>{event.preventDefault();backend.perform(async()=>{await api(`/tickets/${ticket.id}/messages`,'POST',{body});setBody('');await reload();});}}>
     <textarea aria-label="Сообщение менеджеру" required maxLength={10000} disabled={closed} className="min-h-[100px] w-full resize-y rounded-lg border border-[#476788] px-4 py-3 text-sm disabled:bg-[#f8f9fb]" placeholder={closed?'Тикет закрыт':'Напишите сообщение менеджеру'} value={body} onChange={event=>setBody(event.target.value)} />
     <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row">
       <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#d4e0ed] bg-white px-4 py-3 text-sm font-semibold text-[#0b3558]" title="Ожидает подключения"><Paperclip className="h-4 w-4" />Прикрепить файл</button>
       <button className={button} disabled={backend.busy||closed||!body.trim()}>Отправить</button>
     </div>
   </form>
 </section>;
}

export function SupportDesk({navigate=()=>{},onOpenDispute}:{navigate?:(view:string)=>void;onOpenDispute?:(id:any)=>void}) {
 const backend=useBackend(),{rows,reload,loading}=useRows('/tickets'),[tab,setTab]=useState('tickets'),[selectedId,setSelectedId]=useState<any>(null),[creating,setCreating]=useState(false),[subject,setSubject]=useState(''),[body,setBody]=useState('');
 useEffect(()=>{if(rows.length&&!rows.some(ticket=>ticket.id===selectedId))setSelectedId(rows[0].id);},[rows,selectedId]);
 const selected=rows.find(ticket=>ticket.id===selectedId);
 const createTicket=async event=>{event.preventDefault();await backend.perform(async()=>{const ticket=await api('/tickets','POST',{subject,body});setCreating(false);setSubject('');setBody('');await reload();setSelectedId(ticket.id);});};
 return <div className="space-y-6">
   <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
     <h1 className="font-display text-2xl font-bold text-[#0b3558]">Поддержка</h1>
     <div className="flex w-fit rounded-lg border border-[#d4e0ed] bg-white p-1">
       <button className={`rounded-md px-4 py-2 text-sm font-semibold ${tab==='tickets'?'bg-[#0b3558] text-white':'text-[#476788]'}`} onClick={()=>setTab('tickets')}>Тикеты</button>
       <button className={`rounded-md px-4 py-2 text-sm font-semibold ${tab==='disputes'?'bg-[#0b3558] text-white':'text-[#476788]'}`} onClick={()=>setTab('disputes')}>Жалобы и споры</button>
     </div>
   </div>
   {tab==='disputes'?<SupportDisputes navigate={navigate} onOpen={onOpenDispute||(()=>{})} />:<div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
     <aside className="overflow-hidden rounded-lg border border-[#d4e0ed] bg-white">
       <div className="border-b border-[#d4e0ed] bg-[#f8f9fb] px-5 py-4 font-semibold text-[#0b3558]">Список тикетов</div>
       <div>{loading?<p className="p-5 text-sm text-[#476788]">Загрузка…</p>:rows.map(ticket=><button key={ticket.id} className={`w-full border-b border-[#d4e0ed] px-5 py-4 text-left hover:bg-[#f8f9fb] ${ticket.id===selectedId?'bg-[#f8f9fb]':''}`} onClick={()=>setSelectedId(ticket.id)}><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[#0b3558]">T-{ticket.number}</span><span className={`rounded-full px-3 py-1 text-xs ${ticket.status==='closed'?'bg-[#f0f3f8] text-[#476788]':'bg-[#e6f0ff] text-[#0054c7]'}`}>{ticket.status==='closed'?'Закрыт':'Открыт'}</span></div><div className="mt-1 text-sm text-[#476788]">{ticket.subject}</div></button>)}</div>
       {backend.user.role!=='admin'&&<div className="p-5"><button className={`${button} w-full`} onClick={()=>setCreating(true)}>Создать тикет</button></div>}
     </aside>
     {selected?<TicketConversation ticket={selected} onStatusChange={async()=>{await api(`/tickets/${selected.id}`,'PATCH',{status:selected.status==='closed'?'open':'closed'});await reload();}} />:<div className={`${panel} min-h-[620px] text-sm text-[#476788]`}>Выберите тикет в списке.</div>}
   </div>}
   {creating&&createPortal(<div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0b3558]/20 p-4 backdrop-blur-sm" onClick={()=>setCreating(false)}><form className="w-full max-w-lg rounded-2xl border border-[#d4e0ed] bg-white p-6 shadow-xl" onClick={event=>event.stopPropagation()} onSubmit={createTicket}><h2 className="font-display text-xl font-bold text-[#0b3558]">Новый тикет</h2><label className="mt-5 block text-sm text-[#476788]">Тема<input aria-label="Тема обращения" required maxLength={200} className={`${input} mt-2`} value={subject} onChange={event=>setSubject(event.target.value)} /></label><label className="mt-4 block text-sm text-[#476788]">Сообщение<textarea aria-label="Текст обращения" required maxLength={10000} className={`${input} mt-2 min-h-[140px]`} value={body} onChange={event=>setBody(event.target.value)} /></label><div className="mt-5 flex justify-end gap-3"><button type="button" className="rounded-lg border border-[#d4e0ed] px-5 py-3 text-sm font-semibold text-[#0b3558]" onClick={()=>setCreating(false)}>Отмена</button><button className={button} disabled={backend.busy}>Создать тикет</button></div></form></div>,document.body)}
 </div>;
}

function SupportDisputes({navigate,onOpen}:{navigate:(view:string)=>void;onOpen:(id:any)=>void}) {
 const backend=useBackend(),isPublisher=backend.user.role==='publisher';
 const disputes=backend.data.orders.filter(order=>order.dispute_number);
 return <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
   <section className={`${panel} lg:col-span-2`}>
     <h2 className="mb-5 font-display text-lg font-bold text-[#0b3558]">Жалобы и споры</h2>
     {disputes.length?disputes.map(order=>{
       const pending=order.apiStatus==='disputed';
       return <div key={order.id} className="flex flex-col justify-between gap-4 border-b border-[#d4e0ed] py-4 first:pt-0 sm:flex-row sm:items-center">
         <div className="min-w-0"><div className="break-words text-sm font-semibold text-[#0b3558]">#C-{String(order.dispute_number).padStart(3,'0')} · Заказ №{order.number} · {order.platform}</div><div className="mt-1 text-xs text-[#476788]">Доказательства, переписка и решение модератора</div></div>
         <div className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs ${pending?'bg-[#fff3d6] text-[#8a5700]':'bg-[#dcfce7] text-[#16723a]'}`}>{pending?'на рассмотрении':'решен'}</span><button className="rounded-lg border border-[#d4e0ed] bg-white px-4 py-2.5 text-sm font-semibold text-[#0b3558]" onClick={()=>onOpen(order.id)}>Открыть</button></div>
       </div>;
     }):<p className="text-sm text-[#476788]">Жалоб и споров пока нет.</p>}
   </section>
   <aside className={panel}>
     <h2 className="font-display text-lg font-bold text-[#0b3558]">{isPublisher?'Ответ по спору':'Новая жалоба'}</h2>
     <p className="mt-3 text-sm leading-6 text-[#476788]">{isPublisher?'Ответ и доказательства отправляются из карточки спора, чтобы сохранить связь с заказом, публикацией и выплатой.':'Жалоба открывается из карточки заказа, чтобы сохранить связь с публикацией, деньгами и доказательствами.'}</p>
     <button className={`${button} mt-5 w-full`} onClick={()=>navigate(isPublisher?'pub_orders':backend.user.role==='admin'?'admin_orders':'orders')}>Перейти к заказам</button>
   </aside>
 </div>;
}
export function Disputes({orderId=null}:{orderId?:any}) {
 const backend=useBackend(),[selected,setSelected]=useState(orderId),[reason,setReason]=useState('');
 const order=backend.data.orders.find(o=>o.id===selected);
 const act=(action)=>backend.perform(async()=>{await api(`/orders/${order.id}/action`,'POST',{action,reason},crypto.randomUUID());setReason('');await backend.refresh();});
 if(!order)return <div className="space-y-5"><h1 className="font-display text-2xl font-bold">Жалобы и споры</h1><div className={panel}>{backend.data.orders.filter(o=>o.dispute_number).map(o=><button key={o.id} className="block w-full border-b py-4 text-left" onClick={()=>setSelected(o.id)}>Спор №{o.dispute_number} · Заказ №{o.number} · {o.material} · {o.status}</button>)}</div></div>;
 return <div className="space-y-5"><button onClick={()=>setSelected(null)}>← К спорам</button><div className={panel}><h1 className="text-xl font-bold">{order.dispute_number?`Спор №${order.dispute_number}`:`Жалоба по заказу №${order.number}`}</h1><p className="my-4">{order.reason||order.material}</p><p>{order.status} · {money(order.amount)}</p>{((backend.user.role==='customer'&&order.apiStatus==='submitted')||(backend.user.role==='admin'&&order.apiStatus==='disputed'))&&<div className="mt-4 space-y-3"><textarea aria-label="Причина" className={input} value={reason} onChange={e=>setReason(e.target.value)} /><div className="flex flex-wrap gap-3">{backend.user.role==='admin'?<><button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('refund')}>Вернуть заказчику</button><button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('release')}>Начислить паблишеру</button></>:<button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('dispute')}>Открыть спор</button>}</div></div>}</div><OrderConversation orderId={order.id} /></div>;
}
