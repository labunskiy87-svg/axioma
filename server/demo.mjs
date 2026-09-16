import {randomUUID,randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {createUser} from './app.mjs';
import {transfer,audit,quote} from './finance.mjs';

// Explicit local fixtures only. No public endpoint can credit money or verify advertisers.
export async function seedDemo(db) {
  if(process.env.NODE_ENV==='production')throw new Error('Demo fixtures are local only');
  const previous=(await db.query("SELECT id FROM audit WHERE action='demo.seed.v1' LIMIT 1")).rows[0];
  if(previous)return {alreadySeeded:true};
  const staff=JSON.parse(await readFile('.local-accounts.json','utf8'));
  const customer={email:'demo@axioma.local',password:randomBytes(24).toString('base64url'),role:'customer'};
  const result=await db.transaction(async tx=>{
    const users={customer:await createUser(tx,customer.email,customer.password)};
    for(const role of ['publisher','admin']) {
      const account=staff.find(a=>a.role===role);
      users[role]=(await tx.query('SELECT id FROM users WHERE email=$1 AND role=$2',[account.email,role])).rows[0];
      if(!users[role])throw new Error(`Missing local ${role} account`);
    }
    const owner=users.customer.id,publisher=users.publisher.id;
    await transfer(tx,'external:clearing',`${owner}:available`,300000000,'demo:opening-balance');
    const advertisers=[];
    for(const [i,name] of ['ООО «Демо Технологии»','ООО «Демо Город»','ИП Демо Автор'].entries()) {
      const id=randomUUID();advertisers.push({id,name,inn:`990000000${i}`});
      await tx.query('INSERT INTO advertisers(id,owner_id,name,inn,verification,details) VALUES($1,$2,$3,$4,$5,$6)',[id,owner,name,advertisers[i].inn,i===2?'pending':'verified',JSON.stringify({address:'Демонстрационные реквизиты. Не использовать для реальной рекламы.'})]);
    }
    const projects=[];
    for(const [i,name] of ['Демо: запуск продукта','Демо: городская кампания','Демо: проект без рекламодателя'].entries()) {
      const id=randomUUID();projects.push(id);
      await tx.query('INSERT INTO projects(id,owner_id,name,description,advertisers) VALUES($1,$2,$3,$4,$5)',[id,owner,name,'Учебный проект для проверки интерфейса и API.',JSON.stringify(i===2?[]:[advertisers[i].name])]);
    }
    const outlets=[];
    const definitions=[['Демо: Деловой обзор','media','Федеральные'],['Демо: Город сегодня','media','Москва'],['Демо: Технологии в Telegram','telegram','Федеральные'],['Демо: Сообщество ВК','vk','Санкт-Петербург'],['Демо: Канал MAX','max','Федеральные'],['Демо: Канал Дзен','dzen','Федеральные'],['Демо: новая редакция','media','Приволжский федеральный округ']];
    for(const [i,[name,kind,geography]] of definitions.entries()) {
      const id=randomUUID(),status=i===6?'pending':'approved',active=i!==5&&i!==6;
      const prices=kind==='media'?{article:4500000,news:2200000,longread:6500000}:{post:1500000,article:3000000};
      const details={topics:i===1?['Город','Общество']:['Технологии','Бизнес'],goals:i===1?['pr','serm']:['pr','seo'],aggregators:kind==='media'?['google_news','dzen']:[],dailyAudience:12000+i*5000,subscribers:kind==='media'?0:20000+i*3000,medialogiaRank:i+8,publicationDays:2,publicationDaysByFormat:Object.fromEntries(Object.keys(prices).map(f=>[f,f==='news'?1:2])),storageMonths:24,responseHours:4,requirements:'Демонстрационная площадка. Готовый текст, изображения с правами использования и сведения для маркировки. Реальные публикации не выполняются.'};
      const outlet={id,name,url:`https://outlet-${i+1}.example.test`,prices,coefficient_bps:10000,discount_bps:i===0?1000:0,discount_until:'2099-12-31'};outlets.push(outlet);
      await tx.query('INSERT INTO outlets(id,owner_id,name,url,kind,geography,details,prices,status,active,discount_bps,discount_until) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[id,publisher,name,outlet.url,kind,geography,JSON.stringify(details),JSON.stringify(prices),status,active,outlet.discount_bps,outlet.discount_until]);
    }
    const materials=[];
    const samples=[['Новая платформа помогает компаниям планировать публикации','article','approved'],['Открыт демо-центр городских инициатив','news','approved'],['Пять идей для работы с корпоративными новостями','post','approved'],['Как команда готовит коммуникационную кампанию','longread','draft'],['Сервис обновил инструменты аналитики','news','pending'],['Приглашение на открытую встречу','post','pending'],['Исследование коммуникаций: предварительные итоги','article','rejected'],['Интерфейс редактора: пробный материал','article','draft']];
    for(const [i,[title,format,status]] of samples.entries()) {
      const id=randomUUID(),ad=advertisers[i%2],metadata={tags:'демо, тестирование',notes:'Учебный материал. Не отправлять на реальные площадки.',title,description:'Демонстрационный материал платформы «Аксиома».'};
      const body=`${title}\n\nЭто демонстрационный рекламный материал для тестирования платформы «Аксиома». Все упомянутые организации, события и показатели вымышлены.\n\nКоманда представила обновленный подход к планированию публикаций. В тестовом сценарии заказчик создает материал, выбирает формат и площадку, а редакция принимает заказ и отправляет ссылку на результат.\n\nМатериал позволяет проверить редактирование текста, сохранение проекта, модерацию, расчет цены и переходы между статусами.\n\nДополнительная информация: https://demo.example.test/product`;
      const m={id,title,body,format,metadata,advertiser:ad,version:1};materials.push(m);
      const expedited=status==='pending'&&i===4;
      await tx.query('INSERT INTO materials(id,owner_id,advertiser_id,project_id,title,body,format,metadata,status,expedited,submitted_at,moderation_reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',[id,owner,ad.id,projects[i%2],`Демо: ${title}`,body,format,JSON.stringify(metadata),status,expedited,status==='draft'?null:new Date().toISOString(),status==='rejected'?'Демо: уточните источник данных и уберите неподтвержденные обещания.':null]);
      if(expedited)await transfer(tx,`${owner}:available`,'platform:revenue',5000,`demo:moderation:${id}`);
    }
    const states=['pending','accepted','submitted','completed','rejected','disputed','refunded'];
    for(const [i,status] of states.entries()) {
      const m=materials[i>=4?2:i%2],o=outlets[i>=4?i-2:Math.floor(i/2)],id=randomUUID(),amount=quote(o,m.format),payout=amount-Math.round(amount*0.15);
      const snapshot={...m,title:`Демо: ${m.title}`,advertiser:{name:m.advertiser.name,inn:m.advertiser.inn},outlet:{name:o.name,url:o.url},commissionBps:1500};
      await transfer(tx,`${owner}:available`,`${owner}:reserved`,amount,`demo:order:${id}:reserve`);
      if(status==='completed') {
        await transfer(tx,`${owner}:reserved`,`${publisher}:available`,payout,`demo:order:${id}:payout`);
        await transfer(tx,`${owner}:reserved`,'platform:revenue',amount-payout,`demo:order:${id}:commission`);
      } else if(['rejected','refunded'].includes(status))await transfer(tx,`${owner}:reserved`,`${owner}:available`,amount,`demo:order:${id}:refund`);
      await tx.query('INSERT INTO orders(id,customer_id,publisher_id,material_id,outlet_id,project_id,snapshot,amount,payout,status,publication_url,marking_confirmed,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[id,owner,publisher,m.id,o.id,projects[i%2],JSON.stringify(snapshot),amount,payout,status,['submitted','completed','disputed','refunded'].includes(status)?`https://publication-${i}.example.test/demo`:null,['submitted','completed','disputed','refunded'].includes(status),['rejected','refunded','disputed'].includes(status)?'Демонстрационный сценарий проверки статуса.':null]);
    }
    await audit(tx,users.admin.id,'demo.seed.v1',owner,{localOnly:true,syntheticMoney:true,advertisers:3,projects:3,materials:8,outlets:7,orders:7});
    return {advertisers:3,projects:3,materials:8,outlets:7,orders:7};
  });
  await writeFile('.local-demo-accounts.json',JSON.stringify([customer,...staff],null,2),{mode:0o600,flag:'wx'});
  return result;
}
