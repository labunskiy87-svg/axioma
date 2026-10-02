import {createHash,createPublicKey,randomUUID,verify} from 'node:crypto';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import PDFDocument from 'pdfkit';
import {z} from 'zod';
import {audit,once,transfer} from './finance.mjs';
import {fail,role} from './security.mjs';
import {uuid} from './validation.mjs';

const publicKeyUrl='https://enter.tochka.com/doc/openapi/static/keys/public';
const fonts=[
  ['/System/Library/Fonts/Supplemental/Arial.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
];
const displayFont=fileURLToPath(new URL('./assets/fonts/Unbounded-Bold.ttf',import.meta.url));
const invoiceInput=z.object({amount:z.number().int().min(100).max(100000000000),method:z.enum(['transfer','card','sbp'])}).strict();
const rub=value=>`${(Number(value)/100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})} руб.`;
const topupFee=(amount,bps)=>Math.round(Number(amount)*Number(bps)/10000);
const paymentStatus=(invoice,total)=>Number(invoice.refunded_amount)>0
  ? (Number(invoice.refunded_amount)===total-topupFee(total,invoice.commission_bps)?'refunded':'partially_refunded')
  : total<Number(invoice.amount)?'partial':total===Number(invoice.amount)?'paid':'overpaid';
const kopeks=value=>{
  if(typeof value!=='string'&&typeof value!=='number')return null;
  const match=String(value).replace(',','.').match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if(!match)return null;
  const amount=Number(match[1])*100+Number((match[2]??'').padEnd(2,'0'));
  return Number.isSafeInteger(amount)&&amount>0?amount:null;
};
const invoiceView=row=>({id:row.id,number:row.number,amount:Number(row.amount),feeAmount:topupFee(row.amount,row.commission_bps),commissionBps:row.commission_bps,paidAmount:Number(row.paid_amount),refundedAmount:Number(row.refunded_amount),method:row.method,status:row.status,createdAt:row.created_at,paymentUrl:row.payment_url});

export function sellerFromConfig(config) {
  const seller={name:config.name?.trim(),inn:config.inn?.trim(),kpp:config.kpp?.trim()||'',address:config.address?.trim(),bank:config.bank?.trim(),bic:config.bic?.trim(),account:config.account?.trim(),correspondentAccount:config.correspondentAccount?.trim()||''};
  if(!seller.name||!/^\d{10}$/.test(seller.inn??'')||!seller.address||!seller.bank||!/^\d{9}$/.test(seller.bic??'')||!/^\d{20}$/.test(seller.account??''))fail(409,'Реквизиты Аксиомы для выставления счета не настроены');
  return seller;
}
function payerFromSettings(settings) {
  const r=settings?.requisites??{},profile=settings?.profile??{};
  if(settings?.requisites_status!=='verified')fail(409,'Подтвердите реквизиты плательщика в настройках');
  if(r.payerStatus==='Физическое лицо'&&r.taxStatus!=='ИП')fail(409,'Перевод по счету доступен только юридическому лицу или ИП');
  const individual=r.payerStatus==='Физическое лицо';
  const inn=individual?r.personInn:r.inn;
  const name=individual?r.personName:(r.legalName||profile.company);
  if(!name||!/^\d{10}$|^\d{12}$/.test(inn??''))fail(409,'Заполните название и ИНН плательщика');
  return {kind:individual?'entrepreneur':'legal',name,inn,kpp:individual?'':r.kpp||'',address:individual?r.registrationAddress||'':r.legalAddress||'',email:profile.workEmail||''};
}
function findInvoiceNumber(purpose) {
  const match=String(purpose??'').match(/(?:^|\W)АКС-(\d+)(?!\d)/iu);
  return match?Number(match[1]):null;
}
function parseWebhook(jwt,key) {
  if(typeof jwt!=='string'||jwt.length>20000)fail(400,'Invalid webhook');
  const parts=jwt.trim().split('.');
  if(parts.length!==3)fail(400,'Invalid webhook');
  let header,payload;
  try {header=JSON.parse(Buffer.from(parts[0],'base64url').toString());payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());}
  catch {fail(400,'Invalid webhook');}
  if(header.alg!=='RS256'||!verify('RSA-SHA256',Buffer.from(`${parts[0]}.${parts[1]}`),key,Buffer.from(parts[2],'base64url')))fail(401,'Invalid webhook signature');
  return payload;
}
export async function reconcileTopupStatement(db,statement,account) {
  if(statement?.status!=='Ready'||String(statement.accountId)!==String(account)||!Array.isArray(statement.transaction))throw new Error('Tochka statement is not ready or does not match the account');
  let credited=0,reviewed=0,reversed=0;
  for(const item of statement.transaction) {
    const paymentId=String(item.paymentId??'');
    const amount=kopeks(item.amount?.amount);
    if(!paymentId||!amount||item.amount?.currency!=='RUB')continue;
    const number=findInvoiceNumber(item.description);
    const outcome=await db.transaction(async tx=>{
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('topup-payments'))");
      const invoice=number?(await tx.query('SELECT * FROM topup_invoices WHERE number=$1 FOR UPDATE',[number])).rows[0]:null;
      if(String(item.creditDebitIndicator).toLowerCase()==='debit') {
        if(!invoice)return 'ignored';
        if(!/возврат/iu.test(item.description??'')||item.creditorParty?.inn!==invoice.payer.inn)return 'ignored';
        const inserted=await tx.query(`INSERT INTO topup_reversals(id,provider_payment_id,invoice_id,amount)
          VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id`,[randomUUID(),paymentId,invoice.id,amount]);
        if(!inserted.rows.length)return 'ignored';
        const paid=Number(invoice.paid_amount);
        const netTotal=paid-topupFee(paid,invoice.commission_bps);
        const refunded=Number(invoice.refunded_amount);
        if(amount>netTotal-refunded)fail(409,'Возврат больше зачисленного остатка');
        const available=Number((await tx.query('SELECT balance FROM accounts WHERE id=$1 FOR UPDATE',[`${invoice.owner_id}:available`])).rows[0].balance);
        const charge=Math.min(available,amount);
        if(charge)await transfer(tx,`${invoice.owner_id}:available`,'external:clearing',charge,`topup-reversal:${paymentId}`);
        const deficit=amount-charge;
        if(deficit)await tx.query(`INSERT INTO topup_account_holds(owner_id,amount,reason) VALUES($1,$2,$3)
          ON CONFLICT(owner_id) DO UPDATE SET amount=topup_account_holds.amount+excluded.amount,reason=excluded.reason`,[invoice.owner_id,deficit,`Возврат по счету АКС-${number}`]);
        const returned=refunded+amount;
        await tx.query('UPDATE topup_invoices SET refunded_amount=$2,status=$3 WHERE id=$1',[invoice.id,returned,returned===netTotal?'refunded':'partially_refunded']);
        await audit(tx,null,'topup.payment.reverse',inserted.rows[0].id,{paymentId,invoiceId:invoice.id,amount,deficit});
        return 'reversed';
      }
      if(String(item.creditDebitIndicator).toLowerCase()!=='credit')return 'ignored';
      const existing=(await tx.query('SELECT * FROM topup_payments WHERE provider=$1 AND provider_payment_id=$2 FOR UPDATE',['tochka',paymentId])).rows[0];
      if(existing?.status==='credited')return 'ignored';
      const payer=item.debtorParty??{};
      const matched=invoice?.method==='transfer'&&payer.inn===invoice.payer.inn&&item.creditorAccount?.identification===invoice.seller.account;
      const consistent=existing?.reason!=='Вебхук и выписка расходятся'&&(!existing||(Number(existing.amount)===amount&&String(existing.payer?.inn??'')===String(payer.inn??'')));
      const reason=!invoice?'Счет не найден':!matched?'Плательщик или счет получателя не совпадает':!consistent?'Вебхук и выписка расходятся':'';
      const id=existing?.id??randomUUID();
      if(existing)await tx.query('UPDATE topup_payments SET status=$2,reason=$3,provider_data=$4,amount=$5,payer=$6,invoice_id=$7,updated_at=now() WHERE id=$1',[id,matched&&consistent?'credited':'review',reason,JSON.stringify(item),amount,JSON.stringify(payer),invoice?.id??null]);
      else await tx.query(`INSERT INTO topup_payments(id,provider_payment_id,invoice_id,amount,payer,status,reason,provider_data)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,paymentId,invoice?.id??null,amount,JSON.stringify(payer),matched?'credited':'review',reason,JSON.stringify(item)]);
      if(!matched||!consistent){await audit(tx,null,'topup.payment.review',id,{paymentId,reason});return 'reviewed';}
      const total=Number(invoice.paid_amount)+amount;
      const fee=topupFee(total,invoice.commission_bps)-topupFee(Number(invoice.paid_amount),invoice.commission_bps);
      if(fee)await transfer(tx,'external:clearing','platform:revenue',fee,`topup-fee:${paymentId}`);
      if(amount>fee)await transfer(tx,'external:clearing',`${invoice.owner_id}:available`,amount-fee,`topup:${paymentId}`);
      await tx.query('UPDATE topup_invoices SET paid_amount=$2,status=$3 WHERE id=$1',[invoice.id,total,paymentStatus(invoice,total)]);
      await audit(tx,null,'topup.payment.credit',id,{paymentId,invoiceId:invoice.id,amount});
      return 'credited';
    });
    if(outcome==='credited')credited++;
    if(outcome==='reviewed')reviewed++;
    if(outcome==='reversed')reversed++;
  }
  return {credited,reviewed,reversed};
}
function pdf(invoice) {
  const family=fonts.find(([regular,bold])=>existsSync(regular)&&existsSync(bold));
  if(!family)throw new Error('PDF fonts are unavailable');
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margin:48,info:{Title:`Счет АКС-${invoice.number}`,Author:'Аксиома'}});
    const parts=[];doc.on('data',part=>parts.push(part));doc.on('end',()=>resolve(Buffer.concat(parts)));doc.on('error',reject);
    doc.registerFont('Regular',family[0]);doc.registerFont('Bold',family[1]);doc.registerFont('Display',displayFont);
    const label=(name,value)=>{doc.font('Regular').fontSize(9).fillColor('#476788').text(name,48,doc.y,{continued:true});doc.font('Bold').fillColor('#0b3558').text(`  ${value}`);doc.moveDown(.55);};
    doc.font('Display').fontSize(14).fillColor('#006bff').text('АКСИОМА');doc.moveDown(1.4);
    doc.font('Display').fontSize(16).fillColor('#0b3558').text(`Счет на оплату № АКС-${invoice.number}`);
    doc.moveDown(.4);doc.font('Regular').fontSize(10).text(`от ${new Date(invoice.created_at).toLocaleDateString('ru-RU')}`);
    doc.moveDown(1.4);doc.moveTo(48,doc.y).lineTo(547,doc.y).strokeColor('#d4e0ed').stroke();doc.moveDown(1);
    label('Поставщик:',invoice.seller.name);label('ИНН / КПП:',`${invoice.seller.inn}${invoice.seller.kpp?` / ${invoice.seller.kpp}`:''}`);label('Адрес:',invoice.seller.address);
    label('Покупатель:',invoice.payer.name);label('ИНН / КПП:',`${invoice.payer.inn}${invoice.payer.kpp?` / ${invoice.payer.kpp}`:''}`);
    doc.moveDown(.8);label('Банк:',invoice.seller.bank);label('БИК:',invoice.seller.bic);label('Расчетный счет:',invoice.seller.account);
    if(invoice.seller.correspondentAccount)label('Корреспондентский счет:',invoice.seller.correspondentAccount);
    doc.moveDown(1);label('Назначение платежа:',`Оплата информационных услуг платформы по счету АКС-${invoice.number}, без НДС`);
    doc.moveDown(1.1);doc.moveTo(48,doc.y).lineTo(547,doc.y).strokeColor('#d4e0ed').stroke();doc.moveDown(.8);
    label(`Информационные услуги платформы (${Number(invoice.commission_bps)/100}%):`,rub(topupFee(invoice.amount,invoice.commission_bps)));
    label('Аванс на размещение материалов:',rub(Number(invoice.amount)-topupFee(invoice.amount,invoice.commission_bps)));
    label('НДС:','Без НДС');label('Итого к оплате:',rub(invoice.amount));
    doc.moveDown(2);doc.font('Regular').fontSize(9).fillColor('#476788').text('При частичной оплате комиссия рассчитывается по фактически поступившей сумме. Оплата информационных услуг платформы не возвращается; возврат возможен только в пределах зачисленного остатка.');
    doc.end();
  });
}

export function registerTopups(app,db,{sellerConfig={},tochkaConfig={},fetchImpl=globalThis.fetch}={}) {
  let keyCache=null,keyExpires=0;
  let syncing=false;
  async function bankRequest(path,options={}) {
    const base=tochkaConfig.apiUrl??'https://enter.tochka.com/uapi';
    if(!base.startsWith('https://'))throw new Error('Tochka API requires HTTPS');
    const response=await fetchImpl(`${base}${path}`,{...options,headers:{Authorization:`Bearer ${tochkaConfig.apiToken}`,...(options.body?{'Content-Type':'application/json'}:{})},signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error(`Tochka API returned ${response.status}`);
    return response.json();
  }
  async function synchronize() {
    if(syncing||!tochkaConfig.apiToken||!tochkaConfig.accountId)return;
    syncing=true;
    try {
      const now=new Date();
      const state=(await db.query('SELECT last_success_at FROM topup_sync_state WHERE id=true')).rows[0];
      const last=state?.last_success_at?new Date(state.last_success_at).getTime():now.getTime()-30*86400000;
      const from=new Date(Math.max(last-86400000,now.getTime()-30*86400000));
      const initiated=await bankRequest('/open-banking/v1.0/statements',{method:'POST',body:JSON.stringify({Data:{Statement:{AccountId:tochkaConfig.accountId,FromBookingDateTime:from.toISOString(),ToBookingDateTime:now.toISOString()}}})});
      const id=initiated?.Data?.Statement?.statementId;
      if(!id)throw new Error('Tochka did not return statementId');
      for(let attempt=0;attempt<4;attempt++) {
        const response=await bankRequest(`/open-banking/v1.0/accounts/${encodeURIComponent(tochkaConfig.accountId)}/statements/${encodeURIComponent(id)}`);
        const statement=Array.isArray(response?.Data?.Statement)?response.Data.Statement[0]:response?.Data?.Statement;
        if(statement?.status==='Ready') {
          await reconcileTopupStatement(db,statement,tochkaConfig.accountId);
          await db.query('UPDATE topup_sync_state SET last_success_at=$1 WHERE id=true',[now]);
          return;
        }
        if(attempt<3)await new Promise(resolve=>setTimeout(resolve,3000));
      }
    } catch(error) {app.log.error({err:error},'Tochka statement reconciliation failed');}
    finally {syncing=false;}
  }
  if(tochkaConfig.apiToken&&tochkaConfig.accountId) {
    const timer=setInterval(synchronize,10*60*1000);
    timer.unref();
    app.addHook('onReady',()=>{void synchronize();});
    app.addHook('onClose',()=>clearInterval(timer));
  }
  async function webhookKey() {
    if(tochkaConfig.webhookPublicKey)return createPublicKey(tochkaConfig.webhookPublicKey.trim().startsWith('{')?{key:JSON.parse(tochkaConfig.webhookPublicKey),format:'jwk'}:tochkaConfig.webhookPublicKey);
    if(keyCache&&Date.now()<keyExpires)return keyCache;
    const response=await fetchImpl(publicKeyUrl,{signal:AbortSignal.timeout(5000)});
    if(!response.ok)fail(503,'Ключ Точки недоступен');
    const jwk=await response.json();keyCache=createPublicKey({key:jwk,format:'jwk'});keyExpires=Date.now()+3600000;
    return keyCache;
  }
  app.get('/api/topups',async req=>{
    role(req.user,'customer');
    return (await db.query('SELECT * FROM topup_invoices WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user.id])).rows.map(invoiceView);
  });
  app.post('/api/topups',async req=>{
    role(req.user,'customer');const data=invoiceInput.parse(req.body);
    if(data.method!=='transfer')fail(409,'Оплата картой и СБП откроется после подключения фискализации');
    const seller=sellerFromConfig(sellerConfig);
    return once(db,req,'topup.create',async tx=>{
      const settings=(await tx.query('SELECT profile,requisites,requisites_status FROM account_settings WHERE user_id=$1',[req.user.id])).rows[0];
      const payer=payerFromSettings(settings);
      const commission=(await tx.query('SELECT personal_commission_bps FROM users WHERE id=$1',[req.user.id])).rows[0];
      const id=randomUUID();
      const row=(await tx.query(`INSERT INTO topup_invoices(id,owner_id,amount,method,payer,seller,commission_bps)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[id,req.user.id,data.amount,data.method,JSON.stringify(payer),JSON.stringify(seller),commission.personal_commission_bps??1500])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'topup.invoice.create',id,{number:row.number,amount:data.amount});
      return invoiceView(row);
    });
  });
  app.get('/api/topups/:id/invoice.pdf',async(req,reply)=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    const row=(await db.query('SELECT * FROM topup_invoices WHERE id=$1 AND owner_id=$2',[id,req.user.id])).rows[0];
    if(!row)fail(404,'Счет не найден');
    reply.header('Content-Type','application/pdf').header('Content-Disposition',`attachment; filename="invoice-AKS-${row.number}.pdf"`);
    return reply.send(await pdf(row));
  });
  app.get('/api/admin/topups/review',async req=>{
    role(req.user,'admin');
    return (await db.query(`SELECT p.*,i.number AS invoice_number,u.email AS owner_email FROM topup_payments p
      LEFT JOIN topup_invoices i ON i.id=p.invoice_id LEFT JOIN users u ON u.id=i.owner_id
      WHERE p.status='review' ORDER BY p.created_at DESC LIMIT 200`)).rows;
  });
  app.get('/api/admin/topups/invoices',async req=>{
    role(req.user,'admin');
    return (await db.query(`SELECT i.id,i.number,i.amount,i.paid_amount,i.status,i.payer,u.email AS owner_email FROM topup_invoices i JOIN users u ON u.id=i.owner_id WHERE i.method='transfer' ORDER BY i.created_at DESC LIMIT 500`)).rows;
  });
  app.get('/api/admin/topups/holds',async req=>{
    role(req.user,'admin');
    return (await db.query('SELECT h.*,u.email FROM topup_account_holds h JOIN users u ON u.id=h.owner_id ORDER BY h.created_at DESC')).rows;
  });
  app.post('/api/admin/topups/review/:id/assign',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const {invoiceId,reason}=z.object({invoiceId:uuid,reason:z.string().trim().min(10).max(1000)}).strict().parse(req.body);
    return db.transaction(async tx=>{
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('topup-payments'))");
      const payment=(await tx.query('SELECT * FROM topup_payments WHERE id=$1 AND status=$2 FOR UPDATE',[id,'review'])).rows[0];
      if(!payment)fail(404,'Платеж на сверке не найден');
      if(payment.provider_data?.creditDebitIndicator!=='Credit')fail(409,'Ожидается финальная выписка банка');
      if(payment.provider_data.amount?.currency!=='RUB'||kopeks(payment.provider_data.amount?.amount)!==Number(payment.amount))fail(409,'Сумма платежа не подтверждена выпиской');
      const invoice=(await tx.query('SELECT * FROM topup_invoices WHERE id=$1 FOR UPDATE',[invoiceId])).rows[0];
      if(!invoice||invoice.method!=='transfer')fail(404,'Счет не найден');
      const total=Number(invoice.paid_amount)+Number(payment.amount);
      const fee=topupFee(total,invoice.commission_bps)-topupFee(Number(invoice.paid_amount),invoice.commission_bps);
      if(fee)await transfer(tx,'external:clearing','platform:revenue',fee,`topup-fee:${payment.provider_payment_id}`);
      if(Number(payment.amount)>fee)await transfer(tx,'external:clearing',`${invoice.owner_id}:available`,Number(payment.amount)-fee,`topup:${payment.provider_payment_id}`);
      await tx.query('UPDATE topup_invoices SET paid_amount=$2,status=$3 WHERE id=$1',[invoice.id,total,paymentStatus(invoice,total)]);
      await tx.query("UPDATE topup_payments SET invoice_id=$2,status='credited',reason=$3,updated_at=now() WHERE id=$1",[id,invoice.id,reason]);
      await audit(tx,req.user.actorId??req.user.id,'topup.payment.assign',id,{invoiceId,reason});
      return {ok:true};
    });
  });
  app.post('/api/admin/topups/holds/:ownerId/settle',async req=>{
    role(req.user,'admin');const ownerId=uuid.parse(req.params.ownerId);
    const {amount,reason}=z.object({amount:z.number().int().positive(),reason:z.string().trim().min(10).max(1000)}).strict().parse(req.body);
    return once(db,req,'topup.debt.settle',async tx=>{
      const hold=(await tx.query('SELECT * FROM topup_account_holds WHERE owner_id=$1 FOR UPDATE',[ownerId])).rows[0];
      if(!hold||amount>Number(hold.amount))fail(409,'Задолженность не найдена или сумма превышена');
      await transfer(tx,`${ownerId}:available`,'external:clearing',amount,`topup-debt:${ownerId}:${randomUUID()}`);
      if(amount===Number(hold.amount))await tx.query('DELETE FROM topup_account_holds WHERE owner_id=$1',[ownerId]);
      else await tx.query('UPDATE topup_account_holds SET amount=amount-$2 WHERE owner_id=$1',[ownerId,amount]);
      await audit(tx,req.user.actorId??req.user.id,'topup.debt.settle',ownerId,{amount,reason});
      return {ok:true};
    });
  });
  app.post('/api/webhooks/tochka',async req=>{
    if(!tochkaConfig.customerCode||!tochkaConfig.accountId)fail(503,'Интеграция Точки не настроена');
    const token=typeof req.body==='string'?req.body:'';
    const event=parseWebhook(token,await webhookKey());
    if(event.webhookType!=='incomingPayment')return {ok:true};
    if(event.customerCode!==tochkaConfig.customerCode)fail(401,'Неверный клиент Точки');
    if(event.SideRecipient?.account!==sellerConfig.account)fail(401,'Неверный счет получателя');
    const paymentId=String(event.paymentId??'');const amount=kopeks(event.SidePayer?.amount);
    if(!paymentId||paymentId.length>200||!amount)fail(400,'Платеж Точки не распознан');
    const hash=createHash('sha256').update(token).digest('hex');
    await db.transaction(async tx=>{
      await tx.query("SELECT pg_advisory_xact_lock(hashtext('topup-payments'))");
      const seen=await tx.query('INSERT INTO topup_webhook_events(hash,event_type,provider_payment_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING hash',[hash,event.webhookType,paymentId]);
      if(!seen.rows.length)return;
      const existing=(await tx.query('SELECT id FROM topup_payments WHERE provider=$1 AND provider_payment_id=$2 FOR UPDATE',['tochka',paymentId])).rows[0];
      if(existing)return;
      const number=findInvoiceNumber(event.purpose);
      const invoice=number?(await tx.query('SELECT * FROM topup_invoices WHERE number=$1 FOR UPDATE',[number])).rows[0]:null;
      const payerInn=String(event.SidePayer?.inn??'');
      const matched=invoice?.method==='transfer'&&payerInn===invoice.payer.inn;
      const id=randomUUID();
      const reason=!invoice?'Счет не найден':!matched?'Плательщик не совпадает со счетом':'';
      await tx.query(`INSERT INTO topup_payments(id,provider_payment_id,invoice_id,amount,payer,status,reason,provider_data)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,paymentId,invoice?.id??null,amount,JSON.stringify(event.SidePayer??{}),matched?'pending':'review',reason,JSON.stringify(event)]);
      await audit(tx,null,matched?'topup.payment.pending':'topup.payment.review',id,{paymentId,invoiceId:invoice?.id??null,amount,reason});
    });
    return {ok:true};
  });
}
