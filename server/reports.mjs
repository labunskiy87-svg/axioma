import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { audit, once } from './finance.mjs';
import { fail, role } from './security.mjs';
import { uuid } from './validation.mjs';

const reportInput=z.object({projectId:uuid,dateFrom:z.iso.date(),dateTo:z.iso.date()}).strict().refine(v=>v.dateFrom<=v.dateTo,'Invalid report period');
const reportExportQuery=z.object({projectId:uuid.optional(),dateFrom:z.iso.date().optional(),dateTo:z.iso.date().optional()}).strict().refine(v=>!v.dateFrom||!v.dateTo||v.dateFrom<=v.dateTo,'Invalid report period');
const fontFamilies=[
  {regular:'/System/Library/Fonts/Supplemental/Arial.ttf',bold:'/System/Library/Fonts/Supplemental/Arial Bold.ttf'},
  {regular:'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',bold:'/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'},
];
const displayFont=fileURLToPath(new URL('./assets/fonts/Unbounded.ttf',import.meta.url));
const displayBoldFont=fileURLToPath(new URL('./assets/fonts/Unbounded-Bold.ttf',import.meta.url));
const reportFonts=()=>fontFamilies.find(family=>existsSync(family.regular)&&existsSync(family.bold));
const rubles=value=>`${new Intl.NumberFormat('ru-RU').format(Number(value)/100)} руб.`;
const date=value=>new Date(value).toLocaleDateString('ru-RU');
const reportStatus={pending:'Рассматривается площадкой',accepted:'Ожидает публикации',submitted:'Ожидает приемки',completed:'Завершено',rejected:'Отклонено',disputed:'Открыт спор',refunded:'Возврат'};
const reportFormat={article:'Статья',news:'Новость',post:'Пост',longread:'Лонгрид'};
const plainText=value=>sanitizeHtml(String(value??''),{allowedTags:[],allowedAttributes:{}}).replace(/\r/g,'').replace(/\n{3,}/g,'\n\n').trim();
const colors={navy:'#0b3558',blue:'#006bff',muted:'#476788',line:'#d4e0ed',soft:'#f3f7fd',white:'#ffffff',green:'#16834d'};

function useFont(doc,weight='regular') {
  doc.font(weight==='bold'?'ReportBold':'ReportRegular');
  return doc;
}

function useDisplayFont(doc,weight='regular') {
  doc.font(weight==='bold'?'ReportDisplayBold':'ReportDisplay');
  return doc;
}

function runningHeader(doc) {
  const {width}=doc.page;
  useDisplayFont(doc,'bold').fontSize(8).fillColor(colors.navy).text('АКСИОМА',48,24,{lineBreak:false});
  doc.moveTo(48,46).lineTo(width-48,46).strokeColor(colors.line).lineWidth(1).stroke();
  doc.x=48;
  doc.y=62;
}

function coverHeader(doc,title,subtitle) {
  const {width}=doc.page;
  useDisplayFont(doc,'bold').fontSize(10).fillColor(colors.blue).text('АКСИОМА',48,32,{characterSpacing:1.2,width:width-96});
  useDisplayFont(doc).fontSize(22).fillColor(colors.navy).text(title,48,60,{width:width-96,lineGap:2});
  useFont(doc).fontSize(10).fillColor(colors.muted).text(subtitle,48,104,{width:width-96});
  doc.moveTo(48,132).lineTo(width-48,132).strokeColor(colors.blue).lineWidth(2).stroke();
  doc.x=48;
  doc.y=158;
}

function ensureSpace(doc,height) {
  if(doc.y+height>doc.page.height-70)doc.addPage();
}

function sectionTitle(doc,title,description='') {
  ensureSpace(doc,description?58:38);
  useFont(doc,'bold').fontSize(15).fillColor(colors.navy).text(title);
  if(description)useFont(doc).fontSize(9).fillColor(colors.muted).text(description,{lineGap:2});
  doc.moveDown(0.65);
}

