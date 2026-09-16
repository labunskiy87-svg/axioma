import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';

export const formatLabels = { article: 'Статья', news: 'Новость', post: 'Пост', longread: 'Лонгрид' };
const statusLabels = { draft: 'Черновик', pending: 'На модерации', approved: 'Принят в систему', rejected: 'Отклонен' };
const orderLabels = { pending: 'Площадка рассматривает', accepted: 'Ожидает публикации', submitted: 'Ожидает приемки', completed: 'Завершено', rejected: 'Площадка отказала', disputed: 'Спор', refunded: 'Возврат' };
const empty = { materials: [], orders: [], projects: [], advertisers: [], outlets: [], informers:[], balance: { available: 0, reserved: 0 } };
const Context = createContext<any>(null);
export const useBackend = () => useContext(Context);
const date = (v: string) => new Date(v).toLocaleDateString('ru-RU');

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(empty);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const bootstrap=useRef<Promise<any>|null>(null);
  const [outletId, setOutletId] = useState<string | null>(()=>new URLSearchParams(location.search).get('outlet'));
  async function refresh(u = user) {
    if (!u) return;
    const paths = u.role === 'customer' ? ['materials', 'orders', 'projects', 'advertisers', 'outlets', 'balance','informers'] : u.role === 'admin' ? ['materials', 'orders', 'outlets', 'balance','informers'] : ['orders', 'outlets', 'balance','informers'];
    const next = { ...empty, ...Object.fromEntries(await Promise.all(paths.map(async p => [p, await api(`/${p}`)]))) };
    const advertisers = next.advertisers.map(a => ({ ...a, code: a.id.slice(0, 8), type: a.inn.length === 12 ? 'ИП' : 'Юридическое лицо', ogrn: a.details?.ogrn || '', status: a.verification === 'verified' ? 'Проверен' : a.verification === 'blocked' ? 'Заблокирован' : 'Проверка запрошена', color: a.verification === 'verified' ? 'green' : 'amber' }));
    const orders = next.orders.map(o => ({ ...o, material: o.snapshot.title, platform: o.snapshot.outlet.name, price: o.amount / 100, frozen: ['completed','rejected','refunded'].includes(o.status) ? 0 : o.amount / 100, projectId: o.project_id, date: date(o.created_at), status: orderLabels[o.status], apiStatus: o.status, statusColor: o.status === 'completed' ? 'green' : 'blue', action: orderLabels[o.status] }));
    setData({ ...next, advertisers, orders,
      materials: next.materials.map(m => ({ ...m, name: m.title, type: formatLabels[m.format], advertiser: advertisers.find(a => a.id === m.advertiser_id)?.name ?? '', advertiserId: m.advertiser_id, projectId: m.project_id, note: m.metadata.notes ?? '', status: statusLabels[m.status], apiStatus: m.status, statusColor: m.status === 'approved' ? 'green' : m.status === 'rejected' ? 'red' : 'blue', placements: orders.filter(o => o.material_id === m.id).length, date: date(m.created_at) })),
      projects: next.projects.map(p => ({ ...p, code: p.id.slice(0, 8), description: p.description ?? '', advertisers: p.advertisers ?? [], status: p.completed ? 'Завершен' : 'Активный', updatedAt: date(p.created_at) })),
      outlets: next.outlets.map(o => ({ ...o, type: {media:'СМИ',telegram:'ТГ-канал',vk:'Паблик ВК',max:'Канал в MAX',dzen:'Канал в Дзене'}[o.kind], theme: (o.details.topics ?? []).join(', '), region: o.geography, goals: (o.details.goals ?? []).map(g => ({pr:'Пиар',seo:'SEO',serm:'SERM'}[g])), formats: Object.keys(o.prices).map(f => formatLabels[f]), format: formatLabels[Object.keys(o.prices)[0]], price: Math.min(...Object.values(o.prices) as number[]) / 100, formatPrices: Object.fromEntries(Object.entries(o.prices).map(([f,p]) => [formatLabels[f], Number(p)/100])), reach: `${o.details.dailyAudience ?? 0} / день`, mediology: o.details.medialogiaRank ?? '—', aggregators: (o.details.aggregators ?? []).map(a => a === 'dzen' ? 'Дзен' : 'Google News'), deadline: `${o.details.publicationDays} дня`, storage: `${o.details.storageMonths} мес.`, tags: [], logo: 'bg-[#0b3558]' }))
    });
  }
  async function perform(fn: () => Promise<any>) {
    if (busy) return false;
    setBusy(true); setError('');
    try { await fn(); return true; } catch(e) {
      if (e instanceof ApiError && e.status === 401) { setUser(null); setData(empty); }
      setError(e instanceof Error ? e.message : 'Не удалось выполнить операцию'); return false;
    } finally { setBusy(false); }
  }
  useEffect(() => {
    let active=true;
    bootstrap.current??=api('/auth/me').then(async u=>{await refresh(u);return u;});
    bootstrap.current.then(u=>{if(active)setUser(u);}).catch(e=>{
      if(active&&!(e instanceof ApiError&&e.status===401))setError(e.status===429?'Слишком много запросов. Повторите через минуту.':'Нет соединения с сервером. Проверьте запуск API.');
    }).finally(()=>{if(active)setReady(true);});
    return()=>{active=false;};
  }, []);
  async function authenticate(email: string, password: string, registration: boolean, expectedRole?: string) {
    return perform(async () => {
      if (registration) await api('/auth/register','POST',{email,password});
      const u = await api('/auth/login','POST',{email,password,...(!registration && expectedRole ? {expectedRole}: {})}); await refresh(u); history.replaceState(null,'',`/${u.role}`);window.dispatchEvent(new PopStateEvent('popstate'));setUser(u);
    });
  }
  const value = { user, data, ready, busy, perform, refresh, authenticate, error, setError, outletId, setOutletId,
    logout: () => perform(async () => { await api('/auth/logout','POST',{}); setUser(null); setData(empty); }) };
  return <Context.Provider value={value}>{children}{error && <div role="alertdialog" aria-label="Ошибка операции" className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/20 p-4"><div className="w-full max-w-lg rounded-xl border border-[#d4e0ed] bg-white p-6 shadow-xl"><h2 className="text-lg font-bold text-[#0b3558]">Не удалось выполнить операцию</h2><p className="my-4 break-words text-sm text-[#476788]">{error}</p><button className="rounded-lg bg-[#006bff] px-5 py-2 text-white" onClick={() => setError('')}>Закрыть</button></div></div>}</Context.Provider>;
}

export function materialPayload(material: any, advertisers: any[]) {
  const advertiserId = material.advertiserId ?? advertisers.find(a => a.name === material.advertiser)?.id;
  if (!advertiserId) throw new Error('Сначала добавьте и выберите рекламодателя.');
  return { title: material.name, body: material.body ?? '', format: Object.keys(formatLabels).find(k => formatLabels[k] === material.type), advertiserId, projectId: material.projectId ?? null, metadata: { ...material.metadata, notes: material.note ?? '' } };
}
