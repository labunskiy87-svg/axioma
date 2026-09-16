import React,{useEffect,useState} from 'react';
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
export function SupportDesk() {
 const backend=useBackend(),{rows,reload}=useRows('/tickets'),[selected,setSelected]=useState<any>(null),[creating,setCreating]=useState(false),[subject,setSubject]=useState(''),[body,setBody]=useState('');
 return <div className="space-y-5"><h1 className="font-display text-2xl font-bold">Поддержка</h1>{selected?<><button onClick={()=>setSelected(null)}>← К обращениям</button><Conversation path={`/tickets/${selected.id}/messages`} title={`Обращение №${selected.number}: ${selected.subject}`} />{backend.user.role==='admin'&&<button className={button} onClick={()=>backend.perform(async()=>{await api(`/tickets/${selected.id}`,'PATCH',{status:selected.status==='closed'?'open':'closed'});setSelected(null);await reload();})}>{selected.status==='closed'?'Открыть обращение':'Закрыть обращение'}</button>}</>:<>{backend.user.role!=='admin'&&<button className={button} onClick={()=>setCreating(!creating)}>Новое обращение</button>}{creating&&<form className={`${panel} space-y-4`} onSubmit={e=>{e.preventDefault();backend.perform(async()=>{const ticket=await api('/tickets','POST',{subject,body});setCreating(false);setSubject('');setBody('');await reload();setSelected(ticket);});}}><input aria-label="Тема обращения" required className={input} value={subject} onChange={e=>setSubject(e.target.value)} /><textarea aria-label="Текст обращения" required className={input} value={body} onChange={e=>setBody(e.target.value)} /><button disabled={backend.busy} className={button}>Создать обращение</button></form>}<div className={panel}>{rows.map(t=><button key={t.id} className="block w-full border-b py-4 text-left" onClick={()=>setSelected(t)}>№{t.number} · {t.subject}<span className="block text-sm text-[#476788]">{t.email} · {t.status==='open'?'Открыто':'Закрыто'}</span></button>)}</div></>}</div>;
}
export function Disputes({orderId=null}:{orderId?:any}) {
 const backend=useBackend(),[selected,setSelected]=useState(orderId),[reason,setReason]=useState('');
 const order=backend.data.orders.find(o=>o.id===selected);
 const act=(action)=>backend.perform(async()=>{await api(`/orders/${order.id}/action`,'POST',{action,reason},crypto.randomUUID());setReason('');await backend.refresh();});
 if(!order)return <div className="space-y-5"><h1 className="font-display text-2xl font-bold">Жалобы и споры</h1><div className={panel}>{backend.data.orders.filter(o=>o.dispute_number).map(o=><button key={o.id} className="block w-full border-b py-4 text-left" onClick={()=>setSelected(o.id)}>Спор №{o.dispute_number} · Заказ №{o.number} · {o.material} · {o.status}</button>)}</div></div>;
 return <div className="space-y-5"><button onClick={()=>setSelected(null)}>← К спорам</button><div className={panel}><h1 className="text-xl font-bold">{order.dispute_number?`Спор №${order.dispute_number}`:`Жалоба по заказу №${order.number}`}</h1><p className="my-4">{order.reason||order.material}</p><p>{order.status} · {money(order.amount)}</p>{((backend.user.role==='customer'&&order.apiStatus==='submitted')||(backend.user.role==='admin'&&order.apiStatus==='disputed'))&&<div className="mt-4 space-y-3"><textarea aria-label="Причина" className={input} value={reason} onChange={e=>setReason(e.target.value)} /><div className="flex flex-wrap gap-3">{backend.user.role==='admin'?<><button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('refund')}>Вернуть заказчику</button><button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('release')}>Начислить паблишеру</button></>:<button className={button} disabled={backend.busy||!reason.trim()} onClick={()=>act('dispute')}>Открыть спор</button>}</div></div>}</div><OrderConversation orderId={order.id} /></div>;
}
