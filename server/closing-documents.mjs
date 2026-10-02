import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import PDFDocument from 'pdfkit';
import {z} from 'zod';
import {audit,once} from './finance.mjs';
import {fail,role} from './security.mjs';
import {sellerFromConfig} from './topups.mjs';
import {uuid} from './validation.mjs';

const displayFont=fileURLToPath(new URL('./assets/fonts/Unbounded-Bold.ttf',import.meta.url));
const fonts=[
  ['/System/Library/Fonts/Supplemental/Arial.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
];
const rub=value=>`${new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value)/100)} руб.`;
const date=value=>new Date(value).toLocaleDateString('ru-RU');
const csvCell=value=>{
  const data=String(value??'');
  return `"${(/^[\s]*[=+\-@]/u.test(data)?`'${data}`:data).replaceAll('"','""')}"`;
};
const effectiveAmount=order=>Number(order.amount)-Number(order.snapshot?.disputeResolution?.customerAmount??0);
const recipient=settings=>{
  if(settings?.requisites_status!=='verified')fail(409,'Подтвердите реквизиты заказчика в настройках');
  const r=settings.requisites??{},p=settings.profile??{};
  const individual=r.payerStatus==='Физическое лицо';
  const name=individual?r.personName:r.legalName||p.company;
  const inn=individual?r.personInn:r.inn;
  if(!name?.trim()||!/^\d{10}$|^\d{12}$/.test(inn??''))fail(409,'Заполните название и ИНН заказчика');
  return {name:name.trim(),inn,kpp:individual?'':r.kpp||'',address:individual?r.registrationAddress||'':r.legalAddress||''};
};

export function renderClosingDocument(document) {
  const family=fonts.find(([regular,bold])=>existsSync(regular)&&existsSync(bold));
  if(!family)throw new Error('PDF fonts are unavailable');
  return new Promise((resolve,reject)=>{
    const pdf=new PDFDocument({size:'A4',margin:48,info:{Title:`Проект акта АКС-${document.number}`,Author:'Аксиома'}});
    const chunks=[];pdf.on('data',part=>chunks.push(part));pdf.on('end',()=>resolve(Buffer.concat(chunks)));pdf.on('error',reject);
    pdf.registerFont('Regular',family[0]).registerFont('Bold',family[1]).registerFont('Display',displayFont);
    const data=document.snapshot;
    const row=(label,value)=>{
      pdf.font('Regular').fontSize(9).fillColor('#476788').text(label,48,pdf.y,{width:140,continued:false});
      const y=pdf.y-11;
      pdf.font('Bold').fontSize(10).fillColor('#0b3558').text(String(value||'—'),188,y,{width:359});
      pdf.moveDown(.45);
    };
    pdf.font('Display').fontSize(13).fillColor('#006bff').text('АКСИОМА');
    pdf.moveDown(1.4);
    pdf.font('Display').fontSize(17).fillColor('#0b3558').text(`Проект акта № АКС-${document.number}`,48,pdf.y,{width:499,lineGap:4});
    pdf.moveDown(.5);pdf.font('Regular').fontSize(9).fillColor('#476788').text(`Сформирован ${date(document.created_at)}. Для передачи в качестве закрывающего документа требуется подписание.`);
    pdf.moveDown(1.2);pdf.moveTo(48,pdf.y).lineTo(547,pdf.y).strokeColor('#d4e0ed').stroke();pdf.moveDown(1);
    row('Исполнитель',data.seller.name);
    row('ИНН / КПП',`${data.seller.inn}${data.seller.kpp?` / ${data.seller.kpp}`:''}`);
    row('Адрес',data.seller.address);
    row('Заказчик',data.customer.name);
    row('ИНН / КПП',`${data.customer.inn}${data.customer.kpp?` / ${data.customer.kpp}`:''}`);
    row('Адрес',data.customer.address);
    pdf.moveDown(1.1);
    pdf.font('Bold').fontSize(11).fillColor('#0b3558').text('Оказанные услуги');pdf.moveDown(.5);
    row('Основание',`Заказ №${data.order.number}`);
    row('Услуга',`Размещение материала «${data.order.title}» на площадке ${data.order.outlet}`);
    row('Дата завершения',date(data.order.completedAt));
    row('Количество','1 размещение');
    row('Стоимость',rub(document.amount));
    if(data.order.publicationUrl) {
      pdf.moveDown(.5);pdf.font('Regular').fontSize(9).fillColor('#476788').text('Ссылка на публикацию:');
      pdf.font('Regular').fontSize(9).fillColor('#006bff').text(data.order.publicationUrl,{link:data.order.publicationUrl,underline:true});
    }
    pdf.moveDown(1.3);pdf.moveTo(48,pdf.y).lineTo(547,pdf.y).strokeColor('#d4e0ed').stroke();pdf.moveDown(.8);
    pdf.font('Bold').fontSize(11).fillColor('#0b3558').text(`Итого: ${rub(document.amount)}`);
    pdf.moveDown(2);pdf.font('Regular').fontSize(9).fillColor('#476788').text('Исполнитель ____________________          Заказчик ____________________');
    pdf.moveDown(.8);pdf.text('Проект документа. Подписи сторон и подтверждение в ЭДО отсутствуют.');
    pdf.end();
  });
}

export function registerClosingDocuments(app,db,{sellerConfig={},storageRoot='./.local-files'}={}) {
  const actInput=z.object({customerId:uuid,number:z.string().trim().min(1).max(100),issuedOn:z.iso.date(),dateFrom:z.iso.date(),dateTo:z.iso.date(),orderIds:z.array(uuid).min(1).max(500),amount:z.number().int().positive(),fileId:uuid}).strict();
  const actRows=async(ownerId=null)=>{
    const rows=(await db.query(`SELECT a.*,u.email AS customer_email,f.name AS file_name,
      coalesce(jsonb_agg(jsonb_build_object('id',o.id,'number',o.number,'title',o.snapshot->>'title','outlet',o.snapshot->'outlet'->>'name','amount',ao.amount) ORDER BY o.number) FILTER (WHERE o.id IS NOT NULL),'[]'::jsonb) AS orders
      FROM period_acts a JOIN users u ON u.id=a.customer_id JOIN files f ON f.id=a.file_id
      LEFT JOIN period_act_orders ao ON ao.act_id=a.id LEFT JOIN orders o ON o.id=ao.order_id
      WHERE ($1::uuid IS NULL OR a.customer_id=$1)
      GROUP BY a.id,u.email,f.name ORDER BY a.issued_on DESC,a.created_at DESC`,[ownerId])).rows;
    return rows;
  };
  app.get('/api/acts',async req=>{role(req.user,'customer','admin');return actRows(req.user.role==='admin'?null:req.user.id);});
  app.post('/api/admin/acts',async req=>{
    role(req.user,'admin');const data=actInput.parse(req.body);
    if(data.dateFrom>data.dateTo)fail(400,'Период указан неверно');
    if(new Set(data.orderIds).size!==data.orderIds.length)fail(400,'Повторяющиеся заказы');
    return once(db,req,'period-act.create',async tx=>{
      const file=(await tx.query('SELECT id FROM files WHERE id=$1 AND owner_id=$2 AND mime=$3',[data.fileId,req.user.actorId??req.user.id,'application/pdf'])).rows[0];
      if(!file)fail(404,'PDF не найден');
      const orders=(await tx.query(`SELECT id,amount,snapshot,status,customer_id,updated_at FROM orders WHERE id=ANY($1::uuid[]) FOR UPDATE`,[data.orderIds])).rows;
      if(orders.length!==data.orderIds.length||orders.some(order=>order.customer_id!==data.customerId||order.status!=='completed'))fail(409,'Выберите завершённые заказы одного заказчика');
      if(orders.some(order=>{const day=new Date(order.updated_at).toISOString().slice(0,10);return day<data.dateFrom||day>data.dateTo;}))fail(409,'Дата завершения заказа вне периода акта');
      const total=orders.reduce((sum,order)=>sum+effectiveAmount(order),0);
      if(total!==data.amount)fail(409,'Сумма акта не совпадает с завершёнными заказами');
      const id=randomUUID();
      const act=(await tx.query(`INSERT INTO period_acts(id,customer_id,number,issued_on,date_from,date_to,amount,file_id,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,[id,data.customerId,data.number,data.issuedOn,data.dateFrom,data.dateTo,total,data.fileId,req.user.actorId??req.user.id])).rows[0];
      for(const order of orders)await tx.query('INSERT INTO period_act_orders(act_id,order_id,amount) VALUES($1,$2,$3)',[id,order.id,effectiveAmount(order)]);
      await tx.query('INSERT INTO period_act_versions(act_id,revision,file_id,uploaded_by) VALUES($1,1,$2,$3)',[id,data.fileId,req.user.actorId??req.user.id]);
      await audit(tx,req.user.actorId??req.user.id,'act.import',id,{number:data.number,amount:total,orderIds:data.orderIds});
      return act;
    });
  });
  app.post('/api/admin/acts/:id/versions',async req=>{
    role(req.user,'admin');const id=uuid.parse(req.params.id);
    const {fileId,reason}=z.object({fileId:uuid,reason:z.string().trim().min(10).max(2000)}).strict().parse(req.body);
    return once(db,req,`period-act:${id}:replace`,async tx=>{
      const act=(await tx.query('SELECT * FROM period_acts WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if(!act)fail(404,'Акт не найден');
      const file=(await tx.query('SELECT id FROM files WHERE id=$1 AND owner_id=$2 AND mime=$3',[fileId,req.user.actorId??req.user.id,'application/pdf'])).rows[0];
      if(!file)fail(404,'PDF не найден');
      const revision=act.revision+1;
      await tx.query('UPDATE period_acts SET revision=$2,file_id=$3,updated_at=now() WHERE id=$1',[id,revision,fileId]);
      await tx.query('INSERT INTO period_act_versions(act_id,revision,file_id,uploaded_by,reason) VALUES($1,$2,$3,$4,$5)',[id,revision,fileId,req.user.actorId??req.user.id,reason]);
      await audit(tx,req.user.actorId??req.user.id,'act.replace',id,{revision,reason});
      return {id,revision};
    });
  });
  app.get('/api/acts/:id/pdf',async(req,reply)=>{
    role(req.user,'customer','admin');const id=uuid.parse(req.params.id);
    const act=(await db.query('SELECT id,number,file_id FROM period_acts WHERE id=$1 AND ($2::boolean OR customer_id=$3)',[id,req.user.role==='admin',req.user.id])).rows[0];
    if(!act)fail(404,'Акт не найден');
    reply.header('Content-Disposition',`attachment; filename="act-${encodeURIComponent(act.number)}.pdf"`);
    reply.header('Content-Security-Policy',"sandbox; default-src 'none'");
    return reply.type('application/pdf').send(await readFile(join(resolve(storageRoot),act.file_id)));
  });
  const list=owner=>db.query(`SELECT o.id AS order_id,o.number AS order_number,o.amount,o.updated_at,o.snapshot,o.project_id,p.name AS project_name,
    d.id,d.number,d.status,d.created_at,d.amount AS document_amount
    FROM orders o LEFT JOIN closing_documents d ON d.order_id=o.id
    LEFT JOIN projects p ON p.id=o.project_id AND p.owner_id=o.customer_id
    WHERE o.customer_id=$1 AND o.status='completed'
    ORDER BY o.updated_at DESC,o.id`,[owner]);
  app.get('/api/closing-documents',async req=>{
    role(req.user,'customer');
    return (await list(req.user.id)).rows.map(row=>({
      id:row.id,number:row.number,orderId:row.order_id,orderNumber:row.order_number,
      projectId:row.project_id,projectName:row.project_name,outlet:row.snapshot.outlet?.name,title:row.snapshot.title,
      amount:Number(row.document_amount??effectiveAmount(row)),status:row.status??'not_issued',
      date:row.created_at??row.updated_at,
    }));
  });
  app.post('/api/closing-documents/:orderId',async req=>{
    role(req.user,'customer');const orderId=uuid.parse(req.params.orderId);
    return once(db,req,`closing-document:${orderId}`,async tx=>{
      const order=(await tx.query("SELECT * FROM orders WHERE id=$1 AND customer_id=$2 AND status='completed' FOR UPDATE",[orderId,req.user.id])).rows[0];
      if(!order)fail(404,'Завершенный заказ не найден');
      const existing=(await tx.query('SELECT * FROM closing_documents WHERE order_id=$1',[orderId])).rows[0];
      if(existing)return {id:existing.id,number:existing.number,status:existing.status};
      const seller=sellerFromConfig(sellerConfig);
      const settings=(await tx.query('SELECT profile,requisites,requisites_status FROM account_settings WHERE user_id=$1',[req.user.id])).rows[0];
      const customer=recipient(settings);
      const amount=effectiveAmount(order);
      if(amount<=0)fail(409,'По этому заказу нет оказанных услуг для акта');
      const snapshot={seller,customer,order:{number:order.number,title:order.snapshot.title,outlet:order.snapshot.outlet?.name,publicationUrl:order.publication_url,completedAt:order.updated_at}};
      const id=randomUUID();
      const row=(await tx.query('INSERT INTO closing_documents(id,order_id,customer_id,amount,snapshot) VALUES($1,$2,$3,$4,$5) RETURNING id,number,status',[id,orderId,req.user.id,amount,JSON.stringify(snapshot)])).rows[0];
      await audit(tx,req.user.actorId??req.user.id,'closing-document.create',id,{orderId,number:row.number,amount});
      return row;
    });
  });
  app.get('/api/closing-documents/:id/pdf',async(req,reply)=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    const document=(await db.query('SELECT * FROM closing_documents WHERE id=$1 AND customer_id=$2',[id,req.user.id])).rows[0];
    if(!document)fail(404,'Документ не найден');
    reply.header('Content-Type','application/pdf').header('Content-Disposition',`attachment; filename="act-draft-AKS-${document.number}.pdf"`);
    return reply.send(await renderClosingDocument(document));
  });
  app.get('/api/closing-documents/export.csv',async(req,reply)=>{
    role(req.user,'customer');
    const rows=(await list(req.user.id)).rows;
    const csv=['Заказ,Проект,Материал,Площадка,Дата завершения,Стоимость услуг (руб.),Номер акта,Статус акта',...rows.map(row=>[
      row.order_number,row.project_name??'',row.snapshot.title,row.snapshot.outlet?.name,date(row.updated_at),effectiveAmount(row)/100,
      row.number?`АКС-${row.number}`:'',row.status==='draft'?'Проект':'Не сформирован',
    ].map(csvCell).join(','))].join('\n');
    reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition',"attachment; filename*=UTF-8''closing-documents.csv");
    return `\ufeff${csv}`;
  });
}
