import {randomBytes,randomUUID} from 'node:crypto';
import {z} from 'zod';
import {audit} from './finance.mjs';
import {digest,fail,hashPassword,role} from './security.mjs';
import {uuid} from './validation.mjs';

const profile=z.record(z.string().max(50),z.string().max(500)).refine(value=>Object.keys(value).length<=30);
const requisites=z.record(z.string().max(50),z.string().max(1000)).refine(value=>Object.keys(value).length<=40);
const email=z.email().transform(value=>value.trim().toLowerCase());
const teamRole=z.enum(['admin','superadmin','moderator','content','finance','viewer']);
const applicationData=z.object({
  applicant:z.string().trim().max(200).default(''),position:z.string().trim().max(200).default(''),
  email,phone:z.string().trim().max(100).default(''),relation:z.string().max(200).default(''),
  platform:z.string().trim().min(1).max(200),platformType:z.string().trim().max(100).default('Онлайн-СМИ'),
  platformUrl:z.union([z.url(),z.literal('')]).default(''),legalName:z.string().trim().min(1).max(300),
  inn:z.string().trim().max(20).default(''),theme:z.string().max(500).default(''),
  reach:z.string().max(200).default(''),comment:z.string().max(2000).default(''),
}).strict();
const checkKeys=['resource','legal','representative','duplicate'];
const applicationView=row=>({
  id:row.id,number:row.number,submittedAt:new Date(row.created_at).toLocaleString('ru-RU'),
  ...row.data,status:row.status,checks:row.checks,decisionComment:row.decision_comment,
  accountStatus:row.publisher_user_id?'Активен':row.invitation_hash&&new Date(row.invitation_expires_at).getTime()>Date.now()?'Приглашение создано':'Не создан',
});
const ownerOnly=req=>{
  role(req.user,'customer','publisher','admin');
  if(req.user.role==='admin') {
    if(!req.user.isPrimaryAdmin)fail(403,'Только главный администратор может управлять администраторами');
    return;
  }
  if(req.user.actorId && req.user.actorId!==req.user.id)fail(403,'Только владелец аккаунта может управлять командой');
};

