import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {audit,once,transfer} from './finance.mjs';
import {fail,role} from './security.mjs';
import {uuid} from './validation.mjs';

const payoutDetailsReady=details=>details.payeeStatus==='Физическое лицо'
  ? Boolean(details.personName?.trim()&&details.personInn?.trim()&&details.personAccount?.trim()&&details.personBik?.trim())
  : Boolean(details.recipient?.trim()&&details.inn?.trim()&&details.account?.trim()&&details.bik?.trim());

export function registerPayouts(app,db) {
  app.get('/api/payouts',async req=>{
    role(req.user,'publisher');
    return (await db.query('SELECT * FROM payout_requests WHERE publisher_id=$1 ORDER BY created_at DESC LIMIT 200',[req.user.id])).rows;
  });
  app.post('/api/payouts',async req=>{
    role(req.user,'publisher');
    const {amount}=z.object({amount:z.number().int().positive().max(100000000000)}).strict().parse(req.body);
    return once(db,req,'payout.create',async tx=>{
      const settings=(await tx.query('SELECT requisites,requisites_status FROM account_settings WHERE user_id=$1 FOR UPDATE',[req.user.id])).rows[0];
      if(settings?.requisites_status!=='verified'||!payoutDetailsReady(settings.requisites))fail(409,'Подтвержденные реквизиты для выплаты не заполнены');
      const id=randomUUID();
      await transfer(tx,`${req.user.id}:available`,`${req.user.id}:reserved`,amount,`payout:${id}:reserve`);
      const row=(await tx.query('INSERT INTO payout_requests(id,publisher_id,amount,requisites) VALUES($1,$2,$3,$4) RETURNING *',[id,req.user.id,amount,JSON.stringify(settings.requisites)])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'payout.create',id,{amount});
      return row;
    });
  });
  app.get('/api/admin/payouts',async req=>{
    role(req.user,'admin');
    return (await db.query(`SELECT p.*,u.email AS publisher_email FROM payout_requests p JOIN users u ON u.id=p.publisher_id ORDER BY p.created_at DESC LIMIT 500`)).rows;
  });
  app.get('/api/admin/payouts/export.csv',async(req,reply)=>{
    role(req.user,'admin');
    const rows=(await db.query(`SELECT p.number,p.created_at,u.email,p.amount,p.status,p.comment FROM payout_requests p JOIN users u ON u.id=p.publisher_id ORDER BY p.created_at DESC LIMIT 500`)).rows;
    const quote=value=>{const text=String(value??'');return `"${(/^[\s]*[=+\-@]/.test(text)?`'${text}`:text).replaceAll('"','""')}"`;};
    const csv=['Номер,Дата,Паблишер,Сумма (руб.),Статус,Комментарий',...rows.map(row=>[`W-${row.number}`,new Date(row.created_at).toISOString(),row.email,Number(row.amount)/100,row.status,row.comment].map(quote).join(','))].join('\n');
    reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition',"attachment; filename*=UTF-8''payouts.csv");
    return `\ufeff${csv}`;
  });
  app.post('/api/admin/payouts/:id/decision',async req=>{
    role(req.user,'admin');
    const id=uuid.parse(req.params.id);
    const {decision,comment}=z.object({decision:z.enum(['approved','returned','rejected']),comment:z.string().trim().max(2000).default('')}).strict().parse(req.body);
    if(decision!=='approved'&&!comment)fail(400,'Укажите причину возврата или отклонения');
    return db.transaction(async tx=>{
      const row=(await tx.query('SELECT * FROM payout_requests WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!row)fail(404,'Заявка не найдена');
      if(row.status!=='pending')fail(409,'Решение по заявке уже принято');
      if(decision!=='approved')await transfer(tx,`${row.publisher_id}:reserved`,`${row.publisher_id}:available`,Number(row.amount),`payout:${id}:${decision}`);
      const updated=(await tx.query('UPDATE payout_requests SET status=$2,comment=$3,reviewer_id=$4,reviewed_at=now() WHERE id=$1 RETURNING *',[id,decision,comment,req.user.actorId??req.user.id])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'payout.review',id,{decision,comment});
      return updated;
    });
  });
  app.post('/api/admin/payouts/:id/transfer',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const {bankReference,transferredAt}=z.object({bankReference:z.string().trim().min(6).max(120),transferredAt:z.iso.datetime({offset:true})}).strict().parse(req.body);
    return once(db,req,`payout:${id}:transfer`,async tx=>{
      const row=(await tx.query('SELECT * FROM payout_requests WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!row)fail(404,'Заявка не найдена');
      if(row.status!=='approved')fail(409,'Сначала подтвердите заявку на выплату');
      if(new Date(transferredAt)>new Date())fail(400,'Дата перечисления не может быть в будущем');
      await transfer(tx,`${row.publisher_id}:reserved`,'external:clearing',Number(row.amount),`payout:${id}:transferred`);
      const updated=(await tx.query(`UPDATE payout_requests SET status='transferred',bank_reference=$2,transferred_at=$3,transferred_by=$4 WHERE id=$1 RETURNING *`,[id,bankReference,transferredAt,req.user.actorId??req.user.id])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'payout.transferred',id,{bankReference,transferredAt});
      return updated;
    });
  });
}
