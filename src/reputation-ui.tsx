import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {
  AlertCircle,
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Globe2,
  Link2,
  MapPin,
  MessageCircle,
  Newspaper,
  Plus,
  Radio,
  Search,
  Settings,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  UserRound,
} from 'lucide-react';

const cardClass='bg-white border border-[#d4e0ed] rounded-[24px] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.08)_0px_30px_50px_0px]';

const Badge=({children,color='gray'})=>{
  const colors={
    gray:'bg-[#f0f3f8] text-[#004eba] border-[#f0f3f8]',
    green:'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    blue:'bg-[#e6f0ff] text-[#004eba] border-[#e6f0ff]',
    amber:'bg-[#f0f3f8] text-[#0b3558] border-[#d4e0ed]',
    red:'bg-white text-[#ef4444] border-[#ef4444]',
  };
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${colors[color]}`}>{children}</span>;
};

const DemoButton=({children,variant='primary',className='',...props})=>{
  const styles=variant==='primary'
    ?'border-[#006bff] bg-[#006bff] text-white hover:bg-[#0057d6]'
    :'border-[#d4e0ed] bg-white text-[#0b3558] hover:bg-[#f0f3f8]';
  return <button type="button" className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors ${styles} ${className}`} {...props}>{children}</button>;
};

