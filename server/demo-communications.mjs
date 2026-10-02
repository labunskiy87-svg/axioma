import {randomUUID} from 'node:crypto';
import {audit} from './finance.mjs';

export async function seedCommunications(db) {
 if(process.env.NODE_ENV==='production')throw new Error('Local demo only');
 return db.transaction(async tx=>{
  if((await tx.query("SELECT id FROM audit WHERE action='demo.communications.v1'")).rows.length)return {alreadySeeded:true};
  const users=(await tx.query("SELECT id,role FROM users WHERE email IN ('demo@axioma.local','publisher@axioma.local','admin@axioma.local')")).rows;
  const byRole=Object.fromEntries(users.map(u=>[u.role,u.id]));
  if(users.length!==3)throw new Error('Run the initial demo seed first');
  const orders=(await tx.query("SELECT id FROM orders WHERE customer_id=$1 AND publisher_id=$2 AND status IN ('disputed','refunded')",[byRole.customer,byRole.publisher])).rows;
  for(const order of orders) {
   await tx.query("UPDATE orders SET dispute_number=coalesce(dispute_number,nextval('dispute_number_seq')) WHERE id=$1",[order.id]);
   for(const [role,body] of [['customer','Демо-жалоба: в публикации отсутствует согласованная ссылка. Просим исправить.'],['publisher','Демо-ответ: редакция проверяет ссылку и готовит исправление.'],['admin','Демо: обращение принято, проверяем условия заказа.']])await tx.query('INSERT INTO order_messages(id,order_id,author_id,body) VALUES($1,$2,$3,$4)',[randomUUID(),order.id,byRole[role],body]);
  }
  for(const [role,subject,body] of [['customer','Демо: проверка резерва заказа','Где посмотреть зарезервированные средства?'],['publisher','Демо: настройка площадки','Как временно остановить прием заказов?']]) {
   const id=randomUUID();
   await tx.query('INSERT INTO tickets(id,owner_id,subject) VALUES($1,$2,$3)',[id,byRole[role],subject]);
   for(const [author,text] of [[byRole[role],body],[byRole.admin,role==='customer'?'Средства отображаются в резерве до приемки или возврата.':'Отключите активность в карточке площадки. Текущие заказы сохранятся.']])await tx.query('INSERT INTO ticket_messages(id,ticket_id,author_id,body) VALUES($1,$2,$3,$4)',[randomUUID(),id,author,text]);
  }
  await audit(tx,byRole.admin,'demo.communications.v1',null,{tickets:2,disputes:orders.length});
  return {tickets:2,disputes:orders.length};
 });
}
