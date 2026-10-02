import React, { useEffect, useState } from 'react';
import { LogOut, RefreshCw, Plus, Save, Send } from 'lucide-react';
import { api, ApiError } from './api';

const formats = { article: 'Статья', news: 'Новость', post: 'Пост', longread: 'Лонгрид' };
const statuses = { draft: 'Черновик', pending: 'На рассмотрении', approved: 'Принят', rejected: 'Отклонен', accepted: 'В работе', submitted: 'Ожидает приемки', completed: 'Завершен', disputed: 'Спор', refunded: 'Возврат' };
const money = (v: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v / 100);
const input = 'w-full border border-slate-300 rounded-md px-3 py-2 bg-white';
const button = 'inline-flex items-center justify-center gap-2 border border-slate-300 rounded-md px-4 py-2 bg-white disabled:opacity-50';
const blank = () => ({ key: crypto.randomUUID(), title: '', body: '', format: 'article', advertiserId: '', projectId: '' });

export default function ApiWorkspace() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('materials');
  const [data, setData] = useState<any>({ materials: [], projects: [], advertisers: [], outlets: [], orders: [], moderation: [], balance: {} });
  const [drafts, setDrafts] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<Record<string, any>>({});
  const [expedited, setExpedited] = useState(false);
  const [register, setRegister] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [requestKey, setRequestKey] = useState(crypto.randomUUID());

  async function refresh(current = user) {
    if (!current) return;
    const paths = current.role === 'customer' ? ['materials', 'projects', 'advertisers', 'outlets', 'orders', 'balance'] : current.role === 'admin' ? ['materials', 'outlets', 'orders', 'moderation', 'balance'] : ['outlets', 'orders', 'balance'];
    const entries = await Promise.all(paths.map(async path => [path, await api(`/${path}`)]));
    setData((old: any) => ({ ...old, ...Object.fromEntries(entries) }));
  }
  async function run(fn: () => Promise<void>) {
    setBusy(true); setError('');
    try { await fn(); } catch (e) {
      if (e instanceof ApiError && e.status === 401) setUser(null);
      setError(e instanceof Error ? e.message : 'Не удалось выполнить запрос');
    } finally { setBusy(false); }
  }
  useEffect(() => { api('/auth/me').then(async u => { setUser(u); setTab(u.role === 'admin' ? 'moderation' : u.role === 'publisher' ? 'orders' : 'materials'); await refresh(u); }).catch(e => { if (!(e instanceof ApiError && e.status === 401)) setError('Нет соединения с API'); }).finally(() => setLoading(false)); }, []);
  const change = (key: string, field: string, value: string) => setDrafts(items => items.map(d => d.key === key ? { ...d, [field]: value } : d));
  async function saveDrafts() {
    const result = { ...saved };
    for (const draft of drafts) {
      const { key, ...fields } = draft;
      const payload = { ...fields, projectId: fields.projectId || null };
      if (result[key]) result[key] = await api(`/materials/${result[key].id}`, 'PUT', { ...payload, version: result[key].version });
      else result[key] = (await api('/materials/batch', 'POST', [payload], key))[0];
      setSaved({ ...result });
    }
    return result;
  }
  const tabs = user?.role === 'customer' ? { materials: 'Материалы', advertisers: 'Рекламодатели', projects: 'Проекты', outlets: 'Площадки', orders: 'Заказы' } : user?.role === 'admin' ? { moderation: 'Модерация', outlets: 'Площадки', orders: 'Заказы' } : { orders: 'Заказы', outlets: 'Площадки' };

  if (loading) return <main className="p-8">Загрузка…</main>;
  if (!user) return <main className="max-w-md mx-auto px-6 py-16"><h1 className="text-2xl font-bold mb-8">Аксиома</h1><form className="space-y-4" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); run(async () => { const payload = Object.fromEntries(form); if (register) await api('/auth/register', 'POST', payload); const u = await api('/auth/login', 'POST', payload); setUser(u); setTab(u.role === 'admin' ? 'moderation' : u.role === 'publisher' ? 'orders' : 'materials'); await refresh(u); }); }}>
    <h2 className="text-xl">{register ? 'Регистрация заказчика' : 'Вход'}</h2>
    <label className="block">Электронная почта<input className={input} name="email" type="email" autoComplete="username" required /></label>
    <label className="block">Пароль<input className={input} name="password" type="password" minLength={12} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} required /></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <button className={button} disabled={busy}>{register ? 'Зарегистрироваться' : 'Войти'}</button>
    <button className="block text-blue-600" type="button" onClick={() => setRegister(!register)}>{register ? 'Уже есть аккаунт' : 'Создать аккаунт'}</button>
  </form></main>;
  return <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5"><h1 className="text-xl font-bold">Аксиома</h1><div className="flex items-center gap-4 flex-wrap"><span className="break-all">{user.email}</span><span>{money(data.balance.available ?? 0)}</span><button className={button} title="Обновить" aria-label="Обновить" disabled={busy} onClick={() => run(() => refresh())}><RefreshCw size={18} /></button><button className={button} title="Выйти" aria-label="Выйти" onClick={() => run(async () => { await api('/auth/logout', 'POST', {}); setUser(null); setDrafts([]); setSaved({}); })}><LogOut size={18} /></button></div></header>
    <nav className="flex gap-5 border-b py-4 overflow-x-auto" aria-label="Кабинет">{Object.entries(tabs).map(([id, label]) => <button key={id} className={`whitespace-nowrap ${tab === id ? 'text-blue-600 font-bold' : ''}`} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {error && <p role="alert" className="text-red-700 py-4">{error}</p>}
    <section className="py-6"><h2 className="text-xl font-bold mb-5">{tabs[tab]}</h2>
      {tab === 'materials' && <>
        {!drafts.length && <button className={button} onClick={() => { setEditing(false); setDrafts([blank()]); }}><Plus size={18} />Добавить материал</button>}
        {drafts.length > 0 && <form className="space-y-6" onSubmit={e => { e.preventDefault(); run(async () => { await saveDrafts(); if (!editing) setDrafts(items => [...items, blank()]); await refresh(); }); }}>
          {drafts.map((d, index) => <fieldset key={d.key} className="border-b py-5 space-y-3"><legend className="font-bold">Материал {index + 1}</legend>
            <label className="block">Заголовок<input className={input} required maxLength={200} value={d.title} onChange={e => change(d.key, 'title', e.target.value)} /></label>
            <div className="grid sm:grid-cols-3 gap-4"><label>Формат<select className={input} value={d.format} onChange={e => change(d.key, 'format', e.target.value)}>{Object.entries(formats).map(([id, text]) => <option value={id} key={id}>{text}</option>)}</select></label>
              <label>Рекламодатель<select className={input} required value={d.advertiserId} onChange={e => change(d.key, 'advertiserId', e.target.value)}><option value="">Выберите</option>{data.advertisers.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
              <label>Проект<select className={input} value={d.projectId} onChange={e => change(d.key, 'projectId', e.target.value)}><option value="">Без проекта</option>{data.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label></div>
            <label className="block">Текст<textarea aria-label="Текст" className={input} rows={8} required value={d.body} onChange={e => change(d.key, 'body', e.target.value)} /></label>
          </fieldset>)}
          <div className="flex flex-wrap gap-3">{!editing && <button className={button} disabled={busy}><Plus size={18} />Сохранить и добавить еще материал</button>}<button type="button" className={button} disabled={busy} onClick={e => { if (!e.currentTarget.form?.reportValidity()) return; run(async () => { await saveDrafts(); await refresh(); }); }}><Save size={18} />Сохранить</button></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={expedited} onChange={e => setExpedited(e.target.checked)} />Ускоренная модерация · 50 ₽ за материал</label>
          <button type="button" className={button} disabled={busy} onClick={e => { if (!e.currentTarget.form?.reportValidity()) return; run(async () => { const result = await saveDrafts(); await api('/materials/submit', 'POST', { ids: drafts.map(d => result[d.key].id), expedited }, requestKey); setRequestKey(crypto.randomUUID()); setDrafts([]); setSaved({}); await refresh(); }); }}><Send size={18} />Отправить на модерацию</button>
        </form>}
        {data.materials.map(m => <div key={m.id} className="border-b py-4 flex flex-wrap items-center justify-between gap-3"><div><strong>{m.title}</strong><p className="text-sm">{formats[m.format]} · {statuses[m.status]}</p></div>{m.status !== 'pending' && !drafts.length && <button className={button} onClick={() => { setEditing(true); const key = crypto.randomUUID(); setDrafts([{ key, title: m.title, body: m.body, format: m.format, metadata: m.metadata, advertiserId: m.advertiser_id, projectId: m.project_id ?? '' }]); setSaved({ [key]: m }); }}>Редактировать</button>}</div>)}
      </>}
      {['projects', 'advertisers'].includes(tab) && <><form className="flex flex-wrap gap-3 mb-6" key={tab} onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const fields = Object.fromEntries(new FormData(form)); run(async () => { await api(`/${tab}`, 'POST', fields); form.reset(); await refresh(); }); }}><input className={`${input} sm:w-72`} name="name" aria-label="Название" placeholder="Название" required />{tab === 'advertisers' && <input className={`${input} sm:w-56`} name="inn" aria-label="ИНН" placeholder="ИНН" pattern="[0-9]{10}|[0-9]{12}" required />}<button className={button} disabled={busy}><Plus size={18} />Добавить</button></form>{data[tab].map(p => <div className="border-b py-4" key={p.id}>{p.name}{p.verification && <span className="ml-3 text-sm">{p.verification === 'verified' ? 'Проверен' : p.verification === 'blocked' ? 'Заблокирован' : 'Ожидает проверки'}</span>}</div>)}</>}
      {tab === 'outlets' && <>
        {user.role === 'customer' && <div className="flex flex-wrap gap-3 mb-5"><select className={`${input} sm:w-80`} aria-label="Материал для заказа" value={materialId} onChange={e => { setMaterialId(e.target.value); setRequestKey(crypto.randomUUID()); }}><option value="">Выберите материал</option>{data.materials.filter(m => m.status === 'approved').map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select><button className={button} disabled={busy || !materialId || !selected.length} onClick={() => run(async () => { await api('/orders', 'POST', { materialId, outletIds: selected }, requestKey); setSelected([]); setRequestKey(crypto.randomUUID()); setTab('orders'); await refresh(); })}>Создать заказы</button></div>}
        {data.outlets.map(o => <div key={o.id} className="border-b py-4 flex justify-between flex-wrap gap-4"><div className="flex items-center gap-3">{user.role === 'customer' && <input type="checkbox" aria-label={`Выбрать ${o.name}`} checked={selected.includes(o.id)} onChange={e => { setSelected(s => e.target.checked ? [...s, o.id] : s.filter(id => id !== o.id)); setRequestKey(crypto.randomUUID()); }} />}<div><strong>{o.name}</strong><p className="text-sm">{o.geography} · {Object.entries(o.prices).map(([f, p]) => `${formats[f]} ${money(p as number)}`).join(' · ')}</p></div></div>{user.role === 'admin' && o.status === 'pending' && <button className={button} disabled={busy} onClick={() => run(async () => { await api(`/admin/outlets/${o.id}`, 'POST', { approved: true }); await refresh(); })}>Одобрить</button>}{user.role === 'publisher' && o.status === 'approved' && <label className="flex items-center gap-2"><input type="checkbox" checked={o.active} disabled={busy} onChange={e => { const active = e.target.checked; run(async () => { await api(`/outlets/${o.id}/active`, 'POST', { active }); await refresh(); }); }} />Активна</label>}</div>)}
      </>}
      {tab === 'moderation' && data.moderation.map(m => <article key={m.id} className="border-b py-5 space-y-3"><h3 className="font-bold">{m.title}{m.expedited && <span className="ml-3 text-amber-700">Ускоренная</span>}</h3><p className="whitespace-pre-wrap break-words">{m.body}</p><button className={button} disabled={busy} onClick={() => run(async () => { await api(`/moderation/${m.id}`, 'POST', { approved: true }); await refresh(); })}>Принять</button></article>)}
      {tab === 'orders' && data.orders.map(o => <article key={o.id} className="border-b py-5 space-y-3"><h3 className="font-bold">{o.snapshot.title}</h3><p>{o.snapshot.outlet.name} · {statuses[o.status]} · {money(user.role === 'publisher' ? o.payout : o.amount)}</p><details><summary>Материал</summary><p className="whitespace-pre-wrap break-words py-3">{o.snapshot.body}</p><p>{o.snapshot.advertiser.name} · ИНН {o.snapshot.advertiser.inn}</p></details>{o.publication_url && <a className="text-blue-600 break-all" href={o.publication_url} target="_blank" rel="noreferrer">{o.publication_url}</a>}{((user.role === 'publisher' && o.status === 'pending') || (user.role === 'customer' && o.status === 'submitted')) && <button className={button} disabled={busy} onClick={() => run(async () => { await api(`/orders/${o.id}/action`, 'POST', { action: user.role === 'publisher' ? 'accept' : 'complete' }, crypto.randomUUID()); await refresh(); })}>{user.role === 'publisher' ? 'Принять заказ' : 'Принять публикацию'}</button>}{user.role === 'publisher' && o.status === 'accepted' && <form className="space-y-3" onSubmit={e => { e.preventDefault(); const fields = new FormData(e.currentTarget); run(async () => { await api(`/orders/${o.id}/action`, 'POST', { action: 'publish', url: fields.get('url'), markingConfirmed: true }, crypto.randomUUID()); await refresh(); }); }}><input className={input} type="url" name="url" aria-label="Ссылка на публикацию" placeholder="https://" required /><label className="flex gap-2"><input type="checkbox" required />Маркировка выполнена, данные переданы через ОРД в ЕРИР</label><button className={button} disabled={busy}>Отправить ссылку</button></form>}</article>)}
      {Array.isArray(data[tab]) && data[tab].length === 0 && <p className="text-slate-500 py-5">Нет записей</p>}
    </section>
  </main>;
}
