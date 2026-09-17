import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {role,fail} from './security.mjs';
import {uuid} from './validation.mjs';
import {audit} from './finance.mjs';

export async function registerOperations(app,db) {
 const day=value=>{
  if(!value||value==='Без срока')return null;
  const parts=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  const iso=parts?`${parts[3]}-${parts[2]}-${parts[1]}`:value;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||!Number.isFinite(Date.parse(iso))||new Date(iso).toISOString().slice(0,10)!==iso)fail(400,'Некорректная дата информера');
  return iso;
 };
 const message=z.object({body:z.string().trim().min(1).max(10000)}).strict();
 async function access(req,table,id,connection=db,lock=false) {
   role(req.user,'customer','publisher','admin');
   const row=(await connection.query(`SELECT * FROM ${table} WHERE id=$1${lock?' FOR UPDATE':''}`,[uuid.parse(id)])).rows[0];
   if(!row || (req.user.role!=='admin' && !(table==='orders'?[row.customer_id,row.publisher_id]:[row.owner_id]).includes(req.user.id)))fail(404,'Not found');
   return row;
 }
 app.get('/api/admin/users',async req=>{
   role(req.user,'admin');
   return (await db.query("SELECT u.id,u.email,u.role,u.created_at,coalesce(a.balance,0) AS available,coalesce(r.balance,0) AS reserved FROM users u LEFT JOIN accounts a ON a.id=u.id::text||':available' LEFT JOIN accounts r ON r.id=u.id::text||':reserved' ORDER BY u.created_at DESC LIMIT 500")).rows;
 });
 app.get('/api/admin/audit',async req=>{
   role(req.user,'admin');
   return (await db.query(`SELECT a.*,u.email,
     CASE
       WHEN a.action LIKE 'order.%' AND o.number IS NOT NULL THEN 'Заказ №'||o.number
       WHEN a.action LIKE 'material.%' AND m.number IS NOT NULL THEN 'Материал №'||m.number
       WHEN a.action LIKE 'outlet.%' AND ot.name IS NOT NULL THEN 'Площадка: '||ot.name
       WHEN a.action LIKE 'advertiser.%' AND ad.name IS NOT NULL THEN 'Рекламодатель: '||ad.name
       WHEN a.action LIKE 'project.%' AND p.name IS NOT NULL THEN 'Проект: '||p.name
       WHEN a.entity_id=u.id THEN u.email
       ELSE '—'
     END AS entity_label
     FROM audit a
     LEFT JOIN users u ON u.id=a.actor_id
     LEFT JOIN orders o ON o.id=a.entity_id
     LEFT JOIN materials m ON m.id=a.entity_id
     LEFT JOIN outlets ot ON ot.id=a.entity_id
     LEFT JOIN advertisers ad ON ad.id=a.entity_id
     LEFT JOIN projects p ON p.id=a.entity_id
     WHERE a.action NOT LIKE 'request.%'
     ORDER BY a.created_at DESC LIMIT 500`)).rows;
 });
 app.get('/api/admin/ledger',async req=>{role(req.user,'admin');return (await db.query('SELECT * FROM ledger ORDER BY created_at DESC LIMIT 500')).rows;});
 app.get('/api/admin/advertisers',async req=>{role(req.user,'admin');return (await db.query('SELECT a.*,u.email FROM advertisers a JOIN users u ON u.id=a.owner_id ORDER BY a.name LIMIT 500')).rows;});
 app.get('/api/orders/:id/messages',async req=>{
   await access(req,'orders',req.params.id);
   return (await db.query('SELECT m.*,u.email,u.role FROM order_messages m JOIN users u ON u.id=m.author_id WHERE order_id=$1 ORDER BY created_at,id',[req.params.id])).rows;
 });
 app.post('/api/orders/:id/messages',async req=>{
   await access(req,'orders',req.params.id);const {body}=message.parse(req.body);
   return db.transaction(async tx=>{
     const row=(await tx.query('INSERT INTO order_messages(id,order_id,author_id,body) VALUES($1,$2,$3,$4) RETURNING *',[randomUUID(),req.params.id,req.user.id,body])).rows[0];
     await audit(tx,req.user.id,'order.message',req.params.id);return row;
   });
 });
 app.get('/api/tickets',async req=>{
   role(req.user,'customer','publisher','admin');
   return (await db.query("SELECT t.*,u.email FROM tickets t JOIN users u ON u.id=t.owner_id WHERE $1='admin' OR owner_id=$2 ORDER BY created_at DESC",[req.user.role,req.user.id])).rows;
 });
 app.post('/api/tickets',async req=>{
   role(req.user,'customer','publisher');const d=message.extend({subject:z.string().trim().min(1).max(200)}).parse(req.body);
   return db.transaction(async tx=>{
     const row=(await tx.query('INSERT INTO tickets(id,owner_id,subject) VALUES($1,$2,$3) RETURNING *',[randomUUID(),req.user.id,d.subject])).rows[0];
     await tx.query('INSERT INTO ticket_messages(id,ticket_id,author_id,body) VALUES($1,$2,$3,$4)',[randomUUID(),row.id,req.user.id,d.body]);
     await audit(tx,req.user.id,'support.create',row.id);return row;
   });
 });
 app.get('/api/tickets/:id/messages',async req=>{
   await access(req,'tickets',req.params.id);
   return (await db.query('SELECT m.*,u.email,u.role FROM ticket_messages m JOIN users u ON u.id=m.author_id WHERE ticket_id=$1 ORDER BY created_at,id',[req.params.id])).rows;
 });
 app.post('/api/tickets/:id/messages',async req=>{
   const {body}=message.parse(req.body);
   return db.transaction(async tx=>{const ticket=await access(req,'tickets',req.params.id,tx,true);if(ticket.status==='closed')fail(409,'Обращение закрыто');const row=(await tx.query('INSERT INTO ticket_messages(id,ticket_id,author_id,body) VALUES($1,$2,$3,$4) RETURNING *',[randomUUID(),req.params.id,req.user.id,body])).rows[0];await audit(tx,req.user.id,'support.reply',req.params.id);return row;});
 });
 app.patch('/api/tickets/:id',async req=>{
   role(req.user,'admin');const {status}=z.object({status:z.enum(['open','closed'])}).strict().parse(req.body);
   await access(req,'tickets',req.params.id);
   return db.transaction(async tx=>{await tx.query('UPDATE tickets SET status=$2 WHERE id=$1',[req.params.id,status]);await audit(tx,req.user.id,'support.status',req.params.id,{status});return {ok:true};});
 });
