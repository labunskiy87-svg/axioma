import { z } from 'zod';
export function config(env=process.env) {
  const value=z.object({
    DATABASE_URL:z.string().regex(/^postgres(?:ql)?:\/\//),
    APP_ORIGIN:z.string().url(),
    PORT:z.coerce.number().int().min(1).max(65535).default(3001),
    HOST:z.string().default('127.0.0.1'),
    NODE_ENV:z.enum(['development','test','production']).default('development'),
    COMMISSION_BPS:z.coerce.number().int().min(0).max(10000).default(1500),
    INTEGRATION_SECRETS_KEY:z.string().min(16).optional(),
    DADATA_API_KEY:z.preprocess(value=>value===''?undefined:value,z.string().min(1).optional()),
    AXIOMA_SELLER_NAME:z.string().optional(),
    AXIOMA_SELLER_INN:z.string().optional(),
    AXIOMA_SELLER_KPP:z.string().optional(),
    AXIOMA_SELLER_ADDRESS:z.string().optional(),
    AXIOMA_SELLER_BANK:z.string().optional(),
    AXIOMA_SELLER_BIC:z.string().optional(),
    AXIOMA_SELLER_ACCOUNT:z.string().optional(),
    AXIOMA_SELLER_CORRESPONDENT_ACCOUNT:z.string().optional(),
    TOCHKA_CUSTOMER_CODE:z.string().optional(),
    TOCHKA_ACCOUNT_ID:z.string().optional(),
    TOCHKA_API_TOKEN:z.string().optional(),
    TOCHKA_API_URL:z.preprocess(value=>value===''?undefined:value,z.string().url().optional()),
    TOCHKA_WEBHOOK_PUBLIC_KEY:z.string().optional(),
  }).parse(env);
  if (new URL(value.APP_ORIGIN).origin !== value.APP_ORIGIN) throw new Error('APP_ORIGIN must be an origin without path');
  if (value.NODE_ENV==='production' && !value.APP_ORIGIN.startsWith('https://')) throw new Error('Production requires HTTPS');
  if (value.NODE_ENV==='production' && !value.INTEGRATION_SECRETS_KEY) throw new Error('Production requires INTEGRATION_SECRETS_KEY');
  return value;
}
