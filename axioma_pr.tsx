import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import FontFamily from '@tiptap/extension-font-family';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import { useBackend, materialPayload, formatLabels, normalizeAdvertiser } from './src/prototype-backend';
import { api, uploadFile } from './src/api';
import { AdminLogin, useCabinetView } from './src/cabinet-routing';
import { outletFormValues } from './src/outlet-form';
import {AdminRecords,OrderConversation,SupportDesk,DisputeList} from './src/operations-ui';
import {AdminActs,AdminBankReview} from './src/pilot-admin-ui';
import {ReputationIntelligenceView} from './src/reputation-ui';
import {AdminReputationIntegrationsView} from './src/admin-reputation-integrations';
const orderNumber = (order: {id: string | number; number?: number}) => order.number ?? (typeof order.id==='number' ? order.id : '—');
const materialNumber = (material: {id: string | number; number?: number}) => material.number ?? (typeof material.id==='number' ? material.id : '—');
const downloadFromApi = (path: string) => {
  const link=document.createElement('a');link.href=`/api${path}`;link.download='';document.body.appendChild(link);link.click();link.remove();
};
import { 
  LayoutDashboard, 
  FileText, 
  Store, 
  Briefcase, 
  CreditCard, 
  Settings, 
  Bell, 
  Search, 
  Plus, 
  Filter,
  AlertCircle,
  MoreHorizontal,
  ShieldCheck,
  ChevronRight,
  Download,
  MessageSquare,
  Clock,
  CalendarDays,
  Check,
  CheckCircle2,
  ExternalLink,
  Info,
  ArrowRight,
  Globe,
  Lock,
  BarChart3,
  Menu,
  X,
  Star,
  Type,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Image as ImageIcon,
  List,
  Quote,
  Trash2,
  Copy,
  Paperclip,
  UploadCloud,
  FolderKanban,
  Megaphone,
  Newspaper,
  Lightbulb,
  Rocket,
  Gift,
  Percent,
  Tag,
  BookOpen,
  Sparkles,
  LoaderCircle,
  Users,
  TrendingUp,
  Link2,
  Zap,
  Pencil,
  Eye,
  Underline
} from 'lucide-react';


// --- ДАННЫЕ ПРОТОТИПА ---

const federalDistricts = [
  'Центральный федеральный округ',
  'Северо-Западный федеральный округ',
  'Южный федеральный округ',
  'Северо-Кавказский федеральный округ',
  'Приволжский федеральный округ',
  'Уральский федеральный округ',
  'Сибирский федеральный округ',
  'Дальневосточный федеральный округ',
];
const regionFilterOptions = ['Любая география', 'Федеральные', 'Москва', 'Санкт-Петербург', ...federalDistricts];
const matchesGeographyFilter = (region, filter) => {
  if (!filter || filter === 'Любая география') return true;
  if (filter === 'Федеральные') return region === 'Федеральный охват';
  return region === filter;
};
const informerIconOptions = [
  { value: 'store', label: 'Площадка' },
  { value: 'briefcase', label: 'Пакет' },
  { value: 'credit', label: 'Оплата' },
  { value: 'file', label: 'Документ' },
  { value: 'megaphone', label: 'Анонс' },
  { value: 'newspaper', label: 'Новость' },
  { value: 'lightbulb', label: 'Идея' },
  { value: 'rocket', label: 'Запуск' },
  { value: 'gift', label: 'Предложение' },
  { value: 'percent', label: 'Скидка' },
  { value: 'tag', label: 'Специальная цена' },
  { value: 'book', label: 'База знаний' },
  { value: 'sparkles', label: 'Новинка' },
  { value: 'users', label: 'Аудитория' },
  { value: 'trending', label: 'Рост' },
  { value: 'link', label: 'Ссылка' },
  { value: 'zap', label: 'Важное' },
];
const informerIconMap = {
  store: Store,
  briefcase: Briefcase,
  credit: CreditCard,
  file: FileText,
  megaphone: Megaphone,
  newspaper: Newspaper,
  lightbulb: Lightbulb,
  rocket: Rocket,
  gift: Gift,
  percent: Percent,
  tag: Tag,
  book: BookOpen,
  sparkles: Sparkles,
  users: Users,
  trending: TrendingUp,
  link: Link2,
  zap: Zap,
};
const informerAccentOptions = [
  { value: 'blue', label: 'Синий' },
  { value: 'green', label: 'Зеленый' },
  { value: 'amber', label: 'Янтарный' },
  { value: 'violet', label: 'Фиолетовый' },
  { value: 'cyan', label: 'Бирюзовый' },
  { value: 'pink', label: 'Розовый' },
  { value: 'red', label: 'Красный' },
  { value: 'lime', label: 'Лаймовый' },
  { value: 'orange', label: 'Оранжевый' },
  { value: 'slate', label: 'Графитовый' },
];
const informerAccentMap = {
  blue: 'bg-[#e8f1ff] text-[#006bff]',
  green: 'bg-[#eef8f3] text-[#168a57]',
  amber: 'bg-[#fff4df] text-[#b46b00]',
  violet: 'bg-[#f1edff] text-[#6a4bc4]',
  cyan: 'bg-[#e6f8fb] text-[#087f8c]',
  pink: 'bg-[#fdebf4] text-[#c0266d]',
  red: 'bg-[#feecec] text-[#c62929]',
  lime: 'bg-[#eef9df] text-[#4d7c0f]',
  orange: 'bg-[#fff0e5] text-[#c25100]',
  slate: 'bg-[#edf1f5] text-[#40566d]',
};
const mockMaterials = [
  { id: 1, name: 'Пресс-релиз: Запуск новой платформы', advertiser: 'ООО "Финтех Решения"', type: 'Статья', status: 'Принят в систему', statusColor: 'green', placements: 3, date: '12.10.2023', projectId: 1 },
  { id: 2, name: 'Обзор рынка недвижимости за третий квартал', advertiser: 'Урбан Групп', type: 'Пост', status: 'На модерации', statusColor: 'blue', placements: 0, date: '14.10.2023', projectId: 2 },
  { id: 3, name: 'Интервью с генеральным директором', advertiser: 'ООО "Финтех Решения"', type: 'Статья', status: 'Требуются правки', statusColor: 'amber', placements: 0, date: '15.10.2023', projectId: 1 },
  { id: 4, name: 'Кейс внедрения системы управления клиентами', advertiser: 'ТехКорп', type: 'Кейс', status: 'Используется в заказах', statusColor: 'indigo', placements: 5, date: '10.10.2023', projectId: 3 },
  { id: 5, name: 'Заметка о новом продукте', advertiser: 'Урбан Групп', type: 'Новость', status: 'Принят в систему', statusColor: 'green', placements: 0, date: '17.10.2023', projectId: null },
  { id: 6, name: 'Материал с запрещенными обещаниями', advertiser: 'ТехКорп', type: 'Статья', status: 'Отклонен', statusColor: 'red', placements: 0, date: '11.10.2023', projectId: null },
  { id: 7, name: 'Публикация про отраслевую конференцию', advertiser: 'ООО "Финтех Решения"', type: 'Пресс-релиз', status: 'Принят в систему', statusColor: 'green', placements: 2, date: '01.09.2023', projectId: 3 },
];

const initialProjects = [
  {
    id: 1,
    code: 'PR-001',
    name: 'Запуск платформы аналитики',
    description: 'Серия публикаций о запуске продукта и его возможностях для пиар-команд.',
    advertisers: ['ООО "Финтех Решения"'],
    status: 'Активный',
    updatedAt: '18.10.2023',
  },
  {
    id: 2,
    code: 'PR-002',
    name: 'Рынок недвижимости: третий квартал',
    description: 'Публикации с итогами квартала для деловых и отраслевых площадок.',
    advertisers: ['Урбан Групп'],
    status: 'Активный',
    updatedAt: '17.10.2023',
  },
  {
    id: 3,
    code: 'PR-003',
    name: 'Кейсы цифровой трансформации',
    description: 'Завершенная серия кейсов внедрения корпоративных решений.',
    advertisers: ['ТехКорп', 'ООО "Финтех Решения"'],
    status: 'Завершен',
    updatedAt: '10.10.2023',
  },
];

const placementFormatFilterOptions = ['Все форматы', 'Статья', 'Новость', 'Пост', 'Лонгрид'];

const mockCatalog = [
  { id: 101, name: 'РБК Инвестиции', type: 'СМИ', theme: 'Финансы', region: 'Федеральный охват', goals: ['Пиар', 'SEO'], formats: ['Статья', 'Новость'], format: 'Статья', price: 150000, reach: '2,5 млн/мес', mediology: 'A+', aggregators: ['Google News', 'Дзен'], deadline: '2 дня', storage: '2 года', tags: ['Проверено', 'Маркировка'], logo: 'bg-[#0b3558]' },
  { id: 102, name: 'Технологии сегодня', type: 'ТГ-канал', theme: 'ИТ', region: 'Центральный федеральный округ', goals: ['Пиар', 'SEO'], formats: ['Пост'], format: 'Пост', price: 45000, reach: '125 тыс. подписчиков', mediology: 'B+', aggregators: ['Дзен'], deadline: '1 день', storage: '2 года', tags: ['Проверено', 'Маркировка'], logo: 'bg-[#006bff]' },
  { id: 103, name: 'VC.ru', type: 'СМИ', theme: 'Бизнес', region: 'Федеральный охват', goals: ['Пиар', 'SEO', 'SERM'], formats: ['Статья', 'Новость', 'Лонгрид'], format: 'Лонгрид', price: 80000, reach: '1,2 млн/мес', mediology: 'A', aggregators: ['Google News', 'Дзен'], deadline: '4 дня', storage: '2 года', tags: ['SEO', 'Маркировка'], logo: 'bg-pink-600' },
  { id: 104, name: 'Код Дурова', type: 'ТГ-канал', theme: 'ИТ', region: 'Федеральный охват', goals: ['Пиар', 'SERM'], formats: ['Пост'], format: 'Пост', price: 60000, reach: '200 тыс. подписчиков', mediology: 'B', aggregators: ['нет'], deadline: '1 день', storage: '2 года', tags: ['Проверено', 'Маркировка'], logo: 'bg-[#0b3558]' },
  { id: 105, name: 'Бизнес Среда', type: 'Паблик ВК', theme: 'Бизнес', region: 'Приволжский федеральный округ', goals: ['Пиар', 'SERM'], formats: ['Пост'], format: 'Пост', price: 146000, reach: '2,4 млн/мес', mediology: 'A-', aggregators: ['Дзен'], deadline: '3 дня', storage: '2 года', tags: ['Без удаления', 'Пиар'], logo: 'bg-emerald-700' },
];

const platformFormatPrices = {
  101: { Статья: 150000, Новость: 85000 },
  102: { Пост: 45000 },
  103: { Статья: 80000, Новость: 55000 },
  104: { Пост: 60000 },
  105: { Пост: 146000 },
};

const getMaterialCommercialFormat = (material, platform) => {
  if (['ТГ-канал', 'Паблик ВК', 'Канал в MAX', 'Канал в Дзене'].includes(platform?.type)) return 'Пост';
  return material?.type === 'Новость' ? 'Новость' : 'Статья';
};
const apiFormatByLabel = { 'Статья':'article', 'Новость':'news', 'Пост':'post', 'Лонгрид':'longread' };
const getPlatformPriceForFormat = (platform, format) => {
  if (platform.prices) {
    const key = apiFormatByLabel[format];
    if (!key) return 0;
    const today=new Date().toISOString().slice(0,10);
    const seasonal=(!platform.season_start||String(platform.season_start).slice(0,10)<=today)&&(!platform.discount_until||String(platform.discount_until).slice(0,10)>=today);
    return Math.round(platform.prices[key] * (seasonal?platform.coefficient_bps:10000) * (10000 - (seasonal&&platform.discount_until?platform.discount_bps:0)) / 100000000) / 100;
  }
  return platform.formatPrices?.[format] ?? platformFormatPrices[platform.id]?.[format] ?? platform.price;
};
const getPlatformBasePriceForFormat = (platform, format) => {
  if (platform.prices) {
    const key = apiFormatByLabel[format];
    if (!key || !platform.prices[key]) return 0;
    const today=new Date().toISOString().slice(0,10);
    const seasonal=(!platform.season_start||String(platform.season_start).slice(0,10)<=today)&&(!platform.discount_until||String(platform.discount_until).slice(0,10)>=today);
    return Math.round(platform.prices[key] * (seasonal?platform.coefficient_bps:10000) / 10000) / 100;
  }
  return platform.formatPrices?.[format] ?? platformFormatPrices[platform.id]?.[format] ?? platform.price;
};
const getPlatformPriceForMaterial = (platform, material) => getPlatformPriceForFormat(platform,getMaterialCommercialFormat(material,platform));

const mockOrdersClient = [
  { id: 1045, material: 'Пресс-релиз: Запуск новой платформы', platform: 'РБК Инвестиции', price: 150000, frozen: 150000, status: 'Ожидает приемки', statusColor: 'indigo', date: '15.10.2023', action: 'Проверить публикацию', projectId: 1 },
  { id: 1048, material: 'Пресс-релиз: Запуск новой платформы', platform: 'Технологии сегодня', price: 45000, frozen: 45000, status: 'Площадка рассматривает', statusColor: 'blue', date: '16.10.2023', action: 'Дождаться площадки', projectId: 1 },
  { id: 1052, material: 'Кейс внедрения системы управления клиентами', platform: 'VC.ru', price: 80000, frozen: 0, status: 'Завершено', statusColor: 'gray', date: '10.10.2023', action: 'Открыть отчет', projectId: 3 },
  { id: 1054, material: 'Интервью с генеральным директором', platform: 'Код Дурова', price: 60000, frozen: 60000, status: 'Площадка запросила правки', statusColor: 'amber', date: '18.10.2023', action: 'Внести правки', projectId: 1 },
  { id: 1055, material: 'Обзор рынка недвижимости за третий квартал', platform: 'Бизнес Среда', price: 146000, frozen: 0, status: 'Площадка отказала', statusColor: 'red', date: '19.10.2023', action: 'Посмотреть причину', projectId: 2 },
];

const mockOrdersPublisher = [
  { id: 1045, material: 'Пресс-релиз: Запуск новой платформы', platform: 'РБК Инвестиции', advertiser: 'Заказчик #842', price: 127500, status: 'Ожидает публикации', statusColor: 'amber', date: '16.10.2023', format: 'СМИ (Статья)' },
  { id: 1048, material: 'Анонс вебинара по инвестициям', platform: 'РБК Инвестиции', advertiser: 'Заказчик #112', price: 85000, status: 'Новая заявка', statusColor: 'blue', date: '18.10.2023', format: 'СМИ (Новость)' },
  { id: 1052, material: 'Обзор ИТ рынка', platform: 'РБК Инвестиции', advertiser: 'Заказчик #55', price: 150000, status: 'Завершено', statusColor: 'gray', date: '05.10.2023', format: 'СМИ (Лонгрид)' },
  { id: 1054, material: 'Интервью с генеральным директором', platform: 'Код Дурова', advertiser: 'Заказчик #901', price: 60000, status: 'Ожидает публикации', statusColor: 'amber', date: '18.10.2023', format: 'ТГ-канал (Пост)' },
  { id: 1055, material: 'Кейс внедрения системы управления клиентами', platform: 'Бизнес Среда', advertiser: 'Заказчик #842', price: 146000, status: 'Жалоба открыта', statusColor: 'red', date: '19.10.2023', format: 'Паблик ВК (Пост)' },
];

const mockTransactions = [
  { id: 'TR-986', type: 'Возврат', desc: 'Автоматически отозванный заказ #1055', amount: 146000, date: '19.10.2023 18:10', status: 'Возврат' },
  { id: 'TR-985', type: 'Списание', desc: 'Оплата размещения #1052', amount: -80000, date: '18.10.2023 15:40', status: 'Списано' },
  { id: 'TR-984', type: 'Удержание', desc: 'Жалоба по заказу #1055', amount: -52000, date: '18.10.2023 12:00', status: 'Удержание' },
  { id: 'TR-983', type: 'Комиссия', desc: 'Комиссия платформы 15% с пополнения', amount: -75000, date: '17.10.2023 10:02', status: 'Комиссия' },
  { id: 'TR-982', type: 'Заморозка', desc: 'Заказ #1048 (Технологии сегодня)', amount: -45000, date: '16.10.2023 14:30', status: 'Заморожено' },
  { id: 'TR-981', type: 'Заморозка', desc: 'Заказ #1045 (РБК Инвестиции)', amount: -150000, date: '15.10.2023 10:15', status: 'Заморожено' },
  { id: 'TR-980', type: 'Вывод', desc: 'Выплата паблишеру РБК Инвестиции', amount: -430000, date: '01.10.2023 12:00', status: 'Выплачено' },
  { id: 'TR-979', type: 'Пополнение', desc: 'Входящий банковский перевод', amount: 500000, date: '01.10.2023 11:20', status: 'Доступно' },
];

const financialTransactions = (rows = [], userId, orders = [], materials = []) => rows.map((row) => {
  const reference = String(row.reference || '');
  const orderId = reference.match(/^(?:demo:)?order:([^:]+)/)?.[1];
  const order = orders.find((item) => item.id === orderId);
  const orderLabel = order ? `№${orderNumber(order)}` : '';
  const materialId = reference.match(/^(?:demo:)?moderation(?:-refund)?:([^:]+)/)?.[1];
  const material = materials.find((item) => item.id === materialId);
  const materialLabel = material ? ` материала №${materialNumber(material)}` : '';
  const availableAccount = `${userId}:available`;
  const reservedAccount = `${userId}:reserved`;
  const amount = Number(row.amount) / 100;
  const signedAmount = row.credit_account === availableAccount
    ? amount
    : row.debit_account === availableAccount || row.debit_account === reservedAccount
      ? -amount
      : amount;
  const kind = reference.startsWith('moderation-refund:') || reference.includes(':refund') || (reference.includes(':dispute:') && reference.endsWith(':customer')) ? 'Возврат'
    : reference.includes(':reserve') ? 'Заморозка'
      : reference.includes(':payout') || (reference.includes(':dispute:') && reference.endsWith(':publisher')) ? row.credit_account === availableAccount ? 'Начисление' : 'Списание'
        : reference.includes(':commission') ? 'Комиссия'
          : row.credit_account === availableAccount ? 'Пополнение' : 'Списание';
  const orderSuffix = orderLabel ? ` · заказ ${orderLabel}` : ' · заказ';
  const description = materialId
    ? `${reference.includes('moderation-refund:') ? 'Возврат оплаты ускоренной модерации' : 'Оплата ускоренной модерации'}${materialLabel}`
    : orderId
      ? `${reference.endsWith(':reserve') ? 'Средства зарезервированы' : reference.endsWith(':refund') ? 'Средства возвращены' : reference.includes(':dispute:') ? reference.endsWith(':customer') ? 'Возврат по решению спора' : reference.endsWith(':publisher') ? 'Выплата паблишеру по спору' : 'Комиссия по решению спора' : reference.endsWith(':payout') ? 'Оплата размещения' : reference.endsWith(':commission') ? 'Комиссия платформы' : 'Операция'}${orderSuffix}`
      : reference === 'demo:opening-balance' ? 'Начальный баланс'
        : reference.startsWith('topup-reversal:') ? 'Возврат ранее зачисленного пополнения'
          : reference.startsWith('topup-debt:') ? 'Погашение задолженности по пополнению'
            : reference.startsWith('topup:') ? 'Пополнение баланса по счету'
              : reference.startsWith('payout:') ? reference.endsWith(':reserve') ? 'Средства зарезервированы для выплаты' : reference.endsWith(':transferred') ? 'Выплата перечислена' : 'Средства по заявке на выплату возвращены'
                : reference.startsWith('adjustment:') ? 'Ручная корректировка баланса'
                  : reference.endsWith(':funding') || reference === 'test-only' ? 'Пополнение внутреннего баланса'
                    : 'Операция по балансу';
  return {
    id: String(row.id).slice(0, 8).toUpperCase(),
    type: kind,
    desc: description,
    amount: signedAmount,
    date: new Date(row.created_at).toLocaleString('ru-RU'),
    status: 'Проведено',
  };
});

const mockAdvertisers = [
  { id: 1, code: 'A-842', name: 'ООО "Финтех Решения"', type: 'Юридическое лицо', inn: '7700000000', ogrn: '1237700000000', status: 'Проверен', color: 'green' },
  { id: 2, code: 'A-901', name: 'АО "Урбан Групп"', type: 'Юридическое лицо', inn: '7709000000', ogrn: '1237709000000', status: 'Проверка запрошена', color: 'amber' },
  { id: 3, code: 'A-112', name: 'ИП Смирнова Анна', type: 'Индивидуальный предприниматель', inn: '771100000000', ogrn: '323770000000000', status: 'Не проверялся', color: 'gray' },
];

const initialPublisherApplications = [
  {
    id: 'PA-014',
    submittedAt: '23.07.2026, 10:42',
    status: 'Новая',
    accountStatus: 'Не создан',
    applicant: 'Анна Смирнова',
    position: 'Коммерческий директор',
    email: 'partner@investor.ru',
    phone: '+7 999 000-00-00',
    relation: 'Сотрудник редакции',
    platform: 'Investor.ru',
    platformType: 'Онлайн-СМИ',
    platformUrl: 'https://investor.ru',
    legalName: 'ООО «Инвестор Медиа»',
    inn: '7701000000',
    theme: 'Финансы, инвестиции, бизнес',
    reach: '2,5 млн посещений в месяц',
    comment: 'Готовы предоставить доступ к Метрике и официальный контакт редакции.',
    checks: { resource: true, legal: true, representative: false, duplicate: true },
    decisionComment: '',
  },
  {
    id: 'PA-013',
    submittedAt: '22.07.2026, 16:15',
    status: 'Нужны данные',
    accountStatus: 'Не создан',
    applicant: 'Илья Морозов',
    position: 'Владелец',
    email: 'owner@city-media.ru',
    phone: '+7 916 400-12-30',
    relation: 'Владелец',
    platform: 'Городские новости',
    platformType: 'Telegram-канал',
    platformUrl: 'https://t.me/city_media',
    legalName: 'ИП Морозов Илья Андреевич',
    inn: '771100000000',
    theme: 'Город, общество',
    reach: '84 тыс. подписчиков',
    comment: '',
    checks: { resource: true, legal: true, representative: false, duplicate: true },
    decisionComment: 'Нужен официальный контакт в описании канала или подтверждение владения.',
  },
  {
    id: 'PA-012',
    submittedAt: '21.07.2026, 12:30',
    status: 'Одобрена',
    accountStatus: 'Приглашение отправлено',
    applicant: 'Мария Лебедева',
    position: 'Главный редактор',
    email: 'editor@business-review.ru',
    phone: '+7 495 100-10-10',
    relation: 'Сотрудник редакции',
    platform: 'Business Review',
    platformType: 'Онлайн-СМИ',
    platformUrl: 'https://business-review.ru',
    legalName: 'ООО «Бизнес Ревью»',
    inn: '7722000000',
    theme: 'Бизнес, управление',
    reach: '940 тыс. посещений в месяц',
    comment: 'Приглашение отправлено владельцу кабинета.',
    checks: { resource: true, legal: true, representative: true, duplicate: true },
    decisionComment: 'Площадка и представитель подтверждены.',
  },
];

const getInformerFormat = (item) => item.format || (item.category === 'Полезное' ? 'Внешняя ссылка' : 'Подборка площадок');

const getInformerSelectionOptions = (format, platforms = []) => (
  format === 'Подборка площадок'
    ? platforms.map((platform) => ({
      value: String(platform.id),
      label: platform.name,
      description: `${platform.type} · ${platform.theme} · ${formatMoney(platform.price)}`,
    }))
    : []
);

const initialInformerItems = [
  {
    id: 'INF-001',
    category: 'Новинки',
    format: 'Подборка площадок',
    eyebrow: 'Новые площадки',
    title: 'В каталоге появились 12 новых медиа',
    text: 'Онлайн-СМИ, Telegram-каналы и региональные площадки уже доступны для размещения.',
    action: 'Смотреть площадки',
    target: 'Каталог',
    icon: 'store',
    accent: 'blue',
    status: 'Опубликован',
    startsAt: '23.07.2026',
    endsAt: 'Без срока',
    updatedAt: '23.07.2026, 09:20',
    selectionIds: ['101', '102', '105'],
    targetUrl: '',
  },
  {
    id: 'INF-002',
    category: 'Пакеты',
    format: 'Подборка площадок',
    eyebrow: 'Пакетное размещение',
    title: 'Один материал сразу в пяти бизнес-медиа',
    text: 'Готовая подборка площадок с единым бюджетом и согласованными сроками публикации.',
    action: 'Выбрать пакет',
    target: 'Каталог',
    icon: 'briefcase',
    accent: 'green',
    status: 'Опубликован',
    startsAt: '23.07.2026',
    endsAt: '31.07.2026',
    updatedAt: '23.07.2026, 09:10',
    selectionIds: ['101', '102', '103', '104', '105'],
    packagePrice: '320000',
    targetUrl: '',
  },
  {
    id: 'INF-003',
    category: 'Скидки',
    format: 'Подборка площадок',
    eyebrow: 'Специальные условия',
    title: 'До 20% на размещения этой недели',
    text: 'Площадки со свободными слотами снизили стоимость публикации на ближайшие даты.',
    action: 'Смотреть предложения',
    target: 'Каталог',
    icon: 'credit',
    accent: 'amber',
    status: 'Опубликован',
    startsAt: '23.07.2026',
    endsAt: '27.07.2026',
    updatedAt: '23.07.2026, 09:05',
    selectionIds: ['102', '103'],
    targetUrl: '',
  },
  {
    id: 'INF-004',
    category: 'Полезное',
    format: 'Внешняя ссылка',
    eyebrow: 'Новости и гайды',
    title: 'Как подготовить материал к размещению',
    text: 'Короткий гид по модерации, маркировке и требованиям площадок перед запуском заказа.',
    action: 'Читать в базе знаний',
    target: 'Внешняя ссылка',
    icon: 'file',
    accent: 'violet',
    status: 'Опубликован',
    startsAt: '20.07.2026',
    endsAt: 'Без срока',
    updatedAt: '22.07.2026, 18:40',
    selectionIds: [],
    targetUrl: 'https://help.axioma.ru/guides/material-for-publication',
  },
];

const mockAdminQueue = [
  { id: '№1052', object: 'Новость компании', type: 'Материал', risk: 'Ссылки', status: 'На модерации', color: 'amber' },
  { id: '#P-044', object: 'Новая площадка', type: 'Площадка', risk: 'Метрики', status: 'Проверить', color: 'blue' },
  { id: '#C-019', object: 'Жалоба по заказу #1045', type: 'Спор', risk: 'Маркировка', status: 'Решить', color: 'red' },
];

const mockExpeditedModeration = [
  {
    id: '№1052',
    title: 'Новость компании',
    customer: 'Заказчик #842',
    submittedAt: 'сегодня, 12:40',
    deadline: 'проверить до 13:10',
    row: ['№1052', 'Новость компании', 'Материал', 'Ожидает проверки', 'Принять / правки / отклонить'],
  },
  {
    id: '№1061',
    title: 'Исследование рынка корпоративных сервисов',
    customer: 'Заказчик #916',
    submittedAt: 'сегодня, 12:51',
    deadline: 'проверить до 13:21',
    row: ['№1061', 'Исследование рынка корпоративных сервисов', 'Материал', 'Ожидает проверки', 'Принять / правки / отклонить'],
  },
];

const materialStates = ['Черновик', 'На модерации', 'Требуются правки', 'Отклонен', 'Принят в систему', 'Используется в заказах'];
const orderStates = ['Заявка создана', 'Средства заморожены', 'Площадка рассматривает', 'Площадка приняла', 'Площадка запросила правки', 'Маркировка подтверждена', 'Публикация загружена', 'Ожидает приемки', 'Оплачено', 'Завершено', 'Отклонено', 'Автоматически отозвано'];
const complaintStates = ['Черновик', 'Открыта', 'На рассмотрении', 'Нужны доказательства', 'Решена в пользу заказчика', 'Решена в пользу паблишера', 'Удержание применено'];

const publisherPlatforms = [
  { id: 'PUB-01', name: 'РБК Инвестиции', type: 'СМИ', theme: 'Финансы', region: 'Федеральный охват', formats: 'Статья, новость, интервью', price: '150 000 ₽ / статья', answer: '8 часов', publication: '2 дня', storage: '2 года', metrics: '2,5 млн визитов/мес, Google News, Дзен', status: 'Активна', color: 'green' },
  { id: 'PUB-02', name: 'РБК Телеграм', type: 'ТГ-канал', theme: 'Финансы', region: 'Федеральный охват', formats: 'Пост, репост', price: '60 000 ₽ / пост', answer: '4 часа', publication: '1 день', storage: '2 года', metrics: '210 тыс. подписчиков, вовлеченность 12%', status: 'На проверке', color: 'blue' },
  { id: 'PUB-03', name: 'РБК Бизнес ВК', type: 'Паблик ВК', theme: 'Бизнес', region: 'Москва', formats: 'Пост, карточки', price: '85 000 ₽ / пост', answer: '1 день', publication: '3 дня', storage: '2 года', metrics: '480 тыс. подписчиков', status: 'Требуются правки', color: 'amber' },
];

const advertiserLegalData = [
  ['Юрлицо', 'ООО "Финтех Решения"'],
  ['ИНН', '7700000000'],
  ['ОГРН', '1237700000000'],
  ['Адрес', '119019, Москва, ул. Воздвиженка, 10'],
  ['Категория', 'ПО для бизнеса / аналитика'],
];

const materialLinks = [
  'https://axioma.example/product',
  'https://axioma.example/research/2026',
];

const mockSystemEvents = [
  'Заказ создан',
  'Средства заморожены',
  'Площадка приняла заказ',
  'Площадка загрузила ссылку',
  'Заказ перешел на приемку',
];

const mockAdminSections = {
  admin_moderation: {
    title: 'Материалы на модерации',
    rows: [
      ['№1052', 'Новость компании', 'Материал', 'Ожидает проверки', 'Принять / правки / отклонить'],
      ['№1054', 'Интервью с генеральным директором', 'Материал', 'Риск/нарушение', 'Запросить правки'],
      ['#P-044', 'Новая площадка', 'Площадка', 'Ожидает проверки', 'Проверить метрики'],
    ],
  },
  admin_orders: {
    title: 'Заказы',
    rows: [
      ['#1045', 'Ожидает приемки', '150 000 ₽', 'РБК Инвестиции', 'Открыть заказ'],
      ['#1048', 'Площадка рассматривает', '45 000 ₽', 'Технологии сегодня', 'Открыть заказ'],
      ['#1052', 'Завершено', '80 000 ₽', 'VC.ru', 'Открыть заказ'],
      ['#1054', 'Площадка запросила правки', '60 000 ₽', 'Код Дурова', 'Открыть заказ'],
      ['#1055', 'Площадка отказала', '146 000 ₽', 'Бизнес Среда', 'Открыть заказ'],
    ],
  },
  admin_users: {
    title: 'Пользователи',
    rows: [
      ['U-842', 'ООО «Финтех Решения»', 'Заказчик', 'Активен', 'Открыть профиль'],
      ['P-017', 'Редакция РБК Инвестиции', 'Паблишер', 'Активен', 'Открыть профиль'],
      ['U-901', 'АО «Урбан Групп»', 'Заказчик', 'Заблокирован', 'Открыть профиль'],
      ['P-044', 'Редакция «Технологии сегодня»', 'Паблишер', 'На проверке', 'Проверить профиль'],
    ],
  },
  admin_platforms: {
    title: 'Площадки',
    rows: [
      ['#P-017', 'РБК Инвестиции', 'СМИ', 'Принята', 'Проверить карточку'],
      ['#P-044', 'Новая площадка', 'ТГ-канал', 'Требуются правки', 'Запросить данные'],
    ],
  },
  admin_balances: {
    title: 'Балансы',
    rows: [
      ['Заказчик #842', '1 250 000 ₽', '345 000 ₽', 'Доступно / заморожено', 'Открыть операции'],
      ['РБК Инвестиции', '235 000 ₽', '127 500 ₽', 'Доступно / ожидает приемки', 'Проверить выплату'],
    ],
  },
  admin_operations: {
    title: 'Операции',
    rows: [
      ['TR-983', 'Комиссия', '-75 000 ₽', 'Комиссия 15%', 'Проверено'],
      ['TR-982', 'Заморозка', '-45 000 ₽', 'Заказ #1048', 'Активно'],
      ['TR-986', 'Возврат', '+146 000 ₽', 'Отозванный заказ', 'Завершено'],
    ],
  },
  admin_complaints: {
    title: 'Жалобы',
    rows: [
      ['C-019', 'Заказ #1045', 'Нужны доказательства', 'Ссылка и веб-архив', 'Применить удержание'],
      ['C-020', 'Заказ #1055', 'Удержание применено', 'Удаление раньше срока', 'Закрыто'],
    ],
  },
  admin_payouts: {
    title: 'Выплаты',
    rows: [
      ['W-112', 'РБК Инвестиции', '235 000 ₽', 'На выводе', 'Подтвердить выплату'],
      ['W-108', 'VC.ru', '430 000 ₽', 'Выплачено', 'Открыть платежку'],
    ],
  },
  admin_advertisers: {
    title: 'Рекламодатели',
    rows: [
      ['A-842', 'ООО «Финтех Решения»', 'Юрлицо', 'Ожидает проверки', 'Запросить проверку'],
      ['A-901', 'АО «Урбан Групп»', 'Юрлицо', 'Проверен', 'Открыть проверку'],
    ],
  },
  admin_support: {
    title: 'Поддержка',
    rows: [
      ['T-118', 'Не проходит выплата', 'Открыт · высокий приоритет', 'Паблишер РБК Инвестиции · 24 мин', 'Ответить'],
      ['T-117', 'Вопрос по модерации', 'Закрыт', 'Заказчик #842 · закрыт вчера', 'Открыть тикет'],
    ],
  },
  admin_documents: {
    title: 'Документы',
    rows: [
      ['D-2048', 'Отчет по заказу #1045', 'Отчет', 'Готов к выдаче', 'Открыть'],
      ['D-2047', 'Счет на пополнение', 'Счет', 'Ожидает оплаты', 'Проверить'],
    ],
  },
  admin_audit: {
    title: 'Журнал действий',
    rows: [
      ['LOG-8841', 'moderator@axioma.ru', 'Изменен статус материала', '№1052 · 13:42', 'Открыть событие'],
      ['LOG-8840', 'finance@axioma.ru', 'Подтверждена выплата', 'W-108 · 13:18', 'Открыть событие'],
    ],
  },
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
};

const toDateInputValue = (value) => {
  if (!value || value === 'Без срока') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
};

const formatInformerDate = (value) => {
  if (!value || value === 'Без срока') return 'Без срока';
  const normalized = toDateInputValue(value);
  if (!normalized) return value;
  const [year, month, day] = normalized.split('-');
  return `${day}.${month}.${year}`;
};

const parseReportDate = (value) => {
  if (!value) return null;
  const [day, month, year] = value.split('.').map(Number);
  return new Date(year, month - 1, day);
};

const formatInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatReportPeriod = (from, to) => {
  const format = (value) => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${day}.${month}.${year}`;
  };
  return `${format(from)} — ${format(to)}`;
};


// --- КОМПОНЕНТЫ ИНТЕРФЕЙСА ---

const Badge = ({ children, color = 'gray', className = '', ...props }) => {
  const colors = {
    gray: 'bg-[#f0f3f8] text-[#004eba] border-[#f0f3f8]',
    green: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
    blue: 'bg-[#e6f0ff] text-[#004eba] border-[#e6f0ff]',
    amber: 'bg-[#f0f3f8] text-[#0b3558] border-[#d4e0ed]',
    indigo: 'bg-[#e6f0ff] text-[#004eba] border-[#e6f0ff]',
    red: 'bg-white text-[#ef4444] border-[#ef4444]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${colors[color]} ${className}`} {...props}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseStyle = "inline-flex min-w-0 shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006bff] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100";
  const sizes = {
    sm: "h-9 rounded-lg px-3.5 text-xs",
    md: "h-11 rounded-xl px-5 text-sm",
    lg: "h-12 rounded-xl px-6 text-base",
    icon: "h-10 w-10 rounded-xl p-0",
  };
  const variants = {
    primary: "border border-[#006bff] bg-[#006bff] text-white shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.06)_0px_15px_30px_0px] hover:border-[#0057d6] hover:bg-[#0057d6]",
    secondary: "border border-[#d4e0ed] bg-white text-[#0b3558] hover:border-[#a6bbd1] hover:bg-[#f0f3f8]",
    ghost: "border border-transparent bg-transparent text-[#0b3558] hover:bg-[#f0f3f8]",
    dark: "border border-[#0b3558] bg-[#0b3558] text-white shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.06)_0px_15px_30px_0px] hover:border-[#092c49] hover:bg-[#092c49]",
    danger: "border border-[#fecaca] bg-white text-[#dc2626] hover:border-[#ef4444] hover:bg-[#fef2f2]",
  };
  return (
    <button className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`;
};

const FileUploadField = ({
  accept = undefined,
  multiple = true,
  prompt = 'Выберите файлы или перетащите их сюда',
  hint = 'Максимальный размер одного файла — 20 МБ',
  compact = false,
  storedIds = undefined,
  onStoredChange = undefined,
  imagesOnly = false,
}) => {
  const backend = useBackend();
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    if(!storedIds) return;
    let active=true;
    Promise.all(storedIds.map(id=>api(`/files/${id}/meta`))).then(items=>{if(active)setFiles(items.filter(f=>imagesOnly ? f.mime.startsWith('image/') : !f.mime.startsWith('image/')));}).catch(e=>backend.setError(e.message));
    return ()=>{active=false;};
  },[JSON.stringify(storedIds),imagesOnly]);

  const addFiles = (incomingFiles) => {
    const nextFiles = Array.from(incomingFiles || []);
    if (!nextFiles.length) return;
    if(onStoredChange) {
      backend.perform(async () => {
        const ids=[...(storedIds||[])];
        for(const file of nextFiles as File[]) {
          const uploaded=await uploadFile(file);ids.push(uploaded.id);
          onStoredChange([...ids]);
        }
      });return;
    }

    setFiles((currentFiles) => {
      const sourceFiles = multiple ? [...currentFiles, ...nextFiles] : nextFiles.slice(0, 1);
      return sourceFiles.filter((file, index, allFiles) => (
        allFiles.findIndex((candidate) => (
          candidate.name === file.name
          && candidate.size === file.size
          && candidate.lastModified === file.lastModified
        )) === index
      ));
    });
  };

  const openFilePicker = () => inputRef.current?.click();
  const removeFile = (fileToRemove) => {
    if(onStoredChange) {onStoredChange(storedIds.filter(id=>id!==fileToRemove.id));return;}
    setFiles((currentFiles) => currentFiles.filter((file) => file !== fileToRemove));
  };

  const fileList = files.length > 0 && (
    <div className={`space-y-2 ${compact ? 'mt-3' : 'mt-3'}`}>
      {files.map((file) => (
        <div
          key={`${file.name}-${file.size}-${file.lastModified}`}
          className="flex min-w-0 items-center gap-3 rounded-lg border border-[#d4e0ed] bg-white px-3 py-2"
        >
          <FileText className="h-4 w-4 flex-none text-[#006bff]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-[#0b3558]">{file.name}</div>
            <div className="text-xs text-[#476788]">{formatFileSize(file.size)}</div>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#476788] transition-colors hover:bg-red-50 hover:text-red-600"
            onClick={() => removeFile(file)}
            aria-label={`Удалить файл ${file.name}`}
            title="Удалить файл"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {compact ? (
        <Button type="button" variant="secondary" onClick={openFilePicker}>
          <Paperclip className="mr-2 h-4 w-4" />
          Прикрепить файл
        </Button>
      ) : (
        <button
          type="button"
          className={`mt-2 flex min-h-[132px] w-full flex-col items-center justify-center rounded-lg border border-dashed px-6 py-5 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#006bff] ${
            isDragging
              ? 'border-[#006bff] bg-[#e6f0ff]'
              : 'border-[#476788] bg-[#f8f9fb] hover:border-[#006bff] hover:bg-[#f3f7ff]'
          }`}
          onClick={openFilePicker}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <UploadCloud className="h-6 w-6 text-[#006bff]" />
          <span className="mt-3 text-sm font-semibold text-[#0b3558]">{prompt}</span>
          <span className="mt-1 text-xs text-[#476788]">{hint}</span>
        </button>
      )}

      {fileList}
    </div>
  );
};

const useSelectMenuPosition = (isOpen, triggerRef, optionCount) => {
  const [menuPosition, setMenuPosition] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }

    const updateMenuPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const viewportPadding = 12;
      const estimatedHeight = Math.min(288, Math.max(72, optionCount * 48 + 12));
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
      const spaceAbove = rect.top - gap - viewportPadding;
      const openAbove = spaceBelow < Math.min(estimatedHeight, 220) && spaceAbove > spaceBelow;
      const availableSpace = openAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(96, Math.min(288, availableSpace));
      const visibleHeight = Math.min(estimatedHeight, maxHeight);

      setMenuPosition({
        left: Math.max(viewportPadding, rect.left),
        top: openAbove
          ? Math.max(viewportPadding, rect.top - visibleHeight - gap)
          : Math.min(window.innerHeight - viewportPadding - visibleHeight, rect.bottom + gap),
        width: Math.min(rect.width, window.innerWidth - viewportPadding * 2),
        maxHeight,
      });
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [isOpen, optionCount, triggerRef]);

  return menuPosition;
};

const CustomSelect = ({ options, defaultValue = undefined, value: controlledValue = undefined, placeholder = undefined, onChange = undefined, className = '', buttonClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const optionValue = (option) => typeof option === 'object' ? option.value : option;
  const optionLabel = (option) => typeof option === 'object' ? option.label : option;
  const firstOptionValue = options.length ? optionValue(options[0]) : undefined;
  const [value, setValue] = useState(defaultValue ?? (placeholder ? undefined : firstOptionValue));
  const selectRef = useRef(null);
  const menuRef = useRef(null);
  const selectIdRef = useRef(`custom-select-${Math.random().toString(36).slice(2)}`);
  const selectedValue = controlledValue ?? value;
  const selectedOption = options.find((option) => optionValue(option) === selectedValue);
  const displayValue = selectedOption ? optionLabel(selectedOption) : placeholder ?? (options.length ? optionLabel(options[0]) : '');
  const listboxId = `${selectIdRef.current}-listbox`;
  const menuPosition = useSelectMenuPosition(isOpen, selectRef, options.length);

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (
        selectRef.current
        && !selectRef.current.contains(event.target)
        && !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const closeOnOtherSelectOpen = (event) => {
      if (event.detail !== selectIdRef.current) {
        setIsOpen(false);
      }
    };
    const closeOnPageScroll = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('axioma-select-open', closeOnOtherSelectOpen);
    window.addEventListener('wheel', closeOnPageScroll, true);
    window.addEventListener('touchmove', closeOnPageScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('axioma-select-open', closeOnOtherSelectOpen);
      window.removeEventListener('wheel', closeOnPageScroll, true);
      window.removeEventListener('touchmove', closeOnPageScroll, true);
    };
  }, [isOpen]);

  const openSelect = () => {
    window.dispatchEvent(new CustomEvent('axioma-select-open', { detail: selectIdRef.current }));
    setIsOpen(true);
  };
  const selectOption = (option) => {
    const nextValue = optionValue(option);
    setValue(nextValue);
    onChange?.(nextValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        className={`w-full min-h-[42px] rounded-lg border border-[#476788] bg-white px-4 py-2.5 text-left text-sm text-[#0b3558] transition-colors focus:outline-none focus:ring-2 focus:ring-[#006bff] flex items-center justify-between gap-3 ${buttonClassName}`}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openSelect();
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
      >
        <span className={`truncate ${selectedValue ? '' : 'text-[#476788]'}`}>{displayValue}</span>
        <ChevronRight className={`w-4 h-4 text-[#476788] transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
      </button>
      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          className="ui-enter fixed z-[220] overflow-y-auto rounded-2xl border border-[#d4e0ed] bg-white p-1.5 shadow-[rgba(11,53,88,0.08)_0px_10px_24px,rgba(11,53,88,0.10)_0px_24px_60px]"
          style={menuPosition}
        >
          {options.map((option) => (
            <button
              key={optionValue(option)}
              type="button"
              role="option"
              aria-selected={selectedValue === optionValue(option)}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-3 ${selectedValue === optionValue(option) ? 'bg-[#e6f0ff] text-[#004eba] font-semibold' : 'text-[#0b3558] hover:bg-[#f8f9fb]'}`}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectOption(option);
              }}
              onClick={() => selectOption(option)}
            >
              <span className="truncate">{optionLabel(option)}</span>
              {selectedValue === optionValue(option) && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

const AddressInput = ({value,onChange,className,placeholder='',ariaInvalid=false}) => {
  const [suggestions,setSuggestions]=useState([]);
  const [open,setOpen]=useState(false);
  const [unavailable,setUnavailable]=useState(false);
  const triggerRef=useRef(null);
  const menuRef=useRef(null);
  const menuPosition=useSelectMenuPosition(open,triggerRef,suggestions.length);
  useEffect(()=>{
    if(!open||value.trim().length<3){setSuggestions([]);return;}
    let active=true;
    const timer=setTimeout(()=>{
      api(`/reference/addresses?query=${encodeURIComponent(value.trim())}`)
        .then(items=>{if(active){setSuggestions(items);setUnavailable(false);}})
        .catch(()=>{if(active){setSuggestions([]);setUnavailable(true);}});
    },300);
    return()=>{active=false;clearTimeout(timer);};
  },[value,open]);
  useEffect(()=>{
    if(!open)return;
    const closeOnOutside=event=>{if(!triggerRef.current?.contains(event.target)&&!menuRef.current?.contains(event.target))setOpen(false);};
    const closeOnScroll=event=>{if(!menuRef.current?.contains(event.target))setOpen(false);};
    const closeOnEscape=event=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('pointerdown',closeOnOutside);
    document.addEventListener('keydown',closeOnEscape);
    window.addEventListener('wheel',closeOnScroll,true);
    window.addEventListener('touchmove',closeOnScroll,true);
    return()=>{document.removeEventListener('pointerdown',closeOnOutside);document.removeEventListener('keydown',closeOnEscape);window.removeEventListener('wheel',closeOnScroll,true);window.removeEventListener('touchmove',closeOnScroll,true);};
  },[open]);
  const choose=item=>{onChange(item.value);setOpen(false);setSuggestions([]);};
  return <>
    <input ref={triggerRef} className={className} placeholder={placeholder} value={value} aria-invalid={ariaInvalid} onChange={event=>{onChange(event.target.value);setOpen(true);}} onFocus={()=>{if(value.trim().length>=3)setOpen(true);}} role="combobox" aria-autocomplete="list" aria-expanded={open&&suggestions.length>0} />
    {open&&suggestions.length>0&&menuPosition&&createPortal(<div ref={menuRef} role="listbox" className="fixed z-[220] overflow-y-auto rounded-2xl border border-[#d4e0ed] bg-white p-1.5 shadow-[rgba(11,53,88,0.08)_0px_10px_24px,rgba(11,53,88,0.10)_0px_24px_60px]" style={menuPosition}>
      {suggestions.map((item,index)=><button key={`${item.value}-${index}`} type="button" role="option" aria-selected="false" className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#0b3558] hover:bg-[#f8f9fb]" onPointerDown={event=>{event.preventDefault();choose(item);}} onClick={()=>choose(item)}>{item.label}</button>)}
    </div>,document.body)}
    {unavailable&&open&&<span className="mt-1 block text-xs text-[#476788]">Подсказки недоступны. Адрес можно ввести вручную.</span>}
  </>;
};

const CheckboxMultiSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите значения',
  selectedNoun = 'значений',
  emptyPlaceholder = 'Нет доступных вариантов',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const menuRef = useRef(null);
  const selectIdRef = useRef(`checkbox-select-${Math.random().toString(36).slice(2)}`);
  const selectedOptions = options.filter((option) => value.includes(option.value));
  const listboxId = `${selectIdRef.current}-listbox`;
  const menuPosition = useSelectMenuPosition(isOpen, selectRef, options.length + 1);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (
        selectRef.current
        && !selectRef.current.contains(event.target)
        && !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const closeOnOtherSelectOpen = (event) => {
      if (event.detail !== selectIdRef.current) setIsOpen(false);
    };
    const closeOnPageScroll = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('axioma-select-open', closeOnOtherSelectOpen);
    window.addEventListener('wheel', closeOnPageScroll, true);
    window.addEventListener('touchmove', closeOnPageScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('axioma-select-open', closeOnOtherSelectOpen);
      window.removeEventListener('wheel', closeOnPageScroll, true);
      window.removeEventListener('touchmove', closeOnPageScroll, true);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (!options.length) return;
    if (!isOpen) window.dispatchEvent(new CustomEvent('axioma-select-open', { detail: selectIdRef.current }));
    setIsOpen((current) => !current);
  };
  const toggleOption = (optionValue) => {
    onChange(value.includes(optionValue)
      ? value.filter((item) => item !== optionValue)
      : [...value, optionValue]);
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg border border-[#476788] bg-white px-4 py-2.5 text-left text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff] disabled:cursor-default disabled:border-[#d4e0ed] disabled:bg-[#f8f9fb]"
        disabled={!options.length}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
      >
        <span className={`min-w-0 truncate ${selectedOptions.length ? 'font-medium' : 'text-[#7d96af]'}`}>
          {selectedOptions.length
            ? selectedOptions.length === 1
              ? selectedOptions[0].label
              : `Выбрано ${selectedNoun}: ${selectedOptions.length}`
            : options.length ? placeholder : emptyPlaceholder}
        </span>
        {!!options.length && <ChevronRight className={`h-4 w-4 flex-none text-[#476788] transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} />}
      </button>
      {isOpen && !!options.length && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="ui-enter fixed z-[220] overflow-y-auto rounded-2xl border border-[#d4e0ed] bg-white p-1.5 shadow-[rgba(11,53,88,0.08)_0px_10px_24px,rgba(11,53,88,0.10)_0px_24px_60px]"
          style={menuPosition}
        >
          {options.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${selected ? 'bg-[#e6f0ff]' : 'hover:bg-[#f8f9fb]'}`}
                onClick={() => toggleOption(option.value)}
              >
                <span className={`flex h-5 w-5 flex-none items-center justify-center rounded border ${selected ? 'border-[#006bff] bg-[#006bff] text-white' : 'border-[#8badcf] bg-white'}`}>
                  {selected && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-medium ${selected ? 'text-[#004eba]' : 'text-[#0b3558]'}`}>{option.label}</span>
                  <span className="mt-0.5 block text-xs text-[#476788]">{option.description}</span>
                </span>
              </button>
            );
          })}
          <div className="mt-1 flex items-center justify-between border-t border-[#d4e0ed] px-3 pt-2">
            <span className="text-xs text-[#476788]">Выбрано: {selectedOptions.length}</span>
            <button type="button" className="text-xs font-semibold text-[#006bff]" onClick={() => setIsOpen(false)}>Готово</button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

const Card = React.forwardRef(({ children, className = '', ...props }, ref) => (
  <div ref={ref} className={`bg-white border border-[#d4e0ed] rounded-[24px] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.08)_0px_30px_50px_0px] ${className}`} {...props}>
    {children}
  </div>
));

const CollapsiblePanel = ({ open, children, className = '' }) => (
  <div className={`ui-collapsible ${className}`} data-open={open}>
    <div className="ui-collapsible-inner">{children}</div>
  </div>
);

const ActionResult = ({ text, tone = 'success' }) => text ? (
  <div className={`ui-enter rounded-lg border px-4 py-3 text-sm ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`} role="status">
    {text}
  </div>
) : null;

const FullMaterialPreview = ({ context = 'client', showLinks = true, showAttachments = true }) => (
  <div className="space-y-5">
    <div className="prose prose-sm max-w-none text-[#476788]">
      <h2 className="font-display text-2xl font-bold text-[#0b3558] mb-3">Финтех Решения запускает платформу аналитики для пиар-команд</h2>
      <p className="text-base leading-7">
        Компания <strong>«Финтех Решения»</strong> представила «Аксиома Аналитика» — облачную платформу, которая объединяет мониторинг публикаций,
        оценку эффективности пиар-размещений и контроль брендовых упоминаний в едином кабинете.
      </p>
      <p className="text-base leading-7">
        Решение ориентировано на бизнес-команды, которым важно видеть путь материала от подготовки до публикации: согласование текста,
        выбор площадки, проверку ссылок, сохранность публикации и итоговую отчетность.
      </p>
      <figure className="my-5">
        <div className="aspect-[16/7] rounded-2xl bg-[#f0f3f8] p-6 flex items-end overflow-hidden">
          <div className="grid grid-cols-3 gap-3 w-full">
            <div className="h-20 rounded-lg bg-white/20 border border-white/20" />
            <div className="h-28 rounded-lg bg-white/30 border border-white/30" />
            <div className="h-16 rounded-lg bg-white/20 border border-white/20" />
          </div>
        </div>
        <figcaption className="mt-2 text-xs text-[#476788]">Иллюстрация: аналитическая панель продукта</figcaption>
      </figure>
      <h3 className="text-lg font-semibold text-[#0b3558]">Что изменится для команд</h3>
      <ul className="list-disc pl-5 space-y-2">
        <li>пиар-специалисты видят публикации, статусы и доказательства размещения в одном рабочем контуре.</li>
        <li>Финансовый блок показывает заморозку, списания, возвраты и комиссию платформы без ручной сверки.</li>
        <li>Ссылки в тексте проходят отдельный контроль перед отправкой материала площадке.</li>
      </ul>
      <blockquote className="border-l-4 border-[#006bff] pl-4 text-[#476788] italic">
        «Мы хотим убрать хаос из процесса размещения: текст, площадка, деньги и доказательства должны жить в одной системе».
      </blockquote>
      <p className="text-base leading-7">
        Подробности о продукте опубликованы на сайте
        {' '}<a className="text-[#006bff] underline" href="https://axioma.example/product">axioma.example/product</a>, а методология оценки доступна в исследовании
        {' '}<a className="text-[#006bff] underline" href="https://axioma.example/research/2026">axioma.example/research/2026</a>.
      </p>
    </div>
    {showAttachments && <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {['превью интерфейса', 'экран аналитики', 'обложка бренда'].map((image, index) => (
        <div key={image} className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] overflow-hidden">
          <div className="aspect-[4/3] bg-white flex items-center justify-center border-b border-[#d4e0ed]">
            <ImageIcon className="w-8 h-8 text-[#a6bbd1]" />
          </div>
          <div className="px-3 py-2 text-xs text-[#476788]">{image}</div>
        </div>
      ))}
    </div>}
    {showLinks && <div className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-[#0b3558]">Ссылки в тексте для контроля</h4>
        <Badge color={context === 'admin' ? 'amber' : 'blue'}>{materialLinks.length} ссылки</Badge>
      </div>
      <div className="space-y-2">
        {materialLinks.map((link) => (
          <div key={link} className="flex items-center gap-2 text-sm text-[#006bff] break-all">
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <span>{link}</span>
          </div>
        ))}
      </div>
    </div>}
  </div>
);

const MaterialAdvancedSettings = () => (
  <div className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
    <div className="text-sm font-semibold text-[#0b3558] mb-3">Дополнительные настройки материала</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      {[
        ['Тэги', 'финтех, аналитика, PR, запуск продукта'],
        ['Title', 'Финтех Решения запускает платформу аналитики'],
        ['Description', 'Новая платформа помогает PR-командам контролировать публикации, ссылки и отчеты.'],
        ['Желаемый URL', '/news/fintech-analytics-platform'],
      ].map(([label, value]) => (
        <div key={label} className="rounded-lg border border-[#d4e0ed] bg-white p-3">
          <div className="text-xs text-[#476788]">{label}</div>
          <div className="mt-1 font-medium text-[#0b3558]">{value}</div>
        </div>
      ))}
    </div>
  </div>
);

const CopyButton = ({ value, label = 'Скопировать' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#476788] transition-colors hover:border-[#006bff] hover:text-[#006bff]"
      onClick={handleCopy}
      title={copied ? 'Скопировано' : label}
      aria-label={label}
    >
      {copied
        ? <CheckCircle2 className="ui-pop h-4 w-4 text-emerald-600" />
        : <Copy className="h-4 w-4" />}
    </button>
  );
};

const orderMaterialAttachments = [
  ['preview-interface.jpg', 'Изображение · 2,4 МБ', 'image'],
  ['analytics-screen.png', 'Изображение · 1,8 МБ', 'image'],
  ['brand-cover.webp', 'Изображение · 920 КБ', 'image'],
  ['press-release.docx', 'Документ · 146 КБ', 'document'],
];

const orderMaterialSettings = [
  ['Тэги', 'финтех, аналитика, PR, запуск продукта'],
  ['Title', 'Финтех Решения запускает платформу аналитики'],
  ['Description', 'Новая платформа помогает PR-командам контролировать публикации, ссылки и отчеты.'],
  ['Желаемый URL', '/news/fintech-analytics-platform'],
];

const MaterialAttachments = ({ ids, showEmpty = false }) => {
  const [files,setFiles]=useState([]);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    Promise.all(ids.map(id=>api(`/files/${id}/meta`))).then(items=>{if(active)setFiles(items);}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[JSON.stringify(ids)]);
  if(!ids.length&&!showEmpty) return null;
  return <Card className="p-6"><div className="mb-5"><h3 className="font-display text-lg font-bold text-[#0b3558]">Прикрепленные файлы</h3><p className="mt-1 text-sm text-[#476788]">Изображения и документы, переданные вместе с материалом</p></div>{error && <p role="alert" className="text-red-600">{error}</p>}{ids.length?<div className="grid gap-3 md:grid-cols-2">{files.map(file=><a key={file.id} href={`/api/files/${file.id}`} className="flex min-w-0 items-center gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-3" download><FileText className="h-5 w-5 shrink-0 text-[#006bff]" /><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{file.name}</span><span className="text-xs text-[#476788]">{formatFileSize(file.size)}</span></span><Download className="h-4 w-4 shrink-0" /></a>)}</div>:<div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-3 text-sm text-[#476788]">Файлы к материалу не прикреплены</div>}</Card>;
};

const materialBodyLinks = (body) => {
  const document = new DOMParser().parseFromString(String(body || ''), 'text/html');
  const anchors = Array.from(document.querySelectorAll('a[href]')).map(link => link.getAttribute('href'));
  const plain = document.body.textContent?.match(/https?:\/\/[^\s<>"']+/g) || [];
  return Array.from(new Set([...anchors, ...plain].filter(link => link && /^https?:\/\//i.test(link)).map(link => link.replace(/[.,;!?]+$/, ''))));
};

const PlacementParameters = ({ links, settings, copy = false, showEmpty = false }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  if (!showEmpty && !links.length && !settings.length) return null;
  return <Card className="p-6">
    <h2 className="font-display text-lg font-bold text-[#0b3558]">Параметры размещения</h2>
    {(links.length > 0 || showEmpty) && <div className="mt-5 overflow-hidden rounded-lg border border-[#d4e0ed]">
      <div className="border-b border-[#d4e0ed] bg-[#f8f9fb] px-4 py-3 text-sm font-semibold text-[#0b3558]">Ссылки в тексте материала</div>
      {links.length ? links.map(link => <div key={link} className="flex items-center justify-between gap-3 border-b border-[#d4e0ed] px-4 py-3 last:border-b-0"><a href={link} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm text-[#006bff] hover:underline">{link}</a><CopyButton value={link} label="Скопировать ссылку" /></div>) : <div className="px-4 py-3 text-sm text-[#476788]">Ссылки в тексте не указаны</div>}
    </div>}
    {(settings.length > 0 || showEmpty) && <div className="mt-5 overflow-hidden rounded-lg border border-[#d4e0ed]">
      <button type="button" className="flex w-full items-center justify-between gap-3 bg-[#f8f9fb] px-4 py-3 text-left text-sm font-semibold text-[#0b3558]" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}>Дополнительные настройки материала<ChevronRight className={`h-4 w-4 shrink-0 text-[#476788] transition-transform ${settingsOpen ? 'rotate-90' : ''}`} /></button>
      <CollapsiblePanel open={settingsOpen}>{settings.length ? settings.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-t border-[#d4e0ed] px-4 py-3"><div className="min-w-0"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[#0b3558]">{value}</div></div>{copy && <CopyButton value={value} label={`Скопировать ${label}`} />}</div>) : <div className="border-t border-[#d4e0ed] px-4 py-3 text-sm text-[#476788]">Дополнительные настройки не заданы</div>}</CollapsiblePanel>
    </div>}
  </Card>;
};

const LiveMaterialContent = ({ material, copy = false, showAttachments = true, preserveOrderLayout = false }) => {
  const links=materialBodyLinks(material?.body);
  const settings=Object.entries({tags:'Тэги',title:'Title',description:'Description',desiredUrl:'Желаемый URL',notes:'Примечание и ТЗ'}).filter(([key])=>material?.metadata?.[key]).map(([key,label])=>[label,material.metadata[key]]);
  return <div className="space-y-6">
    <Card className="p-6">{material?.body?<div className="material-content" dangerouslySetInnerHTML={{__html:material.body}} />:<div className="text-base leading-7 text-[#476788]">Текст отсутствует</div>}</Card>
    {showAttachments && <MaterialAttachments ids={material?.metadata?.attachments || []} showEmpty={preserveOrderLayout} />}
    <PlacementParameters links={links} settings={settings} copy={copy} showEmpty={preserveOrderLayout} />
  </div>;
};

const OrderMaterialContent = ({ context = 'client', showCopyActions = false, showAttachments = true }) => (
  <div className="space-y-6">
    <Card className="p-6">
      <FullMaterialPreview
        context={context}
        showLinks={false}
        showAttachments={false}
      />
    </Card>

    {showAttachments && <Card className="p-6">
      <div className="mb-5">
        <h3 className="font-display text-lg font-bold text-[#0b3558]">Прикрепленные файлы</h3>
        <p className="mt-1 text-sm text-[#476788]">Изображения и документы, переданные вместе с материалом</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {orderMaterialAttachments.map(([name, meta, type]) => (
          <button
            key={name}
            type="button"
            className="group flex min-w-0 items-center gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-3 text-left transition-colors hover:border-[#a6bbd1] hover:bg-white"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#006bff]">
              {type === 'image' ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#0b3558]">{name}</span>
              <span className="mt-0.5 block text-xs text-[#476788]">{meta}</span>
            </span>
            <Download className="h-4 w-4 flex-shrink-0 text-[#476788] transition-colors group-hover:text-[#006bff]" />
          </button>
        ))}
      </div>
    </Card>}

    <Card className="p-6">
      <div className="mb-5">
        <h3 className="font-display text-lg font-bold text-[#0b3558]">Параметры размещения</h3>
        <p className="mt-1 text-sm text-[#476788]">Ссылки и дополнительные требования к публикации</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-[#d4e0ed] bg-[#f8f9fb]">
        <div className="border-b border-[#d4e0ed] px-4 py-3">
          <div className="text-sm font-semibold text-[#0b3558]">Ссылки в тексте материала</div>
        </div>
        <div className="divide-y divide-[#d4e0ed]">
          {materialLinks.map((link) => (
            <div key={link} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 break-all text-sm text-[#006bff]">
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span>{link}</span>
              </div>
              {showCopyActions && <CopyButton value={link} label="Скопировать ссылку" />}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-[#d4e0ed] bg-[#f8f9fb]">
        <div className="border-b border-[#d4e0ed] px-4 py-3">
          <div className="text-sm font-semibold text-[#0b3558]">Дополнительные настройки материала</div>
        </div>
        <div className="divide-y divide-[#d4e0ed]">
          {orderMaterialSettings.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs text-[#476788]">{label}</div>
                <div className="mt-0.5 break-words text-sm font-medium text-[#0b3558]">{value}</div>
              </div>
              {showCopyActions && <CopyButton value={value} label={`Скопировать ${label}`} />}
            </div>
          ))}
        </div>
      </div>
    </Card>
  </div>
);

const MaterialRightsDisclaimer = () => (
  <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
    Размещая материал, вы подтверждаете, что у вас есть все необходимые авторские права на текст, изображения и другие элементы контента.
  </div>
);

const AiAssistModal = ({ isOpen, onClose, type = 'rewrite', body = '', onApply = (_body: string) => {}, onBusyChange = (_busy: boolean) => {} }) => {
  const backend=useBackend();
  const [prompt,setPrompt]=useState('Переписать материал в деловом стиле, сохранить факты, сделать текст короче и яснее.');
  const [imagePrompt,setImagePrompt]=useState('Сгенерировать деловую иллюстрацию для материала о платформе аналитики.');
  const [busy,setBusy]=useState(false);
  const request=useRef(null);
  const close=()=>{if(!busy)onClose();};
  const rewrite=async()=>{
    if(busy||backend.busy)return;
    const payload={body,prompt},signature=JSON.stringify(payload);
    if(request.current?.signature!==signature)request.current={signature,key:crypto.randomUUID()};
    setBusy(true);onBusyChange(true);
    try {
      const ok=await backend.perform(async()=>{
        let result=await api('/materials/ai-rewrite','POST',payload,request.current.key);
        while(['queued','running'].includes(result.status)) {
          await new Promise(resolve=>setTimeout(resolve,1500));
          result=await api(`/materials/ai-rewrite/${result.id}`);
        }
        request.current=null;
        if(result.status!=='completed')throw new Error(result.error||'Не удалось выполнить рерайт');
        onApply(result.body);
        await backend.refresh().catch(error=>backend.setError(error.message));
      });
      if(ok)onClose();
    } finally {setBusy(false);onBusyChange(false);}
  };
  return <Modal isOpen={isOpen} onClose={close} title={type === 'image' ? 'Генерация изображения с помощью ИИ' : 'Рерайт с помощью ИИ'} className="max-w-2xl">
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
        <div className="text-sm font-semibold text-[#0b3558]">{type === 'image' ? 'Стоимость генерации: 50 ₽' : 'Стоимость рерайта: 30 ₽'}</div>
        <p className="text-sm text-[#476788] mt-1">Сумма будет списана с баланса после запуска операции.</p>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-[#476788]">Промт / ТЗ</span>
        <textarea
          className="mt-2 w-full min-h-[180px] border border-[#476788] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]"
          value={type === 'image' ? imagePrompt : prompt}
          disabled={busy}
          onChange={event=>type==='image'?setImagePrompt(event.target.value):setPrompt(event.target.value)}
        />
      </label>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" disabled={busy} onClick={close}>Отмена</Button>
        <Button variant="primary" disabled={busy||(type==='rewrite'&&(!prompt.trim()||!richTextLength(body)))} onClick={type==='image'?onClose:rewrite}>{busy?<LoaderCircle className="h-4 w-4 animate-spin"/>:null}{type === 'image' ? 'Сгенерировать за 50 ₽' : 'Запустить рерайт за 30 ₽'}</Button>
      </div>
    </div>
  </Modal>
};

const MaterialSelectionModal = ({ isOpen, onClose, platform = null, platforms = [], materials = mockMaterials, projects = [], onCreateOrders, informer = null }) => {
  const backend = useBackend();
  const requestKeys = useRef(new Map());
  const initialPlatforms = platforms.length ? platforms : platform ? [platform] : [];
  const [removedPlatformIds, setRemovedPlatformIds] = useState([]);
  const [autoAccept,setAutoAccept]=useState(false);
  const [limitConfirmationOpen,setLimitConfirmationOpen]=useState(false);
  const availableMaterials = materials.filter((material) => ['Принят в систему', 'Используется в заказах'].includes(material.status));
  const [selectedMaterialName, setSelectedMaterialName] = useState(availableMaterials[0]?.name);
  const selectedPlatforms = initialPlatforms.filter((item) => !removedPlatformIds.includes(item.id));
  const selectedMaterial = availableMaterials.find((material) => material.name === selectedMaterialName);
  const selectedProject = projects.find((project) => project.id === selectedMaterial?.projectId);
  const pricedPlatforms = selectedPlatforms.map((item) => {
    const cheapestFormat = item.formats?.reduce((cheapest,current) => getPlatformPriceForFormat(item,current) < getPlatformPriceForFormat(item,cheapest) ? current : cheapest,item.formats[0]);
    const format = platform && item.format && item.formats?.includes(item.format)
      ? item.format
      : item.formats?.includes(item.format) ? item.format : cheapestFormat;
    return { ...item,format,price:getPlatformPriceForFormat(item,format),basePrice:getPlatformBasePriceForFormat(item,format) };
  });
  const standardTotalPrice = pricedPlatforms.reduce((sum, item) => sum + item.price, 0);
  const packagePrice = Number(informer?.packagePrice || 0);
  const packagePlatformIds = (informer?.selectionIds || []).map(String).sort();
  const selectedPlatformIdSet = pricedPlatforms.map((item) => String(item.id)).sort();
  const packageApplies = packagePrice > 0
    && packagePlatformIds.length === selectedPlatformIdSet.length
    && packagePlatformIds.every((id, index) => id === selectedPlatformIdSet[index]);
  const totalPrice = packageApplies ? packagePrice : standardTotalPrice;
  const limit = backend.data.limits.orderLimit;
  const exceedsLimit = limit !== null && Math.round(totalPrice * 100) > limit;
  const isBulk = pricedPlatforms.length > 1;
  const count = pricedPlatforms.length;
  const platformLabel = count % 10 === 1 && count % 100 !== 11 ? 'площадка' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'площадки' : 'площадок';
  const createOrders = async (limitConfirmed = false) => {
    const fingerprint = JSON.stringify([selectedMaterial.id,pricedPlatforms.map(p=>p.id),packageApplies ? informer.id : null]);
    if(!requestKeys.current.has(fingerprint)) requestKeys.current.set(fingerprint,crypto.randomUUID());
    const ok = await onCreateOrders?.(selectedMaterial, pricedPlatforms,requestKeys.current.get(fingerprint),limitConfirmed,autoAccept,packageApplies ? { informerId: informer.id,expectedAmount:Math.round(totalPrice * 100) } : null);
    if(ok) {setLimitConfirmationOpen(false);onClose();}
  };
  return (
  <>
  <Modal isOpen={isOpen} onClose={onClose} title="Подтверждение заказа" className="max-w-3xl" footer={
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="text-xs text-[#476788]">К резервированию</div><div className="text-lg font-semibold tabular-nums text-[#0b3558]">{formatMoney(totalPrice)}</div></div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button variant="primary" disabled={backend.busy || !selectedMaterial || !count} onClick={() => {
          if(autoAccept && exceedsLimit) setLimitConfirmationOpen(true);
          else createOrders();
        }}>{backend.busy ? 'Создание…' : isBulk ? 'Создать заказы' : 'Создать заказ'}</Button>
      </div>
    </div>
  }>
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#476788] uppercase">{isBulk ? 'Выбрано площадок' : 'Площадка'}</div>
            <div className="mt-1 text-sm font-semibold text-[#0b3558]">{count ? `${count} ${platformLabel}` : 'Нет выбранных площадок'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#476788] uppercase">{packageApplies ? 'Единая цена подборки' : 'Бюджет'}</div>
            <div className="mt-1 text-sm font-semibold text-[#0b3558] tabular-nums">{formatMoney(totalPrice)}</div>
          </div>
        </div>
        <div className="mt-3 divide-y divide-[#d4e0ed] border-y border-[#d4e0ed]">
          {pricedPlatforms.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#0b3558] break-words">{item.name}</div>
                <div className="text-xs text-[#476788]">{item.type} · {item.format}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right whitespace-nowrap">
                  <div className="text-sm font-semibold text-[#0b3558] tabular-nums">{formatMoney(item.price)}</div>
                  {item.basePrice > item.price && <div className="mt-0.5 text-xs tabular-nums text-[#7890aa] line-through">{formatMoney(item.basePrice)}</div>}
                </div>
                <button className="p-2 rounded-lg text-[#476788] hover:text-red-600 hover:bg-red-50" onClick={() => setRemovedPlatformIds((ids) => [...ids, item.id])} title="Удалить площадку из размещения">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Материал</span>
          <CustomSelect className="mt-2" value={selectedMaterialName} onChange={setSelectedMaterialName} options={availableMaterials.map((material) => material.name)} />
        </label>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="text-sm text-[#476788]">Проект</div>
          <ProjectLink project={selectedProject} muted />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 shrink-0" checked={autoAccept} onChange={event=>setAutoAccept(event.target.checked)} />
          <span className="text-sm text-[#476788]"><span className="font-semibold text-[#0b3558]">Автоприёмка</span><br />Автоматически принять размещение, если жалоба не открыта в течение 72 часов после загрузки ссылки.</span>
        </label>
        <p className="text-xs leading-5 text-[#476788]">{isBulk ? 'Для каждой площадки будет создан отдельный заказ. ' : ''}Сумма заказа будет зарезервирована на вашем балансе. Подтверждая заказ, вы подтверждаете наличие прав на текст, изображения и другие материалы.</p>
      </div>
    </div>
  </Modal>
  <Modal isOpen={isOpen && limitConfirmationOpen} onClose={() => setLimitConfirmationOpen(false)} title="Превышен лимит автоприёмки" className="max-w-md" footer={
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={() => setLimitConfirmationOpen(false)}>Отмена</Button>
      <Button variant="primary" disabled={backend.busy} onClick={() => createOrders(true)}>{backend.busy ? 'Создание…' : 'Продолжить'}</Button>
    </div>
  }>
    <p className="text-sm leading-6 text-[#476788]">Сумма заказа превышает лимит автоприёмки {formatMoney(limit/100)}. Продолжить?</p>
  </Modal>
  </>
  );
};

const Modal = ({ isOpen, onClose, title, children, className = 'max-w-md', footer = null }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-[#0b3558]/20 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`bg-white rounded-2xl border border-[#d4e0ed] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.08)_0px_30px_50px_0px] w-full ${className} overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-[#d4e0ed] flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#0b3558]">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть окно" className="shrink-0 text-[#476788] hover:text-[#0b3558] transition-colors p-1.5 rounded-lg hover:bg-[#f0f3f8]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="min-h-0 p-4 sm:p-6 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer && <div className="shrink-0 border-t border-[#d4e0ed] bg-white p-4 sm:px-6">{footer}</div>}
      </div>
    </div>, document.body
  );
};

const ConfirmAction = ({ title, text, action = 'Подтвердить', ...props }) => (
  <Card className="p-4" {...props}>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-[#0b3558]">{title}</h3>
        <p className="text-sm text-[#476788] mt-1">{text}</p>
      </div>
      <Button variant="secondary">{action}</Button>
    </div>
  </Card>
);

const EmptyState = ({ title, text, action = null, onAction = undefined }) => (
  <Card className="p-8 text-center border-dashed bg-white">
    <FileText className="w-10 h-10 mx-auto text-[#476788] mb-4" />
    <h3 className="text-lg font-semibold text-[#0b3558]">{title}</h3>
    <p className="text-sm text-[#476788] mt-2 max-w-lg mx-auto">{text}</p>
    {action && <Button variant="secondary" className="mt-5" onClick={onAction}>{action}</Button>}
  </Card>
);


// --- 1. LANDING PAGE ---

const LandingView = ({ setGlobalMode }) => {
  const backend = useBackend();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authCode,setAuthCode]=useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [loginRole, setLoginRole] = useState('client');
  const [authStep, setAuthStep] = useState('credentials');
  const [recoverySent, setRecoverySent] = useState(false);
  const [publisherApplicationOpen, setPublisherApplicationOpen] = useState(false);
  const [publisherApplicationSubmitted, setPublisherApplicationSubmitted] = useState(false);
  const [applicationPlatformType,setApplicationPlatformType]=useState('Онлайн-СМИ');
  const [applicationRelation,setApplicationRelation]=useState('Владелец');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleLogin = async (role) => {
    const ok = await backend.authenticate(email, password, authMode === 'registration', role==='client'?'customer':role);
    if (ok==='two-factor')setAuthStep('2fa');
    else if (ok) setLoginModalOpen(false);
  };
  const openLoginModal = () => {
    setAuthMode('login');
    setAuthStep('credentials');
    setRecoverySent(false);
    setLoginModalOpen(true);
  };
  const openRegistrationModal = () => {
    setAuthMode('registration');
    setLoginModalOpen(true);
  };
  const openPublisherApplication = () => {
    setPublisherApplicationSubmitted(false);
    setPublisherApplicationOpen(true);
  };
  const openPublisherLogin = () => {
    setPublisherApplicationOpen(false);
    setLoginRole('publisher');
    openLoginModal();
  };
  const submitPublisherApplication = async (event) => {
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget).entries());
    const ok=await backend.perform(()=>api('/publisher-applications','POST',{
      ...values,platformType:applicationPlatformType,relation:applicationRelation,
    }));
    if(ok)setPublisherApplicationSubmitted(true);
  };

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.landing-reveal'));
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const landingPlatforms = [
    ['investor.ru', 'СМИ', '2,5 млн/мес', '150 000 ₽'],
    ['Технологии сегодня', 'ТГ', '125 тыс. подписчиков', '45 000 ₽'],
    ['VC.ru', 'СМИ', '1,2 млн/мес', '80 000 ₽'],
    ['Бизнес Среда', 'ВК', '2,4 млн/мес', '146 000 ₽'],
  ];

  const landingFeatures = [
    [Globe, 'Закрытый каталог', 'Площадки, цены, сроки, форматы и ограничения доступны в одном интерфейсе после регистрации.'],
    [FileText, 'Материал как центр процесса', 'Сначала загружается и модерируется материал, затем из него создаются отдельные заказы на площадки.'],
    [Lock, 'Безопасная оплата', 'Средства замораживаются при создании заказа и списываются только после принятой публикации.'],
    [MessageSquare, 'Коммуникация в заказе', 'Правки, комментарии, ссылка на публикацию и приемка результата остаются внутри карточки заказа.'],
  ];

  const landingSteps = [
    ['01', 'Загрузите материал', 'Добавьте готовый текст, файл или ссылку на документ и укажите рекламодателя для маркировки.'],
    ['02', 'Пройдите модерацию', 'Платформа проверяет материал до отправки паблишерам и фиксирует статус в кабинете.'],
    ['03', 'Выберите площадки', 'Соберите размещение из СМИ, сайтов, Telegram, VK и Дзена для одного материала.'],
    ['04', 'Зарезервируйте средства', 'Деньги замораживаются на балансе до момента выхода публикации.'],
    ['05', 'Получите результат', 'Паблишер размещает материал и отправляет ссылку на приемку.'],
  ];

  const landingFaq = [
    ['Можно ли посмотреть цены без регистрации?', 'Нет. Каталог, цены и условия паблишеров доступны только после регистрации в личном кабинете: это помогает сохранять качество сделок и не раскрывать коммерческие условия публично.'],
    ['Вы пишете тексты?', 'Нет. «Аксиома» помогает организовать размещение готового материала. Текст загружается заказчиком и проходит проверку до отправки паблишерам.'],
    ['Когда списываются деньги?', 'Сумма замораживается при создании заказа и списывается после того, как паблишер отправил ссылку на публикацию, а заказчик принял результат.'],
    ['Как можно пополнить баланс?', 'Доступны банковские карты, СБП и безналичный расчет для юридических лиц с закрывающими документами через ЭДО.'],
  ];

  return (
    <div id="top" className="min-h-screen scroll-smooth bg-[#f4f6f8] font-sans text-[#102f4f] selection:bg-[#b8ffcf] selection:text-[#102f4f] text-[90%]">
      <header className="sticky top-0 z-50 border-b border-[#dce3eb] bg-white shadow-[0_4px_18px_rgba(11,53,88,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            <div className="flex items-center">
              <a href="#top" className="landing-heading text-[24px] font-bold text-[#004cca]">Аксиома</a>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#526d86]">
              <a href="#product" className="px-4 py-2 hover:text-[#004cca] transition-colors">Продукт</a>
              <a href="#catalog" className="px-4 py-2 hover:text-[#004cca] transition-colors">Каталог</a>
              <a href="#publishers" className="px-4 py-2 hover:text-[#004cca] transition-colors">Паблишерам</a>
              <a href="#faq" className="px-4 py-2 hover:text-[#004cca] transition-colors">Вопросы</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button className="px-3 py-2 text-sm font-bold text-[#102f4f] hover:text-[#004cca]" onClick={()=>backend.user?location.assign(`/${backend.user.role}`):openLoginModal()}>{backend.user?'В кабинет':'Вход'}</button>
              <button className="rounded-xl bg-[#004cca] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,76,202,0.18)] transition-colors hover:bg-[#003798]" onClick={openRegistrationModal}>Зарегистрироваться</button>
            </div>

            <button className="md:hidden p-2 text-[#476788]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#d4e0ed] bg-white px-4 py-3 space-y-2">
          {[
            ['Продукт', '#product'],
            ['Каталог', '#catalog'],
            ['Паблишерам', '#publishers'],
            ['Вопросы', '#faq'],
          ].map(([label, href]) => (
            <a key={label} href={href} className="block rounded-lg px-3 py-2 text-sm text-[#476788] hover:bg-[#f8f9fb]" onClick={() => setMobileMenuOpen(false)}>{label}</a>
          ))}
        </div>
      )}

      <section className="overflow-hidden bg-[#f8f9fb] px-4 pb-24 pt-24 sm:px-6 lg:px-8 lg:py-24">
        <div className="landing-reveal mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#004cca]/10 bg-[#004cca]/5 px-4 py-1.5 text-sm font-semibold text-[#004cca]">
              <ShieldCheck className="h-[18px] w-[18px]" /> Закрытый каталог площадок
            </div>
              <h1 className="landing-heading text-[36px] font-bold leading-[1.2] text-[#191c1e] sm:text-[44px]">
              Размещайте пиар-материалы в медиа <span className="text-[#0062ff]">без хаоса</span>
            </h1>
            <p className="max-w-lg text-lg font-normal leading-8 text-[#434654]">
              Закрытый каталог площадок, выбор нескольких медиа для одного текста, безопасная оплата через баланс и контроль публикаций в одном кабинете.
            </p>
            <div className="flex flex-col gap-4 pt-2 sm:flex-row">
              <button className="landing-shimmer inline-flex items-center justify-center gap-3 rounded-2xl bg-[#004cca] px-9 py-4 text-sm font-bold text-white premium-shadow-lg transition-all hover:bg-[#003798] active:scale-95" onClick={openRegistrationModal}>Зарегистрироваться <ArrowRight className="h-4 w-4" /></button>
              <button className="rounded-2xl border border-[#c3c6d6] bg-white px-9 py-4 text-sm font-bold text-[#191c1e] transition-all hover:bg-[#edeef0] active:scale-95" onClick={openLoginModal}>Открыть каталог</button>
            </div>
            <p className="text-sm italic text-[#737686]">Цены и условия доступны после регистрации.</p>
          </div>

          <div className="landing-reveal relative" style={{ transitionDelay: '180ms' }}>
            <div className="absolute -right-20 -top-20 -z-10 h-80 w-80 rounded-full bg-[#0062ff]/10 blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 -z-10 h-80 w-80 rounded-full bg-[#004cca]/10 blur-[100px]" />
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white/70 premium-shadow-lg ring-1 ring-black/5 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-[#c3c6d6]/30 bg-[#f2f4f6]/70 p-6">
                <span className="font-semibold text-[#434654]">Размещение материала</span>
                <span className="rounded-full bg-[#004cca] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">3 площадки выбрано</span>
              </div>
              <div className="space-y-4 p-6 sm:p-8">
                {landingPlatforms.slice(0, 2).map(([name, type, reach, price]) => (
                  <div key={name} className="group flex items-center justify-between rounded-2xl border border-[#c3c6d6]/50 bg-white p-5 transition-all hover:border-[#004cca]/30 hover:shadow-lg">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#e7e8ea] text-lg font-extrabold text-[#737686] transition-colors group-hover:bg-[#004cca]/10 group-hover:text-[#004cca]">{name[0]}</div>
                      <div className="min-w-0"><p className="truncate font-bold text-[#191c1e]">{name}</p><p className="mt-1 text-xs font-medium text-[#434654]">{type === 'ТГ' ? `ТГ: ${reach}` : `Охват: ${reach}`}</p></div>
                    </div>
                    <span className="ml-4 whitespace-nowrap text-lg font-extrabold text-[#004cca]">{price}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-2xl border border-[#004cca]/20 bg-[#004cca]/5 p-5">
                  <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004cca] text-white"><CreditCard className="h-5 w-5" /></div><div><p className="font-bold text-[#004cca]">Итого к оплате</p><p className="text-xs font-medium text-[#004cca]/70">Безопасная сделка</p></div></div>
                  <span className="text-xl font-extrabold text-[#004cca]">275 000 ₽</span>
                </div>
              </div>
              <div className="px-6 pb-6 sm:px-8 sm:pb-8"><button className="landing-shimmer w-full rounded-2xl bg-[#004cca] py-4 font-bold text-white shadow-md transition-all hover:bg-[#003798] active:scale-[0.98]">Создать заказ</button></div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="border-y border-[#c3c6d6]/30 bg-[#f2f4f6] py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="landing-reveal mx-auto mb-16 max-w-3xl text-center lg:mb-20">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#0062ff]">единый рабочий контур</div>
              <h2 className="landing-heading text-2xl font-bold leading-[1.3] text-[#191c1e] lg:text-3xl">Один кабинет для медийных размещений</h2>
              <p className="mt-6 text-lg leading-8 text-[#434654]">
                «Аксиома» объединяет заказчиков, СМИ, сайты, Телеграм-каналы, паблики ВК и Дзен в одном рабочем пространстве. Вы загружаете готовый материал, проходите модерацию, выбираете подходящие площадки, контролируете размещение и получаете отчет после публикации.
              </p>
          </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {landingFeatures.map(([Icon, title, text], index) => (
                <div key={title} className="landing-reveal hover-premium group flex flex-col items-center rounded-3xl border border-white/60 bg-white/70 p-8 text-center premium-shadow" style={{ transitionDelay: `${index * 90}ms` }}>
                  <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#004cca]/5 text-[#004cca] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#004cca] group-hover:text-white">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="landing-heading text-base font-bold leading-[1.35] text-[#191c1e]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#434654]">{text}</p>
                </div>
              ))}
            </div>
        </div>
      </section>

      <section className="bg-[#f8f9fb] py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="landing-reveal mx-auto mb-16 max-w-3xl text-center">
            <h2 className="landing-heading text-2xl font-bold leading-[1.3] text-[#191c1e] lg:text-3xl">Публикуйте материалы там, где их увидит нужная аудитория</h2>
            <p className="mt-6 text-lg leading-8 text-[#434654]">
              Используйте «Аксиому» для пиара, SEO, SERM, продвижения личного бренда, запуска продуктов и формирования экспертности. Выбирайте площадки по тематике, региону, формату, цене и срокам. Один материал можно отправить сразу на несколько площадок без повторной загрузки и разрозненной переписки.
            </p>
          </div>
          <div className="landing-reveal flex flex-wrap justify-center gap-4">
            {['Пресс-релизы', 'Новости компании', 'Экспертные статьи', 'Интервью', 'SERM-материалы', 'Брендированные публикации', 'Посты в Телеграме', 'Публикации в ВК'].map((item) => (
              <div key={item} className="hover-premium rounded-2xl border border-[#c3c6d6]/60 bg-white px-7 py-5 text-sm font-semibold text-[#191c1e] premium-shadow">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden bg-[#004cca] py-24 text-white lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="landing-reveal mb-16 text-center lg:mb-24">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Процесс</div>
            <h2 className="landing-heading text-2xl font-bold leading-[1.3] text-white lg:text-3xl">От материала до публикации — в несколько шагов</h2>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
            {landingSteps.map(([step, title, text], index) => (
              <div key={step} className="landing-reveal group" style={{ transitionDelay: `${index * 90}ms` }}>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/5 text-2xl font-extrabold transition-all group-hover:scale-110 group-hover:bg-[#0062ff]">{Number(step)}</div>
                <h3 className="landing-heading text-base font-bold leading-[1.4] text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-[#f8f9fb] py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="landing-reveal mb-14 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <h2 className="landing-heading text-2xl font-bold leading-[1.3] text-[#191c1e] lg:text-3xl">Площадки, цены и условия — в закрытом каталоге</h2>
            <p className="mt-6 text-lg leading-8 text-[#434654]">
              После регистрации вы получаете доступ к каталогу площадок с понятными параметрами: формат размещения, цена, срок публикации, тематика, регион, требования к материалу и срок хранения.
            </p>
          </div>
            <button className="landing-shimmer rounded-2xl bg-[#004cca] px-9 py-4 text-sm font-bold text-white premium-shadow transition-all hover:bg-[#003798]" onClick={openRegistrationModal}>Зарегистрироваться и посмотреть</button>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              [Globe, 'Онлайн-СМИ'], [MessageSquare, 'Telegram-каналы'], [FileText, 'Дзен'],
              [Briefcase, 'Паблики ВК'], [Store, 'Региональные медиа'], [BarChart3, 'Отраслевые сайты'],
            ].map(([Icon, item], index) => (
              <div key={item} className="landing-reveal hover-premium group rounded-3xl border border-[#c3c6d6]/60 bg-white p-7 text-center" style={{ transitionDelay: `${index * 60}ms` }}>
                <Icon className="mx-auto mb-5 h-9 w-9 text-[#004cca] transition-transform duration-500 group-hover:scale-125" />
                <div className="landing-heading text-xs font-bold leading-[1.4] text-[#191c1e]">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="payments" className="bg-[#f8f9fb] py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="landing-reveal flex flex-col justify-between">
            <div><div className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#004cca]">безопасная оплата</div>
            <h2 className="landing-heading text-3xl font-bold leading-[1.3] text-[#191c1e] lg:text-4xl">Деньги списываются только после принятой публикации</h2>
            <p className="mt-8 text-lg leading-8 text-[#434654]">
              Вы пополняете баланс и создаете заказ. Сумма размещения замораживается, но не списывается сразу. Паблишер получает оплату только после того, как материал опубликован, а вы приняли результат.
            </p></div>
            <div className="mt-12 grid grid-cols-2 gap-5"><div className="rounded-2xl border border-[#c3c6d6]/30 bg-white p-7 premium-shadow"><div className="text-4xl font-extrabold text-[#004cca]">15%</div><div className="mt-3 text-sm font-bold text-[#434654]">Комиссия сервиса</div></div><div className="rounded-2xl border border-[#c3c6d6]/30 bg-white p-7 premium-shadow"><div className="text-4xl font-extrabold text-[#004cca]">0 ₽</div><div className="mt-3 text-sm font-bold text-[#434654]">Абонентская плата</div></div></div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              ['Пополнение', 'Карта, СБП или счет для юридического лица.'],
              ['Холдирование', 'Средства защищены на балансе на все время выполнения заказа.'],
              ['Возврат', 'Если паблишер отказался, деньги возвращаются на баланс.'],
              ['Арбитраж', 'Спорные ситуации решаются через службу поддержки сервиса.'],
            ].map(([title, text], index) => (
              <div
                key={title}
                className="landing-reveal hover-premium rounded-2xl border border-[#c3c6d6]/30 bg-white p-8"
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                <CreditCard className="mb-6 h-7 w-7 text-[#004cca]" />
                <h3 className="landing-heading text-base font-bold leading-[1.4] text-[#191c1e]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#434654]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="publishers" className="border-y border-[#c3c6d6]/30 bg-[#f2f4f6] py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div className="landing-reveal lg:sticky lg:top-28">
              <div className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#004cca]">для паблишеров</div>
              <h2 className="landing-heading text-3xl font-bold leading-[1.3] text-[#191c1e] lg:text-4xl">Получайте заявки на публикации без прямых продаж</h2>
              <p className="mt-6 text-lg leading-8 text-[#434654]">
                Подключите СМИ, сайт, Телеграм-канал, паблик ВК или канал в Дзене к закрытому каталогу «Аксиомы». Заказчики выбирают размещение на вашем ресурсе, а вы работаете с заявкой внутри кабинета: принимаете материал, запрашиваете правки, загружаете ссылку и получаете выплату после приемки.
              </p>
              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <button className="landing-shimmer rounded-2xl bg-[#004cca] px-8 py-4 text-sm font-bold text-white premium-shadow hover:bg-[#003798]" onClick={openPublisherApplication}>Стать паблишером</button>
                <button className="rounded-2xl border border-[#c3c6d6] bg-white px-8 py-4 text-sm font-bold text-[#191c1e] hover:bg-[#e7e8ea]" onClick={openPublisherLogin}>Войти в кабинет</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  [FileText, 'Готовые материалы', 'Материал проходит модерацию до передачи паблишеру.'],
                  [Lock, 'Оплата зарезервирована', 'Сумма заказа уже заморожена на балансе заказчика.'],
                  [Settings, 'Свои условия', 'Вы задаете форматы, цены, сроки и требования к публикации.'],
                  [CreditCard, 'Прозрачные выплаты', 'Начисление доступно после приемки публикации заказчиком.'],
                ].map(([Icon, title, text], index) => (
                  <div key={title} className="landing-reveal hover-premium rounded-3xl border border-white/70 bg-white p-8 premium-shadow" style={{ transitionDelay: `${index * 90}ms` }}>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#004cca]/5 text-[#004cca]"><Icon className="h-6 w-6" /></div>
                    <h3 className="landing-heading text-base font-bold leading-[1.4] text-[#191c1e]">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#434654]">{text}</p>
                  </div>
                ))}
              <div className="sm:col-span-2 grid grid-cols-1 overflow-hidden rounded-3xl border border-[#c3c6d6]/40 bg-white sm:grid-cols-3">
                {[
                  ['15%', 'Комиссия платформы с заказа'],
                  ['2 года', 'Минимальный срок хранения размещенных материалов'],
                  ['1 кабинет', 'Заявки, чат и выплаты'],
                ].map(([value, label]) => (
                  <div key={label} className="border-b border-[#c3c6d6]/40 px-7 py-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                    <div className="font-display text-2xl font-bold text-[#004cca]">{value}</div>
                    <div className="mt-2 text-xs leading-5 text-[#434654]">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#f8f9fb] py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div className="landing-reveal">
            <div className="landing-heading mb-8 text-xs font-bold uppercase tracking-[0.12em] text-[#0055d8]">FAQ</div>
            <h2 className="landing-heading text-3xl font-bold leading-[1.3] text-[#191c1e] lg:text-4xl">Вопросы перед стартом</h2>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#434654]">
              Мы собрали ответы на самые популярные вопросы, чтобы ваш старт в «Аксиоме» был максимально понятным.
            </p>
            <div className="mt-12 rounded-[32px] border border-[#cbdcff] bg-[#eef3ff] p-8 lg:mt-8">
              <h3 className="landing-heading text-base font-bold leading-[1.4] text-[#191c1e]">Остались вопросы?</h3>
              <p className="mt-5 text-sm leading-6 text-[#434654]">Служба поддержки поможет разобраться с регистрацией, материалом и размещением.</p>
              <a href="mailto:support@axioma.ru" className="mt-7 inline-flex items-center gap-3 text-base font-bold text-[#0055d8] transition-colors hover:text-[#003798]">Написать в поддержку <ArrowRight className="h-5 w-5" /></a>
            </div>
          </div>
          <div className="landing-reveal space-y-6" style={{ transitionDelay: '120ms' }}>
            {landingFaq.map(([question, answer], index) => (
              <details
                key={question}
                className="group rounded-[32px] border border-[#e3e8ee] bg-white transition-shadow hover:shadow-md"
                open={openFaqIndex === index}
                onToggle={(event) => {
                  setOpenFaqIndex(event.currentTarget.open ? index : null);
                }}
              >
                <summary className="faq-summary flex cursor-pointer list-none items-center justify-between gap-5 px-7 py-7 focus:outline-none">
                  <span className="landing-heading text-base font-bold leading-[1.4] text-[#191c1e] sm:text-lg">{question}</span>
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#f2f5fb] text-[#191c1e] transition-all group-open:bg-[#0055d8] group-open:text-white"><ChevronRight className="h-5 w-5 transition-transform group-open:-rotate-90" /></span>
                </summary>
                <div className="px-7 pb-8 text-base leading-8 text-[#434654]">
                  {answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f8f9fb] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="landing-reveal cta-card-motion relative overflow-hidden rounded-[40px] bg-[#0642aa] px-8 py-16 text-white shadow-[0_28px_60px_rgba(0,55,152,0.18)] sm:px-14 lg:px-28 lg:py-28">
            <div className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full border-[68px] border-[#2e68bf]/45" />
            <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full border-[68px] border-[#2e68bf]/45" />
            <div className="relative z-10 max-w-4xl">
                <h2 className="landing-heading cta-heading-motion max-w-[920px] text-[32px] font-bold leading-[1.3] text-white sm:text-[40px] lg:text-[52px]">
                  Разместите первый материал через{' '}
                  <span className="cta-highlight-motion inline bg-[#b8ffcf] px-2 py-1 text-[#102f4f] [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">управляемый процесс</span>
                </h2>
                <p className="mt-8 max-w-3xl text-base leading-7 text-[#d5e5ff] lg:text-lg">
                  Загрузите текст, выберите одну или несколько площадок и контролируйте публикации, оплату и отчетность в одном кабинете.
                </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button className="rounded-2xl bg-white px-10 py-5 text-base font-bold text-[#0642aa] shadow-xl transition-colors hover:bg-[#e7efff]" onClick={openRegistrationModal}>Зарегистрироваться</button>
                <button className="rounded-2xl border border-white/35 bg-transparent px-10 py-5 text-base font-bold text-white transition-colors hover:bg-white/10" onClick={openRegistrationModal}>Перейти в каталог</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#24415f] bg-[#102f4f] py-14 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
           <div>
              <a href="#top" className="landing-heading text-lg font-bold text-white">Аксиома</a>
              <p className="mt-4 max-w-[220px] text-sm leading-6 text-[#b8c7d8]">Управляемые медийные размещения для команд, которым важен контроль результата.</p>
              <div className="mt-6 text-xs text-[#8da4ba]">© «Аксиома», 2026</div>
            </div>
            <div>
              <div className="landing-heading mb-4 text-[10px] font-bold uppercase leading-[1.4] tracking-[0.12em] text-[#68a1ff]">Продукт</div>
              <div className="space-y-3 text-sm text-[#c8d5e2]"><div>Как это работает</div><div>Каталог</div><div>Для паблишеров</div></div>
            </div>
            <div>
              <div className="landing-heading mb-4 text-[10px] font-bold uppercase leading-[1.4] tracking-[0.12em] text-[#68a1ff]">Документы</div>
              <div className="space-y-3 text-sm text-[#c8d5e2]"><div>Пользовательское соглашение</div><div>Политика конфиденциальности</div><div>Оферта</div><div>Правила размещения</div></div>
            </div>
            <div>
              <div className="landing-heading mb-4 text-[10px] font-bold uppercase leading-[1.4] tracking-[0.12em] text-[#68a1ff]">Контакты</div>
              <div className="space-y-3 text-sm text-[#c8d5e2]">
                <div>Почта</div>
                <div>Телеграм</div>
                <div>Юридическая информация</div>
              </div>
            </div>
        </div>
      </footer>

      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title={authMode === 'registration' ? 'Регистрация заказчика' : authStep === 'recovery' ? 'Восстановление доступа' : 'Вход на платформу'} className="max-w-3xl">
        {authMode === 'login' ? (
          authStep === 'recovery' ? (
            <div className="space-y-6">
              <p className="text-sm text-[#476788]">
                Укажите рабочую почту. Мы отправим ссылку для сброса пароля и завершения активных сессий после смены доступа.
              </p>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Email</span>
                <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue={loginRole === 'client' ? 'owner@fintech.ru' : 'editor@publisher.ru'} />
              </label>
              {recoverySent && (
                <ActionResult text="Письмо для восстановления отправлено. Ссылка действует 30 минут." />
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button className="text-sm font-semibold text-[#006bff]" onClick={() => { setAuthStep('credentials'); setRecoverySent(false); }}>Вернуться ко входу</button>
                <Button variant="primary" onClick={() => setRecoverySent(true)}>Отправить ссылку</Button>
              </div>
            </div>
          ) : authStep === '2fa' ? (
            <div className="space-y-6">
              <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
                Введите код из приложения-аутентификатора или резервный код.
              </div>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Код 2FA</span>
                <input autoComplete="one-time-code" maxLength={100} className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-lg font-semibold text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={authCode} onChange={event=>setAuthCode(event.target.value)} />
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button className="text-sm font-semibold text-[#006bff]" onClick={() => setAuthStep('credentials')}>Изменить email или пароль</button>
                <Button variant="primary" disabled={backend.busy||!authCode.trim()} onClick={async () => {if(await backend.verifySecondFactor(authCode)){setAuthCode('');setLoginModalOpen(false);}}}>Подтвердить и войти</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-[#476788]">Введите данные аккаунта и выберите кабинет, в который нужно войти.</p>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f8f9fb] border border-[#d4e0ed] p-1">
                {[
                  ['client', 'Заказчик', Briefcase],
                  ['publisher', 'Паблишер', Store],
                ].map(([role, label, Icon]) => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={loginRole === role}
                    onClick={() => setLoginRole(role)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${loginRole === role ? 'bg-white text-[#0b3558] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_4px_10px_0px,rgba(71,103,136,0.05)_0px_10px_20px_0px]' : 'text-[#476788] hover:text-[#0b3558]'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#476788]">Email</span>
                  <input type="email" autoComplete="username" className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={email} onChange={e => setEmail(e.target.value)} />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#476788]">Пароль</span>
                  <input type="password" autoComplete="current-password" className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={password} onChange={e => setPassword(e.target.value)} />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#476788] text-[#006bff]" defaultChecked />
                <span className="text-sm leading-6 text-[#476788]">Запомнить устройство на 30 дней после прохождения 2FA.</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <button className="font-semibold text-[#006bff]" onClick={() => { setAuthStep('recovery'); setRecoverySent(false); }}>Забыли пароль?</button>
                  <button className="font-semibold text-[#006bff]" onClick={openRegistrationModal}>Зарегистрироваться</button>
                </div>
                <Button variant="primary" disabled={backend.busy} onClick={() => handleLogin(loginRole)}>Войти</Button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 flex-none text-[#006bff]" />
                <div>
                  <p className="text-sm font-semibold text-[#0b3558]">Кабинет заказчика</p>
                  <p className="mt-1 text-sm leading-6 text-[#476788]">Регистрация открывает доступ к материалам, каталогу площадок и заказам.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Email</span>
                <input type="email" autoComplete="username" className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Телефон</span>
                <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="+7 999 000-00-00" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Пароль</span>
                <input type="password" autoComplete="new-password" minLength={12} className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" value={password} onChange={e => setPassword(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Статус плательщика</span>
                <CustomSelect className="mt-2" options={['Юридическое лицо', 'ИП', 'Физическое лицо']} />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Компания / ФИО</span>
                <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="ООО Финтех Решения" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Ответственный</span>
                <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Анна Морозова" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">ИНН</span>
                <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="7700000000" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Что планируете размещать</span>
                <CustomSelect className="mt-2" options={['PR-материалы', 'SEO-статьи', 'SERM-материалы', 'Посты в Telegram и ВК']} />
              </label>
            </div>

            <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
              После регистрации вы попадете в кабинет заказчика: сможете создать рекламодателя, загрузить материал и выбрать площадки.
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button className="text-sm font-semibold text-[#006bff]" onClick={openLoginModal}>Уже есть аккаунт</button>
              <Button variant="primary" onClick={() => handleLogin('client')}>Создать кабинет заказчика</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={publisherApplicationOpen}
        onClose={() => setPublisherApplicationOpen(false)}
        title={publisherApplicationSubmitted ? 'Заявка отправлена' : 'Стать паблишером'}
        className="max-w-4xl"
      >
        {publisherApplicationSubmitted ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#b7ebca] bg-[#effcf4] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#1fbf75] text-white">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-[#0b3558]">Анкета принята на ручную проверку</h4>
                  <p className="mt-2 text-sm leading-6 text-[#476788]">
                    Кабинет паблишера пока не создан. Команда проверит площадку, принадлежность ресурса и контактные данные, затем свяжется с заявителем по указанным контактам.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['1', 'Проверим площадку', 'Убедимся, что ресурс существует и соответствует данным анкеты.'],
                ['2', 'Подтвердим представителя', 'Свяжемся с редакцией или владельцем по официальным контактам.'],
                ['3', 'Откроем доступ', 'После одобрения администратор создаст ссылку для входа и передаст ее заявителю.'],
              ].map(([step, title, text]) => (
                <div key={step} className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-5">
                  <div className="text-xs font-bold text-[#006bff]">Шаг {step}</div>
                  <div className="mt-2 text-sm font-semibold text-[#0b3558]">{title}</div>
                  <p className="mt-2 text-xs leading-5 text-[#476788]">{text}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setPublisherApplicationOpen(false)}>Вернуться на главную</Button>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={submitPublisherApplication}>
            <div className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[#006bff]" />
                <div>
                  <p className="text-sm font-semibold text-[#0b3558]">Доступ только после проверки</p>
                  <p className="mt-1 text-sm leading-6 text-[#476788]">
                    Анкета не создает кабинет. Сначала команда «Аксиомы» вручную проверит площадку и подтвердит, что заявку отправил владелец, редакция или официальный представитель.
                  </p>
                </div>
              </div>
            </div>

            <fieldset className="space-y-4">
              <legend className="text-base font-semibold text-[#0b3558]">Контактные данные</legend>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Имя и фамилия</span>
                  <input required name="applicant" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Должность</span>
                  <input required name="position" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Рабочая почта</span>
                  <input required name="email" type="email" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Телефон</span>
                  <input required name="phone" type="tel" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-t border-[#d4e0ed] pt-6">
              <legend className="text-base font-semibold text-[#0b3558]">Площадка и владелец</legend>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Название площадки</span>
                  <input required name="platform" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Тип площадки</span>
                  <CustomSelect className="mt-2" value={applicationPlatformType} onChange={setApplicationPlatformType} options={['Онлайн-СМИ', 'Сайт', 'Telegram-канал', 'Паблик ВК', 'Канал в MAX', 'Канал в Дзене']} />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#476788]">Ссылка на площадку</span>
                  <input required name="platformUrl" type="url" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Юридическое лицо / ИП</span>
                  <input required name="legalName" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">ИНН</span>
                  <input required name="inn" inputMode="numeric" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#476788]">Ваша связь с площадкой</span>
                  <CustomSelect className="mt-2" value={applicationRelation} onChange={setApplicationRelation} options={['Владелец', 'Сотрудник редакции', 'Официальный представитель по договору']} />
                </label>
              </div>
            </fieldset>

            <fieldset className="space-y-4 border-t border-[#d4e0ed] pt-6">
              <legend className="text-base font-semibold text-[#0b3558]">Данные для каталога</legend>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Тематика</span>
                  <input required name="theme" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Посещаемость / охват</span>
                  <input required name="reach" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#476788]">Комментарий</span>
                  <textarea name="comment" className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#476788] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="Укажите дополнительные данные или официальный контакт редакции для проверки." />
                </label>
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <input required type="checkbox" className="mt-1 h-4 w-4 rounded border-[#476788] text-[#006bff]" />
              <span className="text-sm leading-6 text-[#476788]">
                Подтверждаю, что вправе представлять указанную площадку и предоставил достоверные данные. Понимаю, что анкета не создает кабинет до завершения проверки.
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" className="text-sm font-semibold text-[#006bff]" onClick={openPublisherLogin}>Уже есть подтвержденный аккаунт</button>
              <Button type="submit" variant="primary">Отправить анкету</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}


// --- 2. CLIENT PORTAL ---

const ClientDashboardView = ({ navigate, onOpenOrder, informerItems = initialInformerItems }) => {
  const backend = useBackend();
  const activeOrders = backend.data.orders.filter(o => !['completed','refunded','rejected'].includes(o.apiStatus));
  const mockOrdersClient = activeOrders;
  const [selectedPromo, setSelectedPromo] = useState(0);
  const iconMap = informerIconMap;
  const accentMap = informerAccentMap;
  const clientPromos = informerItems
    .filter((item) => item.status === 'Опубликован')
    .map((item) => ({
      ...item,
      format: getInformerFormat(item),
      label: getInformerFormat(item),
      targetView: ['Каталог', 'Карточка площадки'].includes(item.target) ? 'catalog' : null,
      selectedContent: getInformerSelectionOptions(getInformerFormat(item), backend.data.outlets).filter((option) => (item.selectionIds || []).includes(option.value)),
      Icon: iconMap[item.icon] || FileText,
      accentClass: accentMap[item.accent] || accentMap.blue,
    }));

  useEffect(() => {
    if (selectedPromo >= clientPromos.length) setSelectedPromo(0);
  }, [clientPromos.length, selectedPromo]);

  const promo = clientPromos[selectedPromo] || clientPromos[0];
  const PromoIcon = promo?.Icon;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Панель заказчика</h1>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('materials')}>Материалы</Button>
          <Button variant="primary" onClick={() => navigate('create_material')}><Plus className="h-4 w-4" /> Загрузить материал</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className={`flex min-h-[400px] flex-col overflow-hidden xl:h-[400px] ${promo ? '' : 'xl:col-span-2'}`}>
          <div className="flex items-center justify-between border-b border-[#d4e0ed] px-6 py-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0b3558]">Сводка</h2>
              <p className="mt-1 text-xs text-[#476788]">Баланс и результаты размещений</p>
            </div>
            <button className="text-sm font-medium text-[#006bff] hover:text-[#004eba]" onClick={() => navigate('balance')}>Финансы</button>
          </div>
          <div className="grid flex-1 grid-cols-1 sm:grid-cols-2">
            {[
              ['Доступный баланс', formatMoney(backend.data.balance.available / 100), 'Пополнить баланс', 'balance'],
              ['Заморожено в заказах', formatMoney(backend.data.balance.reserved / 100), `${activeOrders.length} активных заказов`, 'orders'],
              ['Активные заказы', String(activeOrders.length), 'Открыть заказы', 'orders'],
              ['Завершено', String(backend.data.orders.filter(o => o.apiStatus === 'completed').length), 'Открыть отчеты', 'reports'],
            ].map(([label, value, note, target], index) => (
              <button
                key={label}
                className={`p-6 text-left transition-colors hover:bg-[#f8f9fb] ${index < 2 ? 'border-b border-[#d4e0ed]' : ''} ${index % 2 === 0 ? 'sm:border-r sm:border-[#d4e0ed]' : ''}`}
                onClick={() => navigate(target)}
              >
                <div className="text-sm font-medium text-[#476788]">{label}</div>
                <div className="mt-2 text-3xl font-semibold tabular-nums text-[#0b3558]">{value}</div>
                <div className="mt-4 inline-flex items-center text-sm font-medium text-[#006bff]">
                  {note}<ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {promo && <Card className="flex min-h-[400px] flex-col overflow-hidden bg-[#f8fbff] xl:h-[400px]">
          <div className="border-b border-[#d4e0ed] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0b3558]">Актуальное</h2>
                <p className="mt-1 h-4 truncate text-xs text-[#476788]">Предложения и новости платформы</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#0b3558] transition-colors hover:border-[#8badcf] disabled:opacity-40"
                  onClick={() => setSelectedPromo((current) => (current - 1 + clientPromos.length) % clientPromos.length)}
                  disabled={clientPromos.length < 2}
                  aria-label="Предыдущая карточка"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <span className="min-w-[54px] text-center text-xs font-semibold tabular-nums text-[#006bff]">{selectedPromo + 1} / {clientPromos.length}</span>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] bg-white text-[#0b3558] transition-colors hover:border-[#8badcf] disabled:opacity-40"
                  onClick={() => setSelectedPromo((current) => (current + 1) % clientPromos.length)}
                  disabled={clientPromos.length < 2}
                  aria-label="Следующая карточка"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-rows-[48px_116px_1fr] gap-y-3 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${promo.accentClass}`}>
                <PromoIcon className="h-6 w-6" />
              </div>
              <div className="truncate text-xs font-bold uppercase leading-4 text-[#006bff]">{promo.eyebrow}</div>
            </div>
            <div className="min-w-0 self-start">
              <h3 className="line-clamp-2 font-display text-xl font-bold leading-7 text-[#0b3558]">{promo.title}</h3>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#476788]">{promo.text}</p>
            </div>
            <div className="flex items-end">
              {promo.action && (promo.targetView || promo.targetUrl) ? (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    if(promo.targetUrl)window.open(promo.targetUrl, '_blank', 'noopener,noreferrer');
                    else location.assign(`/customer/catalog?informer=${encodeURIComponent(promo.id)}`);
                  }}
                >
                  {promo.action}<ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="secondary" className="w-full">
                  {promo.action || 'Подробнее'}<ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>}
      </div>

      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-[#d4e0ed] flex justify-between items-center bg-[#f8f9fb]">
          <h3 className="text-base font-semibold text-[#0b3558]">Активные заказы</h3>
          <button className="text-sm text-[#006bff] font-medium hover:text-[#004eba]" onClick={() => navigate('orders')}>Все заказы</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#d4e0ed]">
            <thead className="bg-[#f8f9fb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Заказ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Площадка</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#476788] uppercase tracking-wider">Действие</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#d4e0ed]">
              {mockOrdersClient.slice(0, 2).map(order => (
                <tr key={order.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => onOpenOrder(order)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0b3558] font-medium">№{orderNumber(order)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#476788]">{order.platform}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0b3558] tabular-nums">{formatMoney(order.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={order.statusColor}>{order.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {order.status === 'Ожидает приемки' ? (
                      <span className="text-[#006bff]">Принять</span>
                    ) : (
                      <MoreHorizontal className="w-5 h-5 text-[#a6bbd1] ml-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const MaterialContentCard = ({ subtitle = 'Полная версия материала', showDownload = false }) => {
  const [linksOpen, setLinksOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0b3558]">Текст и изображения материала</h2>
          <p className="mt-1 text-sm text-[#476788]">{subtitle}</p>
        </div>
        <Badge color="blue"><ImageIcon className="mr-1.5 h-3.5 w-3.5" /> 3 изображения</Badge>
      </div>
      <div className="p-6">
        <FullMaterialPreview showLinks={false} />
        {showDownload && (
          <div className="mt-5">
            <Button variant="secondary"><Paperclip className="h-4 w-4" /> Прикрепленный документ</Button>
          </div>
        )}
        <div className="mt-6 space-y-3">
          <div className="overflow-hidden rounded-lg border border-[#d4e0ed] bg-[#f8f9fb]">
            <button
              type="button"
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${linksOpen ? 'border-b border-[#d4e0ed]' : ''}`}
              onClick={() => setLinksOpen((value) => !value)}
              aria-expanded={linksOpen}
            >
              <span className="text-sm font-semibold text-[#0b3558]">Ссылки в тексте материала</span>
              <ChevronRight className={`h-4 w-4 text-[#476788] transition-transform ${linksOpen ? 'rotate-90' : ''}`} />
            </button>
            <CollapsiblePanel open={linksOpen}>
              <div className="divide-y divide-[#d4e0ed]">
                {materialLinks.map((link) => (
                  <div key={link} className="flex items-center gap-3 bg-white px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2 break-all text-sm text-[#006bff]">
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <span>{link}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsiblePanel>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#d4e0ed] bg-[#f8f9fb]">
            <button
              type="button"
              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${advancedSettingsOpen ? 'border-b border-[#d4e0ed]' : ''}`}
              onClick={() => setAdvancedSettingsOpen((value) => !value)}
              aria-expanded={advancedSettingsOpen}
            >
              <span className="text-sm font-semibold text-[#0b3558]">Дополнительные настройки материала</span>
              <ChevronRight className={`h-4 w-4 text-[#476788] transition-transform ${advancedSettingsOpen ? 'rotate-90' : ''}`} />
            </button>
            <CollapsiblePanel open={advancedSettingsOpen}>
              <div className="divide-y divide-[#d4e0ed]">
                {[
                  ['Тэги', 'финтех, аналитика, PR, запуск продукта'],
                  ['Title', 'Финтех Решения запускает платформу аналитики'],
                  ['Description', 'Новая платформа помогает PR-командам контролировать публикации, ссылки и отчеты.'],
                  ['Желаемый URL', '/news/fintech-analytics-platform'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white px-4 py-3">
                    <div className="text-xs text-[#476788]">{label}</div>
                    <div className="mt-0.5 break-words text-sm font-medium text-[#0b3558]">{value}</div>
                  </div>
                ))}
              </div>
            </CollapsiblePanel>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ProjectChangeModal = ({ isOpen, onClose, currentProject, projects, entityLabel, onConfirm }) => {
  const backend = useBackend();
  const [selectedProject, setSelectedProject] = useState(currentProject);

  useEffect(() => {
    if (isOpen) setSelectedProject(currentProject);
  }, [isOpen, currentProject]);

  const entityGenitive = entityLabel === 'заказа' ? 'заказа' : 'материала';
  const entityName = entityLabel === 'заказа' ? 'заказ' : 'материал';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Изменить проект ${entityGenitive}?`} className="max-w-lg">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-[#476788]">
          Выберите проект, в котором должен отображаться {entityName}. Изменение будет применено только после подтверждения.
        </p>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Новый проект</span>
          <CustomSelect
            className="mt-2"
            value={selectedProject}
            onChange={setSelectedProject}
            options={[...projects.map((project) => project.name), 'Без проекта']}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-xs text-[#7d96af]">Текущий проект</div>
            <div className="mt-1 text-sm font-semibold text-[#0b3558]">{currentProject}</div>
          </div>
          <ChevronRight className="mx-auto h-5 w-5 rotate-90 text-[#8badcf] sm:rotate-0" />
          <div className="rounded-lg border border-[#b8d2ff] bg-[#edf4ff] p-4">
            <div className="text-xs text-[#476788]">Новый проект</div>
            <div className="mt-1 text-sm font-semibold text-[#004eba]">{selectedProject}</div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button
            variant="primary"
            disabled={backend.busy || selectedProject === currentProject}
            onClick={async () => {
              if(await onConfirm(selectedProject)) onClose();
            }}
          >
            Изменить проект
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ClientOrderDetailView = ({ navigate, sourceOrder = null, projects = [], openProject, onChangeProject, onOpenReport }) => {
  const backend = useBackend();
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  if (!sourceOrder) return <Card className="p-6"><p className="mb-4 text-sm text-[#476788]">Заказ не найден или недоступен.</p><Button variant="secondary" onClick={() => navigate('orders')}>К списку заказов</Button></Card>;
  const projectName = projects.find(project => project.id === sourceOrder.projectId)?.name || 'Без проекта';
  const status = sourceOrder.apiStatus;
  const isPendingState = status === 'pending';
  const isAcceptedState = status === 'accepted';
  const isSubmittedState = status === 'submitted';
  const isCompletedState = status === 'completed';
  const isRejectedState = status === 'rejected';
  const isDisputedState = status === 'disputed';
  const isRefundedState = status === 'refunded';
  const updatedDate=new Date(sourceOrder.updated_at).toLocaleDateString('ru-RU');
  const order = {
    id: sourceOrder.id, number: sourceOrder.number, status: sourceOrder.status,
    color: sourceOrder.statusColor, amount: sourceOrder.price,
    platform: sourceOrder.platform, title: sourceOrder.material,
    publicationUrl: sourceOrder.publication_url, publicationDate: sourceOrder.publication_url ? updatedDate : null,
  };
  const statusCopy = isCompletedState ? ['Заказ завершен', 'Публикация принята заказчиком, средства списаны с замороженного баланса, заказ закрыт. Ссылка и итоговый отчет остаются доступны в карточке.']
    : isRejectedState ? ['Площадка отказалась от заказа', 'Площадка рассмотрела заказ и отказалась от размещения. Средства по заказу не будут списаны и останутся доступны на балансе.']
    : isPendingState ? ['Площадка рассматривает заказ', 'Площадка получила заказ и должна принять или отклонить его до указанного срока. До решения площадки редактирование условий заказа недоступно.']
    : isAcceptedState ? ['Заказ принят в работу', 'Площадка приняла заказ. После публикации здесь появится ссылка для проверки.']
    : isSubmittedState ? ['Публикация загружена', 'Площадка загрузила ссылку на опубликованный материал. Проверьте корректность размещения. Нажимая «Принять и оплатить», вы подтверждаете отсутствие претензий.']
    : isDisputedState ? ['По заказу открыт спор', 'До решения модератора средства остаются на холде, а доказательства и переписка доступны в карточке спора.']
    : ['Средства возвращены', 'Спор завершен возвратом. Средства по заказу возвращены на баланс.'];
  const changeProject = async (nextName) => onChangeProject?.(sourceOrder.id, nextName === 'Без проекта' ? null : projects.find(project => project.name === nextName)?.id ?? null);
  return (
  <div className="space-y-6 max-w-6xl mx-auto" data-order-state={status}>
    <div className="flex items-center gap-2 text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
    </div>
    
    <div className="border-b border-[#d4e0ed] pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={order.color}>{order.status}</Badge>
          <span className="text-sm text-[#476788]">Заказ №{orderNumber(order)}</span>
        </div>
        <div className="shrink-0 lg:text-right">
          <div className="text-xs font-medium uppercase text-[#476788]">
            {isCompletedState ? 'Оплачено' : 'Сумма заказа'}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-[#0b3558]">{formatMoney(order.amount)}</div>
        </div>
      </div>
      <h1 className="mt-4 w-full break-words font-display text-2xl font-bold leading-tight text-[#0b3558] sm:text-3xl">
        {order.title}
      </h1>
      <div className="mt-2 flex min-h-9 flex-wrap items-center gap-x-2 gap-y-2 text-sm text-[#476788]">
        <span>
          {order.publicationDate ? `Размещено на ${order.platform} · ${order.publicationDate}` : `Площадка: ${order.platform}`}
        </span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#006bff] hover:text-[#004eba]"
          onClick={() => setProjectModalOpen(true)}
          aria-label={`Изменить проект: ${projectName}`}
        >
          <span className="truncate">{projectName}</span>
          <Pencil className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    </div>

    <div className="rounded-xl border border-[#d4e0ed] bg-white p-5">
      <div className="flex flex-col items-start gap-4 md:flex-row">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[#d4e0ed] bg-[#f8f9fb]">
           {isCompletedState || isRefundedState
             ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
             : isRejectedState || isDisputedState
             ? <AlertCircle className="h-5 w-5 text-red-500" />
             : isPendingState
               ? <Clock className="h-5 w-5 text-[#006bff]" />
               : <CheckCircle2 className="h-5 w-5 text-[#006bff]" />}
          </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[#0b3558]">{statusCopy[0]}</h2>
          <p className="mt-1 text-sm leading-6 text-[#476788]">{statusCopy[1]}</p>
          {order.publicationUrl && (
            <div className="mt-4 flex flex-col justify-between gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 truncate">
                <ExternalLink className="w-4 h-4 text-[#a6bbd1] flex-shrink-0" />
                <a href={order.publicationUrl} target="_blank" rel="noreferrer" className="text-sm text-[#006bff] hover:underline truncate">{order.publicationUrl}</a>
              </div>
              <span className="whitespace-nowrap rounded bg-[#f8f9fb] px-2 py-1 text-xs text-[#476788]">Опубликовано {order.publicationDate}</span>
            </div>
          )}
          {(isRejectedState || isRefundedState) && (
            <div className="mt-4 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <div className="text-xs font-medium text-[#476788]">{isRejectedState ? 'Причина отказа' : 'Основание возврата'}</div>
              <div className="mt-1 text-sm font-semibold text-[#0b3558]">{sourceOrder.reason || 'Комментарий не указан'}</div>
              <div className="mt-3 text-xs text-[#476788]">{order.platform} · редакция · {updatedDate}</div>
            </div>
          )}
          
          <div className="mt-4 flex flex-wrap gap-3">
            {isCompletedState ? (
              <>
                <Button variant="primary" onClick={() => onOpenReport(sourceOrder)}>Открыть отчет</Button>
                <Button variant="secondary" onClick={() => navigate('order_chat')}>Чат заказа</Button>
              </>
            ) : (
              <>
                {isSubmittedState && (
                  <>
                    <Button variant="primary" disabled={backend.busy} onClick={() => backend.perform(async () => { await api(`/orders/${sourceOrder.id}/action`,'POST',{action:'complete'},crypto.randomUUID()); await backend.refresh(); })}>Принять и оплатить</Button>
                    <Button variant="secondary" onClick={() => navigate('complaint')}>Открыть жалобу</Button>
                  </>
                )}
                {isDisputedState && <Button variant="primary" onClick={() => navigate('dispute_detail')}>Открыть спор</Button>}
                {(isRejectedState || isRefundedState) && <Button variant="primary" onClick={() => navigate('catalog')}>Выбрать другую площадку</Button>}
                <Button variant="secondary" onClick={() => navigate('order_chat')}>Чат заказа</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    <LiveMaterialContent material={sourceOrder?.snapshot} preserveOrderLayout />
    <ProjectChangeModal
      isOpen={projectModalOpen}
      onClose={() => setProjectModalOpen(false)}
      currentProject={projectName}
      projects={projects}
      entityLabel="заказа"
      onConfirm={changeProject}
    />
  </div>
  );
};

const ProjectLink = ({ project, onOpen = undefined, muted = false }) => {
  if (!project) {
    return <span className="text-xs text-[#a6bbd1]">Без проекта</span>;
  }
  return (
    <button
      type="button"
      className={`inline-flex max-w-full items-center gap-1.5 text-left text-xs font-medium hover:text-[#004eba] ${muted ? 'text-[#476788]' : 'text-[#006bff]'}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.(project.id);
      }}
    >
      <FolderKanban className="h-3.5 w-3.5 flex-none" />
      <span className="truncate">{project.name}</span>
    </button>
  );
};

const ClientProjectsView = ({ projects, materials, orders, navigate, openProject, onCreateProject }) => {
  const backend = useBackend();
  const mockAdvertisers = backend.data.advertisers;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все статусы');
  const [advertiserFilter, setAdvertiserFilter] = useState('Все рекламодатели');
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAdvertisers, setSelectedAdvertisers] = useState([]);
  const advertiserOptions = ['Все рекламодатели', ...Array.from(new Set(projects.flatMap((project) => project.advertisers)))];
  const visibleProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [project.name, project.code, project.description, ...project.advertisers].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'Все статусы' || project.status === statusFilter;
    const matchesAdvertiser = advertiserFilter === 'Все рекламодатели' || project.advertisers.includes(advertiserFilter);
    return matchesSearch && matchesStatus && matchesAdvertiser;
  });

  const submitProject = async () => {
    if (!name.trim()) return;
    const ok = await onCreateProject({
      name: name.trim(),
      description: description.trim() || 'Описание проекта пока не добавлено.',
      advertisers: selectedAdvertisers,
    });
    if (!ok) return;
    setName('');
    setDescription('');
    setSelectedAdvertisers([]);
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">Проекты</h1>
          <p className="mt-1 text-sm text-[#476788]">Материалы и размещения, объединенные общей задачей</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Создать проект</Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_260px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a6bbd1]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по проекту или рекламодателю"
              className="min-h-[42px] w-full rounded-lg border border-[#476788] bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]"
            />
          </div>
          <CustomSelect value={statusFilter} onChange={setStatusFilter} placeholder="Статус проекта" options={['Все статусы', 'Активный', 'Завершен']} />
          <CustomSelect value={advertiserFilter} onChange={setAdvertiserFilter} placeholder="Рекламодатель" options={advertiserOptions} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed divide-y divide-[#d4e0ed]">
            <thead className="bg-[#f8f9fb]">
              <tr>
                {[
                  ['Проект', 'w-[31%]'],
                  ['Рекламодатели', 'w-[20%]'],
                  ['Материалы', 'w-[11%]'],
                  ['Заказы', 'w-[11%]'],
                  ['Фактически', 'w-[15%]'],
                  ['Статус', 'w-[12%]'],
                ].map(([label, width]) => (
                  <th key={label} className={`${width} px-6 py-4 text-left text-xs font-medium uppercase text-[#476788]`}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4e0ed] bg-white">
              {visibleProjects.map((project) => {
                const projectMaterials = materials.filter((material) => material.projectId === project.id);
                const projectOrders = orders.filter((order) => order.projectId === project.id);
                const spent = projectOrders.reduce((sum, order) => sum + order.price, 0);
                return (
                  <tr key={project.id} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => openProject(project.id)}>
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#e6f0ff] text-[#006bff]">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[#0b3558]">{project.name}</div>
                          <div className="mt-1 text-xs text-[#476788]">{project.code} · обновлен {project.updatedAt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#476788]"><div className="line-clamp-2">{project.advertisers.join(', ')}</div></td>
                    <td className="px-6 py-4 text-sm font-medium tabular-nums text-[#0b3558]">{projectMaterials.length}</td>
                    <td className="px-6 py-4 text-sm font-medium tabular-nums text-[#0b3558]">{projectOrders.length}</td>
                    <td className="px-6 py-4 text-sm font-semibold tabular-nums text-[#0b3558]">{formatMoney(spent)}</td>
                    <td className="px-6 py-4"><Badge color={project.status === 'Активный' ? 'green' : 'gray'}>{project.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!visibleProjects.length && (
          <div className="p-8 text-center text-sm text-[#476788]">Проекты по выбранным условиям не найдены.</div>
        )}
      </Card>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Новый проект" className="max-w-2xl">
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Название проекта</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, запуск нового продукта" className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-[#476788]">Рекламодатели <span className="font-normal text-[#7d96af]">· необязательно</span></legend>
            <CheckboxMultiSelect
              className="mt-3"
              value={selectedAdvertisers}
              onChange={setSelectedAdvertisers}
              placeholder="Выберите рекламодателей"
              emptyPlaceholder="Рекламодателей пока нет"
              options={mockAdvertisers.map((item) => ({
                value: item.name,
                label: item.name,
                description: `${item.code} · ${item.type}`,
              }))}
            />
          </fieldset>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Описание</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Тема и назначение серии публикаций" className="mt-2 min-h-[120px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
          </label>
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
            Проект сразу станет активным. Материалы и заказы можно добавить после создания.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button variant="primary" disabled={!name.trim() || backend.busy} onClick={submitProject}>Создать проект</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ClientProjectDetailView = ({ project, materials, orders, navigate, openMaterial, openOrder, onAddMaterial, onToggleStatus, onDelete, onCreateProjectReport }) => {
  const [tab, setTab] = useState('Обзор');
  if (!project) return <EmptyState title="Проект не найден" text="Вернитесь к списку проектов и выберите другой проект." action="К проектам" onAction={() => navigate('projects')} />;
  const projectMaterials = materials.filter((material) => material.projectId === project.id);
  const projectOrders = orders.filter((order) => order.projectId === project.id);
  const frozen = projectOrders.reduce((sum, order) => sum + order.frozen, 0);
  const charged = projectOrders.filter((order) => order.status === 'Завершено').reduce((sum, order) => sum + order.price, 0);
  const returned = projectOrders.filter((order) => order.status === 'Площадка отказала').reduce((sum, order) => sum + order.price, 0);
  const reportOrders = projectOrders.filter((order) => order.publication_url);
  const reportDates = reportOrders.map((order) => new Date(order.updated_at).toISOString().slice(0,10)).sort();
  const isEmpty = !projectMaterials.length && !projectOrders.length;

  return (
    <div className="space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('projects')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К проектам
      </button>
      <div className="flex flex-col gap-4 border-b border-[#d4e0ed] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">{project.name}</h1>
            <Badge color={project.status === 'Активный' ? 'green' : 'gray'}>{project.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-[#476788]">{project.code} · обновлен {project.updatedAt}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isEmpty && <Button variant="danger" onClick={() => { onDelete(project.id); navigate('projects'); }}>Удалить проект</Button>}
          <Button
            variant="secondary"
            disabled={!reportOrders.length}
            title={reportOrders.length ? 'Сформировать полный отчет по проекту' : 'Отчет станет доступен после первой публикации'}
            onClick={() => onCreateProjectReport({projectId:project.id,from:reportDates[0],to:new Date().toISOString().slice(0,10),label:'За все время'})}
          >
            <Download className="h-4 w-4" /> Отчет
          </Button>
          <Button variant="secondary" onClick={() => onToggleStatus(project.id)}>
            {project.status === 'Активный' ? 'Завершить проект' : 'Вернуть в активные'}
          </Button>
          <Button variant="primary" onClick={() => onAddMaterial(project.id)}><Plus className="h-4 w-4" /> Добавить материал</Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#d4e0ed]">
        {['Обзор', 'Материалы', 'Заказы'].map((item) => (
          <button key={item} className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === item ? 'border-[#006bff] text-[#006bff]' : 'border-transparent text-[#476788] hover:text-[#0b3558]'}`} onClick={() => setTab(item)}>
            {item}{item === 'Материалы' ? ` · ${projectMaterials.length}` : item === 'Заказы' ? ` · ${projectOrders.length}` : ''}
          </button>
        ))}
      </div>

      {tab === 'Обзор' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Материалы', projectMaterials.length],
              ['Заказы', projectOrders.length],
              ['Заморожено', formatMoney(frozen)],
              ['Списано', formatMoney(charged)],
            ].map(([label, value]) => (
              <Card key={label} className="p-5">
                <div className="text-xs uppercase text-[#476788]">{label}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-[#0b3558]">{value}</div>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.5fr)]">
            <Card className="p-6">
              <h2 className="font-display text-base font-bold text-[#0b3558]">О проекте</h2>
              <p className="mt-4 text-sm leading-6 text-[#476788]">{project.description}</p>
            </Card>
            <Card className="p-6">
              <h2 className="font-display text-base font-bold text-[#0b3558]">Рекламодатели</h2>
              <div className="mt-4 space-y-3">
                {project.advertisers.map((item) => <div key={item} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-3 text-sm font-medium text-[#0b3558]">{item}</div>)}
              </div>
              {returned > 0 && <div className="mt-4 text-xs text-[#476788]">Возвращено по отклоненным заказам: {formatMoney(returned)}</div>}
            </Card>
          </div>
        </div>
      )}

      {tab === 'Материалы' && (
        <Card className="overflow-hidden">
          {projectMaterials.length ? (
            <div className="divide-y divide-[#d4e0ed]">
              {projectMaterials.map((material) => (
                <button key={material.id} className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-[#f8f9fb]" onClick={() => openMaterial(material.id)}>
                  <div className="min-w-0"><div className="truncate text-sm font-semibold text-[#0b3558]">{material.name}</div><div className="mt-1 text-xs text-[#476788]">{material.advertiser} · {material.type}</div></div>
                  <Badge color={material.statusColor}>{material.status}</Badge>
                </button>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-[#476788]">В проекте пока нет материалов.</div>}
        </Card>
      )}

      {tab === 'Заказы' && (
        <Card className="overflow-hidden">
          {projectOrders.length ? (
            <div className="divide-y divide-[#d4e0ed]">
              {projectOrders.map((order) => (
                <button key={order.id} className="grid w-full gap-3 px-6 py-4 text-left hover:bg-[#f8f9fb] sm:grid-cols-[90px_minmax(0,1fr)_150px_minmax(220px,auto)] sm:items-center" onClick={() => openOrder(order)}>
                  <div className="text-sm font-semibold text-[#006bff]">№{orderNumber(order)}</div>
                  <div className="min-w-0"><div className="truncate text-sm font-medium text-[#0b3558]">{order.material}</div><div className="mt-1 text-xs text-[#476788]">{order.platform}</div></div>
                  <div className="text-sm font-semibold tabular-nums text-[#0b3558]">{formatMoney(order.price)}</div>
                  <Badge color={order.statusColor} className="w-full max-w-[220px] justify-center justify-self-start">{order.status}</Badge>
                </button>
              ))}
            </div>
          ) : <div className="p-8 text-center text-sm text-[#476788]">В проекте пока нет заказов.</div>}
        </Card>
      )}
    </div>
  );
};

const ClientOrdersView = ({ navigate, projects, orders, openProject, openOrder, onMoveOrders }) => {
  const [query,setQuery]=useState('');
  const [projectFilter, setProjectFilter] = useState('Все проекты');
  const [statusFilter, setStatusFilter] = useState('Все статусы');
  const [selectedIds, setSelectedIds] = useState([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [targetProject, setTargetProject] = useState('Без проекта');
  const projectNameById = (id) => projects.find((project) => project.id === id)?.name;
  const visibleOrders = orders.filter((order) => {
    const matchesProject = projectFilter === 'Все проекты'
      || (projectFilter === 'Без проекта' ? !order.projectId : projectNameById(order.projectId) === projectFilter);
    const matchesStatus = statusFilter === 'Все статусы' || order.status === statusFilter;
    return matchesProject && matchesStatus && `${order.number} ${order.material} ${order.platform}`.toLowerCase().includes(query.trim().replace(/^[№#]\s*/,'').toLowerCase());
  });
  const allVisibleSelected = visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id));
  const moveSelected = () => {
    const projectId = targetProject === 'Без проекта' ? null : projects.find((project) => project.name === targetProject)?.id ?? null;
    onMoveOrders(selectedIds, projectId);
    setSelectedIds([]);
    setMoveOpen(false);
  };

  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Заказы</h1>
        <p className="text-sm text-[#476788] mt-1">Каждая площадка в размещении создает отдельный заказ</p>
      </div>
      <Button variant="secondary" onClick={() => navigate('catalog')}>Открыть каталог</Button>
    </div>
    <Card className="p-4">
      <input aria-label="Поиск заказа" placeholder="Номер заказа, материал или площадка" className="mb-3 w-full rounded-lg border border-[#476788] p-3 text-sm" value={query} onChange={e=>setQuery(e.target.value)} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[260px_260px_minmax(0,1fr)]">
        <CustomSelect value={projectFilter} onChange={setProjectFilter} placeholder="Проект" options={['Все проекты', ...projects.map((project) => project.name), 'Без проекта']} />
        <CustomSelect value={statusFilter} onChange={setStatusFilter} placeholder="Статус заказа" options={['Все статусы', ...Array.from(new Set(orders.map((order) => order.status)))]} />
        <div className="flex items-center justify-end">
          <Button variant="secondary" disabled={!selectedIds.length} onClick={() => setMoveOpen(true)}>
            Переместить в проект{selectedIds.length ? ` · ${selectedIds.length}` : ''}
          </Button>
        </div>
      </div>
    </Card>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1040px] w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]">
            <tr>
              <th className="w-14 px-5 py-4 text-left">
                <input type="checkbox" checked={allVisibleSelected} onChange={() => setSelectedIds(allVisibleSelected ? selectedIds.filter((id) => !visibleOrders.some((order) => order.id === id)) : Array.from(new Set([...selectedIds, ...visibleOrders.map((order) => order.id)])))} aria-label="Выбрать все заказы" />
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Номер</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Материал</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Площадка</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Сумма</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Статус</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase tracking-wider">Действие</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#d4e0ed]">
            {visibleOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-[#f8f9fb] cursor-pointer"
                onClick={() => openOrder(order)}
              >
                <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => setSelectedIds((ids) => ids.includes(order.id) ? ids.filter((id) => id !== order.id) : [...ids, order.id])} aria-label={`Выбрать заказ ${orderNumber(order)}`} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0b3558]">№{orderNumber(order)}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-[#476788]">{order.material}</div>
                  <div className="mt-1"><ProjectLink project={projects.find((project) => project.id === order.projectId)} onOpen={openProject} /></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#476788]">{order.platform}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#0b3558] tabular-nums">{formatMoney(order.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap"><Badge color={order.statusColor}>{order.status}</Badge></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-[#006bff]">
                  {order.status === 'Ожидает приемки' ? 'Проверить' : 'Открыть'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    <Modal isOpen={moveOpen} onClose={() => setMoveOpen(false)} title="Переместить заказы" className="max-w-xl">
      <div className="space-y-5">
        <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-3">
          <div className="text-sm font-semibold text-[#0b3558]">Выбрано заказов: {selectedIds.length}</div>
          <p className="mt-1 text-xs leading-5 text-[#476788]">
            Изменится только проект. Статусы заказов и финансовые операции останутся без изменений.
          </p>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-[#476788]">Новый проект</legend>
          <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto pr-1">
            {[...projects.map((project) => project.name), 'Без проекта'].map((projectName) => {
              const selected = targetProject === projectName;
              return (
                <button
                  key={projectName}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    selected
                      ? 'border-[#006bff] bg-[#e6f0ff]'
                      : 'border-[#d4e0ed] bg-white hover:bg-[#f8f9fb]'
                  }`}
                  onClick={() => setTargetProject(projectName)}
                >
                  <span className={`text-sm font-medium ${selected ? 'text-[#004eba]' : 'text-[#0b3558]'}`}>{projectName}</span>
                  <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                    selected ? 'border-[#006bff] bg-[#006bff] text-white' : 'border-[#8badcf] bg-white'
                  }`}>
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="flex flex-col-reverse gap-3 border-t border-[#d4e0ed] pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setMoveOpen(false)}>Отмена</Button>
          <Button variant="primary" onClick={moveSelected}>Переместить</Button>
        </div>
      </div>
    </Modal>
  </div>
  );
};

const ClientComplaintView = ({ navigate }) => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('order_detail')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К заказу #1045
      </button>

      {!submitted ? (
        <>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">Открытие жалобы</h1>
            <p className="text-sm text-[#476788] mt-1">На время рассмотрения средства по заказу останутся заморожены.</p>
          </div>
          <Card className="p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <label className="block"><span className="text-sm font-medium text-[#476788]">Заказ</span><input readOnly className="mt-2 w-full rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-2.5 text-sm font-medium text-[#0b3558]" defaultValue="№1045 · РБК Инвестиции" /></label>
              <label className="block"><span className="text-sm font-medium text-[#476788]">Причина</span><CustomSelect className="mt-2" options={['Некорректная маркировка', 'Материал изменен', 'Ссылка недоступна', 'Нарушен формат']} /></label>
              <label className="block"><span className="text-sm font-medium text-[#476788]">Ссылка</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="https://invest.rbc.ru/news/652a9f" /></label>
              <label className="block"><span className="text-sm font-medium text-[#476788]">Дата обнаружения</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="19.10.2023" /></label>
              <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Описание</span><textarea className="mt-2 min-h-[132px] w-full resize-y rounded-lg border border-[#476788] px-4 py-3 text-sm leading-6" placeholder="Опишите, что именно нарушено: ссылка, фрагмент публикации, отличие от согласованного материала." /></label>
              <div className="block md:col-span-2">
                <span className="text-sm font-medium text-[#476788]">Доказательства</span>
                <FileUploadField
                  compact
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                  prompt="Выберите файлы с доказательствами или перетащите их сюда"
                  hint="PDF, DOCX, TXT, PNG, JPG или WEBP · до 20 МБ"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-[#d4e0ed] pt-5 sm:flex-row sm:items-center">
              <p className="max-w-xl text-sm leading-6 text-[#476788]">После отправки будет создан спор. Паблишер получит запрос на доказательства, а оплата заказа будет приостановлена.</p>
              <Button variant="primary" className="whitespace-nowrap" onClick={() => setSubmitted(true)}>Открыть жалобу</Button>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">Жалоба открыта</h1>
            <Badge color="amber">Спор #C-020</Badge>
          </div>
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold text-[#0b3558]">Жалоба принята и передана на рассмотрение</h2>
                <p className="mt-2 text-sm leading-6 text-[#476788]">Спор #C-020 создан 20.10.2023 в 12:03. Мы уведомили паблишера и запросили его позицию и доказательства.</p>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    ['Статус', 'Ожидается ответ паблишера'],
                    ['Ответ паблишера', 'до 21.10, 18:00'],
                    ['Решение модератора', 'до 3 рабочих дней'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                      <div className="text-xs text-[#476788]">{label}</div>
                      <div className="mt-1 text-sm font-semibold leading-5 text-[#0b3558]">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-lg border border-[#d4e0ed] bg-white p-4 text-sm leading-6 text-[#476788]">
                  Оплата заказа приостановлена. {formatMoney(150000)} останутся на холде до решения модератора. Все обновления появятся на странице спора и в уведомлениях.
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="primary" onClick={() => navigate('dispute_detail')}>Открыть спор</Button>
                  <Button variant="secondary" onClick={() => navigate('order_detail')}>Вернуться к заказу</Button>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

const DisputeDetailView = ({ navigate, role = 'client' }) => (
  <div className="space-y-6 max-w-6xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate(role === 'publisher' ? 'pub_order_detail' : 'order_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К карточке заказа
    </button>
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          Спор #C-020
          <Badge color="amber">на рассмотрении</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Заказ #1045 · РБК Инвестиции · открыт 19.10.2023</p>
      </div>
      <div className="text-left lg:text-right">
        <div className="text-sm text-[#476788]">Средства на холде</div>
        <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(150000)}</div>
      </div>
    </div>

	    <Card className="p-6">
	      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
	        <div>
	          <h2 className="font-display text-lg font-bold text-[#0b3558]">Что происходит сейчас</h2>
	          <p className="text-sm text-[#476788] mt-1">Админ запросил доказательства у паблишера. До решения спора оплата и выплата по заказу заблокированы.</p>
	        </div>
	        <div className="flex flex-wrap gap-3">
	          {role === 'publisher' ? (
	            <Button variant="secondary" onClick={() => navigate('pub_complaint')}>Предоставить доказательства</Button>
	          ) : (
	            <>
	              <Button variant="secondary" onClick={() => navigate('complaint')}>Дополнить жалобу</Button>
	              <Button variant="ghost">Отозвать жалобу</Button>
	            </>
	          )}
	        </div>
	      </div>
	    </Card>

    <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Предмет спора</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ['Причина', 'Нарушен формат публикации', false],
            ['Ссылка на публикацию', 'https://invest.rbc.ru/news/652a9f', false],
            ['Дата обнаружения', '19.10.2023', false],
            ['Сумма размещения', formatMoney(150000), false],
            ['Позиция заказчика', 'Заказчик считает, что опубликованный материал существенно отличается от согласованной версии и не соответствует условиям заказа. В исходном материале был утвержден заголовок про запуск новой платформы аналитики для PR-команд, а в публикации редакция заменила его на более общий заголовок, из-за чего потерялся продуктовый акцент и связь с рекламируемым объектом. Также из публикации убрано согласованное изображение интерфейса, которое должно было визуально показать функциональность сервиса и поддержать основной тезис материала. По мнению заказчика, эти изменения влияют на восприятие публикации, снижают коммерческую ценность размещения и нарушают договоренность о формате. Заказчик просит проверить соответствие опубликованной версии утвержденному материалу, условиям карточки заказа и требованиям к сохранению ключевых смыслов. До решения спора заказчик не готов принимать публикацию и подтверждать оплату.', true],
            ['Позиция паблишера', 'Паблишер считает, что публикация выполнена в рамках согласованного формата и редакционных правил. Заголовок был адаптирован редакцией для соответствия стилю издания и повышения читаемости материала, при этом основной предмет размещения, название продукта и ключевые сообщения сохранились в тексте. Изображение интерфейса не было использовано, потому что редакция сочла его недостаточно нейтральным для публикации в выбранной рубрике, но материал был дополнен редакционной подачей без изменения фактической информации. Паблишер указывает, что в условиях заказа был выбран формат публикации от редакции, поэтому допускается редакционная адаптация заголовка, иллюстраций и структуры, если не искажается смысл. По мнению паблишера, материал опубликован корректно, ссылка доступна, требования по срокам соблюдены, а спор касается не нарушения обязательств, а различия в ожиданиях по редакционной обработке. Паблишер просит принять размещение без удержаний.', true],
          ].map(([label, value, wide]) => (
            <div key={label} className={`rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 ${wide ? 'md:col-span-2' : ''}`}>
              <div className="text-xs text-[#476788]">{label}</div>
              <div className={`mt-1 font-medium text-[#0b3558] ${wide ? 'leading-6 whitespace-pre-line' : ''}`}>{value}</div>
            </div>
          ))}
        </div>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Доказательства заказчика</h2>
        {['исходный материал', 'условия заказа', 'комментарий от 19.10'].map(file => (
          <div key={file} className="flex items-center justify-between py-3 border-b border-[#d4e0ed]">
            <span className="text-sm text-[#006bff]">{file}</span>
            <Download className="w-4 h-4 text-[#a6bbd1]" />
          </div>
        ))}
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Доказательства паблишера</h2>
        {['ссылка на публикацию', 'редакционный комментарий', 'архив страницы'].map(file => (
          <div key={file} className="flex items-center justify-between py-3 border-b border-[#d4e0ed]">
            <span className="text-sm text-[#006bff]">{file}</span>
            <Download className="w-4 h-4 text-[#a6bbd1]" />
          </div>
        ))}
      </Card>
    </div>

	  </div>
);

const OrderChatView = ({ navigate, role = 'client' }) => (
  <div className="space-y-6 max-w-6xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate(role === 'publisher' ? 'pub_order_detail' : role === 'admin' ? 'admin_order_detail' : 'order_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К карточке заказа
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Чат заказа #1045</h1>
        <p className="text-sm text-[#476788] mt-1">Сообщения, файлы и системные события по заказу.</p>
      </div>
    </div>
    <Card className="grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
      <div className="lg:col-span-2 flex flex-col h-[620px]">
        <div className="px-6 py-4 border-b border-[#d4e0ed] bg-[#f8f9fb]">
          <h2 className="font-display text-sm font-bold text-[#0b3558]">Сообщения и системные события</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8f9fb]">
          {(role === 'publisher' ? ['Заказ поступил', 'Площадка приняла заказ', 'Площадка загрузила ссылку', 'Заказчик принял публикацию', 'Заказчик открыл жалобу', 'Админ запросил доказательства', 'Удержание применено', 'Заказ завершен'] : mockSystemEvents).map((event) => (
            <div key={event} className="flex justify-center">
              <div className="bg-white border border-[#d4e0ed] rounded-lg px-3 py-2 text-xs text-[#476788]">{event}</div>
            </div>
          ))}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0b3558] text-white flex items-center justify-center text-xs">П</div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-[#d4e0ed] p-3 text-sm text-[#0b3558] max-w-[80%]">Публикация запланирована на 18 октября, 12:00.</div>
          </div>
          <div className="flex items-start justify-end gap-3">
            <div className="rounded-2xl rounded-tr-sm bg-[#0b3558] text-white p-3 text-sm max-w-[80%]">Спасибо, ждем ссылку после выхода.</div>
          </div>
        </div>
        <div className="p-4 border-t border-[#d4e0ed] bg-white">
          <div className="flex gap-2"><input className="flex-1 border border-[#476788] rounded-lg px-4 py-2 text-sm" placeholder="Написать сообщение..." /><Button variant="primary">Отправить</Button></div>
        </div>
      </div>
      <div className="border-l border-[#d4e0ed] p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#0b3558] mb-3">Файлы и версии</h3>
        {['материал версия 3', 'архив изображений'].map(file => <div key={file} className="py-2 text-sm text-[#006bff] border-b border-[#d4e0ed]">{file}</div>)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#0b3558] mb-3">События</h3>
          <div className="space-y-2">{(role === 'publisher' ? ['заказ поступил', 'площадка приняла заказ', 'площадка загрузила ссылку', 'заказчик открыл жалобу', 'админ запросил доказательства', 'удержание применено', 'заказ завершен'] : mockSystemEvents).map(event => <div key={event} className="text-xs text-[#476788]">{event}</div>)}</div>
        </div>
      </div>
    </Card>
  </div>
);

const ClientReportDetailView = ({ navigate, report, projects, openProject }) => {
  if (!report) return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('reports')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К отчетам
      </button>
      <Card className="p-8 text-center text-sm text-[#476788]">Отчет не выбран или больше недоступен.</Card>
    </div>
  );
  const currentReport = report;
  const project = projects.find((item) => item.id === currentReport.projectId);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('reports')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К отчетам
      </button>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">Отчет по размещению</h1>
          <p className="mt-1 text-sm text-[#476788]">{currentReport.order} · публикация {currentReport.date}</p>
        </div>
        <Button variant="primary" onClick={() => downloadFromApi(`/orders/${currentReport.id}/report.pdf`)}><Download className="h-4 w-4" /> Скачать отчет</Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={currentReport.color}>{currentReport.status}</Badge>
          {project && <ProjectLink project={project} onOpen={openProject} />}
        </div>
        <h2 className="mt-4 max-w-5xl break-words font-display text-2xl font-bold leading-tight text-[#0b3558] sm:text-3xl">
          {currentReport.material}
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.32fr)]">
          <div className="min-w-0 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-xs text-[#476788]">Площадка размещения</div>
            <div className="mt-1 break-words text-sm font-semibold leading-5 text-[#0b3558]">{currentReport.platform}</div>
          </div>
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-xs text-[#476788]">Дата размещения</div>
            <div className="mt-1 whitespace-nowrap text-sm font-semibold tabular-nums text-[#0b3558]">{currentReport.date || 'Ожидается'}</div>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-[#b8d2ff] bg-[#edf4ff] p-4">
          <div className="text-xs text-[#476788]">Ссылка на размещение</div>
          {currentReport.link ? (
            <a className="mt-2 flex items-center gap-2 break-all text-sm font-medium text-[#006bff] hover:text-[#004eba]" href={currentReport.link} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 flex-none" />
              {currentReport.link}
            </a>
          ) : (
            <div className="mt-2 text-sm text-[#476788]">Ссылка появится после публикации.</div>
          )}
        </div>
      </Card>

      <LiveMaterialContent material={currentReport.snapshot} showAttachments={false} preserveOrderLayout />
    </div>
  );
};

const ClientProjectReportView = ({ navigate, config, projects, reports, onOpenPlacementReport, onChangePeriod }) => {
  const [periodOpen, setPeriodOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(config.from || '');
  const [dateTo, setDateTo] = useState(config.to || '');
  useEffect(() => {
    setDateFrom(config.from || '');
    setDateTo(config.to || '');
  }, [config.from, config.to]);
  const project = projects.find((item) => item.id === config.projectId);
  if (!project) return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('reports')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К отчетам
      </button>
      <Card className="p-8 text-center text-sm text-[#476788]">Проект для отчета не выбран или больше недоступен.</Card>
    </div>
  );
  const fromDate = config.from ? new Date(`${config.from}T00:00:00`) : null;
  const toDate = config.to ? new Date(`${config.to}T23:59:59`) : null;
  const publications = reports.filter((report) => {
    if (report.projectId !== project?.id || !report.date || !report.link) return false;
    const date = parseReportDate(report.date);
    return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
  });
  const materialCount = new Set(publications.map((report) => report.materialId)).size;
  const platformCount = new Set(publications.map((report) => report.platform)).size;
  const total = publications.reduce((sum, report) => sum + report.price, 0);
  const csvQuery = new URLSearchParams({projectId:project.id,dateFrom:config.from,dateTo:config.to}).toString();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('reports')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К отчетам
      </button>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">Отчет по проекту</h1>
            <Badge color="green">сформирован</Badge>
          </div>
          <p className="mt-2 text-sm text-[#476788]">{project?.name} · {formatReportPeriod(config.from, config.to)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setPeriodOpen(true)}><CalendarDays className="h-4 w-4" /> Изменить период</Button>
          <Button variant="secondary" onClick={() => downloadFromApi(`/reports/export.csv?${csvQuery}`)}><Download className="h-4 w-4" /> Скачать таблицу</Button>
          <Button variant="primary" disabled={!config.reportId} onClick={() => downloadFromApi(`/reports/${config.reportId}/pdf`)}><Download className="h-4 w-4" /> Скачать отчет</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Публикации', publications.length],
          ['Материалы', materialCount],
          ['Площадки', platformCount],
          ['Стоимость размещений', formatMoney(total)],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <div className="text-xs uppercase text-[#476788]">{label}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-[#0b3558]">{value}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[#d4e0ed] px-6 py-5">
          <h2 className="font-display text-lg font-bold text-[#0b3558]">Публикации проекта</h2>
          <p className="mt-1 text-sm text-[#476788]">В выгрузку войдут сведения о размещении, ссылка, текст и изображения каждого материала.</p>
        </div>
        {publications.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] divide-y divide-[#d4e0ed]">
              <thead className="bg-[#f8f9fb]">
                <tr>
                  {['Материал', 'Площадка', 'Дата', 'Ссылка', 'Стоимость'].map((label) => (
                    <th key={label} className="px-6 py-4 text-left text-xs font-medium uppercase text-[#476788]">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4e0ed]">
                {publications.map((report) => (
                  <tr key={report.order} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => onOpenPlacementReport(report)}>
                    <td className="px-6 py-4"><div className="text-sm font-semibold text-[#0b3558]">{report.material}</div><div className="mt-1 text-xs text-[#476788]">{report.order}</div></td>
                    <td className="px-6 py-4 text-sm text-[#476788]">{report.platform}</td>
                    <td className="px-6 py-4 text-sm tabular-nums text-[#476788]">{report.date}</td>
                    <td className="max-w-[260px] px-6 py-4"><div className="truncate text-sm text-[#006bff]">{report.link}</div></td>
                    <td className="px-6 py-4 text-sm font-semibold tabular-nums text-[#0b3558]">{formatMoney(report.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-[#a6bbd1]" />
            <h3 className="mt-3 font-display text-base font-bold text-[#0b3558]">За выбранный период публикаций нет</h3>
            <p className="mt-1 text-sm text-[#476788]">Измените период или выберите другой проект.</p>
          </div>
        )}
      </Card>
      <Modal isOpen={periodOpen} onClose={() => setPeriodOpen(false)} title="Изменить период отчета" className="max-w-2xl">
        <div className="space-y-5">
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-xs text-[#476788]">Проект</div>
            <div className="mt-1 text-sm font-semibold text-[#0b3558]">{project.name}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Дата начала</span>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="mt-2 min-h-[44px] w-full rounded-lg border border-[#476788] bg-white px-4 py-2.5 text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Дата окончания</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="mt-2 min-h-[44px] w-full rounded-lg border border-[#476788] bg-white px-4 py-2.5 text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
            </label>
          </div>
          {dateFrom && dateTo && dateFrom > dateTo && <ActionResult tone="error" text="Дата начала не может быть позже даты окончания." />}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPeriodOpen(false)}>Отмена</Button>
            <Button
              variant="primary"
              disabled={!dateFrom || !dateTo || dateFrom > dateTo || (dateFrom === config.from && dateTo === config.to)}
              onClick={async () => {
                const ok=await onChangePeriod({...config, from:dateFrom, to:dateTo, label:'Произвольный период'});
                if(ok)setPeriodOpen(false);
              }}
            >
              Обновить отчет
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const ClientBalanceView = ({ navigate }) => {
  const backend = useBackend();
  const available = Number(backend.data.balance.available || 0) / 100;
  const reserved = Number(backend.data.balance.reserved || 0) / 100;
  const transactions = financialTransactions(backend.data.transactions, backend.user.id, backend.data.orders, backend.data.materials);
  const reportOrders = backend.data.orders.filter((order) => order.publication_url);
  const closingDocuments = backend.data.closingDocuments || [];
  const periodActs = backend.data.acts || [];
  const openClosingDocument = (document) => backend.perform(async()=>{
    const issued=document.id||await api(`/closing-documents/${document.orderId}`,'POST',{},crypto.randomUUID());
    await backend.refresh();
    downloadFromApi(`/closing-documents/${issued.id}/pdf`);
  });
  return (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Финансы и документы</h1>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="min-w-0 md:sticky md:top-0 md:col-span-1 md:self-start">
        <div className="bg-white border border-[#d4e0ed] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[#476788] mb-2">Доступно для заявок</h3>
          <div className="text-4xl font-semibold text-[#0b3558] tabular-nums mb-8 tracking-tight">{formatMoney(available)}</div>
          
          <div className="space-y-4 text-sm mb-8 pb-6 border-b border-[#d4e0ed]">
             <div className="flex justify-between items-center">
               <span className="text-[#476788] flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Заморожено</span>
               <span className="tabular-nums font-medium text-[#0b3558]">{formatMoney(reserved)}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-[#476788] flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Всего средств</span>
               <span className="tabular-nums font-medium text-[#0b3558]">{formatMoney(available + reserved)}</span>
             </div>
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={() => navigate('topup')}>
            Пополнить баланс
          </Button>
        </div>

      </div>

      <div className="min-w-0 md:col-span-2">
        <Card className="flex max-h-[calc(100dvh-12rem)] min-w-0 flex-col overflow-hidden rounded-[24px]">
          <div className="flex shrink-0 flex-col gap-3 border-b border-[#d4e0ed] bg-[#f8f9fb] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-[#0b3558]">История операций</h3>
            <div className="grid grid-cols-1 gap-2 sm:flex">
              <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => navigate('operations')}>Все операции</Button>
              <Button variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => location.assign('/api/transactions/export.csv')}><Download className="h-3.5 w-3.5" /> Экспорт таблицы</Button>
            </div>
          </div>
          <div className="min-h-0 overflow-auto">
            <table className="w-full min-w-[620px] table-fixed divide-y divide-[#d4e0ed]">
              <thead className="bg-white">
                <tr>
                  <th className="w-[27%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Дата / номер</th>
                  <th className="w-[18%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Тип</th>
                  <th className="w-[36%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Описание</th>
                  <th className="w-[19%] px-4 py-4 text-right text-xs font-medium text-[#476788] uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#d4e0ed]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#f8f9fb]">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#0b3558] tabular-nums">{tx.date}</div>
                      <div className="text-xs text-[#476788] mt-0.5">{tx.id}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge color={tx.type === 'Пополнение' ? 'green' : tx.type === 'Удержание' ? 'red' : tx.type === 'Возврат' ? 'amber' : 'blue'}>{tx.type}</Badge>
                    </td>
                    <td className="break-words px-4 py-4 text-sm text-[#476788]" title={tx.desc}>
                      {tx.desc}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-semibold tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-[#0b3558]'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
                {!transactions.length && <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-[#476788]">Операций пока нет.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#0b3558]">Закрывающие документы</h3>
          <p className="text-sm text-[#476788] mt-1">Акты, счета, отчеты и документы по завершенным размещениям.</p>
        </div>
        <Button variant="secondary" onClick={() => downloadFromApi('/closing-documents/export.csv')}><Download className="h-4 w-4" /> Скачать таблицу</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Документ</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Заказ</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Дата</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase">Действие</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d4e0ed]">
            {periodActs.map(act=><tr key={act.id} className="hover:bg-[#f8f9fb]"><td className="px-6 py-4 text-sm font-medium text-[#0b3558]">Акт №{act.number} · {formatMoney(Number(act.amount)/100)}</td><td className="px-6 py-4 text-sm text-[#476788]">{act.orders.map(order=>`№${order.number}`).join(', ')}</td><td className="px-6 py-4 text-sm text-[#476788]">{String(act.issued_on).slice(0,10)}</td><td className="px-6 py-4"><Badge color="green">Из 1С</Badge></td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={()=>downloadFromApi(`/acts/${act.id}/pdf`)}><Download className="h-3.5 w-3.5"/> Скачать</Button></td></tr>)}
            {closingDocuments.map(document=><tr key={`act-${document.orderId}`} className="hover:bg-[#f8f9fb]">
              <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">Проект акта{document.number?` № АКС-${document.number}`:''}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">№{document.orderNumber} · {document.outlet} · {formatMoney(document.amount/100)}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{new Date(document.date).toLocaleDateString('ru-RU')}</td>
              <td className="px-6 py-4"><Badge color="amber">{document.status==='draft'?'Для подписания':'Не сформирован'}</Badge></td>
              <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" disabled={backend.busy} onClick={()=>openClosingDocument(document)}>{document.id?<><Download className="h-3.5 w-3.5" /> Скачать</>:'Сформировать'}</Button></td>
            </tr>)}
            {reportOrders.map((order) => (
	              <tr key={order.id} className="hover:bg-[#f8f9fb]">
	                <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">Отчет по размещению</td>
	                <td className="px-6 py-4 text-sm text-[#476788]">№{orderNumber(order)} · {order.platform}</td>
	                <td className="px-6 py-4 text-sm text-[#476788]">{new Date(order.updated_at).toLocaleDateString('ru-RU')}</td>
	                <td className="px-6 py-4"><Badge color="green">готов</Badge></td>
	                <td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => location.assign(`/api/orders/${order.id}/report.pdf`)}><Download className="h-3.5 w-3.5" /> Скачать</Button></td>
	              </tr>
	            ))}
            {!reportOrders.length&&!closingDocuments.length&&!periodActs.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[#476788]">Отчеты появятся после публикации материалов.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
  );
};

const ClientTopUpView = ({ navigate }) => {
  const backend=useBackend();
  const [amount,setAmount]=useState('500000');
  const [method,setMethod]=useState('Банковский перевод');
  const [individual,setIndividual]=useState(false);
  const [invoices,setInvoices]=useState<any[]>([]);
  const invoiceRequests=useRef(new Map<number,string>());
  const topupMoney=(value:number)=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
  useEffect(()=>{let active=true;api('/topups').then(rows=>{if(active)setInvoices(rows);}).catch(()=>{});return()=>{active=false;};},[]);
  useEffect(()=>{let active=true;api('/settings/account').then(settings=>{if(active&&settings.requisites?.payerStatus==='Физическое лицо'&&settings.requisites?.taxStatus!=='ИП'){setIndividual(true);setMethod('СБП');}}).catch(()=>{});return()=>{active=false;};},[]);
  const payment = Number(amount)||0;
  const topupCommissionBps=backend.data.commission.commissionBps;
  const fee = Math.round(payment*100*topupCommissionBps/10000)/100;
  const credited = payment - fee;
  const createInvoice=()=>backend.perform(async()=>{
    const amountKopeks=Math.round(payment*100);
    if(!invoiceRequests.current.has(amountKopeks))invoiceRequests.current.set(amountKopeks,crypto.randomUUID());
    const invoice=await api('/topups','POST',{amount:amountKopeks,method:'transfer'},invoiceRequests.current.get(amountKopeks));
    setInvoices(current=>[invoice,...current.filter(item=>item.id!==invoice.id)]);
    downloadFromApi(`/topups/${invoice.id}/invoice.pdf`);
  });
  return (
    <div className="w-full min-w-0 space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('balance')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К балансу
      </button>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Пополнение баланса</h1>
      <Card className="min-w-0 overflow-hidden p-5 sm:p-6">
        <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
          <label className="block min-w-0"><span className="text-sm font-medium text-[#476788]">Сумма платежа</span><div className="relative mt-2"><input inputMode="numeric" className="w-full rounded-lg border border-[#476788] px-4 py-2.5 pr-10 text-sm" value={amount} onChange={event=>setAmount(event.target.value.replace(/\D/g,'').slice(0,10))} /><span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-[#476788]">₽</span></div></label>
	          <label className="block min-w-0"><span className="text-sm font-medium text-[#476788]">Способ оплаты</span><CustomSelect className="mt-2 min-w-0" value={method} onChange={setMethod} options={individual?['СБП','Карта']:['Банковский перевод','СБП для бизнеса','Карта']} /></label>
        </div>
        <div className="mt-6 grid min-w-0 grid-cols-1 overflow-hidden rounded-lg border border-[#d4e0ed] sm:grid-cols-3">
          <div className="min-w-0 bg-[#f8f9fb] p-4 sm:p-5"><div className="text-xs text-[#476788]">Сумма платежа</div><div className="mt-1 break-words text-lg font-semibold sm:text-xl">{topupMoney(payment)}</div></div>
          <div className="min-w-0 border-t border-[#d4e0ed] bg-[#f8f9fb] p-4 sm:border-l sm:border-t-0 sm:p-5"><div className="text-xs text-[#476788]">Информационные услуги платформы, {topupCommissionBps/100}%</div><div className="mt-1 break-words text-lg font-semibold sm:text-xl">{topupMoney(fee)}</div><div className="mt-1 text-xs text-[#476788]">Не возвращаются</div></div>
          <div className="min-w-0 border-t border-[#d4e0ed] bg-[#f8f9fb] p-4 sm:border-l sm:border-t-0 sm:p-5"><div className="text-xs text-[#476788]">К зачислению</div><div className="mt-1 break-words text-lg font-semibold text-[#0b3558] sm:text-xl">{topupMoney(credited)}</div></div>
        </div>
        <div className="mt-6 flex justify-stretch sm:justify-end"><Button variant="primary" className="w-full sm:w-auto" disabled={backend.busy||payment<1||payment*100>100000000000||method!=='Банковский перевод'} title={method!=='Банковский перевод'?'Будет доступно после подключения фискализации':undefined} onClick={createInvoice}>{method==='Банковский перевод'?'Скачать счет на оплату':'Пополнить'}</Button></div>
      </Card>
      {invoices.length>0&&<Card className="min-w-0 overflow-hidden p-5 sm:p-6"><h2 className="font-display text-lg font-bold text-[#0b3558]">Счета на пополнение</h2><div className="mt-4 divide-y divide-[#d4e0ed]">{invoices.map(invoice=><div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><span className="font-semibold">№ АКС-{invoice.number}</span><span className="ml-3 text-[#476788]">{topupMoney(invoice.amount/100)} · {{issued:'Ожидает оплаты',partial:'Оплачен частично',paid:'Оплачен',overpaid:'Переплата',partially_refunded:'Частичный возврат',refunded:'Возвращен остаток'}[invoice.status]??invoice.status}</span><div className="mt-1 text-xs text-[#476788]">Услуги платформы: {topupMoney(invoice.feeAmount/100)} · К зачислению: {topupMoney((invoice.amount-invoice.feeAmount)/100)}</div></div><Button variant="secondary" size="sm" onClick={()=>downloadFromApi(`/topups/${invoice.id}/invoice.pdf`)}><Download className="h-4 w-4" /> Скачать счет</Button></div>)}</div></Card>}
    </div>
  );
};

const ClientOperationsView = ({ navigate }) => {
  const backend = useBackend();
  const transactions = financialTransactions(backend.data.transactions, backend.user.id, backend.data.orders, backend.data.materials);
  return (
  <div className="space-y-6">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('balance')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К балансу
    </button>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">История операций</h1>
        <p className="text-sm text-[#476788] mt-1">Пополнения, комиссии, заморозки, списания, возвраты, выводы и удержания.</p>
      </div>
      <Button variant="secondary" onClick={() => location.assign('/api/transactions/export.csv')}><Download className="h-4 w-4" /> Экспорт</Button>
    </div>
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]"><tr><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Номер / дата</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Описание</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Состояние</th><th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase">Сумма</th></tr></thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {transactions.map(tx => (
            <tr key={tx.id} className="hover:bg-[#f8f9fb]">
              <td className="px-6 py-4"><div className="text-sm font-medium text-[#0b3558]">{tx.id}</div><div className="text-xs text-[#476788]">{tx.date}</div></td>
              <td className="px-6 py-4"><Badge color={tx.type === 'Удержание' ? 'red' : tx.type === 'Пополнение' ? 'green' : 'blue'}>{tx.type}</Badge></td>
              <td className="px-6 py-4 text-sm text-[#476788]">{tx.desc}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{tx.status}</td>
              <td className={`px-6 py-4 text-right text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-[#0b3558]'}`}>{tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}</td>
            </tr>
          ))}
          {!transactions.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[#476788]">Операций пока нет.</td></tr>}
        </tbody>
      </table>
    </Card>
  </div>
  );
};

const ClientMaterialsView = ({ navigate, projects, materials, openProject, openMaterial, startCreateMaterial }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все статусы');
  const [projectFilter, setProjectFilter] = useState('Все проекты');
  const visibleMaterials = materials.filter((material) => {
    const project = projects.find((item) => item.id === material.projectId);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [material.name, material.advertiser, project?.name || 'без проекта'].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'Все статусы' || material.status === statusFilter;
    const matchesProject = projectFilter === 'Все проекты'
      || (projectFilter === 'Без проекта' ? !material.projectId : project?.name === projectFilter);
    return matchesSearch && matchesStatus && matchesProject;
  });
  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Материалы</h1>
        <p className="text-sm text-[#476788] mt-1">Материалы для размещения</p>
      </div>
      <Button variant="primary" className="w-full sm:w-auto" onClick={() => startCreateMaterial(null)}><Plus className="h-4 w-4" /> Добавить материал</Button>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6bbd1]" />
        <input 
          type="text" 
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по материалу, рекламодателю или проекту"
          className="w-full pl-10 pr-4 py-2 border border-[#476788] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006bff] text-sm"
        />
      </div>
      <div className="w-full sm:w-56">
        <CustomSelect value={statusFilter} onChange={setStatusFilter} placeholder="Статус материала" options={['Все статусы', 'Черновик', 'На модерации', 'Принят в систему', 'Требуются правки', 'Используется в заказах', 'Отклонен']} />
      </div>
      <div className="w-full sm:w-64">
        <CustomSelect value={projectFilter} onChange={setProjectFilter} placeholder="Проект" options={['Все проекты', ...projects.map((project) => project.name), 'Без проекта']} />
      </div>
    </div>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] table-fixed divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]">
            <tr>
              <th className="w-[32%] px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Название материала</th>
              <th className="w-[15%] px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Рекламодатель</th>
              <th className="w-[18%] px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Статус</th>
              <th className="w-[11%] px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Размещений</th>
              <th className="w-[12%] px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Обновлен</th>
              <th className="w-[12%] px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase tracking-wider">Действие</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#d4e0ed]">
            {visibleMaterials.map((mat) => (
              <tr key={mat.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => openMaterial(mat.id)}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-[#0b3558] max-w-[200px] sm:max-w-xs truncate">{mat.name}</div>
                  <div className="text-xs text-[#476788] mt-0.5">{mat.type}</div>
                  <div className="mt-1">
                    <ProjectLink project={projects.find((project) => project.id === mat.projectId)} onOpen={openProject} />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#476788]"><div className="truncate">{mat.advertiser}</div></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color={mat.statusColor}>{mat.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#476788] tabular-nums">{mat.placements}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#476788] tabular-nums">{mat.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  {mat.status === 'Принят в систему' ? (
                    <button className="text-[#006bff] font-medium" onClick={(event) => { event.stopPropagation(); navigate('catalog'); }}>В каталог</button>
                  ) : mat.status === 'Используется в заказах' ? (
                    <button className="text-[#006bff] font-medium" onClick={(event) => { event.stopPropagation(); navigate('orders'); }}>К заказам</button>
                  ) : (
                    <button className="text-[#a6bbd1] font-medium cursor-not-allowed" disabled title="Выбор площадок доступен только после принятия материала">Недоступно</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
  );
};

const ClientMaterialDetailView = ({ navigate, material, projects, openProject, onChangeProject }) => {
  const backend = useBackend();
  const [expedited,setExpedited] = useState(false);
  const submitKey = useRef(crypto.randomUUID());
  const withdrawKey = useRef(crypto.randomUUID());
  const [projectName, setProjectName] = useState(projects.find((project) => project.id === material?.projectId)?.name || 'Без проекта');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const currentMaterial = material;
  if(!currentMaterial) return <Card className="p-6">Выберите материал в списке.</Card>;
  const canSubmit = ['draft','rejected'].includes(currentMaterial.apiStatus);
  const submit = () => backend.perform(async()=>{
    await api('/materials/submit','POST',{ids:[currentMaterial.id],expedited},submitKey.current);
    submitKey.current=crypto.randomUUID();await backend.refresh();
  });
  const changeProject = async (nextName) => {
    const saved=await onChangeProject(currentMaterial.id, nextName === 'Без проекта' ? null : projects.find((project) => project.name === nextName)?.id ?? null);
    if(saved)setProjectName(nextName);
    return saved;
  };
  const isMaterialAccepted = ['Принят в систему', 'Используется в заказах'].includes(currentMaterial.status);
  return (
  <div className="mx-auto max-w-6xl space-y-6">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('materials')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К материалам
    </button>

    <div className="border-b border-[#d4e0ed] pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={currentMaterial.statusColor}>{currentMaterial.status}</Badge>
          <span className="text-sm text-[#476788]">Материал №{materialNumber(currentMaterial)}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          {currentMaterial.apiStatus==='pending'&&<Button variant="secondary" disabled={backend.busy} onClick={()=>backend.perform(async()=>{
            await api(`/materials/${currentMaterial.id}/withdraw`,'POST',{},withdrawKey.current);
            withdrawKey.current=crypto.randomUUID();await backend.refresh();
          })}>Отозвать с модерации</Button>}
          <Button variant="secondary" disabled={currentMaterial.apiStatus==='pending'} className="whitespace-nowrap" onClick={() => navigate('material_edit')}>Редактировать материал</Button>
          <Button variant="primary" disabled={!isMaterialAccepted} className="whitespace-nowrap" onClick={() => navigate('catalog')}>Выбрать площадки</Button>
        </div>
      </div>
      <h1 className="mt-4 w-full break-words font-display text-2xl font-bold leading-tight text-[#0b3558] sm:text-3xl">
        {currentMaterial.name}
      </h1>
      <div className="mt-2 flex min-h-9 flex-wrap items-center gap-x-2 gap-y-2 text-sm text-[#476788]">
        <span>{currentMaterial.advertiser}</span>
        <span aria-hidden="true">·</span>
        <span>{currentMaterial.type}</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[#006bff] hover:text-[#004eba]"
          onClick={() => setProjectModalOpen(true)}
          aria-label={`Изменить проект: ${projectName}`}
        >
          <span className="truncate">{projectName}</span>
          <Pencil className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    </div>

    <div className="rounded-xl border border-[#d4e0ed] bg-white p-5">
      <div className="flex flex-col items-start gap-4 md:flex-row">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#d4e0ed] bg-[#f8f9fb]">
          {isMaterialAccepted
            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            : <Clock className="h-5 w-5 text-[#006bff]" />}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[#0b3558]">
            {isMaterialAccepted ? 'Материал принят в систему' : currentMaterial.status}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#476788]">
            {isMaterialAccepted
              ? 'Материал прошел проверку и доступен для создания заказов. Выберите одну или несколько площадок в каталоге.'
              : canSubmit ? (currentMaterial.moderation_reason || 'Материал сохранен. Отправьте его на модерацию, когда закончите редактирование.') : 'Материал проходит проверку. После принятия станет доступен выбор площадок и создание заказов.'}
          </p>
          {canSubmit && <div className="mt-4 flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={expedited} disabled={backend.busy} onChange={e=>{setExpedited(e.target.checked);submitKey.current=crypto.randomUUID();}} />Ускоренная модерация · 50 ₽</label><Button disabled={backend.busy} onClick={submit}>Отправить на модерацию</Button></div>}
          {isMaterialAccepted && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            При редактировании материал вернется в черновики и станет недоступен для новых размещений до повторной модерации.
          </div>}
        </div>
      </div>
    </div>

    <LiveMaterialContent material={currentMaterial} />
    <ProjectChangeModal
      isOpen={projectModalOpen}
      onClose={() => setProjectModalOpen(false)}
      currentProject={projectName}
      projects={projects}
      entityLabel="материала"
      onConfirm={changeProject}
    />
  </div>
  );
};

const createMaterialDraft = (id, projectName, withExample = false) => ({
  id,
  clientKey: crypto.randomUUID(),
  title: withExample ? 'Пресс-релиз: запуск аналитики' : '',
  advertiser: 'Без рекламодателя',
  advertiserId: null,
  materialType: 'Статья',
  projectName,
  note: '',
  body: '',
  metadata: {},
});

const richTextLength = (html = '') => {
  const node=document.createElement('div');node.innerHTML=html;return (node.textContent||'').length;
};

const RichTextEditor = ({ value, onChange }) => {
  const [rewriteOpen,setRewriteOpen]=useState(false);
  const imageInput=useRef(null);
  const [assetPanel,setAssetPanel]=useState(null);
  const [assetUrl,setAssetUrl]=useState('');
  const [uploading,setUploading]=useState(false);
  const [assetError,setAssetError]=useState('');
  const editor=useEditor({
    immediatelyRender:false,
    shouldRerenderOnTransaction:true,
    extensions:[
      StarterKit.configure({link:false,underline:false}),
      UnderlineExtension,
      TextStyle,
      FontSize,
      FontFamily.configure({types:['textStyle']}),
      Link.configure({openOnClick:false,autolink:true,HTMLAttributes:{rel:'noopener noreferrer',target:'_blank'}}),
      Image.configure({
        allowBase64:false,
        resize:{enabled:true,directions:['top-left','top-right','bottom-left','bottom-right'],minWidth:80,minHeight:50,alwaysPreserveAspectRatio:true},
        HTMLAttributes:{class:'max-w-full rounded-lg'},
      }),
    ],
    content:value||'',
    editorProps:{attributes:{role:'textbox','aria-label':'Текст материала','aria-multiline':'true',class:'material-content min-h-[320px] w-full p-6 outline-none'}},
    onUpdate:({editor:instance})=>onChange(instance.getHTML()),
  });
  useEffect(()=>{
    if(editor && !editor.isFocused && editor.getHTML()!==(value||''))editor.commands.setContent(value||'',{emitUpdate:false});
  },[editor,value]);
  if(!editor)return <div className="mt-2 min-h-[380px] rounded-2xl border border-[#0b3558] bg-white" />;
  const applyTypography=(attribute,value)=>{
    const {from,to,empty}=editor.state.selection;
    const chain=editor.chain().focus();
    if(empty)chain.selectAll();
    chain.setMark('textStyle',{[attribute]:value});
    if(empty)chain.setTextSelection({from,to}).setMark('textStyle',{[attribute]:value});
    chain.run();
  };
  const button=(label,Icon,run,active=false,text='')=><button type="button" title={label} aria-label={label} onClick={run} className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 ${active?'border-[#006bff] bg-[#e7f1ff] text-[#006bff]':'border-transparent text-[#476788] hover:border-[#d4e0ed] hover:bg-white hover:text-[#0b3558]'}`}><Icon className="h-4 w-4" />{text&&<span className="ml-2 text-xs font-medium">{text}</span>}</button>;
  const insertImage=(src)=>{if(!src)return;editor.chain().focus().setImage({src,alt:'Изображение материала'}).run();setAssetUrl('');setAssetPanel(null);};
  const uploadImage=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    setUploading(true);setAssetError('');
    try{const stored=await uploadFile(file);insertImage(`/api/files/${stored.id}/image`);}catch(error){setAssetError(error instanceof Error?error.message:'Не удалось загрузить изображение');}finally{setUploading(false);event.target.value='';}
  };
  const setLink=()=>{if(!assetUrl.trim())editor.chain().focus().unsetLink().run();else editor.chain().focus().extendMarkRange('link').setLink({href:assetUrl.trim()}).run();setAssetPanel(null);setAssetUrl('');};
  const tools:any[]=[
    ['Обычный текст',Type,()=>editor.chain().focus().setParagraph().run(),editor.isActive('paragraph'),'Текст'],
    ['Заголовок 1',Heading1,()=>editor.chain().focus().toggleHeading({level:1}).run(),editor.isActive('heading',{level:1})],
    ['Заголовок 2',Heading2,()=>editor.chain().focus().toggleHeading({level:2}).run(),editor.isActive('heading',{level:2})],
    ['Жирный',Bold,()=>editor.chain().focus().toggleBold().run(),editor.isActive('bold')],
    ['Курсив',Italic,()=>editor.chain().focus().toggleItalic().run(),editor.isActive('italic')],
    ['Подчеркнутый',Underline,()=>editor.chain().focus().toggleUnderline().run(),editor.isActive('underline')],
    ['Список',List,()=>editor.chain().focus().toggleBulletList().run(),editor.isActive('bulletList')],
    ['Цитата',Quote,()=>editor.chain().focus().toggleBlockquote().run(),editor.isActive('blockquote')],
  ];
  return <div className="mt-2 overflow-hidden rounded-2xl border border-[#0b3558] bg-white focus-within:border-[#006bff] focus-within:ring-2 focus-within:ring-[#006bff]">
    <div className="flex flex-wrap items-center gap-1.5 border-b border-[#d4e0ed] bg-[#f8f9fb] px-3 py-2">
      {tools.map(([label,Icon,run,active,text])=><React.Fragment key={String(label)}>{button(label,Icon,run,active,text)}</React.Fragment>)}
      {button('Изображение',ImageIcon,()=>{setAssetPanel(assetPanel==='image'?null:'image');setAssetUrl('');setAssetError('');},editor.isActive('image'))}
      {button('Ссылка',ExternalLink,()=>{setAssetPanel(assetPanel==='link'?null:'link');setAssetUrl(editor.getAttributes('link').href||'');},editor.isActive('link'))}
      <div className="mx-1 h-6 w-px bg-[#d4e0ed]" />
      <CustomSelect className="w-32" buttonClassName="min-h-9 px-2 py-1.5 text-xs border-[#d4e0ed]" value={editor.getAttributes('textStyle').fontFamily||'Arial'} onChange={font=>applyTypography('fontFamily',font)} options={['Manrope','Arial','Georgia']} />
      <CustomSelect className="w-24" buttonClassName="min-h-9 px-2 py-1.5 text-xs border-[#d4e0ed]" value={(editor.getAttributes('textStyle').fontSize||'16px').replace('px',' px')} onChange={size=>applyTypography('fontSize',size.replace(' ',''))} options={['10 px','12 px','14 px','16 px','18 px','20 px','24 px','28 px','32 px','36 px','48 px']} />
      <Button variant="primary" size="sm" className="ml-auto w-full sm:w-auto" onClick={()=>setRewriteOpen(true)}><Sparkles className="h-4 w-4 shrink-0"/>Рерайт с помощью ИИ · 30 ₽</Button>
    </div>
    {assetPanel==='image'&&<div className="border-b border-[#d4e0ed] bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1"><span className="text-xs font-medium text-[#476788]">Адрес изображения</span><input type="url" className="mt-1 w-full rounded-lg border border-[#476788] px-3 py-2 text-sm" placeholder="https://example.com/image.jpg" value={assetUrl} onChange={e=>setAssetUrl(e.target.value)} /></label>
        <Button variant="secondary" size="sm" disabled={!assetUrl.trim()} onClick={()=>insertImage(assetUrl.trim())}>Вставить по URL</Button>
        <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadImage} />
        <Button variant="primary" size="sm" disabled={uploading} onClick={()=>imageInput.current?.click()}><UploadCloud className="h-4 w-4" />{uploading?'Загрузка…':'Загрузить файл'}</Button>
      </div>
      {editor.isActive('image')&&<div className="mt-3 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-medium text-[#476788]">Ширина:</span>{['25%','50%','75%','100%'].map(width=><button key={width} type="button" className="rounded-lg border border-[#d4e0ed] px-3 py-1.5 text-xs font-semibold text-[#0b3558] hover:border-[#006bff]" onClick={()=>editor.chain().focus().updateAttributes('image',{width}).run()}>{width}</button>)}</div>}
      {assetError&&<p role="alert" className="mt-2 text-xs text-red-700">{assetError}</p>}
    </div>}
    {assetPanel==='link'&&<div className="flex flex-col gap-3 border-b border-[#d4e0ed] bg-white p-4 sm:flex-row sm:items-end"><label className="min-w-0 flex-1"><span className="text-xs font-medium text-[#476788]">Адрес ссылки</span><input type="url" className="mt-1 w-full rounded-lg border border-[#476788] px-3 py-2 text-sm" placeholder="https://example.com" value={assetUrl} onChange={e=>setAssetUrl(e.target.value)} /></label><Button variant="primary" size="sm" onClick={setLink}>{assetUrl.trim()?'Применить':'Удалить ссылку'}</Button></div>}
    <EditorContent editor={editor} />
    <AiAssistModal isOpen={rewriteOpen} onClose={()=>setRewriteOpen(false)} body={value} onApply={body=>editor.commands.setContent(body)} onBusyChange={busy=>editor.setEditable(!busy)} />
  </div>;
};

const MaterialDraftForm = ({ draft, index, projects, onChange, onRemove, canRemove, onOpenAi, mode = 'create' }) => {
  const backend = useBackend();
  return (
  <Card id={`material-form-${draft.id}`} className="scroll-mt-6 p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#d4e0ed] pb-4">
      <div>
        <h2 className="font-display text-lg font-bold text-[#0b3558]">{mode === 'edit' ? 'Данные материала' : `Материал ${index + 1}`}</h2>
        <p className="mt-1 text-sm text-[#476788]">
          {mode === 'edit'
            ? 'Изменения применятся только к этому материалу.'
            : 'Все поля остаются доступными для редактирования до общей отправки.'}
        </p>
      </div>
      {canRemove && (
        <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4e0ed] text-[#476788] hover:border-[#e12525] hover:text-[#e12525]" aria-label={`Удалить материал ${index + 1}`} onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <label className="block md:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#476788]">Заголовок</span>
          <span className="text-xs text-[#476788]">{draft.title.length} / 200 символов</span>
        </div>
        <input maxLength={200} className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={draft.title} onChange={(event) => onChange({ title: event.target.value })} placeholder="Введите заголовок материала" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[#476788]">Рекламодатель</span>
        <CustomSelect className="mt-2" value={draft.advertiser||'Без рекламодателя'} onChange={(value) => onChange({ advertiser: value,advertiserId:value==='Без рекламодателя'?null:backend.data.advertisers.find(a=>a.name===value)?.id??null })} options={['Без рекламодателя',...backend.data.advertisers.map(a => a.name)]} />
        <span className="mt-2 block text-xs text-[#476788]">Необязательно. Рекламодателя можно привязать позже.</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[#476788]">Тип материала</span>
        <CustomSelect className="mt-2" value={draft.materialType} onChange={(value) => onChange({ materialType: value })} options={['Статья', 'Новость', 'Пост', 'Лонгрид']} />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-[#476788]">Проект</span>
        <CustomSelect className="mt-2" value={draft.projectName} onChange={(value) => onChange({ projectName: value })} options={[...projects.map((project) => project.name), 'Без проекта']} />
        <span className="mt-2 block text-xs text-[#476788]">Необязательно. Новые заказы этого материала унаследуют выбранный проект.</span>
      </label>
      <div>
        <span className="text-sm font-medium text-[#476788]">Файлы</span>
        <FileUploadField accept=".pdf,.docx,.txt" prompt="Выберите документ или перетащите его сюда" hint="PDF, DOCX, TXT · до 20 МБ" storedIds={draft.metadata?.attachments || []} onStoredChange={ids=>onChange({metadata:{...draft.metadata,attachments:ids}})} />
      </div>
      <div>
        <span className="text-sm font-medium text-[#476788]">Изображения</span>
        <FileUploadField accept="image/png,image/jpeg,image/webp" prompt="Выберите изображения или перетащите их сюда" hint="PNG, JPG или WEBP · до 20 МБ" storedIds={draft.metadata?.attachments || []} onStoredChange={ids=>onChange({metadata:{...draft.metadata,attachments:ids}})} imagesOnly />
        <div className="mt-2 text-sm text-[#476788]">Или <button type="button" className="font-semibold text-[#006bff]" onClick={() => onOpenAi('image')}>сгенерируйте изображение с помощью ИИ за 50 ₽</button></div>
      </div>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-[#476788]">Примечание и ТЗ</span>
        <textarea className="mt-2 min-h-[120px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={draft.note} onChange={(event) => onChange({ note: event.target.value })} placeholder="Необязательные пожелания по стилистике, акцентам, площадкам или ограничениям." />
      </label>
      <div className="md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-[#476788]">Текст материала</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#476788]">{richTextLength(draft.body)} знаков</span>
          </div>
        </div>
        <RichTextEditor value={draft.body||''} onChange={body=>onChange({body})} />
      </div>
    </div>
    <details className="mt-6 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[#0b3558]">Дополнительные настройки</summary>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.entries({tags:'Тэги',title:'Title',description:'Description',desiredUrl:'Желаемый URL'}).map(([key,label]) => <label key={key}><span className="text-sm font-medium text-[#476788]">{label}</span><input className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm" value={draft.metadata?.[key] || ''} onChange={e => onChange({metadata:{...draft.metadata,[key]:e.target.value}})} /></label>)}
      </div>
    </details>
  </Card>
); };

const ClientEditMaterialView = ({ navigate, material, projects, onUpdateMaterial }) => {
  const currentMaterial = material || mockMaterials[0];
  const initialProjectName = projects.find((project) => project.id === currentMaterial.projectId)?.name || 'Без проекта';
  const [aiModal, setAiModal] = useState(null);
  const [draft, setDraft] = useState(() => ({
    ...createMaterialDraft(currentMaterial.id, initialProjectName),
    title: currentMaterial.name,
    advertiser: currentMaterial.advertiser,
    advertiserId: currentMaterial.advertiserId,
    materialType: currentMaterial.type,
    note: currentMaterial.note || '',
    body: currentMaterial.body || '',
    metadata: currentMaterial.metadata || {},
  }));
  const saveMaterial = async () => {
    if (!draft.title.trim()) return;
    const ok = await onUpdateMaterial(currentMaterial.id, {
      name: draft.title.trim(),
      advertiser: draft.advertiser,
      advertiserId: draft.advertiserId,
      type: draft.materialType,
      note: draft.note.trim(),
      body: draft.body,
      metadata: draft.metadata,
      projectId: draft.projectName === 'Без проекта'
        ? null
        : projects.find((project) => project.name === draft.projectName)?.id ?? null,
      status: 'Черновик',
      statusColor: 'gray',
      date: '23.07.2026',
    });
    if (ok) navigate('material_detail');
  };
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('material_detail')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К материалу
      </button>
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Редактирование материала</h1>
        <p className="mt-1 text-sm text-[#476788]">После сохранения материал вернется в черновики. Другие материалы и заказы не изменятся.</p>
      </div>
      <MaterialDraftForm
        draft={draft}
        index={0}
        projects={projects}
        onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        onRemove={() => {}}
        canRemove={false}
        onOpenAi={setAiModal}
        mode="edit"
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={() => navigate('material_detail')}>Отмена</Button>
        <Button variant="primary" disabled={!draft.title.trim()} onClick={saveMaterial}>Сохранить изменения</Button>
      </div>
      <AiAssistModal isOpen={Boolean(aiModal)} onClose={() => setAiModal(null)} type={aiModal || 'rewrite'} />
    </div>
  );
};

const ClientCreateMaterialView = ({ navigate, projects, defaultProjectId = null, onCreateMaterial }) => {
  const [aiModal, setAiModal] = useState(null);
  const defaultProjectName = projects.find((project) => project.id === defaultProjectId)?.name || 'Без проекта';
  const [drafts, setDrafts] = useState(() => [createMaterialDraft(1, defaultProjectName)]);
  const requestKeys = useRef(new Map());
  const [expeditedModeration, setExpeditedModeration] = useState(false);
  const readyDrafts = drafts.filter((draft) => draft.title.trim());
  const materialsCount = readyDrafts.length;
  const expeditedTotal = materialsCount * 50;
  const updateDraft = (id, patch) => setDrafts((items) => items.map((draft) => draft.id === id ? { ...draft, ...patch } : draft));
  const addDraft = async () => {
    const lastDraft = drafts[drafts.length - 1];
    if (!lastDraft?.title.trim()) return;
    if (!await saveMaterials('Черновик', false)) return;
    const nextId = Math.max(...drafts.map((draft) => draft.id)) + 1;
    setDrafts((items) => [...items, createMaterialDraft(nextId, defaultProjectName)]);
    requestAnimationFrame(() => document.getElementById(`material-form-${nextId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const removeDraft = (id) => setDrafts((items) => items.filter((draft) => draft.id !== id));
  const saveMaterials = async (status, leave = true) => {
    const items = readyDrafts.map((draft) => ({
      clientKey: draft.clientKey,
      name: draft.title.trim(),
      advertiser: draft.advertiser,
      advertiserId: draft.advertiserId,
      type: draft.materialType,
      note: draft.note.trim(),
      body: draft.body,
      metadata: draft.metadata,
      projectId: draft.projectName === 'Без проекта' ? null : projects.find((project) => project.name === draft.projectName)?.id ?? null,
      status,
      statusColor: status === 'Черновик' ? 'gray' : 'blue',
      expeditedModeration: status === 'На модерации' && expeditedModeration,
      moderationFee: status === 'На модерации' && expeditedModeration ? 50 : 0,
    }));
    const fingerprint = JSON.stringify({items,status,expeditedModeration});
    if (!requestKeys.current.has(fingerprint)) requestKeys.current.set(fingerprint,crypto.randomUUID());
    const ok = await onCreateMaterial(items,status,expeditedModeration,requestKeys.current.get(fingerprint));
    if (ok && leave) navigate('materials');
    return ok;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('materials')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К материалам
      </button>
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Создание материалов</h1>
        <p className="mt-1 text-sm text-[#476788]">Заполните несколько материалов на одной странице и отправьте их на модерацию одновременно.</p>
      </div>

      {drafts.map((draft, index) => (
        <React.Fragment key={draft.id}>
          <MaterialDraftForm
            draft={draft}
            index={index}
            projects={projects}
            onChange={(patch) => updateDraft(draft.id, patch)}
            onRemove={() => removeDraft(draft.id)}
            canRemove={drafts.length > 1}
            onOpenAi={setAiModal}
          />
          {index === drafts.length - 1 && (
            <div className="flex justify-start">
              <Button variant="secondary" onClick={addDraft} disabled={!draft.title.trim()}>
                <Plus className="h-4 w-4" /> Сохранить и добавить еще материал
              </Button>
            </div>
          )}
        </React.Fragment>
      ))}

      <section className="border-t border-[#d4e0ed] pt-6" aria-labelledby="material-batch-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="material-batch-heading" className="font-display text-lg font-bold text-[#0b3558]">Материалы к отправке</h2>
            <p className="mt-1 text-sm text-[#476788]">Все формы выше остаются доступными для редактирования.</p>
          </div>
          <span className="rounded-full bg-[#e5f0ff] px-3 py-1.5 text-sm font-semibold text-[#0054c7]">{materialsCount}</span>
        </div>
        <div className="mt-4 divide-y divide-[#d4e0ed] overflow-hidden rounded-xl border border-[#d4e0ed] bg-white">
          {readyDrafts.map((draft) => {
            const index = drafts.findIndex((item) => item.id === draft.id);
            return (
              <button key={draft.id} type="button" className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[#f8f9fb]" onClick={() => document.getElementById(`material-form-${draft.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <div className="min-w-0">
                  <div className="text-xs font-medium uppercase text-[#6f88a3]">Материал {index + 1}</div>
                  <div className="mt-1 truncate font-semibold text-[#0b3558]">{draft.title}</div>
                  <div className="mt-1 text-sm text-[#476788]">{draft.advertiser} · {draft.materialType}</div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-[#006bff]">К форме</span>
              </button>
            );
          })}
        </div>
      </section>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
        <input type="checkbox" checked={expeditedModeration} onChange={(event) => setExpeditedModeration(event.target.checked)} className="mt-1 h-4 w-4 accent-[#006bff]" />
        <span className="flex-1">
          <span className="flex items-center gap-2 font-semibold text-[#0b3558]"><Zap className="h-4 w-4 text-[#006bff]" /> Ускоренная модерация</span>
          <span className="mt-1 block text-sm text-[#476788]">Приоритетная проверка стоит 50 ₽ за материал{expeditedModeration && materialsCount > 0 ? ` · итого ${expeditedTotal} ₽` : ''}.</span>
        </span>
      </label>

      <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
        Все материалы пройдут базовую проверку рекламодателя, ссылок, изображений и юридических рисков. Отправка создаст отдельную заявку на модерацию для каждого материала.
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="secondary" disabled={!materialsCount} onClick={() => saveMaterials('Черновик')}>{materialsCount > 1 ? 'Сохранить черновики' : 'Сохранить черновик'}</Button>
        <Button variant="primary" disabled={!materialsCount} onClick={() => saveMaterials('На модерации')}>Отправить на модерацию{materialsCount > 1 ? ` · ${materialsCount}` : ''}</Button>
      </div>
      <AiAssistModal isOpen={Boolean(aiModal)} onClose={() => setAiModal(null)} type={aiModal || 'rewrite'} />
    </div>
  );
};

const ClientAdvertisersView = ({ navigate, onOpenAdvertiser }) => {
  const mockAdvertisers = useBackend().data.advertisers;
  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Рекламодатели</h1>
      <Button variant="primary" onClick={() => navigate('advertiser_new')}><Plus className="h-4 w-4" /> Добавить рекламодателя</Button>
    </div>
    <Card className="p-5 bg-[#f8f9fb]">
      <p className="text-sm text-[#476788]">
        Рекламодатель нужен для маркировки. Указанные реквизиты сохраняются в карточке; статус проверки отображается отдельно.
      </p>
    </Card>
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Рекламодатель</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">ИНН</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">ОГРН / ОГРНИП</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Проверка</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {mockAdvertisers.map(item => (
            <tr key={item.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => onOpenAdvertiser(item.id)}>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-[#0b3558]">{item.name}</div>
              </td>
              <td className="px-6 py-4 text-sm text-[#476788]">{item.type}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{item.inn}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{item.ogrn}</td>
              <td className="px-6 py-4"><Badge color={item.color}>{item.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
); };

const useAdvertiserRecord = (id) => {
  const backend=useBackend();
  const [fetched,setFetched]=useState(null);
  const [loading,setLoading]=useState(Boolean(id));
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!id){setFetched(null);setLoading(false);return;}
    let active=true;
    setLoading(true);setError('');
    api(`/advertisers/${id}`).then(row=>{if(active)setFetched(normalizeAdvertiser(row));}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[id,backend.data.advertisers]);
  return {advertiser:fetched?.id===id?fetched:backend.data.advertisers.find(item=>item.id===id),loading,error};
};

const ClientAdvertiserDetailRoute = ({id,navigate,orders,onOpenOrder}) => {
  const {advertiser,loading,error}=useAdvertiserRecord(id);
  if(!advertiser)return <Card className="p-6">{loading?'Загрузка…':error||'Выберите рекламодателя в списке.'}</Card>;
  return <ClientAdvertiserDetailView navigate={navigate} advertiser={advertiser} orders={orders} onOpenOrder={onOpenOrder} />;
};

const ClientAdvertiserDetailView = ({ navigate, advertiser, orders = [], onOpenOrder }) => {
  if (!advertiser) return <Card className="p-6">Выберите рекламодателя в списке.</Card>;
  const details=advertiser.details||{};
  const legal=[
    ['Тип рекламодателя',details.kind==='entrepreneur'?'Индивидуальный предприниматель':'Юридическое лицо'],
    ['Юридическое название',advertiser.name],['ИНН',advertiser.inn],['КПП',details.kpp],
    ['ОГРН / ОГРНИП',details.ogrn],['Юридический адрес',details.address],
  ].filter(([,value])=>Boolean(value));
  const marking=[
    ['Объект рекламирования',details.advertisedObject],['Целевая ссылка',details.targetUrl],
    ['Тип исходного договора',details.contractType==='intermediary'?'Посреднический договор':details.contractType==='services'?'Договор оказания услуг':''],
    ['Номер исходного договора',details.contractNumber],['Дата исходного договора',details.contractDate],
    ['Первый исполнитель',details.executorName],['ИНН первого исполнителя',details.executorInn],
  ].filter(([,value])=>Boolean(value));
  const requests=orders.filter(order=>order.snapshot?.advertiser?.id?order.snapshot.advertiser.id===advertiser.id:order.snapshot?.advertiser?.inn===advertiser.inn);
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('advertisers')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К рекламодателям
      </button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight text-[#0b3558] break-words">{advertiser.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3"><Badge color={advertiser.color}>{advertiser.status}</Badge><span className="text-sm text-[#476788]">ИНН {advertiser.inn}</span></div>
        </div>
        <Button variant="secondary" onClick={() => navigate('advertiser_edit')}>Изменить данные</Button>
      </div>
      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558]">Реквизиты</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {legal.map(([label,value])=><div key={label} className="min-w-0 border-b border-[#d4e0ed] py-3"><dt className="text-xs text-[#476788]">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-[#0b3558]">{value}</dd></div>)}
        </dl>
        {marking.length>0&&<div className="mt-6"><h3 className="font-display text-base font-bold text-[#0b3558]">Данные для маркировки</h3><dl className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">{marking.map(([label,value])=><div key={label} className="min-w-0 border-b border-[#d4e0ed] py-3"><dt className="text-xs text-[#476788]">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-[#0b3558]">{value}</dd></div>)}</dl></div>}
      </Card>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-base font-bold text-[#0b3558]">Заказы</h2><Badge color="blue">{requests.length}</Badge></div>
        {requests.length?<div className="mt-4 divide-y divide-[#d4e0ed] border-t border-[#d4e0ed]">{requests.map(order=><button key={order.id} className="flex w-full items-center justify-between gap-4 py-4 text-left hover:text-[#006bff]" onClick={()=>onOpenOrder(order)}><span className="min-w-0"><span className="block break-words text-sm font-semibold text-[#0b3558]">Заказ №{orderNumber(order)} · {order.material}</span><span className="mt-1 block break-words text-xs text-[#476788]">{order.platform}</span></span><span className="flex shrink-0 items-center gap-2"><Badge color={order.statusColor}>{order.status}</Badge><ChevronRight className="h-4 w-4 text-[#476788]" /></span></button>)}</div>:<p className="mt-4 text-sm text-[#476788]">Заказов пока нет.</p>}
      </Card>
    </div>
  );
};

const ClientAdvertiserEditView = ({ navigate, id }) => {
  const {advertiser,loading,error}=useAdvertiserRecord(id);
  if(!advertiser)return <Card className="p-6">{loading?'Загрузка…':error||'Выберите рекламодателя в списке.'}</Card>;
  return <ClientAdvertiserNewView navigate={navigate} advertiser={advertiser} />;
};

const ClientAdvertiserNewView = ({ navigate, advertiser = null }) => {
  const backend = useBackend();
  const [advertiserType,setAdvertiserType]=useState(advertiser?.details?.kind==='entrepreneur'?'Индивидуальный предприниматель':'Юридическое лицо');
  const [fields,setFields] = useState({name:advertiser?.name||'',inn:advertiser?.inn||'',kpp:advertiser?.details?.kpp||'',ogrn:advertiser?.details?.ogrn||'',address:advertiser?.details?.address||'',advertisedObject:advertiser?.details?.advertisedObject||'',targetUrl:advertiser?.details?.targetUrl||'',contractType:advertiser?.details?.contractType==='intermediary'?'Посреднический договор':advertiser?.details?.contractType==='services'?'Договор оказания услуг':'Не указан',contractNumber:advertiser?.details?.contractNumber||'',contractDate:advertiser?.details?.contractDate||'',executorName:advertiser?.details?.executorName||'',executorInn:advertiser?.details?.executorInn||''});
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [registryMessage,setRegistryMessage]=useState('');
  const [registryBusy,setRegistryBusy]=useState(false);
  const fillFromRegistry=async()=>{
    setRegistryBusy(true);setRegistryMessage('');
    try {
      const params=new URLSearchParams({query:fields.inn,...(fields.kpp?{kpp:fields.kpp}:{})});
      const result=await api(`/reference/party?${params}`);
      if(!result.found){setRegistryMessage('Организация не найдена в реестре.');return;}
      const party=result.party;
      setAdvertiserType(party.kind==='entrepreneur'?'Индивидуальный предприниматель':'Юридическое лицо');
      setFields(current=>({...current,name:party.shortName||party.name||current.name,kpp:party.kpp||'',ogrn:party.ogrn||'',address:party.kind==='legal'&&party.address?party.address:current.address}));
      setErrors({});
      setRegistryMessage('Данные реестра подставлены. Проверьте их перед сохранением.');
    } catch(error) {setRegistryMessage(error instanceof Error?error.message:'Проверка недоступна');}
    finally {setRegistryBusy(false);}
  };
  const save = async () => {
    const nextErrors:Record<string,string>={};
    if(fields.name.trim().length<2)nextErrors.name='Укажите юридическое название.';
    const isLegal=advertiserType==='Юридическое лицо';
    if(fields.inn.length!==(isLegal?10:12))nextErrors.inn=`ИНН должен состоять из ${isLegal?10:12} цифр.`;
    if(isLegal&&fields.kpp.length!==9)nextErrors.kpp='КПП должен состоять из 9 цифр.';
    if(fields.ogrn.length!==(isLegal?13:15))nextErrors.ogrn=`${isLegal?'ОГРН':'ОГРНИП'} должен состоять из ${isLegal?13:15} цифр.`;
    if(!fields.address.trim())nextErrors.address='Укажите юридический адрес.';
    if(fields.targetUrl && !/^https?:\/\//i.test(fields.targetUrl))nextErrors.targetUrl='Укажите ссылку с http:// или https://.';
    if(fields.executorInn && !/^(\d{10}|\d{12})$/.test(fields.executorInn))nextErrors.executorInn='ИНН первого исполнителя должен состоять из 10 или 12 цифр.';
    if(fields.executorInn && fields.executorInn===fields.inn)nextErrors.executorInn='Исполнитель и рекламодатель должны быть разными участниками.';
    setErrors(nextErrors);if(Object.keys(nextErrors).length)return;
    const payload={name:fields.name,inn:fields.inn,details:{kind:isLegal?'legal':'entrepreneur',kpp:fields.kpp,ogrn:fields.ogrn,address:fields.address,advertisedObject:fields.advertisedObject,targetUrl:fields.targetUrl||undefined,contractType:fields.contractType==='Не указан'?undefined:fields.contractType==='Посреднический договор'?'intermediary':'services',contractNumber:fields.contractNumber,contractDate:fields.contractDate||undefined,executorName:fields.executorName,executorInn:fields.executorInn}};
    const ok = await backend.perform(async () => { await api(advertiser?`/advertisers/${advertiser.id}`:'/advertisers',advertiser?'PATCH':'POST',payload); await backend.refresh(); });
    if(ok) navigate(advertiser?'advertiser_detail':'advertisers');
  };
  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('advertisers')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> {advertiser?'К карточке рекламодателя':'К рекламодателям'}
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">{advertiser?'Редактирование рекламодателя':'Новый рекламодатель'}</h1>
      <p className="text-sm text-[#476788] mt-1">Данные карточки будут переданы площадке вместе с материалом заказа для маркировки.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Тип рекламодателя</span>
          <CustomSelect className="mt-2" value={advertiserType} onChange={value=>{setAdvertiserType(value);setFields(current=>({...current,kpp:value==='Юридическое лицо'?current.kpp:''}));setErrors({});}} options={['Юридическое лицо', 'Индивидуальный предприниматель']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Юридическое название</span>
          <input aria-invalid={Boolean(errors.name)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] ${errors.name?'border-red-500':'border-[#476788]'}`} placeholder="ООО «Название компании»" value={fields.name} onChange={e => {setFields({...fields,name:e.target.value});setErrors({...errors,name:''});}} />{errors.name&&<span className="mt-1 block text-xs text-red-700">{errors.name}</span>}
        </label>
        <div>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ИНН</span>
          <input inputMode="numeric" maxLength={advertiserType==='Юридическое лицо'?10:12} aria-invalid={Boolean(errors.inn)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] ${errors.inn?'border-red-500':'border-[#476788]'}`} placeholder="7700000000" value={fields.inn} onChange={e => {setFields({...fields,inn:e.target.value.replace(/\D/g,'')});setErrors({...errors,inn:''});}} />{errors.inn&&<span className="mt-1 block text-xs text-red-700">{errors.inn}</span>}
        </label>
        <button type="button" className="mt-2 text-sm font-medium text-[#006bff] hover:text-[#0b3558] disabled:opacity-50" disabled={registryBusy||![10,12].includes(fields.inn.length)} onClick={fillFromRegistry}>{registryBusy?'Поиск…':'Заполнить по ИНН'}</button>
        {registryMessage&&<p role="status" className="mt-1 text-xs text-[#476788]">{registryMessage}</p>}
        </div>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">КПП</span>
          <input inputMode="numeric" maxLength={9} disabled={advertiserType!=='Юридическое лицо'} aria-invalid={Boolean(errors.kpp)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] disabled:bg-[#f0f3f8] ${errors.kpp?'border-red-500':'border-[#476788]'}`} placeholder="770001001" value={fields.kpp} onChange={e => {setFields({...fields,kpp:e.target.value.replace(/\D/g,'')});setErrors({...errors,kpp:''});}} />{errors.kpp&&<span className="mt-1 block text-xs text-red-700">{errors.kpp}</span>}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ОГРН / ОГРНИП</span>
          <input inputMode="numeric" maxLength={advertiserType==='Юридическое лицо'?13:15} aria-invalid={Boolean(errors.ogrn)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] ${errors.ogrn?'border-red-500':'border-[#476788]'}`} placeholder="1237700000000" value={fields.ogrn} onChange={e => {setFields({...fields,ogrn:e.target.value.replace(/\D/g,'')});setErrors({...errors,ogrn:''});}} />{errors.ogrn&&<span className="mt-1 block text-xs text-red-700">{errors.ogrn}</span>}
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Юридический адрес</span>
          <AddressInput ariaInvalid={Boolean(errors.address)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] ${errors.address?'border-red-500':'border-[#476788]'}`} placeholder="Индекс, город, улица, дом" value={fields.address} onChange={value => {setFields(current=>({...current,address:value}));setErrors(current=>({...current,address:''}));}} />{errors.address&&<span className="mt-1 block text-xs text-red-700">{errors.address}</span>}
        </label>
      </div>
      <div className="mt-7 border-t border-[#d4e0ed] pt-6">
        <h2 className="font-display text-base font-bold text-[#0b3558]">Данные для маркировки <span className="font-sans text-sm font-normal text-[#476788]">(необязательно)</span></h2>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-[#476788]">Объект рекламирования</span>
            <input aria-invalid={Boolean(errors.advertisedObject)} maxLength={500} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm ${errors.advertisedObject?'border-red-500':'border-[#476788]'}`} placeholder="Бренд, товар или услуга" value={fields.advertisedObject} onChange={e=>{setFields({...fields,advertisedObject:e.target.value});setErrors({...errors,advertisedObject:''});}} />
            {errors.advertisedObject&&<span className="mt-1 block text-xs text-red-700">{errors.advertisedObject}</span>}
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-[#476788]">Целевая ссылка в материале</span>
            <input type="url" aria-invalid={Boolean(errors.targetUrl)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm ${errors.targetUrl?'border-red-500':'border-[#476788]'}`} placeholder="https://" value={fields.targetUrl} onChange={e=>{setFields({...fields,targetUrl:e.target.value});setErrors({...errors,targetUrl:''});}} />
            <span className="mt-1 block text-xs text-[#476788]">Если в публикации есть ссылка на рекламируемый объект.</span>
            {errors.targetUrl&&<span className="mt-1 block text-xs text-red-700">{errors.targetUrl}</span>}
          </label>
        </div>
      </div>
      <div className="mt-7 border-t border-[#d4e0ed] pt-6">
        <h2 className="font-display text-base font-bold text-[#0b3558]">Исходный договор с рекламодателем <span className="font-sans text-sm font-normal text-[#476788]">(необязательно)</span></h2>
        <p className="mt-1 text-sm text-[#476788]">Договор между рекламодателем и первым исполнителем. Если заказчик — агентство, укажите договор агентства с рекламодателем.</p>
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Тип договора</span>
            <CustomSelect className="mt-2" value={fields.contractType} onChange={value=>setFields({...fields,contractType:value})} options={['Не указан','Договор оказания услуг','Посреднический договор']} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Номер договора</span>
            <input maxLength={100} className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-2.5 text-sm" placeholder="Оставьте пустым, если без номера" value={fields.contractNumber} onChange={e=>setFields({...fields,contractNumber:e.target.value})} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Дата договора</span>
            <input type="date" aria-invalid={Boolean(errors.contractDate)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm ${errors.contractDate?'border-red-500':'border-[#476788]'}`} value={fields.contractDate} onChange={e=>{setFields({...fields,contractDate:e.target.value});setErrors({...errors,contractDate:''});}} />
            {errors.contractDate&&<span className="mt-1 block text-xs text-red-700">{errors.contractDate}</span>}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Первый исполнитель по договору</span>
            <input aria-invalid={Boolean(errors.executorName)} maxLength={300} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm ${errors.executorName?'border-red-500':'border-[#476788]'}`} placeholder="Юридическое название агентства или исполнителя" value={fields.executorName} onChange={e=>{setFields({...fields,executorName:e.target.value});setErrors({...errors,executorName:''});}} />
            {errors.executorName&&<span className="mt-1 block text-xs text-red-700">{errors.executorName}</span>}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">ИНН первого исполнителя</span>
            <input inputMode="numeric" maxLength={12} aria-invalid={Boolean(errors.executorInn)} className={`mt-2 w-full rounded-lg border px-4 py-2.5 text-sm ${errors.executorInn?'border-red-500':'border-[#476788]'}`} value={fields.executorInn} onChange={e=>{setFields({...fields,executorInn:e.target.value.replace(/\D/g,'')});setErrors({...errors,executorInn:''});}} />
            {errors.executorInn&&<span className="mt-1 block text-xs text-red-700">{errors.executorInn}</span>}
          </label>
        </div>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        Площадка получит эти сведения вместе с текстом материала. Регистрацию рекламы в ОРД выполняет площадка.
      </div>
      {Object.values(errors).some(Boolean)&&<p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Проверьте поля, отмеченные красным.</p>}
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate(advertiser?'advertiser_detail':'advertisers')}>Отмена</Button>
        <Button variant="primary" disabled={backend.busy} onClick={save}>{advertiser?'Сохранить изменения':'Сохранить рекламодателя'}</Button>
      </div>
    </Card>
  </div>
); };

const PlatformListTable = ({ items, favoritePlatforms, toggleFavoritePlatform, navigate, selectedPlatformIds = [], toggleSelectedPlatform = null, emptyText = 'Площадки не найдены.' }) => (
  <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full table-fixed divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]">
          <tr>
            {toggleSelectedPlatform && <th className="w-[6%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Выбор</th>}
            <th className="w-[23%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Площадка</th>
            <th className="w-[10%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Тип</th>
	            <th className="w-[13%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">
	              <span className="inline-flex items-center gap-1 whitespace-nowrap" title="Для федеральных СМИ показывается общий рейтинг, для региональных и отраслевых — рейтинг по региону или отрасли.">Медиалогия <Info className="w-3.5 h-3.5 flex-shrink-0" /></span>
	            </th>
            <th className="w-[14%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Агрегаторы</th>
            <th className="w-[12%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Охват</th>
            <th className="w-[10%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Цена</th>
            <th className="w-[12%] px-4 py-4 text-right text-xs font-medium text-[#476788] uppercase tracking-wider">Избр.</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#d4e0ed]">
	          {items.length ? items.map((item) => {
	            const isFavorite = favoritePlatforms.includes(item.id);
	            const isSelected = selectedPlatformIds.includes(item.id);
	            const mediologyRank = item.details?.medialogiaRank ?? '—';
	            return (
              <tr key={item.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('platform_detail', item.id)}>
                {toggleSelectedPlatform && (
                  <td className="px-4 py-4 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                    <button
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-[#0b3558] border-[#0b3558]' : 'bg-white border-[#0b3558]'}`}
                      onClick={() => toggleSelectedPlatform(item.id)}
                      aria-label={isSelected ? 'Убрать площадку из массового размещения' : 'Выбрать площадку для массового размещения'}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                  </td>
                )}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${item.logo}`}>
                      {item.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#0b3558] truncate">{item.name}</div>
                      <div className="text-xs text-[#476788] truncate">{item.theme} · {item.region}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap"><Badge color="gray">{item.type}</Badge></td>
	                <td className="px-4 py-4 whitespace-nowrap">
	                  <div className="text-sm font-semibold text-[#0b3558]">#{mediologyRank}</div>
	                  <div className="text-[11px] text-[#476788]" title="Для федеральных СМИ — общий рейтинг; для региональных и отраслевых — рейтинг по региону или отрасли.">{item.region === 'Федеральный охват' ? 'общий' : 'по сегменту'}</div>
	                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.aggregators.map((aggregator) => <Badge key={aggregator} color={aggregator === 'нет' ? 'gray' : 'blue'}>{aggregator}</Badge>)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#476788] truncate">{item.reach}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums text-[#0b3558]">{formatMoney(item.price)}</span>
                    {item.discountActive && <Badge color="green">−{item.discount_bps / 100}%</Badge>}
                  </div>
                  {item.discountActive && item.basePrice > item.price && <div className="mt-1 text-xs tabular-nums text-[#7890aa] line-through">{formatMoney(item.basePrice)}</div>}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <Button
                    variant={isFavorite ? 'primary' : 'secondary'}
                    className={`text-xs px-3 py-2 ${isFavorite ? '' : 'bg-white'}`}
                    onClick={(event) => { event.stopPropagation(); toggleFavoritePlatform(item.id); }}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
                    <span className="sr-only">{isFavorite ? 'В избранном' : 'В избранное'}</span>
                  </Button>
                </td>
              </tr>
            );
          }) : (
            <tr><td className="px-6 py-10 text-sm text-[#476788] text-center" colSpan={toggleSelectedPlatform ? 8 : 7}>{emptyText}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
);

const ClientCatalogView = ({ favoritePlatforms, toggleFavoritePlatform, navigate, materials, projects, onCreateOrders }) => {
  const backend=useBackend();
  const informer=backend.data.informers.find(i=>i.id===new URLSearchParams(location.search).get('informer'));
  const mockCatalog = backend.data.outlets.filter(o=>!informer?.selectionIds?.length||informer.selectionIds.includes(o.id));
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState(() => Number(informer?.packagePrice || 0) > 0 ? [...(informer.selectionIds || [])] : []);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState(undefined);
  const [regionFilter, setRegionFilter] = useState(undefined);
  const [goalFilter, setGoalFilter] = useState(undefined);
  const [formatFilter, setFormatFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [topicFilter, setTopicFilter] = useState(undefined);
  const [priceFilter, setPriceFilter] = useState(undefined);
  const [deadlineFilter, setDeadlineFilter] = useState(undefined);
  const topicOptions = ['Любая тематика', ...new Set(mockCatalog.flatMap((item) => item.details?.topics || []))];
  const getReachValue = (reach) => {
    const normalized = String(reach).replace(',', '.');
    const number = Number(normalized.match(/[\d.]+/)?.[0] || 0);
    if (normalized.includes('млн')) return number * 1000000;
    if (normalized.includes('тыс')) return number * 1000;
    return number;
  };
  const matchesAudience = (item) => {
    if (!audienceFilter || audienceFilter === 'Любая аудитория') return true;
    const reach = getReachValue(item.reach);
    if (audienceFilter === 'До 100 тыс.') return reach < 100000;
    if (audienceFilter === '100 тыс.-1 млн') return reach >= 100000 && reach <= 1000000;
    if (audienceFilter === '1 млн+') return reach > 1000000;
    return true;
  };
  const matchesRegion = (item) => matchesGeographyFilter(item.region, regionFilter);
  const matchesGoal = (item) => !goalFilter || goalFilter === 'Любая цель' || item.goals.includes(goalFilter);
  const matchesFormat = (item) => !formatFilter
    || formatFilter === 'Все форматы'
    || item.formats.includes(formatFilter);
  const matchesType = (item) => !typeFilter || typeFilter === 'Все типы' || item.type === typeFilter;
  const matchesTopic = (item) => !topicFilter || topicFilter === 'Любая тематика' || (item.details?.topics || []).includes(topicFilter);
  const matchesPrice = (item) => {
    if (!priceFilter || priceFilter === 'Любая цена') return true;
    if (priceFilter === 'До 50 000 ₽') return item.price <= 50000;
    if (priceFilter === '50 000-100 000 ₽') return item.price > 50000 && item.price <= 100000;
    return item.price > 100000;
  };
  const matchesDeadline = (item) => {
    if (!deadlineFilter || deadlineFilter === 'Любой срок') return true;
    const selectedFormat=apiFormatByLabel[formatFilter];
    const days = Number((selectedFormat&&item.details?.publicationDaysByFormat?.[selectedFormat]) ?? item.details?.publicationDays ?? parseInt(item.deadline, 10) ?? 0);
    if (deadlineFilter === '1 день') return days === 1;
    if (deadlineFilter === '2-3 дня') return days >= 2 && days <= 3;
    return days > 0 && days <= 7;
  };
  const visiblePlatforms = (showFavoritesOnly ? mockCatalog.filter(item => favoritePlatforms.includes(item.id)) : mockCatalog)
    .filter(matchesType)
    .filter(matchesRegion)
    .filter(matchesGoal)
    .filter(matchesFormat)
    .filter(matchesTopic)
    .filter(matchesPrice)
    .filter(matchesDeadline)
    .filter(matchesAudience);
  const selectedPlatforms = mockCatalog.filter(item => selectedPlatformIds.includes(item.id));
  const selectedStandardTotal = selectedPlatforms.reduce((sum, item) => sum + item.price, 0);
  const packagePlatformIds = (informer?.selectionIds || []).map(String).sort();
  const selectedPlatformIdSet = selectedPlatforms.map((item) => String(item.id)).sort();
  const packageApplies = Number(informer?.packagePrice || 0) > 0
    && packagePlatformIds.length === selectedPlatformIdSet.length
    && packagePlatformIds.every((id, index) => id === selectedPlatformIdSet[index]);
  const selectedTotal = packageApplies ? Number(informer.packagePrice) : selectedStandardTotal;
  const toggleSelectedPlatform = (id) => {
    setSelectedPlatformIds((items) => items.includes(id) ? items.filter((itemId) => itemId !== id) : [...items, id]);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">Каталог площадок</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant={showFavoritesOnly ? 'primary' : 'secondary'} className="w-full sm:w-auto" onClick={() => setShowFavoritesOnly((value) => !value)}>
            <Star className={`w-4 h-4 mr-2 ${showFavoritesOnly ? 'fill-white' : ''}`} />
            Избранные: {favoritePlatforms.length}
          </Button>
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
          >
            <Filter className="h-4 w-4" />
            Фильтры
            <ChevronRight className={`h-4 w-4 transition-transform ${filtersOpen ? '-rotate-90' : 'rotate-90'}`} />
          </Button>
        </div>
      </div>

      <CollapsiblePanel open={filtersOpen}>
        <Card id="catalog-filters" className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <CustomSelect placeholder="Тип площадки" options={['Все типы', 'СМИ', 'ТГ-канал', 'Паблик ВК', 'Канал в MAX', 'Канал в Дзене']} value={typeFilter} onChange={setTypeFilter} />
            <CustomSelect placeholder="Цель размещения" options={['Любая цель', 'Пиар', 'SEO', 'SERM']} value={goalFilter} onChange={setGoalFilter} />
            <CustomSelect placeholder="География" options={regionFilterOptions} value={regionFilter} onChange={setRegionFilter} />
            <CustomSelect placeholder="Тематика" options={topicOptions} value={topicFilter} onChange={setTopicFilter} />
            <CustomSelect placeholder="Цена" options={['Любая цена', 'До 50 000 ₽', '50 000-100 000 ₽', '100 000+ ₽']} value={priceFilter} onChange={setPriceFilter} />
            <CustomSelect placeholder="Срок публикации" options={['Любой срок', '1 день', '2-3 дня', 'До недели']} value={deadlineFilter} onChange={setDeadlineFilter} />
            <CustomSelect placeholder="Формат" options={placementFormatFilterOptions} value={formatFilter} onChange={setFormatFilter} />
            <CustomSelect placeholder="Аудитория" options={['Любая аудитория', 'До 100 тыс.', '100 тыс.-1 млн', '1 млн+']} value={audienceFilter} onChange={setAudienceFilter} />
          </div>
        </Card>
      </CollapsiblePanel>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold text-[#0b3558]">Массовое размещение одного материала</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#476788]">
              Выберите несколько площадок в списке и создайте отдельные заказы для одного текста.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-center xl:grid-cols-[auto_auto_auto]">
            <div className="flex min-h-10 items-center rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-2 text-sm sm:col-span-2 xl:col-span-1">
              <span className="text-[#476788]">Выбрано:</span>
              <span className="ml-2 font-semibold text-[#0b3558]">{selectedPlatforms.length}</span>
              <span className="mx-2 text-[#d4d4d4]">/</span>
              <span className="font-semibold text-[#0b3558] tabular-nums">{formatMoney(selectedTotal)}</span>
            </div>
            <Button variant="secondary" className="w-full whitespace-nowrap sm:w-auto" disabled={!selectedPlatforms.length} onClick={() => setSelectedPlatformIds([])}>
              Сбросить
            </Button>
            <Button variant="primary" className="w-full whitespace-nowrap sm:w-auto" disabled={!selectedPlatforms.length} onClick={() => setBulkModalOpen(true)}>
              Разместить на выбранных
            </Button>
          </div>
        </div>
      </Card>

      <PlatformListTable
        items={visiblePlatforms}
        favoritePlatforms={favoritePlatforms}
        toggleFavoritePlatform={toggleFavoritePlatform}
        selectedPlatformIds={selectedPlatformIds}
        toggleSelectedPlatform={toggleSelectedPlatform}
        navigate={navigate}
        emptyText="В избранном пока нет площадок. Добавьте их из каталога."
      />
      <MaterialSelectionModal
        isOpen={isBulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        platforms={selectedPlatforms}
        materials={materials}
        projects={projects}
        onCreateOrders={onCreateOrders}
        informer={informer}
      />
    </div>
  );
};

const ClientPlatformDetailView = ({ favoritePlatforms = [], toggleFavoritePlatform = undefined, navigate, materials = [], projects = [], onCreateOrders = undefined, ownerControls = undefined, readOnlyFormats = false }) => {
  const backend = useBackend();
  const item = backend.data.outlets.find(o=>o.id===backend.outletId);
  const isFavorite = favoritePlatforms.includes(item?.id);
  const [isMaterialModalOpen, setMaterialModalOpen] = useState(false);
  const placementFormats = (item?.formats || []).map(name=>({name,deadline:item.deadline,basePrice:item.formatPrices[name],price:getPlatformPriceForFormat(item,name)}));
  const cheapestFormatName = placementFormats.reduce((cheapest,current) => !cheapest || current.price < cheapest.price ? current : cheapest, null)?.name;
  const [selectedFormatName, setSelectedFormatName] = useState(cheapestFormatName);
  useEffect(() => setSelectedFormatName(cheapestFormatName), [item?.id, cheapestFormatName]);
  const selectedFormat = placementFormats.find((format) => format.name === selectedFormatName) || placementFormats[0];
  if(!item || !selectedFormat) return <Card className="p-6">Выберите площадку в каталоге.</Card>;
  const relatedOrders=ownerControls?backend.data.orders.filter(order=>order.outlet_id===item.id):[];
  const selectedPlatform = {
    ...item,
    format: selectedFormat.name,
    deadline: selectedFormat.deadline,
    price: selectedFormat.price,
  };
  return (
    <div className="platform-view-enter space-y-6 max-w-6xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('catalog')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> {ownerControls ? 'К площадкам' : 'К каталогу'}
      </button>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="platform-logo-motion flex h-16 w-16 flex-none flex-col items-center justify-center rounded-2xl border border-[#d4e0ed] bg-white shadow-sm" aria-label={`Логотип ${item.name}`}>
              {item.details.logoFileId || item.details.logoUrl ? <img src={item.details.logoFileId?`/api/files/${item.details.logoFileId}/image`:item.details.logoUrl} alt={item.name} className="h-12 w-12 object-contain" /> : <span className="text-lg font-bold text-[#0b3558]">{item.name.slice(0,2)}</span>}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="font-display text-2xl font-bold text-[#0b3558]">{item.name}</h1>
                <div className="flex flex-wrap gap-2">{item.tags.map(tag => <Badge key={tag} color="blue">{tag}</Badge>)}</div>
                {ownerControls&&<Badge color={item.status==='approved'?(item.active?'green':'gray'):'amber'}>{{pending:'На проверке',approved:item.active?'Активна':'На паузе',rejected:'Отклонена'}[item.status]}</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#476788]">
                <span>{item.type} · {item.theme} · {item.region}</span>
                <span className="hidden text-[#9bb6d3] sm:inline">·</span>
                <a className="inline-flex items-center gap-1 font-medium text-[#006cff] hover:underline" href={item.url} target="_blank" rel="noreferrer">
                  {new URL(item.url).hostname} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
        {!ownerControls && <Button variant={isFavorite ? 'primary' : 'secondary'} onClick={() => toggleFavoritePlatform(item.id)}>
          <Star className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-white' : ''}`} /> {isFavorite ? 'В избранном' : 'В избранное'}
        </Button>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="platform-card-motion p-5" style={{ animationDelay: '80ms' }}><div className="text-xs text-[#476788] uppercase">Посещаемость в день</div><div className="mt-2 text-xl font-semibold">{item.details.dailyAudience?.toLocaleString('ru-RU') ?? '—'}</div>{item.details.metrikaUrl && <a className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#006cff] hover:underline" href={item.details.metrikaUrl} target="_blank" rel="noreferrer">Яндекс Метрика <ExternalLink className="h-3 w-3" /></a>}</Card>
        <Card className="platform-card-motion p-5" style={{ animationDelay: '120ms' }}><div className="text-xs text-[#476788] uppercase">Срок публикации</div><div className="mt-2 text-xl font-semibold">{item.deadline}</div></Card>
        <Card className="platform-card-motion p-5" style={{ animationDelay: '160ms' }}><div className="text-xs text-[#476788] uppercase">Хранение</div><div className="mt-2 text-xl font-semibold">{item.storage}</div></Card>
	        <Card className="platform-card-motion p-5" style={{ animationDelay: '200ms' }}><div className="text-xs text-[#476788] uppercase flex items-center gap-1">Медиалогия <Info className="w-3.5 h-3.5" /></div><div className="mt-2 text-xl font-semibold">{item.details.medialogiaRank ?? '—'}</div><div className="text-xs text-[#476788] mt-1">{item.region}</div></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <Card className="platform-section-motion overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[#d4e0ed] bg-[#f8f9fb] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-[#0b3558]">Форматы и цены</h2>
                {item.discount_bps > 0 && <p className="mt-1 text-xs text-[#476788]">Скидка {item.discount_bps / 100}% до {String(item.discount_until).slice(0,10)}</p>}
              </div>
              <Badge color="green">Коэффициент сезона ×{item.coefficient_bps / 10000}</Badge>
            </div>
            <div className="divide-y divide-[#d4e0ed]">
              {placementFormats.map((format) => {
                const selected = selectedFormatName === format.name;
                const content=<>
                  <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-semibold text-[#0b3558]">
                    {!readOnlyFormats&&<span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-[#006cff] bg-[#006cff] text-white' : 'border-[#9bb6d3] bg-white'}`}>{selected&&<Check className="h-3.5 w-3.5" />}</span>}
                    {format.name}
                  </span><span className={`mt-1 block text-xs text-[#476788] ${readOnlyFormats?'':'pl-7'}`}>Публикация {format.deadline}</span></span>
                  <span className="text-right">{format.basePrice!==format.price&&<span className="block text-xs text-[#7890aa] line-through">{formatMoney(format.basePrice)}</span>}<span className="mt-0.5 block text-base font-semibold text-[#0b3558]">{formatMoney(format.price)}</span></span>
                </>;
                if(readOnlyFormats)return <div key={format.name} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 bg-white px-6 py-3.5">{content}</div>;
                return (
                  <button
                    key={format.name}
                    type="button"
                    className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3.5 text-left transition-colors hover:bg-[#f8f9fb] focus:outline-none focus-visible:bg-[#eef5ff] ${selected ? 'bg-[#f3f7fd] shadow-[inset_3px_0_0_#006cff]' : 'bg-white'}`}
                    onClick={() => setSelectedFormatName(format.name)}
                    aria-pressed={selected}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="platform-section-motion p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558]">Требования</h2>
            <p className="mt-3 text-sm leading-6 text-[#476788]">
              {item.details.requirements || 'Не указаны'}
            </p>
            <div className="mt-5 grid gap-5 border-t border-[#d4e0ed] pt-5 sm:grid-cols-2 sm:gap-0">
              <div className="flex min-w-0 items-center gap-3 sm:pr-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#006cff]">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase leading-none text-[#6f88a3]">Подходит для целей</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.goals.map((goal) => (
                      <span key={goal} className="rounded-full bg-[#e7f1ff] px-3 py-1 text-sm font-semibold text-[#075cc8]">{goal}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 border-t border-[#d4e0ed] pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ebf8f1] text-[#16834d]">
                  <Newspaper className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase leading-none text-[#6f88a3]">Новостные агрегаторы</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.aggregators.map((aggregator) => (
                      <span key={aggregator} className="rounded-full bg-[#ebf8f1] px-3 py-1 text-sm font-semibold text-[#146b43]">{aggregator}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        {ownerControls || <Card className="platform-section-motion self-start overflow-hidden">
          <div className="border-b border-[#d4e0ed] px-6 py-4">
            <h2 className="font-display text-base font-bold text-[#0b3558]">Размещение</h2>
          </div>
          <div className="p-6">
            <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-[#476788]">Выбранный формат</div>
                  <div className="mt-1 text-sm font-semibold text-[#0b3558]">{selectedFormat.name}</div>
                </div>
                <div className="shrink-0 text-base font-semibold text-[#0b3558]">{formatMoney(selectedFormat.price)}</div>
              </div>
              <div className="mt-2 text-xs text-[#476788]">Публикация {selectedFormat.deadline}. Скидка учтена.</div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#476788]">
              Выберите готовый материал. После создания заказа сумма размещения будет заморожена на балансе.
            </p>
            <Button variant="primary" className="mt-4 w-full" onClick={() => setMaterialModalOpen(true)}>Разместить материал</Button>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => navigate('catalog')}>К каталогу</Button>
          </div>
        </Card>}
      </div>
      {ownerControls&&<Card className="platform-section-motion overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-lg font-bold text-[#0b3558]">Публикации на площадке</h2><p className="mt-1 text-sm text-[#476788]">Заказы и размещения, связанные с {item.name}</p></div><Badge color="blue">{relatedOrders.length} {relatedOrders.length===1?'заказ':'заказов'}</Badge></div>
        {relatedOrders.length?<div className="overflow-x-auto"><table className="w-full min-w-[720px] divide-y divide-[#d4e0ed]"><thead className="bg-[#f8f9fb]"><tr>{['Заказ','Материал','Формат','Дата','Статус'].map(head=><th key={head} className="px-6 py-3 text-left text-xs font-medium uppercase text-[#476788]">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#d4e0ed]">{relatedOrders.map(order=><tr key={order.id}><td className="px-6 py-4 text-sm font-semibold text-[#006bff]">№{orderNumber(order)}</td><td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{order.material}</td><td className="px-6 py-4 text-sm text-[#476788]">{{article:'Статья',news:'Новость',post:'Пост',longread:'Лонгрид'}[order.snapshot?.format]||order.snapshot?.format}</td><td className="px-6 py-4 text-sm text-[#476788]">{order.date}</td><td className="px-6 py-4"><Badge color={order.statusColor}>{order.status}</Badge></td></tr>)}</tbody></table></div>:<p className="px-6 py-8 text-sm text-[#476788]">Связанных заказов пока нет.</p>}
      </Card>}
      {!ownerControls && <MaterialSelectionModal isOpen={isMaterialModalOpen} onClose={() => setMaterialModalOpen(false)} platform={selectedPlatform} materials={materials} projects={projects} onCreateOrders={onCreateOrders} />}
    </div>
  );
};

const ClientReportsView = ({ projects, reports, openProject, onOpenReport, onCreateProjectReport }) => {
  const [projectFilter, setProjectFilter] = useState('Все проекты');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportProject, setReportProject] = useState(projects[0]?.name || '');
  const [periodPreset, setPeriodPreset] = useState('Текущий месяц');
  const today = new Date();
  const isoDate = (value) => value.toISOString().slice(0,10);
  const [dateFrom, setDateFrom] = useState(isoDate(new Date(today.getFullYear(),today.getMonth(),1)));
  const [dateTo, setDateTo] = useState(isoDate(new Date(today.getFullYear(),today.getMonth()+1,0)));
  const visibleReports = reports.filter((report) => {
    if (projectFilter === 'Все проекты') return true;
    if (projectFilter === 'Без проекта') return !report.projectId;
    return projects.find((project) => project.id === report.projectId)?.name === projectFilter;
  });
  const selectedProject = projects.find((project) => project.name === projectFilter);
  const exportPath = selectedProject ? `/reports/export.csv?projectId=${encodeURIComponent(selectedProject.id)}` : '/reports/export.csv';
  const applyPeriodPreset = (preset) => {
    setPeriodPreset(preset);
    const periods = {
      'Последние 7 дней': [isoDate(new Date(today.getFullYear(),today.getMonth(),today.getDate()-6)),isoDate(today)],
      'Последние 30 дней': [isoDate(new Date(today.getFullYear(),today.getMonth(),today.getDate()-29)),isoDate(today)],
      'Текущий месяц': [isoDate(new Date(today.getFullYear(),today.getMonth(),1)),isoDate(new Date(today.getFullYear(),today.getMonth()+1,0))],
      'Прошлый месяц': [isoDate(new Date(today.getFullYear(),today.getMonth()-1,1)),isoDate(new Date(today.getFullYear(),today.getMonth(),0))],
      'За все время': ['2000-01-01',isoDate(today)],
    };
    const nextPeriod = periods[preset];
    if (nextPeriod) {
      setDateFrom(nextPeriod[0]);
      setDateTo(nextPeriod[1]);
    }
  };
  const createProjectReport = async () => {
    const project = projects.find((item) => item.name === reportProject);
    if (!project || !dateFrom || !dateTo || dateFrom > dateTo) return;
    const ok=await onCreateProjectReport({
      projectId: project.id,
      from: dateFrom,
      to: dateTo,
      label: periodPreset,
    });
    if(ok)setReportOpen(false);
  };

  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Отчеты</h1>
        <p className="mt-1 text-sm text-[#476788]">Размещения и сводные отчеты по проектам</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => downloadFromApi(exportPath)}><Download className="h-4 w-4" /> Скачать таблицу</Button>
        <Button variant="primary" onClick={() => {
          setReportProject(selectedProject?.name || projects[0]?.name || '');
          setReportOpen(true);
        }}><CalendarDays className="h-4 w-4" /> Отчет по проекту</Button>
      </div>
    </div>
    <Card className="p-4">
      <div className="max-w-sm">
        <CustomSelect value={projectFilter} onChange={setProjectFilter} placeholder="Проект" options={['Все проекты', ...projects.map((project) => project.name), 'Без проекта']} />
      </div>
    </Card>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Заказ</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Материал</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Площадка / дата</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Ссылка</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {visibleReports.map(row => (
            <tr key={row.order} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => onOpenReport(row)}>
              <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{row.order}</td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-[#0b3558]">{row.material}</div>
                <div className="mt-1"><ProjectLink project={projects.find((project) => project.id === row.projectId)} onOpen={openProject} /></div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-[#0b3558]">{row.platform}</div>
                <div className="mt-1 text-xs tabular-nums text-[#476788]">{row.date || 'Дата не указана'}</div>
              </td>
              <td className="max-w-[260px] px-6 py-4 text-sm text-[#006bff]"><div className="truncate">{row.link || 'Ожидается'}</div></td>
              <td className="px-6 py-4"><Badge color={row.color}>{row.status}</Badge></td>
            </tr>
          ))}
          {!visibleReports.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[#476788]">Размещений по выбранному проекту пока нет.</td></tr>}
        </tbody>
      </table>
      </div>
    </Card>

    <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Отчет по проекту" className="max-w-2xl">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-[#476788]">Проект</label>
          <CustomSelect className="mt-2" value={reportProject} onChange={setReportProject} options={projects.map((project) => project.name)} />
        </div>
        <div>
          <div className="text-sm font-medium text-[#476788]">Период отчета</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['Последние 7 дней', 'Последние 30 дней', 'Текущий месяц', 'Прошлый месяц', 'За все время'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPeriodPreset(preset)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${periodPreset === preset ? 'border-[#006bff] bg-[#e6f0ff] text-[#004eba]' : 'border-[#d4e0ed] bg-white text-[#476788] hover:border-[#8badcf]'}`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Дата начала</span>
            <div className="relative mt-2">
              <input type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPeriodPreset('Произвольный период'); }} className="min-h-[44px] w-full rounded-lg border border-[#476788] bg-white px-4 py-2.5 pr-10 text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476788]" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Дата окончания</span>
            <div className="relative mt-2">
              <input type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPeriodPreset('Произвольный период'); }} className="min-h-[44px] w-full rounded-lg border border-[#476788] bg-white px-4 py-2.5 pr-10 text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]" />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#476788]" />
            </div>
          </label>
        </div>
        {dateFrom && dateTo && dateFrom > dateTo && <ActionResult tone="error" text="Дата начала не может быть позже даты окончания." />}
        <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm leading-6 text-[#476788]">
          В отчет войдут сводка проекта, публикации за выбранный период, площадки, даты, ссылки, полные тексты и изображения материалов.
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setReportOpen(false)}>Отмена</Button>
          <Button variant="primary" disabled={!reportProject || !dateFrom || !dateTo || dateFrom > dateTo} onClick={createProjectReport}>Сформировать отчет</Button>
        </div>
      </div>
    </Modal>
  </div>
  );
};

const ClientSupportView = ({ navigate, role = 'client' }) => {
  const isPublisher = role === 'publisher';
  const [tab, setTab] = useState('tickets');
  const tickets = isPublisher
    ? [
        ['T-221', 'Вопрос по заказу #1045', 'Открыт', 'blue'],
        ['T-214', 'Выплата за октябрь', 'В работе', 'amber'],
        ['T-207', 'Настройки площадки', 'Закрыт', 'gray'],
      ]
    : [
        ['T-184', 'Вопрос по заказу #1045', 'Открыт', 'blue'],
        ['T-173', 'Документы за сентябрь', 'В работе', 'amber'],
        ['T-169', 'Пополнение баланса', 'Закрыт', 'gray'],
      ];
  const disputes = isPublisher
    ? [
        ['#C-020', 'Заказ #1045 · РБК Инвестиции', 'на рассмотрении', 'amber'],
        ['#C-017', 'Заказ #1038 · Технологии сегодня', 'решен', 'green'],
      ]
    : [
        ['#C-020', 'Заказ #1045 · РБК Инвестиции', 'на рассмотрении', 'amber'],
        ['#C-018', 'Заказ #1052 · VC.ru', 'решен', 'green'],
      ];
  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Поддержка</h1>
      <div className="flex rounded-lg border border-[#d4e0ed] bg-white p-1">
        {[
          ['tickets', 'Тикеты'],
          ['disputes', 'Жалобы и споры'],
        ].map(([id, label]) => (
          <button key={id} className={`px-4 py-2 rounded-md text-sm font-semibold ${tab === id ? 'bg-[#0b3558] text-white' : 'text-[#476788]'}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
    </div>

    {tab === 'tickets' ? (
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-[#d4e0ed] bg-[#f8f9fb] font-semibold text-[#0b3558]">Список тикетов</div>
          {tickets.map(([id, title, status, color]) => (
            <button key={id} className="w-full text-left px-5 py-4 border-b border-[#d4e0ed] hover:bg-[#f8f9fb]">
              <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[#0b3558]">{id}</span><Badge color={color}>{status}</Badge></div>
              <div className="text-sm text-[#476788] mt-1">{title}</div>
            </button>
          ))}
          <div className="p-5"><Button variant="primary" className="w-full">Создать тикет</Button></div>
        </Card>
        <Card className="flex flex-col min-h-[620px]">
          <div className="px-6 py-4 border-b border-[#d4e0ed] bg-[#f8f9fb]">
            <div className="font-semibold text-[#0b3558]">T-184 · Вопрос по заказу #1045</div>
            <div className="text-xs text-[#476788] mt-1">Менеджер: Операции Аксиомы · SLA 4 часа</div>
          </div>
          <div className="flex-1 p-6 space-y-4">
            <div className="max-w-[75%] rounded-2xl bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#0b3558]">
              {isPublisher ? 'Нужно уточнить, почему заказ не перешел в оплату после загрузки ссылки.' : 'Нужно уточнить, когда площадка загрузит ссылку на публикацию.'}
            </div>
            <div className="max-w-[75%] ml-auto rounded-2xl bg-[#e6f0ff] border border-[#cfe0ff] p-4 text-sm text-[#0b3558]">
              {isPublisher ? 'Менеджер проверяет приемку заказа. Ответ будет в течение рабочего дня.' : 'Менеджер запросил подтверждение у площадки. Ответ ожидается сегодня до 18:00.'}
            </div>
          </div>
          <div className="p-4 border-t border-[#d4e0ed]">
            <textarea className="w-full min-h-[100px] border border-[#476788] rounded-lg px-4 py-3 text-sm" placeholder="Напишите сообщение менеджеру" />
            <div className="mt-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <FileUploadField
                compact
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                hint=""
              />
              <Button variant="primary">Отправить</Button>
            </div>
          </div>
        </Card>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-[#0b3558] mb-4">Жалобы и споры</h2>
          {disputes.map(([id, title, status, color]) => (
            <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-[#d4e0ed]">
              <div>
                <div className="text-sm font-semibold text-[#0b3558]">{id} · {title}</div>
                <div className="text-xs text-[#476788] mt-1">Доказательства, переписка и решение модератора</div>
              </div>
              <div className="flex items-center gap-3"><Badge color={color}>{status}</Badge><Button variant="secondary" onClick={() => navigate(isPublisher ? 'pub_dispute_detail' : 'dispute_detail')}>Открыть</Button></div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558]">{isPublisher ? 'Ответ по спору' : 'Новая жалоба'}</h3>
          <p className="text-sm text-[#476788] mt-2">{isPublisher ? 'Ответ и доказательства отправляются со страницы спора, чтобы сохранить связь с заказом и выплатой.' : 'Жалоба открывается из карточки заказа, чтобы сохранить связь с публикацией, деньгами и доказательствами.'}</p>
          <Button variant="primary" className="w-full mt-5" onClick={() => navigate(isPublisher ? 'pub_orders' : 'orders')}>Перейти к заказам</Button>
        </Card>
      </div>
    )}
  </div>
  );
};


// --- 3. КАБИНЕТ ПЛОЩАДКИ ---

const publisherOrderStatus = (order) => order.apiStatus === 'pending' ? 'Новая заявка' : order.status;
const publisherOrderAction = (order) => ({
  pending: 'принять или отклонить',
  accepted: 'загрузить ссылку',
  submitted: 'дождаться приемки',
  disputed: 'ответить на спор',
})[order.apiStatus] || 'действий нет';

const PublisherDashboardView = ({ navigate, onOpenOrder }) => {
  const backend = useBackend();
  const orders = backend.data.orders;
  const currentOrders = orders
    .filter((order) => !['completed', 'rejected', 'refunded'].includes(order.apiStatus))
    .map((order) => {
      const isNew = order.apiStatus === 'pending';
      const isDispute = order.apiStatus === 'disputed';
      const isAcceptance = order.apiStatus === 'submitted';

      return {
        ...order,
        deadline: isNew
          ? 'ожидает решения'
          : isDispute
            ? 'до решения спора'
            : isAcceptance
              ? 'ожидаем заказчика'
              : 'срок не зафиксирован',
        nextAction: isNew
          ? 'Принять или отклонить'
          : isDispute
            ? 'Предоставить доказательства'
            : isAcceptance
              ? 'Дождаться приемки'
              : 'Загрузить ссылку',
        priority: isNew ? 0 : isDispute ? 1 : isAcceptance ? 3 : 2,
        format: formatLabels[order.snapshot?.format] ?? order.snapshot?.format ?? 'Материал',
      };
    })
    .sort((left, right) => left.priority - right.priority);

  const summary = [
    ['Новые заявки', String(orders.filter((order) => order.apiStatus === 'pending').length), 'Нужно решение редакции'],
    ['В работе', String(orders.filter((order) => order.apiStatus === 'accepted').length), 'Заказы приняты'],
    ['На приемке', String(orders.filter((order) => order.apiStatus === 'submitted').length), 'Ожидают заказчика'],
    ['Завершено', String(orders.filter((order) => order.apiStatus === 'completed').length), 'Приняты и оплачены'],
  ];

  const finance = [
    ['Доступно к выводу', formatMoney(backend.data.balance.available / 100)],
    ['Ожидает приемки', formatMoney(orders.filter((order) => order.apiStatus === 'submitted').reduce((sum, order) => sum + Number(order.payout) / 100, 0))],
    ['В работе', formatMoney(orders.filter((order) => order.apiStatus === 'accepted').reduce((sum, order) => sum + Number(order.payout) / 100, 0))],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">Панель паблишера</h1>
          <p className="mt-1 text-sm text-[#476788]">Заказы, ближайшие сроки и выплаты.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('pub_orders')}>Все заказы</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-[#d4e0ed] xl:grid-cols-4">
          {summary.map(([label, value, note]) => (
            <button
              key={label}
              className="min-h-[128px] bg-white p-5 text-left transition-colors hover:bg-[#f8fbff] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#006bff]"
              onClick={() => navigate('pub_orders',{order_status:label})}
            >
              <div className="text-sm font-medium text-[#476788]">{label}</div>
              <div className="mt-2 font-display text-3xl font-bold text-[#0b3558] tabular-nums">{value}</div>
              <div className="mt-2 text-xs text-[#476788]">{note}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0b3558]">Текущие заказы</h2>
            <p className="mt-1 text-sm text-[#476788]">Сначала показаны заказы, по которым нужно принять решение.</p>
          </div>
          <button
            className="inline-flex items-center self-start text-sm font-semibold text-[#006bff] hover:text-[#004eba] sm:self-auto"
            onClick={() => navigate('pub_orders')}
          >
            Все заказы
            <ChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed divide-y divide-[#d4e0ed]">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[31%]" />
              <col className="w-[18%]" />
              <col className="w-[19%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-[#f8f9fb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#476788]">Заказ</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#476788]">Материал</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#476788]">Срок</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#476788]">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#476788]">Следующий шаг</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4e0ed] bg-white">
              {currentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer transition-colors hover:bg-[#f8f9fb]"
                  onClick={() => onOpenOrder(order)}
                >
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-semibold text-[#0b3558]">№{orderNumber(order)}</div>
                    <div className="mt-1 text-xs text-[#476788] tabular-nums">{order.date}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="line-clamp-2 text-sm font-medium leading-5 text-[#0b3558]">{order.material}</div>
                    <div className="mt-1 text-xs text-[#476788]">{order.format}</div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-[#476788]">{order.deadline}</td>
                  <td className="px-6 py-4 align-top"><Badge color={order.statusColor}>{publisherOrderStatus(order)}</Badge></td>
                  <td className="px-6 py-4 align-top">
                    <span className="inline-flex items-center text-sm font-semibold text-[#006bff]">
                      {order.nextAction}
                      <ChevronRight className="ml-1 h-4 w-4 shrink-0" />
                    </span>
                  </td>
                </tr>
              ))}
              {!currentOrders.length && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-[#476788]">Текущих заказов пока нет.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid gap-px bg-[#d4e0ed] lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          {finance.map(([label, value]) => (
            <div key={label} className="bg-white p-5">
              <div className="text-sm text-[#476788]">{label}</div>
              <div className="mt-2 text-xl font-semibold text-[#0b3558] tabular-nums">{value}</div>
            </div>
          ))}
          <div className="flex items-center bg-white p-5">
            <Button variant="secondary" className="w-full whitespace-nowrap" onClick={() => navigate('pub_finance')}>
              Открыть выплаты
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const PublisherOrdersView = ({ navigate, onOpenOrder }) => {
  const orders = useBackend().data.orders;
  const [query,setQuery]=useState('');
  const [statusFilter,setStatusFilter]=useState(()=>new URLSearchParams(location.search).get('order_status')||undefined);
  useEffect(()=>{
    const restore=()=>setStatusFilter(new URLSearchParams(location.search).get('order_status')||undefined);
    window.addEventListener('popstate',restore);
    return()=>window.removeEventListener('popstate',restore);
  },[]);
  const [platformFilter,setPlatformFilter]=useState(undefined);
  const [deadlineFilter,setDeadlineFilter]=useState(undefined);
  const now=new Date();
  const startOfToday=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const endOfToday=new Date(startOfToday);endOfToday.setDate(endOfToday.getDate()+1);
  const endOfWeek=new Date(startOfToday);endOfWeek.setDate(endOfWeek.getDate()+7);
  const statusMatches=(order)=>{
    if(!statusFilter||statusFilter==='Все заказы')return true;
    if(statusFilter==='Новые заявки')return order.apiStatus==='pending';
    if(statusFilter==='В работе')return order.apiStatus==='accepted';
    if(statusFilter==='Ждут публикации')return order.apiStatus==='accepted';
    if(statusFilter==='На приемке')return order.apiStatus==='submitted';
    if(statusFilter==='Завершено')return order.apiStatus==='completed';
    return order.apiStatus==='disputed';
  };
  const deadlineMatches=(order)=>{
    if(!deadlineFilter||deadlineFilter==='Любой дедлайн')return true;
    if(!order.deadlineAt)return false;
    const deadline=new Date(order.deadlineAt);
    if(deadlineFilter==='Сегодня')return deadline>=startOfToday&&deadline<endOfToday;
    if(deadlineFilter==='Просрочено')return deadline<now;
    return deadline>=now&&deadline<endOfWeek;
  };
  const mockOrdersPublisher=orders
    .filter(statusMatches)
    .filter(order=>!platformFilter||platformFilter==='Все площадки'||order.platform===platformFilter)
    .filter(deadlineMatches)
    .filter(o=>`${o.number} ${o.material} ${o.platform}`.toLowerCase().includes(query.trim().replace(/^[№#]\s*/, '').toLowerCase()));
  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Ваши заказы</h1>
        <p className="text-sm text-[#476788] mt-1">Список рабочих заказов с быстрым фильтром по текущему статусу.</p>
      </div>
    </div>
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CustomSelect placeholder="Статус заказа" options={['Все заказы', 'Новые заявки', 'В работе', 'Ждут публикации', 'На приемке', 'Завершено', 'С жалобой']} value={statusFilter} onChange={(value)=>{setStatusFilter(value);const url=new URL(location.href);if(value&&value!=='Все заказы')url.searchParams.set('order_status',value);else url.searchParams.delete('order_status');history.replaceState(null,'',url);}} />
        <CustomSelect placeholder="Площадка" options={['Все площадки', ...new Set(orders.map((order)=>order.platform))]} value={platformFilter} onChange={setPlatformFilter} />
        <CustomSelect placeholder="Дедлайн" options={['Любой дедлайн', 'Сегодня', 'Просрочено', 'На неделе']} value={deadlineFilter} onChange={setDeadlineFilter} />
        <input className="border border-[#476788] rounded-lg px-3 py-2 text-sm" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по номеру или материалу" />
      </div>
    </Card>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed divide-y divide-[#d4e0ed]">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[46%]" />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-[#f8f9fb]">
            <tr>
              {['Заказ', 'Материал', 'Статус', 'Что требуется'].map((head) => (
                <th key={head} className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase whitespace-nowrap">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d4e0ed]">
            {mockOrdersPublisher.map((order, index) => (
              <tr
                key={order.id}
                className="hover:bg-[#f8f9fb] cursor-pointer"
                onClick={() => onOpenOrder(order)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#0b3558]">№{orderNumber(order)}</div>
                  <div className="text-xs text-[#476788] mt-1 tabular-nums">{order.date}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#0b3558] font-medium truncate">{order.material}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color={order.statusColor}>{publisherOrderStatus(order)}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-[#476788]">
                  {publisherOrderAction(order)}
                </td>
              </tr>
            ))}
            {!mockOrdersPublisher.length && <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-[#476788]">Заказов по выбранным условиям нет.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
); };

const PublisherOrderDetailView = ({ navigate, state = 'publication', sourceOrder = null }) => {
  const backend = useBackend();
  const [publicationUrl,setPublicationUrl] = useState('');
  const [markingConfirmed,setMarkingConfirmed] = useState(false);
  const [reason,setReason] = useState('');
  const act = (action) => backend.perform(async () => {
    if (!sourceOrder) throw new Error('Заказ не выбран');
    await api(`/orders/${sourceOrder.id}/action`,'POST',{action,...(action==='publish'?{url:publicationUrl,markingConfirmed}:{}),...(action==='reject'?{reason}:{})},crypto.randomUUID());await backend.refresh();
  });
  const [publicationPanelOpen, setPublicationPanelOpen] = useState(false);
  const [rejectionPanelOpen, setRejectionPanelOpen] = useState(false);
  const [markingDataOpen, setMarkingDataOpen] = useState(false);
  const isAcceptanceState = sourceOrder ? ['submitted','completed','disputed'].includes(sourceOrder.apiStatus) : state === 'acceptance';
  const isNewState = sourceOrder ? sourceOrder.apiStatus === 'pending' : state === 'new';
  const isPublishable = sourceOrder ? sourceOrder.apiStatus === 'accepted' : !isNewState && !isAcceptanceState;
  const isClosed = sourceOrder && ['completed','rejected','refunded'].includes(sourceOrder.apiStatus);
  const isDisputed = sourceOrder?.apiStatus === 'disputed';
  const order = sourceOrder ? {...sourceOrder,status:publisherOrderStatus(sourceOrder),title:sourceOrder.material,amount:sourceOrder.payout/100,format:({article:'Статья',news:'Новость',post:'Пост',longread:'Лонгрид'})[sourceOrder.snapshot.format],subtitle:sourceOrder.platform} : isNewState
    ? {
        id: 1048,
        status: 'Новая заявка',
        statusColor: 'blue',
        subtitle: 'ответ до 18:00 сегодня',
        amount: 85000,
        title: 'Анонс вебинара по инвестициям',
        format: 'Новость',
      }
    : {
        id: 1045,
        status: isAcceptanceState ? 'Ожидает приемки' : 'Ожидает публикации',
        statusColor: isAcceptanceState ? 'indigo' : 'amber',
        subtitle: isAcceptanceState ? 'ссылка отправлена 18.10.2023' : 'публикация до 20.10.2023',
        amount: 127500,
        title: 'Пресс-релиз: Запуск новой платформы',
        format: 'Статья',
      };

  return (
  <div className="space-y-6 max-w-5xl mx-auto" data-order-state={sourceOrder?.apiStatus || state}>
    <div className="flex items-center gap-2 text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('pub_orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
    </div>

    <div className="flex flex-col gap-5 border-b border-[#d4e0ed] pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={order.statusColor}>{order.status}</Badge>
          <span className="text-sm text-[#476788]">Заказ №{orderNumber(order)}</span>
        </div>
        <h1 className="mt-3 max-w-4xl break-words font-display text-3xl font-bold leading-tight text-[#0b3558]">
          {order.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#476788]">
          <span>{order.format}</span>
          <span aria-hidden="true">·</span>
          <span>{order.subtitle}</span>
        </div>
      </div>
      <div className="shrink-0 text-left sm:text-right">
        <div className="text-sm text-[#476788]">К начислению</div>
        <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(order.amount)}</div>
      </div>
    </div>

    <div className="bg-white border border-[#d4e0ed] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-12 h-12 bg-[#f8f9fb] rounded-full flex items-center justify-center border border-[#d4e0ed] flex-shrink-0">
          {isAcceptanceState
            ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            : isNewState
              ? <AlertCircle className="w-6 h-6 text-[#006bff]" />
              : <Clock className="w-6 h-6 text-[#006bff]" />}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#0b3558]">
            {isClosed ? order.status : isDisputed ? 'Открыт спор' : isAcceptanceState ? 'Публикация отправлена на приемку' : isNewState ? 'Заказ еще не принят' : 'Заказ принят в работу'}
          </h3>
          <p className="text-sm text-[#476788] mt-1 mb-5">
            {isClosed ? 'Работа по заказу завершена.' : isDisputed ? 'Средства зарезервированы до решения администратора.' : isAcceptanceState
              ? 'Заказчик получил ссылку на публикацию. Начисление станет доступно после приемки публикации или после решения модератора, если будет открыт спор.'
              : isNewState
                ? 'Проверьте материал, юридические данные рекламодателя и требования к публикации. После принятия заказа станет доступна отправка ссылки на публикацию.'
                : 'Проверьте материал, юридические данные рекламодателя и требования к публикации. После размещения отправьте ссылку и подтверждение маркировки заказчику.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {isNewState && (
              <>
                <Button variant="primary" disabled={backend.busy} onClick={() => act('accept')}>Принять заказ</Button>
                <Button variant="secondary" onClick={() => setRejectionPanelOpen((value) => !value)}>
                  {rejectionPanelOpen ? 'Скрыть форму отказа' : 'Отказать'}
                </Button>
              </>
            )}
            {isPublishable && (
              <>
                <Button variant="primary" onClick={() => {
                  setPublicationPanelOpen((value) => !value);
                }}>
                  {publicationPanelOpen ? 'Скрыть форму' : 'Отправить ссылку'}
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => navigate('pub_order_chat')}>
              Чат заказа
            </Button>
          </div>
          {isAcceptanceState && (
            <div className="mt-6 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-5">
              <h4 className="text-base font-semibold text-[#0b3558]">Отправленная публикация</h4>
              <div className="mt-4 rounded-lg border border-[#d4e0ed] bg-white p-4">
                <div className="text-xs text-[#476788]">Ссылка на публикацию</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <a className="text-sm font-medium text-[#006bff] break-all" href={sourceOrder?.publication_url}>{sourceOrder?.publication_url}</a>
                  <CopyButton value={sourceOrder?.publication_url || ''} label="Скопировать ссылку" />
                </div>
              </div>
              <label className="mt-4 flex items-start gap-3 rounded-lg border border-[#d4e0ed] bg-white p-4">
                <input type="checkbox" checked readOnly className="mt-1 h-4 w-4 rounded border-[#476788] text-[#006bff]" />
                <span className="text-sm leading-6 text-[#0b3558]">
                  Площадка подтвердила, что опубликованный материал содержит обязательную пометку о рекламе, идентификатор рекламы (ERID) получен через оператора рекламных данных, сведения о рекламе переданы в ЕРИР в установленном порядке, а ERID размещен в публикации.
                </span>
              </label>
            </div>
          )}
          {isPublishable && (
            <CollapsiblePanel open={publicationPanelOpen}>
            <div className="mt-6 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-5">
              <div className="mb-5">
                <div>
                  <h4 className="text-base font-semibold text-[#0b3558]">Ссылка на публикацию</h4>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#476788]">Ссылка на публикацию</span>
                  <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" value={publicationUrl} onChange={e => setPublicationUrl(e.target.value)} />
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-[#d4e0ed] bg-white p-4">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#476788] text-[#006bff]" checked={markingConfirmed} onChange={e => setMarkingConfirmed(e.target.checked)} />
                  <span className="text-sm leading-6 text-[#0b3558]">
                    Подтверждаю, что опубликованный материал содержит обязательную пометку о рекламе, идентификатор рекламы (ERID) получен через оператора рекламных данных, сведения о рекламе переданы в ЕРИР в установленном порядке, а ERID размещен в публикации.
                  </span>
                </label>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={() => setPublicationPanelOpen(false)}>Отмена</Button>
                <Button variant="primary" disabled={backend.busy || !markingConfirmed || !publicationUrl} onClick={() => act('publish')}>Отправить на приемку</Button>
              </div>
            </div>
            </CollapsiblePanel>
          )}
          {isNewState && (
            <CollapsiblePanel open={rejectionPanelOpen}>
              <div className="mt-6 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-5">
                <h4 className="text-base font-semibold text-[#0b3558]">Отказ от заказа</h4>
                <p className="mt-1 text-sm text-[#476788]">Объяснение увидит заказчик в карточке заказа.</p>
                <label className="mt-5 block">
                  <span className="text-sm font-medium text-[#476788]">Причина отказа</span>
                  <textarea
                    className="mt-2 w-full min-h-[130px] resize-y border border-[#476788] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]"
                    placeholder="Укажите, почему редакция не может принять заказ, и при необходимости предложите другие сроки или условия."
                    value={reason} onChange={e => setReason(e.target.value)}
                  />
                </label>
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <Button variant="secondary" onClick={() => setRejectionPanelOpen(false)}>Отмена</Button>
                  <Button variant="primary" disabled={backend.busy || !reason.trim()} onClick={() => act('reject')}>Отправить отказ</Button>
                </div>
              </div>
            </CollapsiblePanel>
          )}
        </div>
      </div>
    </div>

    <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="overflow-hidden bg-[#f8f9fb]">
            <button
              className={`flex w-full items-center justify-between gap-3 px-6 py-5 text-left ${markingDataOpen ? 'border-b border-[#d4e0ed]' : ''}`}
              onClick={() => setMarkingDataOpen((value) => !value)}
            >
              <div>
                <div className="font-display text-lg font-bold text-[#0b3558]">Данные для маркировки</div>
                <div className="mt-1 text-sm text-[#476788]">Реквизиты рекламодателя и объекта рекламы</div>
              </div>
              <ChevronRight className={`w-4 h-4 text-[#476788] transition-transform ${markingDataOpen ? 'rotate-90' : ''}`} />
            </button>
            <CollapsiblePanel open={markingDataOpen}>
              <div className="divide-y divide-[#d4e0ed]">
                {(sourceOrder ? [
                  ['Рекламодатель',sourceOrder.snapshot.advertiser?.name||'Без рекламодателя'],
                  ['ИНН',sourceOrder.snapshot.advertiser?.inn||'—'],
                  ['КПП',sourceOrder.snapshot.advertiser?.details?.kpp],
                  ['ОГРН / ОГРНИП',sourceOrder.snapshot.advertiser?.details?.ogrn],
                  ['Адрес',sourceOrder.snapshot.advertiser?.details?.address],
                  ['Объект рекламирования',sourceOrder.snapshot.advertiser?.details?.advertisedObject],
                  ['Целевая ссылка',sourceOrder.snapshot.advertiser?.details?.targetUrl],
                  ['Тип исходного договора',sourceOrder.snapshot.advertiser?.details?.contractType==='intermediary'?'Посреднический договор':sourceOrder.snapshot.advertiser?.details?.contractType==='services'?'Договор оказания услуг':''],
                  ['Номер исходного договора',sourceOrder.snapshot.advertiser?.details?.contractNumber],
                  ['Дата исходного договора',sourceOrder.snapshot.advertiser?.details?.contractDate],
                  ['Первый исполнитель',sourceOrder.snapshot.advertiser?.details?.executorName],
                  ['ИНН первого исполнителя',sourceOrder.snapshot.advertiser?.details?.executorInn],
                ].filter(([,value])=>value) : []).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                    <div className="min-w-0">
                      <div className="text-xs text-[#476788]">{label}</div>
                      <div className="mt-0.5 text-sm font-medium text-[#0b3558] break-words">{value}</div>
                    </div>
                    <CopyButton value={value} label={`Скопировать ${label}`} />
                  </div>
                ))}
              </div>
            </CollapsiblePanel>
          </div>
        </Card>

        {sourceOrder ? <LiveMaterialContent material={sourceOrder.snapshot} copy preserveOrderLayout /> : <>
        <Card className="p-6">
          <FullMaterialPreview
            context="publisher"
            showLinks={false}
            showAttachments={false}
          />
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h3 className="font-display text-lg font-bold text-[#0b3558]">Прикрепленные файлы</h3>
            <p className="mt-1 text-sm text-[#476788]">Изображения и документы, переданные вместе с материалом</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['preview-interface.jpg', 'Изображение · 2,4 МБ', 'image'],
              ['analytics-screen.png', 'Изображение · 1,8 МБ', 'image'],
              ['brand-cover.webp', 'Изображение · 920 КБ', 'image'],
              ['press-release.docx', 'Документ · 146 КБ', 'document'],
            ].map(([name, meta, type]) => (
              <button
                key={name}
                type="button"
                className="group flex min-w-0 items-center gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-3 text-left transition-colors hover:border-[#a6bbd1] hover:bg-white"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#006bff]">
                  {type === 'image' ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#0b3558]">{name}</span>
                  <span className="mt-0.5 block text-xs text-[#476788]">{meta}</span>
                </span>
                <Download className="h-4 w-4 flex-shrink-0 text-[#476788] transition-colors group-hover:text-[#006bff]" />
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5">
            <h3 className="font-display text-lg font-bold text-[#0b3558]">Параметры размещения</h3>
            <p className="mt-1 text-sm text-[#476788]">Ссылки и дополнительные требования к публикации</p>
          </div>
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d4e0ed]">
              <div className="text-sm font-semibold text-[#0b3558]">Ссылки в тексте материала</div>
            </div>
            <div className="divide-y divide-[#d4e0ed]">
              {materialLinks.map((link) => (
                <div key={link} className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-[#006bff] break-all">
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    <span>{link}</span>
                  </div>
                  <CopyButton value={link} label="Скопировать ссылку" />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d4e0ed]">
              <div className="text-sm font-semibold text-[#0b3558]">Дополнительные настройки материала</div>
            </div>
            <div className="divide-y divide-[#d4e0ed]">
              {[
                ['Тэги', 'финтех, аналитика, PR, запуск продукта'],
                ['Title', 'Финтех Решения запускает платформу аналитики'],
                ['Description', 'Новая платформа помогает PR-командам контролировать публикации, ссылки и отчеты.'],
                ['Желаемый URL', '/news/fintech-analytics-platform'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                  <div className="min-w-0">
                    <div className="text-xs text-[#476788]">{label}</div>
                    <div className="mt-0.5 text-sm font-medium text-[#0b3558] break-words">{value}</div>
                  </div>
                  <CopyButton value={value} label={`Скопировать ${label}`} />
                </div>
              ))}
            </div>
          </div>
        </Card>
        </>}
    </div>
  </div>
  );
};

const PublisherOrderNewDetailView = ({ navigate }) => {
  const [chatPanelOpen, setChatPanelOpen] = useState(false);

  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex items-center gap-2 text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('pub_orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          Заказ #1048
          <Badge color="blue">Новая заявка</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Площадка: РБК Инвестиции · ответ до 18:00 сегодня</p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-sm text-[#476788]">К начислению</div>
        <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(85000)}</div>
      </div>
    </div>

    <div className="bg-white border border-[#d4e0ed] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-12 h-12 bg-[#f8f9fb] rounded-full flex items-center justify-center border border-[#d4e0ed] flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-[#006bff]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#0b3558]">Заказ еще не принят</h3>
          <p className="text-sm text-[#476788] mt-1 mb-5">
            Проверьте материал, формат, сроки и данные рекламодателя. После принятия заказа станет доступна загрузка ссылки на публикацию.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Принять заказ</Button>
            <Button variant="secondary">Отклонить</Button>
            <Button variant="secondary">Запросить правки</Button>
            <Button variant="secondary" onClick={() => setChatPanelOpen((value) => !value)}>
              {chatPanelOpen ? 'Скрыть чат' : 'Чат заказа'}
            </Button>
          </div>
          <CollapsiblePanel open={chatPanelOpen}>
            <div className="mt-6 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-5">
              <h4 className="text-base font-semibold text-[#0b3558]">Чат заказа</h4>
              <div className="mt-4 flex gap-4">
                <div className="flex-1 min-h-[260px] max-h-[260px] overflow-y-auto space-y-3 pr-2">
                  <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white border border-[#d4e0ed] p-3 text-sm text-[#0b3558]">Добрый день. Можем принять материал в работу после уточнения даты публикации.</div>
                  <div className="max-w-[82%] ml-auto rounded-2xl rounded-tr-sm bg-[#0b3558] text-white p-3 text-sm">Уточните, пожалуйста, доступный слот редакции.</div>
                  <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white border border-[#d4e0ed] p-3 text-sm text-[#0b3558]">Ближайший слот доступен завтра до 16:00.</div>
                </div>
                <div className="w-2 rounded-full bg-[#d4e0ed] p-0.5">
                  <div className="h-16 rounded-full bg-[#476788]" />
                </div>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <textarea className="flex-1 min-h-[104px] border border-[#476788] rounded-lg px-4 py-3 text-sm" placeholder="Написать сообщение..." />
                <Button variant="primary">Отправить</Button>
              </div>
            </div>
          </CollapsiblePanel>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Состав заявки</h3>
          <div className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-[#476788]">Материал</div>
                <div className="mt-1 text-lg font-semibold text-[#0b3558]">Анонс вебинара по инвестициям</div>
                <p className="mt-2 text-sm leading-6 text-[#476788]">
                  Новость для РБК Инвестиции. Требуется принять или отклонить заявку до конца рабочего дня.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:w-[420px] gap-3 text-sm">
                {[
                  ['Формат', 'Новость'],
                  ['Ответ', 'до 18:00'],
                  ['Начисление', formatMoney(85000)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-white border border-[#d4e0ed] px-3 py-2">
                    <div className="text-xs text-[#476788]">{label}</div>
                    <div className="mt-1 font-medium text-[#0b3558]">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d4e0ed]">
              <div className="text-sm font-semibold text-[#0b3558]">Данные для маркировки</div>
              <p className="text-xs text-[#476788] mt-1">Контакты скрыты. Для решения по заявке доступны реквизиты рекламодателя и объекта рекламы.</p>
            </div>
            <div className="divide-y divide-[#d4e0ed]">
              {advertiserLegalData.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                  <div className="min-w-0">
                    <div className="text-xs text-[#476788]">{label}</div>
                    <div className="mt-0.5 text-sm font-medium text-[#0b3558] break-words">{value}</div>
                  </div>
                  <CopyButton value={value} label={`Скопировать ${label}`} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Материал</h3>
          <FullMaterialPreview context="publisher" />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Решение по заявке</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-[#476788]">Статус</span><span className="font-medium text-[#0b3558]">ожидает решения</span></div>
            <div className="flex justify-between gap-3"><span className="text-[#476788]">Дедлайн ответа</span><span>сегодня, 18:00</span></div>
            <div className="flex justify-between gap-3"><span className="text-[#476788]">Публикация</span><span>после принятия</span></div>
          </div>
          <Button variant="primary" className="w-full mt-5">Принять заказ</Button>
          <Button variant="secondary" className="w-full mt-3">Отклонить</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Финансы</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-[#476788]">Начисление</span><span className="font-semibold text-[#0b3558]">{formatMoney(85000)}</span></div>
            <div className="flex justify-between"><span className="text-[#476788]">Статус</span><span>не начислено</span></div>
            <div className="flex justify-between"><span className="text-[#476788]">Выплата</span><span>после публикации и приемки</span></div>
          </div>
        </Card>

      </div>
    </div>
  </div>
  );
};

const PublisherPlatformsView = ({ navigate }) => {
  const backend=useBackend();
  const publisherPlatforms=backend.data.outlets;
  return (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">{backend.user.role==='admin'?'Площадки':'Мои площадки'}</h1>
        <p className="text-sm text-[#476788] mt-1">Список площадок, статусы модерации и переход к карточке редактирования.</p>
      </div>
      {backend.user.role==='publisher' && <Button variant="primary" onClick={() => navigate('pub_platform_new')}><Plus className="h-4 w-4" /> Добавить площадку</Button>}
    </div>
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]"><tr>{['Название', 'Тип', 'Тематика', 'Регион', 'Форматы', 'Цена', 'Сроки', 'Статус'].map(head => <th key={head} className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {publisherPlatforms.map((platform) => (
            <tr key={platform.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => {backend.setOutletId(platform.id);navigate(backend.user.role==='admin'?'admin_platform_detail':'pub_platform_detail');}}>
              <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{platform.name}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.type}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.theme}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.region}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.formats.join(', ')}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{formatMoney(platform.price)}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.deadline}</td>
              <td className="px-6 py-4"><Badge color={platform.status==='approved'?'green':'amber'}>{{pending:'На модерации',approved:platform.active?'Активна':'На паузе',rejected:'Отклонена'}[platform.status]}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);};

const LivePublisherPlatformDetail = ({navigate}) => {
  const backend=useBackend();
  const [editing,setEditing]=useState(false);
  const outlet=backend.data.outlets.find(o=>o.id===backend.outletId);
  if(!outlet)return <Card className="p-6">Выберите площадку в списке.</Card>;
if(backend.user.role==='admin')return <ClientPlatformDetailView navigate={()=>navigate('admin_platforms')} ownerControls={<Card className="platform-section-motion self-start p-6"><h2 className="font-display text-base font-bold text-[#0b3558]">Администрирование</h2><p className="mt-2 text-sm leading-6 text-[#476788]">Управление площадкой без изменения коммерческой карточки.</p><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-4"><span className="text-[#476788]">Паблишер</span><span className="break-all text-right font-medium text-[#0b3558]">{outlet.owner_email}</span></div><div className="flex justify-between gap-4"><span className="text-[#476788]">Статус</span><span className="text-right font-medium text-[#0b3558]">{{pending:'На модерации',approved:outlet.active?'Активна':'На паузе',rejected:'Отклонена'}[outlet.status]}</span></div>{backend.user.teamRole!=='moderator'&&<div className="flex justify-between gap-4"><span className="text-[#476788]">Активных заказов</span><span className="font-medium text-[#0b3558]">{backend.data.orders.filter(order=>order.outlet_id===outlet.id&&!['completed','rejected','refunded'].includes(order.apiStatus)).length}</span></div>}</div>{backend.user.teamRole!=='moderator'&&outlet.status==='approved'&&<Button variant="secondary" className="mt-5 w-full" disabled={backend.busy} onClick={()=>backend.perform(async()=>{await api(`/outlets/${outlet.id}/active`,'POST',{active:!outlet.active});await backend.refresh();})}>{outlet.active?'Приостановить':'Вернуть в каталог'}</Button>}{outlet.status==='pending'&&<div className="mt-5 flex flex-col gap-3">{[[true,'Принять площадку'],[false,'Отклонить площадку']].map(([approved,label])=><Button key={String(approved)} variant={approved?'primary':'secondary'} disabled={backend.busy} onClick={()=>backend.perform(async()=>{await api(`/admin/outlets/${outlet.id}`,'POST',{approved});await backend.refresh();})}>{label}</Button>)}</div>}</Card>} />;
  if(editing)return <PublisherPlatformNewView navigate={navigate} embedded outletId={outlet.id} initialValues={outletFormValues(outlet)} onDone={()=>setEditing(false)} />;
  return <ClientPlatformDetailView navigate={()=>navigate('pub_platforms')} readOnlyFormats ownerControls={<Card className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-bold">Управление площадкой</h2><Badge color={outlet.status==='approved'?'green':'amber'}>{{pending:'На модерации',rejected:'Отклонена',approved:outlet.active?'Активна':'На паузе'}[outlet.status]}</Badge></div><Button variant="secondary" className="mt-5 w-full" onClick={()=>setEditing(true)}><Pencil className="h-4 w-4" />Редактировать</Button><button type="button" role="switch" aria-checked={outlet.active} disabled={backend.busy||outlet.status!=='approved'} className="mt-5 flex w-full items-center justify-between gap-4 border-t border-[#d4e0ed] pt-5 disabled:opacity-50" onClick={()=>backend.perform(async()=>{await api(`/outlets/${outlet.id}/active`,'POST',{active:!outlet.active});await backend.refresh();})}><span>Принимать заказы</span><span className={`relative h-6 w-11 rounded-full ${outlet.active?'bg-emerald-500':'bg-gray-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white ${outlet.active?'left-6':'left-1'}`} /></span></button></Card>} />;
};

const PublisherPlatformDetailView = ({ navigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const platformPublications = mockOrdersPublisher.filter((order) => order.platform === 'РБК Инвестиции');

  return (
    <div className="platform-view-enter mx-auto max-w-6xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_platforms')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К площадкам
      </button>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="platform-logo-motion flex h-16 w-16 flex-none flex-col items-center justify-center rounded-2xl border border-[#d4e0ed] bg-white shadow-sm" aria-label="Логотип РБК">
            <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
              <span className="h-2.5 w-1.5 rounded-sm bg-[#f5a623]" />
              <span className="h-3.5 w-1.5 rounded-sm bg-[#4dbb73]" />
              <span className="h-4 w-1.5 rounded-sm bg-[#28a8df]" />
              <span className="h-3 w-1.5 rounded-sm bg-[#405de6]" />
            </span>
            <span className="mt-1 text-xs font-bold leading-none text-[#0b3558]">РБК</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-display text-2xl font-bold text-[#0b3558]">РБК Инвестиции</h1>
              <Badge key={isActive ? 'active' : 'paused'} color={isActive ? 'green' : 'gray'} className="platform-status-pop">{isActive ? 'Активна' : 'На паузе'}</Badge>
              <Badge color="blue">Проверено</Badge>
              <Badge color="blue">Маркировка</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#476788]">
              <span>СМИ · Финансы · Федеральные</span>
              <span className="hidden text-[#9bb6d3] sm:inline">·</span>
              <a className="inline-flex items-center gap-1 font-medium text-[#006cff] hover:underline" href="https://invest.rbc.ru" target="_blank" rel="noreferrer">
                invest.rbc.ru <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setIsEditing((current) => !current)}>
          {isEditing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {isEditing ? 'Вернуться к превью' : 'Редактировать'}
        </Button>
      </div>

      {isEditing ? (
        <PublisherPlatformNewView
          navigate={navigate}
          embedded
          onDone={() => setIsEditing(false)}
          initialValues={{
            name: 'РБК Инвестиции',
            url: 'https://invest.rbc.ru',
            type: 'СМИ',
            geography: 'Федеральные',
            theme: 'Финансы, инвестиции, бизнес',
            dailyReach: '82 000',
            subscribers: '',
            metrikaUrl: 'https://metrika.yandex.ru/dashboard?id=12345678',
            mediologyRank: '5',
            formats: ['Статья', 'Новость'],
            formatPrices: { Статья: '150000', Новость: '85000' },
            formatDeadlines: { Статья: '2 дня', Новость: '1 день' },
            goals: ['Пиар', 'SEO'],
            aggregators: ['Google News', 'Дзен'],
            responseDeadline: '4 часа',
            storage: '2 года',
            seasonalOfferEnabled: true,
            discount: '10',
            coefficient: '1,0',
            seasonStart: '2026-07-01',
            seasonEnd: '2026-08-31',
            requirements: 'Площадка принимает материалы о финансах, бизнесе и технологиях. Редакция может изменить заголовок и структуру текста без искажения смысла. Допускается до двух внешних ссылок, изображения обязательны. Не принимаются запрещенные тематики и обещания гарантированного дохода.',
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="platform-card-motion p-5" style={{ animationDelay: '80ms' }}>
              <div className="text-xs uppercase text-[#476788]">Посещаемость в день</div>
              <div className="mt-2 text-xl font-semibold text-[#0b3558]">82 тыс.</div>
              <a className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#006cff] hover:underline" href="https://metrika.yandex.ru/dashboard?id=12345678" target="_blank" rel="noreferrer">
                Яндекс Метрика <ExternalLink className="h-3 w-3" />
              </a>
            </Card>
            <Card className="platform-card-motion p-5" style={{ animationDelay: '120ms' }}><div className="text-xs uppercase text-[#476788]">Срок публикации</div><div className="mt-2 text-xl font-semibold text-[#0b3558]">до 2 дней</div></Card>
            <Card className="platform-card-motion p-5" style={{ animationDelay: '160ms' }}><div className="text-xs uppercase text-[#476788]">Хранение</div><div className="mt-2 text-xl font-semibold text-[#0b3558]">2 года</div></Card>
            <Card className="platform-card-motion p-5" style={{ animationDelay: '200ms' }}><div className="flex items-center gap-1 text-xs uppercase text-[#476788]">Медиалогия <Info className="h-3.5 w-3.5" /></div><div className="mt-2 text-xl font-semibold text-[#0b3558]">#5</div><div className="mt-1 text-xs text-[#476788]">общий рейтинг</div></Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="platform-section-motion overflow-hidden">
                <div className="flex flex-col gap-2 border-b border-[#d4e0ed] bg-[#f8f9fb] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#0b3558]">Форматы и цены</h2>
                    <p className="mt-1 text-xs text-[#476788]">Сезонная скидка 10% действует до 31 августа</p>
                  </div>
                  <Badge color="green">Коэффициент сезона ×1,0</Badge>
                </div>
                <div className="divide-y divide-[#d4e0ed]">
                  {[
                    { name: 'Статья', deadline: 'до 2 дней', basePrice: '150 000 ₽', price: '135 000 ₽' },
                    { name: 'Новость', deadline: 'до 1 дня', basePrice: '85 000 ₽', price: '76 500 ₽' },
                  ].map((format) => (
                    <div key={format.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-[#0b3558]">{format.name}</div>
                        <div className="mt-1 text-xs text-[#476788]">Публикация {format.deadline}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#7890aa] line-through">{format.basePrice}</div>
                        <div className="mt-0.5 text-base font-semibold text-[#0b3558]">{format.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="platform-section-motion p-6">
                <h2 className="font-display text-base font-bold text-[#0b3558]">Требования</h2>
                <p className="mt-3 text-sm leading-6 text-[#476788]">
                  Площадка принимает материалы о финансах, бизнесе и технологиях. Редакция может изменить заголовок и структуру текста без искажения смысла. Допускается до двух внешних ссылок, изображения обязательны. Не принимаются запрещенные тематики и обещания гарантированного дохода.
                </p>
                <div className="mt-5 grid gap-5 border-t border-[#d4e0ed] pt-5 sm:grid-cols-2 sm:gap-0">
                  <div className="flex min-w-0 items-center gap-3 sm:pr-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#006cff]"><Megaphone className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase leading-none text-[#6f88a3]">Подходит для целей</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['Пиар', 'SEO'].map((goal) => <span key={goal} className="rounded-full bg-[#e7f1ff] px-3 py-1 text-sm font-semibold text-[#075cc8]">{goal}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-3 border-t border-[#d4e0ed] pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ebf8f1] text-[#16834d]"><Newspaper className="h-5 w-5" /></span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase leading-none text-[#6f88a3]">Новостные агрегаторы</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['Google News', 'Дзен'].map((aggregator) => <span key={aggregator} className="rounded-full bg-[#ebf8f1] px-3 py-1 text-sm font-semibold text-[#146b43]">{aggregator}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="platform-section-motion h-fit p-6">
              <h2 className="font-display text-base font-bold text-[#0b3558]">Управление площадкой</h2>
              <p className="mt-2 text-sm leading-6 text-[#476788]">Активная площадка видна в каталоге и принимает новые заказы.</p>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((current) => !current)}
                className="mt-5 flex w-full items-center justify-between gap-4 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-[#0b3558]">{isActive ? 'Площадка активна' : 'Площадка на паузе'}</span>
                  <span className="mt-1 block text-xs text-[#476788]">{isActive ? 'Принимает новые заказы' : 'Новые заказы недоступны'}</span>
                </span>
                <span className={`relative h-6 w-11 flex-none rounded-full transition-colors ${isActive ? 'bg-[#18b875]' : 'bg-[#a6bbd1]'}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </span>
              </button>
            </Card>
          </div>
        </>
      )}

      <Card className="platform-section-motion overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0b3558]">Публикации на площадке</h2>
            <p className="mt-1 text-sm text-[#476788]">Заказы и размещения, связанные с РБК Инвестиции</p>
          </div>
          <Badge color="blue">{platformPublications.length} заказа</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] divide-y divide-[#d4e0ed]">
            <thead className="bg-[#f8f9fb]">
              <tr>
                {['Заказ', 'Материал', 'Формат', 'Дата', 'Статус'].map((head) => (
                  <th key={head} className="px-6 py-3 text-left text-xs font-medium uppercase text-[#476788]">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4e0ed] bg-white">
              {platformPublications.map((order) => (
                <tr key={order.id} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => navigate('pub_order_detail')}>
                  <td className="px-6 py-4 text-sm font-semibold text-[#006bff]">№{orderNumber(order)}</td>
                  <td className="max-w-[340px] px-6 py-4 text-sm font-medium text-[#0b3558]"><span className="line-clamp-2">{order.material}</span></td>
                  <td className="px-6 py-4 text-sm text-[#476788]">{order.format.replace('СМИ (', '').replace(')', '')}</td>
                  <td className="px-6 py-4 text-sm tabular-nums text-[#476788]">{order.date}</td>
                  <td className="px-6 py-4"><Badge color={order.statusColor}>{order.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

type PlatformFormValues = {
  logoFileId?: string;
  formats?: string[]; goals?: string[]; aggregators?: string[]; seasonalOfferEnabled?: boolean;
  name?: string; url?: string; type?: string; geography?: string; theme?: string;
  dailyReach?: string | number; subscribers?: string | number; metrikaUrl?: string;
  mediologyRank?: string | number; formatPrices?: Record<string, string | number>;
  formatDeadlines?: Record<string, string | number>; responseDeadline?: string;
  storage?: string; discount?: string | number; coefficient?: string | number;
  seasonStart?: string; seasonEnd?: string; requirements?: string;
};
const PublisherPlatformNewView = ({ navigate, embedded = false, onDone = undefined, initialValues = {} as PlatformFormValues, outletId = null }) => {
  const backend=useBackend();
  const formRef=useRef(null);
  const [logoIds,setLogoIds]=useState(initialValues.logoFileId?[initialValues.logoFileId]:[]);
  const [selects,setSelects]=useState({type:initialValues.type||'СМИ',geography:initialValues.geography||'Федеральные',responseDeadline:initialValues.responseDeadline||'2 часа',storage:initialValues.storage||'2 года',formatDeadlines:initialValues.formatDeadlines||{}});
  const setSelect=(key,value)=>setSelects(v=>({...v,[key]:value}));
  const save=()=>{
    if(!formRef.current.reportValidity()) return;
    backend.perform(async()=>{
      const fields=new FormData(formRef.current);
      const text=(key)=>String(fields.get(key)||'').trim();
      const number=(key,fallback=0)=>text(key)?Number(text(key).replace(/\s/g,'').replace(',','.')):fallback;
      const formats={Статья:'article',Новость:'news',Пост:'post',Лонгрид:'longread'};
      if(!selectedFormats.length)throw new Error('Выберите хотя бы один формат размещения');
      const prices=Object.fromEntries(selectedFormats.map(f=>[formats[f],Math.round(number(`price-${f}`)*100)]));
      const publicationDaysByFormat=Object.fromEntries(selectedFormats.map(f=>[formats[f],parseInt(String(selects.formatDeadlines[f]||'1 день'))]));
      const payload={name:text('name'),url:text('url'),kind:({'СМИ':'media','ТГ-канал':'telegram','Паблик ВК':'vk','Канал в MAX':'max','Канал в Дзене':'dzen'})[selects.type],geography:selects.geography,prices,
        details:{...(logoIds[0]?{logoFileId:logoIds[0]}:{}),topics:text('theme').split(',').map(s=>s.trim()).filter(Boolean),goals:selectedGoals.map(g=>({Пиар:'pr',SEO:'seo',SERM:'serm'})[g]),aggregators:selectedAggregators.map(a=>({'Google News':'google_news','Дзен':'dzen','Новости Mail.ru':'mail_news'})[a]),
          ...(text('dailyReach')?{dailyAudience:number('dailyReach')}:{}),...(text('subscribers')?{subscribers:number('subscribers')}:{}),...(text('mediologyRank')?{medialogiaRank:number('mediologyRank')}:{}),...(text('metrikaUrl')?{metrikaUrl:text('metrikaUrl')}:{}),
          publicationDays:Math.max(...Object.values(publicationDaysByFormat) as number[]),publicationDaysByFormat,storageMonths:24,storageIndefinite:selects.storage==='Бессрочно',responseHours:selects.responseDeadline==='1 рабочий день'?24:parseInt(selects.responseDeadline),requirements:text('requirements')},
        coefficientBps:seasonalOfferEnabled?Math.round(number('coefficient',1)*10000):10000,discountBps:seasonalOfferEnabled?Math.round(number('discount')*100):0,
        seasonStart:seasonalOfferEnabled?text('seasonStart')||null:null,discountUntil:seasonalOfferEnabled?text('seasonEnd')||null:null};
      if(seasonalOfferEnabled&&(!payload.seasonStart||!payload.discountUntil||payload.seasonStart>payload.discountUntil))throw new Error('Укажите корректный период сезонных условий');
      const saved=await api(outletId?`/outlets/${outletId}`:'/outlets',outletId?'PUT':'POST',payload);
      await backend.refresh();backend.setOutletId(saved.id);
      if(embedded)onDone?.();else navigate('pub_platforms');
    });
  };
  const formatNames = ['Статья', 'Новость', 'Пост', 'Лонгрид'];
  const goalNames = ['Пиар', 'SEO', 'SERM'];
  const aggregatorNames = ['Google News', 'Дзен', 'Новости Mail.ru'];
  const [selectedFormats, setSelectedFormats] = useState(initialValues.formats || ['Статья', 'Новость']);
  const [selectedGoals, setSelectedGoals] = useState(initialValues.goals || ['Пиар']);
  const [selectedAggregators, setSelectedAggregators] = useState(initialValues.aggregators || []);
  const [seasonalOfferEnabled, setSeasonalOfferEnabled] = useState(Boolean(initialValues.seasonalOfferEnabled));

  const toggleValue = (value, values, setValues) => {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const inputClassName = 'mt-2 w-full rounded-lg border border-[#476788] bg-white px-4 py-2.5 text-sm text-[#0b3558] outline-none transition focus:border-[#006cff] focus:ring-2 focus:ring-[#006cff]/15';
  const sectionHeader = (icon, title, description) => (
    <div className="flex items-center gap-3 border-b border-[#d4e0ed] px-6 py-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#006cff]">{icon}</span>
      <div>
        <h2 className="font-display text-base font-bold text-[#0b3558]">{title}</h2>
        <p className="mt-1 text-xs text-[#476788]">{description}</p>
      </div>
    </div>
  );

  return (
    <form ref={formRef} onSubmit={e=>{e.preventDefault();save();}} className={embedded ? 'space-y-6' : 'mx-auto max-w-5xl space-y-6'}>
      {!embedded && (
        <>
          <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_platforms')}>
            <ChevronRight className="h-4 w-4 rotate-180" /> К площадкам
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">Добавление новой площадки</h1>
            <p className="mt-1 text-sm text-[#476788]">Заполните данные для карточки каталога. После отправки площадка уйдет на модерацию и не будет видна заказчикам до принятия.</p>
          </div>
        </>
      )}

      <Card className="overflow-hidden">
        {sectionHeader(<Store className="h-5 w-5" />, 'Основные данные', 'Название, адрес и классификация площадки')}
        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Название площадки</span>
            <input name="name" required maxLength={200} className={inputClassName} defaultValue={initialValues.name} placeholder="Например, Investor.ru" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Ссылка на площадку</span>
            <input name="url" required className={inputClassName} type="url" defaultValue={initialValues.url} placeholder="https://investor.ru" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Тип площадки</span>
            <CustomSelect className="mt-2" value={selects.type} onChange={v=>setSelect('type',v)} options={['СМИ', 'ТГ-канал', 'Паблик ВК', 'Канал в MAX', 'Канал в Дзене']} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">География</span>
            <CustomSelect className="mt-2" value={selects.geography} onChange={v=>setSelect('geography',v)} options={regionFilterOptions.slice(1)} />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium text-[#476788]">Тематика</span>
            <input name="theme" className={inputClassName} defaultValue={initialValues.theme} placeholder="Например, финансы, инвестиции, бизнес" />
          </label>
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-[#476788]">Логотип площадки</span>
            {embedded && !outletId && (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-3">
                <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-xl border border-[#d4e0ed] bg-white">
                  <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                    <span className="h-2 w-1 rounded-sm bg-[#f5a623]" />
                    <span className="h-2.5 w-1 rounded-sm bg-[#4dbb73]" />
                    <span className="h-3 w-1 rounded-sm bg-[#28a8df]" />
                    <span className="h-2 w-1 rounded-sm bg-[#405de6]" />
                  </span>
                  <span className="mt-1 text-[10px] font-bold leading-none text-[#0b3558]">РБК</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0b3558]">Текущий логотип</div>
                  <div className="mt-1 text-xs text-[#476788]">Новый файл заменит изображение после сохранения.</div>
                </div>
              </div>
            )}
            <div className="mt-2">
              <FileUploadField accept="image/png,image/jpeg,image/webp" multiple={false} compact storedIds={logoIds} onStoredChange={ids=>setLogoIds(ids.slice(-1))} imagesOnly />
            </div>
            <p className="mt-2 text-xs text-[#7890aa]">PNG, JPG или WEBP. Рекомендуемый размер от 256 × 256 px.</p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {sectionHeader(<BarChart3 className="h-5 w-5" />, 'Аудитория и распространение', 'Метрики, цели размещения и новостные агрегаторы')}
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Посещаемость в день</span>
              <input name="dailyReach" className={inputClassName} inputMode="numeric" defaultValue={initialValues.dailyReach} placeholder="Например, 82 000" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Подписчики</span>
              <input name="subscribers" className={inputClassName} inputMode="numeric" defaultValue={initialValues.subscribers} placeholder="Для Telegram и ВК" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Ссылка на Яндекс Метрику</span>
              <input name="metrikaUrl" className={inputClassName} type="url" defaultValue={initialValues.metrikaUrl} placeholder="https://metrika.yandex.ru/..." />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Ранг Медиалогии</span>
              <input name="mediologyRank" className={inputClassName} inputMode="numeric" defaultValue={initialValues.mediologyRank} placeholder="Например, 5" />
              <span className="mt-2 block text-xs text-[#7890aa]">Позиция в общем или отраслевом рейтинге.</span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-6 border-t border-[#d4e0ed] pt-6 md:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-[#0b3558]">Подходит для целей</div>
              <p className="mt-1 text-xs text-[#476788]">Используется в фильтре каталога.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {goalNames.map((goal) => {
                  const selected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${selected ? 'border-[#006cff] bg-[#e7f1ff] text-[#075cc8]' : 'border-[#d4e0ed] bg-white text-[#476788] hover:bg-[#f8f9fb]'}`}
                      onClick={() => toggleValue(goal, selectedGoals, setSelectedGoals)}
                      aria-pressed={selected}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-[#006cff] bg-[#006cff] text-white' : 'border-[#9bb6d3]'}`}>
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0b3558]">Новостные агрегаторы</div>
              <p className="mt-1 text-xs text-[#476788]">Показываются в карточке площадки.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {aggregatorNames.map((aggregator) => {
                  const selected = selectedAggregators.includes(aggregator);
                  return (
                    <button
                      key={aggregator}
                      type="button"
                      className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${selected ? 'border-[#16834d] bg-[#ebf8f1] text-[#146b43]' : 'border-[#d4e0ed] bg-white text-[#476788] hover:bg-[#f8f9fb]'}`}
                      onClick={() => toggleValue(aggregator, selectedAggregators, setSelectedAggregators)}
                      aria-pressed={selected}
                    >
                      <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-[#16834d] bg-[#16834d] text-white' : 'border-[#9bb6d3]'}`}>
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      {aggregator}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {sectionHeader(<CreditCard className="h-5 w-5" />, 'Форматы и условия', 'Стоимость и срок публикации задаются отдельно для каждого формата')}
        <div className="space-y-6 p-6">
          <div className="rounded-lg border border-[#d4e0ed]">
            <div className="hidden grid-cols-[minmax(180px,1fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)] gap-4 bg-[#f8f9fb] px-5 py-3 text-xs font-medium uppercase text-[#6f88a3] md:grid">
              <span>Формат</span>
              <span>Цена</span>
              <span>Срок публикации</span>
            </div>
            <div className="divide-y divide-[#d4e0ed]">
              {formatNames.map((format) => {
                const selected = selectedFormats.includes(format);
                return (
                  <div key={format} className={`grid gap-4 px-5 py-4 md:grid-cols-[minmax(180px,1fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)] md:items-center ${selected ? 'bg-white' : 'bg-[#f8f9fb]'}`}>
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left text-sm font-semibold text-[#0b3558]"
                      onClick={() => toggleValue(format, selectedFormats, setSelectedFormats)}
                      aria-pressed={selected}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? 'border-[#006cff] bg-[#006cff] text-white' : 'border-[#9bb6d3] bg-white'}`}>
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                      {format}
                    </button>
                    <label className="block">
                      <span className="text-xs text-[#7890aa] md:hidden">Цена</span>
                      <div className="relative mt-1 md:mt-0">
                        <input
                          className={`${inputClassName} mt-0 pr-9 disabled:bg-[#f0f3f8] disabled:text-[#9bb0c5]`}
                          inputMode="numeric"
                          defaultValue={initialValues.formatPrices?.[format]}
                          name={`price-${format}`} aria-label={`Цена: ${format}`} required={selected}
                          placeholder="0"
                          disabled={!selected}
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#7890aa]">₽</span>
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-xs text-[#7890aa] md:hidden">Срок публикации</span>
                      <CustomSelect
                        className="mt-1 md:mt-0"
                        value={selects.formatDeadlines[format]||'1 день'}
                        onChange={v=>setSelect('formatDeadlines',{...selects.formatDeadlines,[format]:v})}
                        options={['1 день', '2 дня', '3 дня', '4 дня', '5 дней', '6 дней']}
                        buttonClassName={!selected ? 'opacity-50 pointer-events-none' : ''}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Срок ответа на заказ</span>
              <CustomSelect className="mt-2" value={selects.responseDeadline} onChange={v=>setSelect('responseDeadline',v)} options={['2 часа', '4 часа', '8 часов', '1 рабочий день']} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Минимальный срок хранения</span>
              <CustomSelect className="mt-2" value={selects.storage} onChange={v=>setSelect('storage',v)} options={['2 года', 'Бессрочно']} />
            </label>
          </div>
          <div className="border-t border-[#d4e0ed] pt-5">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 text-left"
              onClick={() => setSeasonalOfferEnabled((current) => !current)}
              aria-expanded={seasonalOfferEnabled}
            >
              <span>
                <span className="block text-sm font-semibold text-[#0b3558]">Сезонные условия</span>
                <span className="mt-1 block text-xs text-[#476788]">Необязательная скидка или коэффициент на ограниченный период.</span>
              </span>
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${seasonalOfferEnabled ? 'bg-[#006cff]' : 'bg-[#c8d6e5]'}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${seasonalOfferEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </span>
            </button>
            {seasonalOfferEnabled && (
              <div className="mt-5 grid grid-cols-1 gap-5 rounded-lg bg-[#f8f9fb] p-5 md:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Скидка</span>
                  <input name="discount" className={inputClassName} inputMode="numeric" defaultValue={initialValues.discount} placeholder="10" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Коэффициент</span>
                  <input name="coefficient" className={inputClassName} inputMode="decimal" defaultValue={initialValues.coefficient} placeholder="1,0" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Начало</span>
                  <input name="seasonStart" required className={inputClassName} type="date" defaultValue={initialValues.seasonStart} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Окончание</span>
                  <input name="seasonEnd" required className={inputClassName} type="date" defaultValue={initialValues.seasonEnd} />
                </label>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {sectionHeader(<FileText className="h-5 w-5" />, 'Требования редакции', 'Условия, которые заказчик увидит до создания заказа')}
        <div className="p-6">
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Требования к материалам</span>
            <textarea name="requirements" className={`${inputClassName} min-h-[140px] resize-y py-3`} defaultValue={initialValues.requirements} placeholder="Укажите допустимые тематики, требования к изображениям, ссылкам, структуре текста и основания для отказа." />
          </label>
        </div>
      </Card>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button type="button" variant="secondary" disabled={backend.busy} onClick={() => (embedded ? onDone?.() : navigate('pub_platforms'))}>Отмена</Button>
        <Button type="button" variant="primary" disabled={backend.busy} onClick={save}>{embedded ? 'Сохранить изменения' : 'Отправить на модерацию'}</Button>
      </div>
    </form>
  );
};

const PublisherFinanceView = ({ navigate }) => {
  const backend = useBackend();
  const orders = backend.data.orders;
  const transactions = financialTransactions(backend.data.transactions, backend.user.id, orders);
  const completedOrders = orders.filter((order) => order.apiStatus === 'completed');
  const awaitingOrders = orders.filter((order) => order.apiStatus === 'submitted');
  const activeOrders = orders.filter((order) => order.apiStatus === 'accepted');
  const earned = completedOrders.reduce((sum, order) => sum + Number(order.payout) / 100, 0);
  const awaiting = awaitingOrders.reduce((sum, order) => sum + Number(order.payout) / 100, 0);
  const inWork = activeOrders.reduce((sum, order) => sum + Number(order.payout) / 100, 0);
  const commission = completedOrders.reduce((sum, order) => sum + (Number(order.amount) - Number(order.payout)) / 100, 0);
  const basisOrders = orders.filter((order) => ['accepted', 'submitted', 'completed', 'disputed'].includes(order.apiStatus));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h1 className="font-display text-sm font-medium text-[#476788] mb-2">Доступно к выводу</h1>
          <div className="text-4xl font-semibold text-[#0b3558]">{formatMoney(backend.data.balance.available / 100)}</div>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-[#476788]">Начислено</span><span className="text-[#0b3558]">{formatMoney(earned)}</span></div>
            <div className="flex justify-between"><span className="text-[#476788]">Ожидает приемки</span><span className="text-[#0b3558]">{formatMoney(awaiting)}</span></div>
            <div className="flex justify-between"><span className="text-[#476788]">В работе</span><span className="text-[#0b3558]">{formatMoney(inWork)}</span></div>
            <div className="flex justify-between"><span className="text-[#476788]">Комиссия платформы</span><span className="text-[#0b3558]">{formatMoney(commission)}</span></div>
            <div className="flex justify-between"><span className="text-[#a6bbd1]">Ближайшая выплата</span><span>не назначена</span></div>
          </div>
          <Button variant="primary" className="w-full mt-8" disabled={!backend.data.balance.available} onClick={() => navigate('pub_payout_request')}>Запросить выплату</Button>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-[#0b3558] mb-4">История начислений</h2>
          <div className="space-y-3">
            {transactions.map((item) => (
              <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div><div className="font-medium text-[#0b3558]">{item.desc}</div><div className="mt-1 text-xs text-[#476788]">{item.date} · {item.status}</div></div>
                <div className={`font-semibold tabular-nums ${item.amount < 0 ? 'text-red-600' : 'text-[#0b3558]'}`}>{item.amount > 0 ? '+' : ''}{formatMoney(item.amount)}</div>
              </div>
            ))}
            {!transactions.length && <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-6 text-sm text-[#476788]">Начислений пока нет.</div>}
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <h2 className="border-b border-[#d4e0ed] px-6 py-4 font-display text-lg font-bold text-[#0b3558]">Заявки на выплату</h2>
        <div className="divide-y divide-[#d4e0ed]">
          {backend.data.payouts.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm"><div><span className="font-semibold text-[#0b3558]">W-{item.number}</span><span className="ml-3 text-[#476788]">{new Date(item.created_at).toLocaleDateString('ru-RU')}</span><div className="mt-1 text-[#476788]">{{pending:'На проверке',approved:'Подтверждена, ожидает перечисления',transferred:'Перечислена',returned:'Возвращена',rejected:'Отклонена'}[item.status]}{item.comment?` · ${item.comment}`:''}</div></div><span className="font-semibold tabular-nums">{formatMoney(Number(item.amount)/100)}</span></div>)}
          {!backend.data.payouts.length&&<p className="px-6 py-5 text-sm text-[#476788]">Заявок пока нет.</p>}
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">В работе</div><div className="mt-2 text-xl font-semibold">{formatMoney(inWork)}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Ожидает приемки</div><div className="mt-2 text-xl font-semibold">{formatMoney(awaiting)}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Комиссия платформы</div><div className="mt-2 text-xl font-semibold">{formatMoney(commission)}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Завершено заказов</div><div className="mt-2 text-xl font-semibold">{completedOrders.length}</div></Card>
      </div>
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div>
            <h2 className="font-display text-base font-bold text-[#0b3558]">Реквизиты для выплаты</h2>
            <p className="text-sm text-[#476788] mt-1">Реквизиты ещё не добавлены, поэтому запрос выплаты недоступен.</p>
          </div>
          <Badge color="gray">не настроены</Badge>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {['Получатель', 'ИНН', 'КПП', 'Банк', 'Расчетный счет', 'БИК'].map((label) => (
            <div key={label} className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] px-3 py-2">
              <div className="text-xs text-[#476788]">{label}</div>
              <div className="font-medium text-[#0b3558] mt-1">Не указано</div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end"><Button variant="secondary" onClick={() => navigate('pub_settings')}>Добавить реквизиты</Button></div>
      </Card>
      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb]"><h2 className="font-display text-base font-bold text-[#0b3558]">Заказы-основания</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full divide-y divide-[#d4e0ed]">
            <tbody className="divide-y divide-[#d4e0ed]">
              {basisOrders.map((order) => <tr key={order.id}><td className="px-6 py-4 text-sm font-medium">№{orderNumber(order)}</td><td className="px-6 py-4 text-sm text-[#476788]">{order.material}</td><td className="px-6 py-4 text-sm font-semibold">{formatMoney(Number(order.payout) / 100)}</td><td className="px-6 py-4"><Badge color={order.statusColor}>{order.status}</Badge></td></tr>)}
              {!basisOrders.length && <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-[#476788]">Заказов для начисления пока нет.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const PublisherSanctionsView = ({ navigate }) => (
  <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Санкции и удержания</h1>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]"><tr>{['Дата', 'Заказ', 'Причина', 'Жалоба', 'Доказательства', 'Сумма', 'Статус', 'Решение', 'Действие'].map(head => <th key={head} className="px-5 py-4 text-left text-xs font-medium text-[#476788] uppercase whitespace-nowrap">{head}</th>)}</tr></thead>
          <tbody>
            <tr className="hover:bg-[#f8f9fb]">
              <td className="px-5 py-4 text-sm text-[#476788] whitespace-nowrap">12.10.2023</td>
              <td className="px-5 py-4 text-sm font-medium whitespace-nowrap">#1055</td>
              <td className="px-5 py-4 text-sm text-[#476788] max-w-[220px]">Публикация удалена раньше 2 лет</td>
              <td className="px-5 py-4 text-sm text-[#476788] whitespace-nowrap">C-020</td>
              <td className="px-5 py-4 text-sm text-[#006bff] max-w-[180px]">Ссылка, веб-архив</td>
              <td className="px-5 py-4 text-sm font-semibold whitespace-nowrap">52 000 ₽</td>
              <td className="px-5 py-4"><Badge color="amber">на проверке</Badge></td>
              <td className="px-5 py-4 text-sm text-[#476788] whitespace-nowrap">ожидается</td>
              <td className="px-5 py-4 text-sm whitespace-nowrap">
                <button className="text-[#006bff] font-medium" onClick={() => navigate('pub_dispute_detail')}>Открыть спор</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const PublisherComplaintView = ({ navigate }) => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_order_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К заказу
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Жалоба заказчика</h1>
      <p className="text-sm text-[#476788] mt-1">Реакция паблишера на спор, доказательства и заморозка выплаты до решения.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Заказ</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="#1055 · Кейс внедрения системы управления клиентами" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Причина жалобы</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Нарушен формат публикации" /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Комментарий паблишера</span><textarea className="mt-2 w-full min-h-[150px] border border-[#476788] rounded-lg px-4 py-3 text-sm" defaultValue="Опишите позицию редакции и приложите доказательства: ссылка, архив страницы, исходные файлы, переписка." /></label>
        <div className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Доказательства</span>
          <FileUploadField
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
            prompt="Выберите файлы с доказательствами или перетащите их сюда"
            hint="PDF, DOCX, TXT, PNG, JPG или WEBP · до 20 МБ"
          />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#476788]">Доказательства будут добавлены на страницу спора. Выплата по заказу останется замороженной до решения модератора.</p>
        <Button variant="primary">Отправить доказательства</Button>
      </div>
    </Card>
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[#0b3558]">Спор #C-020 открыт</div>
          <p className="text-sm text-[#476788] mt-1">Модератор ожидает позицию паблишера и приложенные доказательства.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('pub_dispute_detail')}>Открыть спор</Button>
      </div>
    </Card>
  </div>
);

const PublisherPayoutRequestView = ({ navigate }) => {
  const backend = useBackend();
  const available = Number(backend.data.balance.available || 0) / 100;
  const [amount,setAmount]=useState(()=>String(available));
  const amountValue=Number(amount.replace(',','.'));
  const amountKopeks=Math.round(amountValue*100);
  const validAmount=/^\d+(?:[.,]\d{0,2})?$/.test(amount)&&amountKopeks>0&&amountKopeks<=Number(backend.data.balance.available)&&Number.isSafeInteger(amountKopeks);
  const requisites=backend.data.account?.requisites||{};
  const verified=backend.data.account?.requisites_status==='verified';
  const ready=verified&&(requisites.payeeStatus==='Физическое лицо'
    ? Boolean(requisites.personName&&requisites.personInn&&requisites.personAccount&&requisites.personBik)
    : Boolean(requisites.recipient&&requisites.inn&&requisites.account&&requisites.bik));
  const requestPayout=async()=>{
    if(!validAmount)return;
    const ok=await backend.perform(async()=>{await api('/payouts','POST',{amount:amountKopeks},crypto.randomUUID());await backend.refresh();});
    if(ok)navigate('pub_finance');
  };
  return (
  <div className="space-y-6 max-w-4xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_finance')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К выплатам
    </button>
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Запрос выплаты</h1>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Сумма к выводу</span><input inputMode="decimal" aria-invalid={amount!==''&&!validAmount} className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" value={amount} onChange={event=>setAmount(event.target.value.replace(/[^\d.,]/g,'').slice(0,15))} /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Доступная сумма</span><input readOnly className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" value={formatMoney(available)} /></label>
        <div className="md:col-span-2"><span className="text-sm font-medium text-[#476788]">Реквизиты</span><div className="mt-2 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-3 text-sm text-[#0b3558]">{ready ? `${requisites.recipient||requisites.personName} · ${requisites.bank||requisites.personBank||'Банк не указан'} · ${requisites.account||requisites.personAccount}` : 'Подтвержденные реквизиты не заполнены'}</div></div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">Комиссия за вывод</div><div className="mt-1 text-xl font-semibold">{formatMoney(0)}</div></Card>
        <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">К получению</div><div className="mt-1 text-xl font-semibold">{formatMoney(validAmount?amountValue:0)}</div></Card>
        <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">Статус</div><div className="mt-1 text-sm font-semibold text-[#0b3558]">{ready?'реквизиты проверены':'реквизиты не настроены'}</div></Card>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        Заявка будет передана финансовому контролеру. Банковское перечисление выполняется отдельно.
      </div>
      <div className="mt-6 flex justify-end"><Button variant="primary" disabled={!ready||!validAmount||backend.busy} onClick={requestPayout}>Отправить заявку</Button></div>
    </Card>
  </div>
  );
};

const SettingField = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="text-sm font-medium text-[#476788]">{label}</span>
    {children}
  </label>
);

const settingInputClass = "mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]";

const SettingsSection = ({ title, description, icon: Icon, children }) => (
  <Card className="p-6">
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] flex items-center justify-center text-[#0b3558] flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="font-display text-base font-bold text-[#0b3558]">{title}</h2>
        {description && <p className="text-sm text-[#476788] mt-1">{description}</p>}
      </div>
    </div>
    {children}
  </Card>
);

const AccountFieldsPanel = ({ title, description, icon, fields, kind, submitLabel, note=null, statusLabel=false }) => {
  const backend=useBackend();
  const [values,setValues]=useState({});
  const [status,setStatus]=useState('draft');
  const [reviewComment,setReviewComment]=useState('');
  const [loaded,setLoaded]=useState(false);
  const [saved,setSaved]=useState(false);
  const [registryBusy,setRegistryBusy]=useState(false);
  const [registryMessage,setRegistryMessage]=useState('');
  useEffect(()=>{let active=true;api('/settings/account').then(data=>{
    if(active){setValues(data[kind]||{});setStatus(data.requisites_status||'draft');setReviewComment(data.requisites_review_comment||'');setLoaded(true);}
  }).catch(error=>{if(active)backend.setError(error.message);});return()=>{active=false;};},[kind]);
  const change=(key,value)=>{setValues(current=>({...current,[key]:value}));setSaved(false);};
  const fillFromRegistry=async()=>{
    setRegistryBusy(true);setRegistryMessage('');
    try {
      const inn=String(values.inn||'').replace(/\D/g,'');
      const result=await api(`/reference/party?${new URLSearchParams({query:inn})}`);
      if(!result.found||result.party.inn!==inn){setRegistryMessage('Организация не найдена в реестре.');return;}
      const party=result.party;
      setValues(current=>({...current,inn:party.inn,kpp:party.kpp||'',ogrn:party.ogrn||'',legalAddress:party.address||current.legalAddress,...(fields.some(field=>field.key==='recipient')?{recipient:party.shortName||party.name||current.recipient}: {})}));
      setSaved(false);
      setRegistryMessage('Реквизиты подставлены. Проверьте данные перед сохранением.');
    } catch(error) {setRegistryMessage(error instanceof Error?error.message:'Поиск недоступен');}
    finally {setRegistryBusy(false);}
  };
  const visibleFields=fields.filter(field=>!field.when||field.when(values));
  return <SettingsSection title={title} description={description} icon={icon}>
    <form onSubmit={async event=>{
      event.preventDefault();
      const allowed=Object.fromEntries(visibleFields.map(field=>[field.key,String(values[field.key]||field.options?.[0]||'')]));
      const ok=await backend.perform(async()=>{
        const result=await api(`/settings/account/${kind==='profile'?'profile':'requisites'}`,'PUT',allowed);
        if(kind==='requisites'){setStatus(result.status);setReviewComment('');}
      });
      if(ok)setSaved(true);
    }}>
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
        {visibleFields.map(field=>{
          const options=field.key==='vat'&&values.vat==='20%'?[{value:'20%',label:'20% (ранее сохранено)'},...field.options]:field.options;
          return <div key={field.key} className={field.wide?'min-w-0 md:col-span-2':'min-w-0'}><SettingField label={field.label}>
            {options?<CustomSelect className="mt-2" options={options} value={values[field.key]||field.options[0]} onChange={value=>change(field.key,value)} />
              :['legalAddress','registrationAddress'].includes(field.key)?<AddressInput className={settingInputClass} value={values[field.key]||''} onChange={value=>change(field.key,value)} />
              :<input className={settingInputClass} value={values[field.key]||''} maxLength={field.maxLength||500} onChange={event=>change(field.key,event.target.value)} />}
          </SettingField>{kind==='requisites'&&field.key==='inn'&&<><button type="button" className="mt-2 text-sm font-medium text-[#006bff] hover:text-[#0b3558] disabled:opacity-50" disabled={registryBusy||![10,12].includes(String(values.inn||'').replace(/\D/g,'').length)} onClick={fillFromRegistry}>{registryBusy?'Поиск…':'Заполнить по ИНН'}</button>{registryMessage&&<p role="status" className="mt-1 text-xs text-[#476788]">{registryMessage}</p>}</>}</div>;
        })}
      </div>
      {note&&<div className="mt-6 rounded-lg border border-dashed border-[#0b3558] bg-[#f8f9fb] p-5 text-sm leading-6 text-[#476788]">{typeof note==='function'?note(values):note}</div>}
      {statusLabel&&<div className="mt-5 flex flex-col justify-between gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 md:flex-row md:items-center">
        <div><div className="text-sm font-medium text-[#0b3558]">Статус реквизитов: {{pending:'на проверке',verified:'подтверждены',rejected:'отклонены'}[status]||'не отправлены'}</div><div className="mt-1 text-xs text-[#476788]">{status==='rejected'&&reviewComment?reviewComment:'До подтверждения можно готовить запрос выплаты, но нельзя отправить его в обработку.'}</div></div>
        <Badge color={{pending:'amber',verified:'green',rejected:'red'}[status]||'gray'}>{{pending:'проверка',verified:'подтверждены',rejected:'отклонены'}[status]||'черновик'}</Badge>
      </div>}
      <div className="mt-6 flex justify-end"><Button variant="primary" type="submit" disabled={!loaded||backend.busy}>{submitLabel}</Button></div>
      {saved&&<p role="status" className="mt-3 text-right text-sm text-emerald-700">{kind==='profile'?'Профиль сохранён.':'Реквизиты отправлены на проверку.'}</p>}
    </form>
  </SettingsSection>;
};

const NotificationChannelToggle = ({ label, defaultEnabled = false }) => {
  const [enabled, setEnabled] = useState(defaultEnabled);
  return (
    <button
      type="button"
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${enabled ? 'border-[#006bff] bg-[#e6f0ff] text-[#004eba]' : 'border-[#d4e0ed] bg-[#f8f9fb] text-[#476788] hover:bg-white'}`}
      onClick={() => setEnabled((value) => !value)}
      aria-pressed={enabled}
    >
      {label}
    </button>
  );
};

const AccountSecuritySettings = () => {
  const backend = useBackend();
  const [passwords,setPasswords] = useState({current:'',next:'',confirm:''});
  const [sessions,setSessions] = useState(null);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  useEffect(()=>{let active=true;api('/auth/sessions').then(rows=>{if(active)setSessions(rows);}).catch(()=>{if(active)setError('Не удалось загрузить сеансы.');});return()=>{active=false;};},[]);
  const changePassword = async e => {
    e.preventDefault();setMessage('');setError('');
    if(passwords.next!==passwords.confirm){setError('Новый пароль и подтверждение не совпадают.');return;}
    const ok=await backend.perform(async()=>{
      await api('/auth/password','POST',{currentPassword:passwords.current,newPassword:passwords.next});
    });
    if(ok){setPasswords({current:'',next:'',confirm:''});setSessions([{current:true}]);setMessage('Пароль изменён. Другие сеансы завершены.');}
  };
  return <SettingsSection title="Безопасность" description="" icon={Lock}>
    <form onSubmit={changePassword} className="space-y-4">
      <SettingField label="Текущий пароль"><input required autoComplete="current-password" type="password" className={settingInputClass} value={passwords.current} onChange={e=>{setMessage('');setPasswords({...passwords,current:e.target.value});}} /></SettingField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SettingField label="Новый пароль" className="min-w-0"><input required minLength={12} maxLength={128} autoComplete="new-password" type="password" className={settingInputClass} placeholder="Минимум 12 символов" value={passwords.next} onChange={e=>{setMessage('');setPasswords({...passwords,next:e.target.value});}} /></SettingField>
        <SettingField label="Подтверждение пароля" className="min-w-0"><input required minLength={12} maxLength={128} autoComplete="new-password" type="password" className={settingInputClass} value={passwords.confirm} onChange={e=>{setMessage('');setPasswords({...passwords,confirm:e.target.value});}} /></SettingField>
      </div>
      <div className="flex justify-end"><Button variant="primary" type="submit" disabled={backend.busy}>Сменить пароль</Button></div>
    </form>
    <div className="mt-6 border-t border-[#d4e0ed] pt-5">
      <TwoFactorSettings />
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#d4e0ed] pt-5">
      <div><div className="text-sm font-medium text-[#0b3558]">Сеансы аккаунта</div><p className="mt-1 text-xs text-[#476788]">{sessions===null?'Загрузка…':`Других активных сеансов: ${sessions.filter(s=>!s.current).length}`}</p></div>
      <Button variant="secondary" size="sm" disabled={backend.busy || !sessions?.some(s=>!s.current)} onClick={async()=>{
        setMessage('');setError('');
        const ok=await backend.perform(()=>api('/auth/sessions/revoke-others','POST',{}));
        if(ok){setSessions(sessions.filter(s=>s.current));setMessage('Другие сеансы завершены.');}
      }}>Завершить другие сеансы</Button>
    </div>
    {message && <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
  </SettingsSection>;
};

const TwoFactorSettings = () => {
  const backend=useBackend();
  const [enabled,setEnabled]=useState(false),[action,setAction]=useState(null);
  const [password,setPassword]=useState(''),[code,setCode]=useState('');
  const [setup,setSetup]=useState(null),[backupCodes,setBackupCodes]=useState([]);
  useEffect(()=>{let active=true;api('/auth/two-factor').then(data=>{if(active)setEnabled(data.enabled);}).catch(error=>backend.setError(error.message));return()=>{active=false;};},[]);
  const close=()=>{setAction(null);setPassword('');setCode('');setSetup(null);setBackupCodes([]);};
  const submit=()=>backend.perform(async()=>{
    if(action==='disable'){await api('/auth/two-factor/disable','POST',{password,code});setEnabled(false);close();return;}
    if(!setup){setSetup(await api('/auth/two-factor/setup','POST',{password}));setPassword('');return;}
    const result=await api('/auth/two-factor/enable','POST',{code});setEnabled(true);setBackupCodes(result.backupCodes);setSetup(null);setCode('');
  });
  return <div className="min-w-0"><SettingField label="Двухфакторная защита"><CustomSelect className="mt-2" options={['Отключена','Код на почту','Приложение-аутентификатор']} value={enabled?'Приложение-аутентификатор':'Отключена'} onChange={value=>{if(value==='Код на почту'){backend.setError('Подтверждение по почте еще не подключено.');return;}if((value==='Отключена')===!enabled)return;setAction(value==='Отключена'?'disable':'enable');}} /></SettingField>
    <Modal isOpen={Boolean(action)} onClose={close} title={backupCodes.length?'Резервные коды':action==='disable'?'Отключить двухфакторную защиту':'Настроить двухфакторную защиту'} className="max-w-md">
      {backupCodes.length?<><div className="grid grid-cols-2 gap-2 font-mono text-sm">{backupCodes.map(value=><div key={value} className="rounded-lg border border-[#d4e0ed] p-2">{value}</div>)}</div><p className="mt-4 text-sm text-[#476788]">Каждый код действует один раз. Сохраните коды для входа при потере доступа к аутентификатору.</p><Button className="mt-5 w-full" variant="primary" onClick={close}>Готово</Button></>:<form className="space-y-4" onSubmit={event=>{event.preventDefault();submit();}}>
        {!setup&&<SettingField label="Текущий пароль"><input type="password" required autoComplete="current-password" className={settingInputClass} value={password} onChange={event=>setPassword(event.target.value)} /></SettingField>}
        {setup&&<><img className="mx-auto h-48 w-48" src={setup.qr} alt="QR-код аутентификатора" /><div className="flex min-w-0 items-center gap-2"><input className={`${settingInputClass} min-w-0 flex-1 font-mono text-xs`} readOnly aria-label="Ключ аутентификатора" value={setup.secret} /><CopyButton value={setup.secret} label="Скопировать ключ" /></div></>}
        {(setup||action==='disable')&&<SettingField label="Код аутентификатора или резервный код"><input required autoComplete="one-time-code" className={settingInputClass} value={code} onChange={event=>setCode(event.target.value)} /></SettingField>}
        <div className="flex justify-end gap-3"><Button type="button" variant="secondary" onClick={close}>Отмена</Button><Button type="submit" variant={action==='disable'?'danger':'primary'} disabled={backend.busy}>{action==='disable'?'Отключить':setup?'Подтвердить':'Продолжить'}</Button></div>
      </form>}
    </Modal>
  </div>;
};

const OrderLimitsSettings = () => {
  const backend=useBackend();
  const [value,setValue]=useState(backend.data.limits.orderLimit===null?'':String(backend.data.limits.orderLimit/100));
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState('');
  return <SettingsSection title="Лимиты и согласования" description="Контроль автоприемки для крупных заказов." icon={CreditCard}>
    <form onSubmit={async e=>{
      e.preventDefault();setSaved(false);setError('');
      const normalized=value.replace(/[\s₽]/g,'').replace(',','.');
      if(normalized && !/^\d+(\.\d{1,2})?$/.test(normalized)){setError('Укажите сумму в рублях.');return;}
      const orderLimit=normalized?Math.round(Number(normalized)*100):null;
      const ok=await backend.perform(async()=>{await api('/settings/limits','PUT',{orderLimit,autoAccept:false});await backend.refresh();});
      if(ok)setSaved(true);
    }}>
      <SettingField label="Лимит автоприемки, ₽"><input inputMode="decimal" className={settingInputClass} value={value} placeholder="Без лимита" onChange={e=>{setValue(e.target.value);setSaved(false);setError('');}} /></SettingField>
      <div className="mt-4"><SettingField label="Автоприёмка"><CustomSelect className="mt-2" options={['Выключена', 'Через 72 часа без жалобы']} /></SettingField></div>
      <Button type="submit" variant="primary" className="mt-5 w-full" disabled={backend.busy}>{backend.busy?'Сохранение…':'Сохранить лимиты'}</Button>
      {saved && <p role="status" className="mt-3 text-sm text-emerald-700">Лимиты сохранены</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </form>
  </SettingsSection>;
};

const NotificationsSettingsBlock = ({ events }) => {
  const [editing, setEditing] = useState(false);

  return (
    <SettingsSection
      title="Уведомления"
      description={editing ? 'Выберите события и каналы доставки.' : ''}
      icon={Bell}
    >
      {editing ? (
        <div className="ui-enter">
          <div className="space-y-3">
            {events.map(([label, email, telegram]) => (
              <div key={label} className="rounded-lg border border-[#d4e0ed] bg-white p-3">
                <label className="flex items-start gap-2 text-sm font-medium text-[#0b3558]">
                  <input type="checkbox" className="mt-1" defaultChecked />
                  <span>{label}</span>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <NotificationChannelToggle label="Email" defaultEnabled={Boolean(email)} />
                  <NotificationChannelToggle label="Telegram" defaultEnabled={Boolean(telegram)} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-sm font-semibold text-[#0b3558]">Telegram не подключен</div>
                <div className="text-xs text-[#476788] mt-1">После подключения станет доступна доставка уведомлений в Telegram.</div>
              </div>
              <Button variant="secondary" className="w-full">Подключить Telegram</Button>
            </div>
          </div>
          <Button variant="primary" className="w-full mt-4" onClick={() => setEditing(false)}>Сохранить</Button>
        </div>
      ) : (
        <div className="ui-enter">
          <div className="space-y-2">
            {events.map(([label, email, telegram]) => {
              const channels = [email && 'Email', telegram && 'Telegram'].filter(Boolean).join(', ');
              return (
                <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-[#d4e0ed] bg-white px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#0b3558] truncate">{label}</div>
                    <div className="text-xs text-[#476788] mt-0.5">{channels || 'каналы не выбраны'}</div>
                  </div>
                  <Badge color={channels ? 'blue' : 'gray'}>{channels ? 'включено' : 'выключено'}</Badge>
                </div>
              );
            })}
          </div>
          <Button variant="secondary" className="w-full mt-4" onClick={() => setEditing(true)}>Редактировать</Button>
        </div>
      )}
    </SettingsSection>
  );
};

const TeamAccessSettingsBlock = ({ description, members }) => {
  const backend=useBackend();
  const [editing, setEditing] = useState(false);
  const [team,setTeam]=useState({members:[],pending:[]});
  const [email,setEmail]=useState('');
  const [inviteRole,setInviteRole]=useState('admin');
  const [inviteLink,setInviteLink]=useState('');
  const [saved,setSaved]=useState(false);
  const roleNames:Record<string,string>=backend.user.role==='admin'?{admin:'Администратор',moderator:'Модератор',superadmin:'Суперадминистратор'}:{admin:'Администратор',content:backend.user.role==='publisher'?'Публикации':'Материалы',finance:backend.user.role==='publisher'?'Выплаты':'Финансы',viewer:'Только просмотр'};
  const roleByName=Object.fromEntries(Object.entries(roleNames).map(([key,label])=>[label,key]));
  const reload=()=>api('/team').then(setTeam).catch(error=>backend.setError(error.message));
  useEffect(()=>{reload();},[]);
  const rows=[...team.members.map(item=>({...item,status:'активен',color:'green'})),...team.pending.map(item=>({...item,status:'ожидает принятия',color:'amber'}))];

  const updateRole=async(item,value)=>{
    if(item.status!=='активен')return;
    const nextRole=roleByName[value]??null;
    const ok=await backend.perform(()=>api(`/team/members/${item.id}`,'PATCH',{teamRole:nextRole}));
    if(ok){setSaved(true);await reload();}
  };

  const invite=async()=>{
    const ok=await backend.perform(async()=>{
      const result=await api('/team/invitations','POST',{email,teamRole:inviteRole});
      setInviteLink(`${location.origin}/?invite=${encodeURIComponent(result.token)}`);
      setEmail('');await reload();
    });
    if(ok)setSaved(true);
  };

  return (
    <SettingsSection
      title={backend.user.role==='admin'?'Администраторы':'Доступы команды'}
      description={editing ? description : ''}
      icon={ShieldCheck}
    >
      {editing ? (
        <div className="ui-enter">
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-sm font-semibold text-[#0b3558]">Пригласить по email</div>
            <div className="mt-3 space-y-3">
              <input type="email" className="w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="name@company.ru" value={email} onChange={event=>setEmail(event.target.value)} />
              <CustomSelect options={Object.values(roleNames)} value={roleNames[inviteRole]} onChange={value=>setInviteRole(roleByName[value])} />
              <Button variant="primary" className="w-full" disabled={!email.trim()||backend.busy} onClick={invite}><Plus className="h-4 w-4" /> Создать приглашение</Button>
            </div>
            <p className="text-xs text-[#476788] mt-3">Передайте сотруднику ссылку для входа и создания пароля.</p>
            {inviteLink&&<div className="mt-3 flex min-w-0 items-center gap-2"><input readOnly aria-label="Ссылка приглашения" className="min-w-0 flex-1 rounded-lg border border-[#d4e0ed] bg-white px-3 py-2 text-xs" value={inviteLink}/><CopyButton value={inviteLink} label="Скопировать приглашение" /></div>}
          </div>
          <div className="mt-5 space-y-3">
            {rows.map(item => (
              <div key={item.id} className="rounded-lg border border-[#d4e0ed] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#0b3558] truncate">{item.email}</div>
                    <div className="text-xs text-[#476788] mt-1 truncate">{roleNames[item.team_role]}</div>
                  </div>
                  <Badge color={item.color}>{item.status}</Badge>
                </div>
                <div className="mt-3">
                  {item.status==='активен'?<CustomSelect options={[...Object.values(roleNames),'Без доступа']} value={roleNames[item.team_role]} onChange={value=>updateRole(item,value)} />:<Button variant="secondary" size="sm" onClick={async()=>{const ok=await backend.perform(()=>api(`/team/invitations/${item.id}`,'DELETE'));if(ok)await reload();}}>Отозвать приглашение</Button>}
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" className="w-full mt-4" onClick={() => setEditing(false)}>Готово</Button>
        </div>
      ) : (
        <div className="ui-enter">
          <div className="space-y-2">
            {rows.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#d4e0ed] bg-white px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#0b3558] truncate">{item.email}</div>
                  <div className="text-xs text-[#476788] mt-0.5 truncate">{roleNames[item.team_role]}</div>
                </div>
                <Badge color={item.color}>{item.status}</Badge>
              </div>
            ))}
          </div>
          {!rows.length&&<p className="text-sm text-[#476788]">Сотрудников пока нет.</p>}
          <Button variant="secondary" className="w-full mt-4" onClick={() => setEditing(true)}>Редактировать</Button>
        </div>
      )}
    </SettingsSection>
  );
};

const TeamMemberSettingsView = () => <div className="max-w-3xl space-y-6">
  <h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки аккаунта</h1>
  <AccountSecuritySettings />
</div>;

const ClientSettingsView = () => {
  const backend=useBackend();
  if(backend.user.teamRole)return <TeamMemberSettingsView />;
  const legalDocumentsSection = (
    <AccountFieldsPanel title="Юридические данные и документы" description="Используются в счетах, отчетах и проверках рекламодателя для маркировки." icon={FileText} kind="requisites" submitLabel="Сохранить документы"
      note={values=>values.payerStatus==='Физическое лицо'?'Физлицо заполняет паспортные данные и адрес регистрации, чтобы платформа могла подготовить договор и закрывающие документы.':'Юрлицо заполняет реквизиты компании, налоговый режим и параметры ЭДО для счетов, отчетов и договоров.'}
      fields={[
        {key:'payerStatus',label:'Статус плательщика',options:['Юридическое лицо','Физическое лицо']},
        {key:'inn',label:'ИНН',when:v=>v.payerStatus!=='Физическое лицо'},
        {key:'kpp',label:'КПП',when:v=>v.payerStatus!=='Физическое лицо'},
        {key:'ogrn',label:'ОГРН',when:v=>v.payerStatus!=='Физическое лицо'},
        {key:'vat',label:'НДС',options:['22%','УСН + НДС 5%','Без НДС','УСН'],when:v=>v.payerStatus!=='Физическое лицо'},
        {key:'legalAddress',label:'Юридический адрес',wide:true,when:v=>v.payerStatus!=='Физическое лицо'},
        {key:'documentFlow',label:'Документооборот',options:['ЭДО: Диадок','ЭДО: СБИС','Бумажные оригиналы'],when:v=>v.payerStatus!=='Физическое лицо'},
        {key:'edoId',label:'Идентификатор оператора ЭДО',when:v=>v.payerStatus!=='Физическое лицо'},
        {key:'personName',label:'ФИО',when:v=>v.payerStatus==='Физическое лицо'},
        {key:'personInn',label:'ИНН физлица',when:v=>v.payerStatus==='Физическое лицо'},
        {key:'birthDate',label:'Дата рождения',when:v=>v.payerStatus==='Физическое лицо'},
        {key:'snils',label:'СНИЛС',when:v=>v.payerStatus==='Физическое лицо'},
        {key:'passport',label:'Паспортные данные',wide:true,when:v=>v.payerStatus==='Физическое лицо'},
        {key:'registrationAddress',label:'Адрес регистрации',wide:true,when:v=>v.payerStatus==='Физическое лицо'},
        {key:'personDocumentFlow',label:'Документооборот',options:['Электронная подпись','Бумажные оригиналы','Через представителя'],when:v=>v.payerStatus==='Физическое лицо'},
        {key:'taxStatus',label:'Налоговый статус',options:['Физическое лицо','Самозанятый','ИП'],when:v=>v.payerStatus==='Физическое лицо'},
      ]} />
  );

  return (
  <div className="space-y-6 max-w-6xl">
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки заказчика</h1>
      <p className="text-sm text-[#476788] mt-1">Профиль компании, безопасность, уведомления и данные для финансовых документов.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <AccountFieldsPanel title="Профиль аккаунта" description="Эти данные видят только команда платформы и ваши сотрудники." icon={Briefcase} kind="profile" submitLabel="Сохранить профиль" fields={[
          {key:'company',label:'Название компании'},
          {key:'responsible',label:'Ответственный'},
          {key:'workEmail',label:'Рабочий почта'},
          {key:'phone',label:'Телефон'},
          {key:'timezone',label:'Часовой пояс',options:['Москва, UTC+3','Екатеринбург, UTC+5','Новосибирск, UTC+7']},
          {key:'language',label:'Язык интерфейса',options:['Русский','English']},
        ]} />

        <AccountSecuritySettings />

        {legalDocumentsSection}
      </div>

      <div className="space-y-6">
        <NotificationsSettingsBlock
          events={[
            ['Публикация загружена площадкой', true, true],
            ['Площадка запросила правки', true, false],
            ['Баланс ниже лимита', true, true],
            ['Новый документ или отчет', true, false],
            ['Открыта жалоба или спор', true, true],
          ]}
        />

        <TeamAccessSettingsBlock
          description="Кто может загружать материалы, пополнять баланс и принимать размещения."
          members={[
            ['Анна Морозова', 'anna@fintech.ru', 'Владелец', 'активен', 'green'],
            ['Пиар-менеджер', 'pr@fintech.ru', 'Материалы', 'активен', 'green'],
            ['Бухгалтерия', 'finance@fintech.ru', 'Финансы', 'приглашение отправлено', 'amber'],
          ]}
        />

        <OrderLimitsSettings />
      </div>
    </div>
  </div>
  );
};

const PublisherSettingsView = () => {
  const backend=useBackend();
  if(backend.user.teamRole)return <TeamMemberSettingsView />;
  return (
  <div className="space-y-6 max-w-6xl">
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки паблишера</h1>
      <p className="text-sm text-[#476788] mt-1">Профиль редакции, безопасность, выплаты, уведомления и правила обработки заказов.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <AccountFieldsPanel title="Профиль редакции" description="Данные аккаунта владельца площадок и основного контактного лица." icon={Store} kind="profile" submitLabel="Сохранить профиль" fields={[
          {key:'legalName',label:'Юридическое название'},
          {key:'responsibleEditor',label:'Ответственный редактор'},
          {key:'orderEmail',label:'Почта для заказов'},
          {key:'phone',label:'Телефон'},
          {key:'workingHours',label:'Рабочие часы'},
          {key:'autoReply',label:'Автоответ при новых заявках',options:['Выключен','Включен: заявка получена']},
        ]} />

        <AccountSecuritySettings />

        <AccountFieldsPanel title="Реквизиты выплат" description={`Сюда платформа перечисляет выплаты после приемки заказов и удержания комиссии ${backend.data.commission.commissionBps/100}%.`} icon={CreditCard} kind="requisites" statusLabel submitLabel="Отправить реквизиты на проверку"
          note={values=>values.payeeStatus==='Физическое лицо'?'Физлицо заполняет паспортные данные, счет и налоговый статус, чтобы платформа могла подготовить договор и выплаты.':'Юрлицо заполняет реквизиты компании, налоговый режим и параметры ЭДО для выплат, отчетов и закрывающих документов.'}
          fields={[
            {key:'payeeStatus',label:'Статус получателя',options:['Юридическое лицо','Физическое лицо']},
            {key:'paymentSchedule',label:'График выплат',options:['1 раз в месяц','2 раза в месяц','По запросу после проверки']},
            {key:'recipient',label:'Получатель',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'inn',label:'ИНН',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'kpp',label:'КПП',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'ogrn',label:'ОГРН',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'account',label:'Расчетный счет',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'bank',label:'Банк',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'bik',label:'БИК',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'vat',label:'НДС',options:['22%','УСН + НДС 5%','Без НДС','УСН'],when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'legalAddress',label:'Юридический адрес',wide:true,when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'documentFlow',label:'Документооборот',options:['ЭДО: Диадок','ЭДО: СБИС','Бумажные оригиналы'],when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'edoId',label:'Идентификатор оператора ЭДО',when:v=>v.payeeStatus!=='Физическое лицо'},
            {key:'personName',label:'ФИО',when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'personInn',label:'ИНН физлица',when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'birthDate',label:'Дата рождения',when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'snils',label:'СНИЛС',when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'personBank',label:'Банк',when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'personBik',label:'БИК',when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'personAccount',label:'Номер счета',wide:true,when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'passport',label:'Паспортные данные',wide:true,when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'registrationAddress',label:'Адрес регистрации',wide:true,when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'taxStatus',label:'Налоговый статус',options:['Физическое лицо','Самозанятый','ИП'],when:v=>v.payeeStatus==='Физическое лицо'},
            {key:'personDocumentFlow',label:'Документооборот',options:['Электронная подпись','Бумажные оригиналы','Через представителя'],when:v=>v.payeeStatus==='Физическое лицо'},
          ]} />
      </div>

      <div className="space-y-6">
        <NotificationsSettingsBlock
          events={[
            ['Новая заявка', true, true],
            ['Дедлайн публикации сегодня', true, true],
            ['Заказчик запросил правки', true, false],
            ['Открыта жалоба или спор', true, true],
            ['Выплата одобрена', true, false],
          ]}
        />

        <SettingsSection title="Правила заказов" description="Как редакция принимает заявки и управляет публикацией." icon={ShieldCheck}>
          <div className="space-y-4">
            <SettingField label="Срок ответа на заявку"><CustomSelect className="mt-2" options={['8 часов', '24 часа', '2 рабочих дня']} /></SettingField>
            <SettingField label="Срок публикации"><CustomSelect className="mt-2" options={['1 день', '2 дня', '3 дня', '4 дня', '5 дней', '6 дней']} /></SettingField>
            <SettingField label="Заявки в выходные"><CustomSelect className="mt-2" options={['Принимать, но считать дедлайн с понедельника', 'Не принимать']} /></SettingField>
          </div>
          <Button variant="primary" className="w-full mt-5">Сохранить правила</Button>
        </SettingsSection>

        <TeamAccessSettingsBlock
          description="Кто может принимать заказы, вести чат, загружать публикации и управлять выплатами."
          members={[
            ['Главный редактор', 'editor@publisher.ru', 'Администратор', 'активен', 'green'],
            ['Выпускающий редактор', 'release@publisher.ru', 'Публикации', 'активен', 'green'],
            ['Бухгалтерия', 'finance@publisher.ru', 'Выплаты', 'приглашение отправлено', 'amber'],
          ]}
        />

        <SettingsSection title="Документы" description="Договоры, отчеты и закрывающие документы паблишера." icon={FileText}>
          <div className="space-y-3">
            {[
              ['Договор-оферта', 'подписан'],
              ['Отчет за октябрь', 'ожидает'],
              ['Карточка компании', 'проверена'],
            ].map(([name, status]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border border-[#d4e0ed] p-3">
                <span className="text-sm text-[#0b3558]">{name}</span>
                <Badge color="gray">{status}</Badge>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4 w-full"><Download className="h-4 w-4" /> Скачать архив</Button>
        </SettingsSection>
      </div>
    </div>
  </div>
  );
};

const publisherApplicationStatusColor = {
  'Новая': 'blue',
  'На проверке': 'amber',
  'Нужны данные': 'amber',
  'Одобрена': 'green',
  'Отклонена': 'red',
};

const publisherAccountStatusColor = {
  'Не создан': 'gray',
  'Приглашение создано': 'blue',
  'Активен': 'green',
  'Заблокирован': 'red',
};

const AdminPublisherApplicationsView = ({ applications, onOpenApplication, onCreateApplication }) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualDraft, setManualDraft] = useState({
    platform: '',
    platformType: 'Онлайн-СМИ',
    legalName: '',
    inn: '',
    applicant: '',
    email: '',
  });

  const filteredApplications = applications.filter((application) => {
    const source = `${application.number} ${application.id} ${application.platform} ${application.legalName} ${application.applicant} ${application.email}`.toLowerCase();
    return source.includes(query.trim().toLowerCase())
      && (!statusFilter || statusFilter === 'Все статусы' || application.status === statusFilter)
      && (!typeFilter || typeFilter === 'Все типы' || application.platformType === typeFilter);
  });

  const createManualApplication = () => {
    if (!manualDraft.platform.trim() || !manualDraft.legalName.trim() || !manualDraft.email.trim()) return;
    onCreateApplication({
      applicant: manualDraft.applicant,
      position: '',
      email: manualDraft.email,
      phone: '',
      relation: '',
      platform: manualDraft.platform,
      platformType: manualDraft.platformType,
      platformUrl: '',
      legalName: manualDraft.legalName,
      inn: manualDraft.inn,
      theme: '',reach:'',comment:'',
    });
    setManualOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">Заявки паблишеров</h1>
          <p className="mt-1 text-sm text-[#476788]">Ручная проверка площадки и представителя до выдачи доступа к кабинету.</p>
        </div>
        <Button variant="primary" onClick={() => setManualOpen(true)}><Plus className="h-4 w-4" /> Создать паблишера</Button>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_230px_230px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a6bbd1]" />
            <input
              className="h-[42px] w-full rounded-lg border border-[#476788] bg-white pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Заявка, площадка, юрлицо или контакт"
            />
          </label>
          <CustomSelect
            placeholder="Статус заявки"
            value={statusFilter}
            onChange={setStatusFilter}
            options={['Все статусы', 'Новая', 'На проверке', 'Нужны данные', 'Одобрена', 'Отклонена']}
          />
          <CustomSelect
            placeholder="Тип площадки"
            value={typeFilter}
            onChange={setTypeFilter}
            options={['Все типы', 'Онлайн-СМИ', 'Telegram-канал', 'Паблик ВК', 'Канал в MAX', 'Канал в Дзене', 'Сайт']}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full divide-y divide-[#d4e0ed]">
            <thead className="bg-[#f8f9fb]">
              <tr>
                {['Заявка / дата', 'Площадка', 'Заявитель', 'Владелец', 'Статус заявки', 'Кабинет'].map((label) => (
                  <th key={label} className="px-5 py-4 text-left text-xs font-medium uppercase text-[#476788]">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4e0ed]">
              {filteredApplications.map((application) => (
                <tr
                  key={application.id}
                  className="cursor-pointer transition-colors hover:bg-[#f8fbff]"
                  onClick={() => onOpenApplication(application.id)}
                >
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-[#006bff]">№{application.number}</div>
                    <div className="mt-1 text-xs text-[#476788]">{application.submittedAt}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="max-w-[230px] truncate text-sm font-semibold text-[#0b3558]">{application.platform}</div>
                    <div className="mt-1 text-xs text-[#476788]">{application.platformType}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-[#0b3558]">{application.applicant}</div>
                    <div className="mt-1 max-w-[220px] truncate text-xs text-[#476788]">{application.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="max-w-[240px] truncate text-sm text-[#0b3558]">{application.legalName}</div>
                    <div className="mt-1 text-xs text-[#476788]">ИНН {application.inn}</div>
                  </td>
                  <td className="px-5 py-4"><Badge color={publisherApplicationStatusColor[application.status]}>{application.status}</Badge></td>
                  <td className="px-5 py-4"><Badge color={publisherAccountStatusColor[application.accountStatus]}>{application.accountStatus}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredApplications.length && (
          <div className="px-6 py-14 text-center">
            <Store className="mx-auto h-8 w-8 text-[#a6bbd1]" />
            <div className="mt-3 text-sm font-semibold text-[#0b3558]">Заявки не найдены</div>
            <div className="mt-1 text-sm text-[#476788]">Измените запрос или параметры фильтра.</div>
          </div>
        )}
      </Card>

      <Modal isOpen={manualOpen} onClose={() => setManualOpen(false)} title="Создать паблишера" className="max-w-2xl">
        <div className="space-y-5">
          <div className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm leading-6 text-[#476788]">
            После создания проверьте данные заявки. Ссылку для доступа можно будет создать после одобрения.
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              ['Название площадки', 'platform', 'Investor.ru'],
              ['Юридическое лицо', 'legalName', 'ООО «Инвестор Медиа»'],
              ['ИНН', 'inn', '7701000000'],
              ['Контактное лицо', 'applicant', 'Анна Смирнова'],
              ['Рабочая почта', 'email', 'partner@investor.ru'],
            ].map(([label, key, placeholder]) => (
              <label key={key} className={key === 'email' ? 'sm:col-span-2' : ''}>
                <span className="text-sm font-medium text-[#476788]">{label}</span>
                <input
                  className="mt-2 h-[42px] w-full rounded-lg border border-[#476788] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]"
                  value={manualDraft[key]}
                  onChange={(event) => setManualDraft({ ...manualDraft, [key]: event.target.value })}
                  placeholder={placeholder}
                />
              </label>
            ))}
            <label className="sm:col-span-2">
              <span className="text-sm font-medium text-[#476788]">Тип площадки</span>
              <CustomSelect className="mt-2" value={manualDraft.platformType} onChange={(platformType) => setManualDraft({ ...manualDraft, platformType })} options={['Онлайн-СМИ', 'Telegram-канал', 'Паблик ВК', 'Канал в MAX', 'Канал в Дзене', 'Сайт']} />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setManualOpen(false)}>Отмена</Button>
            <Button variant="primary" disabled={!manualDraft.platform.trim() || !manualDraft.legalName.trim() || !manualDraft.email.trim()} onClick={createManualApplication}>Создать заявку</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const AdminPublisherApplicationDetailView = ({ application, navigate, onUpdateApplication, onInvite, onDelete }) => {
  const [comment, setComment] = useState(application?.decisionComment || '');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(application?.email || '');
  const [inviteLink,setInviteLink]=useState('');

  useEffect(() => {
    setComment(application?.decisionComment || '');
    setInviteEmail(application?.email || '');
  }, [application?.id]);

  if (!application) {
    return <div className="py-20 text-center text-sm text-[#476788]">Заявка не найдена.</div>;
  }

  const update = (patch) => onUpdateApplication(application.id, patch);
  const toggleCheck = (key) => update({
    checks: { ...application.checks, [key]: !application.checks[key] },
    status: application.status === 'Новая' ? 'На проверке' : application.status,
  });
  const approveReady = Object.values(application.checks).every(Boolean);
  const makeDecision = (status) => {
    if (['Нужны данные', 'Отклонена'].includes(status) && !comment.trim()) return;
    update({ status, decisionComment: comment });
  };
  const sendInvite = async () => {
    const token=await onInvite(application.id);
    if(token){setInviteLink(`${location.origin}/?invite=${encodeURIComponent(token)}`);setInviteOpen(false);}
  };

  const checkItems = [
    ['resource', 'Ресурс существует', 'Ссылка открывается, название и тип площадки совпадают с анкетой.'],
    ['legal', 'Юрлицо существует', 'Наименование и ИНН подтверждены по открытым данным.'],
    ['representative', 'Представитель подтвержден', 'Контакт связан с владельцем, редакцией или официальным представителем.'],
    ['duplicate', 'Дубли не обнаружены', 'Паблишер и площадка не заведены в системе повторно.'],
  ];
  const verifiedCount = Object.values(application.checks).filter(Boolean).length;
  const DetailField = ({ label, children }) => (
    <div className="grid grid-cols-[minmax(110px,0.42fr)_minmax(0,0.58fr)] items-start gap-4 border-b border-[#e6edf5] py-3.5 last:border-b-0">
      <dt className="text-xs leading-5 text-[#6b86a4]">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-semibold leading-5 text-[#0b3558]">{children || 'Не указано'}</dd>
    </div>
  );

  return (
    <div className="space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_publisher_applications')}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К заявкам
      </button>

      <div className="flex flex-col gap-4 border-b border-[#d4e0ed] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">Заявка №{application.number}</h1>
            <Badge color={publisherApplicationStatusColor[application.status]}>{application.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-[#476788]">{application.platform} · поступила {application.submittedAt}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6b86a4]">Кабинет паблишера</span>
          <Badge color={publisherAccountStatusColor[application.accountStatus]}>{application.accountStatus}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Данные заявки</h2>
                <p className="mt-1 text-sm text-[#476788]">Контакт, площадка и юридическое лицо из анкеты.</p>
              </div>
              <span className="text-xs font-medium text-[#6b86a4]">№{application.number}</span>
            </div>
            <div>
              <section className="p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef5ff] text-[#006bff]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b3558]">Заявитель</h3>
                    <p className="mt-0.5 text-xs text-[#6b86a4]">Представитель паблишера</p>
                  </div>
                </div>
                <dl className="mt-4">
                  <DetailField label="Имя">{application.applicant}</DetailField>
                  <DetailField label="Должность">{application.position}</DetailField>
                  <DetailField label="Рабочая почта">{application.email}</DetailField>
                  <DetailField label="Телефон">{application.phone}</DetailField>
                  <DetailField label="Связь с площадкой">{application.relation}</DetailField>
                </dl>
              </section>

              <section className="border-t border-[#d4e0ed] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef5ff] text-[#006bff]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b3558]">Площадка и владелец</h3>
                    <p className="mt-0.5 text-xs text-[#6b86a4]">Данные ресурса и правообладателя</p>
                  </div>
                </div>
                <dl className="mt-4">
                  <DetailField label="Название">{application.platform}</DetailField>
                  <DetailField label="Тип">{application.platformType}</DetailField>
                  <DetailField label="Ссылка">
                    {application.platformUrl ? (
                      <a className="inline-flex max-w-full items-center justify-end gap-1.5 text-[#006bff] hover:underline" href={application.platformUrl} target="_blank" rel="noreferrer">
                        {application.platformUrl}<ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : 'Не указано'}
                  </DetailField>
                  <DetailField label="Юридическое лицо">{application.legalName}</DetailField>
                  <DetailField label="ИНН">{application.inn}</DetailField>
                  <DetailField label="Аудитория">{application.reach}</DetailField>
                  <DetailField label="Тематика">{application.theme}</DetailField>
                </dl>
              </section>
            </div>
            {application.comment && (
              <div className="border-t border-[#d4e0ed] bg-[#f8fbff] px-6 py-4">
                <div className="text-xs font-semibold uppercase text-[#6b86a4]">Комментарий заявителя</div>
                <p className="mt-2 text-sm leading-6 text-[#476788]">{application.comment}</p>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold">Проверка заявки</h2>
                <p className="mt-1 text-sm text-[#476788]">Отметьте только подтвержденные пункты.</p>
              </div>
              <Badge color={approveReady ? 'green' : 'blue'}>{verifiedCount} из {checkItems.length}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-px bg-[#d4e0ed] md:grid-cols-2">
              {checkItems.map(([key, title, description]) => (
                <button key={key} type="button" className="flex min-h-[112px] w-full items-start gap-4 bg-white px-6 py-5 text-left transition-colors hover:bg-[#f8fbff]" onClick={() => toggleCheck(key)}>
                  <span className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border transition-colors ${application.checks[key] ? 'border-[#006bff] bg-[#006bff] text-white' : 'border-[#a6bbd1] bg-white text-transparent'}`}><Check className="h-4 w-4" /></span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#0b3558]">{title}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#476788]">{description}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-6">
          <Card className="overflow-hidden">
            <div className="border-b border-[#d4e0ed] px-6 py-5">
              <h2 className="font-display text-lg font-bold">Решение по заявке</h2>
              <p className="mt-1 text-sm text-[#476788]">Комментарий обязателен только при запросе данных или отказе.</p>
            </div>
            <div className="p-6">
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Комментарий модератора</span>
                <textarea
                  className="mt-2 min-h-[120px] w-full resize-y rounded-lg border border-[#476788] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Укажите, какие данные нужно дополнить или причину отказа"
                />
              </label>
              {!approveReady && (
                <div className="mt-4 flex gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8fbff] p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none text-[#006bff]" />
                  <p className="text-xs leading-5 text-[#476788]">До одобрения осталось подтвердить {checkItems.length - verifiedCount} {checkItems.length - verifiedCount === 1 ? 'пункт' : 'пункта'}.</p>
                </div>
              )}
              <div className="mt-5 grid gap-3">
                <Button variant="primary" disabled={!approveReady} onClick={() => makeDecision('Одобрена')}>Одобрить заявку</Button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <Button variant="secondary" disabled={!comment.trim()} onClick={() => makeDecision('Нужны данные')}>Запросить данные</Button>
                  <Button variant="danger" disabled={!comment.trim() || application.accountStatus === 'Активен' || application.status === 'Отклонена'} onClick={() => makeDecision('Отклонена')}>Отклонить</Button>
                </div>
              </div>
            </div>

            {application.status === 'Одобрена' && (
              <div className="border-t border-[#d4e0ed] bg-[#f8fbff] p-6">
                <h3 className="font-display text-base font-bold">Доступ паблишера</h3>
              {application.accountStatus === 'Не создан' && (
                <>
                  <p className="mt-2 text-sm leading-6 text-[#476788]">Создайте ссылку для доступа владельца к кабинету.</p>
                  <Button className="mt-5 w-full" variant="primary" onClick={() => setInviteOpen(true)}>Создать приглашение</Button>
                </>
              )}
              {application.accountStatus === 'Приглашение создано' && (
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                    <div className="text-xs text-[#476788]">Приглашение создано</div>
                    <div className="mt-1 break-all text-sm font-semibold">{application.email}</div>
                  </div>
                  {inviteLink&&<div className="flex min-w-0 items-center gap-2"><input readOnly aria-label="Ссылка приглашения паблишера" className="min-w-0 flex-1 rounded-lg border border-[#d4e0ed] bg-white px-3 py-2 text-xs" value={inviteLink}/><CopyButton value={inviteLink} label="Скопировать приглашение" /></div>}
                  <Button className="w-full" variant="secondary" onClick={sendInvite}>Создать новую ссылку</Button>
                </div>
              )}
              {application.accountStatus === 'Активен' && (
                <div className="mt-4 rounded-xl border border-[#b7ebca] bg-[#effcf4] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#15803d]"><CheckCircle2 className="h-4 w-4" /> Кабинет активен</div>
                  <p className="mt-2 text-xs leading-5 text-[#476788]">Владелец принял приглашение и задал пароль.</p>
                </div>
              )}
              </div>
            )}
          </Card>
          <Button variant="danger" className="mt-4 w-full" onClick={() => setDeleteOpen(true)}>Удалить заявку</Button>
        </aside>
      </div>

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Удалить заявку" className="max-w-md">
        <p className="text-sm text-[#476788]">Заявка №{application.number} исчезнет из рабочего списка. Решения и аудит сохранятся; приглашение перестанет действовать. Уже созданный кабинет останется доступен.</p>
        <div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setDeleteOpen(false)}>Отмена</Button><Button variant="danger" onClick={async () => {if(await onDelete(application.id)){setDeleteOpen(false);navigate('admin_publisher_applications');}}}>Удалить заявку</Button></div>
      </Modal>
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Создать кабинет паблишера" className="max-w-2xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">Организация</div><div className="mt-1 text-sm font-semibold">{application.legalName}</div></div>
            <div className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">Первая площадка</div><div className="mt-1 text-sm font-semibold">{application.platform}</div></div>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Почта владельца кабинета</span>
            <input type="email" readOnly className="mt-2 h-[42px] w-full rounded-lg border border-[#476788] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={inviteEmail} />
          </label>
          <div className="rounded-xl border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm leading-6 text-[#476788]">
            Пароль не задается администратором. Скопируйте ссылку после создания и передайте ее владельцу площадки.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setInviteOpen(false)}>Отмена</Button>
            <Button variant="primary" disabled={!inviteEmail.trim()} onClick={sendInvite}>Создать ссылку</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const informerStatusColor = {
  'Черновик': 'gray',
  'Запланирован': 'blue',
  'Опубликован': 'green',
  'Приостановлен': 'amber',
  'Завершен': 'gray',
};

const AdminInformerEditorPage = ({
  editingId,
  draft,
  setDraft,
  validDraft,
  validTargetUrl,
  selectionOptions,
  selectedContent,
  iconMap,
  accentMap,
  onBack,
  onSave,
  onPublish,
  onPause,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const mockCatalog=useBackend().data.outlets.filter(o=>o.status==='approved'&&o.active);
  const [pendingSelectionIds, setPendingSelectionIds] = useState([]);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerType, setPickerType] = useState(undefined);
  const [pickerTheme, setPickerTheme] = useState(undefined);
  const [pickerRegion, setPickerRegion] = useState(undefined);
  const PreviewIcon = iconMap[draft.icon] || FileText;
  const usesPlatformPicker = draft.format === 'Подборка площадок';
  const selectedPackagePlatforms = mockCatalog.filter((platform) => (draft.selectionIds || []).includes(String(platform.id)));
  const packageBaseTotal = selectedPackagePlatforms.reduce((total, platform) => total + platform.price, 0);
  const displayWithoutEndDate = draft.endsAt === 'Без срока';
  const startDateValue = toDateInputValue(draft.startsAt);
  const endDateValue = toDateInputValue(draft.endsAt);
  const invalidDateRange = Boolean(startDateValue && endDateValue && endDateValue < startDateValue);
  const filteredPlatforms = mockCatalog.filter((platform) => {
    const matchesQuery = `${platform.name} ${platform.type} ${platform.theme} ${platform.region}`.toLowerCase().includes(pickerQuery.trim().toLowerCase());
    const matchesType = !pickerType || pickerType === 'Все типы' || platform.type === pickerType;
    const matchesTheme = !pickerTheme || pickerTheme === 'Все тематики' || platform.theme === pickerTheme;
    const matchesRegion = matchesGeographyFilter(platform.region, pickerRegion);
    return matchesQuery && matchesType && matchesTheme && matchesRegion;
  });

  const openPicker = () => {
    setPendingSelectionIds([...(draft.selectionIds || [])]);
    setPickerQuery('');
    setPickerType(undefined);
    setPickerTheme(undefined);
    setPickerRegion(undefined);
    setPickerOpen(true);
  };
  const togglePendingPlatform = (platformId) => {
    const value = String(platformId);
    setPendingSelectionIds((current) => current.includes(value)
      ? current.filter((id) => id !== value)
      : [...current, value]);
  };
  const applyPlatformSelection = () => {
    setDraft({ ...draft, selectionIds: pendingSelectionIds });
    setPickerOpen(false);
  };
  const changeFormat = (format) => {
    setDraft({
      ...draft,
      format,
      selectionIds: [],
      packagePrice: '',
      targetUrl: '',
      target: format === 'Внешняя ссылка' ? 'Внешняя ссылка' : 'Каталог',
    });
  };

  return (
    <div className="space-y-6">
      <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-[#476788] hover:text-[#0b3558]" onClick={onBack}>
        <ChevronRight className="h-4 w-4 rotate-180" /> К информеру
      </button>

      <div className="flex flex-col gap-4 border-b border-[#d4e0ed] pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">{editingId ? 'Редактировать карточку' : 'Новая карточка информера'}</h1>
            <Badge color={informerStatusColor[draft.status]}>{draft.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-[#476788]">Настройте содержание, состав подборки и период показа в кабинете заказчика.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {editingId && draft.status === 'Опубликован' && <Button variant="secondary" onClick={onPause}>Приостановить</Button>}
          <Button variant="secondary" disabled={!validDraft} onClick={onSave}>Сохранить</Button>
          <Button variant="primary" disabled={!validDraft} onClick={onPublish}>Опубликовать</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold text-[#0b3558]">Содержание карточки</h2>
              <p className="mt-1 text-sm text-[#476788]">Основной текст и оформление информера.</p>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label><span className="text-sm font-medium text-[#476788]">Формат</span><CustomSelect className="mt-2" value={draft.format} onChange={changeFormat} options={['Подборка площадок', 'Внешняя ссылка']} /></label>
                <label><span className="text-sm font-medium text-[#476788]">Статус</span><CustomSelect className="mt-2" value={draft.status} onChange={(status) => setDraft({ ...draft, status })} options={['Черновик', 'Запланирован', 'Опубликован', 'Приостановлен', 'Завершен']} /></label>
              </div>
              {[
                ['Подзаголовок', 'eyebrow', 32],
                ['Заголовок', 'title', 70],
                ['Текст', 'text', 150],
                ['Текст кнопки', 'action', 36],
              ].map(([label, key, limit]) => (
                <label key={key} className="block">
                  <span className="flex items-center justify-between gap-3 text-sm font-medium text-[#476788]"><span>{label}</span><span className="text-xs">{draft[key].length} / {limit}</span></span>
                  {key === 'text' ? (
                    <textarea className="mt-2 min-h-[100px] w-full resize-y rounded-lg border border-[#476788] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" maxLength={limit} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
                  ) : (
                    <input className="mt-2 h-[42px] w-full rounded-lg border border-[#476788] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" maxLength={limit} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
                  )}
                </label>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold text-[#0b3558]">Состав карточки</h2>
              <p className="mt-1 text-sm leading-5 text-[#476788]">
                {draft.format === 'Внешняя ссылка'
                  ? 'Добавьте любую целевую ссылку, которая откроется по кнопке информера.'
                  : 'Сформируйте подборку площадок. При необходимости укажите единую стоимость предложения.'}
              </p>
            </div>

            {draft.format === 'Внешняя ссылка' ? (
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Целевая ссылка</span>
                <input
                  type="url"
                  className={`mt-2 h-[48px] w-full rounded-lg border bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] ${draft.targetUrl && !validTargetUrl ? 'border-[#dc2626]' : 'border-[#476788]'}`}
                  value={draft.targetUrl || ''}
                  onChange={(event) => setDraft({ ...draft, targetUrl: event.target.value, target: 'Внешняя ссылка' })}
                  placeholder="https://example.ru/page"
                />
                <span className="mt-2 block text-xs text-[#476788]">Можно указать статью, новость, подборку, страницу акции или другой внешний ресурс.</span>
                {draft.targetUrl && !validTargetUrl && <span className="mt-2 block text-xs text-[#dc2626]">Укажите полную ссылку, начинающуюся с http:// или https://</span>}
              </label>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8fbff] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[#0b3558]">{selectedContent.length ? `Выбрано площадок: ${selectedContent.length}` : 'Площадки не выбраны'}</div>
                    <div className="mt-1 text-xs text-[#476788]">Используйте поиск и фильтры в отдельном окне.</div>
                  </div>
                  <Button variant="secondary" onClick={openPicker}><Filter className="h-4 w-4" /> Выбрать площадки</Button>
                </div>
                {selectedContent.length > 0 && (
                  <div className="divide-y divide-[#d4e0ed] overflow-hidden rounded-lg border border-[#d4e0ed]">
                    {selectedContent.map((option) => (
                      <div key={option.value} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0"><div className="truncate text-sm font-medium text-[#0b3558]">{option.label}</div><div className="mt-0.5 truncate text-xs text-[#476788]">{option.description}</div></div>
                        <button type="button" className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-[#476788] hover:bg-[#f8f9fb]" onClick={() => setDraft({ ...draft, selectionIds: draft.selectionIds.filter((id) => id !== option.value) })} aria-label={`Убрать ${option.label}`}><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-[#d4e0ed] bg-white p-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-[#476788]">Стоимость по прайсу</div>
                      <div className="mt-2 text-xl font-semibold tabular-nums text-[#0b3558]">{formatMoney(packageBaseTotal)}</div>
                      <div className="mt-1 text-xs text-[#476788]">Сумма цен выбранных площадок.</div>
                    </div>
                    <label>
                      <span className="text-xs font-medium text-[#476788]">Единая цена подборки</span>
                      <div className="relative mt-2">
                        <input
                          type="number"
                          min="1"
                          step="1000"
                          className="h-[42px] w-full rounded-lg border border-[#476788] px-4 pr-10 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#006bff]"
                          value={draft.packagePrice || ''}
                          onChange={(event) => setDraft({ ...draft, packagePrice: event.target.value })}
                          placeholder="Например, 320000"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#476788]">₽</span>
                      </div>
                      <span className="mt-1 block text-xs text-[#476788]">Необязательно. Оставьте поле пустым, если действует обычный прайс.</span>
                    </label>
                  </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-5">
              <h2 className="font-display text-lg font-bold text-[#0b3558]">Показ и оформление</h2>
              <p className="mt-1 text-sm text-[#476788]">Переход, визуальный акцент и период публикации.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {draft.format === 'Подборка площадок' && <label><span className="text-sm font-medium text-[#476788]">Переход</span><CustomSelect className="mt-2" value={draft.target} onChange={(target) => setDraft({ ...draft, target })} options={['Каталог', 'Карточка площадки']} /></label>}
              <label><span className="text-sm font-medium text-[#476788]">Иконка</span><CustomSelect className="mt-2" value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} options={informerIconOptions} /></label>
              <label><span className="text-sm font-medium text-[#476788]">Цветовой акцент</span><CustomSelect className="mt-2" value={draft.accent} onChange={(accent) => setDraft({ ...draft, accent })} options={informerAccentOptions} /></label>
              <label>
                <span className="text-sm font-medium text-[#476788]">Начало показа</span>
                <input
                  type="date"
                  className="mt-2 h-[42px] w-full rounded-lg border border-[#476788] px-4 text-sm"
                  value={startDateValue}
                  onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
                />
                <span className="mt-1 block text-xs text-[#476788]">Карточка станет доступна с начала выбранного дня.</span>
              </label>
              <div>
                <label>
                  <span className="text-sm font-medium text-[#476788]">Окончание показа</span>
                  <input
                    type="date"
                    min={startDateValue || undefined}
                    disabled={displayWithoutEndDate}
                    className={`mt-2 h-[42px] w-full rounded-lg border px-4 text-sm disabled:bg-[#f1f4f8] disabled:text-[#7d96af] ${invalidDateRange ? 'border-[#dc2626]' : 'border-[#476788]'}`}
                    value={endDateValue}
                    onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
                  />
                </label>
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-[#476788]">
                  <input
                    type="checkbox"
                    checked={displayWithoutEndDate}
                    onChange={(event) => setDraft({ ...draft, endsAt: event.target.checked ? 'Без срока' : startDateValue || '' })}
                    className="h-4 w-4 rounded border-[#8badcf] accent-[#006bff]"
                  />
                  Показывать без ограничения по дате
                </label>
                {invalidDateRange && <span className="mt-1 block text-xs text-[#dc2626]">Дата окончания не может быть раньше даты начала.</span>}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <div className="sticky top-6">
            <div className="mb-3 text-xs font-semibold uppercase text-[#476788]">Предпросмотр</div>
            <Card className="flex h-[400px] flex-col overflow-hidden bg-[#f8fbff]">
              <div className="border-b border-[#d4e0ed] px-5 py-4"><h2 className="font-display text-lg font-bold">Актуальное</h2><p className="mt-1 text-xs text-[#476788]">Предложения и новости платформы</p></div>
              <div className="grid flex-1 grid-rows-[48px_116px_1fr] gap-y-3 p-5">
                <div className="flex min-w-0 items-center gap-3"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentMap[draft.accent]}`}><PreviewIcon className="h-6 w-6" /></div><div className="truncate text-xs font-bold uppercase text-[#006bff]">{draft.eyebrow || 'Подзаголовок'}</div></div>
                <div><h3 className="line-clamp-2 font-display text-xl font-bold leading-7">{draft.title || 'Заголовок карточки'}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[#476788]">{draft.text || 'Краткое описание предложения или новости.'}</p></div>
                <div className="flex items-end"><Button variant="primary" className="w-full">{draft.action || 'Подробнее'}<ArrowRight className="h-4 w-4" /></Button></div>
              </div>
            </Card>
            {!validDraft && <div className="mt-3 rounded-lg bg-[#fff4df] px-4 py-3 text-xs leading-5 text-[#7a4a00]">Заполните текстовые поля и настройте состав карточки, чтобы сохранить или опубликовать ее.</div>}
          </div>
        </div>
      </div>

      <Modal isOpen={pickerOpen && usesPlatformPicker} onClose={() => setPickerOpen(false)} title="Выбрать площадки" className="max-w-6xl">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a6bbd1]" />
            <input className="h-[48px] w-full rounded-lg border border-[#476788] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} placeholder="Название площадки" />
          </label>
          <CustomSelect placeholder="Тип" value={pickerType} onChange={setPickerType} options={['Все типы', ...new Set(mockCatalog.map((platform) => platform.type))]} />
          <CustomSelect placeholder="Тематика" value={pickerTheme} onChange={setPickerTheme} options={['Все тематики', ...new Set(mockCatalog.map((platform) => platform.theme))]} />
          <CustomSelect placeholder="География" value={pickerRegion} onChange={setPickerRegion} options={regionFilterOptions} />
        </div>

        <div className="mt-5 max-h-[430px] overflow-y-auto rounded-lg border border-[#d4e0ed]">
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(0,1.5fr)_120px_130px_130px_130px] gap-4 border-b border-[#d4e0ed] bg-[#f8f9fb] px-4 py-3 text-xs font-medium uppercase text-[#476788]">
            <span>Площадка</span><span>Тип</span><span>Тематика</span><span>Регион</span><span>Цена</span>
          </div>
          <div className="divide-y divide-[#d4e0ed]">
            {filteredPlatforms.map((platform) => {
              const selected = pendingSelectionIds.includes(String(platform.id));
              return (
                <button
                  key={platform.id}
                  type="button"
                  className={`grid w-full grid-cols-[minmax(0,1.5fr)_120px_130px_130px_130px] items-center gap-4 px-4 py-3 text-left transition-colors ${selected ? 'bg-[#e8f1ff]' : 'hover:bg-[#f8fbff]'}`}
                  onClick={() => togglePendingPlatform(platform.id)}
                >
                  <span className="flex min-w-0 items-center gap-3"><span className={`flex h-5 w-5 flex-none items-center justify-center rounded border ${selected ? 'border-[#006bff] bg-[#006bff] text-white' : 'border-[#8badcf] bg-white'}`}>{selected && <Check className="h-3.5 w-3.5" />}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#0b3558]">{platform.name}</span></span></span>
                  <span className="text-sm text-[#476788]">{platform.type}</span>
                  <span className="text-sm text-[#476788]">{platform.theme}</span>
                  <span className="text-sm text-[#476788]">{platform.region}</span>
                  <span className="text-sm font-semibold tabular-nums text-[#0b3558]">{formatMoney(platform.price)}</span>
                </button>
              );
            })}
            {filteredPlatforms.length === 0 && <div className="px-5 py-12 text-center text-sm text-[#476788]">По заданным фильтрам площадки не найдены.</div>}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[#d4e0ed] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-[#0b3558]">Выбрано площадок: {pendingSelectionIds.length}</div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setPendingSelectionIds([])}>Сбросить</Button>
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>Отмена</Button>
            <Button variant="primary" onClick={applyPlatformSelection}>Применить выбор</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const AdminInformerView = ({ items, onChangeItems }) => {
  const backend=useBackend();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [formatFilter, setFormatFilter] = useState(undefined);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const emptyDraft = {
    format: 'Подборка площадок',
    eyebrow: '',
    title: '',
    text: '',
    action: '',
    target: 'Каталог',
    icon: 'store',
    accent: 'blue',
    status: 'Черновик',
    startsAt: new Date().toLocaleDateString('ru-RU'),
    endsAt: 'Без срока',
    selectionIds: [],
    packagePrice: '',
    targetUrl: '',
  };
  const [draft, setDraft] = useState(emptyDraft);

  const iconMap = informerIconMap;
  const accentMap = informerAccentMap;
  const filteredItems = items.filter((item) => (
    `${item.id} ${item.title} ${item.eyebrow}`.toLowerCase().includes(query.trim().toLowerCase())
    && (!statusFilter || statusFilter === 'Все статусы' || item.status === statusFilter)
    && (!formatFilter || formatFilter === 'Все форматы' || getInformerFormat(item) === formatFilter)
  ));
  const PreviewIcon = iconMap[draft.icon] || FileText;
  const selectionOptions = getInformerSelectionOptions(draft.format, backend.data.outlets.filter(o=>o.status==='approved'&&o.active));
  const selectedContent = selectionOptions.filter((option) => (draft.selectionIds || []).includes(option.value));
  const requiresSelection = draft.format === 'Подборка площадок';
  const validTargetUrl = draft.format !== 'Внешняя ссылка' || /^https?:\/\/\S+$/i.test(draft.targetUrl || '');
  const validPackagePrice = !String(draft.packagePrice || '').trim() || Number(draft.packagePrice) > 0;
  const startDateValue = toDateInputValue(draft.startsAt);
  const endDateValue = toDateInputValue(draft.endsAt);
  const validDisplayPeriod = Boolean(startDateValue && (draft.endsAt === 'Без срока' || (endDateValue && endDateValue >= startDateValue)));
  const validDraft = Boolean(
    draft.eyebrow.trim()
    && draft.title.trim()
    && draft.text.trim()
    && draft.action.trim()
    && (!requiresSelection || selectedContent.length > 0)
    && validTargetUrl
    && validPackagePrice
    && validDisplayPeriod
  );

  const openEditor = (item = null) => {
    setEditingId(item?.id || null);
    setDraft(item
      ? { selectionIds: [], packagePrice: '', targetUrl: '', ...item, format: getInformerFormat(item) }
      : { ...emptyDraft, selectionIds: [], packagePrice: '', targetUrl: '' });
    setEditorOpen(true);
  };
  const saveItem = async (status = draft.status) => {
    if (!validDraft) return;
    const nextItem = {
      ...draft,
      id: editingId || crypto.randomUUID(),
      status,
      updatedAt: new Date().toLocaleString('ru-RU'),
    };
    const saved=await onChangeItems((currentItems) => editingId
      ? currentItems.map((item) => item.id === editingId ? nextItem : item)
      : [nextItem, ...currentItems]);
    if(saved)setEditorOpen(false);
  };
  const pauseItem = async () => {
    if (!editingId) return;
    if(await onChangeItems((currentItems) => currentItems.map((item) => item.id === editingId ? { ...item, status: 'Приостановлен', updatedAt: new Date().toLocaleString('ru-RU') } : item)))setEditorOpen(false);
  };

  if (editorOpen) {
    return (
      <AdminInformerEditorPage
        editingId={editingId}
        draft={draft}
        setDraft={setDraft}
        validDraft={validDraft}
        validTargetUrl={validTargetUrl}
        selectionOptions={selectionOptions}
        selectedContent={selectedContent}
        iconMap={iconMap}
        accentMap={accentMap}
        onBack={() => setEditorOpen(false)}
        onSave={() => saveItem(draft.status)}
        onPublish={() => saveItem('Опубликован')}
        onPause={pauseItem}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Информер заказчика</h1>
          <p className="mt-1 text-sm text-[#476788]">Управление предложениями и материалами в сводке кабинета заказчика.</p>
        </div>
        <Button variant="primary" onClick={() => openEditor()}><Plus className="h-4 w-4" /> Создать карточку</Button>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_230px_230px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a6bbd1]" />
            <input className="h-[42px] w-full rounded-lg border border-[#476788] pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, заголовок или подзаголовок" />
          </label>
          <CustomSelect placeholder="Формат" value={formatFilter} onChange={setFormatFilter} options={['Все форматы', 'Подборка площадок', 'Внешняя ссылка']} />
          <CustomSelect placeholder="Статус" value={statusFilter} onChange={setStatusFilter} options={['Все статусы', 'Черновик', 'Запланирован', 'Опубликован', 'Приостановлен', 'Завершен']} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full divide-y divide-[#d4e0ed]">
            <thead className="bg-[#f8f9fb]">
              <tr>{['Формат', 'Карточка', 'CTA', 'Период', 'Статус', 'Обновлено'].map((label) => <th key={label} className="px-5 py-4 text-left text-xs font-medium uppercase text-[#476788]">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#d4e0ed]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="cursor-pointer hover:bg-[#f8fbff]" onClick={() => openEditor(item)}>
                  <td className="px-5 py-4"><div className="text-sm font-semibold">{getInformerFormat(item)}</div><div className="mt-1 text-xs text-[#476788]">{item.id}</div></td>
                  <td className="px-5 py-4"><div className="max-w-[320px] truncate text-sm font-semibold">{item.title}</div><div className="mt-1 max-w-[320px] truncate text-xs text-[#476788]">{item.eyebrow}</div></td>
                  <td className="px-5 py-4"><div className="max-w-[210px] truncate text-sm">{item.action}</div><div className="mt-1 text-xs text-[#476788]">{item.target}</div></td>
                  <td className="px-5 py-4 text-sm text-[#476788]">{formatInformerDate(item.startsAt)}<div className="mt-1 text-xs">{item.endsAt === 'Без срока' ? 'без ограничения' : `до ${formatInformerDate(item.endsAt)}`}</div></td>
                  <td className="px-5 py-4"><Badge color={informerStatusColor[item.status]}>{item.status}</Badge></td>
                  <td className="px-5 py-4 text-sm text-[#476788]">{item.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={editorOpen} onClose={() => setEditorOpen(false)} title={editingId ? 'Редактировать карточку' : 'Новая карточка информера'} className="max-w-6xl">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label><span className="text-sm font-medium text-[#476788]">Категория</span><CustomSelect className="mt-2" value={draft.category} onChange={(category) => setDraft({
                ...draft,
                category,
                selectionIds: [],
                targetUrl: '',
                target: category === 'Полезное' ? 'База знаний' : 'Каталог',
              })} options={['Новинки', 'Пакеты', 'Скидки', 'Полезное']} /></label>
              <label><span className="text-sm font-medium text-[#476788]">Статус</span><CustomSelect className="mt-2" value={draft.status} onChange={(status) => setDraft({ ...draft, status })} options={['Черновик', 'Запланирован', 'Опубликован', 'Приостановлен', 'Завершен']} /></label>
            </div>
            {[
              ['Подзаголовок', 'eyebrow', 32],
              ['Заголовок', 'title', 70],
              ['Текст', 'text', 150],
              ['Текст кнопки', 'action', 36],
            ].map(([label, key, limit]) => (
              <label key={key} className="block">
                <span className="flex items-center justify-between gap-3 text-sm font-medium text-[#476788]"><span>{label}</span><span className="text-xs">{draft[key].length} / {limit}</span></span>
                {key === 'text' ? (
                  <textarea className="mt-2 min-h-[100px] w-full resize-y rounded-lg border border-[#476788] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" maxLength={limit} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
                ) : (
                  <input className="mt-2 h-[42px] w-full rounded-lg border border-[#476788] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" maxLength={limit} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
                )}
              </label>
            ))}
            <div className="border-t border-[#d4e0ed] pt-5">
              <div className="mb-4">
                <h3 className="font-display text-base font-bold text-[#0b3558]">Состав карточки</h3>
                <p className="mt-1 text-sm leading-5 text-[#476788]">
                  {draft.category === 'Полезное'
                    ? 'Добавьте любую целевую ссылку, которая откроется по кнопке информера.'
                    : draft.category === 'Пакеты'
                      ? 'Выберите один или несколько готовых пакетов, которые увидит заказчик.'
                      : `Выберите площадки для подборки «${draft.category}».`}
                </p>
              </div>

              {draft.category === 'Полезное' ? (
                <label className="block">
                  <span className="text-sm font-medium text-[#476788]">Целевая ссылка</span>
                  <input
                    type="url"
                    className={`mt-2 h-[48px] w-full rounded-lg border bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff] ${draft.targetUrl && !validTargetUrl ? 'border-[#dc2626]' : 'border-[#476788]'}`}
                    value={draft.targetUrl || ''}
                    onChange={(event) => setDraft({ ...draft, targetUrl: event.target.value, target: 'Внешняя ссылка' })}
                    placeholder="https://example.ru/page"
                  />
                  {draft.targetUrl && !validTargetUrl && <span className="mt-2 block text-xs text-[#dc2626]">Укажите полную ссылку, начинающуюся с http:// или https://</span>}
                </label>
              ) : (
                <div className="space-y-3">
                  <CheckboxMultiSelect
                    options={selectionOptions}
                    value={draft.selectionIds || []}
                    onChange={(selectionIds) => setDraft({ ...draft, selectionIds })}
                    placeholder={draft.category === 'Пакеты' ? 'Выберите пакеты' : 'Выберите площадки'}
                    selectedNoun={draft.category === 'Пакеты' ? 'пакетов' : 'площадок'}
                  />
                  {selectedContent.length > 0 && (
                    <div className="divide-y divide-[#d4e0ed] overflow-hidden rounded-lg border border-[#d4e0ed] bg-[#f8fbff]">
                      {selectedContent.map((option) => (
                        <div key={option.value} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[#0b3558]">{option.label}</div>
                            <div className="mt-0.5 truncate text-xs text-[#476788]">{option.description}</div>
                          </div>
                          <button
                            type="button"
                            className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-[#476788] hover:bg-white hover:text-[#0b3558]"
                            onClick={() => setDraft({ ...draft, selectionIds: draft.selectionIds.filter((id) => id !== option.value) })}
                            aria-label={`Убрать ${option.label}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedContent.length === 0 && <p className="text-xs text-[#b46b00]">Для публикации выберите хотя бы одну позицию.</p>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {draft.category !== 'Полезное' && <label><span className="text-sm font-medium text-[#476788]">Переход</span><CustomSelect className="mt-2" value={draft.target} onChange={(target) => setDraft({ ...draft, target })} options={['Каталог', 'Карточка площадки']} /></label>}
              <label><span className="text-sm font-medium text-[#476788]">Иконка</span><CustomSelect className="mt-2" value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} options={['store', 'briefcase', 'credit', 'file']} /></label>
              <label><span className="text-sm font-medium text-[#476788]">Акцент</span><CustomSelect className="mt-2" value={draft.accent} onChange={(accent) => setDraft({ ...draft, accent })} options={['blue', 'green', 'amber', 'violet']} /></label>
              <label><span className="text-sm font-medium text-[#476788]">Начало показа</span><input className="mt-2 h-[42px] w-full rounded-lg border border-[#476788] px-4 text-sm" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></label>
              <label className="sm:col-span-2"><span className="text-sm font-medium text-[#476788]">Окончание показа</span><input className="mt-2 h-[42px] w-full rounded-lg border border-[#476788] px-4 text-sm" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} /></label>
            </div>
          </div>

          <div>
            <div className="sticky top-0">
              <div className="mb-3 text-xs font-semibold uppercase text-[#476788]">Предпросмотр</div>
              <Card className="flex h-[400px] flex-col overflow-hidden bg-[#f8fbff]">
                <div className="border-b border-[#d4e0ed] px-5 py-4">
                  <h2 className="font-display text-lg font-bold">Актуальное</h2>
                  <p className="mt-1 text-xs text-[#476788]">Предложения и новости платформы</p>
                </div>
                <div className={`grid flex-1 gap-y-3 p-5 ${selectedContent.length ? 'grid-rows-[48px_92px_58px_1fr]' : 'grid-rows-[48px_116px_1fr]'}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${accentMap[draft.accent]}`}><PreviewIcon className="h-6 w-6" /></div>
                    <div className="truncate text-xs font-bold uppercase text-[#006bff]">{draft.eyebrow || 'Подзаголовок'}</div>
                  </div>
                  <div>
                    <h3 className="line-clamp-2 font-display text-xl font-bold leading-7">{draft.title || 'Заголовок карточки'}</h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#476788]">{draft.text || 'Краткое описание предложения или новости.'}</p>
                  </div>
                  {selectedContent.length > 0 && (
                    <div className="flex min-w-0 flex-wrap content-start gap-1.5 overflow-hidden">
                      {selectedContent.slice(0, 3).map((option) => (
                        <span key={option.value} className="max-w-full truncate rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#0b3558] ring-1 ring-[#d4e0ed]">{option.label}</span>
                      ))}
                      {selectedContent.length > 3 && <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#476788] ring-1 ring-[#d4e0ed]">+{selectedContent.length - 3}</span>}
                    </div>
                  )}
                  <div className="flex items-end"><Button variant="primary" className="w-full">{draft.action || 'Подробнее'}<ArrowRight className="h-4 w-4" /></Button></div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#d4e0ed] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>{editingId && draft.status === 'Опубликован' && <Button variant="secondary" onClick={pauseItem}>Приостановить</Button>}</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" disabled={!validDraft} onClick={() => saveItem(draft.status)}>Сохранить</Button>
            <Button variant="primary" disabled={!validDraft} onClick={() => saveItem('Опубликован')}>Опубликовать</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const AdminExpeditedModerationQueue = ({ navigate, onSelect }) => {
  const mockExpeditedModeration = useBackend().data.materials.filter(m=>m.apiStatus==='pending' && m.expedited).sort((a,b)=>a.submitted_at.localeCompare(b.submitted_at)).map(m=>({id:m.id,number:materialNumber(m),title:m.name,customer:m.owner_id,submittedAt:new Date(m.submitted_at).toLocaleString('ru-RU'),deadline:'Приоритетная проверка',row:[m.id,m.name,m.type,m.status,'Проверить']}));
  return (
  <Card className="overflow-hidden border-[#ffd98f]">
    <div className="flex items-center gap-3 border-b border-[#ffe3aa] bg-[#fff9ec] px-6 py-5">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#fff0c9] text-[#b46b00]">
        <Zap className="h-5 w-5" />
      </span>
      <h2 className="font-display text-base font-bold text-[#0b3558]">Ускоренная модерация</h2>
      <Badge color="amber">{mockExpeditedModeration.length} {new Intl.PluralRules('ru').select(mockExpeditedModeration.length)==='one'?'материал':new Intl.PluralRules('ru').select(mockExpeditedModeration.length)==='few'?'материала':'материалов'}</Badge>
    </div>
    <div className="divide-y divide-[#d4e0ed]">
      {mockExpeditedModeration.map((material) => (
        <button
          key={material.id}
          type="button"
          className="grid w-full gap-3 px-6 py-4 text-left transition-colors hover:bg-[#fffdf7] sm:grid-cols-[110px_minmax(0,1fr)_190px_24px] sm:items-center"
          onClick={() => onSelect
            ? onSelect('admin_moderation', material.row, 'admin_moderation_detail')
            : navigate('admin_moderation_detail')}
        >
          <span className="text-sm font-semibold text-[#006bff]">№{material.number}</span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[#0b3558]">{material.title}</span>
            <span className="mt-1 block text-xs text-[#476788]">Поступил {material.submittedAt}</span>
          </span>
          <span className="text-sm font-medium tabular-nums text-[#8a5700]">{material.deadline}</span>
          <ChevronRight className="h-4 w-4 text-[#6b86a4]" />
        </button>
      ))}
    </div>
  </Card>
); };

const AdminDashboardView = ({ navigate, onSelect }) => {
  const {data}=useBackend();
  const queue=[...data.materials.filter(m=>m.apiStatus==='pending'&&!m.expedited).map(m=>({id:m.id,number:`№${materialNumber(m)}`,object:m.name,type:'Материал',risk:'Обычный',status:m.status,color:'blue',section:'admin_moderation',route:'admin_moderation_detail'})),...data.orders.filter(o=>o.apiStatus==='disputed').map(o=>({id:o.id,number:`Спор №${o.dispute_number}`,object:o.material,type:'Спор',risk:'Требует решения',status:o.status,color:'amber',section:'admin_orders',route:'admin_dispute_detail'}))];
  return (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Материалы</div><div className="text-2xl font-semibold mt-2">{data.materials.length}</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Заказы в споре</div><div className="text-2xl font-semibold mt-2">{data.orders.filter(o=>o.apiStatus==='disputed').length}</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Резерв заказов</div><div className="text-2xl font-semibold mt-2">{formatMoney(data.orders.reduce((sum,o)=>sum+o.frozen,0))}</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Комиссия завершённых заказов</div><div className="text-2xl font-semibold mt-2">{formatMoney(data.orders.filter(o=>o.apiStatus==='completed').reduce((sum,o)=>sum+(o.amount-o.payout)/100,0))}</div></Card>
    </div>
    <AdminExpeditedModerationQueue navigate={navigate} onSelect={onSelect} />
    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb]"><h2 className="font-display text-base font-bold text-[#0b3558]">Операционная очередь</h2></div>
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]"><tr><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Номер</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Объект</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Риск</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th></tr></thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {queue.map(item => <tr key={item.id} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => onSelect(item.section,[item.id,item.object,item.type,item.status],item.route)}><td className="px-6 py-4 text-sm font-medium">{item.number}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.object}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.type}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.risk}</td><td className="px-6 py-4"><Badge color={item.color}>{item.status}</Badge></td></tr>)}
        </tbody>
      </table>
    </Card>
  </div>
);};

const AdminPlatformsCatalogView = ({ navigate, onSelect }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [regionFilter, setRegionFilter] = useState(undefined);
  const [themeFilter, setThemeFilter] = useState(undefined);
  const [formatFilter, setFormatFilter] = useState(undefined);
  const [aggregatorFilter, setAggregatorFilter] = useState(undefined);
  const [priceFilter, setPriceFilter] = useState(undefined);
  const [sortMode, setSortMode] = useState(undefined);
  const [exported, setExported] = useState(false);
  const adminPlatforms = mockCatalog.map((item, index) => ({
    ...item,
    adminId: index === 0 ? '#P-017' : index === 1 ? '#P-044' : index === 2 ? '#P-052' : index === 3 ? '#P-061' : '#P-078',
    publisher: index === 0 ? 'Редакция РБК Инвестиции' : index === 1 ? 'ООО «Технологии сегодня»' : index === 2 ? 'Редакция VC.ru' : index === 3 ? 'Код Дурова' : 'Бизнес Среда',
    adminStatus: index === 0 ? 'Активна' : index === 1 ? 'На проверке' : index === 2 ? 'Активна' : index === 3 ? 'Приостановлена' : 'Требуются правки',
  }));
  const filteredPlatforms = adminPlatforms
    .filter((item) => {
      const text = `${item.adminId} ${item.name} ${item.publisher} ${item.type} ${item.theme} ${item.region}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesType = !typeFilter || typeFilter === 'Все типы' || item.type === typeFilter;
      const matchesStatus = !statusFilter || statusFilter === 'Все статусы' || item.adminStatus === statusFilter;
      const matchesRegion = matchesGeographyFilter(item.region, regionFilter);
      const matchesTheme = !themeFilter || themeFilter === 'Любая тематика' || item.theme === themeFilter;
      const matchesFormat = !formatFilter || formatFilter === 'Все форматы' || item.formats.includes(formatFilter);
      const matchesAggregator = !aggregatorFilter || aggregatorFilter === 'Любые агрегаторы' || item.aggregators.includes(aggregatorFilter);
      const matchesPrice = !priceFilter || priceFilter === 'Любая цена'
        || (priceFilter === 'До 50 000 ₽' && item.price < 50000)
        || (priceFilter === '50 000-100 000 ₽' && item.price >= 50000 && item.price <= 100000)
        || (priceFilter === '100 000+ ₽' && item.price > 100000);
      return matchesQuery && matchesType && matchesStatus && matchesRegion && matchesTheme && matchesFormat && matchesAggregator && matchesPrice;
    })
    .sort((first, second) => {
      if (sortMode === 'Сначала дороже') return second.price - first.price;
      if (sortMode === 'Сначала дешевле') return first.price - second.price;
      if (sortMode === 'По названию') return first.name.localeCompare(second.name, 'ru');
      const priority = { 'На проверке': 0, 'Требуются правки': 1, 'Приостановлена': 2, 'Активна': 3 };
      return (priority[first.adminStatus] ?? 4) - (priority[second.adminStatus] ?? 4);
    });
  const openPlatform = (item) => {
    const row = [item.adminId, item.name, item.type, item.adminStatus, 'Проверить карточку'];
    onSelect ? onSelect('admin_platforms', row, 'admin_platform_detail') : navigate('admin_platform_detail');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">Площадки</h1>
          <p className="text-sm text-[#476788] mt-1">Каталог площадок с модерацией, статусами, фильтрами и административными действиями.</p>
        </div>
        <Button variant="secondary" onClick={() => setExported(true)}><Download className="h-4 w-4" /> {exported ? 'Экспорт готов' : 'Экспорт'}</Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6bbd1]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-[#476788] bg-white py-2.5 pl-10 pr-4 text-sm" placeholder="Поиск по названию, ID или паблишеру" />
          </div>
          <CustomSelect placeholder="Статус" options={['Все статусы', 'Активна', 'На проверке', 'Требуются правки', 'Приостановлена']} value={statusFilter} onChange={setStatusFilter} />
          <CustomSelect placeholder="Сортировка" options={['Сначала требуют внимания', 'Сначала дороже', 'Сначала дешевле', 'По названию']} value={sortMode} onChange={setSortMode} />
          <CustomSelect placeholder="Тип площадки" options={['Все типы', 'СМИ', 'ТГ-канал', 'Паблик ВК', 'Канал в MAX', 'Канал в Дзене']} value={typeFilter} onChange={setTypeFilter} />
          <CustomSelect placeholder="География" options={regionFilterOptions} value={regionFilter} onChange={setRegionFilter} />
          <CustomSelect placeholder="Тематика" options={['Любая тематика', 'Финансы', 'ИТ', 'Бизнес']} value={themeFilter} onChange={setThemeFilter} />
          <CustomSelect placeholder="Формат" options={placementFormatFilterOptions} value={formatFilter} onChange={setFormatFilter} />
          <CustomSelect placeholder="Агрегаторы" options={['Любые агрегаторы', 'Google News', 'Дзен', 'нет']} value={aggregatorFilter} onChange={setAggregatorFilter} />
          <CustomSelect placeholder="Цена" options={['Любая цена', 'До 50 000 ₽', '50 000-100 000 ₽', '100 000+ ₽']} value={priceFilter} onChange={setPriceFilter} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full table-fixed divide-y divide-[#d4e0ed]">
            <thead className="bg-[#f8f9fb]">
              <tr>
                <th className="w-[27%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Площадка</th>
                <th className="w-[9%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Тип</th>
                <th className="w-[12%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Статус</th>
                <th className="w-[12%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap" title="Для федеральных СМИ показывается общий рейтинг, для региональных и отраслевых — рейтинг по региону или отрасли.">Медиалогия <Info className="w-3.5 h-3.5 flex-shrink-0" /></span>
                </th>
                <th className="w-[16%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Агрегаторы</th>
                <th className="w-[14%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Охват</th>
                <th className="w-[10%] px-4 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Цена</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#d4e0ed]">
              {filteredPlatforms.length ? filteredPlatforms.map((item) => {
                const mediologyRank = ((item.id - 100) * 5) % 30 || 30;
                const statusColor = item.adminStatus === 'Активна' ? 'green' : item.adminStatus === 'На проверке' ? 'blue' : item.adminStatus === 'Приостановлена' ? 'gray' : 'amber';
                return (
                  <tr key={item.adminId} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => openPlatform(item)}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${item.logo}`}>
                          {item.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0b3558] truncate">{item.name}</div>
                          <div className="text-xs text-[#476788] truncate">{item.adminId} · {item.publisher}</div>
                          <div className="text-xs text-[#476788] truncate">{item.theme} · {item.region}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap"><Badge color="gray">{item.type}</Badge></td>
                    <td className="px-4 py-4 whitespace-nowrap"><Badge color={statusColor}>{item.adminStatus}</Badge></td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#0b3558]">#{mediologyRank}</div>
                      <div className="text-[11px] text-[#476788]">{item.region === 'Федеральный охват' ? 'общий' : 'по сегменту'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.aggregators.map((aggregator) => <Badge key={aggregator} color={aggregator === 'нет' ? 'gray' : 'blue'}>{aggregator}</Badge>)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-[#476788] truncate">{item.reach}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-[#0b3558] tabular-nums">{formatMoney(item.price)}</td>
                  </tr>
                );
              }) : (
                <tr><td className="px-6 py-10 text-sm text-[#476788] text-center" colSpan={7}>Площадки не найдены. Измените фильтры или строку поиска.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const AdminWorklistView = ({ section = 'admin_moderation', navigate, onSelect }) => {
  const backend = useBackend();
  const data = {...(mockAdminSections[section] || mockAdminSections.admin_moderation),rows:section==='admin_moderation'
    ? backend.data.materials.filter(m=>m.apiStatus==='pending'&&!m.expedited).map(m=>[m.id,m.name,m.type,m.status,'Проверить'])
    : section==='admin_orders' ? backend.data.orders.map(o=>[o.id,o.material,o.status,o.platform,'Открыть'])
    : section==='admin_payouts' ? backend.data.payouts.map(p=>[p.id,p.publisher_email,{pending:'На проверке',approved:'Ожидает перечисления',transferred:'Перечислена',returned:'Возвращена',rejected:'Отклонена'}[p.status],formatMoney(Number(p.amount)/100),p.status==='pending'?'Рассмотреть':'Открыть']) : []};
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Все статусы');
  const [userTypeFilter, setUserTypeFilter] = useState('Все типы');
  const [exported, setExported] = useState(false);
  const detailRoute = {
    admin_moderation: 'admin_moderation_detail',
    admin_orders: 'admin_order_detail',
    admin_users: 'admin_user_detail',
    admin_platforms: 'admin_platform_detail',
    admin_balances: 'admin_finance_detail',
    admin_operations: 'admin_finance_detail',
    admin_complaints: 'admin_dispute_detail',
    admin_payouts: 'admin_payout_detail',
    admin_advertisers: 'admin_advertiser_detail',
    admin_support: 'admin_ticket_detail',
    admin_documents: 'admin_document_detail',
    admin_audit: 'admin_audit_detail',
  }[section];
  const filteredRows = data.rows.filter((row) => {
    const publicNumber=section==='admin_orders'?backend.data.orders.find(o=>o.id===row[0])?.number:section==='admin_payouts'?backend.data.payouts.find(p=>p.id===row[0])?.number:section==='admin_moderation'?backend.data.materials.find(m=>m.id===row[0])?.number:'';
    const matchesQuery = `${publicNumber} ${row.join(' ')}`.toLowerCase().includes(query.trim().replace(/^[№#]\s*/, '').toLowerCase());
    const matchesUserType = section !== 'admin_users' || userTypeFilter === 'Все типы' || row[2] === userTypeFilter;
    const matchesStatus = section === 'admin_users'
      ? statusFilter === 'Все статусы' || row[3] === statusFilter
      : statusFilter === 'Все статусы'
      || (statusFilter === 'Требует действия' && !String(row[4]).match(/Открыть|Проверено|Завершено|Закрыто/))
      || (statusFilter === 'Завершено' && String(row.join(' ')).match(/Завершено|Закрыто|Выплачено|Проверен/))
      || (statusFilter === 'В работе' && String(row.join(' ')).match(/ожидает|провер|работ|актив/i));
    return matchesQuery && matchesUserType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">{data.title}</h1>
          <p className="text-sm text-[#476788] mt-1">Операционный раздел админки с отдельными действиями и подтверждениями.</p>
        </div>
        <Button variant="secondary" onClick={() => section==='admin_payouts'?downloadFromApi('/admin/payouts/export.csv'):setExported(true)}><Download className="h-4 w-4" /> {section==='admin_payouts'?'Экспорт':exported?'Экспорт готов':'Экспорт'}</Button>
      </div>
      <div className={`grid grid-cols-1 gap-3 ${section === 'admin_users' ? 'md:grid-cols-[1fr_190px_190px_190px]' : 'md:grid-cols-[1fr_220px_220px]'}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6bbd1]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-[#476788] bg-white py-2.5 pl-10 pr-4 text-sm" placeholder="Поиск по номеру, названию или участнику" />
        </div>
        {section === 'admin_users' && (
          <CustomSelect options={['Все типы', 'Паблишер', 'Заказчик']} value={userTypeFilter} onChange={setUserTypeFilter} />
        )}
        <CustomSelect
          options={section === 'admin_users'
            ? ['Все статусы', 'Активен', 'На проверке', 'Заблокирован']
            : ['Все статусы', 'Требует действия', 'В работе', 'Завершено']}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <CustomSelect options={['Сначала срочные', 'Сначала новые', 'Сначала старые']} />
      </div>
      {section === 'admin_moderation' && (
        <AdminExpeditedModerationQueue navigate={navigate} onSelect={onSelect} />
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]"><tr><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">{section==='admin_orders'?'Номер заказа':'Номер / объект'}</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">{section==='admin_orders'?'Материал':'Тип / сумма'}</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">{section==='admin_orders'?'Площадка':'Контекст'}</th><th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase">Действие</th></tr></thead>
          <tbody className="divide-y divide-[#d4e0ed]">
            {filteredRows.map((row) => (
              <tr key={row.join('-')} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => detailRoute && (onSelect ? onSelect(section, row, detailRoute) : navigate(detailRoute))}>
                <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{section==='admin_orders' ? `№${backend.data.orders.find(o=>o.id===row[0])?.number ?? '—'}` : section==='admin_payouts'?`W-${backend.data.payouts.find(p=>p.id===row[0])?.number??'—'}`:section==='admin_moderation'?`№${backend.data.materials.find(m=>m.id===row[0])?.number??'—'}`:row[0]}</td>
                <td className="px-6 py-4 text-sm text-[#476788]">{row[1]}</td>
                <td className="px-6 py-4"><Badge color={String(row[2]).includes('Удержание') || String(row[2]).includes('Риск') ? 'red' : 'blue'}>{row[2]}</Badge></td>
                <td className="px-6 py-4 text-sm text-[#476788]">{row[3]}</td>
                <td className="px-6 py-4 text-right text-sm text-[#006bff] font-medium">{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
      {filteredRows.length === 0 && <EmptyState title="Ничего не найдено" text="Измените строку поиска или выбранный статус." />}
    </div>
  );
};

const AdminOrderDetailView = ({ navigate, selection, orderId }) => {
  const backend=useBackend();
  const [result,setResult]=useState('');
  const order=backend.data.orders.find(o=>o.id===(orderId||selection?.row?.[0]));
  const fromUser=new URLSearchParams(location.search).get('from_user');
  const back=()=>fromUser?navigate('admin_users',{admin_user:fromUser,user_tab:'orders'}):navigate('admin_orders');
  if(!order)return <Card className="p-6"><Button variant="secondary" onClick={back}>{fromUser?'К пользователю':'Выбрать заказ'}</Button></Card>;
  const format=({article:'Статья',news:'Новость',post:'Пост',longread:'Лонгрид'})[order.snapshot.format];
  const statusCopy={
    pending:['Ожидается решение площадки','Заказ передан паблишеру. Средства заморожены до принятия или отказа.'],
    accepted:['Ожидается публикация','Площадка приняла заказ. Средства остаются замороженными до завершения размещения.'],
    submitted:['Ожидается решение заказчика','Площадка отправила ссылку. Средства остаются замороженными до приемки публикации или открытия спора.'],
    completed:['Заказ завершен','Публикация принята, выплата и комиссия зафиксированы в финансовом журнале.'],
    rejected:['Площадка отказалась от заказа','Заказ отклонен паблишером, резерв освобожден и средства возвращены заказчику.'],
    disputed:['Заказ находится в споре','Средства на холде. Решение принимается в связанной карточке спора.'],
    refunded:['Средства возвращены заказчику','Спор завершен возвратом, финансовые операции зафиксированы.'],
  }[order.apiStatus];
  return (
  <div className="space-y-6 max-w-5xl mx-auto" data-order-state={order.apiStatus}>
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={back}>
      <ChevronRight className="w-4 h-4 rotate-180" /> {fromUser?'К пользователю':'К заказам'}
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Заказ №{order.number}</h1>
        <p className="text-sm text-[#476788] mt-1">Полная карточка заказа для контроля споров, финансов и публикации.</p>
      </div>
      <Badge color={order.statusColor}>{order.status}</Badge>
    </div>
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        <div className="w-11 h-11 rounded-full border border-[#d4e0ed] bg-[#f8f9fb] flex items-center justify-center"><Clock className="w-5 h-5 text-[#006bff]" /></div>
        <div className="flex-1"><h2 className="font-display text-lg font-bold">{statusCopy[0]}</h2><p className="mt-1 text-sm text-[#476788]">{statusCopy[1]}</p><div className="mt-4 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => navigate('admin_order_chat',fromUser?{order:order.id,from_user:fromUser,user_tab:'orders'}:undefined)}>Открыть чат заказа</Button><Button variant="secondary" onClick={() => navigate('admin_dispute_detail')}>{order.dispute_number?`Спор №${order.dispute_number}`:'Связанные споры'}</Button></div></div>
      </div>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Состав заказа</h2>
        <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">Материал</div><div className="mt-1 text-lg font-semibold">{order.material}</div><div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">{[['Заказчик',`Заказчик #${String(order.customer_id).slice(0,8)}`],['Площадка',order.platform],['Формат',format]].map(([label,value])=><div key={label} className="rounded-lg border border-[#d4e0ed] bg-white p-3"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>)}</div></div>
        <div className="mt-4 rounded-lg border border-[#d4e0ed] p-4"><div className="flex flex-col justify-between gap-2 text-sm sm:flex-row"><span className="text-[#476788]">Ссылка на публикацию</span>{order.publication_url?<a className="break-all text-[#006bff]" href={order.publication_url} target="_blank" rel="noopener noreferrer">{order.publication_url}</a>:<span className="text-[#476788]">Еще не загружена</span>}</div></div>
      </Card>
      <Card className="p-6"><h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Админские действия</h2><div className="space-y-2"><Button variant="secondary" className="w-full" onClick={()=>setResult('Запрос доказательств отправлен обеим сторонам.')}>Запросить доказательства</Button><Button variant="secondary" className="w-full" onClick={()=>setResult('Удержание создано и ожидает подтверждения финансового контролера.')}>Применить удержание</Button><Button variant="primary" className="w-full" onClick={()=>navigate('admin_dispute_detail')}>Открыть решение спора</Button></div><div className="mt-4"><ActionResult text={result}/></div></Card>
    </div>
    <LiveMaterialContent material={order.snapshot} copy preserveOrderLayout />
    <Card className="p-6">
      <h2 className="font-display text-base font-bold mb-4">Финансы заказа</h2>
      <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Стоимость', formatMoney(order.price)],
          ['Заморожено', formatMoney(order.frozen)],
          ['Комиссия по условиям заказа', formatMoney((order.amount-order.payout)/100)],
          ['Вознаграждение паблишера', formatMoney(order.payout/100)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-xs text-[#476788]">{label}</div>
            <div className="mt-1 font-semibold text-[#0b3558]">{value}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
  );
};

const AdminModerationDetailView = ({ navigate, selection, materialId, onOpenPublisher }) => {
  const backend = useBackend();
  const [comment, setComment] = useState('');
  const [result, setResult] = useState('');
  const [pendingDecision, setPendingDecision] = useState('');
  const [advertiser, setAdvertiser] = useState(null);
  const [advertiserError, setAdvertiserError] = useState('');
  const [linksOpen, setLinksOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const row = materialId ? [materialId] : selection?.row || mockAdminSections.admin_moderation.rows[0];
  const liveMaterial = backend.data.materials.find(m=>m.id===row[0]);
  const materialSettings = liveMaterial ? Object.entries({tags:'Тэги',title:'Title',description:'Description',desiredUrl:'Желаемый URL',notes:'Примечание и ТЗ'}).filter(([key])=>liveMaterial.metadata?.[key]).map(([key,label])=>[label,liveMaterial.metadata[key]]) : [];
  const materialLinks = liveMaterial ? materialBodyLinks(liveMaterial.body) : [];
  useEffect(()=>{
    let active=true;
    setAdvertiser(null);setAdvertiserError('');
    if(liveMaterial?.advertiserId) api(`/admin/advertisers/${liveMaterial.advertiserId}`).then(value=>{if(active)setAdvertiser(value);}).catch(error=>{if(active)setAdvertiserError(error.message);});
    return()=>{active=false;};
  },[liveMaterial?.advertiserId]);
  const isPlatform = String(row[0]).startsWith('#P-');
  const moderationOrder = {
    material: row[0] === '№1054' ? 'Интервью с генеральным директором' : 'Пресс-релиз: Запуск новой платформы',
    platform: 'РБК Инвестиции',
    customer: 'Заказчик #842',
    advertiser: 'ООО "Финтех Решения"',
    format: 'Статья',
    amount: row[0] === '№1054' ? 60000 : 127500,
    deadline: row[0] === '№1054' ? 'публикация до 22.10.2023' : 'публикация до 20.10.2023',
  };
  const submitDecision = async (decision) => {
    if (decision !== 'Принят' && !comment.trim()) {
      setResult('Добавьте комментарий: он обязателен при отклонении.');
      return;
    }
    const ok = await backend.perform(async () => {
      if(!liveMaterial) throw new Error('Материал не найден');
      await api(`/moderation/${liveMaterial.id}`,'POST',{approved:decision==='Принят',reason:comment});await backend.refresh();
    });
    if(ok) {setPendingDecision('');setResult(`Материал: ${decision.toLowerCase()}. Решение сохранено в журнале аудита.`);}
  };
  const publisherProfileRow = mockAdminSections.admin_users.rows.find((userRow) => userRow[0] === 'P-044') || mockAdminSections.admin_users.rows.find((userRow) => userRow[2] === 'Паблишер');

  return (
  <div className="space-y-6 max-w-6xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => {const userId=new URLSearchParams(location.search).get('from_user');if(userId)navigate('admin_users',{admin_user:userId,user_tab:'assets'});else navigate('admin_moderation');}}>
      <ChevronRight className="w-4 h-4 rotate-180" /> {new URLSearchParams(location.search).has('from_user')?'К пользователю':'К очереди модерации'}
    </button>
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex flex-wrap items-center gap-3 break-words">{liveMaterial ? liveMaterial.name : `${isPlatform ? 'Площадка' : 'Материал'} ${row[0]}`} <Badge color="amber">{liveMaterial?.status || row[3]}</Badge></h1>
        <p className="text-sm text-[#476788] mt-1">{liveMaterial ? `Материал №${materialNumber(liveMaterial)} · ${liveMaterial.type} · поступил ${new Date(liveMaterial.submitted_at).toLocaleString('ru-RU')}` : `${row[1]} · ${row[2]}`}</p>
      </div>
    </div>

    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 p-6 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-[#d4e0ed] bg-[#f8fbff] text-[#006bff]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-[#0b3558]">{isPlatform ? 'Площадка ожидает решения' : 'Материал ожидает решения'}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#476788]">
              Сверьте данные заявки и содержимое. Комментарий обязателен при запросе доработки или отклонении.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 xl:justify-end">
          <Button variant="primary" onClick={() => submitDecision('Принят')}>Принять</Button>
          {!isPlatform && <Button variant="secondary" onClick={() => {setResult('');setComment('');setPendingDecision('Возвращен на доработку');}}>Вернуть на доработку</Button>}
          <Button variant="danger" onClick={() => {setResult('');setComment('');setPendingDecision('Отклонен');}}>Отклонить</Button>
        </div>
      </div>
      {pendingDecision && <div className="border-t border-[#d4e0ed] bg-[#f8fbff] p-6">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Комментарий модератора</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="mt-2 min-h-[112px] w-full resize-y rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder={pendingDecision === 'Отклонен' ? 'Укажите причину отклонения' : 'Укажите, что нужно доработать'} /></label>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-[#476788]">Решение и комментарий сохраняются в журнале аудита и отображаются заявителю.</p><div className="flex shrink-0 gap-3"><Button variant="secondary" onClick={() => setPendingDecision('')}>Отмена</Button><Button variant={pendingDecision === 'Отклонен' ? 'danger' : 'primary'} disabled={!comment.trim()} onClick={() => submitDecision(pendingDecision)}>Подтвердить</Button></div></div>
      </div>}
      {result && <div className="border-t border-[#d4e0ed] px-6 py-4"><ActionResult text={result} tone={result.startsWith('Добавьте') ? 'error' : 'success'} /></div>}
    </Card>

    <div className="space-y-6">
        {liveMaterial && <>
          <Card className="overflow-hidden">
            <div className="border-b border-[#d4e0ed] px-6 py-5"><h2 className="font-display text-lg font-bold text-[#0b3558]">Текст и изображения материала</h2><p className="mt-1 text-sm text-[#476788]">Версия, отправленная заказчиком на модерацию</p></div>
            <div className="p-6">{liveMaterial.body ? <div className="material-content" dangerouslySetInnerHTML={{__html:liveMaterial.body}} /> : <p className="text-[#476788]">Текст отсутствует</p>}</div>
          </Card>
          <MaterialAttachments ids={liveMaterial.metadata?.attachments || []} />
          <PlacementParameters links={materialLinks} settings={materialSettings} />
          <Card className="p-6"><h2 className="font-display text-lg font-bold text-[#0b3558]">Рекламодатель</h2>{!liveMaterial.advertiserId ? <p className="mt-3 text-sm text-[#476788]">Без рекламодателя</p> : advertiserError ? <p className="mt-3 text-sm text-red-600">{advertiserError}</p> : !advertiser ? <p className="mt-3 text-sm text-[#476788]">Загрузка…</p> : <dl className="mt-4 grid gap-4 sm:grid-cols-2">{Object.entries({Название:advertiser.name,ИНН:advertiser.inn,КПП:advertiser.details?.kpp,'Объект рекламы':advertiser.details?.advertisedObject,'Тип договора':advertiser.details?.contractType,'Номер договора':advertiser.details?.contractNumber}).filter(([,value])=>value).map(([label,value])=><div key={label} className="border-b border-[#d4e0ed] pb-3 text-sm"><dt className="text-[#476788]">{label}</dt><dd className="mt-1 break-words font-medium text-[#0b3558]">{String(value)}</dd></div>)}</dl>}</Card>
        </>}
        {!liveMaterial && !isPlatform && (
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="amber">{row[3]}</Badge>
              <span className="text-sm text-[#476788]">{moderationOrder.customer}</span>
            </div>
            <h2 className="mt-4 max-w-5xl break-words font-display text-2xl font-bold leading-tight text-[#0b3558] sm:text-3xl">
              {moderationOrder.material}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(200px,0.34fr)]">
              <div className="min-w-0 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                <div className="text-xs text-[#476788]">Площадка размещения</div>
                <div className="mt-1 break-words text-sm font-semibold leading-5 text-[#0b3558]">{moderationOrder.platform}</div>
              </div>
              <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                <div className="text-xs text-[#476788]">Срок публикации</div>
                <div className="mt-1 text-sm font-semibold text-[#0b3558]">{moderationOrder.deadline.replace('публикация ', '')}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-[#d4e0ed] bg-[#d4e0ed] sm:grid-cols-3">
              {[
                ['Формат', moderationOrder.format],
                ['Рекламодатель', moderationOrder.advertiser],
                ['Начисление', formatMoney(moderationOrder.amount)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 bg-white px-4 py-3">
                  <div className="text-xs text-[#476788]">{label}</div>
                  <div className="mt-1 break-words text-sm font-semibold text-[#0b3558]">{value}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!liveMaterial && <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0b3558]">{isPlatform ? 'Карточка площадки' : 'Текст и изображения материала'}</h2>
              <p className="mt-1 text-sm text-[#476788]">{isPlatform ? 'Данные, переданные паблишером' : 'Версия, отправленная заказчиком на модерацию'}</p>
            </div>
            {!isPlatform && <Badge color="blue"><ImageIcon className="mr-1.5 h-3.5 w-3.5" /> 3 изображения</Badge>}
          </div>
          <div className="p-6">
          {isPlatform ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl bg-[#006bff]">Н</div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#0b3558]">Новая площадка</h3>
                    <p className="text-sm text-[#476788] mt-1">СМИ · Бизнес · Федеральная · Паблишер #P-044</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge color="blue">на проверке</Badge>
                      <Badge color="amber">метрики требуют подтверждения</Badge>
                      <Badge color="green">реквизиты заполнены</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-[#476788]">Базовая цена</div>
                  <div className="mt-1 text-xl font-semibold text-[#0b3558]">85 000 ₽</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  ['Тип', 'СМИ'],
                  ['Срок публикации', 'до 4 дней'],
                  ['Хранение', 'минимум 2 года'],
                  ['Медиалогия', 'ожидает данных'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                    <div className="text-xs text-[#476788] uppercase">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-[#0b3558]">{value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                  <h3 className="text-sm font-semibold text-[#0b3558]">Метрики и охват</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
                    {[
                      ['Заявленная посещаемость', '2,5 млн визитов в месяц, по данным кабинета паблишера за последние 30 дней'],
                      ['Источники трафика', 'Similarweb, Метрика и выгрузка из редакционной аналитики. Требуется подтверждение доступа или отчета от паблишера.'],
                      ['Агрегаторы', 'Google News, Дзен'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[#476788]">{label}</div>
                        <div className="mt-1 font-medium leading-6 text-[#0b3558]">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                  <h3 className="text-sm font-semibold text-[#0b3558]">Форматы и ограничения</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 text-sm">
                    {[
                      ['Форматы', 'статья, новость, интервью'],
                      ['Тематики', 'бизнес, финансы, технологии'],
                      ['Не принимает', 'запрещенные тематики, обещания гарантированного дохода, внешние контакты в тексте и материалы без подтвержденного рекламодателя'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[#476788]">{label}</div>
                        <div className="mt-1 font-medium leading-6 text-[#0b3558]">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#0b3558]">Паблишер и реквизиты</h3>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-[#476788]">Владелец</div>
                    <button
                      type="button"
                      className="mt-1 text-left font-semibold text-[#006bff] hover:text-[#0b3558]"
                      onClick={() => onOpenPublisher?.(publisherProfileRow)}
                      disabled={backend.user.teamRole==='moderator'}
                    >
                      ООО «Новая редакция»
                    </button>
                  </div>
                  <div>
                    <div className="text-xs text-[#476788]">Статус реквизитов</div>
                    <div className="mt-1 font-medium text-[#0b3558]">на проверке</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <FullMaterialPreview context="admin" showLinks={false} />
              <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
                <button
                  type="button"
                  className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left ${linksOpen ? 'border-b border-[#d4e0ed]' : ''}`}
                  onClick={() => setLinksOpen((value) => !value)}
                  aria-expanded={linksOpen}
                >
                  <span className="text-sm font-semibold text-[#0b3558]">Ссылки в тексте материала</span>
                  <ChevronRight className={`w-4 h-4 text-[#476788] transition-transform ${linksOpen ? 'rotate-90' : ''}`} />
                </button>
                <CollapsiblePanel open={linksOpen}>
                  <div className="divide-y divide-[#d4e0ed]">
                    {materialLinks.map((link) => (
                      <div key={link} className="flex items-center gap-3 px-4 py-3 bg-white">
                        <div className="flex min-w-0 items-center gap-2 text-sm text-[#006bff] break-all">
                          <ExternalLink className="w-4 h-4 flex-shrink-0" />
                          <span>{link}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsiblePanel>
              </div>
              <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
                <button
                  type="button"
                  className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left ${advancedSettingsOpen ? 'border-b border-[#d4e0ed]' : ''}`}
                  onClick={() => setAdvancedSettingsOpen((value) => !value)}
                  aria-expanded={advancedSettingsOpen}
                >
                  <span className="text-sm font-semibold text-[#0b3558]">Дополнительные настройки материала</span>
                  <ChevronRight className={`w-4 h-4 text-[#476788] transition-transform ${advancedSettingsOpen ? 'rotate-90' : ''}`} />
                </button>
                <CollapsiblePanel open={advancedSettingsOpen}>
                  <div className="divide-y divide-[#d4e0ed]">
                    {[
                      ['Тэги', 'финтех, аналитика, PR, запуск продукта'],
                      ['Title', 'Финтех Решения запускает платформу аналитики'],
                      ['Description', 'Новая платформа помогает PR-командам контролировать публикации, ссылки и отчеты.'],
                      ['Желаемый URL', '/news/fintech-analytics-platform'],
                    ].map(([label, value]) => (
                      <div key={label} className="px-4 py-3 bg-white">
                        <div className="min-w-0">
                          <div className="text-xs text-[#476788]">{label}</div>
                          <div className="mt-0.5 text-sm font-medium text-[#0b3558] break-words">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsiblePanel>
              </div>
            </>
          )}
          </div>
        </Card>}
    </div>
  </div>
  );
};

const AdminDisputesView = ({ onOpen }) => {
  return <div className="space-y-6">
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Жалобы и споры</h1>
    <DisputeList onOpen={onOpen} />
  </div>;
};

const AdminDisputeDetailView = ({ navigate, selection, orderId }) => {
  const backend=useBackend();
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('');
  const [evidenceRequests, setEvidenceRequests] = useState([]);
  const [partialOpen,setPartialOpen]=useState(false);
  const [partialAmount,setPartialAmount]=useState('');
  const order=backend.data.orders.find(item=>item.id===(orderId||selection?.row?.[0]))||backend.data.orders.find(item=>item.apiStatus==='disputed');
  useEffect(()=>{
    let active=true;
    if(order?.id) api(`/orders/${order.id}/messages`).then(rows=>{if(active)setEvidenceRequests(rows.filter(row=>row.kind==='evidence_request'));}).catch(error=>{if(active)backend.setError(error.message);});
    return()=>{active=false;};
  },[order?.id]);
  if(!order)return <EmptyState title="Спор не найден" text="Вернитесь к списку жалоб и выберите существующий спор." />;
  const pending=order.apiStatus==='disputed';
  const disputeData = {
    orderId: `№${order.number}`,
    orderTitle: order.material,
    platform: order.platform,
    customer: order.customer_id,
    publicationUrl: order.publication_url || '',
    publicationLabel: order.publication_url ? order.publication_url.replace(/^https?:\/\//,'') : 'ссылка не загружена или недоступна',
  };
  const resolve = async (decision,publisherAmount?) => {
    if (!reason.trim()) {
      setResult('Добавьте обоснование решения.');
      return;
    }
    const ok=await backend.perform(async()=>{
      await api(`/orders/${order.id}/action`,'POST',{action:'resolve',decision,reason,...(publisherAmount?{publisherAmount}: {})},crypto.randomUUID());
      await backend.refresh();
    });
    if(ok)navigate('admin_complaints');
  };
  const requestEvidence=async recipient=>{
    const ok=await backend.perform(async()=>{
      await api(`/admin/orders/${order.id}/evidence-request`,'POST',{recipient},crypto.randomUUID());
      const rows=await api(`/orders/${order.id}/messages`);
      setEvidenceRequests(rows.filter(row=>row.kind==='evidence_request'));
    });
    if(ok)setResult('Запрос доказательств отправлен выбранной стороне.');
  };
  return (
  <div className="space-y-6 max-w-6xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_complaints')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К жалобам
    </button>
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div><h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">Спор #C-{String(order.dispute_number).padStart(4,'0')} <Badge color={pending?'amber':'green'}>{pending?'на рассмотрении':'решен'}</Badge></h1><p className="text-sm text-[#476788] mt-1">Заказ №{order.number} · открыт заказчиком {new Date(order.updated_at).toLocaleDateString('ru-RU')}</p></div>
      <div className="text-left lg:text-right"><div className="text-sm text-[#476788]">{pending?'На холде':'Распределено'}</div><div className="text-2xl font-semibold">{formatMoney(order.amount/100)}</div></div>
    </div>
    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Предмет спора</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {[['Причина', order.reason||'Нарушение условий размещения'], ['Основание', order.snapshot?.title||order.material], ['Статус', pending?'Ожидает решения администратора':'Решение принято']].map(([label, value]) => <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 font-medium">{value}</div></div>)}
      </div>
    </Card>
    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Связанные объекты</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-[#476788]">Заказ</div>
              <div className="mt-1 text-base font-semibold text-[#0b3558]">{disputeData.orderId}</div>
              <p className="mt-2 text-sm leading-6 text-[#476788]">
                {disputeData.orderTitle} · {disputeData.platform} · {disputeData.customer}
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('admin_order_detail')}>Открыть</Button>
          </div>
        </div>
        <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-[#476788]">Размещенный материал</div>
              {disputeData.publicationUrl ? (
                <a className="mt-1 inline-flex max-w-full items-center gap-2 text-base font-semibold text-[#006bff] hover:underline" href={disputeData.publicationUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{disputeData.publicationLabel}</span>
                </a>
              ) : (
                <div className="mt-1 text-base font-semibold text-[#0b3558]">{disputeData.publicationLabel}</div>
              )}
              <p className="mt-2 text-sm leading-6 text-[#476788]">
                {disputeData.publicationUrl ? 'Ссылка приложена паблишером и используется для проверки предмета жалобы.' : 'Спор связан с заказом без подтвержденного размещения.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[['customer','Позиция заказчика', 'В публикации изменен согласованный заголовок и удалена ссылка на продукт.', 'доказательства получены'], ['publisher','Позиция паблишера', 'Изменения внесены по редакционной политике и не меняют предмет материала.', 'ожидается дополнение']].map(([recipient, title, text, status]) => (
        <Card key={recipient} className="p-6"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-base font-bold">{title}</h2><Badge color={status.includes('получены') ? 'green' : 'amber'}>{status}</Badge></div><p className="mt-4 text-sm leading-6 text-[#476788]">{text}</p><Button variant="secondary" className="mt-5" disabled={!pending||backend.busy} onClick={() => requestEvidence(recipient)}>{evidenceRequests.some(item=>item.recipient_id===(recipient==='customer'?order.customer_id:order.publisher_id)) ? 'Запрос отправлен' : 'Запросить доказательства'}</Button></Card>
      ))}
    </div>
    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558]">Решение администратора</h2>
      {pending?<><textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-4 min-h-[130px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm" placeholder="Обоснование решения обязательно и будет доступно обеим сторонам" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button variant="secondary" disabled={backend.busy} onClick={() => resolve('full_refund')}>Полный возврат</Button>
        <Button variant="secondary" disabled={backend.busy} onClick={() => resolve('full_payout')}>Полная выплата</Button>
        <Button variant="secondary" disabled={backend.busy} onClick={() => reason.trim()?setPartialOpen(true):setResult('Добавьте обоснование решения.')}>Частичное удержание</Button>
        <Button variant="primary" disabled={backend.busy} onClick={() => resolve('no_sanctions')}>Закрыть без санкций</Button>
      </div></>:<p className="mt-4 text-sm leading-6 text-[#476788]">{order.reason}. Финансовое последствие зафиксировано, повторное решение недоступно.</p>}
      <div className="mt-4"><ActionResult text={result} tone={result.startsWith('Добавьте') ? 'error' : 'success'} /></div>
    </Card>
    <Modal isOpen={partialOpen} onClose={()=>setPartialOpen(false)} title="Частичное удержание">
      <div className="space-y-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Сумма выплаты паблишеру</span><input inputMode="numeric" value={partialAmount} onChange={event=>setPartialAmount(event.target.value.replace(/\D/g,''))} className="mt-2 w-full rounded-lg border border-[#476788] px-4 py-3 text-sm" placeholder="Сумма в рублях" /></label>
        <p className="text-sm leading-6 text-[#476788]">Оставшаяся часть суммы будет возвращена заказчику.</p>
        <div className="flex justify-end gap-3"><Button variant="secondary" onClick={()=>setPartialOpen(false)}>Отмена</Button><Button variant="primary" disabled={!Number(partialAmount)||Number(partialAmount)>=order.amount/100||backend.busy} onClick={()=>resolve('partial',Math.round(Number(partialAmount)*100))}>Применить решение</Button></div>
      </div>
    </Modal>
  </div>
  );
};

const AdminPayoutDetailView = ({ navigate, selection }) => {
  const backend=useBackend();
  const [comment, setComment] = useState('');
  const [bankReference,setBankReference]=useState('');
  const payout=backend.data.payouts.find(item=>item.id===selection?.row?.[0]);
  if(!payout)return <Card className="p-6">Заявка на выплату не найдена.</Card>;
  const requisites=payout.requisites||{};
  const status={pending:'На проверке',approved:'Ожидает перечисления',transferred:'Перечислена',returned:'Возвращена',rejected:'Отклонена'}[payout.status];
  const decide=async decision=>{
    if(decision!=='approved'&&!comment.trim())return;
    const ok=await backend.perform(async()=>{await api(`/admin/payouts/${payout.id}/decision`,'POST',{decision,comment});await backend.refresh();});
    if(ok)setComment('');
  };
  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_payouts')}><ChevronRight className="w-4 h-4 rotate-180" /> К выплатам</button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div><h1 className="font-display text-2xl font-bold flex items-center gap-3">Выплата W-{payout.number} <Badge color={payout.status==='approved'?'green':payout.status==='pending'?'blue':'red'}>{status}</Badge></h1><p className="mt-1 text-sm text-[#476788]">{payout.publisher_email} · создана {new Date(payout.created_at).toLocaleDateString('ru-RU')}</p></div><div className="sm:text-right"><div className="text-sm text-[#476788]">Сумма заявки</div><div className="text-2xl font-semibold">{formatMoney(Number(payout.amount)/100)}</div></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold mb-4">Расчет выплаты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[['Зарезервировано',formatMoney(Number(payout.amount)/100)],['Комиссия за вывод',formatMoney(0)]].map(([label,value])=><div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>)}</div>
        <p className="mt-5 text-sm leading-6 text-[#476788]">Комиссия площадки уже удержана при завершении заказов. Подтверждение заявки не означает банковского перечисления.</p>
        {payout.comment&&<p className="mt-4 text-sm text-[#476788]">Комментарий: {payout.comment}</p>}
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold mb-4">Реквизиты</h2>
        <div className="space-y-3 text-sm">{[['Получатель',requisites.recipient||requisites.personName],['ИНН',requisites.inn||requisites.personInn],['Счет',requisites.account||requisites.personAccount],['БИК',requisites.bik||requisites.personBik]].map(([label,value])=><div key={label}><div className="text-xs text-[#476788]">{label}</div><div className="mt-0.5 break-all font-medium">{value||'—'}</div></div>)}</div>
        <Badge color="green" className="mt-4">реквизиты проверены</Badge>
      </Card>
    </div>
    {payout.status==='pending'&&<Card className="p-6"><label className="block"><span className="text-sm font-medium text-[#476788]">Комментарий финансового контролера</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="mt-2 min-h-[100px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm" /></label><div className="mt-4 flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={!comment.trim()||backend.busy} onClick={() => decide('returned')}>Вернуть на проверку</Button><Button variant="secondary" disabled={!comment.trim()||backend.busy} onClick={() => decide('rejected')}>Отклонить</Button><Button variant="primary" disabled={backend.busy} onClick={() => decide('approved')}>Подтвердить заявку</Button></div></Card>}
    {payout.status==='approved'&&<Card className="p-6"><h2 className="font-display text-base font-bold">Подтверждение перечисления</h2><p className="mt-2 text-sm text-[#476788]">Укажите идентификатор операции только после подтверждения перевода банком.</p><input className="mt-4 w-full rounded-lg border border-[#476788] px-4 py-3 text-sm" aria-label="Идентификатор банковского перевода" placeholder="Идентификатор банковской операции" minLength={6} maxLength={120} value={bankReference} onChange={event=>setBankReference(event.target.value)}/><div className="mt-4 flex justify-end"><Button variant="primary" disabled={backend.busy||bankReference.trim().length<6} onClick={()=>backend.perform(async()=>{await api(`/admin/payouts/${payout.id}/transfer`,'POST',{bankReference:bankReference.trim(),transferredAt:new Date().toISOString()},crypto.randomUUID());await backend.refresh();})}>Отметить перечисление</Button></div></Card>}
    {payout.status==='transferred'&&<Card className="p-6 text-sm"><div>Идентификатор операции: <strong>{payout.bank_reference}</strong></div><div className="mt-2 text-[#476788]">Перечислено {new Date(payout.transferred_at).toLocaleString('ru-RU')}</div></Card>}
  </div>
  );
};

const AdminFinanceDetailView = ({ navigate, selection }) => {
  const row = selection?.row || mockAdminSections.admin_balances.rows[0];
  const isPublisher = row[0] === 'РБК Инвестиции';
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState(isPublisher ? 'Начисление паблишеру' : 'Пополнение баланса');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [result, setResult] = useState('');

  const profile = isPublisher
    ? {
        title: 'Финансы паблишера РБК Инвестиции',
        badge: 'ожидает приемки / вывод',
        owner: 'Паблишер #P-017',
        company: 'ООО «Редакция РБК»',
        balance: [
          ['Доступно к выводу', formatMoney(235000), 'можно включить в выплату'],
          ['Ожидает приемки', formatMoney(127500), 'заказы отправлены заказчику'],
          ['Выплачено всего', formatMoney(2840000), 'за все время'],
          ['Комиссия платформы', '15%', 'удерживается при выплате'],
        ],
        orders: [
          ['#1045', 'Пресс-релиз: Запуск новой платформы', 'Ожидает приемки', formatMoney(127500), 'после приемки заказчиком'],
          ['#1041', 'Обзор рынка инвестиций', 'Доступно к выводу', formatMoney(107500), 'готово к выплате'],
          ['#1038', 'Новость компании', 'Выплачено', formatMoney(85000), 'выплата W-108'],
        ],
        operations: [
          ['TR-991', 'Начисление', `+${formatMoney(127500)}`, 'Заказ #1045', 'Ожидает приемки'],
          ['TR-990', 'Комиссия', `-${formatMoney(22500)}`, 'Заказ #1045', 'Будет удержана'],
          ['TR-975', 'Выплата', `-${formatMoney(430000)}`, 'Выплата W-108', 'Выполнено'],
        ],
        adjustmentOptions: ['Начисление паблишеру', 'Списание начисления', 'Удержание по спору', 'Ручная выплата'],
      }
    : {
        title: 'Финансы Заказчик #842',
        badge: 'доступно / заморожено',
        owner: 'Заказчик #842',
        company: 'ООО «Финтех Решения»',
        balance: [
          ['Доступно', formatMoney(1250000), 'можно использовать для новых заказов'],
          ['Заморожено', formatMoney(345000), 'по активным заказам'],
          ['Удержано', formatMoney(52000), 'по решениям споров'],
          ['Комиссия', '15%', 'учтена в стоимости размещений'],
        ],
        orders: [
          ['#1045', 'РБК Инвестиции', 'Ожидает приемки', formatMoney(150000), 'холд до приемки'],
          ['#1048', 'Технологии сегодня', 'Площадка рассматривает', formatMoney(45000), 'холд до решения площадки'],
          ['#1054', 'Код Дурова', 'Ожидает публикации', formatMoney(60000), 'холд до публикации'],
          ['#1055', 'Бизнес Среда', 'Спор закрыт', formatMoney(90000), 'частичное удержание'],
        ],
        operations: [
          ['TR-986', 'Возврат', `+${formatMoney(146000)}`, 'Отозванный заказ #1055', 'Завершено'],
          ['TR-982', 'Заморозка', `-${formatMoney(45000)}`, 'Заказ #1048', 'Активно'],
          ['TR-981', 'Заморозка', `-${formatMoney(150000)}`, 'Заказ #1045', 'Активно'],
          ['TR-979', 'Пополнение', `+${formatMoney(500000)}`, 'Входящий банковский перевод', 'Доступно'],
        ],
        adjustmentOptions: ['Пополнение баланса', 'Списание баланса', 'Разморозка холда', 'Удержание по спору'],
      };

  const createAdjustment = () => {
    const amount = Number(String(adjustmentAmount).replace(/\s/g, ''));
    if (!amount || amount <= 0) {
      setResult('Укажите положительную сумму корректировки.');
      return;
    }
    if (!adjustmentReason.trim()) {
      setResult('Добавьте основание корректировки.');
      return;
    }
    setResult(`Корректировка на ${formatMoney(amount)} создана: ${adjustmentType.toLowerCase()}. Требуется второе подтверждение администратора.`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_balances')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
            {profile.title}
            <Badge color="blue">{profile.badge}</Badge>
          </h1>
          <p className="mt-1 text-sm text-[#476788]">{profile.owner} · {profile.company}</p>
        </div>
        <Button variant="primary" onClick={() => setAdjustmentOpen((value) => !value)}>
          {adjustmentOpen ? 'Скрыть корректировку' : 'Создать корректировку'}
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Сводка баланса</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {profile.balance.map(([label, value, hint]) => (
            <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <div className="text-xs text-[#476788]">{label}</div>
              <div className="mt-1 text-xl font-semibold text-[#0b3558]">{value}</div>
              <div className="mt-2 text-xs leading-5 text-[#476788]">{hint}</div>
            </div>
          ))}
        </div>
      </Card>

      <CollapsiblePanel open={adjustmentOpen}>
        <Card className="p-6">
          <h2 className="font-display text-base font-bold text-[#0b3558]">Новая корректировка</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Тип операции</span>
              <CustomSelect className="mt-2" options={profile.adjustmentOptions} value={adjustmentType} onChange={setAdjustmentType} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[#476788]">Сумма</span>
              <input
                value={adjustmentAmount}
                onChange={(event) => setAdjustmentAmount(event.target.value)}
                inputMode="numeric"
                className="mt-2 w-full rounded-lg border border-[#476788] bg-white px-4 py-2.5 text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]"
                placeholder="Например, 50000"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-[#476788]">Основание</span>
            <textarea
              value={adjustmentReason}
              onChange={(event) => setAdjustmentReason(event.target.value)}
              className="mt-2 min-h-[120px] w-full rounded-lg border border-[#476788] bg-white px-4 py-3 text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]"
              placeholder="Укажите основание, связанный заказ, спор или платежный документ."
            />
          </label>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setAdjustmentOpen(false)}>Отмена</Button>
            <Button variant="primary" onClick={createAdjustment}>Создать и отправить на подтверждение</Button>
          </div>
          <div className="mt-4"><ActionResult text={result} tone={result.startsWith('Укажите') || result.startsWith('Добавьте') ? 'error' : 'success'} /></div>
        </Card>
      </CollapsiblePanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">
            {isPublisher ? 'Начисления по заказам' : 'Заморозки по заказам'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs uppercase text-[#476788]">
                <tr>
                  <th className="py-3 pr-4 font-medium">Заказ</th>
                  <th className="py-3 pr-4 font-medium">{isPublisher ? 'Материал' : 'Площадка'}</th>
                  <th className="py-3 pr-4 font-medium">Статус</th>
                  <th className="py-3 pr-4 font-medium text-right">Сумма</th>
                  <th className="py-3 font-medium">Основание</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d4e0ed]">
                {profile.orders.map(([orderId, subject, status, amount, basis]) => (
                  <tr key={orderId} className="text-sm">
                    <td className="py-4 pr-4 font-semibold text-[#006bff]">
                      <button type="button" onClick={() => navigate('admin_order_detail')}>{orderId}</button>
                    </td>
                    <td className="py-4 pr-4 text-[#0b3558]">{subject}</td>
                    <td className="py-4 pr-4"><Badge color={status.includes('Спор') || status.includes('Ожидает') ? 'amber' : status.includes('Выплачено') || status.includes('Доступно') ? 'green' : 'blue'}>{status}</Badge></td>
                    <td className="py-4 pr-4 text-right font-semibold tabular-nums">{amount}</td>
                    <td className="py-4 text-[#476788]">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Контроль</h2>
          <div className="space-y-3 text-sm">
            {[
              ['Реквизиты', 'проверены'],
              ['Ограничения', 'нет активных'],
              ['Последняя сверка', 'сегодня, 12:10'],
              ['Нужна вторая подпись', result && !result.startsWith('Укажите') && !result.startsWith('Добавьте') ? 'да' : 'нет'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-[#476788]">{label}</span>
                <span className="font-medium text-[#0b3558]">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Последние операции</h2>
        <div className="divide-y divide-[#d4e0ed] rounded-lg border border-[#d4e0ed] overflow-hidden">
          {profile.operations.map(([id, type, amount, basis, status]) => (
            <div key={id} className="grid grid-cols-1 md:grid-cols-[120px_1fr_140px_180px] gap-2 px-4 py-3 text-sm bg-white">
              <div className="font-semibold text-[#0b3558]">{id}</div>
              <div><span className="font-medium text-[#0b3558]">{type}</span><div className="text-xs text-[#476788] mt-1">{basis}</div></div>
              <div className={`font-semibold tabular-nums ${String(amount).startsWith('+') ? 'text-emerald-700' : 'text-[#0b3558]'}`}>{amount}</div>
              <div><Badge color={status.includes('Активно') || status.includes('Ожидает') || status.includes('Будет') ? 'amber' : 'green'}>{status}</Badge></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const AdminPlatformDetailView = ({ navigate, selection }) => {
  const [result, setResult] = useState('');
  const item = mockCatalog[0];
  const row = selection?.row;
  const initialStatus = row?.[3] || 'Активна';
  const [isSuspended, setIsSuspended] = useState(initialStatus === 'Приостановлена');
  const displayStatus = isSuspended
    ? 'Приостановлена'
    : ['На проверке', 'Требуются правки'].includes(initialStatus) ? initialStatus : 'Активна';
  const platformPublications = mockOrdersPublisher.filter((order) => order.platform === item.name);
  const togglePlatformStatus = () => {
    const nextSuspended = !isSuspended;
    setIsSuspended(nextSuspended);
    setResult(nextSuspended
      ? 'Площадка приостановлена и скрыта из каталога. Текущие заказы сохранены.'
      : 'Площадка возвращена в каталог и снова принимает новые заказы.');
  };

  return (
    <div className="platform-view-enter mx-auto max-w-6xl space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_platforms')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
      </button>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="platform-logo-motion flex h-16 w-16 flex-none flex-col items-center justify-center rounded-2xl border border-[#d4e0ed] bg-white shadow-sm" aria-label="Логотип РБК">
            <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
              <span className="h-2.5 w-1.5 rounded-sm bg-[#f5a623]" />
              <span className="h-3.5 w-1.5 rounded-sm bg-[#4dbb73]" />
              <span className="h-4 w-1.5 rounded-sm bg-[#28a8df]" />
              <span className="h-3 w-1.5 rounded-sm bg-[#405de6]" />
            </span>
            <span className="mt-1 text-xs font-bold leading-none text-[#0b3558]">РБК</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="font-display text-2xl font-bold text-[#0b3558]">{item.name}</h1>
              <Badge
                key={displayStatus}
                color={displayStatus === 'Активна' ? 'green' : displayStatus === 'На проверке' ? 'blue' : displayStatus === 'Приостановлена' ? 'gray' : 'amber'}
                className="platform-status-pop"
              >
                {displayStatus}
              </Badge>
              <Badge color="blue">Проверено</Badge>
              <Badge color="blue">Маркировка</Badge>
              <Badge color="green">Реквизиты проверены</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#476788]">
              <span>{item.type} · {item.theme} · Федеральные · Паблишер P-017</span>
              <span className="hidden text-[#9bb6d3] sm:inline">·</span>
              <a className="inline-flex items-center gap-1 font-medium text-[#006cff] hover:underline" href="https://invest.rbc.ru" target="_blank" rel="noreferrer">
                invest.rbc.ru <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={togglePlatformStatus}>
          {isSuspended ? 'Вернуть в каталог' : 'Приостановить'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="platform-card-motion p-5" style={{ animationDelay: '80ms' }}>
          <div className="text-xs uppercase text-[#476788]">Посещаемость в день</div>
          <div className="mt-2 text-xl font-semibold text-[#0b3558]">82 тыс.</div>
          <a className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#006cff] hover:underline" href="https://metrika.yandex.ru/dashboard?id=12345678" target="_blank" rel="noreferrer">
            Яндекс Метрика <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
        <Card className="platform-card-motion p-5" style={{ animationDelay: '120ms' }}><div className="text-xs uppercase text-[#476788]">Срок публикации</div><div className="mt-2 text-xl font-semibold text-[#0b3558]">до 2 дней</div></Card>
        <Card className="platform-card-motion p-5" style={{ animationDelay: '160ms' }}><div className="text-xs uppercase text-[#476788]">Хранение</div><div className="mt-2 text-xl font-semibold text-[#0b3558]">2 года</div></Card>
        <Card className="platform-card-motion p-5" style={{ animationDelay: '200ms' }}><div className="flex items-center gap-1 text-xs uppercase text-[#476788]">Медиалогия <Info className="h-3.5 w-3.5" /></div><div className="mt-2 text-xl font-semibold text-[#0b3558]">#5</div><div className="mt-1 text-xs text-[#476788]">общий рейтинг</div></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="platform-section-motion overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[#d4e0ed] bg-[#f8f9fb] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-[#0b3558]">Форматы и цены</h2>
                <p className="mt-1 text-xs text-[#476788]">Сезонная скидка 10% действует до 31 августа</p>
              </div>
              <Badge color="green">Коэффициент сезона ×1,0</Badge>
            </div>
            <div className="divide-y divide-[#d4e0ed]">
              {[
                { name: 'Статья', deadline: 'до 2 дней', basePrice: '150 000 ₽', price: '135 000 ₽' },
                { name: 'Новость', deadline: 'до 1 дня', basePrice: '85 000 ₽', price: '76 500 ₽' },
              ].map((format) => (
                <div key={format.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
                  <div>
                    <div className="text-sm font-semibold text-[#0b3558]">{format.name}</div>
                    <div className="mt-1 text-xs text-[#476788]">Публикация {format.deadline}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#7890aa] line-through">{format.basePrice}</div>
                    <div className="mt-0.5 text-base font-semibold text-[#0b3558]">{format.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="platform-section-motion p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558]">Требования</h2>
            <p className="mt-3 text-sm leading-6 text-[#476788]">
              Площадка принимает материалы о финансах, бизнесе и технологиях. Редакция может изменить заголовок и структуру текста без искажения смысла. Допускается до двух внешних ссылок, изображения обязательны. Не принимаются запрещенные тематики и обещания гарантированного дохода.
            </p>
            <div className="mt-5 grid gap-5 border-t border-[#d4e0ed] pt-5 sm:grid-cols-2 sm:gap-0">
              <div className="flex min-w-0 items-center gap-3 sm:pr-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e7f1ff] text-[#006cff]"><Megaphone className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase leading-none text-[#6f88a3]">Подходит для целей</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Пиар', 'SEO'].map((goal) => <span key={goal} className="rounded-full bg-[#e7f1ff] px-3 py-1 text-sm font-semibold text-[#075cc8]">{goal}</span>)}
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3 border-t border-[#d4e0ed] pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ebf8f1] text-[#16834d]"><Newspaper className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase leading-none text-[#6f88a3]">Новостные агрегаторы</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Google News', 'Дзен'].map((aggregator) => <span key={aggregator} className="rounded-full bg-[#ebf8f1] px-3 py-1 text-sm font-semibold text-[#146b43]">{aggregator}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="platform-section-motion h-fit p-6">
          <h2 className="font-display text-base font-bold text-[#0b3558]">Администрирование</h2>
          <p className="mt-2 text-sm leading-6 text-[#476788]">Управление площадкой и связанными сущностями без изменения коммерческой карточки.</p>
          <div className="mt-5 space-y-3 text-sm">
            {[
              ['Паблишер', 'Редакция РБК Инвестиции'],
              ['Статус реквизитов', 'проверены'],
              ['Активных заказов', '4'],
              ['Открытых споров', '0'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-[#476788]">{label}</span>
                <span className="text-right font-medium text-[#0b3558]">{value}</span>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-5 w-full" onClick={() => navigate('admin_users')}>Открыть паблишера</Button>
          <Button variant="secondary" className="mt-3 w-full" onClick={() => navigate('admin_orders')}>Заказы площадки</Button>
          <div className="mt-4"><ActionResult text={result} /></div>
        </Card>
      </div>

      <Card className="platform-section-motion overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-[#d4e0ed] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0b3558]">Публикации на площадке</h2>
            <p className="mt-1 text-sm text-[#476788]">Заказы и размещения, связанные с РБК Инвестиции</p>
          </div>
          <Badge color="blue">{platformPublications.length} заказа</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] divide-y divide-[#d4e0ed]">
            <thead className="bg-[#f8f9fb]">
              <tr>
                {['Заказ', 'Материал', 'Формат', 'Дата', 'Статус'].map((head) => (
                  <th key={head} className="px-6 py-3 text-left text-xs font-medium uppercase text-[#476788]">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d4e0ed] bg-white">
              {platformPublications.map((order) => (
                <tr key={order.id} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => navigate('admin_order_detail')}>
                  <td className="px-6 py-4 text-sm font-semibold text-[#006bff]">№{orderNumber(order)}</td>
                  <td className="max-w-[340px] px-6 py-4 text-sm font-medium text-[#0b3558]"><span className="line-clamp-2">{order.material}</span></td>
                  <td className="px-6 py-4 text-sm text-[#476788]">{order.format.replace('СМИ (', '').replace(')', '')}</td>
                  <td className="px-6 py-4 text-sm tabular-nums text-[#476788]">{order.date}</td>
                  <td className="px-6 py-4"><Badge color={order.statusColor}>{order.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const AdminEntityDetailView = ({ navigate, type, selection }) => {
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const configs = {
    user: { back: 'admin_users', title: 'Пользователь U-842', badge: 'активен', fields: [['Тип', 'Заказчик'], ['Email', 'owner@fintech.ru'], ['Организация', 'ООО «Финтех Решения»'], ['2FA', 'подключена']], action: 'Заблокировать пользователя' },
    platform: { back: 'admin_platforms', title: 'Площадка #P-017', badge: 'принята', fields: [['Название', 'РБК Инвестиции'], ['Тип', 'СМИ'], ['Владелец', 'ООО «Редакция РБК»'], ['Статус реквизитов', 'проверены']], action: 'Приостановить площадку' },
    advertiser: { back: 'admin_advertisers', title: 'Рекламодатель A-842', badge: 'ожидает проверки', fields: [['Юридическое название', 'ООО «Финтех Решения»'], ['ИНН', '7700000000'], ['КПП', '770001001'], ['ОГРН', '1237700000000']], action: 'Запросить проверку' },
    finance: { back: 'admin_balances', title: 'Финансовый профиль', badge: 'без ограничений', fields: [['Доступно', '1 250 000 ₽'], ['Заморожено', '345 000 ₽'], ['Удержано', '52 000 ₽'], ['Комиссия', '15%']], action: 'Создать корректировку' },
    ticket: { back: 'admin_support', title: 'Тикет #T-118', badge: 'в работе', fields: [['Тема', 'Не проходит выплата'], ['Автор', 'РБК Инвестиции'], ['Приоритет', 'Высокий'], ['Ответственный', 'support@axioma.ru']], action: 'Отправить ответ' },
    document: { back: 'admin_documents', title: 'Документ #D-2048', badge: 'готов', fields: [['Тип', 'Отчет по размещению'], ['Заказ', '#1045'], ['Получатель', 'Заказчик #842'], ['Создан', '19.10.2023']], action: 'Скачать документ' },
    audit: { back: 'admin_audit', title: 'Событие #LOG-8841', badge: 'зафиксировано', fields: [['Сотрудник', 'moderator@axioma.ru'], ['Действие', 'Изменен статус материала'], ['Объект', '№1052'], ['Время', '19.10.2023, 13:42']], action: 'Открыть объект' },
  };
  const config = configs[type];
  const selectedRow = selection?.row;
  const title = selectedRow ? `${config.title.split(' ')[0]} ${selectedRow[0]}` : config.title;
  const fields = type === 'user' && selectedRow
    ? [['Тип', selectedRow[2]], ['Название', selectedRow[1]], ['Статус', selectedRow[3]], ['Идентификатор', selectedRow[0]]]
    : config.fields;
  const runAction = () => {
    if (type === 'ticket' && !message.trim()) {
      setResult('Введите ответ пользователю.');
      return;
    }
    const messages = {
      user: 'Пользователь заблокирован. Активные сессии завершены.',
      platform: 'Площадка приостановлена и скрыта из каталога.',
      advertiser: 'Запрос на проверку рекламодателя отправлен во внешний сервис.',
      finance: 'Корректировка создана и ожидает второго подтверждения.',
      ticket: 'Ответ отправлен. Тикет остается в работе.',
      document: 'Документ подготовлен к скачиванию.',
      audit: 'Связанный объект открыт в новой карточке.',
    };
    setResult(messages[type]);
  };
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate(config.back)}><ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку</button>
      <div><h1 className="font-display text-2xl font-bold flex items-center gap-3">{title}<Badge color="blue">{selectedRow?.[3] || config.badge}</Badge></h1></div>
      <Card className="p-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields.map(([label, value]) => <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>)}</div>{type !== 'ticket' && <div className="mt-6 flex justify-end"><Button variant={type === 'user' || type === 'platform' ? 'secondary' : 'primary'} onClick={runAction}>{config.action}</Button></div>}<div className="mt-4"><ActionResult text={result} tone={result.startsWith('Введите') ? 'error' : 'success'} /></div></Card>
      {type === 'ticket' && <Card className="p-6"><h2 className="font-display text-base font-bold">Переписка</h2><div className="mt-4 min-h-[220px] rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">Запрос выплаты остается в статусе проверки больше суток. Просим уточнить срок.</div><textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-4 min-h-[100px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm" placeholder="Ответ пользователю" /><div className="mt-4 flex justify-end"><Button variant="primary" onClick={runAction}>Отправить ответ</Button></div></Card>}
    </div>
  );
};

const AdminAdvertiserDetailView = ({ navigate, selection, onOpenOrder }) => {
  const row = selection?.row || mockAdminSections.admin_advertisers.rows[0];
  const status = row[3];
  const isVerified = status === 'Проверен';
  const isBlocked = status === 'Заблокирован';
  const isChecking = status === 'Проверка запрошена';
  const advertiser = row[0] === 'A-901'
    ? {
        name: row[1],
        type: row[2],
        owner: 'Заказчик #901',
        legal: [
          ['Тип рекламодателя', 'Юридическое лицо'],
          ['Юридическое название', row[1]],
          ['ИНН', '7709000000'],
          ['КПП', '770901001'],
          ['ОГРН', '1237709000000'],
          ['Юридический адрес', '119019, Москва, ул. Арбат, 12'],
        ],
        requests: [
          ['#1048', 'Анонс вебинара по инвестициям', 'Технологии сегодня', 'Площадка рассматривает'],
          ['#1054', 'Интервью с генеральным директором', 'Код Дурова', 'Площадка запросила правки'],
        ],
      }
    : {
        name: row[1],
        type: row[2],
        owner: 'Заказчик #842',
        legal: [
          ['Тип рекламодателя', 'Юридическое лицо'],
          ['Юридическое название', row[1]],
          ['ИНН', '7700000000'],
          ['КПП', '770001001'],
          ['ОГРН', '1237700000000'],
          ['Юридический адрес', '119019, Москва, ул. Воздвиженка, 10'],
        ],
        requests: [
          ['#1045', 'Пресс-релиз: Запуск новой платформы', 'РБК Инвестиции', 'Ожидает приемки'],
          ['#1052', 'Кейс внедрения системы управления клиентами', 'VC.ru', 'Завершено'],
          ['#1055', 'Обзор рынка недвижимости за третий квартал', 'Бизнес Среда', 'Площадка отказала'],
        ],
      };

  const checkState = isVerified
    ? {
        title: 'Юрлицо подтверждено',
        text: 'Статус сохранен в карточке. Автоматическая проверка через внешний сервис не подключена.',
        icon: CheckCircle2,
        color: 'green',
      }
    : isBlocked
      ? {
          title: 'Рекламодатель заблокирован',
          text: 'Сущность нельзя использовать в маркировке до разблокировки администратором.',
          icon: AlertCircle,
          color: 'red',
        }
      : isChecking
        ? {
            title: 'Проверка запрошена',
            text: 'Автоматическая проверка через внешний сервис не подключена.',
            icon: Clock,
            color: 'amber',
          }
        : {
            title: 'Проверка не запускалась',
            text: 'Автоматическая проверка через внешний сервис не подключена.',
            icon: Clock,
            color: 'gray',
          };
  const CheckIcon = checkState.icon;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_advertisers')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К рекламодателям
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558] flex flex-wrap items-center gap-3">
            {advertiser.name}
            <Badge color={isVerified ? 'green' : isBlocked ? 'red' : isChecking ? 'amber' : 'gray'}>{status.toLowerCase()}</Badge>
          </h1>
          <p className="mt-1 text-sm text-[#476788]">{row[0]} · рекламодатель для маркировки · {advertiser.owner}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-[#f8f9fb]">
            <p className="text-sm text-[#476788]">
              Рекламодатель используется в данных для маркировки. Автоматическая проверка юридических реквизитов пока не подключена.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Юридические данные для маркировки</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {advertiser.legal.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                  <div className="text-xs text-[#476788]">{label}</div>
                  <div className="mt-1 text-sm font-medium text-[#0b3558] break-words">{value}</div>
                </div>
              ))}
            </div>
          </Card>

          {isVerified && (
            <Card className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#d4e0ed] pb-3">
                <h2 className="font-display text-base font-bold text-[#0b3558]">Заявки с рекламодателем</h2>
                <Badge color="blue">{advertiser.requests.length} заявки</Badge>
              </div>
              <div className="space-y-3">
                {advertiser.requests.map(([id, material, platform, requestStatus]) => (
                  <button
                    key={id}
                    className="w-full rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-left transition-colors hover:border-[#006bff] hover:bg-white"
                    onClick={() => onOpenOrder(id)}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[#0b3558]">{id}</span>
                          <Badge color={requestStatus === 'Завершено' ? 'green' : requestStatus.includes('отказ') ? 'red' : 'blue'}>{requestStatus}</Badge>
                        </div>
                        <div className="mt-2 text-sm font-medium text-[#0b3558]">{material}</div>
                        <div className="mt-1 text-xs text-[#476788]">Площадка: {platform}</div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[#006bff]">Открыть</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Проверка реквизитов</h2>
            <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <div className="flex items-start gap-3">
                <CheckIcon className={`mt-0.5 h-5 w-5 ${checkState.color === 'green' ? 'text-emerald-500' : checkState.color === 'red' ? 'text-red-500' : checkState.color === 'amber' ? 'text-amber-500' : 'text-[#476788]'}`} />
                <div>
                  <div className="text-sm font-semibold text-[#0b3558]">{checkState.title}</div>
                  <div className="mt-1 text-xs leading-5 text-[#476788]">{checkState.text}</div>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="primary" className="w-full" disabled>Запросить проверку</Button>
              <Button variant="danger" className="w-full" disabled>Заблокировать</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AdminTicketDetailView = ({ navigate, selection }) => {
  const row = selection?.row || mockAdminSections.admin_support.rows[0];
  const isClosedInitial = String(row[2]).toLowerCase().includes('закрыт');
  const [status, setStatus] = useState(isClosedInitial ? 'Закрыт' : 'Открыт');
  const [priority, setPriority] = useState(row[2].includes('высок') ? 'Высокий' : 'Обычный');
  const [assignee, setAssignee] = useState('support@axioma.ru');
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [result, setResult] = useState('');
  const isClosed = status === 'Закрыт';
  const isPublisher = row[3].includes('Паблишер') || row[1].toLowerCase().includes('выплат');
  const ticket = isPublisher
    ? {
        title: row[1],
        requester: 'Редакция РБК Инвестиции',
        role: 'Паблишер',
        email: 'finance@publisher.ru',
        related: 'Выплата W-112',
        relatedRoute: 'admin_payout_detail',
        category: 'Финансы и выплаты',
        created: '19.10.2023, 12:16',
        lastActivity: '24 мин назад',
        sla: 'ответить до 14:00',
        message: 'Заявка на выплату W-112 остается в статусе проверки больше суток. Просим уточнить, хватает ли документов и когда сумма будет отправлена на расчетный счет.',
        resolution: 'Проверка реквизитов завершена, выплата передана финансовому контролеру. Паблишеру отправлено уведомление со сроком перечисления.',
      }
    : {
        title: row[1],
        requester: 'ООО «Финтех Решения»',
        role: 'Заказчик',
        email: 'owner@fintech.ru',
        related: 'Материал №1052',
        relatedRoute: 'admin_moderation_detail',
        category: 'Модерация материала',
        created: '18.10.2023, 17:45',
        lastActivity: 'закрыт вчера',
        sla: 'выполнен',
        message: 'Материал вернулся с модерации, но в карточке не было понятно, какие формулировки нужно исправить. Просим пояснить причину возврата.',
        resolution: 'Модератор дополнил комментарий в карточке материала и отправил заказчику список правок. Тикет закрыт после подтверждения заказчика.',
      };

  const sendReply = () => {
    if (!reply.trim()) {
      setResult('Введите ответ пользователю.');
      return;
    }
    setResult('Ответ отправлен пользователю. Тикет остается открытым до подтверждения решения.');
    setReply('');
  };

  const closeTicket = () => {
    if (!reply.trim() && !internalNote.trim()) {
      setResult('Перед закрытием добавьте ответ пользователю или внутренний комментарий.');
      return;
    }
    setStatus('Закрыт');
    setResult('Тикет закрыт. Решение сохранено в истории обращения.');
  };

  const reopenTicket = () => {
    setStatus('Открыт');
    setResult('Тикет переоткрыт и возвращен в очередь поддержки.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_support')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К поддержке
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558] flex flex-wrap items-center gap-3">
            Тикет {row[0]}
            <Badge color={isClosed ? 'green' : priority === 'Высокий' ? 'red' : 'blue'}>{isClosed ? 'закрыт' : `${priority.toLowerCase()} приоритет`}</Badge>
          </h1>
          <p className="mt-1 text-sm text-[#476788]">{ticket.title} · {ticket.role} · создан {ticket.created}</p>
        </div>
        <div className="text-left lg:text-right">
          <div className="text-sm text-[#476788]">{isClosed ? 'Решен' : 'SLA ответа'}</div>
          <div className="text-xl font-semibold text-[#0b3558]">{isClosed ? ticket.lastActivity : ticket.sla}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Обращение</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                ['Тема', ticket.title],
                ['Категория', ticket.category],
                ['Автор', ticket.requester],
                ['Роль', ticket.role],
                ['Email', ticket.email],
                ['Связанный объект', ticket.related],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                  <div className="text-xs text-[#476788]">{label}</div>
                  <div className="mt-1 text-sm font-medium text-[#0b3558] break-words">{value}</div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-sm font-semibold text-[#006bff]" onClick={() => navigate(ticket.relatedRoute)}>
              Открыть связанный объект
            </button>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Переписка</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-[#476788]">
                  <span>{ticket.requester}</span>
                  <span>{ticket.created}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#0b3558]">{ticket.message}</p>
              </div>
              <div className="rounded-lg border border-[#d4e0ed] bg-white p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-[#476788]">
                  <span>support@axioma.ru</span>
                  <span>{isClosed ? 'решение отправлено' : 'черновик ответа'}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#0b3558]">
                  {isClosed ? ticket.resolution : 'Проверяем связанный объект и статус операции. Ответ должен объяснить причину задержки и следующий шаг для пользователя.'}
                </p>
              </div>
            </div>
          </Card>

          {isClosed ? (
            <Card className="p-6">
              <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Решение</h2>
              <p className="text-sm leading-6 text-[#476788]">{ticket.resolution}</p>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {[
                  ['Итог', 'вопрос решен'],
                  ['Кто закрыл', 'support@axioma.ru'],
                  ['Повторное обращение', 'доступно'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                    <div className="text-xs text-[#476788]">{label}</div>
                    <div className="mt-1 font-medium text-[#0b3558]">{value}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h2 className="font-display text-base font-bold text-[#0b3558]">Ответ поддержки</h2>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                className="mt-4 min-h-[150px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm"
                placeholder="Ответ пользователю: причина, статус связанного объекта и следующий шаг."
              />
              <label className="mt-4 block">
                <span className="text-sm font-medium text-[#476788]">Внутренний комментарий</span>
                <textarea
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                  className="mt-2 min-h-[90px] w-full rounded-lg border border-[#d4e0ed] px-4 py-3 text-sm"
                  placeholder="Не виден пользователю. Например: ждем подтверждение финансового контролера."
                />
              </label>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={sendReply}>Отправить ответ</Button>
                <Button variant="primary" onClick={closeTicket}>Ответить и закрыть</Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Управление</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Статус</span>
                <CustomSelect className="mt-2" options={['Открыт', 'Закрыт']} value={status} onChange={setStatus} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Приоритет</span>
                <CustomSelect className="mt-2" options={['Высокий', 'Обычный', 'Низкий']} value={priority} onChange={setPriority} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Ответственный</span>
                <CustomSelect className="mt-2" options={['support@axioma.ru', 'finance@axioma.ru', 'moderator@axioma.ru']} value={assignee} onChange={setAssignee} />
              </label>
            </div>
            <div className="mt-5 space-y-2">
              {isClosed ? (
                <Button variant="secondary" className="w-full" onClick={reopenTicket}>Переоткрыть тикет</Button>
              ) : (
                <Button variant="secondary" className="w-full" onClick={closeTicket}>Закрыть без ответа</Button>
              )}
              <Button variant="secondary" className="w-full" onClick={() => navigate('admin_support')}>Вернуться в очередь</Button>
            </div>
            <div className="mt-4"><ActionResult text={result} tone={result.startsWith('Введите') || result.startsWith('Перед') ? 'error' : 'success'} /></div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">История тикета</h2>
            <div className="space-y-4">
              {[
                ['Создан', ticket.created, 'done'],
                ['Назначен ответственный', assignee, 'done'],
                [isClosed ? 'Закрыт' : 'Ожидает ответа', isClosed ? ticket.lastActivity : ticket.sla, isClosed ? 'done' : 'current'],
              ].map(([label, value, state]) => (
                <div key={`${label}-${value}`} className="flex gap-3">
                  {state === 'done' ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : <Clock className="mt-0.5 h-4 w-4 text-amber-500" />}
                  <div>
                    <div className="text-sm font-medium text-[#0b3558]">{label}</div>
                    <div className="text-xs text-[#476788]">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const AdminUserDetailView = ({ navigate, selection }) => {
  const row = selection?.row || mockAdminSections.admin_users.rows[0];
  const isPublisher = row[2] === 'Паблишер';
  const [activeTab, setActiveTab] = useState('Обзор');
  const [accountStatus, setAccountStatus] = useState(row[3]);
  const userTypeLabel = isPublisher ? 'Паблишер' : row[2];
  const tabs = ['Обзор', 'Компания и реквизиты', isPublisher ? 'Площадки' : 'Рекламодатели', 'Заказы', 'Финансы', 'Команда и активность'];

  const overview = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {(isPublisher
          ? [['Принято заказов', '148'], ['Опубликовано', '132'], ['Отказы', '9'], ['Споры', '3']]
          : [['Создано заказов', '42'], ['Принято публикаций', '36'], ['Активные заказы', '4'], ['Споры', '2']]
        ).map(([label, value]) => <Card key={label} className="p-5"><div className="text-xs text-[#476788]">{label}</div><div className="mt-2 text-2xl font-semibold">{value}</div></Card>)}
      </div>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold">Контактные данные</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(isPublisher
            ? [['Email', 'editor@publisher.ru'], ['Телефон', '+7 495 111-22-33'], ['Ответственный', 'Анна Смирнова'], ['Дата регистрации', '12.06.2023']]
            : [['Email', 'owner@fintech.ru'], ['Телефон', '+7 495 000-11-22'], ['Ответственный', 'Александр Иванов'], ['Дата регистрации', '03.04.2023']]
          ).map(([label, value]) => <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>)}
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6"><h2 className="font-display text-base font-bold">Безопасность</h2><div className="mt-4 space-y-3 text-sm">{[['Двухфакторная защита', 'Включена'], ['Последний вход', 'Сегодня, 12:48'], ['Активные сессии', '2'], ['Последняя смена пароля', '14.09.2023']].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><span className="text-[#476788]">{label}</span><span className="font-medium">{value}</span></div>)}</div></Card>
        <Card className="p-6"><h2 className="font-display text-base font-bold">Риски и ограничения</h2><div className="mt-4 space-y-3 text-sm">{[['Уровень риска', 'Низкий'], ['Нарушения', '0 активных'], ['Ограничения', 'Нет'], ['Проверка реквизитов', 'Пройдена']].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><span className="text-[#476788]">{label}</span><span className="font-medium">{value}</span></div>)}</div></Card>
      </div>
    </div>
  );

  const company = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6"><h2 className="font-display text-base font-bold">{isPublisher ? 'Реквизиты получателя' : 'Юридические данные и документы'}</h2><div className="mt-4 space-y-4">{(isPublisher
        ? [['Статус получателя', 'Юридическое лицо'], ['Получатель', 'ООО Редакция'], ['ИНН', '7701000000'], ['КПП', '770101001'], ['ОГРН', '1237701000000'], ['Система налогообложения', 'ОСНО, НДС 22%'], ['Юридический адрес', '125009, Москва, ул. Тверская, 7']]
        : [['Статус плательщика', 'Юридическое лицо'], ['Юридическое название', 'ООО «Финтех Решения»'], ['ИНН', '7700000000'], ['КПП', '770001001'], ['ОГРН', '1237700000000'], ['Система налогообложения', 'ОСНО, НДС 22%'], ['Юридический адрес', '125009, Москва, ул. Тверская, 1']]
      ).map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-sm font-medium break-words">{value}</div></div><CopyButton value={value} label={`Скопировать ${label}`} /></div>)}</div></Card>
      <Card className="p-6"><div className="flex items-center justify-between"><h2 className="font-display text-base font-bold">Банковские реквизиты</h2><Badge color="green">проверены</Badge></div><div className="mt-4 space-y-4">{(isPublisher
        ? [['Банк', 'АО Банк'], ['Расчетный счет', '40702810********4432'], ['БИК', '044525000'], ['График выплат', '1 раз в месяц']]
        : [['Банк', 'АО «Банк»'], ['Расчетный счет', '40702810900000004432'], ['Корреспондентский счет', '30101810400000000225'], ['БИК', '044525000']]
      ).map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-sm font-medium break-words">{value}</div></div><CopyButton value={value} label={`Скопировать ${label}`} /></div>)}</div></Card>
      <Card className="p-6 lg:col-span-2"><div className="flex items-center justify-between"><h2 className="font-display text-base font-bold">Электронный документооборот</h2><Badge color="green">подключен</Badge></div><div className="mt-4 divide-y divide-[#d4e0ed] rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] overflow-hidden"><div className="px-4 py-3"><div className="text-xs text-[#476788]">Оператор ЭДО</div><div className="mt-1 text-sm font-medium text-[#0b3558]">Диадок</div></div><div className="flex items-start justify-between gap-3 px-4 py-3 bg-white"><div className="min-w-0"><div className="text-xs text-[#476788]">Идентификатор оператора ЭДО</div><div className="mt-1 text-sm font-medium break-words">{isPublisher ? '2BM-7701000000-770101001-2024010100000000000000000' : '2BM-7700000000-770001001-2024010100000000000000000'}</div></div><CopyButton value={isPublisher ? '2BM-7701000000-770101001-2024010100000000000000000' : '2BM-7700000000-770001001-2024010100000000000000000'} label="Скопировать идентификатор оператора ЭДО" /></div></div></Card>
      <Card className="p-6 lg:col-span-2"><h2 className="font-display text-base font-bold">Документы и проверки</h2><div className="mt-4 divide-y divide-[#d4e0ed]">{[['Карточка организации', 'проверена', '12.06.2023'], ['Договор-оферта', 'подписан', '12.06.2023'], ['Реквизиты', 'проверены', '15.06.2023']].map(([name, status, date]) => <div key={name} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 text-sm"><span className="font-medium">{name}</span><Badge color="green">{status}</Badge><span className="text-[#476788]">{date}</span></div>)}</div></Card>
    </div>
  );

  const entities = (
    isPublisher ? (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#d4e0ed]">
            <h2 className="font-display text-base font-bold">Площадки паблишера</h2>
            <Badge color="blue">3 площадки</Badge>
          </div>
          <div className="space-y-3">
            {[
              ['РБК Инвестиции', 'СМИ', 'Активна', '2,5 млн/мес', 'Статья, новость', '150 000 ₽'],
              ['РБК Телеграм', 'ТГ-канал', 'На проверке', '210 тыс. подписчиков', 'Пост', '60 000 ₽'],
              ['РБК Бизнес ВК', 'Паблик ВК', 'Требуются правки', '480 тыс. подписчиков', 'Пост, карточки', '85 000 ₽'],
            ].map(([name, type, status, metric, formats, price]) => (
              <button key={name} type="button" onClick={() => navigate('admin_platform_detail')} className="w-full rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-left transition-colors hover:border-[#006bff] hover:bg-[#e6f0ff] focus:outline-none focus:ring-2 focus:ring-[#006bff]">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-4 min-w-0 lg:flex-1">
                    <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white border border-[#d4e0ed] text-[#0b3558]">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-[#0b3558]">{name}</div>
                      <div className="mt-1 text-sm text-[#476788]">{type}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm lg:w-[560px]">
                    <div><div className="text-xs text-[#476788]">Метрики</div><div className="mt-0.5 font-medium text-[#0b3558]">{metric}</div></div>
                    <div><div className="text-xs text-[#476788]">Форматы</div><div className="mt-0.5 font-medium text-[#0b3558]">{formats}</div></div>
                    <div><div className="text-xs text-[#476788]">Базовая цена</div><div className="mt-0.5 font-medium text-[#0b3558]">{price}</div></div>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:w-[210px]">
                    <Badge color={status === 'Активна' ? 'green' : status === 'На проверке' ? 'blue' : 'amber'}>{status}</Badge>
                    <ChevronRight className="h-4 w-4 text-[#476788]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#d4e0ed]">
            <h2 className="font-display text-base font-bold">Рекламодатели заказчика</h2>
            <Badge color="blue">4 рекламодателя</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              ['A-842', 'ООО «Финтех Решения»', 'Юридическое лицо', 'Проверен', '7700000000', '1237700000000'],
              ['A-901', 'АО «Урбан Групп»', 'Юридическое лицо', 'Проверен', '7709000000', '1237709000000'],
              ['A-112', 'ИП Смирнова Анна', 'Индивидуальный предприниматель', 'Проверка запрошена', '771100000000', '323770000000000'],
              ['A-055', 'ООО «ТехКорп»', 'Юридическое лицо', 'Не проверялся', '7722000000', '1237722000000'],
            ].map(([id, name, type, status, inn, ogrn]) => (
              <div key={id} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-[#476788]">{id} · {type}</div>
                    <div className="mt-1 text-base font-semibold text-[#0b3558]">{name}</div>
                  </div>
                  <Badge color={status === 'Проверен' ? 'green' : status === 'Проверка запрошена' ? 'amber' : 'gray'}>{status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-[#476788]">ИНН</div><div className="mt-0.5 font-medium">{inn}</div></div>
                  <div><div className="text-xs text-[#476788]">ОГРН / ОГРНИП</div><div className="mt-0.5 font-medium">{ogrn}</div></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )
  );

  const operations = (
      <Card className="overflow-hidden">
        <div className="px-6 py-5 border-b border-[#d4e0ed]"><h2 className="font-display text-base font-bold">{isPublisher ? 'Заказы паблишера' : 'Заказы заказчика'}</h2></div>
        <div className="overflow-x-auto"><table className="min-w-[900px] w-full divide-y divide-[#d4e0ed]"><thead className="bg-[#f8f9fb]"><tr>{['Заказ', 'Материал', 'Контрагент', 'Сумма', 'Статус', ''].map(head => <th key={head || 'action'} className="px-5 py-3 text-left text-xs text-[#476788] uppercase">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#d4e0ed]">{mockOrdersClient.slice(0, 4).map(order => <tr key={order.id} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => navigate('admin_order_detail')}><td className="px-5 py-4 text-sm font-medium text-[#006bff]">№{orderNumber(order)}</td><td className="px-5 py-4 text-sm">{order.material}</td><td className="px-5 py-4 text-sm text-[#476788]">{isPublisher ? `Заказчик #${order.id - 203}` : order.platform}</td><td className="px-5 py-4 text-sm font-medium">{formatMoney(order.price)}</td><td className="px-5 py-4"><Badge color={order.statusColor}>{order.status}</Badge></td><td className="px-5 py-4 text-right text-sm font-medium text-[#006bff]">Открыть</td></tr>)}</tbody></table></div>
      </Card>
  );

  const finance = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{(isPublisher ? [['Доступно к выводу', '235 000 ₽'], ['Ожидает приемки', '127 500 ₽'], ['Выплачено всего', '2 840 000 ₽']] : [['Доступно', '1 250 000 ₽'], ['Заморожено', '345 000 ₽'], ['Потрачено всего', '3 420 000 ₽']]).map(([label, value]) => <Card key={label} className="p-5"><div className="text-xs text-[#476788]">{label}</div><div className="mt-2 text-xl font-semibold">{value}</div></Card>)}</div>
      <Card className="overflow-hidden"><div className="px-6 py-5 border-b border-[#d4e0ed]"><h2 className="font-display text-base font-bold">Последние транзакции</h2></div><div className="overflow-x-auto"><table className="min-w-[760px] w-full divide-y divide-[#d4e0ed]"><tbody className="divide-y divide-[#d4e0ed]">{mockTransactions.slice(0, 6).map(tx => <tr key={tx.id}><td className="px-5 py-4 text-sm font-medium">{tx.id}</td><td className="px-5 py-4 text-sm">{tx.type}</td><td className="px-5 py-4 text-sm text-[#476788]">{tx.desc}</td><td className="px-5 py-4 text-sm font-semibold">{formatMoney(tx.amount)}</td><td className="px-5 py-4"><Badge color="gray">{tx.status}</Badge></td></tr>)}</tbody></table></div></Card>
    </div>
  );

  const team = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6"><h2 className="font-display text-base font-bold">Команда и роли</h2><div className="mt-4 divide-y divide-[#d4e0ed]">{[['owner@company.ru', 'Администратор', 'активен'], ['editor@company.ru', isPublisher ? 'Публикации' : 'Заказы и материалы', 'активен'], ['finance@company.ru', 'Финансы', 'приглашен']].map(([email, role, status]) => <div key={email} className="py-3 flex items-center justify-between gap-3"><div><div className="text-sm font-medium">{email}</div><div className="text-xs text-[#476788]">{role}</div></div><Badge color={status === 'активен' ? 'green' : 'amber'}>{status}</Badge></div>)}</div></Card>
      <Card className="p-6"><h2 className="font-display text-base font-bold">Последняя активность</h2><div className="mt-4 space-y-4">{[['Сегодня, 12:48', 'Вход в аккаунт'], ['Сегодня, 11:20', isPublisher ? 'Открыта карточка заказа #1045' : 'Создан заказ #1048'], ['Вчера, 18:05', 'Изменены настройки уведомлений'], ['17.10, 15:30', 'Добавлен сотрудник команды']].map(([time, event]) => <div key={`${time}-${event}`} className="flex gap-3"><Clock className="mt-0.5 w-4 h-4 text-[#a6bbd1]" /><div><div className="text-sm font-medium">{event}</div><div className="text-xs text-[#476788]">{time}</div></div></div>)}</div></Card>
      <Card className="p-6 lg:col-span-2"><h2 className="font-display text-base font-bold">Связанные обращения и события аудита</h2><div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">{[['T-118', 'Обращение в поддержку', 'в работе'], ['LOG-8841', 'Изменены реквизиты компании', 'зафиксировано']].map(([id, title, status]) => <div key={id} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">{id}</div><div className="mt-1 text-sm font-medium">{title}</div><Badge color="blue" className="mt-3">{status}</Badge></div>)}</div></Card>
    </div>
  );

  const content = activeTab === 'Обзор' ? overview : activeTab === 'Компания и реквизиты' ? company : activeTab === 'Финансы' ? finance : activeTab === 'Команда и активность' ? team : activeTab === 'Заказы' ? operations : entities;

  return (
    <div className="space-y-6">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_users')}><ChevronRight className="w-4 h-4 rotate-180" /> К пользователям</button>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div><h1 className="font-display text-2xl font-bold flex items-center gap-3">{row[1]} <Badge color={accountStatus === 'Заблокирован' ? 'red' : accountStatus === 'На проверке' ? 'amber' : 'green'}>{accountStatus}</Badge></h1><p className="mt-1 text-sm text-[#476788]">{row[0]} · {userTypeLabel} · зарегистрирован 12.06.2023</p></div>
        <div className="flex flex-wrap gap-3"><Button variant="secondary" onClick={() => setAccountStatus(accountStatus === 'Заблокирован' ? 'Активен' : 'Заблокирован')}>{accountStatus === 'Заблокирован' ? 'Разблокировать' : 'Заблокировать'}</Button><Button variant="secondary">Завершить все сессии</Button></div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-[#d4e0ed]">
        {tabs.map(tab => <button key={tab} className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-[#006bff] text-[#006bff]' : 'border-transparent text-[#476788]'}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </div>
      {content}
    </div>
  );
};

const AdminSettingsView = () => {
  const [saved, setSaved] = useState(false);
  const backend=useBackend();
  if(backend.user.teamRole==='moderator')return <TeamMemberSettingsView />;
  return (
  <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold">Настройки админки</h1><p className="mt-1 text-sm text-[#476788]">Роли, уведомления и операционные параметры платформы.</p></div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {backend.user.isPrimaryAdmin&&<TeamAccessSettingsBlock description="Назначайте доступ к модерации, финансам и поддержке." members={[
        ['Модератор', 'moderator@axioma.ru', 'Модерация', 'активен', 'green'],
        ['Финансы', 'finance@axioma.ru', 'Финансы', 'активен', 'green'],
        ['Поддержка', 'support@axioma.ru', 'Поддержка', 'активен', 'green'],
      ]} />}
      <AccountSecuritySettings />
      <NotificationsSettingsBlock events={[
        ['Просрочен SLA модерации', true, true],
        ['Открыт новый спор', true, true],
        ['Создана заявка на выплату', true, false],
        ['Критическая ошибка операции', true, true],
      ]} />
      <SettingsSection title="Параметры платформы" description="Значения применяются к новым операциям." icon={Settings}>
        <div className="space-y-4"><SettingField label="Комиссия платформы"><input className={settingInputClass} defaultValue="15%" /></SettingField><SettingField label="SLA модерации"><CustomSelect className="mt-2" options={['2 часа', '4 часа', '1 рабочий день']} /></SettingField><SettingField label="Срок ответа по спору"><CustomSelect className="mt-2" options={['1 рабочий день', '2 рабочих дня', '3 рабочих дня']} /></SettingField></div><Button variant="primary" className="mt-5 w-full" onClick={() => setSaved(true)}>{saved ? 'Параметры сохранены' : 'Сохранить параметры'}</Button>
      </SettingsSection>
    </div>
  </div>
  );
};

// --- MAIN APP COMPONENT ---

const TeamInvitationPage = ({token}) => {
  const [invite,setInvite]=useState(null);
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  useEffect(()=>{api(`/team/invitation/${encodeURIComponent(token)}`).then(setInvite).catch(event=>setError(event.message));},[token]);
  return <main className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-4">
    <Card className="w-full max-w-lg p-6">
      <h1 className="font-display text-xl font-bold text-[#0b3558]">Доступ к команде</h1>
      {error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {done?<><p className="mt-4 text-sm text-[#476788]">Пароль создан. Войдите в кабинет под своим email.</p><Button variant="primary" className="mt-5" onClick={()=>{location.href='/'}}>Перейти ко входу</Button></>
        :invite?<form className="mt-5 space-y-4" onSubmit={async event=>{
          event.preventDefault();setError('');
          try{await api('/team/accept','POST',{token,password});setDone(true);}catch(failure){setError(failure.message);}
        }}>
          <p className="text-sm text-[#476788]">{invite.email} · {invite.role==='customer'?'Заказчик':invite.role==='publisher'?'Паблишер':'Администратор'}</p>
          <SettingField label="Пароль"><input required type="password" autoComplete="new-password" minLength={12} maxLength={128} className={settingInputClass} value={password} onChange={event=>setPassword(event.target.value)} /></SettingField>
          <Button variant="primary" type="submit">Принять приглашение</Button>
        </form>:!error&&<p className="mt-4 text-sm text-[#476788]">Загрузка…</p>}
    </Card>
  </main>;
};

export default function App() {
  const backend = useBackend();
  // Режим интерфейса: лендинг, заказчик, площадка, админка
  const [globalMode, setGlobalMode] = useState('landing');

  // Состояние кабинета заказчика
	  const [clientView, setClientView] = useCabinetView('customer','dashboard');
	  const favoritePlatforms = backend.data.favorites;
	  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationReads, setNotificationReads] = useState<string[]>([]);
  const [notificationTickets, setNotificationTickets] = useState<any[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  useEffect(()=>{
    if(!backend.user){setNotificationReads([]);return;}
    let active=true;
    api<string[]>('/notifications/read').then(keys=>{if(active)setNotificationReads(keys);}).catch(()=>{});
    return ()=>{active=false;};
  },[backend.user?.id,notificationsOpen]);
  useEffect(()=>{
    if(!backend.user||backend.user.teamRole==='moderator'){setNotificationTickets([]);return;}
    let active=true;
    const load=()=>{if(document.visibilityState==='visible')api<any[]>('/tickets').then(rows=>{if(active)setNotificationTickets(rows);}).catch(()=>{});};
    load();
    const timer=setInterval(load,30000);
    return ()=>{active=false;clearInterval(timer);};
  },[backend.user?.id,notificationsOpen]);
  useEffect(()=>{
    if(!backend.user)return;
    const refresh=()=>{if(document.visibilityState==='visible')backend.refresh(backend.user).catch(()=>{});};
    const timer=setInterval(refresh,60000);
    document.addEventListener('visibilitychange',refresh);
    return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
  },[backend.user?.id]);
  useEffect(()=>{if(notificationsOpen&&backend.user)backend.refresh(backend.user).catch(()=>{});},[notificationsOpen,backend.user?.id]);
  const projects = backend.data.projects;
  const clientMaterials = backend.data.materials;
  const clientOrders = backend.data.orders;
  const reports = (backend.data.reports?.placements || []).map((placement) => {
    const order=clientOrders.find((item)=>item.id===placement.id);
    return {
      ...placement,
      order:`№${placement.number}`,
      date:new Date(placement.updatedAt).toLocaleDateString('ru-RU'),
      price:placement.amount/100,
      status:order?.status || placement.status,
      color:order?.statusColor || 'blue',
    };
  });
  const [selectedProjectId, setSelectedProjectId] = useState<any>(()=>new URLSearchParams(location.search).get('project'));
  const [selectedMaterialId, setSelectedMaterialId] = useState<any>(()=>new URLSearchParams(location.search).get('material'));
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<any>(()=>new URLSearchParams(location.search).get('advertiser'));
  const [selectedOrderId, setSelectedOrderId] = useState<any>(()=>new URLSearchParams(location.search).get('order'));
  const [materialProjectPreset, setMaterialProjectPreset] = useState(null);
  const [selectedReportOrder, setSelectedReportOrder] = useState<any>(()=>new URLSearchParams(location.search).get('report'));
  const [projectReportConfig, setProjectReportConfig] = useState<any>({
    projectId: null,
    from: '',
    to: '',
    label: '',
  });
  const savedProjectReport = (backend.data.reports?.saved || []).find((report) => report.id === selectedReportOrder);
  const effectiveProjectReportConfig = projectReportConfig.projectId ? projectReportConfig : savedProjectReport ? {
    projectId:savedProjectReport.project_id,
    from:String(savedProjectReport.date_from).slice(0,10),
    to:String(savedProjectReport.date_to).slice(0,10),
    label:'Выбранный период',
    reportId:savedProjectReport.id,
  } : projectReportConfig;

  // Состояние кабинета паблишера
  const [publisherView, setPublisherView] = useCabinetView('publisher','pub_dashboard');
  const [adminSelection, setAdminSelection] = useState(null);

  // Состояние админки
  const [adminView, setAdminView] = useCabinetView('admin','admin_dashboard');
  const [publisherApplications, setPublisherApplications] = useState([]);
  const [selectedPublisherApplicationId, setSelectedPublisherApplicationId] = useState(() => new URLSearchParams(location.search).get('application'));
  useEffect(()=>{if(backend.user?.role==='admin'&&backend.user.teamRole!=='moderator')api('/admin/publisher-applications').then(setPublisherApplications).catch(error=>backend.setError(error.message));},[backend.user?.id]);
  const informerItems=backend.data.informers;
  const setInformerItems=(update)=>backend.perform(async()=>{
    const next=typeof update==='function'?update(informerItems):update;
    for(const item of next){const old=informerItems.find(i=>i.id===item.id);if(JSON.stringify(old)===JSON.stringify(item))continue;
      const {id,updatedAt,...data}=item;await api(old?`/informers/${id}`:'/informers',old?'PUT':'POST',data);
    }
    for(const old of informerItems)if(!next.some(i=>i.id===old.id))await api(`/informers/${old.id}`,'DELETE');
    await backend.refresh();
  });
  const [adminNavOpenGroup, setAdminNavOpenGroup] = useState('participants');

  const toggleFavoritePlatform = (id) => backend.perform(async () => {
    await api(`/favorites/${id}`,'PUT',{favorite:!favoritePlatforms.includes(id)});
    await backend.refresh();
  });

  const clientNav = [
    { id: 'dashboard', label: 'Панель', icon: LayoutDashboard },
    { id: 'reputation', label: 'Репутация', icon: BarChart3 },
    { id: 'projects', label: 'Проекты', icon: FolderKanban },
    { id: 'materials', label: 'Материалы', icon: FileText },
    { id: 'catalog', label: 'Каталог площадок', icon: Store },
    { id: 'orders', label: 'Заказы', icon: Briefcase },
    { id: 'reports', label: 'Отчеты', icon: Download },
    { id: 'support', label: 'Поддержка', icon: MessageSquare },
    { id: 'balance', label: 'Финансы и документы', icon: CreditCard },
    { id: 'advertisers', label: 'Рекламодатели', icon: Briefcase },
    { id: 'settings', label: 'Настройки', icon: Settings },
  ];

  const publisherNav = [
    { id: 'pub_dashboard', label: 'Панель', icon: LayoutDashboard },
    { id: 'pub_orders', label: 'Заказы', icon: Briefcase },
    { id: 'pub_platforms', label: 'Мои площадки', icon: Store },
    { id: 'pub_support', label: 'Поддержка', icon: MessageSquare },
    { id: 'pub_finance', label: 'Выплаты', icon: CreditCard },
    { id: 'pub_settings', label: 'Настройки', icon: Settings },
  ];

  const adminPrimaryNav = [
    { id: 'admin_dashboard', label: 'Панель', icon: LayoutDashboard },
    { id: 'admin_moderation', label: 'Модерация', icon: ShieldCheck },
    { id: 'admin_orders', label: 'Заказы', icon: Briefcase },
    { id: 'admin_publisher_applications', label: 'Заявки паблишеров', icon: Store },
  ];
  const adminNavGroups = [
    {
      id: 'participants',
      label: 'Участники',
      icon: Settings,
      items: [
        { id: 'admin_users', label: 'Пользователи', icon: Settings },
        { id: 'admin_advertisers', label: 'Рекламодатели', icon: Briefcase },
        { id: 'admin_platforms', label: 'Площадки', icon: Store },
      ],
    },
    {
      id: 'finance',
      label: 'Финансы',
      icon: CreditCard,
      items: [
        { id: 'admin_balances', label: 'Балансы', icon: CreditCard },
        { id: 'admin_operations', label: 'Операции', icon: Download },
        { id: 'admin_payouts', label: 'Выплаты', icon: Download },
        { id: 'admin_bank_review', label: 'Банковская сверка', icon: CreditCard },
        { id: 'admin_documents', label: 'Документы', icon: FileText },
      ],
    },
    {
      id: 'requests',
      label: 'Обращения',
      icon: MessageSquare,
      items: [
        { id: 'admin_complaints', label: 'Жалобы', icon: AlertCircle },
        { id: 'admin_support', label: 'Поддержка', icon: MessageSquare },
      ],
    },
    {
      id: 'system',
      label: 'Система',
      icon: Settings,
      items: [
        { id: 'admin_informer', label: 'Информер', icon: Bell },
        { id: 'admin_audit', label: 'Аудит', icon: ShieldCheck },
        { id: 'admin_integrations', label: 'API интеграции', icon: Link2 },
        { id: 'admin_settings', label: 'Настройки', icon: Settings },
      ],
    },
  ];
  const moderatorViews = new Set(['admin_moderation','admin_moderation_detail','admin_advertisers','admin_platforms','admin_platform_detail','admin_settings']);
  const isModerator = backend.user?.role==='admin'&&backend.user.teamRole==='moderator';
  const visibleAdminPrimaryNav = isModerator ? adminPrimaryNav.filter(item=>item.id==='admin_moderation') : adminPrimaryNav;
  const visibleAdminNavGroups = isModerator ? adminNavGroups.map(group=>({...group,items:group.items.filter(item=>['admin_advertisers','admin_platforms','admin_settings'].includes(item.id))})).filter(group=>group.items.length) : adminNavGroups;
  const adminNav = [...visibleAdminPrimaryNav, ...visibleAdminNavGroups.flatMap((group) => group.items)];
  useEffect(()=>{if(isModerator&&!moderatorViews.has(adminView))setAdminView('admin_moderation');},[isModerator,adminView]);

  useEffect(() => {
    if (globalMode !== 'admin') return;
    const activeGroup = adminNavGroups.find((group) => group.items.some((item) => item.id === adminView));
    if (activeGroup) setAdminNavOpenGroup(activeGroup.id);
  }, [adminView, globalMode]);
  useEffect(() => {
    setGlobalMode(backend.user ? {customer:'client', publisher:'publisher', admin:'admin'}[backend.user.role] : 'landing');
    if(backend.ready && !backend.user && /^\/(customer|publisher|admin)(\/|$)/.test(location.pathname) && location.pathname!=='/admin' && location.pathname!=='/admin/login') {
      history.replaceState(null,'','/');
    }
    if(backend.user && location.pathname!=='/' && (!location.pathname.startsWith(`/${backend.user.role}/`) && location.pathname!==`/${backend.user.role}` || location.pathname.endsWith('/login'))) {
      history.replaceState(null,'',`/${backend.user.role}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [backend.user?.id, backend.ready]);

  // Логика маршрутизации
  useEffect(()=>{
    const restore=()=>{
      const q=new URLSearchParams(location.search);
      setSelectedMaterialId(q.get('material'));setSelectedAdvertiserId(q.get('advertiser'));setSelectedOrderId(q.get('order'));setSelectedProjectId(q.get('project'));setSelectedReportOrder(q.get('report'));setSelectedPublisherApplicationId(q.get('application'));backend.setOutletId(q.get('outlet'));
    };
    window.addEventListener('popstate',restore);return()=>window.removeEventListener('popstate',restore);
  },[]);
  useEffect(()=>{
    if(!backend.user)return;
    const q=new URLSearchParams(location.search);
    for(const key of ['material','advertiser','order','project','report','outlet','application'])q.delete(key);
    const view=backend.user.role==='admin'?adminView:backend.user.role==='publisher'?publisherView:clientView;
    if(!['support','pub_support','admin_support'].includes(view)){q.delete('ticket');q.delete('support_tab');}
    const params={
      material:['material_detail','material_edit','admin_moderation_detail'].includes(view)?selectedMaterialId:null,
      advertiser:['advertiser_detail','advertiser_edit'].includes(view)?selectedAdvertiserId:null,
      order:/(^order_|^complaint$|^dispute_detail$|^pub_order_|^pub_complaint$|^pub_dispute_detail$|^admin_order_|^admin_dispute_detail$)/.test(view)?selectedOrderId:null,
      project:view==='project_detail'?selectedProjectId:null,
      report:['report_detail','project_report'].includes(view)?selectedReportOrder:null,
      outlet:['platform_detail','pub_platform_detail','admin_platform_detail'].includes(view)?backend.outletId:null,
      application:view==='admin_publisher_application_detail'?selectedPublisherApplicationId:null,
    };
    for(const [key,id] of Object.entries(params))if(id)q.set(key,String(id));
    const search=q.toString();
    history.replaceState(null,'',location.pathname+(search?'?'+search:''));
  },[clientView,publisherView,adminView,selectedMaterialId,selectedAdvertiserId,selectedOrderId,selectedProjectId,selectedReportOrder,selectedPublisherApplicationId,backend.outletId,backend.user?.id]);
  if (!backend.ready) return <div className="p-8 text-[#476788]">Загрузка…</div>;
  const invitationToken=new URLSearchParams(location.search).get('invite');
  if(invitationToken&&!backend.user)return <TeamInvitationPage token={invitationToken} />;
  if (location.pathname==='/' || globalMode === 'landing' || !backend.user) {
    if(location.pathname==='/admin' || location.pathname.startsWith('/admin/')) return <AdminLogin />;
    return <LandingView setGlobalMode={setGlobalMode} />;
  }

  const isClient = globalMode === 'client';
  const isAdmin = globalMode === 'admin';
  const navItems = isClient ? clientNav : isAdmin ? adminNav : publisherNav;
  const currentView = isClient ? clientView : isAdmin ? adminView : publisherView;
  const setView = isClient ? setClientView : isAdmin ? setAdminView : setPublisherView;
  const operationalQueueCount = backend.data.materials.filter((material) => material.apiStatus === 'pending').length
    + backend.data.orders.filter((order) => order.apiStatus === 'disputed').length;
  const operationalQueueLabel = operationalQueueCount % 10 === 1 && operationalQueueCount % 100 !== 11
    ? 'задача'
    : [2, 3, 4].includes(operationalQueueCount % 10) && ![12, 13, 14].includes(operationalQueueCount % 100)
      ? 'задачи'
      : 'задач';
  const notifications: {key:string;title:string;text:string;target:any;color:string}[] = isModerator
    ? backend.data.materials.filter(item=>item.apiStatus==='pending').map(item=>({key:`material:${item.id}:pending`,title:'Материал на модерации',text:`Материал №${materialNumber(item)} ожидает проверки`,target:{view:'admin_moderation_detail',section:'admin_moderation',id:item.id},color:'blue'}))
    : isAdmin
    ? [
        ...backend.data.materials.filter(item=>item.apiStatus==='pending').map(item=>({key:`material:${item.id}:pending`,title:'Новый материал на модерации',text:`Материал №${materialNumber(item)} ожидает проверки`,target:{view:'admin_moderation_detail',section:'admin_moderation',id:item.id},color:'blue'})),
        ...publisherApplications.filter(item=>['Новая','На проверке'].includes(item.status)).map(item=>({key:`application:${item.id}:pending`,title:'Новая заявка паблишера',text:`${item.platform} ожидает проверки`,target:{view:'admin_publisher_application_detail',id:item.id},color:'blue'})),
        ...backend.data.orders.filter(item=>item.apiStatus==='disputed').map(item=>({key:`order:${item.id}:disputed`,title:'Открыт спор',text:`Заказ №${orderNumber(item)}`,target:{view:'admin_dispute_detail',section:'admin_complaints',id:item.id},color:'red'})),
        ...backend.data.payouts.filter(item=>item.status==='pending').map(item=>({key:`payout:${item.id}:pending`,title:'Выплата ожидает подтверждения',text:`Заявка №${item.number}`,target:{view:'admin_payout_detail',section:'admin_payouts',id:item.id},color:'amber'})),
      ]
    : isClient
      ? [
          ...backend.data.orders.filter(item=>item.apiStatus==='submitted').map(item=>({key:`order:${item.id}:submitted`,title:'Паблишер загрузил публикацию',text:`Заказ №${orderNumber(item)} ожидает приемки`,target:{view:'order_detail',id:item.id},color:'blue'})),
          ...backend.data.orders.filter(item=>item.apiStatus==='disputed').map(item=>({key:`order:${item.id}:disputed`,title:'Открыт спор',text:`Заказ №${orderNumber(item)}`,target:{view:'dispute_detail',id:item.id},color:'amber'})),
        ]
      : [
          ...backend.data.orders.filter(item=>item.apiStatus==='pending').map(item=>({key:`order:${item.id}:pending`,title:'Новый входящий заказ',text:`Заказ №${orderNumber(item)} ожидает решения`,target:{view:'pub_order_new_detail',id:item.id},color:'blue'})),
          ...backend.data.orders.filter(item=>item.apiStatus==='accepted').map(item=>({key:`order:${item.id}:accepted`,title:'Заказ ожидает публикации',text:`По заказу №${orderNumber(item)} нужно загрузить ссылку`,target:{view:'pub_order_detail',id:item.id},color:'amber'})),
          ...backend.data.orders.filter(item=>item.apiStatus==='disputed').map(item=>({key:`order:${item.id}:disputed`,title:'Открыт спор',text:`Заказ №${orderNumber(item)}`,target:{view:'pub_dispute_detail',id:item.id},color:'red'})),
        ];
  if(!isModerator)notifications.push(...notificationTickets.filter(ticket=>ticket.awaiting_reply&&ticket.last_message_id).map(ticket=>({
    key:`ticket:${ticket.id}:${ticket.last_message_id}`,
    title:isAdmin?'Новое обращение в поддержку':'Ответ поддержки',
    text:`Тикет T-${ticket.number} · ${ticket.subject}`,
    target:{view:isAdmin?'admin_support':isClient?'support':'pub_support',id:ticket.id},
    color:'blue',
  })));
  const unreadNotifications=notifications.filter(item=>!notificationReads.includes(item.key));
  const openNotificationTarget = (notification) => {
    if(!notificationReads.includes(notification.key)){
      setNotificationReads(keys=>[...keys,notification.key]);
      api('/notifications/read','POST',{key:notification.key}).catch(()=>setNotificationReads(keys=>keys.filter(key=>key!==notification.key)));
    }
    setNotificationsOpen(false);
    setShowAllNotifications(false);
    const {view,id,section}=notification.target;
    if(section)setAdminSelection({section,row:[id]});
    if(['support','pub_support','admin_support'].includes(view)){setView(view,{ticket:id});window.dispatchEvent(new PopStateEvent('popstate'));return;}
    if(view==='admin_moderation_detail')setSelectedMaterialId(id);
    else if(view==='admin_publisher_application_detail')setSelectedPublisherApplicationId(id);
    else if(view.includes('order')||view.includes('dispute'))setSelectedOrderId(id);
    setView(view);
  };
  const parentViewByDetail = {
    project_detail: 'projects',
    material_detail: 'materials',
    material_edit: 'materials',
    create_material: 'materials',
    order_detail: 'orders',
    order_pending_detail: 'orders',
    order_rejected_detail: 'orders',
    order_completed_detail: 'orders',
    complaint: 'orders',
    dispute_detail: 'orders',
    order_chat: 'orders',
    report_detail: 'reports',
    project_report: 'reports',
    admin_moderation_detail: 'admin_moderation',
    admin_order_detail: 'admin_orders',
    admin_order_chat: 'admin_orders',
    admin_publisher_application_detail: 'admin_publisher_applications',
    admin_user_detail: 'admin_users',
    admin_advertiser_detail: 'admin_advertisers',
    admin_platform_detail: 'admin_platforms',
    admin_finance_detail: adminSelection?.section === 'admin_operations' ? 'admin_operations' : 'admin_balances',
    admin_dispute_detail: 'admin_complaints',
    admin_payout_detail: 'admin_payouts',
    admin_ticket_detail: 'admin_support',
    admin_document_detail: 'admin_documents',
    admin_audit_detail: 'admin_audit',
  };
  const activeNavView = parentViewByDetail[currentView] || currentView;
  const openAdminDetail = (section, row, route) => {
    if(section==='admin_orders'||section==='admin_complaints')setSelectedOrderId(row[0]);
    if(section==='admin_moderation')setSelectedMaterialId(row[0]);
    setAdminSelection({ section, row });
    setAdminView(route);
  };
  const openAdminPublisherProfile = (row) => {
    setAdminSelection({ section: 'admin_users', row });
    setAdminView('admin_user_detail');
  };
  const openAdminOrderById = (orderId) => {
    setSelectedOrderId(orderId);
    setAdminView('admin_order_detail');
  };
  const openPublisherApplication = (applicationId) => {
    setSelectedPublisherApplicationId(applicationId);
    setAdminView('admin_publisher_application_detail');
  };
  const updatePublisherApplication = (applicationId, patch) => backend.perform(async()=>{
    const updated=await api(`/admin/publisher-applications/${applicationId}`,'PATCH',{
      ...('checks' in patch?{checks:patch.checks}:{}),
      ...('status' in patch?{status:patch.status}:{}),
      ...('decisionComment' in patch?{decisionComment:patch.decisionComment}:{}),
    });
    setPublisherApplications(items=>items.map(item=>item.id===applicationId?updated:item));
  });
  const createPublisherApplication = (application) => backend.perform(async()=>{
    const created=await api('/admin/publisher-applications','POST',application);
    setPublisherApplications(items=>[created,...items]);
    setSelectedPublisherApplicationId(created.id);
    setAdminView('admin_publisher_application_detail');
  });
  const invitePublisherApplication = async (applicationId) => {
    let token='';
    const ok=await backend.perform(async()=>{
      const updated=await api(`/admin/publisher-applications/${applicationId}/invite`,'POST',{});
      setPublisherApplications(items=>items.map(item=>item.id===applicationId?updated:item));
      token=updated.token;
    });
    return ok?token:null;
  };
  const deletePublisherApplication = (applicationId) => backend.perform(async()=>{
    await api(`/admin/publisher-applications/${applicationId}`,'DELETE');
    setPublisherApplications(items=>items.filter(item=>item.id!==applicationId));
    setSelectedPublisherApplicationId(null);
  });
  const openProject = (projectId) => {
    setSelectedProjectId(projectId);
    setClientView('project_detail');
  };
  const openMaterial = (materialId) => {
    setSelectedMaterialId(materialId);
    setClientView('material_detail');
  };
  const openOrder = (order) => {
    setSelectedOrderId(order.id);
    setClientView(
      order.status === 'Площадка рассматривает'
        ? 'order_pending_detail'
        : order.status === 'Площадка отказала'
          ? 'order_rejected_detail'
          : order.status === 'Завершено'
            ? 'order_completed_detail'
            : 'order_detail',
    );
  };
  const openPlacementReport = (report) => {
    setSelectedReportOrder(report.id);
    setClientView('report_detail');
  };
  const openProjectReport = (config) => backend.perform(async () => {
    const report=await api('/reports','POST',{projectId:config.projectId,dateFrom:config.from,dateTo:config.to},crypto.randomUUID());
    await backend.refresh();setSelectedReportOrder(report.id);setProjectReportConfig({...config,reportId:report.id});setClientView('project_report');
  });
  const startCreateMaterial = (projectId = null) => {
    setMaterialProjectPreset(projectId);
    setClientView('create_material');
  };
  const createProject = (values) => backend.perform(async () => {
    const project = await api('/projects','POST',values);
    await backend.refresh(); setSelectedProjectId(project.id); setClientView('project_detail');
  });
  const toggleProjectStatus = (id) => backend.perform(async () => {
    await api(`/projects/${id}`,'PATCH',{completed:projects.find(p => p.id === id)?.status === 'Активный'}); await backend.refresh();
  });
  const deleteProject = (id) => backend.perform(async () => { await api(`/projects/${id}`,'DELETE'); await backend.refresh(); setClientView('projects'); });
  const createMaterial = (materials, status, expedited, key) => backend.perform(async () => {
    await api('/materials/save-batch','POST',{items:materials.map(m => ({...materialPayload(m,backend.data.advertisers),clientKey:m.clientKey})),submit:status === 'На модерации',expedited},key);
    await backend.refresh();
  });
  const updateMaterial = (id, patch) => backend.perform(async () => {
    const material = clientMaterials.find(m => m.id === id);
    await api(`/materials/${id}`,'PUT',{...materialPayload({...material,...patch},backend.data.advertisers),version:material.version}); await backend.refresh();
  });
  const changeMaterialProject = (id, projectId) => backend.perform(async () => {
    await api(`/materials/${id}/project`,'POST',{projectId}); await backend.refresh();
  });
  const changeOrderProject = (id, projectId) => backend.perform(async () => { await api(`/orders/${id}/project`,'POST',{projectId}); await backend.refresh(); });
  const moveOrders = (ids, projectId) => backend.perform(async () => { await api('/orders/project','POST',{ids,projectId}); await backend.refresh(); });
  const createOrdersFromMaterial = (material, platforms, key, limitConfirmed = false,autoAccept = false,offer = null) => backend.perform(async () => {
    await api('/orders','POST',{materialId:material.id,placements:platforms.map(p => ({outletId:p.id,format:apiFormatByLabel[p.format]})),expectedAmount:offer?.expectedAmount ?? Math.round(platforms.reduce((sum,p)=>sum+p.price,0)*100),...(offer?.informerId ? {informerId:offer.informerId}:{}),limitConfirmed,autoAccept},key); await backend.refresh(); setClientView('orders');
  });

  const renderContent = () => {
    if (isClient) {
      switch (clientView) {
        case 'dashboard': return <ClientDashboardView navigate={setClientView} onOpenOrder={openOrder} informerItems={informerItems} />;
        case 'reputation': return <ReputationIntelligenceView navigate={setClientView} />;
        case 'projects': return <ClientProjectsView projects={projects} materials={clientMaterials} orders={clientOrders} navigate={setClientView} openProject={openProject} onCreateProject={createProject} />;
        case 'project_detail': return <ClientProjectDetailView project={projects.find((project) => project.id === selectedProjectId)} materials={clientMaterials} orders={clientOrders} navigate={setClientView} openMaterial={openMaterial} openOrder={openOrder} onAddMaterial={startCreateMaterial} onToggleStatus={toggleProjectStatus} onDelete={deleteProject} onCreateProjectReport={openProjectReport} />;
        case 'materials': return <ClientMaterialsView navigate={setClientView} projects={projects} materials={clientMaterials} openProject={openProject} openMaterial={openMaterial} startCreateMaterial={startCreateMaterial} />;
        case 'material_detail': return <ClientMaterialDetailView navigate={setClientView} material={clientMaterials.find((material) => material.id === selectedMaterialId)} projects={projects} openProject={openProject} onChangeProject={changeMaterialProject} />;
        case 'material_edit': return <ClientEditMaterialView navigate={setClientView} material={clientMaterials.find((material) => material.id === selectedMaterialId)} projects={projects} onUpdateMaterial={updateMaterial} />;
        case 'create_material': return <ClientCreateMaterialView navigate={setClientView} projects={projects} defaultProjectId={materialProjectPreset} onCreateMaterial={createMaterial} />;
        case 'advertisers': return <ClientAdvertisersView navigate={setClientView} onOpenAdvertiser={id=>{setSelectedAdvertiserId(id);setClientView('advertiser_detail');}} />;
        case 'advertiser_new': return <ClientAdvertiserNewView navigate={setClientView} />;
        case 'advertiser_detail': return <ClientAdvertiserDetailRoute id={selectedAdvertiserId} navigate={setClientView} orders={clientOrders} onOpenOrder={openOrder} />;
        case 'advertiser_edit': return <ClientAdvertiserEditView id={selectedAdvertiserId} navigate={setClientView} />;
        case 'catalog': return <ClientCatalogView favoritePlatforms={favoritePlatforms} toggleFavoritePlatform={toggleFavoritePlatform} navigate={(view,id)=>{if(id)backend.setOutletId(id);setClientView(view);}} materials={clientMaterials} projects={projects} onCreateOrders={createOrdersFromMaterial} />;
        case 'platform_detail': return <ClientPlatformDetailView favoritePlatforms={favoritePlatforms} toggleFavoritePlatform={toggleFavoritePlatform} navigate={setClientView} materials={clientMaterials} projects={projects} onCreateOrders={createOrdersFromMaterial} />;
        case 'order_detail': return <ClientOrderDetailView navigate={setClientView} sourceOrder={clientOrders.find((order) => order.id === selectedOrderId)} projects={projects} openProject={openProject} onChangeProject={changeOrderProject} onOpenReport={openPlacementReport} />;
        case 'order_pending_detail': return <ClientOrderDetailView navigate={setClientView} sourceOrder={clientOrders.find((order) => order.id === selectedOrderId)} projects={projects} openProject={openProject} onChangeProject={changeOrderProject} onOpenReport={openPlacementReport} />;
        case 'order_rejected_detail': return <ClientOrderDetailView navigate={setClientView} sourceOrder={clientOrders.find((order) => order.id === selectedOrderId)} projects={projects} openProject={openProject} onChangeProject={changeOrderProject} onOpenReport={openPlacementReport} />;
        case 'order_completed_detail': return <ClientOrderDetailView navigate={setClientView} sourceOrder={clientOrders.find((order) => order.id === selectedOrderId)} projects={projects} openProject={openProject} onChangeProject={changeOrderProject} onOpenReport={openPlacementReport} />;
        case 'complaint': return <ClientComplaintView navigate={setClientView} />;
        case 'dispute_detail': return <DisputeDetailView navigate={setClientView} />;
        case 'order_chat': return <OrderConversation orderId={selectedOrderId} onBack={()=>setClientView('order_detail')} />;
        case 'report_detail': return <ClientReportDetailView navigate={setClientView} report={reports.find((report) => report.id === selectedReportOrder)} projects={projects} openProject={openProject} />;
        case 'project_report': return <ClientProjectReportView navigate={setClientView} config={effectiveProjectReportConfig} projects={projects} reports={reports} onOpenPlacementReport={openPlacementReport} onChangePeriod={openProjectReport} />;
        case 'orders': return <ClientOrdersView navigate={setClientView} projects={projects} orders={clientOrders} openProject={openProject} openOrder={openOrder} onMoveOrders={moveOrders} />;
        case 'reports': return <ClientReportsView projects={projects} reports={reports} openProject={openProject} onOpenReport={openPlacementReport} onCreateProjectReport={openProjectReport} />;
        case 'support': return <SupportDesk navigate={setClientView} onOpenDispute={(orderId)=>{setSelectedOrderId(orderId);setClientView('dispute_detail');}} />;
        case 'balance': return <ClientBalanceView navigate={setClientView} />;
        case 'topup': return <ClientTopUpView navigate={setClientView} />;
        case 'operations': return <ClientOperationsView navigate={setClientView} />;
        case 'settings': return <ClientSettingsView />;
        default: return (
           <div className="text-center py-20 px-4">
              <div className="text-[#d4e0ed] mb-4"><Settings className="w-12 h-12 mx-auto" /></div>
              <h2 className="font-display text-xl font-medium text-[#476788]">Раздел недоступен</h2>
           </div>
        );
      }
    } else if (!isAdmin) {
      switch (publisherView) {
        case 'pub_dashboard': return <PublisherDashboardView navigate={setPublisherView} onOpenOrder={order => {
          setSelectedOrderId(order.id);
          setPublisherView(order.apiStatus === 'submitted' ? 'pub_order_acceptance_detail' : order.apiStatus === 'pending' ? 'pub_order_new_detail' : order.apiStatus === 'disputed' ? 'pub_dispute_detail' : 'pub_order_detail');
        }} />;
        case 'pub_orders': return <PublisherOrdersView navigate={setPublisherView} onOpenOrder={order => {setSelectedOrderId(order.id);setPublisherView('pub_order_detail');}} />;
        case 'pub_order_detail':
        case 'pub_order_acceptance_detail':
        case 'pub_order_new_detail': return clientOrders.find(o=>o.id===selectedOrderId) ? <PublisherOrderDetailView navigate={setPublisherView} sourceOrder={clientOrders.find(o=>o.id===selectedOrderId)} /> : <Card className="p-6">Выберите заказ в списке.</Card>;
        case 'pub_order_chat': return <OrderConversation orderId={selectedOrderId} onBack={()=>setPublisherView('pub_order_detail')} />;
        case 'pub_platforms': return <PublisherPlatformsView navigate={setPublisherView} />;
        case 'pub_platform_new': return <PublisherPlatformNewView navigate={setPublisherView} />;
        case 'pub_platform_detail': return <LivePublisherPlatformDetail navigate={setPublisherView} />;
        case 'pub_publication': return <PublisherOrderDetailView navigate={setPublisherView} />;
        case 'pub_finance': return <PublisherFinanceView navigate={setPublisherView} />;
        case 'pub_payout_request': return <PublisherPayoutRequestView navigate={setPublisherView} />;
        case 'pub_complaint': return <PublisherComplaintView navigate={setPublisherView} />;
        case 'pub_dispute_detail': return <DisputeDetailView navigate={setPublisherView} role="publisher" />;
        case 'pub_support': return <SupportDesk navigate={setPublisherView} onOpenDispute={(orderId)=>{setSelectedOrderId(orderId);setPublisherView('pub_dispute_detail');}} />;
        case 'pub_sanctions': return <PublisherSanctionsView navigate={setPublisherView} />;
        case 'pub_settings': return <PublisherSettingsView />;
        default: return (
          <div className="text-center py-20">
              <div className="text-[#d4e0ed] mb-4"><Settings className="w-12 h-12 mx-auto" /></div>
              <h2 className="font-display text-xl font-medium text-[#476788]">Раздел недоступен</h2>
           </div>
        );
      }
    } else {
      switch (isModerator&&!moderatorViews.has(adminView)?'admin_moderation':adminView) {
        case 'admin_dashboard': return <AdminDashboardView navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_moderation': return <AdminWorklistView section="admin_moderation" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_moderation_detail': return <AdminModerationDetailView navigate={setAdminView} selection={adminSelection} materialId={selectedMaterialId} onOpenPublisher={openAdminPublisherProfile} />;
        case 'admin_orders': return <AdminWorklistView section="admin_orders" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_order_detail': return <AdminOrderDetailView navigate={setAdminView} selection={adminSelection} orderId={selectedOrderId} />;
        case 'admin_order_chat': return <OrderConversation orderId={selectedOrderId||adminSelection?.row?.[0]} onBack={()=>{const fromUser=new URLSearchParams(location.search).get('from_user');setAdminView('admin_order_detail',fromUser?{order:selectedOrderId,from_user:fromUser,user_tab:'orders'}:undefined);}} />;
        case 'admin_publisher_applications': return <AdminPublisherApplicationsView applications={publisherApplications} onOpenApplication={openPublisherApplication} onCreateApplication={createPublisherApplication} />;
        case 'admin_publisher_application_detail': return <AdminPublisherApplicationDetailView application={publisherApplications.find((application) => application.id === selectedPublisherApplicationId)} navigate={setAdminView} onUpdateApplication={updatePublisherApplication} onInvite={invitePublisherApplication} onDelete={deletePublisherApplication} />;
        case 'admin_users': return <AdminRecords kind="users" SelectComponent={CustomSelect}
          onOpenOutlet={(id,userId)=>{backend.setOutletId(id);setAdminView('admin_platform_detail',{outlet:id,from_user:userId,user_tab:'assets'});}}
          onOpenOrder={(id,userId)=>{setSelectedOrderId(id);setAdminView('admin_order_detail',{order:id,from_user:userId,user_tab:'orders'});}}
          onOpenAdvertiser={(id,userId)=>setAdminView('admin_advertisers',{admin_advertiser:id,from_user:userId,user_tab:'assets'})}
          onOpenMaterial={(id,userId)=>{setSelectedMaterialId(id);setAdminSelection({section:'admin_moderation',row:[id]});setAdminView('admin_moderation_detail',{material:id,from_user:userId,user_tab:'assets'});}} />;
        case 'admin_user_detail': return <AdminUserDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_advertisers': return <AdminRecords kind="advertisers" SelectComponent={CustomSelect} onReturnToUser={id=>setAdminView('admin_users',{admin_user:id,user_tab:'assets'})} />;
        case 'admin_advertiser_detail': return <AdminRecords kind="advertisers" SelectComponent={CustomSelect} />;
        case 'admin_platforms': return <PublisherPlatformsView navigate={setAdminView} />;
        case 'admin_platform_detail': return <LivePublisherPlatformDetail navigate={view=>{const userId=new URLSearchParams(location.search).get('from_user');if(view==='admin_platforms'&&userId)setAdminView('admin_users',{admin_user:userId,user_tab:'assets'});else setAdminView(view);}} />;
        case 'admin_balances': return <AdminRecords kind="balances" SelectComponent={CustomSelect} />;
        case 'admin_finance_detail': return <AdminFinanceDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_operations': return <AdminRecords kind="ledger" SelectComponent={CustomSelect} />;
        case 'admin_complaints': return <AdminDisputesView onOpen={(orderId)=>{setSelectedOrderId(orderId);setAdminSelection({section:'admin_complaints',row:[orderId]});setAdminView('admin_dispute_detail');}} />;
        case 'admin_dispute_detail': return <AdminDisputeDetailView navigate={setAdminView} selection={adminSelection} orderId={selectedOrderId} />;
        case 'admin_payouts': return <AdminWorklistView section="admin_payouts" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_payout_detail': return <AdminPayoutDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_bank_review': return <AdminBankReview />;
        case 'admin_support': return <SupportDesk navigate={setAdminView} onOpenDispute={(orderId)=>{setSelectedOrderId(orderId);setAdminView('admin_dispute_detail');}} />;
        case 'admin_ticket_detail': return <AdminTicketDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_documents': return <AdminActs />;
        case 'admin_document_detail': return <AdminActs />;
        case 'admin_informer': return <AdminInformerView items={informerItems} onChangeItems={setInformerItems} />;
        case 'admin_audit': return <AdminRecords kind="audit" SelectComponent={CustomSelect} />;
        case 'admin_audit_detail': return <AdminEntityDetailView navigate={setAdminView} type="audit" selection={adminSelection} />;
        case 'admin_integrations': return <AdminReputationIntegrationsView />;
        case 'admin_settings': return <AdminSettingsView />;
        default: return <AdminDashboardView navigate={setAdminView} onSelect={openAdminDetail} />;
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans text-[#0b3558] text-[90%]">
      {/* БОКОВАЯ НАВИГАЦИЯ */}
      <aside className="w-64 flex flex-col hidden md:flex flex-shrink-0 border-r border-[#d4e0ed] bg-white text-[#476788]">
        <button type="button" className="h-16 w-full flex items-center px-6 border-b border-[#d4e0ed] cursor-pointer text-left text-[#0b3558]" onClick={() => setView(isClient ? 'dashboard' : isAdmin ? isModerator?'admin_moderation':'admin_dashboard' : 'pub_dashboard')}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#0b3558]">
                <div className="w-3 h-3 border-2 rounded-sm border-white"></div>
            </div>
            <span className="font-display font-bold tracking-tight">Аксиома</span>
          </div>
          <span className="ml-2 text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-[#f8f9fb] text-[#476788]">{isClient ? 'Заказчик' : isAdmin ? isModerator?'Модератор':'Админ' : 'Паблишер'}</span>
        </button>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {(isAdmin ? visibleAdminPrimaryNav : navItems).map((item) => {
              const Icon = item.icon;
              const isActive = activeNavView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${isActive ? 'bg-[#f0f3f8] text-[#0b3558] font-medium shadow-[inset_0_0_0_1px_rgba(0,107,255,0.18)]' : 'hover:bg-[#f8f9fb] hover:text-[#0b3558]'}`}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-[#006bff]' : 'text-[#476788]'}`} />
                  {item.label}
                </button>
              );
            })}
            {isAdmin && (
              <div className="space-y-1 pt-2">
                {visibleAdminNavGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const hasActiveItem = group.items.some((item) => item.id === activeNavView);
                  const isOpen = adminNavOpenGroup === group.id;
                  return (
                    <div key={group.id}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setAdminNavOpenGroup((current) => current === group.id ? null : group.id)}
                        className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm transition-colors ${hasActiveItem ? 'bg-[#f0f3f8] font-medium text-[#0b3558]' : 'hover:bg-[#f8f9fb] hover:text-[#0b3558]'}`}
                      >
                        <GroupIcon className={`mr-3 h-5 w-5 flex-shrink-0 ${hasActiveItem ? 'text-[#006bff]' : 'text-[#476788]'}`} />
                        <span className="flex-1 text-left">{group.label}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="ml-5 mt-1 space-y-1 border-l border-[#d4e0ed] pl-2">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeNavView === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setAdminNavOpenGroup(group.id);
                                  setView(item.id);
                                }}
                                className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-[#eef5ff] font-medium text-[#0b3558]' : 'hover:bg-[#f8f9fb] hover:text-[#0b3558]'}`}
                              >
                                <Icon className={`mr-2.5 h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#006bff]' : 'text-[#6b86a4]'}`} />
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-[#d4e0ed] bg-white">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0 bg-[#f8f9fb] text-[#476788]">
              {isClient ? 'А' : isAdmin ? 'М' : 'П'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-[#0b3558]">
                {backend.user.email}
              </div>
              <div className="text-xs truncate text-[#476788]">
                {isClient ? 'Заказчик' : isAdmin ? 'Операционный доступ' : 'Паблишер'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ОСНОВНАЯ ОБЛАСТЬ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-[#d4e0ed] flex items-center justify-between px-6 flex-shrink-0 z-10">
           <div className="flex min-w-0 items-center gap-3 text-sm">
            <div className="md:hidden w-[180px] max-w-[52vw]">
              <CustomSelect
                options={navItems.map((item) => item.label)}
                value={navItems.find((item) => item.id === activeNavView)?.label || navItems[0].label}
                onChange={(label) => {
                  const target = navItems.find((item) => item.label === label);
                  if (target) setView(target.id);
                }}
                buttonClassName="min-h-[38px] py-2"
              />
            </div>
            <div className="hidden md:flex items-center">
            {isClient ? (
              <>
                <span className="text-[#476788] mr-2">Баланс:</span>
                <span className="font-semibold text-[#0b3558] tabular-nums">{formatMoney(backend.data.balance.available / 100)}</span>
              </>
            ) : isAdmin ? (
              <>
                <span className="text-[#476788] mr-2">Очередь:</span>
                <span className="font-semibold text-[#006bff] tabular-nums">{operationalQueueCount} {operationalQueueLabel}</span>
              </>
            ) : null}
            </div>
          </div>
	          <div className="flex items-center gap-3">
	             <button className="text-sm text-[#476788] hover:text-[#0b3558]" onClick={backend.logout}>Выйти</button>
	             <div className="relative">
	               <button aria-label={unreadNotifications.length?`Уведомления: ${unreadNotifications.length} новых`:'Уведомления'} aria-expanded={notificationsOpen} className="relative p-2 text-[#476788] hover:text-[#0b3558] transition-colors rounded-full hover:bg-[#f8f9fb]" onClick={() => setNotificationsOpen((value) => !value)}>
	                  <Bell className="w-5 h-5" />
	                  {unreadNotifications.length>0&&<span className="absolute top-2 right-2 w-2 h-2 bg-[#006bff] rounded-full border-2 border-white" />}
	               </button>
	               {notificationsOpen && (
	                 <div className="absolute right-0 top-full mt-3 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-[#d4e0ed] bg-white shadow-[rgba(11,53,88,0.10)_0px_24px_60px] z-50 overflow-hidden">
	                   <div className="px-5 py-4 border-b border-[#d4e0ed] flex items-center justify-between">
	                     <div className="font-semibold text-[#0b3558]">Уведомления</div>
	                     {unreadNotifications.length>0&&<Badge color="blue">{unreadNotifications.length} новых</Badge>}
	                   </div>
	                   <div className="max-h-[min(60vh,480px)] overflow-y-auto">
                   {notifications.length===0&&<div className="px-5 py-5 text-sm text-[#476788]">Уведомлений нет</div>}
                   {(showAllNotifications?notifications:notifications.slice(0,4)).map((notification) => (
                     <button key={notification.key} className="w-full text-left px-5 py-4 border-b border-[#d4e0ed] hover:bg-[#f8f9fb]" onClick={() => openNotificationTarget(notification)}>
	                       <div className="flex items-start justify-between gap-3">
	                         <div>
	                           <div className="text-sm font-semibold text-[#0b3558]">{notification.title}</div>
	                           <div className="text-xs text-[#476788] mt-1">{notification.text}</div>
	                         </div>
	                         {!notificationReads.includes(notification.key)&&<Badge color={notification.color}>новое</Badge>}
	                       </div>
	                     </button>
	                   ))}
	                   </div>
                   {notifications.length>4&&<button className="w-full px-5 py-3 text-sm font-semibold text-[#006bff] hover:bg-[#f8f9fb]" onClick={() => setShowAllNotifications(value=>!value)}>{showAllNotifications?'Свернуть':'Показать все'}</button>}
	                 </div>
	               )}
	             </div>
	          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-[#f8f9fb]">
          <div className="workspace-content w-full min-w-0 pb-10">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
