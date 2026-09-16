import React, { useEffect, useState } from 'react';
import { useBackend } from './prototype-backend';

export function useCabinetView(role: string, initial: string) {
  const read = () => {
    const [base, section] = location.pathname.split('/').filter(Boolean);
    if (base !== role || !section || section === 'login') return initial;
    if (!/^[a-z_-]+$/.test(section)) return initial;
    return `${role === 'customer' ? '' : role === 'publisher' ? 'pub_' : 'admin_'}${section.replace(/-/g, '_')}`;
  };
  const [view, setView] = useState(read);
  useEffect(() => {
    const listener = () => setView(read());
    window.addEventListener('popstate', listener);
    return () => window.removeEventListener('popstate', listener);
  }, []);
  const navigate = (next: string) => {
    const section = next.replace(/^(pub_|admin_)/, '').replace(/_/g, '-');
    const path = next === initial ? `/${role}` : `/${role}/${section}`;
    if (location.pathname !== path) history.pushState(null, '', path);
    setView(next);
  };
  return [view, navigate] as const;
}

export function AdminLogin() {
  const backend = useBackend();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return <main className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-5">
    <form className="w-full max-w-md rounded-lg border border-[#d4e0ed] bg-white p-8" onSubmit={e => {e.preventDefault();backend.authenticate(email,password,false,'admin');}}>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Аксиома</h1>
      <p className="mt-2 mb-6 text-sm text-[#476788]">Вход администратора платформы</p>
      <label className="mb-5 block text-sm">Email<input required type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-[#476788] p-3" /></label>
      <label className="mb-6 block text-sm">Пароль<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-[#476788] p-3" /></label>
      <button disabled={backend.busy} className="w-full rounded-lg bg-[#006bff] p-3 font-semibold text-white disabled:opacity-50">Войти</button>
    </form>
  </main>;
}