const informer=z.object({title:z.string().trim().min(1).max(200),text:z.string().max(5000).default(''),status:z.enum(['Черновик','Запланирован','Опубликован','Приостановлен','Завершен','Архив']),format:z.string().max(100).default('Объявление'),eyebrow:z.string().max(100).default(''),action:z.string().max(100).default(''),target:z.string().max(100).default('Каталог'),icon:z.string().max(30).default('store'),accent:z.string().max(30).default('blue'),startsAt:z.string().max(30).default(''),endsAt:z.string().max(30).default('Без срока'),packagePrice:z.union([z.string().max(30),z.number()]).optional(),targetUrl:z.string().max(2048).refine(v=>!v||/^https?:\/\//i.test(v)).optional(),selectionIds:z.array(uuid).max(50).default([])}).strict();
 app.get('/api/informers',async req=>{
   role(req.user,'customer','publisher','admin');
   const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Moscow'});
return (await db.query("SELECT id,data FROM informers WHERE $1='admin' OR data->>'status' IN ('Опубликован','Запланирован') ORDER BY created_at DESC",[req.user.role])).rows.map(r=>({id:r.id,...r.data,status:req.user.role==='admin'?r.data.status:'Опубликован'})).filter(r=>req.user.role==='admin'||((!day(r.startsAt)||day(r.startsAt)<=today)&&(!day(r.endsAt)||day(r.endsAt)>=today)));
 });
 for(const method of ['post','put'])app[method](method==='post'?'/api/informers':'/api/informers/:id',async req=>{
   role(req.user,'admin');const data=informer.parse(req.body);const id=method==='post'?randomUUID():uuid.parse(req.params.id);
   data.updatedAt=new Date().toLocaleString('ru-RU',{timeZone:'Europe/Moscow'});
   if(day(data.startsAt)&&day(data.endsAt)&&day(data.endsAt)<day(data.startsAt))fail(400,'Дата окончания раньше начала');
   return db.transaction(async tx=>{
     if(data.selectionIds.length) {
       const ids=z.array(uuid).parse(data.selectionIds);
       const selected=(await tx.query("SELECT id FROM outlets WHERE id=ANY($1::uuid[]) AND active AND status='approved'",[ids])).rows;
       if(selected.length!==new Set(ids).size)fail(400,'Выберите действующие площадки');
     }
     const result=method==='post'?await tx.query('INSERT INTO informers(id,data) VALUES($1,$2) RETURNING id',[id,JSON.stringify(data)]):await tx.query('UPDATE informers SET data=$2 WHERE id=$1 RETURNING id',[id,JSON.stringify(data)]);
     if(!result.rows.length)fail(404,'Not found');await audit(tx,req.user.id,'informer.save',id);return {id,...data};
   });
 });
 app.delete('/api/informers/:id',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);return db.transaction(async tx=>{await tx.query('DELETE FROM informers WHERE id=$1',[id]);await audit(tx,req.user.id,'informer.delete',id);return {ok:true};});
 });
}
