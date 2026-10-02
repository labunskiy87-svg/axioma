import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {api} from './api';
import {useBackend} from './prototype-backend';
import {ReputationLiveContent} from './reputation-live';
import {ReputationSourceLink,reputationCardClass} from './reputation-components';
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
  LoaderCircle,
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

const cardClass=reputationCardClass;

const Badge=({children,color='gray'})=>{
  const colors={
    gray:'bg-[#f0f3f8] text-[#004eba] border-[#f0f3f8]',
    green:'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    blue:'bg-[#e6f0ff] text-[#004eba] border-[#e6f0ff]',
    amber:'bg-[#f0f3f8] text-[#0b3558] border-[#d4e0ed]',
    red:'bg-white text-[#ef4444] border-[#ef4444]',
  };
  return <span className={`inline-flex w-fit max-w-full min-w-0 items-center break-words rounded-full border px-2.5 py-1 text-xs font-medium ${colors[color]}`}>{children}</span>;
};

const DemoButton=({children,variant='primary',className='',...props})=>{
  const styles=variant==='primary'
    ?'border-[#006bff] bg-[#006bff] text-white hover:bg-[#0057d6]'
    :'border-[#d4e0ed] bg-white text-[#0b3558] hover:bg-[#f0f3f8]';
  return <button type="button" className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors ${styles} ${className}`} {...props}>{children}</button>;
};

export const PrototypeSelect=({value,options,onChange,className=''})=>{
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

const TopicFilter=({options,selected,onChange})=>{
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState('');
  const [position,setPosition]=useState(null);
  const triggerRef=useRef(null);
  const panelRef=useRef(null);
  const filtered=options.filter(option=>option.toLowerCase().includes(search.trim().toLowerCase()));
  const updatePosition=()=>{
    const rect=triggerRef.current?.getBoundingClientRect();
    if(!rect)return;
    const padding=12;
    const width=Math.min(Math.max(rect.width,320),window.innerWidth-padding*2);
    const left=Math.max(padding,Math.min(rect.right-width,window.innerWidth-width-padding));
    const panelHeight=Math.min(380,window.innerHeight-padding*2);
    const below=window.innerHeight-rect.bottom-padding;
    const top=below>=panelHeight||below>=rect.top ? rect.bottom+6 : Math.max(padding,rect.top-panelHeight-6);
    setPosition({left,top,width,maxHeight:panelHeight});
  };
  useEffect(()=>{
    if(!open){setSearch('');return;}
    updatePosition();
    const close=event=>{if(!triggerRef.current?.contains(event.target)&&!panelRef.current?.contains(event.target))setOpen(false);};
    const escape=event=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('pointerdown',close);
    document.addEventListener('keydown',escape);
    window.addEventListener('resize',updatePosition);
    window.addEventListener('scroll',updatePosition,true);
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);window.removeEventListener('resize',updatePosition);window.removeEventListener('scroll',updatePosition,true);};
  },[open]);
  const toggle=option=>onChange(selected.includes(option)?selected.filter(item=>item!==option):[...selected,option]);
  return <div ref={triggerRef} className="relative">
    <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(value=>!value)} className="flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-[#476788] bg-white px-4 text-left text-sm font-medium text-[#0b3558] outline-none focus:ring-2 focus:ring-[#006bff]">
      <span className="flex min-w-0 items-center gap-2"><span className="truncate">Тематики</span>{selected.length>0&&<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e6f0ff] px-1.5 text-[11px] font-semibold text-[#004eba]">{selected.length}</span>}</span><ChevronDown className={`h-4 w-4 shrink-0 text-[#476788] transition-transform ${open?'rotate-180':''}`}/>
    </button>
    {open&&position&&createPortal(<div ref={panelRef} role="dialog" aria-label="Фильтр по тематикам" style={position} className="fixed z-[220] flex overflow-hidden rounded-2xl border border-[#d4e0ed] bg-white shadow-[rgba(11,53,88,0.08)_0px_10px_24px,rgba(11,53,88,0.10)_0px_24px_60px]">
      <div className="flex min-h-0 w-full flex-col"><div className="border-b border-[#d4e0ed] p-3"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f88a3]"/><input autoFocus aria-label="Поиск тематики" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Найти тематику" className="h-10 w-full rounded-lg border border-[#d4e0ed] pl-10 pr-3 text-sm text-[#0b3558] outline-none focus:border-[#006bff]"/></label></div><div className="min-h-0 flex-1 overflow-y-auto p-2">{filtered.map(option=><label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#0b3558] hover:bg-[#f8f9fb]"><input type="checkbox" checked={selected.includes(option)} onChange={()=>toggle(option)} className="h-4 w-4 accent-[#006bff]"/><span className="min-w-0 flex-1 break-words">{option}</span></label>)}{!filtered.length&&<div className="px-3 py-8 text-center text-sm text-[#6f88a3]">Тематики не найдены</div>}</div><div className="flex items-center justify-between gap-3 border-t border-[#d4e0ed] bg-[#f8f9fb] p-3"><button type="button" disabled={!selected.length} onClick={()=>onChange([])} className="text-sm font-semibold text-[#476788] disabled:opacity-40">Сбросить</button><button type="button" onClick={()=>setOpen(false)} className="h-9 rounded-lg bg-[#006bff] px-4 text-sm font-semibold text-white">Готово</button></div></div>
    </div>,document.body)}
  </div>;
};

const materials=[
  {
    id:'RM-105',position:null,engine:'Telegram',channel:'Telegram',
    title:'Обсуждение переноса публичного запуска Neuroreel',
    domain:'t.me/digital_inside',url:'https://t.me/digital_inside/1842',
    sentiment:'Негативная',sentimentColor:'red',risk:'Высокий',riskColor:'red',topic:'Запуск продукта',date:'16.09.2026',
    summary:'Пост получил заметное число просмотров. В следующие сутки были зафиксированы повторные публикации и рост поискового спроса на бренд на 64%.',
    claim:'Авторы канала связывают перенос запуска с неготовностью продукта к масштабированию.',
    impact:'Публикация получила 186 тыс. просмотров и 412 пересылок. Рост спроса и изменения выдачи произошли в тот же период, но причинная связь не установлена.',
    reach:'186 тыс. просмотров · 412 пересылок',
    contentStatus:'Текст из TGStat',
  },
  {
    id:'RM-104',position:3,engine:'Яндекс',channel:'Медиа',
    title:'Почему запуск новой платформы Neuroreel перенесли на осень',
    domain:'business-review.ru',url:'https://business-review.ru/technology/neuroreel-launch',
    sentiment:'Негативная',sentimentColor:'red',risk:'Высокий',riskColor:'red',topic:'Запуск продукта',date:'15.09.2026',
    summary:'Материал связывает перенос запуска с недостаточной готовностью продукта и находится в верхней части брендовой выдачи.',
    claim:'Срок публичного запуска был перенесен после закрытого тестирования.',
    impact:'Высокая позиция формирует у потенциальных клиентов сомнение в готовности продукта до знакомства с официальными материалами.',
    contentStatus:'Полный текст',
  },
  {
    id:'RM-103',position:5,engine:'Google',channel:'Медиа',
    title:'Neuroreel представила инструменты аналитики для корпоративных команд',
    domain:'techmedia.ru',url:'https://techmedia.ru/news/neuroreel-analytics',
    sentiment:'Позитивная',sentimentColor:'green',risk:'Низкий',riskColor:'green',topic:'Продукт',date:'12.09.2026',
    summary:'Профильный обзор продукта с акцентом на практические сценарии аналитики и запуск пилотных проектов.',
    claim:'Компания открыла доступ к пилотной версии для корпоративных клиентов.',
    impact:'Материал усиливает продуктовую экспертизу и может стать опорной страницей в контролируемой выдаче.',
    contentStatus:'Полный текст',
  },
  {
    id:'RM-102',position:7,engine:'Яндекс',channel:'Open web',
    title:'Основатели Neuroreel о рынке генеративного видео и планах компании',
    domain:'vc.ru',url:'https://vc.ru/ai/neuroreel-interview',
    sentiment:'Нейтральная',sentimentColor:'blue',risk:'Средний',riskColor:'amber',topic:'Команда',date:'08.09.2026',
    summary:'Интервью раскрывает стратегию и команду, но часть комментариев в выдаче связана с задержкой публичного релиза.',
    claim:'Основатели планируют расширить продукт на международный рынок после завершения пилотов.',
    impact:'Публикация поддерживает экспертный образ, но требует усиления актуальными подтверждениями результатов.',
    contentStatus:'Полный текст',
  },
  {
    id:'RM-101',position:9,engine:'Google',channel:'Open web',
    title:'Отзывы первых команд о закрытом тестировании Neuroreel',
    domain:'productnews.ru',url:'https://productnews.ru/reviews/neuroreel-beta',
    sentiment:'Смешанная',sentimentColor:'amber',risk:'Средний',riskColor:'amber',topic:'Отзывы',date:'03.09.2026',
    summary:'В обзоре отмечены сильные аналитические функции, но также упомянуты ограничения ранней версии интерфейса.',
    claim:'Пользователи положительно оценивают аналитику, но ожидают более стабильную работу редактора.',
    impact:'Материал присутствует по коммерческим запросам. Для сопоставления стоит добавить свежие подтвержденные кейсы.',
    contentStatus:'Анализ сниппета',
  },
];

const negativeMaterials=materials.filter(item=>item.sentiment==='Негативная');
const negativeProfiles={
  'RM-104':{
    topics:['Перенос запуска','Готовность продукта'],
    network:'Признаки ссылочной сети',networkStatus:'Высокая уверенность',networkColor:'red',
    networkEvidence:'11 spam-доменов · 7 общих Class C',
    distribution:'37 ссылающихся доменов · 126 backlinks',
    graphAvailable:true,
  },
  'RM-105':{
    topics:['Перенос запуска','Масштабирование'],
    network:'Backlink-анализ не применяется',networkStatus:'Telegram',networkColor:'gray',
    networkEvidence:'12 похожих публикаций · 8 каналов',
    distribution:'186 тыс. просмотров · 412 пересылок',
    graphAvailable:false,
  },
};

const channelMetrics=[
  {name:'Поиск',icon:Search,value:'20',label:'результатов в Top-10',note:'4 контролируемых URL',tone:'blue'},
  {name:'Медиа',icon:Newspaper,value:'47',label:'найденных публикаций',note:'11 новых за 30 дней',tone:'blue'},
  {name:'Telegram',icon:MessageCircle,value:'1,4 млн',label:'просмотров публикаций',note:'18 упоминаний · 736 пересылок',tone:'red'},
  {name:'Open web',icon:Globe2,value:'63',label:'найденные страницы',note:'9 новых доменов',tone:'blue'},
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
    ['6','neuroreel.ai/blog','Новости продукта','Контролируемый','green','+2'],
    ['7','t.me/neuroreel','Официальный канал','Контролируемый','green','—'],
    ['8','reviews.example','Критика стабильности бета-версии','Негативный','red','+1'],
    ['9','neuroreel.ai/about','Команда Neuroreel','Контролируемый','green','−1'],
    ['10','discussion.example','Обсуждение задержки релиза','Негативный','red','+2'],
  ]],
  ['Google','Обновлено сегодня, 08:15',[
    ['1','neuroreel.ai','Официальный сайт','Контролируемый','green','—'],
    ['2','linkedin.com','Профиль компании Neuroreel','Контролируемый','green','—'],
    ['3','techmedia.ru','Инструменты аналитики для команд','Позитивный','green','+1'],
    ['4','vc.ru','Интервью с основателями','Нейтральный','blue','—'],
    ['5','business-review.ru','Почему запуск перенесли на осень','Негативный','red','+3'],
    ['6','neuroreel.ai/blog','Новости продукта','Контролируемый','green','+1'],
    ['7','productnews.ru','Отзывы о закрытом тестировании','Смешанный','amber','−1'],
    ['8','t.me/neuroreel','Официальный канал','Контролируемый','green','—'],
    ['9','reviews.example','Критика стабильности бета-версии','Негативный','red','+2'],
    ['10','discussion.example','Обсуждение задержки релиза','Негативный','red','+1'],
  ]],
] as const;

const aiSearchSnippets=[
  {
    name:'ChatGPT',
    provider:'Ahrefs Brand Radar',
    updated:'Проверено сегодня, 09:10',
    tone:'Смешанное представление',
    color:'amber',
    snippet:'Neuroreel описывается как платформа для генеративного видео и аналитики корпоративного контента. В открытых источниках также обсуждается перенос публичного запуска после закрытого тестирования.',
    sources:['neuroreel.ai','techmedia.ru','business-review.ru'],
  },
  {
    name:'Gemini',
    provider:'Ahrefs Brand Radar',
    updated:'Проверено сегодня, 09:14',
    tone:'Преимущественно нейтральное',
    color:'blue',
    snippet:'Neuroreel разрабатывает инструменты генеративного видео для команд. Профильные публикации отмечают пилотные проекты и аналитические функции, при этом дата широкого запуска переносилась.',
    sources:['neuroreel.ai','linkedin.com','productnews.ru'],
  },
  {
    name:'Alice AI',
    provider:'Yandex Generative Search',
    updated:'Проверено сегодня, 09:18',
    tone:'Репутационный риск',
    color:'red',
    snippet:'В ответах о Neuroreel заметен сюжет о переносе запуска. Официальный сайт находится в выдаче, но рядом с ним присутствуют публикации, связывающие перенос с готовностью продукта.',
    sources:['neuroreel.ai','business-review.ru','vc.ru'],
  },
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
  const [searchQueries,setSearchQueries]=useState(['']);
  const [relation,setRelation]=useState('');
  const [aliases,setAliases]=useState('');
  const [relatedObjects,setRelatedObjects]=useState('');
  const [description,setDescription]=useState('');
  const field={
    'Бренд':{name:'Название бренда',placeholder:'Например, Neuroreel',relation:'Компания-владелец',relationPlaceholder:'Название компании'},
    'Человек':{name:'Полное ФИО',placeholder:'Например, Иванов Иван Иванович',relation:'Компания и должность',relationPlaceholder:'Компания · должность'},
    'Компания':{name:'Название компании',placeholder:'Например, ООО «Альфа»',relation:'Сайт компании',relationPlaceholder:'https://example.ru'},
  }[type];
  const queryBase=name.trim()||field.placeholder.replace('Например, ','');
  const updateSearchQuery=(index,value)=>setSearchQueries(current=>current.map((item,itemIndex)=>itemIndex===index?value:item));
  const addSearchQuery=()=>setSearchQueries(current=>current.length>=5?current:[...current,'']);
  const removeSearchQuery=index=>setSearchQueries(current=>current.filter((_,itemIndex)=>itemIndex!==index));
  const normalizedQueries=searchQueries.map(item=>item.trim()).filter(Boolean).slice(0,5);
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
        <label className="block"><span className="text-sm font-medium text-[#476788]">{field.relation}</span><input value={relation} onChange={event=>setRelation(event.target.value)} placeholder={field.relationPlaceholder} className="mt-2 h-11 w-full rounded-lg border border-[#476788] bg-white px-4 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Варианты названия</span><textarea value={aliases} onChange={event=>setAliases(event.target.value)} placeholder={type==='Человек'?'Полное имя, латинское написание':'Сокращение, латинское написание'} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><span className="mt-1.5 block text-xs text-[#6f88a3]">Каждый вариант с новой строки</span></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Связанные объекты</span><textarea value={relatedObjects} onChange={event=>setRelatedObjects(event.target.value)} placeholder={type==='Человек'?'Компании, проекты, партнеры':'Продукты, руководители, связанные компании'} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><span className="mt-1.5 block text-xs leading-5 text-[#6f88a3]">Помогает отличать релевантные совпадения</span></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Краткое описание</span><textarea value={description} onChange={event=>setDescription(event.target.value)} placeholder="Контекст для анализа: сфера деятельности, продукты, география и важные факты" className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label>
      </div>
    </div>

    <div className="border-t border-[#d4e0ed] bg-[#f8f9fb] px-6 py-6 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-sm font-semibold text-[#0b3558]">Поисковые запросы</h3><p className="mt-1 text-xs leading-5 text-[#476788]">Добавьте до пяти запросов для первого сканирования. Позже их можно изменить в настройках мониторинга.</p></div><Badge color="gray">{searchQueries.length} из 5</Badge></div>
      <div className="mt-4 space-y-3">{searchQueries.map((item,index)=><div key={index} className="grid grid-cols-[28px_minmax(0,1fr)_40px] items-center gap-3"><span className="text-center text-xs font-semibold text-[#6f88a3]">{index+1}</span><input value={item} onChange={event=>updateSearchQuery(index,event.target.value)} aria-label={`Первичный поисковый запрос ${index+1}`} placeholder={index===0?queryBase:'Введите поисковый запрос'} className="h-10 min-w-0 rounded-lg border border-[#476788] bg-white px-3 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><button type="button" aria-label={`Удалить первичный запрос ${index+1}`} title="Удалить запрос" disabled={searchQueries.length===1} onClick={()=>removeSearchQuery(index)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] transition-colors hover:bg-[#eef2f7] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4"/></button></div>)}</div>
      <button type="button" onClick={addSearchQuery} disabled={searchQueries.length>=5} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-[#d4e0ed] bg-white px-3 text-xs font-semibold text-[#0b3558] transition-colors hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-3.5 w-3.5"/>Добавить запрос</button>
    </div>

    <div className="flex flex-col-reverse gap-3 border-t border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
      <DemoButton variant="secondary" onClick={hasExisting?onCancel:onOpenDemo}>{hasExisting?'Отмена':'Открыть демо'}</DemoButton>
      <DemoButton onClick={()=>onSave({name:name.trim()||queryBase,type,queries:normalizedQueries.length?normalizedQueries:[queryBase],profile:{relation:relation.trim(),aliases:aliases.split('\n').map(item=>item.trim()).filter(Boolean),relatedObjects:relatedObjects.split('\n').map(item=>item.trim()).filter(Boolean),description:description.trim()}})}><Search className="h-4 w-4"/>Запустить сканирование</DemoButton>
    </div>
  </div>;
};

const ReputationOnboarding=({onAdd,onOpenDemo})=><div className="space-y-6">
  <div>
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Репутация</h1>
    <p className="mt-2 text-sm text-[#476788]">Мониторинг поисковой выдачи, медиа, Telegram и открытого web</p>
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
          [MessageCircle,'Медиа и Telegram','Публикации, просмотры, тональность и ссылки'],
          [TrendingUp,'Аналитика и действия','Ключевые темы, факторы риска и рекомендации для размещений'],
        ].map(([Icon,title,text])=><div key={title} className="flex gap-4 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#006bff]"><Icon className="h-5 w-5"/></span><div><div className="text-sm font-semibold text-[#0b3558]">{title}</div><p className="mt-1 text-xs leading-5 text-[#476788]">{text}</p></div></div>)}</div>
        <div className="mt-5"><div className="flex items-center gap-2 text-sm font-semibold text-[#0b3558]"><CheckCircle2 className="h-4 w-4 text-[#006bff]"/>Первичная настройка</div><p className="mt-2 text-xs leading-5 text-[#476788]">Потребуются название, варианты написания и связанные объекты. Источники и интеграции подключаются позже.</p></div>
      </div>
    </div>
  </div>
</div>;

const MonitoringSettings=({subject,queries,period,region,officialSources,onSave,onCancel,onDelete})=>{
  const [draft,setDraft]=useState(queries.length?queries:[subject.name]);
  const [scanPeriod,setScanPeriod]=useState(period||'30 дней');
  const [searchRegion,setSearchRegion]=useState(region||'Москва');
  const [officialDraft,setOfficialDraft]=useState(officialSources.length?officialSources:['']);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const updateQuery=(index,value)=>setDraft(current=>current.map((item,itemIndex)=>itemIndex===index?value:item));
  const removeQuery=index=>setDraft(current=>current.filter((_,itemIndex)=>itemIndex!==index));
  const addQuery=()=>setDraft(current=>current.length>=5?current:[...current,'']);
  const updateOfficial=(index,value)=>setOfficialDraft(current=>current.map((item,itemIndex)=>itemIndex===index?value:item));
  const removeOfficial=index=>setOfficialDraft(current=>current.filter((_,itemIndex)=>itemIndex!==index));
  const addOfficial=()=>setOfficialDraft(current=>current.length>=30?current:[...current,'']);
  const normalized=draft.map(item=>item.trim()).filter(Boolean).slice(0,5);
  return <><div className="space-y-6">
    <div><div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки мониторинга</h1><Badge color="blue">{subject.name}</Badge></div><p className="mt-2 text-sm text-[#476788]">Запросы, регион и официальные ресурсы объекта</p></div>
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Поисковые запросы</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-[#476788]">Добавьте основные варианты, по которым нужно отслеживать спрос и поисковую выдачу. Не более пяти запросов на один объект.</p></div><Badge color="gray">{draft.length} из 5</Badge></div>
      <div className="px-6 py-6 sm:px-8"><div className="space-y-3">{draft.map((item,index)=><div key={index} className="grid grid-cols-[36px_minmax(0,1fr)_44px] items-center gap-3"><span className="text-center text-sm font-semibold text-[#6f88a3]">{index+1}</span><input value={item} onChange={event=>updateQuery(index,event.target.value)} aria-label={`Поисковый запрос ${index+1}`} placeholder="Введите поисковый запрос" className="h-11 min-w-0 rounded-lg border border-[#476788] bg-white px-4 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><button type="button" aria-label={`Удалить запрос ${index+1}`} title="Удалить запрос" disabled={draft.length===1} onClick={()=>removeQuery(index)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] transition-colors hover:bg-[#f0f3f8] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4"/></button></div>)}</div><button type="button" onClick={addQuery} disabled={draft.length>=5} className="ml-auto mt-4 flex h-10 w-fit items-center gap-2 rounded-lg border border-[#d4e0ed] bg-white px-4 text-sm font-semibold text-[#0b3558] transition-colors hover:bg-[#f0f3f8] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4"/>Добавить запрос</button></div>
      <div className="border-t border-[#d4e0ed] px-6 py-6 sm:px-8"><h3 className="text-sm font-semibold text-[#0b3558]">Официальные сайты и профили</h3><p className="mt-1 text-xs leading-5 text-[#476788]">Только эти адреса считаются контролируемыми результатами.</p><div className="mt-4 space-y-3">{officialDraft.map((item,index)=><div key={index} className="grid grid-cols-[36px_minmax(0,1fr)_44px] items-center gap-3"><span className="text-center text-sm font-semibold text-[#6f88a3]">{index+1}</span><input value={item} onChange={event=>updateOfficial(index,event.target.value)} aria-label={`Официальный сайт или профиль ${index+1}`} placeholder="https://example.ru" className="h-11 min-w-0 rounded-lg border border-[#476788] bg-white px-4 text-sm text-[#0b3558] outline-none placeholder:text-[#a0aabc] focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/><button type="button" aria-label={`Удалить официальный сайт или профиль ${index+1}`} title="Удалить адрес" disabled={officialDraft.length===1} onClick={()=>removeOfficial(index)} className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] transition-colors hover:bg-[#f0f3f8] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4"/></button></div>)}</div><button type="button" onClick={addOfficial} disabled={officialDraft.length>=30} className="ml-auto mt-4 flex h-10 w-fit items-center gap-2 rounded-lg border border-[#d4e0ed] bg-white px-4 text-sm font-semibold text-[#0b3558] transition-colors hover:bg-[#f0f3f8] disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4"/>Добавить адрес</button></div>
      <div className="grid gap-4 border-t border-[#d4e0ed] px-6 py-6 sm:px-8 md:grid-cols-[minmax(0,1fr)_220px] md:items-center"><div><h3 className="text-sm font-semibold text-[#0b3558]">Регион поиска</h3><p className="mt-1 text-xs leading-5 text-[#476788]">Используется для сопоставимых снимков выдачи.</p></div><PrototypeSelect value={searchRegion} options={['Москва','Санкт-Петербург','Россия']} onChange={setSearchRegion}/></div>
      <div className="border-t border-[#d4e0ed] px-6 py-6 sm:px-8"><div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center"><div><h3 className="text-sm font-semibold text-[#0b3558]">Период публикаций</h3><p className="mt-1 text-xs leading-5 text-[#476788]">Применяется к публикациям, Telegram и спросу. Выдача и AI-ответы фиксируются на момент сканирования.</p></div><PrototypeSelect value={scanPeriod} options={['7 дней','14 дней','30 дней']} onChange={setScanPeriod}/></div></div>
      <div className="flex flex-col gap-3 border-t border-[#d4e0ed] bg-[#f8f9fb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><button type="button" onClick={()=>setConfirmDelete(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#ef4444] bg-white px-5 text-sm font-semibold text-[#ef4444] transition-colors hover:bg-[#fff1f1]"><Trash2 className="h-4 w-4"/>Удалить объект</button><div className="flex flex-col-reverse gap-3 sm:flex-row"><DemoButton variant="secondary" onClick={onCancel}>Отмена</DemoButton><DemoButton onClick={()=>onSave({queries:normalized.length?normalized:[subject.name],period:scanPeriod,region:searchRegion,officialSources:officialDraft.map(item=>item.trim()).filter(Boolean)})}>Сохранить настройки</DemoButton></div></div>
    </div>
  </div>{confirmDelete&&createPortal(<div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0b3558]/35 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-subject-title"><div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#d4e0ed] bg-white shadow-[rgba(11,53,88,0.18)_0px_24px_70px]"><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 id="delete-subject-title" className="font-display text-xl font-bold text-[#0b3558]">Удалить объект мониторинга?</h2></div><div className="px-6 py-5"><p className="text-sm leading-6 text-[#476788]">Объект «{subject.name}» и его локальные настройки будут удалены. Это действие нельзя отменить.</p></div><div className="flex flex-col-reverse gap-3 border-t border-[#d4e0ed] bg-[#f8f9fb] px-6 py-4 sm:flex-row sm:justify-end"><DemoButton variant="secondary" onClick={()=>setConfirmDelete(false)}>Отмена</DemoButton><button type="button" onClick={onDelete} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#ef4444] bg-[#ef4444] px-5 text-sm font-semibold text-white hover:bg-[#dc2626]">Удалить объект</button></div></div></div>,document.body)}</>;
};

const BacklinkGraph=({onClose})=><div className="border-t border-[#d4e0ed] bg-[#f8f9fb] px-5 py-5 lg:px-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-base font-bold text-[#0b3558]">Схема backlink-связей</h3><Badge color="red">Высокая уверенность</Badge></div><p className="mt-1 text-xs leading-5 text-[#476788]">Два уровня доноров · снимок Ahrefs Site Explorer</p></div><button type="button" onClick={onClose} className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-[#d4e0ed] bg-white px-3 text-xs font-semibold text-[#0b3558] hover:bg-[#eef2f7]"><ChevronDown className="h-4 w-4 rotate-180"/>Свернуть</button></div>
  <div className="mt-4 grid gap-3 sm:grid-cols-3">{[['37','ссылающихся доменов'],['126','обратных ссылок'],['7','общих Class C']].map(([value,label])=><div key={label} className="rounded-xl border border-[#d4e0ed] bg-white px-4 py-3"><div className="text-xl font-semibold tabular-nums text-[#0b3558]">{value}</div><div className="mt-1 text-xs text-[#476788]">{label}</div></div>)}</div>
  <div className="mt-5 grid items-center gap-3 lg:grid-cols-[minmax(180px,0.7fr)_36px_minmax(230px,1fr)_36px_minmax(230px,1fr)]">
    <div className="rounded-xl border border-[#ef4444] bg-white p-4"><div className="text-[11px] font-semibold uppercase text-[#ef4444]">Негативный материал</div><div className="mt-2 text-sm font-semibold text-[#0b3558]">business-review.ru</div><div className="mt-1 text-xs leading-5 text-[#476788]">Почему запуск перенесли на осень</div></div>
    <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-[#8aa2bb] lg:rotate-0"/>
    <div className="space-y-2"><div className="text-[11px] font-semibold uppercase text-[#6f88a3]">Уровень 1 · прямые доноры</div>{[
      ['press-release-hub.ru','28 ссылок · spam'],
      ['review-digest.net','17 ссылок · тот же Class C'],
      ['industry-feed.ru','11 ссылок · повторяющийся анкор'],
    ].map(([domain,note])=><div key={domain} className="rounded-lg border border-[#d4e0ed] bg-white px-3 py-2.5"><div className="text-xs font-semibold text-[#0b3558]">{domain}</div><div className="mt-1 text-[11px] text-[#476788]">{note}</div></div>)}</div>
    <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-[#8aa2bb] lg:rotate-0"/>
    <div className="space-y-2"><div className="text-[11px] font-semibold uppercase text-[#6f88a3]">Уровень 2 · усиливающий контур</div>{[
      ['7 общих Class C','домены размещены в связанных подсетях'],
      ['11 spam-доменов','низкое качество ссылочного профиля'],
      ['Окно 48 часов','синхронное появление ссылок'],
    ].map(([title,note])=><div key={title} className="rounded-lg border border-[#d4e0ed] bg-white px-3 py-2.5"><div className="text-xs font-semibold text-[#0b3558]">{title}</div><div className="mt-1 text-[11px] text-[#476788]">{note}</div></div>)}</div>
  </div>
  <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#d4e0ed] bg-white p-3 text-xs leading-5 text-[#476788]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#006bff]"/>Схема показывает технические признаки ссылочной сети и не подтверждает общего владельца сайтов без ручной проверки.</div>
</div>;

export function ReputationIntelligenceView({navigate}) {
  const backend=useBackend();
  const [subjects,setSubjects]=useState([]);
  const [loadingSubjects,setLoadingSubjects]=useState(true);
  const [setupOpen,setSetupOpen]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [subject,setSubject]=useState({id:null,name:'Neuroreel',type:'Бренд'});
  const [queriesBySubject,setQueriesBySubject]=useState({});
  const [periodsBySubject,setPeriodsBySubject]=useState({});
  const [regionsBySubject,setRegionsBySubject]=useState({});
  const [officialSourcesBySubject,setOfficialSourcesBySubject]=useState({});
  const [scanStatus,setScanStatus]=useState('');
  const [scans,setScans]=useState([]);
  const [demoMode,setDemoMode]=useState(false);
  const [section,setSection]=useState('Обзор');
  const [workspaceTab,setWorkspaceTab]=useState('Материалы');
  const [channel,setChannel]=useState('Все каналы');
  const [engine,setEngine]=useState('Все системы');
  const [serpQuery,setSerpQuery]=useState('neuroreel');
  const [serpEngine,setSerpEngine]=useState('Яндекс');
  const [aiSearchEngine,setAiSearchEngine]=useState('ChatGPT');
  const [negativeQuery,setNegativeQuery]=useState('');
  const [negativeTopics,setNegativeTopics]=useState([]);
  const [negativePage,setNegativePage]=useState(1);
  const [expandedBacklinkId,setExpandedBacklinkId]=useState(null);
  const [query,setQuery]=useState('');
  const [materialPage,setMaterialPage]=useState(1);
  const [selected,setSelected]=useState(materials[0]);
  const visible=useMemo(()=>materials.filter(item=>(channel==='Все каналы'||item.channel===channel)&&(engine==='Все системы'||item.engine===engine)&&(!query.trim()||`${item.title} ${item.domain} ${item.topic} ${item.channel}`.toLowerCase().includes(query.trim().toLowerCase()))),[channel,engine,query]);
  const materialTotal=visible.length;
  const materialPageCount=Math.max(1,Math.ceil(materialTotal/5));
  const materialRangeStart=materialTotal?(materialPage-1)*5+1:0;
  const materialRangeEnd=Math.min(materialPage*5,materialTotal);
  const pagedMaterials=visible.slice((materialPage-1)*5,materialPage*5);
  const materialPages=materialPage<=3?[1,2,3,'…',materialPageCount]:materialPage>=materialPageCount-2?[1,'…',materialPageCount-2,materialPageCount-1,materialPageCount]:[1,'…',materialPage,'…',materialPageCount];
  useEffect(()=>{
    setMaterialPage(1);
    if(visible.length&&!visible.some(item=>item.id===selected.id))setSelected(visible[0]);
  },[channel,engine,query,visible,selected.id]);
  const filteredNegative=useMemo(()=>negativeMaterials.filter(item=>{
    const profile=negativeProfiles[item.id];
    const matchesTopic=!negativeTopics.length||negativeTopics.some(topic=>profile.topics.includes(topic));
    const needle=negativeQuery.trim().toLowerCase();
    const matchesQuery=!needle||`${item.title} ${item.domain} ${profile.network} ${profile.topics.join(' ')}`.toLowerCase().includes(needle);
    return matchesTopic&&matchesQuery;
  }),[negativeQuery,negativeTopics]);
  const negativePageCount=Math.max(1,Math.ceil(filteredNegative.length/10));
  const negativeRangeStart=filteredNegative.length?(negativePage-1)*10+1:0;
  const negativeRangeEnd=Math.min(negativePage*10,filteredNegative.length);
  const pagedNegative=filteredNegative.slice((negativePage-1)*10,negativePage*10);
  useEffect(()=>setNegativePage(1),[negativeQuery,negativeTopics]);
  const scanBars=[42,47,45,54,61,58,72,88];
  const scanLabels=['02.09','04.09','06.09','08.09','10.09','12.09','14.09','16.09'];

  const syncSubjects=(items,preferredId=null)=>{
    setSubjects(items);
    setQueriesBySubject(Object.fromEntries(items.map(item=>[item.name,item.queries])));
    setPeriodsBySubject(Object.fromEntries(items.map(item=>[item.name,`${item.periodDays} дней`])));
    setRegionsBySubject(Object.fromEntries(items.map(item=>[item.name,item.region])));
    setOfficialSourcesBySubject(Object.fromEntries(items.map(item=>[item.name,item.officialSources])));
    setSubject(current=>items.find(item=>item.id===(preferredId||current.id))||items[0]||{id:null,name:'Neuroreel',type:'Бренд'});
  };
  const refreshSubjects=async (preferredId=null)=>{
    const items=await api('/reputation/subjects');syncSubjects(items,preferredId);return items;
  };
  useEffect(()=>{
    let active=true;
    api('/reputation/subjects').then(items=>{if(active)syncSubjects(items);}).catch(error=>{if(active)backend.setError(error instanceof Error?error.message:'Не удалось загрузить объекты мониторинга');}).finally(()=>{if(active)setLoadingSubjects(false);});
    return()=>{active=false;};
  },[]);
  const queueScan=async subjectId=>{
    const scan=await api(`/reputation/subjects/${subjectId}/scans`,'POST',{},crypto.randomUUID());
    setScanStatus(scan.status);
    setScans(current=>[scan,...current]);
    return scan;
  };
  useEffect(()=>{
    if(!subject.id||demoMode)return;
    let active=true;
    const poll=async()=>{
      try {
        const items=await api(`/reputation/subjects/${subject.id}/scans`);
        if(active){setScans(items);setScanStatus(items[0]?.status||'');}
      } catch(error){if(active)backend.setError(error instanceof Error?error.message:'Не удалось загрузить сканирование');}
    };
    poll();
    const timer=['queued','running'].includes(scanStatus)?window.setInterval(poll,4000):null;
    return()=>{active=false;if(timer)window.clearInterval(timer);};
  },[subject.id,demoMode,scanStatus]);
  const saveSubject=value=>backend.perform(async()=>{
    const queries=value.queries?.length?value.queries:(value.type==='Человек'?[value.name,`${value.name} биография`,`${value.name} интервью`,`${value.name} отзывы`]:[value.name,`${value.name} отзывы`,`${value.name} новости`,`${value.name} руководство`]);
    const next=await api('/reputation/subjects','POST',{name:value.name,type:value.type,queries:queries.slice(0,5),region:'Москва',periodDays:30,officialSources:value.name==='Neuroreel'?['neuroreel.ai','t.me/neuroreel']:[],profile:value.profile||{}});
    await queueScan(next.id);
    await refreshSubjects(next.id);
    setDemoMode(false);
    setSetupOpen(false);
  });
  const openDemo=()=>{setDemoMode(true);setSubject({id:null,name:'Neuroreel',type:'Бренд'});setSetupOpen(false);};
  const saveMonitoringSettings=({queries,period,region,officialSources})=>backend.perform(async()=>{
    await api(`/reputation/subjects/${subject.id}`,'PUT',{name:subject.name,type:subject.type,queries:queries.slice(0,5),periodDays:Number.parseInt(period,10),region,officialSources,profile:subject.profile||{}});
    await refreshSubjects(subject.id);setSettingsOpen(false);
  });
  const deleteSubject=()=>backend.perform(async()=>{
    await api(`/reputation/subjects/${subject.id}`,'DELETE');await refreshSubjects();setSettingsOpen(false);
  });
  const startScan=()=>backend.perform(async()=>{await queueScan(subject.id);await refreshSubjects(subject.id);});
  const currentScanStatus=scans[0]?.status||scanStatus||subject.latestScan?.status||'';

  useEffect(()=>{
    if(setupOpen)return;
    requestAnimationFrame(()=>document.querySelector('main > div.flex-1.overflow-auto')?.scrollTo({top:0}));
  },[setupOpen]);
  useEffect(()=>setMaterialPage(1),[channel,engine,query]);

  if(loadingSubjects)return <div className={`${cardClass} p-8 text-sm text-[#476788]`}>Загрузка объектов мониторинга...</div>;

  if(!subjects.length&&!setupOpen&&!demoMode)return <ReputationOnboarding onAdd={()=>setSetupOpen(true)} onOpenDemo={openDemo}/>;

  if(settingsOpen)return <MonitoringSettings subject={subject} queries={queriesBySubject[subject.name]||[subject.name]} period={periodsBySubject[subject.name]||'30 дней'} region={regionsBySubject[subject.name]||'Москва'} officialSources={officialSourcesBySubject[subject.name]||[]} onSave={saveMonitoringSettings} onCancel={()=>setSettingsOpen(false)} onDelete={deleteSubject}/>;

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
        <p className="mt-2 text-sm text-[#476788]">{subject.name} · {regionsBySubject[subject.name]||'Москва'} · {demoMode?`публикации за ${periodsBySubject[subject.name]||'30 дней'} · демо-данные`:scans[0]?.result?.capturedAt?`снимок выдачи ${new Date(scans[0].result.capturedAt).toLocaleDateString('ru-RU')}`:'снимка пока нет'}</p>
      </div>
      <div className="grid w-full grid-cols-[minmax(0,1fr)_44px_44px] gap-3 sm:w-auto sm:grid-cols-[208px_44px_44px_auto]"><PrototypeSelect value={subject.name} options={subjects.map(item=>item.name)} onChange={value=>{const next=subjects.find(item=>item.name===value);if(next){setDemoMode(false);setSubject(next);setScans([]);setScanStatus(next.latestScan?.status||'');}}}/><button type="button" aria-label="Добавить объект мониторинга" title="Добавить объект мониторинга" onClick={()=>setSetupOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4e0ed] bg-white text-[#0b3558] transition-colors hover:bg-[#f0f3f8] focus:outline-none focus:ring-2 focus:ring-[#006bff]"><Plus className="h-5 w-5"/></button><button type="button" aria-label="Настройки мониторинга" title="Настройки мониторинга" disabled={demoMode} onClick={()=>setSettingsOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4e0ed] bg-white text-[#0b3558] transition-colors hover:bg-[#f0f3f8] focus:outline-none focus:ring-2 focus:ring-[#006bff]"><Settings className="h-5 w-5"/></button><DemoButton disabled={demoMode||backend.busy||['queued','running'].includes(currentScanStatus)} onClick={startScan} className="col-span-3 sm:col-span-1">{['queued','running'].includes(currentScanStatus)?<LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true"/>:<Search className="h-4 w-4"/>}{currentScanStatus==='queued'?'Сканирование в очереди':currentScanStatus==='running'?'Идет сканирование':'Запустить сканирование'}</DemoButton></div>
    </div>

    <div className="flex max-w-full overflow-x-auto rounded-xl border border-[#d4e0ed] bg-white p-1 sm:w-fit">
      {['Обзор','Аналитика'].map(item=><button key={item} type="button" onClick={()=>setSection(item)} className={`min-w-[136px] rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${section===item?'bg-[#0b3558] text-white':'text-[#476788] hover:bg-[#f0f3f8] hover:text-[#0b3558]'}`}>{item}</button>)}
    </div>

    {!demoMode?<ReputationLiveContent scan={scans[0]} section={section} workspaceTab={workspaceTab} setWorkspaceTab={setWorkspaceTab} queries={subject.queries||[subject.name]} Select={PrototypeSelect}/>:section==='Обзор'?<div className="space-y-6">
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
        <div className="border-b border-[#d4e0ed] px-6 py-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Текущая оценка</h2><p className="mt-1 text-sm text-[#476788]">Что происходит, почему это важно и что делать дальше · AI-анализ через OpenRouter</p></div><Badge color="red">Средний репутационный риск</Badge></div></div>
        <div className="border-b border-[#d4e0ed] px-6 py-5"><div className="text-xs text-[#476788]">Главная тема</div><h3 data-assessment-topic className="mt-2 min-w-0 text-base font-semibold leading-7 text-[#0b3558] [overflow-wrap:anywhere]">Запуск продукта</h3></div>
        <div className="p-6"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f1ff] text-[#006bff]"><Sparkles className="h-5 w-5"/></span><div className="min-w-0"><div className="text-xs font-semibold uppercase text-[#006bff]">Вывод аналитики</div><p className="mt-2 text-base leading-7 text-[#0b3558]">Интерес к бренду растет, но выдача пока слабо контролируется. Основной риск формируют материалы о переносе запуска: один из них поднялся на третью позицию Яндекса.</p></div></div></div>
        <div className="grid border-t border-[#d4e0ed] sm:grid-cols-3">{[['Главное изменение','#8 → #3'],['Источник риска','business-review.ru'],['Следующий шаг','Усилить Top-10']].map(([label,value],index)=><div key={label} className={`min-w-0 p-5 ${index<2?'border-b border-[#d4e0ed] sm:border-b-0 sm:border-r':''}`}><div className="text-xs text-[#476788]">{label}</div><div className="mt-2 text-sm font-semibold leading-6 text-[#0b3558] [overflow-wrap:anywhere]">{value}</div></div>)}</div>
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
          <div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Хронология сигнала</h2><p className="mt-1 text-sm text-[#476788]">События, зафиксированные разными источниками данных</p></div><Badge color="gray">Без вывода о причинности</Badge></div>
          <div className="p-6"><div className="grid gap-3 md:grid-cols-4">{[
            ['15 сен · 09:20','Первая публикация','business-review.ru','Поисковый мониторинг',Newspaper],
            ['15 сен · 11:40','12 упоминаний','186 тыс. просмотров','Telegram API',MessageCircle],
            ['15–16 сен','Запросы +64%','к среднему за 7 дней','Данные спроса',TrendingUp],
            ['16 сен · 08:00','URL: #8 → #3','два снимка Яндекса','Мониторинг SERP',Search],
          ].map(([time,title,note,source,Icon],index)=><div key={title} className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${index===1?'bg-[#fff1f1] text-[#ef4444]':'bg-[#e7f1ff] text-[#006bff]'}`}><Icon className="h-4 w-4"/></span><div className="mt-3 text-[11px] font-medium text-[#6f88a3]">{time}</div><div className="mt-1 text-sm font-semibold text-[#0b3558]">{title}</div><div className="mt-1 text-xs leading-5 text-[#476788]">{note}</div><div className="mt-3 border-t border-[#d4e0ed] pt-2 text-[11px] font-medium text-[#6f88a3]">{source}</div></div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#d4e0ed] bg-white p-4"><div className="text-xs font-semibold uppercase text-[#6f88a3]">Почему показаны вместе</div><p className="mt-2 text-sm leading-6 text-[#0b3558]">Одна тема, совпадающий URL и окно 24 часа.</p></div><div className="rounded-xl border border-[#d4e0ed] bg-white p-4"><div className="text-xs font-semibold uppercase text-[#6f88a3]">Что можно утверждать</div><p className="mt-2 text-sm leading-6 text-[#0b3558]">Рост спроса и позиции зафиксирован в тот же период. Причинная связь не доказана.</p></div></div></div>
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
          <div className="border-t border-[#d4e0ed] p-5"><DemoButton className="w-full" onClick={()=>navigate('catalog')}>Выбрать площадки<ArrowRight className="h-4 w-4"/></DemoButton></div>
        </div>
      </div>
    </div>:<div className="space-y-5">
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex max-w-full flex-wrap gap-1 border-b border-[#d4e0ed] p-3 sm:flex-nowrap sm:overflow-x-auto">{['Материалы','Поисковая выдача','Темы','Каналы','Негатив'].map(tab=><button key={tab} type="button" onClick={()=>setWorkspaceTab(tab)} className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold ${workspaceTab===tab?'bg-[#e7f1ff] text-[#006bff]':'text-[#476788] hover:bg-[#f0f3f8]'}`}>{tab}</button>)}</div>
        {workspaceTab==='Материалы'&&<div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px_180px]"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f88a3]"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск по материалам, источникам и темам" className="h-11 w-full rounded-lg border border-[#d4e0ed] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label><PrototypeSelect value={channel} options={['Все каналы','Медиа','Telegram','Open web']} onChange={value=>{setChannel(value);if(value==='Telegram')setEngine('Все системы');}}/><PrototypeSelect value={engine} options={channel==='Telegram'?['Все системы']:['Все системы','Яндекс','Google']} onChange={setEngine}/></div>}
      </div>

      {workspaceTab==='Материалы'&&<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={`${cardClass} self-start overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-[#d4e0ed] px-5 py-4"><div><h2 className="font-display text-base font-bold text-[#0b3558]">Найденные материалы</h2><p className="mt-1 text-xs text-[#476788]">{materialTotal} {materialTotal===1?'результат':materialTotal>1&&materialTotal<5?'результата':'результатов'}{materialTotal?` · показано ${materialRangeStart}–${materialRangeEnd}`:''}</p></div><button type="button" aria-label="Скачать список" title="Скачать список" className="flex h-10 w-10 items-center justify-center rounded-lg text-[#476788] hover:bg-[#f0f3f8]"><Download className="h-5 w-5"/></button></div>
          <div className="divide-y divide-[#d4e0ed]">{pagedMaterials.map(item=><button key={item.id} type="button" onClick={()=>setSelected(item)} className={`w-full p-5 text-left transition-colors hover:bg-[#f8f9fb] ${selected.id===item.id?'bg-[#f1f6ff]':'bg-white'}`}><div className="flex items-start gap-4"><div className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border bg-white px-2 text-sm font-semibold ${item.channel==='Telegram'?'border-[#ef4444] text-[#ef4444]':'border-[#d4e0ed] text-[#0b3558]'}`}>{item.position?`#${item.position}`:<MessageCircle className="h-4 w-4"/>}</div><div className="min-w-0 flex-1"><div className="text-sm font-semibold leading-5 text-[#0b3558]">{item.title}</div><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-[#476788]"><span>{item.domain}</span><span>{item.channel}</span>{item.channel!=='Telegram'&&<span>{item.engine}</span>}<span>{item.date}</span><Badge color={item.sentimentColor}>{item.sentiment}</Badge></div></div></div></button>)}{!visible.length&&<div className="p-8 text-center text-sm text-[#476788]">По заданным условиям материалов не найдено.</div>}</div>
          {materialPageCount>1&&<div className="flex flex-col gap-3 border-t border-[#d4e0ed] bg-[#f8f9fb] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs text-[#476788]">{materialRangeStart}–{materialRangeEnd} из {materialTotal}</div><div className="flex items-center gap-1"><button type="button" aria-label="Предыдущая страница" disabled={materialPage===1} onClick={()=>setMaterialPage(page=>Math.max(1,page-1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button>{materialPages.filter(page=>page==='…'||Number(page)<=materialPageCount).map((page,index)=>page==='…'?<span key={`ellipsis-${index}`} className="flex h-9 w-7 items-center justify-center text-sm text-[#6f88a3]">…</span>:<button key={page} type="button" onClick={()=>setMaterialPage(Number(page))} className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold ${materialPage===page?'border-[#006bff] bg-[#006bff] text-white':'border-[#d4e0ed] bg-white text-[#0b3558] hover:bg-[#f0f3f8]'}`}>{page}</button>)}<button type="button" aria-label="Следующая страница" disabled={materialPage===materialPageCount} onClick={()=>setMaterialPage(page=>Math.min(materialPageCount,page+1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div></div>}
        </div>
        {!!visible.length&&<div className={`${cardClass} self-start overflow-hidden`}><div className="border-b border-[#d4e0ed] px-5 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge color={selected.riskColor}>{selected.risk} риск</Badge><Badge color="gray">{selected.contentStatus}</Badge></div><span className="text-xs text-[#476788]">{selected.position?`${selected.engine} · #${selected.position}`:selected.channel}</span></div><h2 className="mt-4 line-clamp-3 font-display text-base font-bold leading-6 text-[#0b3558] [overflow-wrap:anywhere]" title={selected.title}>{selected.title}</h2><ReputationSourceLink url={selected.url} className="mt-3"/>{selected.reach&&<div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#476788]"><Eye className="h-3.5 w-3.5 text-[#006bff]"/>{selected.reach}</div>}</div><div className="divide-y divide-[#d4e0ed]">{[['Краткое содержание',selected.summary],['Ключевое утверждение',selected.claim],['Оценка репутационного риска',selected.impact]].map(([label,text])=><div key={label} className="p-5"><div className="text-xs font-semibold uppercase text-[#6f88a3]">{label}</div><p className="mt-2 text-sm leading-6 text-[#0b3558] [overflow-wrap:anywhere]">{text}</p></div>)}</div><div className="border-t border-[#d4e0ed] bg-[#f8f9fb] px-5 py-3 text-xs text-[#6f88a3]">AI-анализ через OpenRouter · модельная оценка</div></div>}
      </div>}

      {workspaceTab==='Поисковая выдача'&&<div className="space-y-6">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-[#d4e0ed] px-6 py-5 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Что видит пользователь в поиске</h2><p className="mt-1 text-sm text-[#476788]">Первые десять результатов по выбранному запросу · демо-данные</p></div><div className="w-full lg:w-64"><PrototypeSelect value={serpQuery} options={['neuroreel','neuroreel отзывы','neuroreel платформа','neuroreel команда']} onChange={setSerpQuery}/></div></div>
          <div className="grid border-b border-[#d4e0ed] bg-[#f8f9fb] sm:grid-cols-3">{[['Частотность','6 240 / месяц'],['Контроль Top-10','4 результата'],['Негатив в Top-10','3 результата']].map(([label,value],index)=><div key={label} className={`px-6 py-4 ${index<2?'border-b border-[#d4e0ed] sm:border-b-0 sm:border-r':''}`}><div className="text-xs text-[#476788]">{label}</div><div className={`mt-1 text-sm font-semibold ${index===2?'text-[#ef4444]':'text-[#0b3558]'}`}>{value}</div></div>)}</div>
          <div role="tablist" aria-label="Поисковая система" className="flex gap-6 border-b border-[#d4e0ed] px-5">{['Яндекс','Google'].map(name=><button key={name} type="button" role="tab" id={`serp-tab-${name}`} aria-selected={serpEngine===name} aria-controls="serp-results" onClick={()=>setSerpEngine(name)} className={`border-b-2 px-2 py-4 text-sm font-semibold ${serpEngine===name?'border-[#006bff] text-[#006bff]':'border-transparent text-[#476788] hover:text-[#006bff]'}`}>{name}</button>)}</div>
          <div id="serp-results" role="tabpanel" aria-labelledby={`serp-tab-${serpEngine}`}>
            {serpPanels.filter(([name])=>name===serpEngine).map(([searchEngine,updated,results])=><div key={searchEngine}><div className="flex items-center justify-between gap-3 border-b border-[#d4e0ed] px-5 py-4"><div className="font-semibold text-[#0b3558]">{searchEngine} · Top-10</div><div className="text-xs text-[#6f88a3]">{updated}</div></div><div className="divide-y divide-[#d4e0ed]">{results.map(([position,domain,title,status,color,change])=><div data-serp-result={position} key={`${searchEngine}-${position}`} className="flex items-start gap-3 px-5 py-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f3f8] text-sm font-semibold text-[#0b3558]">{position}</span><div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[minmax(0,1fr)_170px_100px] md:items-center"><div><div className="flex items-center gap-1.5 text-xs font-medium text-[#006bff]"><span className="truncate">{domain}</span><ExternalLink className="h-3 w-3 shrink-0"/></div><div className="mt-1 break-words text-sm font-semibold text-[#0b3558]">{title}</div></div><div className="md:justify-self-end"><Badge color={color}>{status}</Badge></div><span className={`text-xs font-semibold ${String(change).startsWith('+')&&status==='Негативный'?'text-[#ef4444]':'text-[#476788]'}`}>{change==='—'?'Без изменений':`${change} позиции`}</span></div></div>)}</div></div>)}
          </div>
        </div>
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div><h2 className="font-display text-lg font-bold text-[#0b3558]">Ответы AI-сервисов</h2><p className="mt-1 text-sm text-[#476788]">Как объект представлен в ответах по запросу «{serpQuery}»</p></div>
            <Badge color="gray">Демо-данные</Badge>
          </div>
          <div role="tablist" aria-label="AI-сервис" className="flex max-w-full gap-6 overflow-x-auto border-b border-[#d4e0ed] px-5">
            {aiSearchSnippets.map(item=><button key={item.name} type="button" role="tab" id={`ai-tab-${item.name}`} aria-selected={aiSearchEngine===item.name} aria-controls="ai-search-snippet" onClick={()=>setAiSearchEngine(item.name)} className={`shrink-0 border-b-2 px-2 py-4 text-sm font-semibold ${aiSearchEngine===item.name?'border-[#006bff] text-[#006bff]':'border-transparent text-[#476788] hover:text-[#006bff]'}`}>{item.name}</button>)}
          </div>
          <div id="ai-search-snippet" role="tabpanel" aria-labelledby={`ai-tab-${aiSearchEngine}`}>
            {aiSearchSnippets.filter(item=>item.name===aiSearchEngine).map(item=><div key={item.name} className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><Badge color={item.color}>{item.tone}</Badge><span className="text-xs text-[#6f88a3]">Источник: {item.provider}</span></div><span className="text-xs text-[#6f88a3]">{item.updated}</span></div>
              <blockquote className="mt-4 border-l-2 border-[#006bff] pl-4 text-sm leading-7 text-[#0b3558]">{item.snippet}</blockquote>
              <div className="mt-5 border-t border-[#d4e0ed] pt-4"><div className="text-xs font-semibold uppercase text-[#6f88a3]">Источники в ответе</div><div className="mt-3 flex flex-wrap gap-2">{item.sources.map(source=><span key={source} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-3 py-2 text-xs font-medium text-[#0b3558]"><Link2 className="h-3.5 w-3.5 text-[#006bff]"/>{source}</span>)}</div></div>
            </div>)}
          </div>
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Поисковый интент</h2><p className="mt-1 text-sm text-[#476788]">Структура запросов за последние 30 дней</p></div><div className="p-6"><div className="flex h-3 overflow-hidden rounded-full">{demandIntents.map(([name,value,color])=><div key={name} style={{width:`${value}%`,backgroundColor:color}}/>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-2">{demandIntents.map(([name,value,color])=><div key={name} className="flex items-center justify-between rounded-lg border border-[#d4e0ed] px-3 py-2.5 text-sm"><span className="flex items-center gap-2 text-[#476788]"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:color}}/>{name}</span><strong className="text-[#0b3558]">{value}%</strong></div>)}</div></div></div>
          <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">География интереса</h2><p className="mt-1 text-sm text-[#476788]">Доля запросов и аномально высокий интерес</p></div><div className="divide-y divide-[#d4e0ed]">{[['Москва','32%','1,4×'],['Санкт-Петербург','14%','1,2×'],['Татарстан','6%','1,8×'],['Краснодарский край','5%','1,1×']].map(([region,share,affinity])=><div key={region} className="flex items-center gap-3 px-6 py-3.5"><MapPin className="h-4 w-4 shrink-0 text-[#006bff]"/><span className="min-w-0 flex-1 text-sm font-medium text-[#0b3558]">{region}</span><span className="text-sm text-[#476788]">{share}</span><Badge color="blue">Индекс {affinity}</Badge></div>)}</div></div>
        </div>
      </div>}

      {workspaceTab==='Темы'&&<div className="grid gap-6 lg:grid-cols-2">{topics.map(([name,value,tone,color],index)=><div key={name} className={`${cardClass} p-6`}><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase text-[#6f88a3]">Тема {index+1}</div><h2 className="mt-2 font-display text-lg font-bold text-[#0b3558]">{name}</h2></div><Badge color={color}>{tone}</Badge></div><p className="mt-4 text-sm leading-6 text-[#476788]">{index===1?'Тема растет быстрее остальных и связана с переносом публичного запуска продукта.':'Тема стабильно присутствует в профильных публикациях и брендовой поисковой выдаче.'}</p><div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eef5]"><div className="h-full rounded-full bg-[#006bff]" style={{width:`${Math.min(Number(value)*2.4,100)}%`}}/></div><span className="text-sm font-semibold text-[#0b3558]">{value}%</span></div></div>)}</div>}

      {workspaceTab==='Каналы'&&<div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{channelMetrics.map(item=>{const Icon=item.icon;return <div key={item.name} className={`${cardClass} p-5`}><div className="flex items-center justify-between"><span className="text-sm font-medium text-[#476788]">{item.name}</span><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.tone==='red'?'bg-[#fff1f1] text-[#ef4444]':'bg-[#e7f1ff] text-[#006bff]'}`}><Icon className="h-4 w-4"/></span></div><div className="mt-3 text-2xl font-semibold tabular-nums text-[#0b3558]">{item.value}</div><div className="mt-1 text-xs text-[#476788]">{item.label}</div><div className={`mt-2 text-xs font-medium ${item.tone==='red'?'text-[#ef4444]':'text-[#006bff]'}`}>{item.note}</div></div>;})}</div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`${cardClass} overflow-hidden`}><div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Telegram: динамика распространения</h2><p className="mt-1 text-sm text-[#476788]">Упоминания, просмотры и пересылки по дням</p></div><Badge color="red">Негатив растет</Badge></div><div className="p-6"><div className="grid grid-cols-3 gap-3">{[['18','упоминаний'],['1,4 млн','просмотров публикаций'],['736','пересылок']].map(([value,label])=><div key={label} className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xl font-semibold tabular-nums text-[#0b3558]">{value}</div><div className="mt-1 text-xs leading-5 text-[#476788]">{label}</div></div>)}</div><div className="mt-6 flex h-40 items-end gap-2 border-b border-[#d4e0ed]">{[12,18,26,34,78,56,42,31].map((height,index)=><div key={index} className="flex h-full flex-1 items-end"><div className={`w-full rounded-t-md ${index===4?'bg-[#ef4444]':'bg-[#8bb9ff]'}`} style={{height:`${height}%`}}/></div>)}</div><div className="mt-3 flex items-center gap-2 text-xs text-[#476788]"><Activity className="h-4 w-4 text-[#ef4444]"/>Максимум просмотров зафиксирован 15 сентября у публикации Digital Inside</div></div></div>
          <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Ключевые Telegram-источники</h2><p className="mt-1 text-sm text-[#476788]">Просмотры и пересылки найденных публикаций</p></div><div className="divide-y divide-[#d4e0ed]">{[['Digital Inside','186 тыс.','412','Негативная'],['AI Product News','94 тыс.','128','Нейтральная'],['Русский венчур','73 тыс.','91','Нейтральная'],['Технологии бизнеса','48 тыс.','54','Смешанная']].map(([name,views,reposts,tone],index)=><div key={name} className="flex items-center gap-3 px-5 py-4"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${index===0?'bg-[#fff1f1] text-[#ef4444]':'bg-[#e7f1ff] text-[#006bff]'}`}><Radio className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#0b3558]">{name}</div><div className="mt-1 text-xs text-[#476788]">{views} просмотров · {reposts} пересылок</div></div><Badge color={tone==='Негативная'?'red':tone==='Смешанная'?'amber':'blue'}>{tone}</Badge></div>)}</div></div>
        </div>
        <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Вклад каналов в темы</h2><p className="mt-1 text-sm text-[#476788]">Доля релевантных материалов каждой темы по каналам</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] divide-y divide-[#d4e0ed]"><thead className="bg-[#f8f9fb]"><tr>{['Тема','Поиск','Медиа','Telegram','Open web','Динамика'].map(head=><th key={head} className="px-6 py-3 text-left text-xs font-medium uppercase text-[#476788]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#d4e0ed]">{[['Запуск продукта','26%','31%','42%','18%','+68%'],['Продукт и технологии','34%','38%','21%','29%','+12%'],['Отзывы клиентов','14%','9%','18%','32%','+7%'],['Команда и основатели','18%','17%','11%','15%','−3%']].map((row,rowIndex)=><tr key={row[0]}>{row.map((value,index)=><td key={`${row[0]}-${index}`} className={`px-6 py-4 text-sm ${index===0?'font-semibold text-[#0b3558]':index===5&&rowIndex===0?'font-semibold text-[#ef4444]':'text-[#476788]'}`}>{value}</td>)}</tr>)}</tbody></table></div></div>
      </div>}

      {workspaceTab==='Негатив'&&<div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
          ['Негативных публикаций',String(negativeMaterials.length),'за выбранный период'],
          ['В поисковом Top-10','1','публикация'],
          ['С признаками сети','1','требует проверки'],
          ['Тематики','3','активных сюжета'],
        ].map(([label,value,note])=><div key={label} className={`${cardClass} p-5`}><div className="text-sm font-medium text-[#476788]">{label}</div><div className="mt-3 text-3xl font-semibold tabular-nums text-[#0b3558]">{value}</div><div className="mt-2 text-xs text-[#476788]">{note}</div></div>)}</div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-col gap-2 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Негативные публикации</h2><p className="mt-1 text-sm text-[#476788]">Материалы, влияющие на репутацию объекта</p></div><span className="text-xs text-[#6f88a3]">{filteredNegative.length} из {negativeMaterials.length}</span></div>
            <div className="grid gap-3 border-b border-[#d4e0ed] p-4 sm:grid-cols-[minmax(0,1fr)_220px]"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f88a3]"/><input aria-label="Поиск по негативным публикациям" value={negativeQuery} onChange={event=>setNegativeQuery(event.target.value)} placeholder="Поиск по публикациям и ссылкам" className="h-10 w-full rounded-lg border border-[#d4e0ed] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#006bff] focus:ring-2 focus:ring-[#006bff]/10"/></label><TopicFilter options={['Перенос запуска','Готовность продукта','Масштабирование']} selected={negativeTopics} onChange={setNegativeTopics}/></div>
            <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(150px,0.75fr)_minmax(210px,0.9fr)_84px] gap-4 border-b border-[#d4e0ed] bg-[#f8f9fb] px-5 py-3 text-xs font-medium uppercase text-[#6f88a3] lg:grid"><span>Публикация</span><span>Тематика</span><span>Ссылочный анализ</span><span>Риск</span></div>
            <div className="divide-y divide-[#d4e0ed]">{pagedNegative.map(item=>{const profile=negativeProfiles[item.id];return <div key={item.id}><article className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(150px,0.75fr)_minmax(210px,0.9fr)_84px] lg:items-start lg:gap-4">
              <div className="min-w-0"><a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1.5 text-sm font-semibold leading-5 text-[#0b3558] hover:text-[#006bff]">{item.title}<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0"/></a><div className="mt-1.5 break-words text-xs leading-5 text-[#476788]">{item.domain} · {item.channel} · {item.date}</div><div className="mt-1 text-xs text-[#6f88a3]">{item.position?`${item.engine} · #${item.position}`:profile.distribution}</div></div>
              <div><div className="mb-1.5 text-[11px] font-medium uppercase text-[#6f88a3] lg:hidden">Тематика</div><div className="flex flex-wrap gap-1.5">{profile.topics.map(topic=><span key={topic}><Badge color="gray">{topic}</Badge></span>)}</div></div>
              <div className="min-w-0"><div className="mb-1.5 text-[11px] font-medium uppercase text-[#6f88a3] lg:hidden">Ссылочный анализ</div><div className="text-sm font-semibold text-[#0b3558]">{profile.network}</div><div className="mt-1 text-xs leading-5 text-[#476788]">{profile.networkStatus} · {profile.networkEvidence}</div>{profile.graphAvailable&&<button type="button" onClick={()=>setExpandedBacklinkId(current=>current===item.id?null:item.id)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#006bff] hover:text-[#004eba]">{expandedBacklinkId===item.id?'Скрыть схему':'Показать схему'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedBacklinkId===item.id?'rotate-180':''}`}/></button>}</div>
              <div><div className="mb-1.5 text-[11px] font-medium uppercase text-[#6f88a3] lg:hidden">Риск</div><Badge color="red">{item.risk}</Badge></div>
            </article>{expandedBacklinkId===item.id&&<BacklinkGraph onClose={()=>setExpandedBacklinkId(null)}/>}</div>;})}{!filteredNegative.length&&<div className="px-5 py-10 text-center text-sm text-[#476788]">По заданным условиям публикаций не найдено.</div>}</div>
            {filteredNegative.length>10&&<div className="flex items-center justify-between gap-3 border-t border-[#d4e0ed] bg-[#f8f9fb] px-5 py-4"><span className="text-xs text-[#476788]">{negativeRangeStart}–{negativeRangeEnd} из {filteredNegative.length}</span><div className="flex gap-2"><button type="button" aria-label="Предыдущая страница негатива" disabled={negativePage===1} onClick={()=>setNegativePage(page=>Math.max(1,page-1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] disabled:opacity-40"><ChevronLeft className="h-4 w-4"/></button><button type="button" aria-label="Следующая страница негатива" disabled={negativePage===negativePageCount} onClick={()=>setNegativePage(page=>Math.min(negativePageCount,page+1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] disabled:opacity-40"><ChevronRight className="h-4 w-4"/></button></div></div>}
          </section>

          <aside className="space-y-5">
            <section className={`${cardClass} p-5`}><h2 className="font-display text-base font-bold text-[#0b3558]">Тематики негатива</h2><p className="mt-1 text-xs text-[#476788]">Доля тематических меток в публикациях</p><div className="mt-5 flex flex-col items-center gap-5 sm:flex-row xl:flex-col"><div className="relative h-40 w-40 shrink-0 rounded-full" style={{background:'conic-gradient(#006bff 0 50%, #ef4444 50% 75%, #48b890 75% 100%)'}} role="img" aria-label="Перенос запуска — 2 метки, готовность продукта — 1 метка, масштабирование — 1 метка"><div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white"><span className="text-2xl font-semibold text-[#0b3558]">4</span><span className="mt-1 text-[11px] text-[#6f88a3]">метки</span></div></div><div className="w-full space-y-3">{[['Перенос запуска','2','#006bff'],['Готовность продукта','1','#ef4444'],['Масштабирование','1','#48b890']].map(([topic,count,color])=><div key={topic} className="flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{backgroundColor:color}}/><span className="min-w-0 flex-1 text-[#476788]">{topic}</span><strong className="text-[#0b3558]">{count}</strong></div>)}</div></div></section>
            <section className={`${cardClass} p-5`}><h2 className="font-display text-base font-bold text-[#0b3558]">Как определяется сеть</h2><p className="mt-2 text-sm leading-6 text-[#476788]">Ahrefs Site Explorer показывает доноров, анкоры, подсети и время появления ссылок. Система объединяет эти признаки в оценку уверенности.</p><p className="mt-3 text-xs leading-5 text-[#6f88a3]">Это признаки ссылочной сети, а не подтверждение общего владельца. Нужна ручная проверка.</p></section>
          </aside>
        </div>
      </div>}
    </div>}
  </div>;
}
