import {z} from 'zod';
import {role,fail,digest,verifyPassword,hashPassword} from './security.mjs';
import {audit} from './finance.mjs';
import {uuid} from './validation.mjs';

export function registerSettings(app,db) {
  app.get('/api/favorites',async req=>{
    role(req.user,'customer');
    return (await db.query("SELECT f.outlet_id FROM favorite_outlets f JOIN outlets o ON o.id=f.outlet_id WHERE f.user_id=$1 AND o.active=true AND o.status='approved' ORDER BY f.outlet_id",[req.user.id])).rows.map(r=>r.outlet_id);
  });
  app.put('/api/favorites/:id',async req=>{
    role(req.user,'customer');
    const id=uuid.parse(req.params.id);
    const {favorite}=z.object({favorite:z.boolean()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      if(favorite) {
        const outlet=(await tx.query("SELECT id FROM outlets WHERE id=$1 AND active=true AND status='approved' FOR SHARE",[id])).rows[0];
        if(!outlet)fail(404,'Площадка недоступна');
        await tx.query('INSERT INTO favorite_outlets(user_id,outlet_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[req.user.id,id]);
      } else await tx.query('DELETE FROM favorite_outlets WHERE user_id=$1 AND outlet_id=$2',[req.user.id,id]);
      await audit(tx,req.user.id,'outlet.favorite',id,{favorite});
      return {favorite};
    });
  });
  app.get('/api/settings/limits',async req=>{
    role(req.user,'customer');
    const row=(await db.query('SELECT order_limit FROM users WHERE id=$1',[req.user.id])).rows[0];
    return {orderLimit:row.order_limit===null?null:Number(row.order_limit),autoAccept:false};
  });
  app.put('/api/settings/limits',async req=>{
    role(req.user,'customer');
    const data=z.object({orderLimit:z.number().int().min(0).max(100000000000).nullable(),autoAccept:z.literal(false)}).strict().parse(req.body);
    return db.transaction(async tx=>{
      await tx.query('UPDATE users SET order_limit=$2 WHERE id=$1',[req.user.id,data.orderLimit]);
      await audit(tx,req.user.id,'settings.limits',req.user.id,data);
      return data;
    });
  });
  app.get('/api/auth/sessions',async req=>{
    role(req.user,'customer','publisher','admin');
    const rows=(await db.query('SELECT token_hash,expires_at FROM sessions WHERE user_id=$1 AND expires_at>now() ORDER BY expires_at DESC',[req.user.id])).rows;
    return rows.map(s=>({current:s.token_hash===digest(req.cookies.session),expiresAt:s.expires_at}));
  });
  app.post('/api/auth/sessions/revoke-others',async req=>{
    role(req.user,'customer','publisher','admin');
    return db.transaction(async tx=>{
      await tx.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2',[req.user.id,digest(req.cookies.session)]);
      await audit(tx,req.user.id,'auth.sessions.revoke',req.user.id);
      return {ok:true};
    });
  });
  app.post('/api/auth/password',{config:{rateLimit:{max:5,timeWindow:'1 minute'}}},async req=>{
    role(req.user,'customer','publisher','admin');
    const d=z.object({currentPassword:z.string().min(1).max(256),newPassword:z.string().min(12).max(256)}).strict().parse(req.body);
    return db.transaction(async tx=>{
      const user=(await tx.query('SELECT password_hash FROM users WHERE id=$1 FOR UPDATE',[req.user.id])).rows[0];
      if(!await verifyPassword(d.currentPassword,user.password_hash))fail(400,'Текущий пароль указан неверно');
      if(d.currentPassword===d.newPassword)fail(400,'Новый пароль должен отличаться от текущего');
      await tx.query('UPDATE users SET password_hash=$2 WHERE id=$1',[req.user.id,await hashPassword(d.newPassword)]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash<>$2',[req.user.id,digest(req.cookies.session)]);
      await audit(tx,req.user.id,'auth.password.change',req.user.id);
      return {ok:true};
    });
  });
}