function reportDetails(doc,items) {
  const x=48,width=doc.page.width-96,labelWidth=150,valueX=x+labelWidth;
  doc.moveTo(x,doc.y).lineTo(x+width,doc.y).strokeColor(colors.line).lineWidth(1).stroke();
  items.forEach(([label,value])=>{
    useFont(doc,'bold').fontSize(8.5);
    const valueText=String(value||'—');
    const valueHeight=doc.heightOfString(valueText,{width:width-labelWidth,lineGap:2});
    const rowHeight=Math.max(36,valueHeight+18);
    ensureSpace(doc,rowHeight);
    const top=doc.y;
    useFont(doc).fontSize(8.5).fillColor(colors.muted).text(label.toUpperCase(),x,top+10,{width:labelWidth-16});
    useFont(doc,'bold').fontSize(10).fillColor(colors.navy).text(valueText,valueX,top+9,{width:width-labelWidth,lineGap:2});
    doc.moveTo(x,top+rowHeight).lineTo(x+width,top+rowHeight).strokeColor(colors.line).lineWidth(1).stroke();
    doc.x=x;
    doc.y=top+rowHeight;
  });
  doc.y+=20;
}

function linkLine(doc,label,value) {
  if(!value)return;
  ensureSpace(doc,34);
  doc.x=48;
  useFont(doc,'bold').fontSize(9).fillColor(colors.navy).text(`${label}:`,48,doc.y,{continued:true,width:doc.page.width-96});
  useFont(doc).fillColor(colors.blue).text(` ${value}`,{link:value,underline:true,continued:false});
  doc.x=48;
}

function materialDetails(doc,material) {
  const x=48,width=doc.page.width-96,gap=24,columnWidth=(width-gap)/2;
  const orders=material.rows.map(row=>`№${row.number}`).join(', ');
  const platforms=[...new Set(material.rows.map(row=>row.platform))].join(', ');
  const advertisers=[...new Set(material.rows.map(row=>row.advertiser))].join(', ');
  const amount=rubles(material.rows.reduce((sum,row)=>sum+row.amount,0));
  const detailRows=[
    [[material.rows.length===1?'Заказ':'Заказы',orders],['Площадка',platforms]],
    [['Рекламодатель',advertisers],['Стоимость размещения',amount]],
  ];

  const rowHeights=detailRows.map(row=>Math.max(42,...row.map(([,value])=>{
    useFont(doc,'bold').fontSize(9.5);
    return doc.heightOfString(String(value||'—'),{width:columnWidth,lineGap:2})+26;
  })));
  ensureSpace(doc,rowHeights.reduce((sum,height)=>sum+height,0)+16);
  doc.moveTo(x,doc.y).lineTo(x+width,doc.y).strokeColor(colors.line).lineWidth(1).stroke();

  detailRows.forEach((row,rowIndex)=>{
    const top=doc.y,rowHeight=rowHeights[rowIndex];
    row.forEach(([label,value],columnIndex)=>{
      const left=x+columnIndex*(columnWidth+gap);
      useFont(doc).fontSize(7.5).fillColor(colors.muted).text(label.toUpperCase(),left,top+8,{width:columnWidth});
      useFont(doc,'bold').fontSize(9.5).fillColor(colors.navy).text(String(value||'—'),left,top+20,{width:columnWidth,lineGap:2});
    });
    doc.moveTo(x,top+rowHeight).lineTo(x+width,top+rowHeight).strokeColor(colors.line).lineWidth(1).stroke();
    doc.x=x;
    doc.y=top+rowHeight;
  });
  doc.y+=12;
}

function placementList(doc,rows) {
  sectionTitle(doc,'Размещения','Площадки, рекламодатели, стоимость и итоговые ссылки на публикации.');
  rows.forEach((row,index)=>{
    const height=row.link?86:68;ensureSpace(doc,height);
    const top=doc.y;
    if(index===0)doc.moveTo(48,top).lineTo(doc.page.width-48,top).strokeColor(colors.line).stroke();
    useFont(doc,'bold').fontSize(9).fillColor(colors.blue).text(`№${row.number}`,48,top+12,{width:72});
    useFont(doc,'bold').fontSize(10).fillColor(colors.navy).text(row.platform,124,top+11,{width:doc.page.width-172,height:14,ellipsis:true});
    useFont(doc).fontSize(8.5).fillColor(colors.muted).text(`${date(row.updatedAt)}  ·  ${reportStatus[row.status]||row.status}`,124,top+29,{width:doc.page.width-172,height:13,ellipsis:true});
    useFont(doc).fontSize(8.5).fillColor(colors.navy).text(`Рекламодатель: ${row.advertiser}  ·  Стоимость размещения: ${rubles(row.amount)}`,124,top+46,{width:doc.page.width-172,height:13,ellipsis:true});
    if(row.link)useFont(doc).fontSize(8.5).fillColor(colors.blue).text(row.link,124,top+63,{width:doc.page.width-172,height:14,ellipsis:true,link:row.link,underline:true});
    doc.moveTo(48,top+height).lineTo(doc.page.width-48,top+height).strokeColor(colors.line).stroke();
    doc.x=48;
    doc.y=top+height;
  });
  doc.y+=12;
}

