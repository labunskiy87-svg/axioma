import { database } from './db.mjs';
import { config } from './config.mjs';
import { buildApp } from './app.mjs';
import { startReputationWorker } from './reputation-worker.mjs';
const c=config();
const db=database(c.DATABASE_URL);
const app=await buildApp({db,origin:c.APP_ORIGIN,secure:c.NODE_ENV==='production',commissionBps:c.COMMISSION_BPS,integrationSecret:c.INTEGRATION_SECRETS_KEY,dadataKey:c.DADATA_API_KEY,logger:{redact:['req.headers.cookie','req.headers.authorization','req.body']},sellerConfig:{name:c.AXIOMA_SELLER_NAME,inn:c.AXIOMA_SELLER_INN,kpp:c.AXIOMA_SELLER_KPP,address:c.AXIOMA_SELLER_ADDRESS,bank:c.AXIOMA_SELLER_BANK,bic:c.AXIOMA_SELLER_BIC,account:c.AXIOMA_SELLER_ACCOUNT,correspondentAccount:c.AXIOMA_SELLER_CORRESPONDENT_ACCOUNT},tochkaConfig:{customerCode:c.TOCHKA_CUSTOMER_CODE,accountId:c.TOCHKA_ACCOUNT_ID,apiToken:c.TOCHKA_API_TOKEN,apiUrl:c.TOCHKA_API_URL,webhookPublicKey:c.TOCHKA_WEBHOOK_PUBLIC_KEY}});
let stopWorker=()=>{};
app.addHook('onClose',()=>{stopWorker();return db.close();});
for (const signal of ['SIGINT','SIGTERM']) process.once(signal,async()=>{await app.close();process.exit(0);});
try {
  await db.query('SELECT 1 FROM migrations LIMIT 1');
  await db.query("UPDATE reputation_scans SET status='failed',error='Сканирование прервано перезапуском сервера',completed_at=now() WHERE status='running'");
  await app.listen({port:c.PORT,host:c.HOST});
  stopWorker=startReputationWorker(db,{integrationSecret:c.INTEGRATION_SECRETS_KEY,appOrigin:c.APP_ORIGIN,logger:app.log});
} catch(error) { app.log.error(error);await app.close();process.exitCode=1; }
