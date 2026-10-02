import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {TOTP,Secret} from 'otpauth';
import QRCode from 'qrcode';
import {z} from 'zod';
import {digest,fail,role,verifyPassword} from './security.mjs';
import {audit} from './finance.mjs';

const keyFor=value=>createHash('sha256').update(value).digest();
const seal=(value,key)=>{
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',keyFor(key),iv);
  const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return [iv,cipher.getAuthTag(),data].map(part=>part.toString('base64url')).join('.');
};
const open=(value,key)=>{
  const [iv,tag,data]=value.split('.').map(part=>Buffer.from(part,'base64url'));
  const decipher=createDecipheriv('aes-256-gcm',keyFor(key),iv);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8');
};
const totp=(secret,email='')=>new TOTP({issuer:'Axioma',label:email,secret,algorithm:'SHA1',digits:6,period:30});
const credentials=z.object({password:z.string().min(1).max(256),code:z.string().trim().min(6).max(100)}).strict();

export async function consumeSecondFactor(tx,userId,code,key) {
  const row=(await tx.query('SELECT * FROM user_two_factor WHERE user_id=$1 AND enabled_at IS NOT NULL FOR UPDATE',[userId])).rows[0];
  if(!row)return;
  const normalized=String(code??'').trim();
  const hashes=row.backup_hashes;
  const index=hashes.indexOf(digest(normalized.toUpperCase()));
  if(index>=0){
    await tx.query('UPDATE user_two_factor SET backup_hashes=$2 WHERE user_id=$1',[userId,JSON.stringify(hashes.filter((_,i)=>i!==index))]);
    return;
  }
  const instance=totp(open(row.encrypted_secret,key));
  const timestamp=Date.now(),delta=/^\d{6}$/.test(normalized)?instance.validate({token:normalized,window:1,timestamp}):null;
  const counter=Math.floor(timestamp/30000)+(delta??0);
  if(delta===null||counter<=Number(row.last_counter))fail(401,'Неверный или уже использованный код');
  await tx.query('UPDATE user_two_factor SET last_counter=$2 WHERE user_id=$1',[userId,counter]);
}

export function registerTwoFactor(app,db,key) {
  app.get('/api/auth/two-factor',async req=>{
    role(req.user,'customer','publisher','admin');
    const row=(await db.query('SELECT enabled_at,backup_hashes FROM user_two_factor WHERE user_id=$1',[req.user.actorId??req.user.id])).rows[0];
    return {enabled:Boolean(row?.enabled_at),backupCodesRemaining:row?.backup_hashes.length??0};
  });
  app.post('/api/auth/two-factor/setup',{config:{rateLimit:{max:5,timeWindow:'1 minute'}}},async req=>{
    role(req.user,'customer','publisher','admin');
    const {password}=z.object({password:z.string().min(1).max(256)}).strict().parse(req.body);
    const id=req.user.actorId??req.user.id;
    return db.transaction(async tx=>{
      const user=(await tx.query('SELECT password_hash,email FROM users WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!await verifyPassword(password,user.password_hash))fail(400,'Текущий пароль указан неверно');
      const existing=(await tx.query('SELECT enabled_at FROM user_two_factor WHERE user_id=$1',[id])).rows[0];
      if(existing?.enabled_at)fail(409,'Двухфакторная защита уже включена');
      const secret=new Secret({size:20}).base32,instance=totp(secret,user.email);
      await tx.query(`INSERT INTO user_two_factor(user_id,pending_secret,pending_expires_at) VALUES($1,$2,now()+interval '10 minutes')
        ON CONFLICT(user_id) DO UPDATE SET pending_secret=excluded.pending_secret,pending_expires_at=excluded.pending_expires_at`,[id,seal(secret,key)]);
      await audit(tx,id,'auth.two_factor.setup',id);
      return {secret,qr:await QRCode.toDataURL(instance.toString())};
    });
  });
  app.post('/api/auth/two-factor/enable',{config:{rateLimit:{max:5,timeWindow:'1 minute'}}},async req=>{
    role(req.user,'customer','publisher','admin');
    const {code}=z.object({code:z.string().regex(/^\d{6}$/)}).strict().parse(req.body),id=req.user.actorId??req.user.id;
    return db.transaction(async tx=>{
      await tx.query('SELECT id FROM users WHERE id=$1 FOR UPDATE',[id]);
      const row=(await tx.query('SELECT * FROM user_two_factor WHERE user_id=$1 AND enabled_at IS NULL AND pending_expires_at>now() FOR UPDATE',[id])).rows[0];
      if(!row?.pending_secret)fail(409,'Начните настройку заново');
      const timestamp=Date.now(),delta=totp(open(row.pending_secret,key)).validate({token:code,window:1,timestamp});
      if(delta===null)fail(400,'Неверный код');
      const codes=Array.from({length:10},()=>randomBytes(8).toString('hex').toUpperCase());
      await tx.query(`UPDATE user_two_factor SET encrypted_secret=pending_secret,pending_secret=NULL,pending_expires_at=NULL,
        enabled_at=now(),last_counter=$2,backup_hashes=$3 WHERE user_id=$1`,[id,Math.floor(timestamp/30000)+delta,JSON.stringify(codes.map(digest))]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2',[id,digest(req.cookies.session)]);
      await audit(tx,id,'auth.two_factor.enable',id);
      return {enabled:true,backupCodes:codes};
    });
  });
  app.post('/api/auth/two-factor/disable',{config:{rateLimit:{max:5,timeWindow:'1 minute'}}},async req=>{
    role(req.user,'customer','publisher','admin');const data=credentials.parse(req.body),id=req.user.actorId??req.user.id;
    return db.transaction(async tx=>{
      const user=(await tx.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!await verifyPassword(data.password,user.password_hash))fail(400,'Текущий пароль указан неверно');
      const enabled=(await tx.query('SELECT enabled_at FROM user_two_factor WHERE user_id=$1',[id])).rows[0];
      if(!enabled?.enabled_at)fail(409,'Двухфакторная защита уже отключена');
      await consumeSecondFactor(tx,id,data.code,key);
      await tx.query('DELETE FROM user_two_factor WHERE user_id=$1',[id]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2',[id,digest(req.cookies.session)]);
      await audit(tx,id,'auth.two_factor.disable',id);return {enabled:false};
    });
  });
}