const PrototypeSelect=({value,options,onChange,className=''})=>{
  const [open,setOpen]=useState(false);
  const [position,setPosition]=useState(null);
  const triggerRef=useRef(null);
  const menuRef=useRef(null);
  const updatePosition=()=>{
    const rect=triggerRef.current?.getBoundingClientRect();
    if(!rect)return;
    const padding=12;
    const width=Math.min(rect.width,window.innerWidth-padding*2);
    const left=Math.max(padding,Math.min(rect.left,window.innerWidth-width-padding));
    const menuHeight=Math.min(options.length*45+12,240);
    const below=window.innerHeight-rect.bottom-padding;
    const top=below>=menuHeight||below>=rect.top ? rect.bottom+6 : Math.max(padding,rect.top-menuHeight-6);
    setPosition({left,top,width,maxHeight:menuHeight});
  };
  useEffect(()=>{
    if(!open)return;
    updatePosition();
    const close=event=>{if(!triggerRef.current?.contains(event.target)&&!menuRef.current?.contains(event.target))setOpen(false);};
    const escape=event=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('pointerdown',close);
    document.addEventListener('keydown',escape);
    window.addEventListener('resize',updatePosition);
    window.addEventListener('scroll',updatePosition,true);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);window.removeEventListener('resize',updatePosition);window.removeEventListener('scroll',updatePosition,true);};
  },[open,options.length]);
  return <div ref={triggerRef} className={`relative ${className}`}>
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(value=>!value)} className="flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-[#476788] bg-white px-4 text-left text-sm font-medium text-[#0b3558] outline-none transition-colors focus:ring-2 focus:ring-[#006bff]">
      <span className="truncate">{value}</span><ChevronDown className={`h-4 w-4 shrink-0 text-[#476788] transition-transform ${open?'rotate-180':''}`}/>
    </button>
    {open&&position&&createPortal(<div ref={menuRef} role="listbox" style={position} className="fixed z-[220] overflow-y-auto rounded-2xl border border-[#d4e0ed] bg-white p-1.5 shadow-[rgba(11,53,88,0.08)_0px_10px_24px,rgba(11,53,88,0.10)_0px_24px_60px]">
      {options.map(option=><button key={option} type="button" role="option" aria-selected={value===option} onClick={()=>{onChange?.(option);setOpen(false);}} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${value===option?'bg-[#e6f0ff] font-semibold text-[#004eba]':'text-[#0b3558] hover:bg-[#f8f9fb]'}`}><span className="truncate">{option}</span>{value===option&&<CheckCircle2 className="h-4 w-4 shrink-0"/>}</button>)}
    </div>,document.body)}
  </div>;
};

const materials=[
  {
    id:'RM-105',position:null,engine:'Telegram',channel:'Telegram',
    title:'Обсуждение переноса публичного запуска Neuroreel',
    domain:'t.me/digital_inside',url:'https://t.me/digital_inside/1842',
    sentiment:'Негативная',sentimentColor:'red',risk:'Высокий',riskColor:'red',topic:'Запуск продукта',date:'16.09.2026',
    summary:'Пост собрал заметный охват и запустил повторные публикации в отраслевых каналах. В течение суток поисковый спрос на бренд вырос на 64%.',
    claim:'Авторы канала связывают перенос запуска с неготовностью продукта к масштабированию.',
    impact:'Telegram стал первым источником всплеска: публикация получила 186 тыс. просмотров, 412 пересылок и усилила негативный поисковый сценарий.',
    reach:'186 тыс. просмотров · 412 пересылок',
  },
  {
    id:'RM-104',position:3,engine:'Яндекс',channel:'СМИ',
    title:'Почему запуск новой платформы Neuroreel перенесли на осень',
    domain:'business-review.ru',url:'https://business-review.ru/technology/neuroreel-launch',
    sentiment:'Негативная',sentimentColor:'red',risk:'Высокий',riskColor:'red',topic:'Запуск продукта',date:'15.09.2026',
    summary:'Материал связывает перенос запуска с недостаточной готовностью продукта и находится в верхней части брендовой выдачи.',
    claim:'Срок публичного запуска был перенесен после закрытого тестирования.',
    impact:'Высокая позиция формирует у потенциальных клиентов сомнение в готовности продукта до знакомства с официальными материалами.',
    reach:'82 тыс. просмотров',
  },
  {
    id:'RM-103',position:5,engine:'Google',channel:'СМИ',
    title:'Neuroreel представила инструменты аналитики для корпоративных команд',
    domain:'techmedia.ru',url:'https://techmedia.ru/news/neuroreel-analytics',
    sentiment:'Позитивная',sentimentColor:'green',risk:'Низкий',riskColor:'green',topic:'Продукт',date:'12.09.2026',
    summary:'Профильный обзор продукта с акцентом на практические сценарии аналитики и запуск пилотных проектов.',
    claim:'Компания открыла доступ к пилотной версии для корпоративных клиентов.',
    impact:'Материал усиливает продуктовую экспертизу и может стать опорной страницей в контролируемой выдаче.',
    reach:'54 тыс. просмотров',
  },
  {
    id:'RM-102',position:7,engine:'Яндекс',channel:'Open web',
    title:'Основатели Neuroreel о рынке генеративного видео и планах компании',
    domain:'vc.ru',url:'https://vc.ru/ai/neuroreel-interview',
    sentiment:'Нейтральная',sentimentColor:'blue',risk:'Средний',riskColor:'amber',topic:'Команда',date:'08.09.2026',
    summary:'Интервью раскрывает стратегию и команду, но часть комментариев в выдаче связана с задержкой публичного релиза.',
    claim:'Основатели планируют расширить продукт на международный рынок после завершения пилотов.',
    impact:'Публикация поддерживает экспертный образ, но требует усиления актуальными подтверждениями результатов.',
    reach:'31 тыс. просмотров',
  },
  {
    id:'RM-101',position:9,engine:'Google',channel:'Open web',
    title:'Отзывы первых команд о закрытом тестировании Neuroreel',
    domain:'productnews.ru',url:'https://productnews.ru/reviews/neuroreel-beta',
    sentiment:'Смешанная',sentimentColor:'amber',risk:'Средний',riskColor:'amber',topic:'Отзывы',date:'03.09.2026',
    summary:'В обзоре отмечены сильные аналитические функции, но также упомянуты ограничения ранней версии интерфейса.',
    claim:'Пользователи положительно оценивают аналитику, но ожидают более стабильную работу редактора.',
    impact:'Смешанная оценка влияет на коммерческие запросы и должна быть уравновешена свежими кейсами.',
    reach:'19 тыс. просмотров',
  },
];

const channelMetrics=[
  {name:'Поиск',icon:Search,value:'20',label:'результатов в Top-10',note:'4 контролируемых URL',tone:'blue'},
  {name:'СМИ',icon:Newspaper,value:'47',label:'релевантных материалов',note:'11 новых за 30 дней',tone:'blue'},
  {name:'Telegram',icon:MessageCircle,value:'1,4 млн',label:'потенциальный охват',note:'18 упоминаний · 736 пересылок',tone:'red'},
  {name:'Open web',icon:Globe2,value:'63',label:'страницы и обсуждения',note:'9 новых доменов',tone:'blue'},
];

const demandIntents=[
  ['Общие брендовые',51,'#006bff'],
  ['Продуктовые',20,'#4b93ff'],
  ['Репутационные',22,'#8bb9ff'],
  ['Негативные',7,'#ef4444'],
] as const;

const serpPanels=[
  ['Яндекс','Обновлено сегодня, 08:00',[
    ['1','neuroreel.ai','Официальный сайт','Контролируемый','green','—'],
    ['2','techmedia.ru','Инструменты аналитики для команд','Позитивный','green','+1'],
    ['3','business-review.ru','Почему запуск перенесли на осень','Негативный','red','+5'],
    ['4','productnews.ru','Отзывы о закрытом тестировании','Смешанный','amber','−1'],
    ['5','vc.ru','Интервью с основателями','Нейтральный','blue','—'],
  ]],
  ['Google','Обновлено сегодня, 08:15',[
    ['1','neuroreel.ai','Официальный сайт','Контролируемый','green','—'],
    ['2','linkedin.com','Профиль компании Neuroreel','Контролируемый','green','—'],
    ['3','techmedia.ru','Инструменты аналитики для команд','Позитивный','green','+1'],
    ['4','vc.ru','Интервью с основателями','Нейтральный','blue','—'],
    ['5','business-review.ru','Почему запуск перенесли на осень','Негативный','red','+3'],
  ]],
] as const;

const topics=[
  ['Продукт и технологии',34,'Позитивная','green'],
  ['Запуск продукта',26,'Негативная','red'],
  ['Команда и основатели',18,'Нейтральная','blue'],
  ['Отзывы клиентов',14,'Смешанная','amber'],
  ['Инвестиции',8,'Нейтральная','gray'],
] as const;

const subjectTypes=[
  {id:'Бренд',icon:Tag,title:'Бренд',text:'Продукт, сервис или торговая марка'},
  {id:'Человек',icon:UserRound,title:'Человек',text:'Основатель, эксперт или публичная персона'},
  {id:'Компания',icon:Building2,title:'Компания',text:'Юридическое лицо или группа компаний'},
];

const SubjectSetup=({onOpenDemo,onSave,onCancel,hasExisting=false})=>{
  const [type,setType]=useState('Бренд');
  const [name,setName]=useState('');
  const field={
    'Бренд':{name:'Название бренда',placeholder:'Например, Neuroreel',relation:'Компания-владелец',relationPlaceholder:'Название компании'},
    'Человек':{name:'Имя и фамилия',placeholder:'Например, Иван Иванов',relation:'Компания и должность',relationPlaceholder:'Компания · должность'},
    'Компания':{name:'Название компании',placeholder:'Например, ООО «Альфа»',relation:'Сайт компании',relationPlaceholder:'https://example.ru'},
  }[type];
  const queryBase=name.trim()||field.placeholder.replace('Например, ','');
  return <div className={`${cardClass} overflow-hidden`}>
    <div className="border-b border-[#d4e0ed] px-6 py-5 sm:px-8 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="font-display text-xl font-bold text-[#0b3558]">Новый объект анализа</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#476788]">Укажите, чью репутацию нужно отслеживать. На основе этих данных система сформирует поисковые запросы и структуру первого сканирования.</p></div>
        <Badge color="blue">Шаг 1 из 1</Badge>
      </div>
    </div>

    <div className="p-6 sm:p-8">
      <fieldset>
        <legend className="text-sm font-semibold text-[#0b3558]">Тип объекта</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {subjectTypes.map(item=>{
            const Icon=item.icon;
            const active=type===item.id;
            return <button key={item.id} type="button" onClick={()=>setType(item.id)} className={`flex min-h-[108px] items-start gap-4 rounded-xl border p-4 text-left transition-colors ${active?'border-[#006bff] bg-[#eef5ff] shadow-[inset_0_0_0_1px_#006bff]':'border-[#d4e0ed] bg-white hover:border-[#a6bbd1] hover:bg-[#f8f9fb]'}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active?'bg-[#006bff] text-white':'bg-[#f0f3f8] text-[#476788]'}`}><Icon className="h-5 w-5"/></span>
              <span><span className="block text-sm font-semibold text-[#0b3558]">{item.title}</span><span className="mt-1 block text-xs leading-5 text-[#476788]">{item.text}</span></span>
            </button>;
          })}
        </div>
      </fieldset>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <label className="block"><span className="text-sm font-medium text-[#476788]">{field.name}</span><input value={name} onChange={event=>setName(event.target.value)} placeholder={field.placeholder} className="mt-2 h-11 w-full rounded-lg border border-[#476788] bg-white px-4 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">{field.relation}</span><input placeholder={field.relationPlaceholder} className="mt-2 h-11 w-full rounded-lg border border-[#476788] bg-white px-4 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Варианты названия</span><textarea placeholder={type==='Человек'?'Полное имя, латинское написание':'Сокращение, латинское написание'} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><span className="mt-1.5 block text-xs text-[#6f88a3]">Каждый вариант с новой строки</span></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Связанные объекты</span><textarea placeholder={type==='Человек'?'Компании, проекты, партнеры':'Продукты, руководители, связанные компании'} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><span className="mt-1.5 block text-xs text-[#6f88a3]">Помогает отличать релевантные совпадения</span></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Краткое описание</span><textarea placeholder="Контекст для анализа: сфера деятельности, продукты, география и важные факты" className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label>
      </div>
    </div>

    <div className="flex flex-col-reverse gap-3 border-t border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
      <DemoButton variant="secondary" onClick={hasExisting?onCancel:onOpenDemo}>{hasExisting?'Отмена':'Открыть демо'}</DemoButton>
      <DemoButton onClick={()=>onSave({name:name.trim()||queryBase,type})}><Search className="h-4 w-4"/>Запустить сканирование</DemoButton>
    </div>
  </div>;
};

const ReputationOnboarding=({onAdd,onOpenDemo})=><div className="space-y-6">
  <div>
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Репутация</h1>
    <p className="mt-2 text-sm text-[#476788]">Мониторинг поисковой выдачи, СМИ, Telegram и открытого web</p>
  </div>
  <div className={`${cardClass} overflow-hidden`}>
    <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col justify-center p-7 sm:p-9 lg:min-h-[390px] lg:border-r lg:border-[#d4e0ed]">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#006bff]"><Sparkles className="h-5 w-5"/></span><span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f1ff] px-3 py-1.5 text-xs font-medium text-[#004eba]"><Radio className="h-3.5 w-3.5"/>Объектов мониторинга пока нет</span></div>
        <h2 className="mt-6 max-w-xl font-display text-xl font-bold leading-tight text-[#0b3558] sm:text-2xl">Добавьте первый объект репутационного анализа</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-[#476788]">Выберите бренд, человека или компанию. Система подготовит поисковые запросы и соберет единый аналитический срез по всем каналам.</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><DemoButton onClick={onAdd}>Добавить объект мониторинга<ArrowRight className="h-4 w-4"/></DemoButton><DemoButton variant="secondary" onClick={onOpenDemo}>Открыть демо</DemoButton></div>
      </div>
      <div className="bg-[#f8f9fb] p-7 sm:p-9">
        <div className="text-xs font-semibold uppercase text-[#6f88a3]">После настройки вы увидите</div>
        <div className="mt-5 divide-y divide-[#d4e0ed] border-y border-[#d4e0ed]">{[
          [Search,'Поисковая видимость','Top-10 Яндекса и Google, динамика позиций и структура спроса'],
          [MessageCircle,'СМИ и Telegram','Упоминания, охват, тональность и цепочки распространения'],
          [TrendingUp,'Аналитика и действия','Ключевые темы, факторы риска и рекомендации для размещений'],
        ].map(([Icon,title,text])=><div key={title} className="flex gap-4 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#006bff]"><Icon className="h-5 w-5"/></span><div><div className="text-sm font-semibold text-[#0b3558]">{title}</div><p className="mt-1 text-xs leading-5 text-[#476788]">{text}</p></div></div>)}</div>
        <div className="mt-5"><div className="flex items-center gap-2 text-sm font-semibold text-[#0b3558]"><CheckCircle2 className="h-4 w-4 text-[#006bff]"/>Первичная настройка</div><p className="mt-2 text-xs leading-5 text-[#476788]">Потребуются название, варианты написания и связанные объекты. Источники и интеграции подключаются позже.</p></div>
      </div>
    </div>
  </div>
</div>;

const MonitoringSettings=({subject,queries,onSave,onCancel})=>{
  const [draft,setDraft]=useState(queries.length?queries:[subject.name]);
  const updateQuery=(index,value)=>setDraft(current=>current.map((item,itemIndex)=>itemIndex===index?value:item));
  const removeQuery=index=>setDraft(current=>current.filter((_,itemIndex)=>itemIndex!==index));
  const addQuery=()=>setDraft(current=>current.length>=5?current:[...current,'']);
  const normalized=draft.map(item=>item.trim()).filter(Boolean).slice(0,5);
  return <div className="space-y-6">
    <div><div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки мониторинга</h1><Badge color="blue">{subject.name}</Badge></div><p className="mt-2 text-sm text-[#476788]">Управление поисковыми запросами объекта</p></div>
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Поисковые запросы</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#476788]">Добавьте основные варианты, по которым нужно отслеживать спрос и поисковую выдачу. Не более пяти запросов на один объект.</p></div><Badge color="gray">{draft.length} из 5</Badge></div>
      <div className="px-6 py-6 sm:px-8"><div className="space-y-3">{draft.map((item,index)=><div key={index} className="grid grid-cols-[36px_minmax(0,1fr)_44px] items-center gap-3"><span className="text-center text-sm font-semibold text-[#6f88a3]">{index+1}</span><input value={item} onChange={event=>updateQuery(index,event.target.value)} aria-label={`Поисковый запрос ${index+1}`} placeholder="Введите поисковый запрос" className="h-11 min-w-0 rounded-lg border border-[#476788] bg-white px-4 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><button type="button" aria-label={`Удалить запрос ${index+1}`} title="Удалить запрос" disabled={draft.length===1} onClick={()=>removeQuery(index)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] transition-colors hover:bg-[#f0f3f8] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4"/></button></div>)}</div><button type="button" onClick={addQuery} disabled={draft.length>=5} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4e0ed] bg-white px-4 text-sm font-semibold text-[#0b3558] transition-colors hover:bg-[#f0f3f8] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4"/>Добавить запрос</button></div>
      <div className="flex flex-col-reverse gap-3 border-t border-[#d4e0ed] bg-[#f8f9fb] px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8"><DemoButton variant="secondary" onClick={onCancel}>Отмена</DemoButton><DemoButton onClick={()=>onSave(normalized.length?normalized:[subject.name])}>Сохранить настройки</DemoButton></div>
    </div>
  </div>;
};

export function ReputationIntelligenceView({navigate}) {
  const [subjects,setSubjects]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('axioma-reputation-subjects')||'[]');}catch{return [];}
  });
  const [setupOpen,setSetupOpen]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [subject,setSubject]=useState(()=>subjects[0]||{name:'Neuroreel',type:'Бренд'});
  const [queriesBySubject,setQueriesBySubject]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('axioma-reputation-queries')||'{}');}catch{return {};}
  });
  const [section,setSection]=useState('Обзор');
  const [workspaceTab,setWorkspaceTab]=useState('Материалы');
  const [channel,setChannel]=useState('Все каналы');
  const [engine,setEngine]=useState('Все системы');
  const [serpQuery,setSerpQuery]=useState('neuroreel');
  const [query,setQuery]=useState('');
  const [materialPage,setMaterialPage]=useState(1);
  const [selected,setSelected]=useState(materials[0]);
  const visible=useMemo(()=>materials.filter(item=>(channel==='Все каналы'||item.channel===channel)&&(engine==='Все системы'||item.engine===engine)&&(!query.trim()||`${item.title} ${item.domain} ${item.topic} ${item.channel}`.toLowerCase().includes(query.trim().toLowerCase()))),[channel,engine,query]);
  const materialTotal=channel==='Telegram'?18:channel==='СМИ'?47:channel==='Open web'?63:engine==='Яндекс'?54:engine==='Google'?46:128;
  const materialPageCount=Math.max(1,Math.ceil(materialTotal/5));
  const materialRangeStart=(materialPage-1)*5+1;
  const materialRangeEnd=Math.min(materialPage*5,materialTotal);
  const materialPages=materialPage<=3?[1,2,3,'…',materialPageCount]:materialPage>=materialPageCount-2?[1,'…',materialPageCount-2,materialPageCount-1,materialPageCount]:[1,'…',materialPage,'…',materialPageCount];
  const scanBars=[42,47,45,54,61,58,72,88];
  const scanLabels=['02.09','04.09','06.09','08.09','10.09','12.09','14.09','16.09'];

  const saveSubject=value=>{
    const next={name:value.name,type:value.type};
    setSubjects(current=>{
      const updated=[next,...current.filter(item=>item.name!==next.name)];
      localStorage.setItem('axioma-reputation-subjects',JSON.stringify(updated));
      return updated;
    });
    setQueriesBySubject(current=>{
      if(current[next.name])return current;
      const defaults=next.type==='Человек'?[next.name,`${next.name} биография`,`${next.name} интервью`,`${next.name} отзывы`]:[next.name,`${next.name} отзывы`,`${next.name} новости`,`${next.name} руководство`];
      const updated={...current,[next.name]:defaults.slice(0,5)};
      localStorage.setItem('axioma-reputation-queries',JSON.stringify(updated));
      return updated;
    });
    setSubject(next);
    setSetupOpen(false);
  };
  const openDemo=()=>saveSubject({name:'Neuroreel',type:'Бренд'});
  const saveMonitoringQueries=queries=>{
    setQueriesBySubject(current=>{
      const updated={...current,[subject.name]:queries.slice(0,5)};
      localStorage.setItem('axioma-reputation-queries',JSON.stringify(updated));
      return updated;
    });
    setSettingsOpen(false);
  };

  useEffect(()=>{
    if(setupOpen)return;
    requestAnimationFrame(()=>document.querySelector('main > div.flex-1.overflow-auto')?.scrollTo({top:0}));
  },[setupOpen]);
  useEffect(()=>setMaterialPage(1),[channel,engine,query]);

  if(!subjects.length&&!setupOpen)return <ReputationOnboarding onAdd={()=>setSetupOpen(true)} onOpenDemo={openDemo}/>;

  if(settingsOpen)return <MonitoringSettings subject={subject} queries={queriesBySubject[subject.name]||[subject.name]} onSave={saveMonitoringQueries} onCancel={()=>setSettingsOpen(false)}/>;

  if(setupOpen)return <div className="space-y-6">
    <div>
      <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-2xl font-bold text-[#0b3558]">Репутация</h1><Badge color="blue">Добавление объекта</Badge></div>
      <p className="mt-2 text-sm text-[#476788]">{subjects.length?'Настройте новый объект мониторинга':'Создайте первый объект репутационного анализа'}</p>
    </div>
    <SubjectSetup hasExisting={subjects.length>0} onOpenDemo={openDemo} onCancel={()=>setSetupOpen(false)} onSave={saveSubject}/>
  </div>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-2xl font-bold text-[#0b3558]">Репутация</h1><Badge color="blue">{subject.type}</Badge></div>
        <p className="mt-2 text-sm text-[#476788]">{subject.name} · данные демонстрационного сканирования от 16.09.2026</p>
      </div>
      <div className="grid w-full grid-cols-[minmax(0,1fr)_44px_44px] gap-3 sm:w-auto sm:grid-cols-[208px_44px_44px_auto]"><PrototypeSelect value={subject.name} options={subjects.map(item=>item.name)} onChange={value=>{const next=subjects.find(item=>item.name===value);if(next)setSubject(next);}}/><button type="button" aria-label="Добавить объект мониторинга" title="Добавить объект мониторинга" onClick={()=>setSetupOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4e0ed] bg-white text-[#0b3558] transition-colors hover:bg-[#f0f3f8] focus:outline-none focus:ring-2 focus:ring-[#006bff]"><Plus className="h-5 w-5"/></button><button type="button" aria-label="Настройки мониторинга" title="Настройки мониторинга" onClick={()=>setSettingsOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4e0ed] bg-white text-[#0b3558] transition-colors hover:bg-[#f0f3f8] focus:outline-none focus:ring-2 focus:ring-[#006bff]"><Settings className="h-5 w-5"/></button><DemoButton className="col-span-3 sm:col-span-1"><Search className="h-4 w-4"/>Запустить сканирование</DemoButton></div>
    </div>

    <div className="flex max-w-full overflow-x-auto rounded-xl border border-[#d4e0ed] bg-white p-1 sm:w-fit">
      {['Обзор','Аналитика'].map(item=><button key={item} type="button" onClick={()=>setSection(item)} className={`min-w-[136px] rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${section===item?'bg-[#0b3558] text-white':'text-[#476788] hover:bg-[#f0f3f8] hover:text-[#0b3558]'}`}>{item}</button>)}
    </div>

    {section==='Обзор'?<div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Поисковый интерес','12 430','+38% за 30 дней','blue',TrendingUp],
          ['Контроль выдачи','40%','4 из 10 результатов','blue',Eye],
          ['Негатив в Top-10','3 URL','+1 с прошлого скана','red',AlertCircle],
          ['Репутационный спрос','22%','из всех брендовых запросов','amber',Search],
        ].map(([label,value,note,color,Icon])=><div key={label} className={`${cardClass} p-5`}>
          <div className="flex items-start justify-between gap-3"><div className="text-sm font-medium text-[#476788]">{label}</div><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color==='red'?'bg-[#fff1f1] text-[#ef4444]':color==='amber'?'bg-[#f0f3f8] text-[#476788]':'bg-[#e7f1ff] text-[#006bff]'}`}><Icon className="h-4 w-4"/></span></div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-[#0b3558]">{value}</div><div className={`mt-2 text-xs font-medium ${color==='red'?'text-[#ef4444]':'text-[#476788]'}`}>{note}</div>
        </div>)}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-[#d4e0ed] px-6 py-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Текущая оценка</h2><p className="mt-1 text-sm text-[#476788]">Что происходит, почему это важно и что делать дальше</p></div><Badge color="red">Средний репутационный риск</Badge></div></div>
        <div className="grid lg:grid-cols-[1.25fr_1fr]">
          <div className="p-6 lg:border-r lg:border-[#d4e0ed]"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#006bff]"><Sparkles className="h-5 w-5"/></span><div><div className="text-xs font-semibold uppercase text-[#006bff]">Вывод аналитики</div><p className="mt-2 text-base leading-7 text-[#0b3558]">Интерес к бренду растет, но выдача пока слабо контролируется. Основной риск формируют материалы о переносе запуска: один из них поднялся на третью позицию Яндекса.</p></div></div></div>
          <div className="grid grid-cols-2 border-t border-[#d4e0ed] lg:border-t-0">{[['Главная тема','Запуск продукта'],['Главное изменение','#8 → #3'],['Источник риска','business-review.ru'],['Следующий шаг','Усилить Top-10']].map(([label,value],index)=><div key={label} className={`p-5 ${index<2?'border-b border-[#d4e0ed]':''} ${index%2===0?'border-r border-[#d4e0ed]':''}`}><div className="text-xs text-[#476788]">{label}</div><div className="mt-2 break-words text-sm font-semibold text-[#0b3558]">{value}</div></div>)}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Динамика поискового интереса</h2><p className="mt-1 text-sm text-[#476788]">Запросы с названием бренда · последние 14 дней</p></div><Badge color="blue">Wordstat · 12 430</Badge></div>
          <div className="p-6"><div className="flex h-44 items-end gap-2 border-b border-[#d4e0ed] sm:gap-4">{scanBars.map((height,index)=><div key={scanLabels[index]} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"><div className="rounded-t-md bg-[#006bff]" style={{height:`${height}%`}}/><div className="hidden pb-2 text-center text-[10px] text-[#6f88a3] sm:block">{scanLabels[index]}</div></div>)}</div><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#476788]"><span><strong className="text-[#0b3558]">+38%</strong> к предыдущему периоду</span><span><strong className="text-[#0b3558]">7%</strong> негативный интент</span><span><strong className="text-[#0b3558]">Москва</strong> максимальный интерес</span></div></div>
        </div>
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-[#d4e0ed] px-6 py-5"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Каналы присутствия</h2><p className="mt-1 text-sm text-[#476788]">Где формируется информационное поле</p></div><button type="button" className="text-sm font-semibold text-[#006bff]" onClick={()=>{setSection('Аналитика');setWorkspaceTab('Каналы');}}>Подробнее</button></div>
          <div className="grid grid-cols-2">{channelMetrics.map((item,index)=>{const Icon=item.icon;return <div key={item.name} className={`p-5 ${index<2?'border-b border-[#d4e0ed]':''} ${index%2===0?'border-r border-[#d4e0ed]':''}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-[#476788]">{item.name}</span><Icon className={`h-4 w-4 ${item.tone==='red'?'text-[#ef4444]':'text-[#006bff]'}`}/></div><div className="mt-2 text-xl font-semibold tabular-nums text-[#0b3558]">{item.value}</div><div className="mt-1 text-xs text-[#476788]">{item.label}</div><div className={`mt-2 text-[11px] font-medium ${item.tone==='red'?'text-[#ef4444]':'text-[#006bff]'}`}>{item.note}</div></div>;})}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Как сформировался всплеск</h2><p className="mt-1 text-sm text-[#476788]">Связь публикаций, Telegram, спроса и поисковой выдачи</p></div>
          <div className="p-6"><div className="grid gap-3 md:grid-cols-4">{[
            ['15 сен · 09:20','Публикация в СМИ','business-review.ru',Newspaper],
            ['15 сен · 11:40','Всплеск в Telegram','12 каналов · 186 тыс.',MessageCircle],
            ['15–16 сен','Рост поиска','+64% брендовых запросов',TrendingUp],
            ['16 сен · 08:00','Изменение SERP','негативный URL #8 → #3',Search],
          ].map(([time,title,note,Icon],index)=><div key={title} className="relative rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="flex items-center justify-between"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${index===1?'bg-[#fff1f1] text-[#ef4444]':'bg-[#e7f1ff] text-[#006bff]'}`}><Icon className="h-4 w-4"/></span>{index<3&&<ArrowRight className="hidden h-4 w-4 text-[#a6bbd1] md:block"/>}</div><div className="mt-3 text-[11px] font-medium text-[#6f88a3]">{time}</div><div className="mt-1 text-sm font-semibold text-[#0b3558]">{title}</div><div className="mt-1 text-xs leading-5 text-[#476788]">{note}</div></div>)}</div><div className="mt-4 rounded-xl border border-[#d4e0ed] bg-white p-4 text-sm leading-6 text-[#0b3558]"><strong>Вывод:</strong> обсуждение в Telegram усилило исходную публикацию и сформировало дополнительный поисковый интерес. Рост запроса совпал с подъемом негативного URL в Яндексе.</div></div>
        </div>
        <div className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Структура спроса</h2><p className="mt-1 text-sm text-[#476788]">Что именно пользователи ищут</p></div>
          <div className="p-6"><div className="flex h-3 overflow-hidden rounded-full">{demandIntents.map(([name,value,color])=><div key={name} title={`${name}: ${value}%`} style={{width:`${value}%`,backgroundColor:color}}/>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{demandIntents.map(([name,value,color])=><div key={name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-[#476788]"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:color}}/>{name}</span><strong className="text-[#0b3558]">{value}%</strong></div>)}</div><div className="mt-5 border-t border-[#d4e0ed] pt-4"><div className="text-xs font-semibold uppercase text-[#6f88a3]">Растущие запросы</div><div className="mt-3 space-y-3">{[['neuroreel запуск','+184%'],['neuroreel отзывы','+92%'],['neuroreel перенос','+71%']].map(([term,growth])=><div key={term} className="flex items-center justify-between gap-3 text-sm"><span className="text-[#0b3558]">{term}</span><span className="font-semibold text-[#ef4444]">{growth}</span></div>)}</div></div></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-[#d4e0ed] px-6 py-5"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Ключевые тематики</h2><p className="mt-1 text-sm text-[#476788]">Доля в релевантных материалах</p></div><button type="button" className="text-sm font-semibold text-[#006bff]" onClick={()=>{setSection('Аналитика');setWorkspaceTab('Темы');}}>Подробнее</button></div>
          <div className="divide-y divide-[#d4e0ed]">{topics.map(([name,value,tone,color])=><div key={name} className="flex items-center gap-4 px-6 py-4"><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium text-[#0b3558]">{name}</span><span className="text-sm font-semibold tabular-nums text-[#0b3558]">{value}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8eef5]"><div className="h-full rounded-full bg-[#006bff]" style={{width:`${value}%`}}/></div></div><Badge color={color}>{tone}</Badge></div>)}</div>
        </div>
        <div className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Рекомендации</h2><p className="mt-1 text-sm text-[#476788]">Приоритетные действия на основе анализа</p></div>
          <div className="divide-y divide-[#d4e0ed]">{[['Высокий','Закрепить официальный материал о запуске продукта','Подобрать 3–5 профильных площадок'],['Высокий','Опубликовать кейсы пилотных клиентов','Усилить коммерческие и отзывные запросы'],['Средний','Обновить интервью основателей','Снизить влияние устаревшего нарратива']].map(([priority,title,text],index)=><div key={title} className="flex gap-4 p-5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e7f1ff] text-sm font-bold text-[#006bff]">{index+1}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><div className="text-sm font-semibold text-[#0b3558]">{title}</div><Badge color={priority==='Высокий'?'red':'amber'}>{priority}</Badge></div><p className="mt-1 text-xs leading-5 text-[#476788]">{text}</p></div></div>)}</div>
          <div className="border-t border-[#d4e0ed] p-5"><DemoButton className="w-full" onClick={()=>navigate('catalog')}>Подобрать площадки в PR-Market<ArrowRight className="h-4 w-4"/></DemoButton></div>
        </div>
      </div>
    </div>:<div className="space-y-5">
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex max-w-full gap-1 overflow-x-auto border-b border-[#d4e0ed] p-3">{['Материалы','Поисковая выдача','Темы','Каналы','Сети источников'].map(tab=><button key={tab} type="button" onClick={()=>setWorkspaceTab(tab)} className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold ${workspaceTab===tab?'bg-[#e7f1ff] text-[#006bff]':'text-[#476788] hover:bg-[#f0f3f8]'}`}>{tab}</button>)}</div>
        {workspaceTab==='Материалы'&&<div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f88a3]"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск по материалам, источникам и темам" className="h-11 w-full rounded-lg border border-[#d4e0ed] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label><PrototypeSelect value={channel} options={['Все каналы','СМИ','Telegram','Open web']} onChange={setChannel}/><PrototypeSelect value={engine} options={['Все системы','Яндекс','Google']} onChange={setEngine}/></div>}
      </div>

      {workspaceTab==='Материалы'&&<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-[#d4e0ed] px-5 py-4"><div><h2 className="font-display text-base font-bold text-[#0b3558]">Найденные материалы</h2><p className="mt-1 text-xs text-[#476788]">{materialTotal} результатов · показано {materialRangeStart}–{materialRangeEnd}</p></div><button type="button" aria-label="Скачать список" title="Скачать список" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#476788] hover:bg-[#f0f3f8]"><Download className="h-5 w-5"/></button></div>
          <div className="divide-y divide-[#d4e0ed]">{visible.map(item=><button key={`${materialPage}-${item.id}`} type="button" onClick={()=>setSelected(item)} className={`w-full p-5 text-left transition-colors hover:bg-[#f8f9fb] ${selected.id===item.id?'bg-[#f1f6ff]':'bg-white'}`}><div className="flex items-start gap-4"><div className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border bg-white px-2 text-sm font-semibold ${item.channel==='Telegram'?'border-[#ef4444] text-[#ef4444]':'border-[#d4e0ed] text-[#0b3558]'}`}>{item.position?`#${item.position}`:<MessageCircle className="h-4 w-4"/>}</div><div className="min-w-0 flex-1"><div className="text-sm font-semibold leading-5 text-[#0b3558]">{item.title}</div><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#476788]"><span>{item.domain}</span><span>{item.channel}</span>{item.channel!=='Telegram'&&<span>{item.engine}</span>}<span>{item.date}</span><Badge color={item.sentimentColor}>{item.sentiment}</Badge></div></div></div></button>)}{!visible.length&&<div className="p-8 text-center text-sm text-[#476788]">По заданным условиям материалов не найдено.</div>}</div>
          {!!visible.length&&<div className="flex flex-col gap-3 border-t border-[#d4e0ed] bg-[#f8f9fb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs text-[#476788]">{materialRangeStart}–{materialRangeEnd} из {materialTotal}</div><div className="flex items-center gap-1"><button type="button" aria-label="Предыдущая страница" disabled={materialPage===1} onClick={()=>setMaterialPage(page=>Math.max(1,page-1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button>{materialPages.map((page,index)=>page==='…'?<span key={`ellipsis-${index}`} className="flex h-9 w-7 items-center justify-center text-sm text-[#6f88a3]">…</span>:<button key={page} type="button" onClick={()=>setMaterialPage(Number(page))} className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${materialPage===page?'border-[#006bff] bg-[#006bff] text-white':'border-[#d4e0ed] bg-white text-[#0b3558] hover:bg-[#f0f3f8]'}`}>{page}</button>)}<button type="button" aria-label="Следующая страница" disabled={materialPage===materialPageCount} onClick={()=>setMaterialPage(page=>Math.min(materialPageCount,page+1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div></div>}
        </div>
        <div className={`${cardClass} self-start overflow-hidden`}><div className="border-b border-[#d4e0ed] px-5 py-4"><div className="flex items-center justify-between gap-3"><Badge color={selected.riskColor}>{selected.risk} риск</Badge><span className="text-xs text-[#476788]">{selected.position?`${selected.engine} · #${selected.position}`:selected.channel}</span></div><h2 className="mt-4 font-display text-lg font-bold leading-6 text-[#0b3558]">{selected.title}</h2><a href={selected.url} target="_blank" rel="noreferrer" className="mt-2 flex min-w-0 items-center gap-1.5 break-all text-xs text-[#006bff] hover:text-[#004eba]">{selected.url}<ExternalLink className="h-3.5 w-3.5 shrink-0"/></a>{selected.reach&&<div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#476788]"><Eye className="h-3.5 w-3.5 text-[#006bff]"/>{selected.reach}</div>}</div><div className="divide-y divide-[#d4e0ed]">{[['Краткое содержание',selected.summary],['Ключевое утверждение',selected.claim],['Влияние на репутацию',selected.impact]].map(([label,text])=><div key={label} className="p-5"><div className="text-xs font-semibold uppercase text-[#6f88a3]">{label}</div><p className="mt-2 text-sm leading-6 text-[#0b3558]">{text}</p></div>)}</div></div>
      </div>}

      {workspaceTab==='Поисковая выдача'&&<div className="space-y-6">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-[#d4e0ed] px-6 py-5 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Что видит пользователь в поиске</h2><p className="mt-1 text-sm text-[#476788]">Первые пять результатов по выбранному запросу</p></div><div className="w-full lg:w-64"><PrototypeSelect value={serpQuery} options={['neuroreel','neuroreel отзывы','neuroreel платформа','neuroreel команда']} onChange={setSerpQuery}/></div></div>
          <div className="grid border-b border-[#d4e0ed] bg-[#f8f9fb] sm:grid-cols-3">{[['Частотность','6 240 / месяц'],['Контроль Top-10','4 результата'],['Негатив в Top-10','3 результата']].map(([label,value],index)=><div key={label} className={`px-6 py-4 ${index<2?'border-b border-[#d4e0ed] sm:border-b-0 sm:border-r':''}`}><div className="text-xs text-[#476788]">{label}</div><div className={`mt-1 text-sm font-semibold ${index===2?'text-[#ef4444]':'text-[#0b3558]'}`}>{value}</div></div>)}</div>
          <div className="grid lg:grid-cols-2">
            {serpPanels.map(([searchEngine,updated,results],engineIndex)=><div key={searchEngine} className={engineIndex===0?'border-b border-[#d4e0ed] lg:border-b-0 lg:border-r':''}><div className="flex items-center justify-between gap-3 border-b border-[#d4e0ed] px-5 py-4"><div className="font-semibold text-[#0b3558]">{searchEngine} · Top-5</div><div className="text-xs text-[#6f88a3]">{updated}</div></div><div className="divide-y divide-[#d4e0ed]">{results.map(([position,domain,title,status,color,change])=><div key={`${searchEngine}-${position}`} className="flex items-start gap-3 px-5 py-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f3f8] text-sm font-semibold text-[#0b3558]">{position}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 text-xs font-medium text-[#006bff]"><span className="truncate">{domain}</span><ExternalLink className="h-3 w-3 shrink-0"/></div><div className="mt-1 truncate text-sm font-semibold text-[#0b3558]">{title}</div><div className="mt-2 flex flex-wrap items-center gap-2"><Badge color={color}>{status}</Badge><span className={`text-xs font-semibold ${String(change).startsWith('+')&&status==='Негативный'?'text-[#ef4444]':'text-[#476788]'}`}>{change==='—'?'Без изменений':`${change} позиции`}</span></div></div></div>)}</div></div>)}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Поисковый интент</h2><p className="mt-1 text-sm text-[#476788]">Структура запросов за последние 30 дней</p></div><div className="p-6"><div className="flex h-3 overflow-hidden rounded-full">{demandIntents.map(([name,value,color])=><div key={name} style={{width:`${value}%`,backgroundColor:color}}/>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{demandIntents.map(([name,value,color])=><div key={name} className="flex items-center justify-between rounded-lg border border-[#d4e0ed] px-3 py-2.5 text-sm"><span className="flex items-center gap-2 text-[#476788]"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:color}}/>{name}</span><strong className="text-[#0b3558]">{value}%</strong></div>)}</div></div></div>
          <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">География интереса</h2><p className="mt-1 text-sm text-[#476788]">Доля запросов и аномально высокий интерес</p></div><div className="divide-y divide-[#d4e0ed]">{[['Москва','32%','1,4×'],['Санкт-Петербург','14%','1,2×'],['Татарстан','6%','1,8×'],['Краснодарский край','5%','1,1×']].map(([region,share,affinity])=><div key={region} className="flex items-center gap-3 px-6 py-3.5"><MapPin className="h-4 w-4 shrink-0 text-[#006bff]"/><span className="min-w-0 flex-1 text-sm font-medium text-[#0b3558]">{region}</span><span className="text-sm text-[#476788]">{share}</span><Badge color="blue">Индекс {affinity}</Badge></div>)}</div></div>
        </div>
      </div>}

      {workspaceTab==='Темы'&&<div className="grid gap-6 lg:grid-cols-2">{topics.map(([name,value,tone,color],index)=><div key={name} className={`${cardClass} p-6`}><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase text-[#6f88a3]">Тема {index+1}</div><h2 className="mt-2 font-display text-lg font-bold text-[#0b3558]">{name}</h2></div><Badge color={color}>{tone}</Badge></div><p className="mt-4 text-sm leading-6 text-[#476788]">{index===1?'Тема растет быстрее остальных и связана с переносом публичного запуска продукта.':'Тема стабильно присутствует в профильных публикациях и брендовой поисковой выдаче.'}</p><div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eef5]"><div className="h-full rounded-full bg-[#006bff]" style={{width:`${Math.min(Number(value)*2.4,100)}%`}}/></div><span className="text-sm font-semibold text-[#0b3558]">{value}%</span></div></div>)}</div>}

      {workspaceTab==='Каналы'&&<div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{channelMetrics.map(item=>{const Icon=item.icon;return <div key={item.name} className={`${cardClass} p-5`}><div className="flex items-center justify-between"><span className="text-sm font-medium text-[#476788]">{item.name}</span><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone==='red'?'bg-[#fff1f1] text-[#ef4444]':'bg-[#e7f1ff] text-[#006bff]'}`}><Icon className="h-4 w-4"/></span></div><div className="mt-3 text-2xl font-semibold tabular-nums text-[#0b3558]">{item.value}</div><div className="mt-1 text-xs text-[#476788]">{item.label}</div><div className={`mt-2 text-xs font-medium ${item.tone==='red'?'text-[#ef4444]':'text-[#006bff]'}`}>{item.note}</div></div>;})}</div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`${cardClass} overflow-hidden`}><div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Telegram: динамика распространения</h2><p className="mt-1 text-sm text-[#476788]">Упоминания, просмотры и пересылки по дням</p></div><Badge color="red">Риск растет</Badge></div><div className="p-6"><div className="grid grid-cols-3 gap-3">{[['18','упоминаний'],['1,4 млн','потенциальный охват'],['736','пересылок']].map(([value,label])=><div key={label} className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xl font-semibold tabular-nums text-[#0b3558]">{value}</div><div className="mt-1 text-xs leading-5 text-[#476788]">{label}</div></div>)}</div><div className="mt-6 flex h-40 items-end gap-2 border-b border-[#d4e0ed]">{[12,18,26,34,78,56,42,31].map((height,index)=><div key={index} className="flex h-full flex-1 items-end"><div className={`w-full rounded-t-md ${index===4?'bg-[#ef4444]':'bg-[#8bb9ff]'}`} style={{height:`${height}%`}}/></div>)}</div><div className="mt-3 flex items-center gap-2 text-xs text-[#476788]"><Activity className="h-4 w-4 text-[#ef4444]"/>Пик 15 сентября после публикации в канале Digital Inside</div></div></div>
          <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Ключевые Telegram-источники</h2><p className="mt-1 text-sm text-[#476788]">Вклад в общий охват сюжета</p></div><div className="divide-y divide-[#d4e0ed]">{[['Digital Inside','186 тыс.','412','Негативная'],['AI Product News','94 тыс.','128','Нейтральная'],['Русский венчур','73 тыс.','91','Нейтральная'],['Технологии бизнеса','48 тыс.','54','Смешанная']].map(([name,reach,reposts,tone],index)=><div key={name} className="flex items-center gap-3 px-5 py-4"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${index===0?'bg-[#fff1f1] text-[#ef4444]':'bg-[#e7f1ff] text-[#006bff]'}`}><Radio className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#0b3558]">{name}</div><div className="mt-1 text-xs text-[#476788]">{reach} просмотров · {reposts} пересылок</div></div><Badge color={tone==='Негативная'?'red':tone==='Смешанная'?'amber':'blue'}>{tone}</Badge></div>)}</div></div>
        </div>
        <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Вклад каналов в темы</h2><p className="mt-1 text-sm text-[#476788]">Где возникает и где усиливается каждый нарратив</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] divide-y divide-[#d4e0ed]"><thead className="bg-[#f8f9fb]"><tr>{['Тема','Поиск','СМИ','Telegram','Open web','Динамика'].map(head=><th key={head} className="px-6 py-3 text-left text-xs font-medium uppercase text-[#476788]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#d4e0ed]">{[['Запуск продукта','26%','31%','42%','18%','+68%'],['Продукт и технологии','34%','38%','21%','29%','+12%'],['Отзывы клиентов','14%','9%','18%','32%','+7%'],['Команда и основатели','18%','17%','11%','15%','−3%']].map((row,rowIndex)=><tr key={row[0]}>{row.map((value,index)=><td key={`${row[0]}-${index}`} className={`px-6 py-4 text-sm ${index===0?'font-semibold text-[#0b3558]':index===5&&rowIndex===0?'font-semibold text-[#ef4444]':'text-[#476788]'}`}>{value}</td>)}</tr>)}</tbody></table></div></div>
      </div>}

      {workspaceTab==='Сети источников'&&<div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Масштаб сети</h2><p className="mt-1 text-sm text-[#476788]">Вокруг главного негативного материала</p></div><div className="grid grid-cols-2">{[['Копии и пересказы','14'],['Ссылающиеся домены','37'],['Обратные ссылки','126'],['Рисковые домены','11'],['Разные подсети','7'],['URL в Top-20','5']].map(([label,value],index)=><div key={label} className={`p-5 ${index<4?'border-b border-[#d4e0ed]':''} ${index%2===0?'border-r border-[#d4e0ed]':''}`}><div className="text-2xl font-semibold text-[#0b3558]">{value}</div><div className="mt-1 text-xs leading-5 text-[#476788]">{label}</div></div>)}</div></div>
        <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Цепочка распространения</h2><p className="mt-1 text-sm text-[#476788]">Источник, копии и усиливающие домены</p></div><div className="p-6"><div className="rounded-lg border border-[#ef4444] bg-[#fff7f7] p-4"><div className="text-xs font-semibold uppercase text-[#ef4444]">Исходный материал</div><div className="mt-1 text-sm font-semibold text-[#0b3558]">business-review.ru · позиция #3</div></div><div className="ml-6 border-l-2 border-[#d4e0ed] pl-6 pt-4"><div className="space-y-3">{[['news-copy.ru','Почти полная копия · #14'],['industry-digest.ru','Пересказ со ссылкой · #18'],['media-monitor.net','12 исходящих ссылок на копии']].map(([domain,note])=><div key={domain} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#0b3558]"><Link2 className="h-4 w-4 text-[#006bff]"/>{domain}</div><div className="mt-1 text-xs text-[#476788]">{note}</div></div>)}</div></div></div></div>
      </div>}
    </div>}
  </div>;
}
