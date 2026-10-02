import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { randomUUID, randomBytes } from 'node:crypto';
import { z, ZodError } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { digest, hashPassword, verifyPassword, fail, role } from './security.mjs';
import { credentials, materialInput, outletInput, uuid, url } from './validation.mjs';
import { audit, once, quote, transfer } from './finance.mjs';
import { registerFiles } from './files.mjs';
import { registerOperations } from './operations.mjs';
import { registerSettings } from './settings.mjs';
import { registerReports } from './reports.mjs';
import { integrationKey,registerReputation } from './reputation.mjs';
import { registerAccountManagement } from './account-management.mjs';
import { registerPayouts } from './payouts.mjs';
import { registerAdjustments } from './adjustments.mjs';
import { registerTopups } from './topups.mjs';
import { registerClosingDocuments } from './closing-documents.mjs';
import {consumeSecondFactor,registerTwoFactor} from './two-factor.mjs';
import {createDadataClient,partyMatchesAdvertiser,registerDadata} from './dadata.mjs';
import {registerNotifications} from './notifications.mjs';

function teamAllowed(teamRole,method,path) {
  if(teamRole==='admin'||teamRole==='superadmin')return true;
  if(path==='/api/auth/me'||path==='/api/auth/logout'||path==='/api/auth/password'||path.startsWith('/api/auth/sessions')||path.startsWith('/api/auth/two-factor'))return true;
  if(path==='/api/health')return true;
  if(path==='/api/notifications/read'&&['GET','POST'].includes(method))return true;
  if(teamRole==='moderator') {
    if(method==='GET')return path==='/api/materials'||path==='/api/moderation'||path==='/api/outlets'||path==='/api/admin/advertisers'||/^\/api\/admin\/advertisers\/[^/]+$/.test(path)||/^\/api\/files\/[^/]+(?:\/(meta|image))?$/.test(path)||path==='/api/reference/party'||path==='/api/reference/addresses';
    if(method==='POST')return /^\/api\/moderation\/[^/]+$/.test(path)||/^\/api\/admin\/outlets\/[^/]+$/.test(path)||/^\/api\/admin\/advertisers\/[^/]+\/(review|registry-check)$/.test(path);
    return false;
  }
  if(method==='GET') {
    if(path==='/api/payouts'||path==='/api/settings/account')return teamRole==='finance';
    const readable=['/api/materials','/api/projects','/api/advertisers','/api/outlets','/api/orders','/api/reports','/api/closing-documents','/api/balance','/api/transactions','/api/topups','/api/tickets','/api/files','/api/favorites','/api/informers','/api/reference'];
    return readable.some(prefix=>path===prefix||path.startsWith(`${prefix}/`))||path==='/api/settings/limits';
  }
  if(teamRole==='viewer')return false;
  if(teamRole==='content')return ['/api/materials','/api/projects','/api/advertisers','/api/outlets','/api/tickets','/api/files'].some(prefix=>path===prefix||path.startsWith(`${prefix}/`));
  if(teamRole==='finance')return path==='/api/settings/limits'||path==='/api/settings/account/requisites'||path==='/api/payouts'||path.startsWith('/api/closing-documents/');
  return false;
}

export async function createUser(tx, email, password, userRole = 'customer') {
  const id = randomUUID();
  await tx.query('INSERT INTO users(id,email,password_hash,role) VALUES ($1,$2,$3,$4)', [id,email,await hashPassword(password),userRole]);
  await tx.query('INSERT INTO accounts(id) VALUES ($1),($2)', [`${id}:available`,`${id}:reserved`]);
  return { id,email,role:userRole };
}

async function owned(tx, table, id, userId) {
  // Table names are only server constants, never request values.
  const row = (await tx.query(`SELECT * FROM ${table} WHERE id=$1 AND owner_id=$2 FOR UPDATE`, [id,userId])).rows[0];
  if (!row) fail(404, 'Not found');
  return row;
}
async function relations(tx, data, owner) {
  if(data.advertiserId) await owned(tx,'advertisers',data.advertiserId,owner);
  if (data.projectId) await owned(tx,'projects',data.projectId,owner);
  const ids=data.metadata?.attachments??[];
  if(ids.length) {
    const files=(await tx.query('SELECT id FROM files WHERE owner_id=$1 AND id=ANY($2::uuid[])',[owner,ids])).rows;
    if(files.length!==ids.length) fail(404,'Attachment not found');
  }
}
async function outletLogo(tx,data,owner) {
  if(!data.details.logoFileId)return;
  const file=await owned(tx,'files',data.details.logoFileId,owner);
  if(!['image/png','image/jpeg','image/webp'].includes(file.mime))fail(400,'Logo must be an image');
}
const cleanMaterial=data=>({...data,body:sanitizeHtml(data.body,{
  allowedTags:['p','br','h1','h2','strong','b','em','i','ul','ol','li','blockquote','a','img','font','span'],
  allowedAttributes:{a:['href','target','rel'],img:['src','alt'],font:['face','size'],span:['style']},
  allowedSchemes:['http','https','mailto'],
  allowedStyles:{span:{'font-family':[/^(Manrope|Arial|Georgia)$/],'font-size':[/^(10|12|14|16|18|20|24|28|32|36|48)px$/]}},
  transformTags:{a:(tag,attrs)=>({tagName:tag,attribs:{...attrs,target:'_blank',rel:'noopener noreferrer'}})},
}).trim()});

