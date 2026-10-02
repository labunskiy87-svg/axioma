import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {audit,once,transfer} from './finance.mjs';
import {fail,role} from './security.mjs';
import {uuid} from './validation.mjs';

const request=z.object({userId:uuid,direction:z.enum(['credit','debit']),amount:z.number().int().positive().max(100000000000),reason:z.string().trim().min(10).max(2000)}).strict();

export function registerAdjustments(app,db) {
  app.get('/api/admin/adjustments',async req=>{
    role(req.user,'admin');
    const userId=req.query?.userId?uuid.parse(req.query.userId):null;
    return (await db.query(`SELECT a.*,u.email AS user_email,u.role AS user_role,creator.email AS creator_email,
      reviewer.email AS reviewer_email FROM balance_adjustments a JOIN users u ON u.id=a.user_id
      JOIN users creator ON creator.id=a.created_by LEFT JOIN users reviewer ON reviewer.id=a.reviewed_by
      WHERE ($1::uuid IS NULL OR a.user_id=$1) ORDER BY a.created_at DESC LIMIT 500`,[userId])).rows;
  });
  app.post('/api/admin/adjustments',async req=>{
    role(req.user,'admin');
    const data=request.parse(req.body);
    return once(db,req,'adjustment.create',async tx=>{
      const target=(await tx.query('SELECT id,role FROM users WHERE id=$1 AND account_owner_id IS NULL AND blocked_at IS NULL FOR SHARE',[data.userId])).rows[0];
      if(!target||!['customer','publisher'].includes(target.role))fail(404,'Счет пользователя не найден');
      const id=randomUUID();
      const row=(await tx.query(`INSERT INTO balance_adjustments(id,user_id,direction,amount,reason,created_by)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[id,data.userId,data.direction,data.amount,data.reason,req.user.actorId??req.user.id])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'balance.adjustment.create',id,{userId:data.userId,direction:data.direction,amount:data.amount,reason:data.reason});
      return row;
    });
  });
  app.post('/api/admin/adjustments/:id/decision',async req=>{
    role(req.user,'admin');
    const id=uuid.parse(req.params.id);
    const {decision,reason}=z.object({decision:z.enum(['approved','rejected']),reason:z.string().trim().max(2000).default('')}).strict().parse(req.body);
    if(decision==='rejected'&&reason.length<5)fail(400,'Укажите причину отклонения');
    return db.transaction(async tx=>{
      const item=(await tx.query('SELECT * FROM balance_adjustments WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!item)fail(404,'Корректировка не найдена');
      if(item.status!=='pending')fail(409,'Решение уже принято');
      if(item.created_by===(req.user.actorId??req.user.id))fail(403,'Корректировку должен подтвердить другой администратор');
      if(decision==='approved') {
        const account=`${item.user_id}:available`;
        await transfer(tx,item.direction==='credit'?'external:clearing':account,item.direction==='credit'?account:'external:clearing',Number(item.amount),`adjustment:${id}:${item.direction}`);
      }
      const updated=(await tx.query(`UPDATE balance_adjustments SET status=$2,review_reason=$3,reviewed_by=$4,reviewed_at=now()
        WHERE id=$1 RETURNING *`,[id,decision,reason,req.user.actorId??req.user.id])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'balance.adjustment.review',id,{decision,reason});
      return updated;
    });
  });
}
