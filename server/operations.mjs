import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {role,fail} from './security.mjs';
import {uuid} from './validation.mjs';
import {audit,once} from './finance.mjs';
import {partyMatchesAdvertiser} from './dadata.mjs';

export async function registerOperations(app,db,{commissionBps=1500,dadata}={}) {
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
   return (await db.query("SELECT u.id,u.email,u.role,u.account_owner_id,u.blocked_at,u.created_at,coalesce(a.balance,0) AS available,coalesce(r.balance,0) AS reserved FROM users u LEFT JOIN accounts a ON a.id=u.id::text||':available' LEFT JOIN accounts r ON r.id=u.id::text||':reserved' ORDER BY u.created_at DESC LIMIT 500")).rows;
 });
 app.get('/api/admin/users/:id/overview',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);
   const user=(await db.query(`SELECT u.id,u.email,u.role,u.account_owner_id,u.team_role,u.personal_commission_bps,u.blocked_at,u.created_at,
     coalesce(a.balance,0) AS available,coalesce(r.balance,0) AS reserved,
     coalesce(s.profile,'{}'::jsonb) AS profile,coalesce(s.requisites,'{}'::jsonb) AS requisites,
     coalesce(s.requisites_status,'draft') AS requisites_status,
     s.requisites_review_comment,s.requisites_reviewed_at,
     EXISTS(SELECT 1 FROM user_two_factor f WHERE f.user_id=u.id AND f.enabled_at IS NOT NULL) AS two_factor_enabled,
     (SELECT count(*)::int FROM sessions se WHERE se.user_id=u.id AND se.expires_at>now()) AS active_sessions
     FROM users u LEFT JOIN accounts a ON a.id=u.id::text||':available'
     LEFT JOIN accounts r ON r.id=u.id::text||':reserved'
     LEFT JOIN account_settings s ON s.user_id=u.id WHERE u.id=$1`,[id])).rows[0];
   if(!user)fail(404,'Пользователь не найден');
   const ownerId=user.account_owner_id??id;
   const [outlets,advertisers,orders,projects,materials,team]=await Promise.all([
     db.query('SELECT id,name,url,kind,geography,status,active,created_at,details,prices FROM outlets WHERE owner_id=$1 ORDER BY created_at DESC',[ownerId]),
     db.query('SELECT id,name,inn,verification,details,review_note FROM advertisers WHERE owner_id=$1 ORDER BY name',[ownerId]),
     db.query(`SELECT o.id,o.number,o.status,o.amount,o.payout,o.created_at,o.publication_url,
       ot.name AS outlet_name,m.title AS material_title,c.email AS customer_email,p.email AS publisher_email
       FROM orders o JOIN outlets ot ON ot.id=o.outlet_id JOIN materials m ON m.id=o.material_id
       JOIN users c ON c.id=o.customer_id JOIN users p ON p.id=o.publisher_id
       WHERE o.customer_id=$1 OR o.publisher_id=$1 ORDER BY o.created_at DESC LIMIT 200`,[ownerId]),
     db.query('SELECT id,name,created_at FROM projects WHERE owner_id=$1 ORDER BY created_at DESC',[ownerId]),
     db.query('SELECT id,number,title,status,created_at FROM materials WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 200',[ownerId]),
     db.query('SELECT id,email,team_role,blocked_at,created_at FROM users WHERE account_owner_id=$1 ORDER BY created_at DESC',[ownerId]),
   ]);
   return {...user,default_commission_bps:user.role==='customer'?1500:commissionBps,outlets:outlets.rows,advertisers:advertisers.rows,orders:orders.rows,projects:projects.rows,materials:materials.rows,team:team.rows};
 });
 app.get('/api/admin/users/:id/activity',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);
   const user=(await db.query('SELECT email FROM users WHERE id=$1',[id])).rows[0];
   if(!user)fail(404,'Пользователь не найден');
   return (await db.query(`SELECT id,actor_id,method,path,status_code,ip_address,user_agent,created_at
     FROM user_activity WHERE actor_id=$1 OR (actor_id IS NULL AND attempted_email=$2)
     ORDER BY created_at DESC,id DESC LIMIT 200`,[id,user.email])).rows;
 });
 app.get('/api/admin/users/:id/outlets',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);
   return (await db.query('SELECT id,name,kind,status,active FROM outlets WHERE owner_id=$1 ORDER BY created_at DESC',[id])).rows;
 });
 app.get('/api/admin/audit',async req=>{
   role(req.user,'admin');
   const {q}=z.object({q:z.string().trim().max(200).default('')}).parse(req.query);
   return (await db.query(`WITH labeled AS (SELECT a.*,u.email,
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
   ) SELECT * FROM labeled
     WHERE $1='' OR email ILIKE '%'||$1||'%' OR action ILIKE '%'||$1||'%' OR entity_label ILIKE '%'||$1||'%' OR entity_id::text ILIKE '%'||$1||'%'
     ORDER BY created_at DESC LIMIT 500`,[q])).rows;
 });
 app.get('/api/admin/ledger',async req=>{role(req.user,'admin');return (await db.query(`
   SELECT l.*, o.number AS order_number, m.number AS material_number,
     debit_user.email AS debit_email, credit_user.email AS credit_email
   FROM ledger l
   LEFT JOIN orders o ON (l.reference LIKE 'order:%' AND o.id::text=split_part(l.reference,':',2))
     OR (l.reference LIKE 'demo:order:%' AND o.id::text=split_part(l.reference,':',3))
   LEFT JOIN materials m ON (l.reference LIKE 'moderation:%' OR l.reference LIKE 'moderation-refund:%') AND m.id::text=split_part(l.reference,':',2)
   LEFT JOIN users debit_user ON debit_user.id::text=split_part(l.debit_account,':',1)
   LEFT JOIN users credit_user ON credit_user.id::text=split_part(l.credit_account,':',1)
   ORDER BY l.created_at DESC LIMIT 500
 `)).rows;});
 app.get('/api/admin/advertisers',async req=>{role(req.user,'admin');return (await db.query('SELECT a.*,u.email FROM advertisers a JOIN users u ON u.id=a.owner_id ORDER BY a.name LIMIT 500')).rows;});
 app.get('/api/admin/advertisers/:id',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);
   const advertiser=(await db.query('SELECT a.*,u.email FROM advertisers a JOIN users u ON u.id=a.owner_id WHERE a.id=$1',[id])).rows[0];
   if(!advertiser)fail(404,'Рекламодатель не найден');
   const reviews=(await db.query('SELECT r.*,u.email AS reviewer_email FROM advertiser_reviews r JOIN users u ON u.id=r.reviewer_id WHERE advertiser_id=$1 ORDER BY r.created_at DESC',[id])).rows;
   const orders=(await db.query("SELECT id,number,status,amount,snapshot FROM orders WHERE customer_id=$1 AND snapshot->'advertiser'->>'id'=$2 ORDER BY created_at DESC LIMIT 100",[advertiser.owner_id,id])).rows;
   return {...advertiser,reviews,orders};
 });
 app.post('/api/admin/advertisers/:id/registry-check',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);
   const advertiser=(await db.query('SELECT * FROM advertisers WHERE id=$1',[id])).rows[0];
   if(!advertiser)fail(404,'Рекламодатель не найден');
   const result=await dadata.party(advertiser.inn,advertiser.details?.kpp||undefined);
   const matched=partyMatchesAdvertiser(advertiser,result.party);
   if(matched&&advertiser.verification!=='blocked'&&advertiser.verification!=='verified'){
     await db.transaction(async tx=>{
       const current=(await tx.query('SELECT * FROM advertisers WHERE id=$1 FOR UPDATE',[id])).rows[0];
       if(current.verification!=='pending'||!partyMatchesAdvertiser(current,result.party))return;
       await tx.query("UPDATE advertisers SET verification='verified',review_note='Автоматическая сверка с DaData',reviewed_at=now(),reviewed_by=NULL WHERE id=$1",[id]);
       await audit(tx,req.user.actorId??req.user.id,'advertiser.auto_verify',id,{source:'dadata'});
     });
   }
   return {...result,matched,verification:(await db.query('SELECT verification FROM advertisers WHERE id=$1',[id])).rows[0].verification};
 });
 app.post('/api/admin/advertisers/:id/review',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);
   const data=z.object({decision:z.enum(['verified','blocked','pending']),evidence:z.string().trim().min(10).max(2000),note:z.string().trim().min(10).max(2000)}).strict().parse(req.body);
   return db.transaction(async tx=>{
     const advertiser=(await tx.query('SELECT * FROM advertisers WHERE id=$1 FOR UPDATE',[id])).rows[0];
     if(!advertiser)fail(404,'Рекламодатель не найден');
     if(advertiser.verification===data.decision)fail(409,'Статус уже установлен');
     const updated=(await tx.query('UPDATE advertisers SET verification=$2,review_note=$3,reviewed_at=now(),reviewed_by=$4 WHERE id=$1 RETURNING *',[id,data.decision,data.note,req.user.actorId??req.user.id])).rows[0];
     await tx.query('INSERT INTO advertiser_reviews(id,advertiser_id,reviewer_id,decision,evidence,note) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),id,req.user.actorId??req.user.id,data.decision,data.evidence,data.note]);
     await audit(tx,req.user.actorId??req.user.id,'advertiser.review',id,data);
     return updated;
   });
 });
 app.get('/api/orders/:id/messages',async req=>{
   await access(req,'orders',req.params.id);
   return (await db.query("SELECT m.*,u.email,u.role FROM order_messages m JOIN users u ON u.id=m.author_id WHERE order_id=$1 AND ($2='admin' OR m.recipient_id IS NULL OR m.recipient_id=$3) ORDER BY created_at,id",[req.params.id,req.user.role,req.user.id])).rows;
 });
 app.post('/api/admin/orders/:id/evidence-request',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);
   const {recipient}=z.object({recipient:z.enum(['customer','publisher'])}).strict().parse(req.body);
   return once(db,req,`order:${id}:evidence-request`,async tx=>{
     const order=await access(req,'orders',id,tx,true);
     if(order.status!=='disputed')fail(409,'Спор уже закрыт');
     const recipientId=recipient==='customer'?order.customer_id:order.publisher_id;
     const body='Администратор запросил дополнительные доказательства по спору.';
     const row=(await tx.query("INSERT INTO order_messages(id,order_id,author_id,recipient_id,kind,body) VALUES($1,$2,$3,$4,'evidence_request',$5) RETURNING *",[randomUUID(),id,req.user.actorId??req.user.id,recipientId,body])).rows[0];
     await audit(tx,req.user.actorId??req.user.id,'order.evidence_request',id,{recipient,messageId:row.id});
     return row;
   });
 });
 app.post('/api/orders/:id/messages',async req=>{
   await access(req,'orders',req.params.id);const {body}=message.parse(req.body);
   return db.transaction(async tx=>{
     const row=(await tx.query('INSERT INTO order_messages(id,order_id,author_id,body) VALUES($1,$2,$3,$4) RETURNING *',[randomUUID(),req.params.id,req.user.actorId??req.user.id,body])).rows[0];
     await audit(tx,req.user.actorId??req.user.id,'order.message',req.params.id);return row;
   });
 });
 app.get('/api/tickets',async req=>{
   role(req.user,'customer','publisher','admin');
   return (await db.query(`SELECT t.*,u.email,last_message.id AS last_message_id,
       (t.status='open' AND CASE WHEN $1='admin' THEN coalesce(last_message.role<>'admin',true)
         ELSE coalesce(last_message.role='admin',false) END) AS awaiting_reply
     FROM tickets t JOIN users u ON u.id=t.owner_id
     LEFT JOIN LATERAL (SELECT m.id,author.role FROM ticket_messages m JOIN users author ON author.id=m.author_id
       WHERE m.ticket_id=t.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) last_message ON true
     WHERE $1='admin' OR t.owner_id=$2 ORDER BY t.created_at DESC,t.id DESC`,[req.user.role,req.user.id])).rows;
 });
 app.post('/api/tickets',async req=>{
   role(req.user,'customer','publisher');const d=message.extend({subject:z.string().trim().min(1).max(200)}).parse(req.body);
   return db.transaction(async tx=>{
     const row=(await tx.query('INSERT INTO tickets(id,owner_id,subject) VALUES($1,$2,$3) RETURNING *',[randomUUID(),req.user.id,d.subject])).rows[0];
     await tx.query('INSERT INTO ticket_messages(id,ticket_id,author_id,body) VALUES($1,$2,$3,$4)',[randomUUID(),row.id,req.user.actorId??req.user.id,d.body]);
     await audit(tx,req.user.actorId??req.user.id,'support.create',row.id);return row;
   });
 });
 app.get('/api/tickets/:id/messages',async req=>{
   await access(req,'tickets',req.params.id);
   return (await db.query('SELECT m.*,u.email,u.role FROM ticket_messages m JOIN users u ON u.id=m.author_id WHERE ticket_id=$1 ORDER BY created_at,id',[req.params.id])).rows;
 });
 app.post('/api/tickets/:id/messages',async req=>{
   const {body}=message.parse(req.body);
   return db.transaction(async tx=>{const ticket=await access(req,'tickets',req.params.id,tx,true);if(ticket.status==='closed')fail(409,'Обращение закрыто');const row=(await tx.query('INSERT INTO ticket_messages(id,ticket_id,author_id,body) VALUES($1,$2,$3,$4) RETURNING *',[randomUUID(),req.params.id,req.user.actorId??req.user.id,body])).rows[0];await audit(tx,req.user.actorId??req.user.id,'support.reply',req.params.id);return row;});
 });
 app.patch('/api/tickets/:id',async req=>{
   role(req.user,'admin');const {status}=z.object({status:z.enum(['open','closed'])}).strict().parse(req.body);
   await access(req,'tickets',req.params.id);
   return db.transaction(async tx=>{await tx.query('UPDATE tickets SET status=$2 WHERE id=$1',[req.params.id,status]);await audit(tx,req.user.actorId??req.user.id,'support.status',req.params.id,{status});return {ok:true};});
 });