const advertiserInput=z.object({
  name:z.string().trim().min(2,'Укажите юридическое название').max(300),
  inn:z.string().regex(/^(\d{10}|\d{12})$/,'ИНН должен состоять из 10 или 12 цифр'),
  details:z.object({
    kind:z.enum(['legal','entrepreneur']).optional(),
    kpp:z.string().regex(/^(\d{9})?$/,'КПП должен состоять из 9 цифр').optional(),
    ogrn:z.string().regex(/^(\d{13}|\d{15})?$/,'ОГРН должен состоять из 13 или 15 цифр').optional(),
    address:z.string().max(1000).optional(),
    advertisedObject:z.string().trim().max(500).optional(),
    targetUrl:url.optional(),
    contractType:z.enum(['services','intermediary']).optional(),
    contractNumber:z.string().trim().max(100).optional(),
    contractDate:z.iso.date().optional(),
    executorName:z.string().trim().max(300).optional(),
    executorInn:z.string().regex(/^(\d{10}|\d{12})?$/,'ИНН исполнителя должен состоять из 10 или 12 цифр').optional(),
  }).strict().default({}),
}).strict().refine(v=>!v.details.kind||(v.details.kind==='legal'?v.inn.length===10:v.inn.length===12),{path:['inn'],message:'Тип рекламодателя не соответствует ИНН'});

