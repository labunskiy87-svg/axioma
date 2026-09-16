import { z } from 'zod';
export function config(env=process.env) {
  const value=z.object({
    DATABASE_URL:z.string().regex(/^postgres(?:ql)?:\/\//),
    APP_ORIGIN:z.string().url(),
    PORT:z.coerce.number().int().min(1).max(65535).default(3001),
    HOST:z.string().default('127.0.0.1'),
    NODE_ENV:z.enum(['development','test','production']).default('development'),
    COMMISSION_BPS:z.coerce.number().int().min(0).max(10000).default(1500),
  }).parse(env);
  if (new URL(value.APP_ORIGIN).origin !== value.APP_ORIGIN) throw new Error('APP_ORIGIN must be an origin without path');
  if (value.NODE_ENV==='production' && !value.APP_ORIGIN.startsWith('https://')) throw new Error('Production requires HTTPS');
  return value;
}