const informer=z.object({title:z.string().trim().min(1).max(200),text:z.string().max(5000).default(''),status:z.enum(['Черновик','Запланирован','Опубликован','Приостановлен','Завершен','Архив']),format:z.string().max(100).default('Объявление'),eyebrow:z.string().max(100).default(''),action:z.string().max(100).default(''),target:z.string().max(100).default('Каталог'),icon:z.string().max(30).default('store'),accent:z.string().max(30).default('blue'),startsAt:z.string().max(30).default(''),endsAt:z.string().max(30).default('Без срока'),packagePrice:z.union([z.literal(''),z.string().regex(/^[1-9]\d*$/).max(30),z.number().int().positive()]).optional(),targetUrl:z.string().max(2048).refine(v=>!v||/^https?:\/\//i.test(v)).optional(),selectionIds:z.array(uuid).max(50).default([])}).strict();
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
     if(!result.rows.length)fail(404,'Not found');await audit(tx,req.user.actorId??req.user.id,'informer.save',id);return {id,...data};
   });
 });
 app.delete('/api/informers/:id',async req=>{
   role(req.user,'admin');const id=uuid.parse(req.params.id);return db.transaction(async tx=>{await tx.query('DELETE FROM informers WHERE id=$1',[id]);await audit(tx,req.user.actorId??req.user.id,'informer.delete',id);return {ok:true};});
 });
}
