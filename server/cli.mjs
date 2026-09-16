import { database,migrate } from './db.mjs';
import { createUser } from './app.mjs';
import { credentials } from './validation.mjs';
import { audit } from './finance.mjs';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const db=database(process.env.DATABASE_URL);
try {
  const command=process.argv[2];
  if(command==='migrate') {await migrate(db);console.log('Migrations applied');}
  else if(command==='user') {
    const {email,password}=credentials.parse({email:process.env.CREATE_USER_EMAIL,password:process.env.CREATE_USER_PASSWORD});
    const role=process.env.CREATE_USER_ROLE;
    if(!['admin','publisher'].includes(role)) throw new Error('CREATE_USER_ROLE must be admin or publisher');
    const user=await db.transaction(async tx=>{
      const u=await createUser(tx,email,password,role);
      await audit(tx,u.id,'user.provision',u.id,{role});return u;
    });
    console.log(JSON.stringify(user));
  } else throw new Error('Use migrate or user');
} finally {await db.close();}