function fullMaterial(doc,material,index,total) {
  if(index||doc.y>220)doc.addPage();
  const width=doc.page.width-96;
  doc.x=48;
  useFont(doc,'bold').fontSize(9).fillColor(colors.blue).text(`МАТЕРИАЛ ${index+1} ИЗ ${total}`,48,doc.y,{width});
  doc.moveDown(0.5);
  useDisplayFont(doc).fontSize(17).fillColor(colors.navy).text(material.title,48,doc.y,{width,lineGap:3});
  doc.moveDown(0.65);
  materialDetails(doc,material);
  material.rows.filter(row=>row.link).forEach(row=>linkLine(doc,material.rows.length===1?'Ссылка на публикацию':row.platform,row.link));
  doc.moveDown(0.65);
  doc.moveTo(48,doc.y).lineTo(doc.page.width-48,doc.y).strokeColor(colors.line).stroke();
  doc.moveDown(1);
  useFont(doc,'bold').fontSize(12).fillColor(colors.navy).text('Полный текст материала',48,doc.y,{width});
  doc.moveDown(0.45);
  useFont(doc).fontSize(10).fillColor(colors.navy).text(material.body||'Текст материала в снимке заказа отсутствует.',48,doc.y,{width,align:'left',lineGap:4});
}

function pdfBuffer({title,subtitle,rows,kind='placement',project=null,dateFrom=null,dateTo=null}) {
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margins:{top:62,right:48,bottom:100,left:48},bufferPages:true,info:{Title:title,Author:'Аксиома',Subject:'Отчет о публикациях'}});
    const chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
    const fonts=reportFonts();
    if(!fonts)throw new Error('Report fonts unavailable');
    doc.registerFont('ReportRegular',fonts.regular);doc.registerFont('ReportBold',fonts.bold);doc.registerFont('ReportDisplay',displayFont);doc.registerFont('ReportDisplayBold',displayBoldFont);
    doc.on('pageAdded',()=>runningHeader(doc));
    coverHeader(doc,title,subtitle);
    if(kind==='project') {
      const totalAmount=rows.reduce((sum,row)=>sum+Number(row.amount),0);
      const advertisers=[...new Set(rows.map(row=>row.advertiser))].join(', ');
      reportDetails(doc,[['Проект',project?.name||'—'],['Период',`${date(dateFrom)} - ${date(dateTo)}`],['Размещений',rows.length],['Стоимость размещений',rubles(totalAmount)],['Рекламодатели',advertisers||'Не указаны']]);
      if(rows.length)placementList(doc,rows);
    } else if(rows[0]) {
      const row=rows[0];
      reportDetails(doc,[['Заказ',`№${row.number}`],['Площадка',row.platform],['Рекламодатель',row.advertiser],['Дата публикации',date(row.updatedAt)],['Стоимость размещения',rubles(row.amount)],['Статус',reportStatus[row.status]||row.status],['Формат',reportFormat[row.snapshot?.format]||row.snapshot?.format||'—']]);
      linkLine(doc,'Ссылка на публикацию',row.link);
      doc.moveDown(1);
    }
    if(!rows.length) {
      useFont(doc).fontSize(12).fillColor(colors.muted).text('За выбранный период публикаций нет.');
    } else {
      const materials=[...rows.reduce((map,row)=>{
        const key=row.materialId||row.material;
        const current=map.get(key)||{title:row.material,body:plainText(row.snapshot?.body),rows:[]};
        current.rows.push(row);map.set(key,current);return map;
      },new Map()).values()];
      materials.forEach((material,index)=>fullMaterial(doc,material,index,materials.length));
    }
    const range=doc.bufferedPageRange();
    for(let index=range.start;index<range.start+range.count;index++) {
      doc.switchToPage(index);
      const contentBottomMargin=doc.page.margins.bottom;
      doc.page.margins.bottom=36;
      const y=doc.page.height-78;
      doc.moveTo(48,y-10).lineTo(doc.page.width-48,y-10).strokeColor(colors.line).stroke();
      useDisplayFont(doc,'bold').fontSize(7).fillColor(colors.navy).text('АКСИОМА',48,y,{lineBreak:false});
      useFont(doc).fontSize(8).fillColor(colors.muted).text(`Страница ${index+1} из ${range.count}`,doc.page.width-150,y,{width:102,align:'right',lineBreak:false});
      doc.page.margins.bottom=contentBottomMargin;
    }
    doc.end();
  });
}