export function registerAccountManagement(app,db) {
  app.get('/api/settings/account',async req=>{
    role(req.user,'customer','publisher','admin');
    const row=(await db.query('SELECT profile,requisites,requisites_status,requisites_review_comment FROM account_settings WHERE user_id=$1',[req.user.id])).rows[0];
    return row??{profile:{},requisites:{},requisites_status:'draft',requisites_review_comment:''};
  });
  app.put('/api/settings/account/profile',async req=>{
    role(req.user,'customer','publisher','admin');
    const data=profile.parse(req.body);
    return db.transaction(async tx=>{
      await tx.query(`INSERT INTO account_settings(user_id,profile) VALUES($1,$2)
        ON CONFLICT(user_id) DO UPDATE SET profile=excluded.profile,
        requisites_status=CASE WHEN account_settings.requisites_status='verified'
          AND account_settings.profile->>'company' IS DISTINCT FROM excluded.profile->>'company'
          THEN 'pending' ELSE account_settings.requisites_status END,updated_at=now()`,[req.user.id,JSON.stringify(data)]);
      await audit(tx,req.user.actorId??req.user.id,'account.profile',req.user.id);
      return {profile:data};
    });
  });
  app.put('/api/settings/account/requisites',async req=>{
    role(req.user,'customer','publisher');
    const data=requisites.parse(req.body);
    return db.transaction(async tx=>{
      await tx.query(`INSERT INTO account_settings(user_id,requisites,requisites_status) VALUES($1,$2,'pending')
        ON CONFLICT(user_id) DO UPDATE SET requisites=excluded.requisites,requisites_status='pending',
        requisites_reviewer_id=NULL,requisites_review_comment='',requisites_reviewed_at=NULL,updated_at=now()`,[req.user.id,JSON.stringify(data)]);
      await audit(tx,req.user.actorId??req.user.id,'account.requisites',req.user.id);
      return {requisites:data,status:'pending'};
    });
  });

  app.get('/api/team',async req=>{
    ownerOnly(req);
    const members=(await db.query("SELECT id,email,coalesce(team_role,'admin') AS team_role FROM users WHERE (account_owner_id=$1 OR ($2='admin' AND role='admin' AND is_primary_admin=false)) AND blocked_at IS NULL ORDER BY email",[req.user.id,req.user.role])).rows;
    const pending=(await db.query('SELECT id,email,team_role,expires_at FROM team_invitations WHERE owner_id=$1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at>now() ORDER BY created_at DESC',[req.user.id])).rows;
    return {members,pending};
  });
  app.post('/api/team/invitations',async req=>{
    ownerOnly(req);
    const data=z.object({email,teamRole}).strict().parse(req.body);
    if(req.user.role==='admin'&&!['admin','superadmin','moderator'].includes(data.teamRole))fail(400,'Для администратора выберите административный доступ');
    if(req.user.role!=='admin'&&['superadmin','moderator'].includes(data.teamRole))fail(400,'Эта роль доступна только в админке');
    if(data.email===req.user.email)fail(400,'Владелец уже имеет доступ');
    return db.transaction(async tx=>{
      const existing=(await tx.query('SELECT id FROM users WHERE email=$1',[data.email])).rows[0];
      if(existing)fail(409,'Для этого адреса уже есть аккаунт');
      const token=randomBytes(32).toString('base64url'),id=randomUUID();
      await tx.query("INSERT INTO team_invitations(id,owner_id,email,team_role,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '7 days')",[id,req.user.id,data.email,data.teamRole,digest(token)]);
      await audit(tx,req.user.id,'team.invite',id,{email:data.email,role:data.teamRole});
      return {id,email:data.email,teamRole:data.teamRole,token};
    });
  });
  app.delete('/api/team/invitations/:id',async req=>{
    ownerOnly(req);const id=uuid.parse(req.params.id);
    return db.transaction(async tx=>{
      const row=await tx.query('UPDATE team_invitations SET revoked_at=now() WHERE id=$1 AND owner_id=$2 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING id',[id,req.user.id]);
      if(!row.rows.length)fail(404,'Not found');
      await audit(tx,req.user.id,'team.invite.revoke',id);return {ok:true};
    });
  });
  app.get('/api/team/invitation/:token',async req=>{
    const token=z.string().min(20).max(200).parse(req.params.token);
    const row=(await db.query(`SELECT i.email,i.team_role,u.role FROM team_invitations i JOIN users u ON u.id=i.owner_id
      WHERE i.token_hash=$1 AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>now() AND u.blocked_at IS NULL`,[digest(token)])).rows[0];
    if(row)return {email:row.email,teamRole:row.team_role,role:row.role};
    const application=(await db.query("SELECT data->>'email' AS email FROM publisher_applications WHERE invitation_hash=$1 AND invitation_expires_at>now() AND publisher_user_id IS NULL AND status='Одобрена' AND deleted_at IS NULL",[digest(token)])).rows[0];
    if(!application)fail(404,'Приглашение недействительно');
    return {email:application.email,teamRole:null,role:'publisher'};
  });
  app.post('/api/team/accept',{config:{rateLimit:{max:5,timeWindow:'1 minute'}}},async req=>{
    const {token,password}=z.object({token:z.string().min(20).max(200),password:z.string().min(12).max(128)}).strict().parse(req.body);
    return db.transaction(async tx=>{
      const invite=(await tx.query(`SELECT i.*,u.role FROM team_invitations i JOIN users u ON u.id=i.owner_id
        WHERE i.token_hash=$1 AND i.accepted_at IS NULL AND i.revoked_at IS NULL AND i.expires_at>now() AND u.blocked_at IS NULL FOR UPDATE OF i`,[digest(token)])).rows[0];
      if(!invite) {
        const application=(await tx.query("SELECT * FROM publisher_applications WHERE invitation_hash=$1 AND invitation_expires_at>now() AND publisher_user_id IS NULL AND status='Одобрена' AND deleted_at IS NULL FOR UPDATE",[digest(token)])).rows[0];
        if(!application)fail(404,'Приглашение недействительно');
        const id=randomUUID(),applicationEmail=application.data.email;
        await tx.query('INSERT INTO users(id,email,password_hash,role) VALUES($1,$2,$3,$4)',[id,applicationEmail,await hashPassword(password),'publisher']);
        await tx.query('INSERT INTO accounts(id) VALUES($1),($2)',[`${id}:available`,`${id}:reserved`]);
        await tx.query('UPDATE publisher_applications SET publisher_user_id=$2,invitation_hash=NULL,invitation_expires_at=NULL,updated_at=now() WHERE id=$1',[application.id,id]);
        await audit(tx,id,'publisher.application.join',application.id);
        return {ok:true};
      }
      const id=randomUUID();
      await tx.query('INSERT INTO users(id,email,password_hash,role,account_owner_id,team_role) VALUES($1,$2,$3,$4,$5,$6)',[id,invite.email,await hashPassword(password),invite.role,invite.owner_id,invite.team_role]);
      await tx.query('UPDATE team_invitations SET accepted_at=now() WHERE id=$1',[invite.id]);
      await audit(tx,id,'team.join',invite.owner_id,{role:invite.team_role});
      return {ok:true};
    });
  });
  app.patch('/api/team/members/:id',async req=>{
    ownerOnly(req);const id=uuid.parse(req.params.id);
    const {teamRole:nextRole}=z.object({teamRole:teamRole.nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      if(req.user.role==='admin'&&nextRole!==null&&!['admin','superadmin','moderator'].includes(nextRole))fail(400,'Некорректная роль администратора');
      if(req.user.role!=='admin'&&['superadmin','moderator'].includes(nextRole))fail(400,'Эта роль доступна только в админке');
      const row=(await tx.query("UPDATE users SET team_role=CASE WHEN account_owner_id IS NULL THEN team_role ELSE $3 END,blocked_at=CASE WHEN $3::text IS NULL THEN now() ELSE NULL END WHERE id=$1 AND (account_owner_id=$2 OR ($4='admin' AND role='admin')) AND is_primary_admin=false RETURNING id,email,team_role,blocked_at",[id,req.user.id,nextRole,req.user.role])).rows[0];
      if(!row)fail(404,'Not found');
      if(nextRole===null)await tx.query('DELETE FROM sessions WHERE user_id=$1',[id]);
      await audit(tx,req.user.id,'team.role',id,{role:nextRole});return row;
    });
  });

  app.patch('/api/admin/users/:id/access',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const {blocked}=z.object({blocked:z.boolean()}).strict().parse(req.body);
    if(id===req.user.id || id===(req.user.actorId??req.user.id))fail(400,'Нельзя заблокировать свой аккаунт');
    return db.transaction(async tx=>{
      const target=(await tx.query('SELECT role,is_primary_admin FROM users WHERE id=$1',[id])).rows[0];
      if(target?.is_primary_admin)fail(403,'Нельзя заблокировать главного администратора');
      if(target?.role==='admin'&&!req.user.isPrimaryAdmin)fail(403,'Только главный администратор может управлять администраторами');
      const row=(await tx.query('UPDATE users SET blocked_at=CASE WHEN $2 THEN now() ELSE NULL END WHERE id=$1 RETURNING id,blocked_at',[id,blocked])).rows[0];
      if(!row)fail(404,'Not found');
      if(blocked)await tx.query('DELETE FROM sessions WHERE user_id=$1 OR user_id IN (SELECT id FROM users WHERE account_owner_id=$1)',[id]);
      await audit(tx,req.user.actorId??req.user.id,'user.access',id,{blocked});return row;
    });
  });
  app.patch('/api/admin/users/:id/commission',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const {commissionBps}=z.object({commissionBps:z.number().int().min(0).max(10000).nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      const user=(await tx.query('SELECT id,role,personal_commission_bps FROM users WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!user)fail(404,'Пользователь не найден');
      if(!['customer','publisher'].includes(user.role))fail(400,'Комиссия задается только заказчику или паблишеру');
      await tx.query('UPDATE users SET personal_commission_bps=$2 WHERE id=$1',[id,commissionBps]);
      await audit(tx,req.user.actorId??req.user.id,'user.commission.change',id,{previousBps:user.personal_commission_bps,nextBps:commissionBps});
      return {commissionBps};
    });
  });
  app.post('/api/admin/users/:id/revoke-sessions',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    return db.transaction(async tx=>{
      const row=(await tx.query('SELECT id FROM users WHERE id=$1',[id])).rows[0];
      if(!row)fail(404,'Not found');
      await tx.query('DELETE FROM sessions WHERE user_id=$1 OR user_id IN (SELECT id FROM users WHERE account_owner_id=$1)',[id]);
      await audit(tx,req.user.actorId??req.user.id,'user.sessions.revoke',id);return {ok:true};
    });
  });

  app.get('/api/admin/users/:id/account',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const row=(await db.query(`SELECT u.id,u.role,s.profile,s.requisites,s.requisites_status,s.requisites_review_comment,s.requisites_reviewed_at
      FROM users u LEFT JOIN account_settings s ON s.user_id=u.id WHERE u.id=$1`,[id])).rows[0];
    if(!row)fail(404,'Not found');
    return {...row,profile:row.profile??{},requisites:row.requisites??{},requisites_status:row.requisites_status??'draft'};
  });
  app.patch('/api/admin/users/:id/requisites',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const {status,comment}=z.object({status:z.enum(['verified','rejected']),comment:z.string().trim().max(2000).default('')}).strict().parse(req.body);
    if(status==='rejected'&&!comment)fail(400,'Укажите причину отклонения');
    return db.transaction(async tx=>{
      const row=(await tx.query("SELECT user_id FROM account_settings WHERE user_id=$1 AND requisites_status='pending' FOR UPDATE",[id])).rows[0];
      if(!row)fail(409,'Реквизиты не ожидают проверки');
      const updated=(await tx.query(`UPDATE account_settings SET requisites_status=$2,requisites_review_comment=$3,
        requisites_reviewer_id=$4,requisites_reviewed_at=now(),updated_at=now() WHERE user_id=$1
        RETURNING requisites_status,requisites_review_comment`,[id,status,comment,req.user.actorId??req.user.id])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'account.requisites.review',id,{status});
      return updated;
    });
  });

  app.post('/api/publisher-applications',async req=>{
    const data=applicationData.parse(req.body);const id=randomUUID();
    return db.transaction(async tx=>{
      const row=(await tx.query('INSERT INTO publisher_applications(id,applicant_user_id,data) VALUES($1,$2,$3) RETURNING *',[id,req.user?.actorId??req.user?.id??null,JSON.stringify(data)])).rows[0];
      await audit(tx,req.user?.actorId??req.user?.id??null,'publisher.application.create',id);
      return {id:row.id,number:row.number};
    });
  });
  app.get('/api/admin/publisher-applications',async req=>{
    role(req.user,'admin');
    return (await db.query('SELECT * FROM publisher_applications WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 500')).rows.map(applicationView);
  });
  app.post('/api/admin/publisher-applications',async req=>{
    role(req.user,'admin');const data=applicationData.parse(req.body);const id=randomUUID();
    return db.transaction(async tx=>{
      const row=(await tx.query('INSERT INTO publisher_applications(id,data) VALUES($1,$2) RETURNING *',[id,JSON.stringify(data)])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'publisher.application.create',id,{manual:true});return applicationView(row);
    });
  });
  app.patch('/api/admin/publisher-applications/:id',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const data=z.object({checks:z.object({resource:z.boolean(),legal:z.boolean(),representative:z.boolean(),duplicate:z.boolean()}).strict().optional(),status:z.enum(['Новая','На проверке','Нужны данные','Одобрена','Отклонена']).optional(),decisionComment:z.string().trim().max(2000).optional()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      const row=(await tx.query('SELECT * FROM publisher_applications WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[id])).rows[0];
      if(!row)fail(404,'Not found');
      const checks=data.checks??row.checks,status=data.status??row.status,comment=data.decisionComment??row.decision_comment;
      if(status==='Одобрена' && (!checkKeys.every(key=>checks[key])||row.status==='Отклонена'))fail(409,'Проверка не завершена');
      if(['Нужны данные','Отклонена'].includes(status)&&!comment)fail(400,'Укажите комментарий');
      if(row.publisher_user_id&&status!==row.status)fail(409,'Кабинет уже создан; измените доступ пользователя отдельно');
      const updated=(await tx.query(`UPDATE publisher_applications SET checks=$2,status=$3,decision_comment=$4,reviewer_id=$5,updated_at=now(),
        invitation_hash=CASE WHEN $3='Одобрена' THEN invitation_hash ELSE NULL END,
        invitation_expires_at=CASE WHEN $3='Одобрена' THEN invitation_expires_at ELSE NULL END
        WHERE id=$1 RETURNING *`,[id,JSON.stringify(checks),status,comment,req.user.actorId??req.user.id])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'publisher.application.review',id,{status,checks});return applicationView(updated);
    });
  });
  app.post('/api/admin/publisher-applications/:id/invite',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    return db.transaction(async tx=>{
      const row=(await tx.query("SELECT * FROM publisher_applications WHERE id=$1 AND status='Одобрена' AND publisher_user_id IS NULL AND deleted_at IS NULL FOR UPDATE",[id])).rows[0];
      if(!row)fail(409,'Заявка не одобрена или кабинет уже создан');
      if((await tx.query('SELECT id FROM users WHERE email=$1',[row.data.email])).rows.length)fail(409,'Для этого email уже существует аккаунт');
      const token=randomBytes(32).toString('base64url');
      const updated=(await tx.query("UPDATE publisher_applications SET invitation_hash=$2,invitation_expires_at=now()+interval '7 days',updated_at=now() WHERE id=$1 RETURNING *",[id,digest(token)])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'publisher.application.invite',id);
      return {...applicationView(updated),token};
    });
  });
  app.delete('/api/admin/publisher-applications/:id',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    return db.transaction(async tx=>{
      const row=(await tx.query('SELECT id,publisher_user_id FROM publisher_applications WHERE id=$1 AND deleted_at IS NULL FOR UPDATE',[id])).rows[0];
      if(!row)fail(404,'Заявка не найдена');
      await tx.query('UPDATE publisher_applications SET deleted_at=now(),invitation_hash=NULL,invitation_expires_at=NULL,updated_at=now() WHERE id=$1',[id]);
      await audit(tx,req.user.actorId??req.user.id,'publisher.application.delete',id);
      return {ok:true};
    });
  });
}
