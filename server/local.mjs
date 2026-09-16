// Local evaluation only. Production always uses the PostgreSQL connection pool.
import { PGlite } from '@electric-sql/pglite';
import { buildApp,createUser } from './app.mjs';
import { randomBytes } from 'node:crypto';
import { writeFile,access } from 'node:fs/promises';
import { audit } from './finance.mjs';
import { migrate } from './db.mjs';
if (process.env.NODE_ENV === 'production') throw new Error('Embedded database is not a production runtime');
const pg = new PGlite(process.env.LOCAL_DATABASE_PATH ?? './.local-db');
const wrap = client => ({ query: async (sql,args) => args ? client.query(sql,args) : (await client.exec(sql)).at(-1) });
const db = { ...wrap(pg), transaction: fn => pg.transaction(tx => fn(wrap(tx))), close: () => pg.close() };
await migrate(db);
if(process.argv.includes('--seed-communications')) {
  try {const {seedCommunications}=await import('./demo-communications.mjs');console.log(JSON.stringify(await seedCommunications(db)));}
  finally {await db.close();}
  process.exit(0);
}
if(process.argv.includes('--seed-demo')) {
  try {const {seedDemo}=await import('./demo.mjs');console.log(JSON.stringify(await seedDemo(db)));}
  finally {await db.close();}
  process.exit(0);
}
if(process.argv.includes('--create-accounts')) {
  const path='./.local-accounts.json';
  try {await access(path);throw new Error('Local credentials already exist; accounts have not been changed');}
  catch(error) {if(error.code!=='ENOENT') {await db.close();throw error;}}
  try {
    const accounts=await db.transaction(async tx=>{
      const result=[];
      for(const role of ['publisher','admin']) {
        const email=`${role}@axioma.local`;
        const password=randomBytes(24).toString('base64url');
        const user=await createUser(tx,email,password,role);
        await audit(tx,user.id,'user.provision',user.id,{role,environment:'local'});
        result.push({email,password,role});
      }
      await writeFile(path,JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
      return result;
    });
    console.log(`Created ${accounts.length} local accounts. Credentials: ${path}`);
  } finally {await db.close();}
  process.exit(0);
}
const app = await buildApp({db,origin:process.env.APP_ORIGIN ?? 'http://127.0.0.1:5173',logger:true});
app.addHook('onClose',()=>db.close());
for (const signal of ['SIGINT','SIGTERM']) process.once(signal,async()=>{await app.close();process.exit(0);});
await app.listen({host:'127.0.0.1',port:Number(process.env.PORT ?? 3001)});