export async function buildApp({ db, origin = 'http://127.0.0.1:5173', secure = false, logger = false, commissionBps = 1500, storageRoot = process.env.STORAGE_ROOT ?? './.local-files', integrationSecret = process.env.INTEGRATION_SECRETS_KEY ?? 'local-development-key-change-before-production', dadataKey = process.env.DADATA_API_KEY, fetchImpl = globalThis.fetch, sellerConfig = {}, tochkaConfig = {} }) {
  if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 10000) throw new Error('Invalid commission');
  const app = Fastify({ logger, bodyLimit: 1200000, requestTimeout: 15000 });
  const dadata=createDadataClient({key:async()=>{const stored=await integrationKey(db,'dadata',integrationSecret);return stored===undefined?dadataKey:stored;},fetchImpl});
  const registryMatch=async advertiser=>{
    const details=advertiser.details??{};
    if(details.kind!=='legal'||!/^\d{10}$/.test(advertiser.inn)||!/^\d{9}$/.test(details.kpp??'')||!/^\d{13}$/.test(details.ogrn??'')||!details.address?.trim())return null;
    try { const result=await dadata.party(advertiser.inn,details.kpp);return partyMatchesAdvertiser(advertiser,result.party); }
    catch(error) { if([502,503].includes(error.statusCode))return null;throw error; }
  };
  await app.register(cookie);
  await app.register(rateLimit,{ max:120,timeWindow:'1 minute',hook:'preHandler',keyGenerator:req=>req.user?.actorId??req.ip });
  app.decorateRequest('user',null);
  app.decorateRequest('activityActorId',null);
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) return reply.code(400).send({ error:'Invalid input',fields:err.issues.map(i => ({ path:i.path.join('.'),message:i.message })) });
    if (err.code === '23505') return reply.code(409).send({ error:'Already exists' });
    if (err.code === '22P02') return reply.code(400).send({ error:'Invalid identifier' });
    const status = err.statusCode ?? 500;
    if (status >= 500) req.log.error({ err },'Request failed');
    reply.code(status).send({ error:status >= 500 ? 'Internal server error' : err.message });
  });
  app.addHook('onRequest',async (req,reply) => {
    reply.header('Cache-Control','no-store').header('X-Content-Type-Options','nosniff');
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.url.split('?')[0] !== '/api/webhooks/tochka' && req.headers.origin !== origin) fail(403,'Invalid origin');
    const token = req.cookies.session;
    if (token) {
      const member=(await db.query(`SELECT u.id,u.email,u.role,u.account_owner_id,u.team_role,u.is_primary_admin FROM sessions s
        JOIN users u ON u.id=s.user_id LEFT JOIN users owner ON owner.id=u.account_owner_id
        WHERE s.token_hash=$1 AND s.expires_at>now() AND u.blocked_at IS NULL
        AND (u.account_owner_id IS NULL OR owner.blocked_at IS NULL)`,[digest(token)])).rows[0];
      if(member) {
        req.user={id:member.account_owner_id??member.id,actorId:member.id,email:member.email,role:member.role,teamRole:member.team_role,isPrimaryAdmin:member.is_primary_admin};
        if(member.account_owner_id && !teamAllowed(member.team_role,req.method,req.url.split('?')[0]))fail(403,'Недостаточно прав команды');
      }
    }
  });
  app.addHook('onResponse',async (req,reply) => {
    const path=req.url.split('?')[0];
    if(!path.startsWith('/api/')||path==='/api/health'||path==='/api/webhooks/tochka')return;
    const attemptedEmail=path==='/api/auth/login'&&typeof req.body?.email==='string'
      ?req.body.email.trim().toLowerCase().slice(0,320):null;
    try {
      await db.query(`INSERT INTO user_activity(actor_id,account_owner_id,attempted_email,method,path,status_code,ip_address,user_agent,session_hash)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[
        req.activityActorId??req.user?.actorId??null,req.user?.id??null,attemptedEmail,
        req.method,path,reply.statusCode,req.ip,req.headers['user-agent']?.slice(0,512)??null,
        req.cookies.session?digest(req.cookies.session):null,
      ]);
    } catch(error) { req.log.error({err:error},'Failed to record user activity'); }
  });
  app.get('/api/health',async () => { await db.query('SELECT 1'); return { status:'ok' }; });
  app.post('/api/auth/register',{config:{rateLimit:{max:5,timeWindow:'1 minute'}}},async (req,reply) => {
    const data = credentials.parse(req.body);
    const user = await db.transaction(tx => createUser(tx,data.email,data.password));
    req.activityActorId=user.id;
    return reply.code(201).send(user);
  });
  const dummyHash = await hashPassword(randomBytes(32).toString('hex'));
  app.post('/api/auth/login',{config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async (req,reply) => {
    const data = credentials.extend({expectedRole:z.enum(['customer','publisher','admin']).optional(),otp:z.string().trim().min(6).max(100).optional()}).parse(req.body);
    const user = (await db.query('SELECT * FROM users WHERE email=$1',[data.email])).rows[0];
    const valid = await verifyPassword(data.password,user?.password_hash ?? dummyHash);
    if (!user || !valid || user.blocked_at) fail(401,'Invalid credentials');
    if(user.account_owner_id && !(await db.query('SELECT id FROM users WHERE id=$1 AND blocked_at IS NULL',[user.account_owner_id])).rows.length)fail(401,'Invalid credentials');
    if(data.expectedRole && data.expectedRole!==user.role) fail(403,'У аккаунта нет доступа к выбранному кабинету');
    const token = randomBytes(32).toString('hex');
    const authenticated=await db.transaction(async tx => {
      const current=(await tx.query('SELECT password_hash,blocked_at FROM users WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
      if(!current||current.blocked_at||current.password_hash!==user.password_hash)fail(401,'Invalid credentials');
      const twoFactor=(await tx.query('SELECT enabled_at FROM user_two_factor WHERE user_id=$1',[user.id])).rows[0];
      if(twoFactor?.enabled_at&&!data.otp)return false;
      if(twoFactor?.enabled_at)await consumeSecondFactor(tx,user.id,data.otp,integrationSecret);
      await tx.query('DELETE FROM sessions WHERE expires_at<now()');
      await tx.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '12 hours')", [digest(token),user.id]);
      return true;
    });
    req.activityActorId=user.id;
    if(!authenticated)return {requiresTwoFactor:true};
    reply.setCookie('session',token,{ httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:43200 });
    return { id:user.id,email:user.email,role:user.role,accountOwnerId:user.account_owner_id??user.id,teamRole:user.team_role,isPrimaryAdmin:user.is_primary_admin };
  });
  app.get('/api/auth/me',async req => { if (!req.user) fail(401,'Authentication required'); return {id:req.user.actorId,email:req.user.email,role:req.user.role,accountOwnerId:req.user.id,teamRole:req.user.teamRole,isPrimaryAdmin:req.user.isPrimaryAdmin}; });
  app.post('/api/auth/logout',async (req,reply) => {
    if (req.cookies.session) await db.query('DELETE FROM sessions WHERE token_hash=$1',[digest(req.cookies.session)]);
    reply.clearCookie('session',{path:'/'}); return { ok:true };
  });
  app.get('/api/projects',async req => { role(req.user,'customer'); return (await db.query('SELECT * FROM projects WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 200',[req.user.id])).rows; });
  app.post('/api/projects',async req => {
    role(req.user,'customer'); const d = z.object({name:z.string().trim().min(1).max(200),description:z.string().max(5000).default(''),advertisers:z.array(z.string().max(300)).max(100).default([])}).strict().parse(req.body);
    return db.transaction(async tx=>{const id=randomUUID();const row=(await tx.query('INSERT INTO projects(id,owner_id,name,description,advertisers) VALUES ($1,$2,$3,$4,$5) RETURNING *',[id,req.user.id,d.name,d.description,JSON.stringify(d.advertisers)])).rows[0];await audit(tx,req.user.actorId??req.user.id,'project.create',id);return row;});
  });
  app.patch('/api/projects/:id',async req => {
    role(req.user,'customer');const id=uuid.parse(req.params.id);const {completed}=z.object({completed:z.boolean()}).strict().parse(req.body);
    return db.transaction(async tx=>{await owned(tx,'projects',id,req.user.id);await audit(tx,req.user.actorId??req.user.id,'project.status',id,{completed});return (await tx.query('UPDATE projects SET completed=$2 WHERE id=$1 RETURNING *',[id,completed])).rows[0];});
  });
  app.delete('/api/projects/:id',async req => {
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    return db.transaction(async tx=>{
      await owned(tx,'projects',id,req.user.id);
      const used=(await tx.query('SELECT id FROM materials WHERE project_id=$1 UNION ALL SELECT id FROM orders WHERE project_id=$1',[id])).rows;
      if(used.length) fail(409,'Project contains materials or orders');
      await tx.query('DELETE FROM projects WHERE id=$1',[id]);await audit(tx,req.user.actorId??req.user.id,'project.delete',id);return {ok:true};
    });
  });
  app.post('/api/materials/:id/project',async req=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);const {projectId}=z.object({projectId:uuid.nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{await owned(tx,'materials',id,req.user.id);if(projectId) await owned(tx,'projects',projectId,req.user.id);
      await tx.query('UPDATE materials SET project_id=$2 WHERE id=$1',[id,projectId]);await audit(tx,req.user.actorId??req.user.id,'material.project',id,{projectId});return {ok:true};});
  });
  app.post('/api/orders/project',async req=>{
    role(req.user,'customer');const {ids,projectId}=z.object({ids:z.array(uuid).min(1).max(100).refine(v=>new Set(v).size===v.length),projectId:uuid.nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      if(projectId) await owned(tx,'projects',projectId,req.user.id);
      for(const id of [...ids].sort()) {
        const result=await tx.query('UPDATE orders SET project_id=$3 WHERE id=$1 AND customer_id=$2 RETURNING id',[id,req.user.id,projectId]);
        if(!result.rows.length) fail(404,'Order not found');await audit(tx,req.user.actorId??req.user.id,'order.project',id,{projectId});
      } return {ok:true};
    });
  });
  app.post('/api/materials/save-batch',async req=>{
    role(req.user,'customer');const d=z.object({items:z.array(materialInput.extend({clientKey:uuid})).min(1).max(50).refine(v=>new Set(v.map(m=>m.clientKey)).size===v.length),submit:z.boolean(),expedited:z.boolean()}).strict().parse(req.body);
    return once(db,req,'materials.save-batch',async tx=>{
      const ids=[];
      for(const raw of [...d.items].sort((a,b)=>a.clientKey.localeCompare(b.clientKey))) {
        const m=cleanMaterial(raw);
        await relations(tx,m,req.user.id);
        await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`${req.user.id}:${m.clientKey}`]);
        const old=(await tx.query('SELECT * FROM materials WHERE owner_id=$1 AND client_key=$2 FOR UPDATE',[req.user.id,m.clientKey])).rows[0];
        if(old && old.status!=='draft') fail(409,'Material already submitted');
        const id=old?.id??randomUUID();
        if(old) await tx.query('UPDATE materials SET title=$2,body=$3,format=$4,advertiser_id=$5,project_id=$6,metadata=$7,version=version+1 WHERE id=$1',[id,m.title,m.body,m.format,m.advertiserId,m.projectId,JSON.stringify(m.metadata)]);
        else await tx.query('INSERT INTO materials(id,owner_id,client_key,title,body,format,advertiser_id,project_id,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,req.user.id,m.clientKey,m.title,m.body,m.format,m.advertiserId,m.projectId,JSON.stringify(m.metadata)]);
        if(d.submit) {
          if(m.advertiserId) {
            const advertiser=await owned(tx,'advertisers',m.advertiserId,req.user.id);
            if(advertiser.verification!=='verified') fail(409,'Advertiser verification required');
          }
          if(d.expedited) await transfer(tx,`${req.user.id}:available`,'platform:revenue',5000,`moderation:${id}`);
          await tx.query("UPDATE materials SET status='pending',expedited=$2,submitted_at=now() WHERE id=$1",[id,d.expedited]);
        }
        await audit(tx,req.user.actorId??req.user.id,d.submit?'material.submit':'material.save',id);ids.push(id);
      }
      return {ids};
    });
  });
  app.get('/api/advertisers',async req => { role(req.user,'customer'); return (await db.query('SELECT * FROM advertisers WHERE owner_id=$1 LIMIT 200',[req.user.id])).rows; });
  app.get('/api/advertisers/:id',async req => {
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    const advertiser=(await db.query('SELECT * FROM advertisers WHERE id=$1 AND owner_id=$2',[id,req.user.id])).rows[0];
    if(!advertiser)fail(404,'Рекламодатель не найден');
    return advertiser;
  });
  app.post('/api/advertisers',async req => {
    role(req.user,'customer'); const d = advertiserInput.parse(req.body);
    const verified=await registryMatch(d);
    return db.transaction(async tx=>{const id=randomUUID();const row=(await tx.query('INSERT INTO advertisers(id,owner_id,name,inn,details,verification) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',[id,req.user.id,d.name,d.inn,JSON.stringify(d.details),verified?'verified':'pending'])).rows[0];await audit(tx,req.user.actorId??req.user.id,'advertiser.create',id);if(verified)await audit(tx,req.user.actorId??req.user.id,'advertiser.auto_verify',id,{source:'dadata'});return row;});
  });
  app.patch('/api/advertisers/:id',async req=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);const d=advertiserInput.parse(req.body);
    const verified=await registryMatch(d);
    return db.transaction(async tx=>{
      const current=await owned(tx,'advertisers',id,req.user.id);
      const unchanged=current.name===d.name&&current.inn===d.inn&&current.details?.kind===d.details.kind&&current.details?.kpp===d.details.kpp&&current.details?.ogrn===d.details.ogrn&&current.details?.address===d.details.address;
      const verification=current.verification==='blocked'?'blocked':verified?'verified':unchanged&&(verified===null||current.reviewed_by)?current.verification:'pending';
      const row=(await tx.query('UPDATE advertisers SET name=$2,inn=$3,details=$4,verification=$5 WHERE id=$1 RETURNING *',[id,d.name,d.inn,JSON.stringify(d.details),verification])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'advertiser.update',id);if(verification==='verified'&&current.verification!=='verified')await audit(tx,req.user.actorId??req.user.id,'advertiser.auto_verify',id,{source:'dadata'});return row;
    });
  });
  app.get('/api/materials',async req => {
    role(req.user,'customer','admin');
    return (await db.query('SELECT * FROM materials WHERE ($1::text=\'admin\' OR owner_id=$2) ORDER BY created_at DESC LIMIT 200',[req.user.role,req.user.id])).rows;
  });
  app.post('/api/materials/batch',async req => {
    role(req.user,'customer'); const items = z.array(materialInput).min(1).max(50).parse(req.body);
    return once(db,req,'materials.create',async tx => {
      const result = [];
      for (const raw of items) {
        const d=cleanMaterial(raw);
        await relations(tx,d,req.user.id);
        result.push((await tx.query('INSERT INTO materials(id,owner_id,advertiser_id,project_id,title,body,format,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[randomUUID(),req.user.id,d.advertiserId,d.projectId,d.title,d.body,d.format,JSON.stringify(d.metadata)])).rows[0]);
        await audit(tx,req.user.actorId??req.user.id,'material.create',result.at(-1).id);
      }
      return result;
    });
  });
  app.put('/api/materials/:id',async req => {
    role(req.user,'customer'); const id=uuid.parse(req.params.id);
    const {version,...parsed} = materialInput.extend({version:z.number().int().positive()}).parse(req.body);
    const data=cleanMaterial(parsed);
    return db.transaction(async tx => {
      const current=await owned(tx,'materials',id,req.user.id);
      if (current.version !== version || current.status === 'pending') fail(409,'Material changed or under moderation');
      await relations(tx,data,req.user.id);
      await audit(tx,req.user.actorId??req.user.id,'material.edit',id);
      return (await tx.query("UPDATE materials SET advertiser_id=$2,project_id=$3,title=$4,body=$5,format=$6,metadata=$7,status='draft',expedited=false,moderation_reason=null,version=version+1 WHERE id=$1 RETURNING *",[id,data.advertiserId,data.projectId,data.title,data.body,data.format,JSON.stringify(data.metadata)])).rows[0];
    });
  });
  app.post('/api/materials/submit',async req => {
    role(req.user,'customer'); const d=z.object({ ids:z.array(uuid).min(1).max(50).refine(v=>new Set(v).size===v.length),expedited:z.boolean() }).strict().parse(req.body);
    return once(db,req,'materials.submit',async tx => {
      for (const id of [...d.ids].sort()) {
        const material=await owned(tx,'materials',id,req.user.id);
        if (!['draft','rejected'].includes(material.status)) fail(409,'Material is not a draft');
        if(material.advertiser_id) {
          const advertiser=await owned(tx,'advertisers',material.advertiser_id,req.user.id);
          if (advertiser.verification !== 'verified') fail(409,'Advertiser verification required');
        }
        if (d.expedited) await transfer(tx,`${req.user.id}:available`,'platform:revenue',5000,`moderation:${id}:${material.version}`);
        await tx.query("UPDATE materials SET status='pending',expedited=$2,submitted_at=now(),moderation_reason=null WHERE id=$1",[id,d.expedited]);
        await audit(tx,req.user.actorId??req.user.id,'material.submit',id,{ expedited:d.expedited });
      }
      return { ids:d.ids,status:'pending',fee:d.expedited?d.ids.length*5000:0 };
    });
  });
  app.post('/api/materials/:id/withdraw',async req=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    return once(db,req,`material.withdraw:${id}`,async tx=>{
      const material=await owned(tx,'materials',id,req.user.id);
      if(material.status!=='pending')fail(409,'Материал уже не находится на модерации');
      const refund=material.expedited?5000:0;
      if(refund)await transfer(tx,'platform:revenue',`${req.user.id}:available`,refund,`moderation-refund:${id}:${material.version}`);
      const row=(await tx.query("UPDATE materials SET status='draft',expedited=false,submitted_at=null,moderation_reason=null,version=version+1 WHERE id=$1 RETURNING *",[id])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'material.withdraw',id,{refund});
      return row;
    });
  });
  app.get('/api/moderation',async req => { role(req.user,'admin'); return (await db.query("SELECT * FROM materials WHERE status='pending' ORDER BY expedited DESC,submitted_at,id LIMIT 200")).rows; });
  app.post('/api/moderation/:id',async req => {
    role(req.user,'admin'); const id=uuid.parse(req.params.id); const d=z.object({approved:z.boolean(),reason:z.string().trim().max(5000).default('')}).strict().parse(req.body);
    if (!d.approved && !d.reason) fail(400,'Reason required');
    return db.transaction(async tx => {
      const result=(await tx.query("UPDATE materials SET status=$2,moderation_reason=$3 WHERE id=$1 AND status='pending' RETURNING *",[id,d.approved?'approved':'rejected',d.reason])).rows[0];
      if (!result) fail(409,'Not pending');
      await audit(tx,req.user.actorId??req.user.id,'material.moderate',id,d); return result;
    });
  });
  app.get('/api/outlets',async req => {
    role(req.user,'customer','publisher','admin');
    const filters=z.object({goal:z.enum(['pr','seo','serm']).optional(),kind:z.enum(['media','telegram','vk','max','dzen']).optional(),geography:z.string().max(100).optional()}).parse(req.query);
    return (await db.query("SELECT o.*,u.email AS owner_email FROM outlets o JOIN users u ON u.id=o.owner_id WHERE ($1='admin' OR ($1='publisher' AND o.owner_id=$2) OR ($1='customer' AND o.active AND o.status='approved')) AND ($3::text IS NULL OR o.details->'goals' ? $3) AND ($4::text IS NULL OR o.kind=$4) AND ($5::text IS NULL OR o.geography=$5) ORDER BY o.created_at DESC LIMIT 200",[req.user.role,req.user.id,filters.goal??null,filters.kind??null,filters.geography??null])).rows;
  });
  app.post('/api/outlets',async req => {
    role(req.user,'publisher'); const d=outletInput.parse(req.body);
    return db.transaction(async tx=>{
      await outletLogo(tx,d,req.user.id);
      const id=randomUUID();await audit(tx,req.user.actorId??req.user.id,'outlet.create',id);
      return (await tx.query('INSERT INTO outlets(id,owner_id,name,url,kind,geography,details,prices,coefficient_bps,discount_bps,discount_until,season_start) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',[id,req.user.id,d.name,d.url,d.kind,d.geography,JSON.stringify(d.details),JSON.stringify(d.prices),d.coefficientBps,d.discountBps,d.discountUntil,d.seasonStart])).rows[0];
    });
  });
  app.put('/api/outlets/:id',async req => {
    role(req.user,'publisher'); const d=outletInput.parse(req.body); const id=uuid.parse(req.params.id);
    return db.transaction(async tx => {
      await owned(tx,'outlets',id,req.user.id);
      await outletLogo(tx,d,req.user.id);
      await audit(tx,req.user.actorId??req.user.id,'outlet.edit',id);
      return (await tx.query("UPDATE outlets SET name=$2,url=$3,kind=$4,geography=$5,details=$6,prices=$7,coefficient_bps=$8,discount_bps=$9,discount_until=$10,season_start=$11,status='pending',active=false WHERE id=$1 RETURNING *",[id,d.name,d.url,d.kind,d.geography,JSON.stringify(d.details),JSON.stringify(d.prices),d.coefficientBps,d.discountBps,d.discountUntil,d.seasonStart])).rows[0];
    });
  });
  app.post('/api/outlets/:id/active',async req => {
    role(req.user,'publisher','admin'); const {active}=z.object({active:z.boolean()}).strict().parse(req.body);
    return db.transaction(async tx => {
      const id=uuid.parse(req.params.id); const outlet=req.user.role==='admin'?(await tx.query('SELECT * FROM outlets WHERE id=$1 FOR UPDATE',[id])).rows[0]:await owned(tx,'outlets',id,req.user.id);
      if(!outlet)fail(404,'Not found');
      if (outlet.status!=='approved') fail(409,'Outlet not approved');
      await audit(tx,req.user.actorId??req.user.id,'outlet.activity',id,{active});
      return (await tx.query('UPDATE outlets SET active=$2 WHERE id=$1 RETURNING *',[id,active])).rows[0];
    });
  });
  app.post('/api/admin/outlets/:id',async req => {
    role(req.user,'admin'); const id=uuid.parse(req.params.id); const {approved}=z.object({approved:z.boolean()}).strict().parse(req.body);
    return db.transaction(async tx => {
      const result=(await tx.query('UPDATE outlets SET status=$2,active=$3 WHERE id=$1 RETURNING *',[id,approved?'approved':'rejected',approved])).rows[0];
      if (!result) fail(404,'Not found'); await audit(tx,req.user.actorId??req.user.id,'outlet.moderate',id,{approved}); return result;
    });
  });
  app.get('/api/balance',async req => {
    role(req.user,'customer','publisher','admin');
    const rows=(await db.query('SELECT * FROM accounts WHERE id=ANY($1::text[])',[[`${req.user.id}:available`,`${req.user.id}:reserved`]])).rows;
    return Object.fromEntries(rows.map(a=>[a.id.split(':')[1],Number(a.balance)]));
  });
  app.get('/api/transactions',async req => {
    role(req.user,'customer','publisher','admin');
    return (await db.query('SELECT * FROM ledger WHERE debit_account=ANY($1::text[]) OR credit_account=ANY($1::text[]) ORDER BY created_at DESC LIMIT 200',[[`${req.user.id}:available`,`${req.user.id}:reserved`]])).rows;
  });
  app.get('/api/transactions/export.csv',async(req,reply)=>{
    role(req.user,'customer','publisher','admin');
    const rows=(await db.query('SELECT * FROM ledger WHERE debit_account=ANY($1::text[]) OR credit_account=ANY($1::text[]) ORDER BY created_at DESC LIMIT 500',[[`${req.user.id}:available`,`${req.user.id}:reserved`]])).rows;
    const escape=value=>`"${String(value??'').replaceAll('"','""')}"`;
    const csv=['Дата,Списание,Зачисление,Сумма,Основание',...rows.map(row=>[new Date(row.created_at).toLocaleString('ru-RU'),row.debit_account,row.credit_account,Number(row.amount)/100,row.reference].map(escape).join(','))].join('\n');
    reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition',"attachment; filename*=UTF-8''transactions.csv");return `\ufeff${csv}`;
  });
  app.post('/api/orders',async req => {
    role(req.user,'customer'); const d=z.object({
      materialId:uuid,
      outletIds:z.array(uuid).min(1).max(50).optional(),
      placements:z.array(z.object({outletId:uuid,format:z.enum(['article','news','post','longread'])}).strict()).min(1).max(50).optional(),
      expectedAmount:z.number().int().nonnegative().optional(),
      informerId:uuid.optional(),
      limitConfirmed:z.boolean().default(false),
      autoAccept:z.boolean().default(false),
    }).strict().refine(value=>Boolean(value.outletIds)!==Boolean(value.placements),'Provide either outletIds or placements').refine(value=>{
      const ids=value.placements?.map(item=>item.outletId)??value.outletIds??[];
      return new Set(ids).size===ids.length;
    },'Duplicate outlets are not allowed').parse(req.body);
    return once(db,req,'orders.create',async tx => {
      if((await tx.query('SELECT owner_id FROM topup_account_holds WHERE owner_id=$1',[req.user.id])).rows.length)fail(409,'Новые заказы заблокированы до урегулирования задолженности');
      const material=await owned(tx,'materials',d.materialId,req.user.id);
      if (material.status!=='approved') fail(409,'Material not approved');
      const advertiser=material.advertiser_id ? await owned(tx,'advertisers',material.advertiser_id,req.user.id) : null;
      if (advertiser && advertiser.verification!=='verified') fail(409,'Advertiser verification required');
      const result=[];
      const {order_limit:orderLimit}=(await tx.query('SELECT order_limit FROM users WHERE id=$1 FOR UPDATE',[req.user.id])).rows[0];
      const placements=(d.placements??d.outletIds.map(outletId=>({outletId,format:material.format}))).sort((a,b)=>a.outletId.localeCompare(b.outletId));
      const priced=[];
      for (const placement of placements) {
        const {outletId,format}=placement;
        const outlet=(await tx.query('SELECT * FROM outlets WHERE id=$1 FOR UPDATE',[outletId])).rows[0];
        if (!outlet?.active || outlet.status!=='approved') fail(409,'Outlet unavailable');
        priced.push({...placement,outlet,standardAmount:quote(outlet,format)});
      }
      let packageOffer=null;
      if(d.informerId) {
        const row=(await tx.query('SELECT data FROM informers WHERE id=$1',[d.informerId])).rows[0];
        const data=row?.data;
        const parseDay=value=>{
          if(!value||value==='Без срока')return null;
          const parts=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
          return parts?`${parts[3]}-${parts[2]}-${parts[1]}`:value;
        };
        const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Moscow'});
        const startsAt=parseDay(data?.startsAt),endsAt=parseDay(data?.endsAt);
        const packagePrice=Number(data?.packagePrice);
        const selectedIds=[...(data?.selectionIds??[])].map(String).sort();
        const placementIds=priced.map(item=>String(item.outletId)).sort();
        const active=data
          && ['Опубликован','Запланирован'].includes(data.status)
          && (!startsAt||startsAt<=today)
          && (!endsAt||endsAt>=today);
        const exactSelection=selectedIds.length===placementIds.length&&selectedIds.every((value,index)=>value===placementIds[index]);
        if(!active||data.format!=='Подборка площадок'||!Number.isSafeInteger(packagePrice)||packagePrice<=0||!exactSelection)fail(409,'Пакетное предложение недоступно или состав подборки изменен');
        for(const item of priced) {
          const preferredFormat=item.outlet.kind==='media'?(material.format==='news'?'news':'article'):'post';
          const expectedFormat=item.outlet.prices[preferredFormat]?preferredFormat:Object.keys(item.outlet.prices)[0];
          if(item.format!==expectedFormat)fail(409,'Формат размещения не соответствует пакетному предложению');
        }
        const totalAmount=packagePrice*100;
        if(!Number.isSafeInteger(totalAmount))fail(409,'Некорректная цена подборки');
        const standardTotal=priced.reduce((sum,item)=>sum+item.standardAmount,0);
        const distributable=totalAmount-priced.length;
        const allocations=priced.map(item=>1+Math.floor(distributable*item.standardAmount/standardTotal));
        let remainder=totalAmount-allocations.reduce((sum,value)=>sum+value,0);
        for(let index=0;remainder>0;index=(index+1)%allocations.length,remainder--)allocations[index]++;
        priced.forEach((item,index)=>{item.amount=allocations[index];});
        packageOffer={id:d.informerId,title:data.title,packagePrice};
      } else priced.forEach(item=>{item.amount=item.standardAmount;});
      const totalAmount=priced.reduce((sum,item)=>sum+item.amount,0);
      if (d.expectedAmount !== undefined && totalAmount!==d.expectedAmount) fail(409,'Price changed; review the order total');
      if(d.autoAccept && orderLimit!==null && totalAmount>Number(orderLimit) && !d.limitConfirmed)fail(409,'Сумма превышает лимит автоприемки');
      for (const placement of priced) {
        const {outletId,format,outlet,amount,standardAmount}=placement;
        const publisher=(await tx.query('SELECT personal_commission_bps FROM users WHERE id=$1',[outlet.owner_id])).rows[0];
        const effectiveCommissionBps=publisher.personal_commission_bps??commissionBps;
        const payout=amount-Math.round(amount*effectiveCommissionBps/10000); const id=randomUUID();
        await transfer(tx,`${req.user.id}:available`,`${req.user.id}:reserved`,amount,`order:${id}:reserve`);
        const responseHours=Number(outlet.details.responseHours||24);
        const publicationDays=Number(outlet.details.publicationDaysByFormat?.[format]||outlet.details.publicationDays||2);
        const snapshot={title:material.title,body:material.body,format,metadata:material.metadata,version:material.version,advertiser:advertiser?{id:advertiser.id,name:advertiser.name,inn:advertiser.inn,details:advertiser.details}:null,outlet:{name:outlet.name,url:outlet.url},commissionBps:effectiveCommissionBps,autoAccept:d.autoAccept,schedule:{responseHours,publicationDays,deadlineAt:new Date(Date.now()+responseHours*3600000).toISOString()},...(packageOffer?{informer:packageOffer,standardAmount}: {})};
        result.push((await tx.query('INSERT INTO orders(id,customer_id,publisher_id,material_id,outlet_id,project_id,snapshot,amount,payout) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[id,req.user.id,outlet.owner_id,material.id,outletId,material.project_id,JSON.stringify(snapshot),amount,payout])).rows[0]);
        await audit(tx,req.user.actorId??req.user.id,'order.create',id,{amount,payout,...(packageOffer?{informerId:packageOffer.id}: {})});
      }
      return result;
    });
  });
  app.get('/api/orders',async req => {
    role(req.user,'customer','publisher','admin');
    return (await db.query(`SELECT o.*,
        (o.status='disputed' AND CASE WHEN $1='admin' THEN coalesce(last_message.role<>'admin',true)
          ELSE coalesce(last_message.role<>$1,false) END) AS awaiting_reply
      FROM orders o LEFT JOIN LATERAL (
        SELECT author.role FROM order_messages m JOIN users author ON author.id=m.author_id
        WHERE m.order_id=o.id AND ($1='admin' OR m.recipient_id IS NULL OR m.recipient_id=$2)
        ORDER BY m.created_at DESC,m.id DESC LIMIT 1
      ) last_message ON true
      WHERE $1='admin' OR o.customer_id=$2 OR o.publisher_id=$2 ORDER BY o.created_at DESC LIMIT 200`,[req.user.role,req.user.id])).rows;
  });
  app.post('/api/orders/:id/project',async req => {
    role(req.user,'customer'); const id=uuid.parse(req.params.id); const {projectId}=z.object({projectId:uuid.nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      if(projectId) await owned(tx,'projects',projectId,req.user.id);
      const result=(await tx.query('UPDATE orders SET project_id=$3 WHERE id=$1 AND customer_id=$2 RETURNING *',[id,req.user.id,projectId])).rows[0];
      if(!result) fail(404,'Not found'); await audit(tx,req.user.actorId??req.user.id,'order.project',id,{projectId}); return result;
    });
  });
  app.post('/api/orders/:id/action',async req => {
    role(req.user,'customer','publisher','admin'); const id=uuid.parse(req.params.id);
    const d=z.object({
      action:z.enum(['accept','reject','publish','complete','dispute','refund','release','resolve']),
      url:url.optional(),
      markingConfirmed:z.boolean().optional(),
      reason:z.string().trim().max(5000).optional(),
      decision:z.enum(['full_refund','full_payout','partial','no_sanctions']).optional(),
      publisherAmount:z.number().int().positive().optional(),
    }).strict().parse(req.body);
    return once(db,req,`order:${id}:action`,async tx=>{
      const o=(await tx.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if (!o || (req.user.role!=='admin' && ![o.customer_id,o.publisher_id].includes(req.user.id))) fail(404,'Not found');
      const rules={accept:['publisher','pending','accepted'],reject:['publisher','pending','rejected'],publish:['publisher','accepted','submitted'],complete:['customer','submitted','completed'],dispute:['customer','submitted','disputed'],refund:['admin','disputed','refunded'],release:['admin','disputed','completed'],resolve:['admin','disputed',null]};
      const [required,from,to]=rules[d.action]; role(req.user,required);
      if(o.status!==from) fail(409,'Invalid order transition');
      if(['reject','dispute','refund','release','resolve'].includes(d.action) && !d.reason) fail(400,'Reason required');
      if(d.action==='publish' && (!d.url || d.markingConfirmed!==true)) fail(400,'Publication URL and marking confirmation required');
      if(d.action==='resolve') {
        if(!d.decision) fail(400,'Decision required');
        if(d.decision==='partial' && (!d.publisherAmount || d.publisherAmount>=o.amount)) fail(400,'Partial payout must be less than the order amount');
        const publisherAmount=d.decision==='full_refund'?0:d.decision==='full_payout'?o.amount:d.decision==='partial'?d.publisherAmount:o.payout;
        const customerAmount=d.decision==='partial'?o.amount-publisherAmount:d.decision==='full_refund'?o.amount:0;
        const platformAmount=d.decision==='no_sanctions'?o.amount-o.payout:0;
        if(publisherAmount)await transfer(tx,`${o.customer_id}:reserved`,`${o.publisher_id}:available`,publisherAmount,`order:${id}:dispute:${d.decision}:publisher`);
        if(customerAmount)await transfer(tx,`${o.customer_id}:reserved`,`${o.customer_id}:available`,customerAmount,`order:${id}:dispute:${d.decision}:customer`);
        if(platformAmount)await transfer(tx,`${o.customer_id}:reserved`,'platform:revenue',platformAmount,`order:${id}:dispute:${d.decision}:commission`);
        const status=publisherAmount?'completed':'refunded';
        const snapshot={...o.snapshot,disputeResolution:{decision:d.decision,publisherAmount,customerAmount,platformAmount,resolvedAt:new Date().toISOString()}};
        const result=(await tx.query('UPDATE orders SET status=$2,snapshot=$3,reason=$4,updated_at=now() WHERE id=$1 RETURNING *',[id,status,JSON.stringify(snapshot),d.reason])).rows[0];
        await audit(tx,req.user.actorId??req.user.id,'order.resolve',id,{from,status,decision:d.decision,publisherAmount,customerAmount,platformAmount});
        return result;
      }
      if(d.action==='dispute')await tx.query("UPDATE orders SET dispute_number=coalesce(dispute_number,nextval('dispute_number_seq')) WHERE id=$1",[id]);
      if(['rejected','refunded'].includes(to)) await transfer(tx,`${o.customer_id}:reserved`,`${o.customer_id}:available`,o.amount,`order:${id}:refund`);
      if(to==='completed') {
        if(o.payout>0) await transfer(tx,`${o.customer_id}:reserved`,`${o.publisher_id}:available`,o.payout,`order:${id}:payout`);
        if(o.amount>o.payout) await transfer(tx,`${o.customer_id}:reserved`,'platform:revenue',o.amount-o.payout,`order:${id}:commission`);
      }
      const snapshot=d.action==='accept'
        ? {...o.snapshot,schedule:{...o.snapshot.schedule,deadlineAt:new Date(Date.now()+Number(o.snapshot.schedule?.publicationDays||2)*86400000).toISOString()}}
        : ['publish','reject','complete'].includes(d.action)
          ? {...o.snapshot,schedule:{...o.snapshot.schedule,deadlineAt:null}}
          : o.snapshot;
      const result=(await tx.query('UPDATE orders SET status=$2,publication_url=COALESCE($3,publication_url),marking_confirmed=COALESCE($4,marking_confirmed),reason=COALESCE($5,reason),snapshot=$6,updated_at=now() WHERE id=$1 RETURNING *',[id,to,d.action==='publish'?d.url:null,d.action==='publish'?true:null,d.reason??null,JSON.stringify(snapshot)])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,`order.${d.action}`,id,{from,to}); return result;
    });
  });
  await registerFiles(app,db,storageRoot);
  await registerOperations(app,db,{commissionBps,dadata});
  registerSettings(app,db,{commissionBps});
  registerTwoFactor(app,db,integrationSecret);
  registerAccountManagement(app,db);
  registerDadata(app,dadata);
  registerNotifications(app,db);
  registerPayouts(app,db);
  registerAdjustments(app,db);
  registerTopups(app,db,{sellerConfig,tochkaConfig,fetchImpl});
  registerReports(app,db);
  registerClosingDocuments(app,db,{sellerConfig,storageRoot});
  registerReputation(app,db,{integrationSecret,fetchImpl,appOrigin:origin});
  return app;
}
