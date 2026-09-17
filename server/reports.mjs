import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { audit, once } from './finance.mjs';
import { fail, role } from './security.mjs';
import { uuid } from './validation.mjs';

const reportInput=z.object({projectId:uuid,dateFrom:z.iso.date(),dateTo:z.iso.date()}).strict().refine(v=>v.dateFrom<=v.dateTo,'Invalid report period');
const fontPaths=['/System/Library/Fonts/Supplemental/Arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'];
const reportFont=()=>fontPaths.find(existsSync);
const rubles=value=>`${new Intl.NumberFormat('ru-RU').format(Number(value)/100)} ₽`;
const date=value=>new Date(value).toLocaleDateString('ru-RU');

function pdfBuffer(title,subtitle,rows) {
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margin:48,info:{Title:title,Author:'Аксиома'}});
    const chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
    const font=reportFont();if(font)doc.font(font);
    doc.fontSize(22).fillColor('#0b3558').text(title);
    doc.moveDown(0.35).fontSize(10).fillColor('#476788').text(subtitle);
    doc.moveDown(1.2);
    if(!rows.length) doc.fontSize(12).fillColor('#476788').text('За выбранный период публикаций нет.');
    rows.forEach((row,index)=>{
      if(index)doc.moveDown(0.8).strokeColor('#d4e0ed').moveTo(48,doc.y).lineTo(547,doc.y).stroke().moveDown(0.8);
      doc.fontSize(12).fillColor('#0b3558').text(`Заказ №${row.number} · ${row.material}`,{continued:false});
      doc.moveDown(0.3).fontSize(10).fillColor('#476788').text(`Площадка: ${row.platform}`);
      doc.text(`Дата: ${date(row.updatedAt)} · Стоимость: ${rubles(row.amount)}`);
      doc.text(`Ссылка: ${row.link||'не указана'}`,{link:row.link||undefined,underline:Boolean(row.link)});
    });
    doc.end();
  });
}

function reportRows(rows) {
  return rows.map(row=>({
    id:row.id,number:row.number,projectId:row.project_id,materialId:row.material_id,
    material:row.snapshot.title,platform:row.snapshot.outlet.name,link:row.publication_url,snapshot:row.snapshot,
    status:row.status,amount:Number(row.amount),updatedAt:row.updated_at,
  }));
}

async function ownedOrder(db,id,userId) {
  const order=(await db.query('SELECT * FROM orders WHERE id=$1 AND customer_id=$2',[id,userId])).rows[0];
  if(!order)fail(404,'Not found');return order;
}

export function registerReports(app,db) {
  app.get('/api/reports',async req=>{
    role(req.user,'customer');
    const placements=reportRows((await db.query("SELECT * FROM orders WHERE customer_id=$1 AND publication_url IS NOT NULL ORDER BY updated_at DESC LIMIT 500",[req.user.id])).rows);
    const saved=(await db.query('SELECT * FROM reports WHERE owner_id=$1 ORDER BY created_at DESC LIMIT 200',[req.user.id])).rows;
    return {placements,saved};
  });
  app.post('/api/reports',async req=>{
    role(req.user,'customer');const input=reportInput.parse(req.body);
    return once(db,req,'reports.create',async tx=>{
      const project=(await tx.query('SELECT * FROM projects WHERE id=$1 AND owner_id=$2',[input.projectId,req.user.id])).rows[0];
      if(!project)fail(404,'Project not found');
      const rows=reportRows((await tx.query("SELECT * FROM orders WHERE customer_id=$1 AND project_id=$2 AND publication_url IS NOT NULL AND updated_at::date BETWEEN $3::date AND $4::date ORDER BY updated_at",[req.user.id,input.projectId,input.dateFrom,input.dateTo])).rows);
      const id=randomUUID();
      const snapshot={project:{id:project.id,name:project.name},rows};
      const result=(await tx.query('INSERT INTO reports(id,owner_id,kind,project_id,date_from,date_to,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[id,req.user.id,'project',project.id,input.dateFrom,input.dateTo,JSON.stringify(snapshot)])).rows[0];
      await audit(tx,req.user.id,'report.create',id,{projectId:project.id,dateFrom:input.dateFrom,dateTo:input.dateTo,placements:rows.length});
      return result;
    });
  });
  app.get('/api/reports/export.csv',async(req,reply)=>{
    role(req.user,'customer');
    const rows=reportRows((await db.query("SELECT * FROM orders WHERE customer_id=$1 AND publication_url IS NOT NULL ORDER BY updated_at DESC LIMIT 500",[req.user.id])).rows);
    const escape=value=>`"${String(value??'').replaceAll('"','""')}"`;
    const csv=['Заказ,Материал,Площадка,Дата,Ссылка,Статус,Стоимость',...rows.map(row=>[row.number,row.material,row.platform,date(row.updatedAt),row.link,row.status,Number(row.amount)/100].map(escape).join(','))].join('\n');
    reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition',"attachment; filename*=UTF-8''placements.csv");return `\ufeff${csv}`;
  });
  app.get('/api/orders/:id/report.pdf',async(req,reply)=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);const order=await ownedOrder(db,id,req.user.id);const rows=reportRows([order]);
    const pdf=await pdfBuffer(`Отчет по размещению №${order.number}`,`Сформирован ${date(new Date())}`,rows);
    reply.header('Content-Type','application/pdf').header('Content-Disposition',`attachment; filename="placement-${order.number}.pdf"`);return pdf;
  });
  app.get('/api/reports/:id/pdf',async(req,reply)=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    const report=(await db.query('SELECT * FROM reports WHERE id=$1 AND owner_id=$2',[id,req.user.id])).rows[0];
    if(!report)fail(404,'Not found');
    const pdf=await pdfBuffer(`Отчет по проекту`,`${report.snapshot.project.name} · ${date(report.date_from)}–${date(report.date_to)}`,report.snapshot.rows);
    reply.header('Content-Type','application/pdf').header('Content-Disposition',`attachment; filename="project-report-${report.number}.pdf"`);return pdf;
  });
}