function reportRows(rows) {
  return rows.map(row=>({
    id:row.id,number:row.number,projectId:row.project_id,materialId:row.material_id,
    material:row.snapshot.title,platform:row.snapshot.outlet.name,link:row.publication_url,snapshot:row.snapshot,
    advertiser:row.snapshot.advertiser?.name||'Не указан',
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
      await audit(tx,req.user.actorId??req.user.id,'report.create',id,{projectId:project.id,dateFrom:input.dateFrom,dateTo:input.dateTo,placements:rows.length});
      return result;
    });
  });
  app.get('/api/reports/export.csv',async(req,reply)=>{
    role(req.user,'customer');
    const input=reportExportQuery.parse(req.query);
    const values=[req.user.id];
    const conditions=['customer_id=$1','publication_url IS NOT NULL'];
    if(input.projectId){values.push(input.projectId);conditions.push(`project_id=$${values.length}`);}
    if(input.dateFrom){values.push(input.dateFrom);conditions.push(`updated_at::date>=$${values.length}::date`);}
    if(input.dateTo){values.push(input.dateTo);conditions.push(`updated_at::date<=$${values.length}::date`);}
    const rows=reportRows((await db.query(`SELECT * FROM orders WHERE ${conditions.join(' AND ')} ORDER BY updated_at DESC LIMIT 500`,values)).rows);
    const escape=value=>`"${String(value??'').replaceAll('"','""')}"`;
    const csv=['Заказ,Материал,Площадка,Дата,Ссылка,Статус,Стоимость',...rows.map(row=>[row.number,row.material,row.platform,date(row.updatedAt),row.link,row.status,Number(row.amount)/100].map(escape).join(','))].join('\n');
    reply.header('Content-Type','text/csv; charset=utf-8').header('Content-Disposition',"attachment; filename*=UTF-8''placements.csv");return `\ufeff${csv}`;
  });
  app.get('/api/orders/:id/report.pdf',async(req,reply)=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);const order=await ownedOrder(db,id,req.user.id);const rows=reportRows([order]);
    const pdf=await pdfBuffer({title:`Отчет о публикации №${order.number}`,subtitle:`Сформирован ${date(new Date())} · Данные зафиксированы в момент создания заказа`,rows,kind:'placement'});
    reply.header('Content-Type','application/pdf').header('Content-Disposition',`attachment; filename="placement-${order.number}.pdf"`);return pdf;
  });
  app.get('/api/reports/:id/pdf',async(req,reply)=>{
    role(req.user,'customer');const id=uuid.parse(req.params.id);
    const report=(await db.query('SELECT * FROM reports WHERE id=$1 AND owner_id=$2',[id,req.user.id])).rows[0];
    if(!report)fail(404,'Not found');
    const pdf=await pdfBuffer({title:'Отчет по проекту',subtitle:`${report.snapshot.project.name} · ${date(report.date_from)} - ${date(report.date_to)}`,rows:report.snapshot.rows,kind:'project',project:report.snapshot.project,dateFrom:report.date_from,dateTo:report.date_to});
    reply.header('Content-Type','application/pdf').header('Content-Disposition',`attachment; filename="project-report-${report.number}.pdf"`);return pdf;
  });
}
