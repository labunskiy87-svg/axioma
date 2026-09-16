import { database } from './db.mjs';
import { config } from './config.mjs';
import { buildApp } from './app.mjs';
const c=config();
const db=database(c.DATABASE_URL);
const app=await buildApp({db,origin:c.APP_ORIGIN,secure:c.NODE_ENV==='production',commissionBps:c.COMMISSION_BPS,logger:{redact:['req.headers.cookie','req.headers.authorization']}});
app.addHook('onClose',()=>db.close());
for (const signal of ['SIGINT','SIGTERM']) process.once(signal,async()=>{await app.close();process.exit(0);});
try {
  await db.query('SELECT 1 FROM migrations LIMIT 1');
  await app.listen({port:c.PORT,host:c.HOST});
} catch(error) { app.log.error(error);await app.close();process.exitCode=1; }
