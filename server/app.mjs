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

export async function buildApp({ db, origin = 'http://127.0.0.1:5173', secure = false, logger = false, commissionBps = 1500, storageRoot = process.env.STORAGE_ROOT ?? './.local-files' }) {
  if (!Number.isInteger(commissionBps) || commissionBps < 0 || commissionBps > 10000) throw new Error('Invalid commission');
  const app = Fastify({ logger, bodyLimit: 1200000, requestTimeout: 15000 });
  await app.register(cookie);
  await app.register(rateLimit,{ max:120,timeWindow:'1 minute',hook:'preHandler',keyGenerator:req=>req.user?.id??req.ip });
  app.decorateRequest('user',null);
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
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin !== origin) fail(403,'Invalid origin');
    const token = req.cookies.session;
    if (token) req.user = (await db.query('SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()', [digest(token)])).rows[0] ?? null;
  });
  app.get('/api/health',async () => { await db.query('SELECT 1'); return { status:'ok' }; });
  app.post('/api/auth/register',{config:{rateLimit:{max:5,timeWindow:'1 minute'}}},async (req,reply) => {
    const data = credentials.parse(req.body);
    const user = await db.transaction(tx => createUser(tx,data.email,data.password));
    return reply.code(201).send(user);
  });
  const dummyHash = await hashPassword(randomBytes(32).toString('hex'));
  app.post('/api/auth/login',{config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async (req,reply) => {
    const data = credentials.extend({expectedRole:z.enum(['customer','publisher','admin']).optional()}).parse(req.body);
    const user = (await db.query('SELECT * FROM users WHERE email=$1',[data.email])).rows[0];
    const valid = await verifyPassword(data.password,user?.password_hash ?? dummyHash);
    if (!user || !valid) fail(401,'Invalid credentials');
    if(data.expectedRole && data.expectedRole!==user.role) fail(403,'У аккаунта нет доступа к выбранному кабинету');
    const token = randomBytes(32).toString('hex');
    await db.transaction(async tx => {
      await tx.query('DELETE FROM sessions WHERE expires_at<now()');
      await tx.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '12 hours')", [digest(token),user.id]);
    });
    reply.setCookie('session',token,{ httpOnly:true,secure,sameSite:'strict',path:'/',maxAge:43200 });
    return { id:user.id,email:user.email,role:user.role };
  });
  app.get('/api/auth/me',async req => { if (!req.user) fail(401,'Authentication required'); return req.user; });
  app.post('/api/auth/logout',async (req,reply) => {
    if (req.cookies.session) await db.query('DELETE FROM sessions WHERE token_hash=$1',[digest(req.cookies.session)]);
    reply.clearCookie('session',{path:'/'}); return { ok:true };
  });
  app.get('/api/projects',async req => { role(req.user,'customer'); return (await db.query('SELECT * FROM projects WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 200',[req.user.id])).rows; });
  app.post('/api/projects',async req => {
    role(req.user,'customer'); const d = z.object({name:z.string().trim().min(1).max(200),description:z.string().max(5000).default(''),advertisers:z.array(z.string().max(300)).max(100).default([])}).strict().parse(req.body);
    return db.transaction(async tx=>{const id=randomUUID();const row=(await tx.query('INSERT INTO projects(id,owner_id,name,description,advertisers) VALUES ($1,$2,$3,$4,$5) RETURNING *',[id,req.user.id,d.name,d.description,JSON.stringify(d.advertisers)])).rows[0];await audit(tx,req.user.id,'project.create',id);return row;});
  });
  app.patch('/api/projects/:id',async req => {
    role(req.user,'customer');const id=uuid.parse(req.params.id);const {completed}=z.object({completed:z.boolean()}).strict().parse(req.body);
    return db.transaction(async tx=>{await owned(tx,'projects',id,req.user.id);await audit(tx,req.user.id,'project.status',id,{completed});return (await tx.query('UPDATE projects SET completed=$2 WHERE id=$1 RETURNING *',[id,completed])).rows[0];});
  });
  app.delete('/api/projects/:id',async req => {
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    return db.transaction(async tx=>{
      await owned(tx,'projects',id,req.user.id);
      const used=(await tx.query('SELECT id FROM materials WHERE project_id=$1 UNION ALL SELECT id FROM orders WHERE project_id=$1',[id])).rows;
      if(used.length) fail(409,'Project contains materials or orders');
      await tx.query('DELETE FROM projects WHERE id=$1',[id]);await audit(tx,req.user.id,'project.delete',id);return {ok:true};
    });
  });
  app.post('/api/materials/:id/project',async req=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);const {projectId}=z.object({projectId:uuid.nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{await owned(tx,'materials',id,req.user.id);if(projectId) await owned(tx,'projects',projectId,req.user.id);
      await tx.query('UPDATE materials SET project_id=$2 WHERE id=$1',[id,projectId]);await audit(tx,req.user.id,'material.project',id,{projectId});return {ok:true};});
  });
  app.post('/api/orders/project',async req=>{
    role(req.user,'customer');const {ids,projectId}=z.object({ids:z.array(uuid).min(1).max(100).refine(v=>new Set(v).size===v.length),projectId:uuid.nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      if(projectId) await owned(tx,'projects',projectId,req.user.id);
      for(const id of [...ids].sort()) {
        const result=await tx.query('UPDATE orders SET project_id=$3 WHERE id=$1 AND customer_id=$2 RETURNING id',[id,req.user.id,projectId]);
        if(!result.rows.length) fail(404,'Order not found');await audit(tx,req.user.id,'order.project',id,{projectId});
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
        await audit(tx,req.user.id,d.submit?'material.submit':'material.save',id);ids.push(id);
      }
      return {ids};
    });
  });
  app.get('/api/advertisers',async req => { role(req.user,'customer'); return (await db.query('SELECT * FROM advertisers WHERE owner_id=$1 LIMIT 200',[req.user.id])).rows; });
  app.post('/api/advertisers',async req => {
    role(req.user,'customer'); const d = z.object({ name:z.string().trim().min(2,'Укажите юридическое название').max(300),inn:z.string().regex(/^(\d{10}|\d{12})$/,'ИНН должен состоять из 10 или 12 цифр'),details:z.object({kpp:z.string().regex(/^(\d{9})?$/,'КПП должен состоять из 9 цифр').optional(),ogrn:z.string().regex(/^(\d{13}|\d{15})?$/,'ОГРН должен состоять из 13 или 15 цифр').optional(),address:z.string().max(1000).optional()}).strict().default({}) }).strict().parse(req.body);
    return db.transaction(async tx=>{const id=randomUUID();const row=(await tx.query('INSERT INTO advertisers(id,owner_id,name,inn,details) VALUES ($1,$2,$3,$4,$5) RETURNING *',[id,req.user.id,d.name,d.inn,JSON.stringify(d.details)])).rows[0];await audit(tx,req.user.id,'advertiser.create',id);return row;});
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
        await audit(tx,req.user.id,'material.create',result.at(-1).id);
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
      await audit(tx,req.user.id,'material.edit',id);
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
        await audit(tx,req.user.id,'material.submit',id,{ expedited:d.expedited });
      }
      return { ids:d.ids,status:'pending',fee:d.expedited?d.ids.length*5000:0 };
    });
  });
  app.get('/api/moderation',async req => { role(req.user,'admin'); return (await db.query("SELECT * FROM materials WHERE status='pending' ORDER BY expedited DESC,submitted_at,id LIMIT 200")).rows; });
  app.post('/api/moderation/:id',async req => {
    role(req.user,'admin'); const id=uuid.parse(req.params.id); const d=z.object({approved:z.boolean(),reason:z.string().trim().max(5000).default('')}).strict().parse(req.body);
    if (!d.approved && !d.reason) fail(400,'Reason required');
    return db.transaction(async tx => {
      const result=(await tx.query("UPDATE materials SET status=$2,moderation_reason=$3 WHERE id=$1 AND status='pending' RETURNING *",[id,d.approved?'approved':'rejected',d.reason])).rows[0];
      if (!result) fail(409,'Not pending');
      await audit(tx,req.user.id,'material.moderate',id,d); return result;
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
      const id=randomUUID();await audit(tx,req.user.id,'outlet.create',id);
      return (await tx.query('INSERT INTO outlets(id,owner_id,name,url,kind,geography,details,prices,coefficient_bps,discount_bps,discount_until) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',[id,req.user.id,d.name,d.url,d.kind,d.geography,JSON.stringify(d.details),JSON.stringify(d.prices),d.coefficientBps,d.discountBps,d.discountUntil])).rows[0];
    });
  });
  app.put('/api/outlets/:id',async req => {
    role(req.user,'publisher'); const d=outletInput.parse(req.body); const id=uuid.parse(req.params.id);
    return db.transaction(async tx => {
      await owned(tx,'outlets',id,req.user.id);
      await outletLogo(tx,d,req.user.id);
      await audit(tx,req.user.id,'outlet.edit',id);
      return (await tx.query("UPDATE outlets SET name=$2,url=$3,kind=$4,geography=$5,details=$6,prices=$7,coefficient_bps=$8,discount_bps=$9,discount_until=$10,status='pending',active=false WHERE id=$1 RETURNING *",[id,d.name,d.url,d.kind,d.geography,JSON.stringify(d.details),JSON.stringify(d.prices),d.coefficientBps,d.discountBps,d.discountUntil])).rows[0];
    });
  });
  app.post('/api/outlets/:id/active',async req => {
    role(req.user,'publisher','admin'); const {active}=z.object({active:z.boolean()}).strict().parse(req.body);
    return db.transaction(async tx => {
      const id=uuid.parse(req.params.id); const outlet=req.user.role==='admin'?(await tx.query('SELECT * FROM outlets WHERE id=$1 FOR UPDATE',[id])).rows[0]:await owned(tx,'outlets',id,req.user.id);
      if(!outlet)fail(404,'Not found');
      if (outlet.status!=='approved') fail(409,'Outlet not approved');
      await audit(tx,req.user.id,'outlet.activity',id,{active});
      return (await tx.query('UPDATE outlets SET active=$2 WHERE id=$1 RETURNING *',[id,active])).rows[0];
    });
  });
  app.post('/api/admin/outlets/:id',async req => {
    role(req.user,'admin'); const id=uuid.parse(req.params.id); const {approved}=z.object({approved:z.boolean()}).strict().parse(req.body);
    return db.transaction(async tx => {
      const result=(await tx.query('UPDATE outlets SET status=$2,active=$3 WHERE id=$1 RETURNING *',[id,approved?'approved':'rejected',approved])).rows[0];
      if (!result) fail(404,'Not found'); await audit(tx,req.user.id,'outlet.moderate',id,{approved}); return result;
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
  app.post('/api/orders',async req => {
    role(req.user,'customer'); const d=z.object({
      materialId:uuid,
      outletIds:z.array(uuid).min(1).max(50).optional(),
      placements:z.array(z.object({outletId:uuid,format:z.enum(['article','news','post','longread'])}).strict()).min(1).max(50).optional(),
      expectedAmount:z.number().int().nonnegative().optional(),
      limitConfirmed:z.boolean().default(false),
      autoAccept:z.boolean().default(false),
    }).strict().refine(value=>Boolean(value.outletIds)!==Boolean(value.placements),'Provide either outletIds or placements').refine(value=>{
      const ids=value.placements?.map(item=>item.outletId)??value.outletIds??[];
      return new Set(ids).size===ids.length;
    },'Duplicate outlets are not allowed').parse(req.body);
    return once(db,req,'orders.create',async tx => {
      const material=await owned(tx,'materials',d.materialId,req.user.id);
      if (material.status!=='approved') fail(409,'Material not approved');
      const advertiser=material.advertiser_id ? await owned(tx,'advertisers',material.advertiser_id,req.user.id) : null;
      if (advertiser && advertiser.verification!=='verified') fail(409,'Advertiser verification required');
      const result=[];
      const {order_limit:orderLimit}=(await tx.query('SELECT order_limit FROM users WHERE id=$1 FOR UPDATE',[req.user.id])).rows[0];
      const placements=(d.placements??d.outletIds.map(outletId=>({outletId,format:material.format}))).sort((a,b)=>a.outletId.localeCompare(b.outletId));
      for (const placement of placements) {
        const {outletId,format}=placement;
        const outlet=(await tx.query('SELECT * FROM outlets WHERE id=$1 FOR UPDATE',[outletId])).rows[0];
        if (!outlet?.active || outlet.status!=='approved') fail(409,'Outlet unavailable');
        const amount=quote(outlet,format); const payout=amount-Math.round(amount*commissionBps/10000); const id=randomUUID();
        await transfer(tx,`${req.user.id}:available`,`${req.user.id}:reserved`,amount,`order:${id}:reserve`);
        const snapshot={title:material.title,body:material.body,format,metadata:material.metadata,version:material.version,advertiser:advertiser?{name:advertiser.name,inn:advertiser.inn}:null,outlet:{name:outlet.name,url:outlet.url},commissionBps,autoAccept:d.autoAccept};
        result.push((await tx.query('INSERT INTO orders(id,customer_id,publisher_id,material_id,outlet_id,project_id,snapshot,amount,payout) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[id,req.user.id,outlet.owner_id,material.id,outletId,material.project_id,JSON.stringify(snapshot),amount,payout])).rows[0]);
        await audit(tx,req.user.id,'order.create',id,{amount,payout});
      }
      if (d.expectedAmount !== undefined && result.reduce((sum,o)=>sum+o.amount,0)!==d.expectedAmount) fail(409,'Price changed; review the order total');
      if(d.autoAccept && orderLimit!==null && result.reduce((sum,o)=>sum+o.amount,0)>Number(orderLimit) && !d.limitConfirmed)fail(409,'Сумма превышает лимит автоприемки');
      return result;
    });
  });
  app.get('/api/orders',async req => {
    role(req.user,'customer','publisher','admin');
    return (await db.query("SELECT * FROM orders WHERE $1='admin' OR customer_id=$2 OR publisher_id=$2 ORDER BY created_at DESC LIMIT 200",[req.user.role,req.user.id])).rows;
  });
  app.post('/api/orders/:id/project',async req => {
    role(req.user,'customer'); const id=uuid.parse(req.params.id); const {projectId}=z.object({projectId:uuid.nullable()}).strict().parse(req.body);
    return db.transaction(async tx=>{
      if(projectId) await owned(tx,'projects',projectId,req.user.id);
      const result=(await tx.query('UPDATE orders SET project_id=$3 WHERE id=$1 AND customer_id=$2 RETURNING *',[id,req.user.id,projectId])).rows[0];
      if(!result) fail(404,'Not found'); await audit(tx,req.user.id,'order.project',id,{projectId}); return result;
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
        await audit(tx,req.user.id,'order.resolve',id,{from,status,decision:d.decision,publisherAmount,customerAmount,platformAmount});
        return result;
      }
      if(d.action==='dispute')await tx.query("UPDATE orders SET dispute_number=coalesce(dispute_number,nextval('dispute_number_seq')) WHERE id=$1",[id]);
      if(['rejected','refunded'].includes(to)) await transfer(tx,`${o.customer_id}:reserved`,`${o.customer_id}:available`,o.amount,`order:${id}:refund`);
      if(to==='completed') {
        if(o.payout>0) await transfer(tx,`${o.customer_id}:reserved`,`${o.publisher_id}:available`,o.payout,`order:${id}:payout`);
        if(o.amount>o.payout) await transfer(tx,`${o.customer_id}:reserved`,'platform:revenue',o.amount-o.payout,`order:${id}:commission`);
      }
      const result=(await tx.query('UPDATE orders SET status=$2,publication_url=COALESCE($3,publication_url),marking_confirmed=COALESCE($4,marking_confirmed),reason=COALESCE($5,reason),updated_at=now() WHERE id=$1 RETURNING *',[id,to,d.action==='publish'?d.url:null,d.action==='publish'?true:null,d.reason??null])).rows[0];
      await audit(tx,req.user.id,`order.${d.action}`,id,{from,to}); return result;
    });
  });
  await registerFiles(app,db,storageRoot);
  await registerOperations(app,db);
  registerSettings(app,db);
  registerReports(app,db);
  return app;
}
