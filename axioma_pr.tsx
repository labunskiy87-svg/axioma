import React, { useState } from 'react';
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
  Copy
} from 'lucide-react';


// --- ДАННЫЕ ПРОТОТИПА ---
const mockMaterials = [
  { id: 1, name: 'Пресс-релиз: Запуск новой платформы', advertiser: 'ООО "Финтех Решения"', type: 'Статья', status: 'Принят в систему', statusColor: 'green', placements: 3, date: '12.10.2023' },
  { id: 2, name: 'Обзор рынка недвижимости за третий квартал', advertiser: 'Урбан Групп', type: 'Пост в Телеграме', status: 'На модерации', statusColor: 'blue', placements: 0, date: '14.10.2023' },
  { id: 3, name: 'Интервью с генеральным директором', advertiser: 'ООО "Финтех Решения"', type: 'Интервью', status: 'Требуются правки', statusColor: 'amber', placements: 0, date: '15.10.2023' },
  { id: 4, name: 'Кейс внедрения системы управления клиентами', advertiser: 'ТехКорп', type: 'Кейс', status: 'Используется в заказах', statusColor: 'indigo', placements: 5, date: '10.10.2023' },
  { id: 5, name: 'Заметка о новом продукте', advertiser: 'Урбан Групп', type: 'Новость', status: 'Черновик', statusColor: 'gray', placements: 0, date: '17.10.2023' },
  { id: 6, name: 'Материал с запрещенными обещаниями', advertiser: 'ТехКорп', type: 'Статья', status: 'Отклонен', statusColor: 'red', placements: 0, date: '11.10.2023' },
  { id: 7, name: 'Архивная публикация про конференцию', advertiser: 'ООО "Финтех Решения"', type: 'Пресс-релиз', status: 'Архивирован', statusColor: 'gray', placements: 2, date: '01.09.2023' },
];

const mockCatalog = [
  { id: 101, name: 'РБК Инвестиции', type: 'СМИ', theme: 'Финансы', region: 'Федеральные', goal: 'пиар', format: 'Статья', price: 150000, reach: '2,5 млн/мес', mediology: 'A+', aggregators: ['Google News', 'Дзен'], deadline: '2 дня', storage: '2 года', tags: ['Проверено', 'Маркировка'], logo: 'bg-[#0b3558]' },
  { id: 102, name: 'Технологии сегодня', type: 'ТГ-канал', theme: 'ИТ', region: 'Москва', goal: 'SEO', format: 'Пост', price: 45000, reach: '125 тыс. подписчиков', mediology: 'B+', aggregators: ['Дзен'], deadline: '1 день', storage: '2 года', tags: ['Проверено', 'Маркировка'], logo: 'bg-[#006bff]' },
  { id: 103, name: 'VC.ru', type: 'СМИ', theme: 'Бизнес', region: 'Федеральные', goal: 'SEO', format: 'Лонгрид', price: 80000, reach: '1,2 млн/мес', mediology: 'A', aggregators: ['Google News', 'Дзен'], deadline: '4 дня', storage: '2 года', tags: ['SEO', 'Маркировка'], logo: 'bg-pink-600' },
  { id: 104, name: 'Код Дурова', type: 'ТГ-канал', theme: 'ИТ', region: 'Федеральные', goal: 'пиар', format: 'Нативный пост', price: 60000, reach: '200 тыс. подписчиков', mediology: 'B', aggregators: ['нет'], deadline: '1 день', storage: '2 года', tags: ['Проверено', 'Маркировка'], logo: 'bg-[#0b3558]' },
  { id: 105, name: 'Бизнес Среда', type: 'Паблик ВК', theme: 'Бизнес', region: 'Регионы', goal: 'SERM', format: 'Новость', price: 146000, reach: '2,4 млн/мес', mediology: 'A-', aggregators: ['Дзен'], deadline: '3 дня', storage: '2 года', tags: ['Без удаления', 'пиар'], logo: 'bg-emerald-700' },
];

const mockOrdersClient = [
  { id: 1045, material: 'Пресс-релиз: Запуск новой платформы', platform: 'РБК Инвестиции', price: 150000, frozen: 150000, status: 'Ожидает приемки', statusColor: 'indigo', date: '15.10.2023', action: 'Проверить публикацию' },
  { id: 1048, material: 'Пресс-релиз: Запуск новой платформы', platform: 'Технологии сегодня', price: 45000, frozen: 45000, status: 'Площадка рассматривает', statusColor: 'blue', date: '16.10.2023', action: 'Дождаться площадки' },
  { id: 1052, material: 'Кейс внедрения системы управления клиентами', platform: 'VC.ru', price: 80000, frozen: 0, status: 'Завершено', statusColor: 'gray', date: '10.10.2023', action: 'Открыть отчет' },
  { id: 1054, material: 'Интервью с генеральным директором', platform: 'Код Дурова', price: 60000, frozen: 60000, status: 'Площадка запросила правки', statusColor: 'amber', date: '18.10.2023', action: 'Внести правки' },
  { id: 1055, material: 'Обзор рынка недвижимости за третий квартал', platform: 'Бизнес Среда', price: 146000, frozen: 0, status: 'Автоматически отозвано', statusColor: 'red', date: '19.10.2023', action: 'Повторить заявку' },
];

const mockOrdersPublisher = [
  { id: 1045, material: 'Пресс-релиз: Запуск новой платформы', advertiser: 'Заказчик #842', price: 127500, status: 'Ожидает публикации', statusColor: 'amber', date: '16.10.2023', format: 'СМИ (Статья)' },
  { id: 1048, material: 'Анонс вебинара по инвестициям', advertiser: 'Заказчик #112', price: 85000, status: 'Новая заявка', statusColor: 'blue', date: '18.10.2023', format: 'СМИ (Новость)' },
  { id: 1052, material: 'Обзор ИТ рынка', advertiser: 'Заказчик #55', price: 150000, status: 'Завершено', statusColor: 'gray', date: '05.10.2023', format: 'СМИ (Лонгрид)' },
  { id: 1054, material: 'Интервью с генеральным директором', advertiser: 'Заказчик #901', price: 60000, status: 'Ожидает подтверждения маркировки', statusColor: 'amber', date: '18.10.2023', format: 'ТГ-канал (Нативный пост)' },
  { id: 1055, material: 'Кейс внедрения системы управления клиентами', advertiser: 'Заказчик #842', price: 146000, status: 'Жалоба открыта', statusColor: 'red', date: '19.10.2023', format: 'Паблик ВК (Новость)' },
];

const mockTransactions = [
  { id: 'TR-986', type: 'Возврат', desc: 'Автоматически отозванный заказ #1055', amount: 146000, date: '19.10.2023 18:10', status: 'Возврат' },
  { id: 'TR-985', type: 'Списание', desc: 'Оплата размещения #1052', amount: -80000, date: '18.10.2023 15:40', status: 'Списано' },
  { id: 'TR-984', type: 'Удержание', desc: 'Жалоба по заказу #1055', amount: -52000, date: '18.10.2023 12:00', status: 'Удержание' },
  { id: 'TR-983', type: 'Комиссия', desc: 'Комиссия платформы 15% с пополнения', amount: -75000, date: '17.10.2023 10:02', status: 'Комиссия' },
  { id: 'TR-982', type: 'Заморозка', desc: 'Заказ #1048 (Технологии сегодня)', amount: -45000, date: '16.10.2023 14:30', status: 'Заморожено' },
  { id: 'TR-981', type: 'Заморозка', desc: 'Заказ #1045 (РБК Инвестиции)', amount: -150000, date: '15.10.2023 10:15', status: 'Заморожено' },
  { id: 'TR-980', type: 'Вывод', desc: 'Выплата площадке РБК Инвестиции', amount: -430000, date: '01.10.2023 12:00', status: 'Выплачено' },
  { id: 'TR-979', type: 'Пополнение', desc: 'Входящий банковский перевод', amount: 500000, date: '01.10.2023 11:20', status: 'Доступно' },
];

const mockAdvertisers = [
  { id: 1, name: 'ООО "Финтех Решения"', type: 'Юрлицо', inn: '7700000000', object: 'облачная платформа аналитики', status: 'Проверен', color: 'green' },
  { id: 2, name: 'Урбан Групп', type: 'Юрлицо', inn: '7811000000', object: 'Девелоперские проекты', status: 'Черновик', color: 'blue' },
  { id: 3, name: 'Александр Сергеев', type: 'Персона', inn: 'не применимо', object: 'Личный бренд', status: 'Требуются данные', color: 'amber' },
];

const mockReports = [
  { order: '#1045', material: 'Пресс-релиз: Запуск новой платформы', platform: 'РБК Инвестиции', link: 'invest.rbc.ru/news/652a9f', status: 'Ожидает приемки', color: 'indigo' },
  { order: '#1048', material: 'Пресс-релиз: Запуск новой платформы', platform: 'Технологии сегодня', link: 'будет после публикации', status: 'В работе', color: 'blue' },
  { order: '#1052', material: 'Кейс внедрения системы управления клиентами', platform: 'VC.ru', link: 'vc.ru/services/1052', status: 'Завершено', color: 'gray' },
];

const mockAdminQueue = [
  { id: '#M-1052', object: 'Новость компании', type: 'Материал', risk: 'Ссылки', status: 'На модерации', color: 'amber' },
  { id: '#P-044', object: 'Новая площадка', type: 'Площадка', risk: 'Метрики', status: 'Проверить', color: 'blue' },
  { id: '#C-019', object: 'Жалоба по заказу #1045', type: 'Спор', risk: 'Маркировка', status: 'Решить', color: 'red' },
];

const materialStates = ['Черновик', 'На модерации', 'Требуются правки', 'Отклонен', 'Принят в систему', 'Используется в заказах', 'Архивирован'];
const orderStates = ['Заявка создана', 'Средства заморожены', 'Площадка рассматривает', 'Площадка приняла', 'Площадка запросила правки', 'Маркировка подтверждена', 'Публикация загружена', 'Ожидает приемки', 'Оплачено', 'Завершено', 'Отклонено', 'Автоматически отозвано'];
const complaintStates = ['Черновик', 'Открыта', 'На рассмотрении', 'Нужны доказательства', 'Решена в пользу заказчика', 'Решена в пользу площадки', 'Удержание применено'];

const publisherPlatforms = [
  { id: 'PUB-01', name: 'РБК Инвестиции', type: 'СМИ', theme: 'Финансы', region: 'Федеральная', formats: 'Статья, новость, интервью', price: '150 000 ₽ / статья', answer: '8 часов', publication: '2 дня', storage: '2 года', metrics: '2,5 млн визитов/мес, Google News, Дзен', status: 'Активна', color: 'green' },
  { id: 'PUB-02', name: 'РБК Телеграм', type: 'ТГ-канал', theme: 'Финансы', region: 'Федеральная', formats: 'Нативный пост, репост', price: '60 000 ₽ / пост', answer: '4 часа', publication: '1 день', storage: '2 года', metrics: '210 тыс. подписчиков, вовлеченность 12%', status: 'На проверке', color: 'blue' },
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
  'Площадка подтвердила маркировку',
  'Площадка загрузила ссылку',
  'Заказ перешел на приемку',
];

const mockAdminSections = {
  admin_moderation: {
    title: 'Материалы на модерации',
    rows: [
      ['#M-1052', 'Новость компании', 'Материал', 'Ожидает проверки', 'Принять / правки / отклонить'],
      ['#M-1054', 'Интервью с генеральным директором', 'Материал', 'Риск/нарушение', 'Запросить правки'],
      ['#P-044', 'Новая площадка', 'Площадка', 'Ожидает проверки', 'Проверить метрики'],
    ],
  },
  admin_orders: {
    title: 'Заказы',
    rows: [
      ['#1045', 'Ожидает приемки', '150 000 ₽', 'РБК Инвестиции', 'Открыть заказ'],
      ['#1048', 'Площадка рассматривает', '45 000 ₽', 'Технологии сегодня', 'Открыть заказ'],
      ['#1054', 'Площадка запросила правки', '60 000 ₽', 'Код Дурова', 'Открыть заказ'],
    ],
  },
  admin_users: {
    title: 'Пользователи',
    rows: [
      ['U-842', 'Заказчик #842', 'Заказчик', 'Активен', 'Скрыть юрданные от площадок'],
      ['P-017', 'Редакция РБК Инвестиции', 'Площадка', 'Активна', 'Открыть профиль'],
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
      ['C-019', 'Заказ #1045', 'Нужны доказательства', 'Скриншот и ссылка', 'Применить удержание'],
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
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
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

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006bff] disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#006bff] text-white hover:bg-[#0057d6] border border-[#006bff] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.06)_0px_15px_30px_0px]",
    secondary: "bg-white border border-[#d4e0ed] text-[#0b3558] hover:bg-[#f0f3f8]",
    ghost: "text-[#0b3558] hover:bg-[#f0f3f8]",
    dark: "bg-[#0b3558] text-white hover:bg-[#092c49] border border-[#0b3558] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.06)_0px_15px_30px_0px]",
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const CustomSelect = ({ options, defaultValue = undefined, value: controlledValue = undefined, onChange = undefined, className = '', buttonClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue || options[0]);
  const selectedValue = controlledValue || value;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        className={`w-full min-h-[42px] rounded-lg border border-[#476788] bg-white px-4 py-2.5 text-left text-sm text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff] flex items-center justify-between gap-3 ${buttonClassName}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="truncate">{selectedValue}</span>
        <ChevronRight className={`w-4 h-4 text-[#476788] transition-transform ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl border border-[#d4e0ed] bg-white p-1.5 shadow-[rgba(11,53,88,0.08)_0px_10px_24px,rgba(11,53,88,0.10)_0px_24px_60px]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-3 ${selectedValue === option ? 'bg-[#e6f0ff] text-[#004eba] font-semibold' : 'text-[#0b3558] hover:bg-[#f8f9fb]'}`}
              onClick={() => {
                setValue(option);
                onChange?.(option);
                setIsOpen(false);
              }}
            >
              <span className="truncate">{option}</span>
              {selectedValue === option && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border border-[#d4e0ed] rounded-[24px] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.08)_0px_30px_50px_0px] ${className}`} {...props}>
    {children}
  </div>
);

const FullMaterialPreview = ({ context = 'client' }) => (
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {['превью интерфейса', 'экран аналитики', 'обложка бренда'].map((image, index) => (
        <div key={image} className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] overflow-hidden">
          <div className="aspect-[4/3] bg-white flex items-center justify-center border-b border-[#d4e0ed]">
            <ImageIcon className="w-8 h-8 text-[#a6bbd1]" />
          </div>
          <div className="px-3 py-2 text-xs text-[#476788]">{image}</div>
        </div>
      ))}
    </div>
    <div className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
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
    </div>
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
      <Copy className="h-4 w-4" />
    </button>
  );
};

const MaterialRightsDisclaimer = () => (
  <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
    Размещая материал, вы подтверждаете, что у вас есть все необходимые авторские права на текст, изображения и другие элементы контента.
  </div>
);

const AiAssistModal = ({ isOpen, onClose, type = 'rewrite' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={type === 'image' ? 'Генерация изображения с помощью ИИ' : 'Рерайт с помощью ИИ'} className="max-w-2xl">
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
        <div className="text-sm font-semibold text-[#0b3558]">{type === 'image' ? 'Стоимость генерации: 50 ₽' : 'Стоимость рерайта: 30 ₽'}</div>
        <p className="text-sm text-[#476788] mt-1">Сумма будет списана с баланса после запуска операции.</p>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-[#476788]">Промт / ТЗ</span>
        <textarea
          className="mt-2 w-full min-h-[180px] border border-[#476788] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]"
          defaultValue={type === 'image' ? 'Сгенерировать деловую иллюстрацию для материала о платформе аналитики.' : 'Переписать материал в деловом стиле, сохранить факты, сделать текст короче и яснее.'}
        />
      </label>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Отмена</Button>
        <Button variant="primary" onClick={onClose}>{type === 'image' ? 'Сгенерировать за 50 ₽' : 'Запустить рерайт за 30 ₽'}</Button>
      </div>
    </div>
  </Modal>
);

const MaterialSelectionModal = ({ isOpen, onClose, platform = null, platforms = [] }) => {
  const initialPlatforms = platforms.length ? platforms : platform ? [platform] : [];
  const [removedPlatformIds, setRemovedPlatformIds] = useState([]);
  const selectedPlatforms = initialPlatforms.filter((item) => !removedPlatformIds.includes(item.id));
  const totalPrice = selectedPlatforms.reduce((sum, item) => sum + item.price, 0);
  const isBulk = selectedPlatforms.length > 1;
  return (
  <Modal isOpen={isOpen} onClose={onClose} title={isBulk ? 'Массовое размещение материала' : 'Выбор материала для размещения'} className="max-w-5xl">
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
      <div className="rounded-2xl bg-[#f8f9fb] border border-[#d4e0ed] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[#476788] uppercase">{isBulk ? 'Выбрано площадок' : 'Площадка'}</div>
            <div className="mt-1 text-sm font-semibold text-[#0b3558]">{selectedPlatforms.length ? `${selectedPlatforms.length} площадки` : 'Нет выбранных площадок'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#476788] uppercase">Бюджет</div>
            <div className="mt-1 text-sm font-semibold text-[#0b3558] tabular-nums">{formatMoney(totalPrice)}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2 max-h-[360px] overflow-y-auto">
          {selectedPlatforms.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#d4e0ed] bg-white px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#0b3558] truncate">{item.name}</div>
                <div className="text-xs text-[#476788]">{item.type} · {item.format}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-[#0b3558] tabular-nums whitespace-nowrap">{formatMoney(item.price)}</div>
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
          <CustomSelect className="mt-2" options={mockMaterials.filter((material) => ['Принят в систему', 'Используется в заказах'].includes(material.status)).map((material) => `${material.name} · ${material.advertiser}`)} />
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4 cursor-pointer">
          <input type="checkbox" className="mt-1" />
          <span className="text-sm text-[#476788]"><span className="font-semibold text-[#0b3558]">Автоприемка</span><br />Автоматически принять размещение, если жалоба не открыта в течение 72 часов после загрузки ссылки.</span>
        </label>
        <MaterialRightsDisclaimer />
        <div className="rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
          После подтверждения система создаст отдельный заказ на каждую выбранную площадку. Общая сумма размещений заморозится на балансе рекламодателя.
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button variant="primary" onClick={onClose}>Создать заказ</Button>
        </div>
      </div>
    </div>
  </Modal>
  );
};

const Modal = ({ isOpen, onClose, title, children, className = 'max-w-md' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0b3558]/10 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl border border-[#d4e0ed] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.08)_0px_30px_50px_0px] w-full ${className} overflow-hidden flex flex-col max-h-[90vh]`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-[#d4e0ed] flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#0b3558]">{title}</h3>
          <button onClick={onClose} className="text-[#476788] hover:text-[#0b3558] transition-colors p-1.5 rounded-lg hover:bg-[#f0f3f8]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [registrationRole, setRegistrationRole] = useState('client');

  const handleLogin = (role) => {
    setLoginModalOpen(false);
    setGlobalMode(role);
  };
  const openLoginModal = () => {
    setAuthMode('login');
    setLoginModalOpen(true);
  };
  const openRegistrationModal = (role = 'client') => {
    setAuthMode('registration');
    setRegistrationRole(role);
    setLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] font-sans text-[#0b3558] selection:bg-[#e6f0ff] selection:text-[#0b3558] text-[90%]">
      <header className="bg-white border-b border-[#d4e0ed] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0b3558] rounded-lg flex items-center justify-center">
                 <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-[#0b3558]">Аксиома</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-[#476788]">
              <a href="#product" className="px-4 py-2 rounded-full hover:bg-[#f8f9fb] hover:text-[#0b3558] transition-colors">Продукт</a>
              <a href="#catalog" className="px-4 py-2 rounded-full hover:bg-[#f8f9fb] hover:text-[#0b3558] transition-colors">Каталог</a>
              <a href="#publishers" className="px-4 py-2 rounded-full hover:bg-[#f8f9fb] hover:text-[#0b3558] transition-colors">Площадкам</a>
              <a href="#faq" className="px-4 py-2 rounded-full hover:bg-[#f8f9fb] hover:text-[#0b3558] transition-colors">Вопросы</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={openLoginModal}>Вход</Button>
              <Button variant="dark" onClick={() => openRegistrationModal('client')}>Зарегистрироваться</Button>
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
            ['Площадкам', '#publishers'],
            ['Вопросы', '#faq'],
          ].map(([label, href]) => (
            <a key={label} href={href} className="block rounded-lg px-3 py-2 text-sm text-[#476788] hover:bg-[#f8f9fb]" onClick={() => setMobileMenuOpen(false)}>{label}</a>
          ))}
        </div>
      )}

      <section className="px-4 sm:px-6 lg:px-8 bg-[#f8f9fb] overflow-hidden">
        <div className="max-w-[1200px] mx-auto py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-[500px_minmax(0,1fr)] gap-10 xl:gap-14 items-center relative">
          <div className="space-y-7 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e6f0ff] text-[#004eba] text-xs font-medium">
              <Globe className="w-4 h-4" /> Закрытый каталог площадок
            </div>
            <div className="space-y-5">
              <h1 className="font-display text-5xl sm:text-6xl lg:text-[58px] xl:text-[64px] font-bold text-[#0b3558] leading-[1.12] max-w-[540px]">
                Размещайте пиар-материалы в медиа без ручного хаоса
              </h1>
              <p className="text-xl text-[#476788] max-w-2xl leading-relaxed">
                Закрытый каталог площадок, выбор нескольких медиа для одного текста, безопасная оплата через баланс и контроль публикаций в одном кабинете.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="primary" className="text-base px-6 py-3" onClick={() => openRegistrationModal('client')}>Зарегистрироваться</Button>
              <Button variant="dark" className="text-base px-6 py-3" onClick={openLoginModal}>Открыть каталог</Button>
            </div>
            <p className="text-sm text-[#476788]">Цены и условия доступны после регистрации.</p>
          </div>
          <div className="relative">
            <div className="absolute -right-12 top-4 w-72 h-72 rounded-full bg-[#0099ff] opacity-18 blur-3xl"></div>
            <div className="absolute -left-10 bottom-12 w-72 h-72 rounded-full bg-[#e55cff] opacity-16 blur-3xl"></div>
            <div className="relative mx-auto w-full max-w-[620px] rounded-2xl bg-white border border-[#d4e0ed] overflow-hidden shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_8px_15px_0px,rgba(71,103,136,0.08)_0px_30px_50px_0px]">
              <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-[#d4e0ed]">
                <div>
                  <div className="text-sm font-semibold text-[#0b3558]">Размещение материала</div>
                  <div className="text-xs text-[#476788] mt-1">Пресс-релиз: запуск новой платформы</div>
                </div>
                <Badge color="blue">3 площадки выбрано</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_210px]">
                <div className="p-5 border-b md:border-b-0 md:border-r border-[#d4e0ed]">
                  <div className="text-xs font-medium text-[#476788] mb-4">Каталог площадок</div>
                  <div className="space-y-3">
                    {[
                      ['РБК Инвестиции', 'СМИ', '2,5 млн/мес', '150 000 ₽'],
                      ['Технологии сегодня', 'ТГ', '125 тыс. подписчиков', '45 000 ₽'],
                      ['VC.ru', 'СМИ', '1,2 млн/мес', '80 000 ₽'],
                      ['Бизнес Среда', 'ВК', '2,4 млн/мес', '146 000 ₽'],
                    ].map(([name, type, reach, price], index) => (
                      <div key={name} className={`rounded-2xl border p-3.5 ${index < 3 ? 'border-[#006bff] bg-[#e6f0ff]' : 'border-[#d4e0ed] bg-white'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#0b3558] truncate">{name}</div>
                            <div className="text-xs text-[#476788] mt-1">{type} · {reach}</div>
                          </div>
                          <div className="text-sm font-semibold text-[#0b3558] whitespace-nowrap">{price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 bg-[#f8f9fb] flex flex-col">
                  <div className="text-xs font-medium text-[#476788] mb-4">Сводка запуска</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-[#476788]">Материал</div>
                      <div className="mt-1 text-sm font-semibold text-[#0b3558]">Принят в систему</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#476788]">Выбрано</div>
                      <div className="mt-1 text-3xl font-bold text-[#0b3558]">3</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#476788]">Бюджет</div>
                      <div className="mt-1 text-2xl font-bold text-[#0b3558]">275 000 ₽</div>
                    </div>
                    <div className="rounded-2xl bg-white border border-[#d4e0ed] p-4">
                      <div className="text-xs text-[#476788]">Средства</div>
                      <div className="mt-1 text-sm font-semibold text-[#0b3558]">Будут заморожены до приемки</div>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <Button variant="primary" className="w-full">Создать заказы</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.10em] text-[#0b3558] mb-4">единый рабочий контур</div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#0b3558] leading-tight">Один кабинет для медийных размещений</h2>
              <p className="text-[#476788] mt-4 leading-relaxed">
                «Аксиома» объединяет заказчиков, СМИ, сайты, Телеграм-каналы, паблики ВК и Дзен в одном рабочем пространстве. Вы загружаете готовый материал, проходите модерацию, выбираете подходящие площадки, контролируете размещение и получаете отчет после публикации.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Закрытый каталог площадок',
                'Размещения в СМИ, на сайтах, в Телеграм-каналах, ВК и Дзене',
                'Модерация материалов перед отправкой',
                'Оплата только после приемки публикации',
                'Чат с площадкой внутри заказа',
                'Единый баланс для всех размещений',
                'Отчетность по каждому заказу',
              ].map((item) => (
                <div key={item} className="rounded-[20px] bg-white border border-[#d4e0ed] p-4 flex items-start gap-3 shadow-[rgba(11,53,88,0.04)_0px_6px_16px]">
                  <CheckCircle2 className="w-5 h-5 text-[#16a34a] mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-medium leading-6 text-[#0b3558]">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-bold text-[#0b3558]">Публикуйте материалы там, где их увидит нужная аудитория</h2>
            <p className="text-[#476788] mt-4 leading-relaxed">
              Используйте «Аксиому» для пиара, SEO, SERM, продвижения личного бренда, запуска продуктов и формирования экспертности. Выбирайте площадки по тематике, региону, формату, цене и срокам. Один материал можно отправить сразу на несколько площадок без повторной загрузки и разрозненной переписки.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Пресс-релизы', 'Новости компании', 'Экспертные статьи', 'Интервью', 'SERM-материалы', 'Брендированные публикации', 'Посты в Телеграме', 'Публикации в ВК'].map((item) => (
              <div key={item} className="rounded-[20px] border border-[#d4e0ed] bg-white p-4 text-sm font-semibold text-[#0b3558] shadow-[rgba(11,53,88,0.04)_0px_6px_16px]">{item}</div>
            ))}
          </div>
          <Button variant="primary" onClick={() => openRegistrationModal('client')}>Открыть каталог</Button>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="font-mono text-xs uppercase tracking-[0.10em] text-[#0b3558] mb-4">как это работает</div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#0b3558] leading-tight">От материала до публикации — в несколько шагов</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              ['1', 'Загрузите материал', 'Добавьте готовый текст, файл или ссылку на документ. Укажите рекламодателя.'],
              ['2', 'Пройдите модерацию', 'Материал проверяется перед отправкой площадкам. Если нужны правки, вы получите комментарии в кабинете.'],
              ['3', 'Выберите площадки', 'Соберите медиаплан из СМИ, сайтов, Телеграм-каналов, ВК и Дзена.'],
              ['4', 'Зарезервируйте средства', 'Стоимость размещения замораживается на балансе до приемки публикации.'],
              ['5', 'Получите публикацию и отчет', 'Площадка публикует материал, вы принимаете результат, после чего размещение оплачивается.'],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-[24px] bg-white border border-[#d4e0ed] p-6 shadow-[rgba(11,53,88,0.04)_0px_4px_12px,rgba(11,53,88,0.05)_0px_18px_44px]">
                <div className="text-xs font-semibold text-[#006bff] tracking-[0.08em] mb-5">ШАГ {step}</div>
                <h3 className="font-display text-lg font-bold tracking-tight text-[#0b3558] leading-snug">{title}</h3>
                <p className="text-sm text-[#476788] mt-3 leading-6">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#0b3558]">Площадки, цены и условия — в закрытом каталоге</h2>
            <p className="text-[#476788] mt-4 leading-relaxed">
              После регистрации вы получаете доступ к каталогу площадок с понятными параметрами: формат размещения, цена, срок публикации, тематика, регион, требования к материалу и срок хранения.
            </p>
            <Button variant="primary" className="mt-8" onClick={() => openRegistrationModal('client')}>Зарегистрироваться и посмотреть каталог</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Онлайн-СМИ', 'Деловые и отраслевые сайты', 'Региональные медиа', 'Телеграм-каналы', 'Паблики ВК', 'Дзен'].map((item) => (
              <div key={item} className="rounded-[20px] border border-[#d4e0ed] bg-white p-4 text-sm font-semibold text-[#0b3558] shadow-[rgba(11,53,88,0.04)_0px_6px_16px]">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="payments" className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.10em] text-[#0b3558] mb-4">безопасная оплата</div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#0b3558] leading-tight">Деньги списываются только после принятой публикации</h2>
            <p className="text-[#476788] mt-4 leading-relaxed">
              Вы пополняете баланс и создаете заказ. Сумма размещения замораживается, но не списывается сразу. Площадка получает оплату только после того, как материал опубликован, а вы приняли результат.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Пополнение', 'Карта, СБП или счет для юридического лица.'],
              ['Комиссия', 'Комиссия сервиса — 15% при пополнении.'],
              ['Холд', 'Средства замораживаются на время размещения.'],
              ['Возврат', 'Если площадка отказалась, деньги возвращаются на баланс.'],
              ['Жалоба', 'Если публикация не соответствует условиям, можно открыть жалобу.'],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-[24px] border border-[#d4e0ed] bg-white p-6 shadow-[rgba(11,53,88,0.04)_0px_4px_12px,rgba(11,53,88,0.05)_0px_18px_44px]"
              >
                <h3 className="font-display text-xl font-bold tracking-tight text-[#0b3558] leading-snug">{title}</h3>
                <p className="mt-4 text-base leading-7 text-[#476788]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#0b3558]">Все согласования — внутри заказа</h2>
            <p className="text-[#476788] mt-4 leading-relaxed">
              Больше не нужно вести публикации в почте, мессенджерах и таблицах. Каждый заказ имеет свой статус, чат, историю правок, ссылку на публикацию и отчет.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Статус материала', 'Выбранные площадки', 'Замороженные средства', 'Правки и комментарии', 'Публикация', 'Приемка результата', 'Отчет'].map((item) => (
              <div key={item} className="rounded-2xl border border-[#d4e0ed] p-4 text-sm text-[#476788] flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="publishers" className="py-20 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] gap-12 items-start">
            <div className="lg:sticky lg:top-28">
              <div className="font-mono text-xs uppercase tracking-[0.10em] text-[#0b3558] mb-4">для площадок</div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#0b3558] leading-tight">Получайте заявки на публикации без прямых продаж</h2>
              <p className="text-[#476788] mt-4 leading-relaxed">
                Подключите СМИ, сайт, Телеграм-канал, паблик ВК или площадку в Дзене к закрытому каталогу «Аксиомы». Заказчики выбирают размещение на вашем ресурсе, а вы работаете с заявкой внутри кабинета: принимаете материал, запрашиваете правки, загружаете ссылку и получаете выплату после приемки.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="primary" onClick={() => openRegistrationModal('publisher')}>Подключить площадку</Button>
                <Button variant="secondary" onClick={openLoginModal}>Войти как площадка</Button>
              </div>
            </div>
            <div className="rounded-[28px] border border-[#d4e0ed] bg-white shadow-[rgba(11,53,88,0.04)_0px_4px_12px,rgba(11,53,88,0.05)_0px_18px_44px] overflow-hidden">
              <div className="px-7 py-6 border-b border-[#d4e0ed] bg-[#f8f9fb]">
                <div className="text-sm font-semibold text-[#476788]">Что получает владелец площадки</div>
              </div>
              <div className="divide-y divide-[#d4e0ed]">
                {[
                  ['Заявки с готовыми материалами', 'Материал проходит базовую модерацию до передачи площадке.'],
                  ['Оплату, зарезервированную заранее', 'Сумма размещения замораживается на балансе заказчика до публикации.'],
                  ['Собственные правила размещения', 'Вы задаете форматы, цены, сроки, ограничения и требования к материалам.'],
                  ['Работу без внешней переписки', 'Правки, файлы, ссылка на публикацию и комментарии хранятся в карточке заказа.'],
                  ['Контроль прямого обхода', 'Контактные данные заказчика скрыты, коммуникация идет внутри платформы.'],
                  ['Прозрачные выплаты', 'Начисление становится доступно после публикации и приемки результата заказчиком.'],
                ].map(([title, text]) => (
                  <div key={title} className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] gap-4 px-7 py-5">
                    <h3 className="font-display text-base font-bold tracking-tight text-[#0b3558] leading-snug">{title}</h3>
                    <p className="text-sm text-[#476788] leading-6">{text}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#d4e0ed] bg-[#f8f9fb]">
                {[
                  ['15%', 'Комиссия на вывод'],
                  ['2 года', 'Минимальный срок хранения размещенных материалов'],
                  ['1 кабинет', 'Заявки, чат и выплаты'],
                ].map(([value, label]) => (
                  <div key={label} className="px-7 py-5 border-b sm:border-b-0 sm:border-r last:border-r-0 border-[#d4e0ed]">
                    <div className="font-display text-2xl font-bold text-[#0b3558]">{value}</div>
                    <div className="mt-1 text-xs text-[#476788]">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="font-mono text-xs uppercase tracking-[0.10em] text-[#0b3558] mb-4 text-center">Вопросы</div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#0b3558] mb-10 text-center">Вопросы перед стартом</h2>
          <div className="space-y-3">
            {[
              ['Можно ли посмотреть цены без регистрации?', 'Нет. Каталог, цены и условия площадок доступны только после регистрации.'],
              ['Вы пишете тексты?', 'Нет. «Аксиома» размещает готовые материалы.'],
              ['Можно ли разместить один материал на нескольких площадках?', 'Да. После модерации материал можно отправить сразу на несколько площадок.'],
              ['Когда списываются деньги?', 'После публикации и вашей приемки результата.'],
              ['Как можно пополнить баланс?', 'Баланс можно пополнить банковской картой, через СБП или по счету для юридического лица.'],
              ['Что если площадка отказалась?', 'Замороженные средства возвращаются на баланс.'],
              ['Кто отвечает за рекламную маркировку?', 'Площадка самостоятельно выполняет маркировку и подтверждает ответственность перед публикацией.'],
              ['Можно ли подключить Телеграм-канал или паблик ВК?', 'Да. «Аксиома» поддерживает СМИ, сайты, Телеграм-каналы, паблики ВК и Дзен.'],
            ].map(([question, answer]) => (
              <div key={question} className="rounded-[22px] border border-[#d4e0ed] bg-white p-6 shadow-[rgba(11,53,88,0.03)_0px_4px_12px]">
                <h3 className="font-display text-lg font-bold tracking-tight text-[#0b3558] leading-snug">{question}</h3>
                <p className="text-sm text-[#476788] mt-3 leading-6">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f8f9fb]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-[#d4e0ed] bg-white overflow-hidden shadow-[rgba(11,53,88,0.04)_0px_4px_12px,rgba(11,53,88,0.06)_0px_24px_60px]">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-8 lg:p-10">
                <div className="font-mono text-xs uppercase tracking-[0.10em] text-[#006bff] mb-4">Начать работу</div>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-[#0b3558] leading-tight max-w-2xl">
                  Разместите первый материал через управляемый процесс
                </h2>
                <p className="text-[#476788] mt-4 leading-relaxed max-w-2xl">
                  Загрузите текст, выберите одну или несколько площадок и контролируйте публикации, оплату и отчетность в одном кабинете.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Button variant="primary" onClick={() => openRegistrationModal('client')}>Зарегистрироваться</Button>
                  <Button variant="secondary" onClick={() => openRegistrationModal('client')}>Перейти в каталог</Button>
                </div>
              </div>
              <div className="bg-[#0b3558] p-8 lg:p-10 text-white">
                <div className="text-sm font-semibold text-[#d4e0ed] mb-5">Что будет доступно в кабинете</div>
                <div className="space-y-4">
                  {[
                    'Закрытый каталог площадок с ценами и сроками',
                    'Размещение одного текста на нескольких площадках',
                    'Холд средств до приемки публикации',
                    'Отчеты, ссылки и документы по каждому заказу',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#8fc5ff] mt-1 flex-shrink-0" />
                      <div className="text-sm leading-6 text-white/90">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#f8f9fb] border-t border-[#d4e0ed] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#0b3558] rounded flex items-center justify-center">
                 <div className="w-3 h-3 border-2 border-white rounded-sm"></div>
              </div>
              <span className="font-display font-bold tracking-tight text-[#0b3558]">Аксиома</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0b3558] mb-3">Продукт</div>
              <div className="space-y-2 text-sm text-[#476788]"><div>Как это работает</div><div>Каталог</div><div>Для площадок</div></div>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0b3558] mb-3">Документы</div>
              <div className="space-y-2 text-sm text-[#476788]"><div>Пользовательское соглашение</div><div>Политика конфиденциальности</div><div>Оферта</div><div>Правила размещения</div></div>
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0b3558] mb-3">Контакты</div>
              <div className="space-y-2 text-sm text-[#476788]">
                <div>Почта</div>
                <div>Телеграм</div>
                <div>Юридическая информация</div>
                <button className="text-left text-[#006bff] hover:underline" onClick={() => handleLogin('admin')}>Вход для администратора</button>
                <div>© «Аксиома», 2026</div>
              </div>
            </div>
        </div>
      </footer>

      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title={authMode === 'registration' ? 'Регистрация' : 'Вход в платформу'} className="max-w-3xl">
        {authMode === 'login' ? (
          <div className="space-y-4">
            <p className="text-sm text-[#476788] mb-6">Выберите тип вашего аккаунта для продолжения работы в системе.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => handleLogin('client')} className="w-full text-left p-5 rounded-2xl border border-[#d4e0ed] hover:border-[#0b3558] hover:bg-[#f8f9fb] transition-all group flex flex-col items-start gap-4 focus:outline-none focus:ring-2 focus:ring-[#006bff] focus:ring-offset-2">
                <div className="w-12 h-12 bg-[#f8f9fb] text-[#006bff] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b3558] text-base">Кабинет заказчика</div>
                  <div className="text-sm text-[#476788] mt-2 leading-relaxed">Материалы, каталог площадок, заказы, приемка публикаций и документы.</div>
                </div>
              </button>
              <button onClick={() => handleLogin('publisher')} className="w-full text-left p-5 rounded-2xl border border-[#d4e0ed] hover:border-[#0b3558] hover:bg-[#f8f9fb] transition-all group flex flex-col items-start gap-4 focus:outline-none focus:ring-2 focus:ring-[#006bff] focus:ring-offset-2">
                <div className="w-12 h-12 bg-[#f8f9fb] text-[#0b3558] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-[#0b3558] text-base">Кабинет площадки</div>
                  <div className="text-sm text-[#476788] mt-2 leading-relaxed">Заявки, публикации, споры, выплаты и карточки ваших площадок.</div>
                </div>
              </button>
            </div>
            <div className="pt-2 text-sm text-[#476788]">
              Нет аккаунта? <button className="font-semibold text-[#006bff]" onClick={() => openRegistrationModal('client')}>Зарегистрироваться</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f8f9fb] border border-[#d4e0ed] p-1">
              {[
                ['client', 'Заказчик', Briefcase],
                ['publisher', 'Площадка', Store],
              ].map(([role, label, Icon]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRegistrationRole(role)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${registrationRole === role ? 'bg-white text-[#0b3558] shadow-[rgba(71,103,136,0.04)_0px_4px_5px_0px,rgba(71,103,136,0.03)_0px_4px_10px_0px,rgba(71,103,136,0.05)_0px_10px_20px_0px]' : 'text-[#476788] hover:text-[#0b3558]'}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Email</span>
                <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue={registrationRole === 'client' ? 'client@example.ru' : 'publisher@example.ru'} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Телефон</span>
                <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="+7 999 000-00-00" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Пароль</span>
                <input type="password" className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="password" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Статус плательщика</span>
                <CustomSelect className="mt-2" options={['Юридическое лицо', 'ИП', 'Физическое лицо']} />
              </label>

              {registrationRole === 'client' ? (
                <>
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
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="text-sm font-medium text-[#476788]">Название площадки</span>
                    <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="РБК Инвестиции" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[#476788]">Тип площадки</span>
                    <CustomSelect className="mt-2" options={['СМИ', 'ТГ-канал', 'Паблик ВК', 'Дзен']} />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[#476788]">Тематика</span>
                    <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Финансы, инвестиции, бизнес" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-[#476788]">Метрика / охват</span>
                    <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="2,5 млн посещений в месяц" />
                  </label>
                </>
              )}
            </div>

            <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-sm text-[#476788]">
              {registrationRole === 'client'
                ? 'После регистрации вы попадете в кабинет заказчика: сможете создать рекламодателя, загрузить материал и выбрать площадки.'
                : 'После регистрации вы попадете в кабинет площадки: сможете заполнить карточку, цены, сроки, требования и отправить площадку на модерацию.'}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button className="text-sm font-semibold text-[#006bff]" onClick={openLoginModal}>Уже есть аккаунт</button>
              <Button variant="primary" onClick={() => handleLogin(registrationRole)}>
                {registrationRole === 'client' ? 'Создать кабинет заказчика' : 'Создать кабинет площадки'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


// --- 2. CLIENT PORTAL ---

const ClientDashboardView = ({ navigate }) => (
  <div className="space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Панель заказчика</h1>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => navigate('materials')}>Материалы</Button>
        <Button variant="primary" onClick={() => navigate('create_material')}><Plus className="w-4 h-4 mr-2" /> Загрузить материал</Button>
      </div>
    </div>

    {/* Требуется действие */}
    <div className="bg-white border border-[#d4e0ed] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <AlertCircle className="w-5 h-5 text-[#006bff] mt-0.5 sm:mt-0 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[#0b3558]">Требуется действие</h4>
        <p className="text-sm text-[#476788] mt-1">
          Площадка "РБК Инвестиции" загрузила публикацию по заказу #1045. Вам нужно проверить ссылку и принять размещение.
        </p>
      </div>
      <Button variant="secondary" className="w-full sm:w-auto" onClick={() => navigate('order_detail')}>
        Проверить
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6">
        <h3 className="text-sm font-medium text-[#476788] mb-1">Доступный баланс</h3>
        <div className="text-3xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(1250000)}</div>
        <div className="mt-4 flex items-center text-sm text-[#006bff] font-medium cursor-pointer hover:text-[#004eba]" onClick={() => navigate('balance')}>
          <Plus className="w-4 h-4 mr-1" /> Пополнить баланс
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-medium text-[#476788] mb-1">Заморожено в заказах</h3>
        <div className="text-3xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(345000)}</div>
        <div className="mt-4 text-sm text-[#476788]">В 4 активных заказах</div>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-medium text-[#476788] mb-1">Ждут действия</h3>
        <div className="text-3xl font-semibold text-[#0b3558] tabular-nums">3</div>
        <div className="mt-4 flex items-center text-sm text-[#006bff] cursor-pointer hover:text-[#004eba]" onClick={() => navigate('orders')}>
          Открыть задачи <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-sm font-medium text-[#476788] mb-1">Готовы к размещению</h3>
        <div className="text-3xl font-semibold text-[#0b3558] tabular-nums">2</div>
        <div className="mt-4 flex items-center text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('materials')}>
          Перейти к материалам <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="overflow-hidden xl:col-span-2">
        <div className="px-6 py-5 border-b border-[#d4e0ed] flex justify-between items-center bg-[#f8f9fb]">
          <h3 className="text-base font-semibold text-[#0b3558]">Что требует внимания</h3>
          <button className="text-sm text-[#006bff] font-medium hover:text-[#004eba]" onClick={() => navigate('orders')}>Все задачи</button>
        </div>
        <div className="divide-y divide-[#d4e0ed]">
          {[
            ['#1045', 'Проверить публикацию', 'РБК Инвестиции загрузила ссылку и скриншот', 'order_detail', 'Проверить'],
            ['#1054', 'Ответить на правки', 'Площадка запросила уточнение по материалу', 'order_detail', 'Открыть'],
            ['#M-1052', 'Материал на модерации', 'Ожидает проверки перед выбором площадок', 'materials', 'К материалам'],
          ].map(([id, title, text, target, action]) => (
            <button key={id} className="w-full px-6 py-4 text-left hover:bg-[#f8f9fb] flex flex-col md:flex-row md:items-center gap-3" onClick={() => navigate(target)}>
              <div className="md:w-24 text-sm font-semibold text-[#0b3558]">{id}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-[#0b3558]">{title}</div>
                <div className="text-xs text-[#476788] mt-1">{text}</div>
              </div>
              <div className="text-sm font-medium text-[#006bff]">{action}</div>
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4">Материалы</h3>
        <div className="space-y-4">
          {[
            ['Приняты в систему', '2', 'можно размещать'],
            ['На модерации', '2', 'ожидают проверки'],
            ['Требуют правок', '1', 'нужно обновить текст'],
          ].map(([label, value, note]) => (
            <div key={label} className="flex items-center justify-between gap-4 pb-3 border-b border-[#d4e0ed]">
              <div>
                <div className="text-sm font-medium text-[#0b3558]">{label}</div>
                <div className="text-xs text-[#476788] mt-1">{note}</div>
              </div>
              <div className="text-xl font-semibold text-[#0b3558] tabular-nums">{value}</div>
            </div>
          ))}
        </div>
        <Button variant="secondary" className="w-full mt-5" onClick={() => navigate('materials')}>Открыть материалы</Button>
      </Card>
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
               <tr key={order.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('order_detail')}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#0b3558] font-medium">#{order.id}</td>
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

const ClientOrderDetailView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex items-center gap-2 text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('dashboard')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> Назад
    </div>
    
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          Заказ #1045
          <Badge color="indigo">Ожидает приемки</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Создан 15.10.2023</p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-sm text-[#476788]">Сумма размещения</div>
        <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(150000)}</div>
      </div>
    </div>

    <div className="bg-white border border-[#d4e0ed] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-12 h-12 bg-[#f8f9fb] rounded-full flex items-center justify-center border border-[#d4e0ed] flex-shrink-0">
           <CheckCircle2 className="w-6 h-6 text-[#006bff]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#0b3558]">Публикация загружена</h3>
          <p className="text-sm text-[#476788] mt-1 mb-4">
            Площадка загрузила ссылку на опубликованный материал. Проверьте корректность размещения. Нажимая «Принять и оплатить», вы подтверждаете отсутствие претензий, средства будут списаны с замороженного баланса.
          </p>
          <div className="bg-[#f8f9fb] rounded-lg p-4 border border-[#d4e0ed] flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div className="flex items-center gap-2 truncate">
              <ExternalLink className="w-4 h-4 text-[#a6bbd1] flex-shrink-0" />
              <a href="#" className="text-sm text-[#006bff] hover:underline truncate">https://invest.rbc.ru/news/652a9f...</a>
            </div>
            <span className="text-xs text-[#476788] whitespace-nowrap bg-[#f8f9fb] px-2 py-1 rounded">Опубликовано 18.10.2023</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Принять и оплатить</Button>
            <Button variant="secondary" onClick={() => navigate('complaint')}>Открыть жалобу</Button>
            <Button variant="secondary" onClick={() => navigate('order_chat')}>Чат заказа</Button>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Состав заказа</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[
              ['Материал', 'Пресс-релиз: Запуск новой платформы'],
              ['Рекламодатель', 'ООО "Финтех Решения" · ИНН 7700000000'],
              ['Площадка', 'РБК Инвестиции'],
              ['Формат', 'Статья · публикация от редакции'],
              ['Сумма', formatMoney(150000)],
              ['Создан', '15.10.2023'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
                <div className="text-xs text-[#476788]">{label}</div>
                <div className="mt-1 font-medium text-[#0b3558]">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
            <div className="text-xs text-[#476788] mb-2">Ссылки, найденные в тексте материала</div>
            <div className="space-y-2">
              {materialLinks.map((link) => (
                <div key={link} className="flex items-center gap-2 text-sm text-[#006bff] break-all">
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span>{link}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <MaterialAdvancedSettings />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Материал</h3>
          <FullMaterialPreview />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Площадка</h3>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-[#0b3558] flex items-center justify-center text-white font-bold">Р</div>
            <div>
              <div className="text-sm font-medium text-[#0b3558]">РБК Инвестиции</div>
              <div className="text-xs text-[#476788]">СМИ • Финансы</div>
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-[#476788]">Маркировка на стороне площадки</span>
            </div>
             <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#a6bbd1]" />
              <span className="text-sm text-[#476788]">Хранение: Навсегда</span>
            </div>
          </div>
        </Card>

        <Button variant="secondary" className="w-full" onClick={() => navigate('order_chat')}>Чат заказа</Button>
      </div>
    </div>
  </div>
);

const ClientOrdersView = ({ navigate }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Заказы</h1>
        <p className="text-sm text-[#476788] mt-1">Каждая площадка в размещении создает отдельный заказ</p>
      </div>
      <Button variant="secondary" onClick={() => navigate('catalog')}>Открыть каталог</Button>
    </div>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Номер</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Материал</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Площадка</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Сумма</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Статус</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase tracking-wider">Действие</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#d4e0ed]">
            {mockOrdersClient.map((order) => (
              <tr key={order.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('order_detail')}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0b3558]">#{order.id}</td>
                <td className="px-6 py-4 text-sm text-[#476788]">{order.material}</td>
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
  </div>
);

const ClientComplaintView = ({ navigate }) => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('order_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К заказу #1045
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Жалоба / спор</h1>
      <p className="text-sm text-[#476788] mt-1">Замороженные средства остаются на холде до решения модератора.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Заказ</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="#1045 · РБК Инвестиции" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Причина</span><CustomSelect className="mt-2" options={['Некорректная маркировка', 'Материал изменен', 'Ссылка недоступна', 'Нарушен формат']} /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Ссылка</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="https://invest.rbc.ru/news/652a9f" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Дата обнаружения</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="19.10.2023" /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Описание</span><textarea className="mt-2 w-full min-h-[150px] border border-[#476788] rounded-lg px-4 py-3 text-sm" defaultValue="Опишите, что именно нарушено: ссылка, скриншот, фрагмент публикации, отличие от согласованного материала." /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Скриншот / доказательства</span><div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">Загрузите файл или несколько доказательств</div></label>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#476788]">После открытия жалобы будет создана отдельная страница спора с доказательствами и решением модератора.</p>
        <Button variant="primary">Открыть жалобу</Button>
      </div>
    </Card>
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-[#0b3558]">Спор #C-020 уже открыт</div>
          <p className="text-sm text-[#476788] mt-1">Средства по заказу заморожены, модератор ожидает доказательства от площадки.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('dispute_detail')}>Открыть спор</Button>
      </div>
    </Card>
    <ConfirmAction title="Подтверждение жалобы" text="Открытие жалобы блокирует оплату заказа до решения модератора." action="Подтвердить жалобу" />
  </div>
);

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
	          <p className="text-sm text-[#476788] mt-1">Админ запросил доказательства у площадки. До решения спора оплата и выплата по заказу заблокированы.</p>
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

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Предмет спора</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ['Причина', 'Нарушен формат публикации'],
            ['Ссылка на публикацию', 'https://invest.rbc.ru/news/652a9f'],
            ['Дата обнаружения', '19.10.2023'],
            ['Сумма размещения', formatMoney(150000)],
            ['Позиция заказчика', 'Материал опубликован с измененным заголовком и без согласованного изображения.'],
            ['Позиция площадки', 'Редакция утверждает, что изменения не влияют на предмет размещения и соответствуют правилам площадки.'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
              <div className="text-xs text-[#476788]">{label}</div>
              <div className="mt-1 font-medium text-[#0b3558]">{value}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Стороны</h2>
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-[#476788]">Заказчик</div>
            <div className="font-medium text-[#0b3558]">Заказчик #842</div>
            <div className="text-xs text-[#476788] mt-1">Контакты скрыты</div>
          </div>
          <div>
            <div className="text-[#476788]">Площадка</div>
            <div className="font-medium text-[#0b3558]">РБК Инвестиции</div>
          </div>
          <div>
            <div className="text-[#476788]">Модератор</div>
            <div className="font-medium text-[#0b3558]">Операции Аксиомы</div>
          </div>
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Доказательства заказчика</h2>
        {['скриншот жалобы', 'согласованный материал', 'комментарий от 19.10'].map(file => (
          <div key={file} className="flex items-center justify-between py-3 border-b border-[#d4e0ed]">
            <span className="text-sm text-[#006bff]">{file}</span>
            <Download className="w-4 h-4 text-[#a6bbd1]" />
          </div>
        ))}
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Доказательства площадки</h2>
        {['архив страницы', 'редакционная политика', 'скриншот публикации'].map(file => (
          <div key={file} className="flex items-center justify-between py-3 border-b border-[#d4e0ed]">
            <span className="text-sm text-[#006bff]">{file}</span>
            <Download className="w-4 h-4 text-[#a6bbd1]" />
          </div>
        ))}
      </Card>
    </div>

	    <Card className="p-6">
	      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Ход рассмотрения</h2>
	      <div className="space-y-4">
	        {[
	          ['19.10 10:12', 'Заказчик открыл спор', 'done'],
	          ['19.10 11:00', 'Оплата и выплата заблокированы до решения', 'done'],
	          ['19.10 13:30', 'Админ запросил доказательства у площадки', 'current'],
	          ['20.10 18:00', 'Дедлайн ответа площадки', 'next'],
	          ['после ответа', 'Модератор сравнит материал, ссылку, скриншоты и условия площадки', 'next'],
	          ['после проверки', 'Решение админа и разблокировка средств', 'next'],
	        ].map(([time, event, status]) => (
          <div key={`${time}-${event}`} className="flex items-start gap-3">
            {status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> : status === 'current' ? <Clock className="w-4 h-4 text-amber-500 mt-0.5" /> : <div className="w-4 h-4 rounded-full border-2 border-[#d4e0ed] mt-0.5" />}
            <div>
              <div className="text-sm font-medium text-[#0b3558]">{event}</div>
              <div className="text-xs text-[#476788] mt-1">{time}</div>
            </div>
          </div>
	        ))}
	      </div>
	    </Card>
	    <Card className="p-6">
	      <h2 className="font-display text-base font-bold text-[#0b3558] mb-3">Возможные решения</h2>
	      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
	        {['Размещение принято, средства списаны', 'Частичный возврат заказчику', 'Полный возврат и удержание у площадки'].map((item) => (
	          <div key={item} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-[#0b3558]">{item}</div>
	        ))}
	      </div>
	    </Card>
	  </div>
);

const OrderChatView = ({ navigate, role = 'client' }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate(role === 'publisher' ? 'pub_order_detail' : 'order_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К карточке заказа
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Чат заказа #1045</h1>
        <p className="text-sm text-[#476788] mt-1">{role === 'publisher' ? 'Клиент скрыт как Заказчик #842. Контакты и юрданные не показываются.' : 'Вы общаетесь с площадкой внутри заказа. Контактные данные скрыты.'}</p>
      </div>
      <Badge color="blue">Анонимность включена</Badge>
    </div>
    {role === 'publisher' && (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-[#006bff] mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-[#0b3558]">Чат доступен внутри активного заказа</div>
            <p className="text-sm text-[#476788] mt-1">Заказчик скрыт как «Заказчик #842». Файлы и системные события сохраняются в истории заказа.</p>
          </div>
        </div>
      </Card>
    )}
    <Card className="grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
      <div className="lg:col-span-2 flex flex-col h-[620px]">
        <div className="px-6 py-4 border-b border-[#d4e0ed] bg-[#f8f9fb]">
          <h2 className="font-display text-sm font-bold text-[#0b3558]">Сообщения и системные события</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8f9fb]">
          {(role === 'publisher' ? ['Заказ поступил', 'Площадка приняла заказ', 'Площадка отклонила заказ', 'Площадка запросила правки', 'Заказчик загрузил новую версию', 'Площадка подтвердила маркировку', 'Площадка загрузила ссылку', 'Заказчик принял публикацию', 'Заказчик открыл жалобу', 'Админ запросил доказательства', 'Удержание применено', 'Заказ завершен'] : mockSystemEvents).map((event) => (
            <div key={event} className="flex justify-center">
              <div className="bg-white border border-[#d4e0ed] rounded-lg px-3 py-2 text-xs text-[#476788]">{event}</div>
            </div>
          ))}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0b3558] text-white flex items-center justify-center text-xs">П</div>
            <div className="rounded-2xl rounded-tl-sm bg-white border border-[#d4e0ed] p-3 text-sm text-[#0b3558] max-w-[80%]">Публикация запланирована на 18 октября, 12:00.</div>
          </div>
          <div className="flex items-start justify-end gap-3">
            <div className="rounded-2xl rounded-tr-sm bg-[#0b3558] text-white p-3 text-sm max-w-[80%]">Спасибо, ждем ссылку и скриншот после выхода.</div>
          </div>
        </div>
        <div className="p-4 border-t border-[#d4e0ed] bg-white">
          <div className="flex gap-2"><input className="flex-1 border border-[#476788] rounded-lg px-4 py-2 text-sm" placeholder="Написать сообщение..." /><Button variant="primary">Отправить</Button></div>
        </div>
      </div>
      <div className="border-l border-[#d4e0ed] p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-[#0b3558] mb-3">Файлы и версии</h3>
        {['материал версия 3', 'архив изображений', 'скриншот публикации'].map(file => <div key={file} className="py-2 text-sm text-[#006bff] border-b border-[#d4e0ed]">{file}</div>)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#0b3558] mb-3">События</h3>
          <div className="space-y-2">{(role === 'publisher' ? ['заказ поступил', 'площадка приняла заказ', 'площадка запросила правки', 'заказчик загрузил новую версию', 'площадка подтвердила маркировку', 'площадка загрузила ссылку', 'заказчик открыл жалобу', 'админ запросил доказательства', 'удержание применено', 'заказ завершен'] : mockSystemEvents).map(event => <div key={event} className="text-xs text-[#476788]">{event}</div>)}</div>
        </div>
      </div>
    </Card>
  </div>
);

const ClientReportDetailView = ({ navigate }) => (
  <div className="space-y-6 max-w-6xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('reports')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К отчетам
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Отчет по размещению</h1>
        <p className="text-sm text-[#476788] mt-1">Заказ #1045 · РБК Инвестиции · публикация от 18.10.2023</p>
      </div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Скачать отчет</Button><Button variant="primary">Принять размещение</Button></div>
    </div>

    <Card className="p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><Badge color="indigo">ожидает приемки</Badge><Badge color="green">ссылка загружена</Badge></div>
          <h2 className="font-display text-lg font-bold text-[#0b3558] mt-3">Публикация готова к проверке</h2>
          <p className="text-sm text-[#476788] mt-1">Проверьте ссылку, скриншот, наличие материала и сохранность ссылки. После приемки средства будут списаны с холда.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('complaint')}>Открыть жалобу</Button>
      </div>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Размещение</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ['Материал', 'Пресс-релиз: Запуск новой платформы'],
            ['Площадка', 'РБК Инвестиции'],
            ['Формат', 'СМИ · статья'],
            ['Дата публикации', '18.10.2023'],
            ['Сумма', formatMoney(150000)],
            ['Срок хранения', 'минимум 2 года'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <div className="text-xs text-[#476788]">{label}</div>
              <div className="mt-1 text-sm font-medium text-[#0b3558]">{value}</div>
            </div>
          ))}
          <div className="md:col-span-2 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-xs text-[#476788]">Ссылка на публикацию</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#004eba] break-all">
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span>https://invest.rbc.ru/news/652a9f</span>
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Проверка</h2>
        <div className="space-y-3">
          {[
            ['Ссылка открывается', 'green'],
            ['Материал опубликован полностью', 'green'],
            ['Изображения на месте', 'green'],
            ['Маркировка подтверждена площадкой', 'green'],
            ['Скриншот приложен', 'green'],
          ].map(([item, color]) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[#476788]">
              <CheckCircle2 className={`w-4 h-4 ${color === 'green' ? 'text-emerald-500' : 'text-[#d4e0ed]'}`} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Скриншот публикации</h2>
        <div className="aspect-[16/9] rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] overflow-hidden">
          <div className="h-full bg-white p-5">
            <div className="h-4 w-32 rounded bg-[#d4e0ed] mb-5" />
            <div className="h-7 w-3/4 rounded bg-[#0b3558] mb-3" />
            <div className="space-y-2">
              <div className="h-3 rounded bg-[#d4e0ed]" />
              <div className="h-3 rounded bg-[#d4e0ed] w-11/12" />
              <div className="h-3 rounded bg-[#d4e0ed] w-2/3" />
            </div>
            <div className="mt-6 h-20 rounded bg-[#f8f9fb] border border-[#d4e0ed]" />
          </div>
        </div>
        <Button variant="secondary" className="mt-4"><Download className="w-4 h-4 mr-2" /> Скачать скриншот</Button>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Файлы отчета</h2>
	        {[
	          ['скриншот публикации', 'скриншот'],
	          ['отчет размещения', 'отчет'],
	          ['версия-материала документ', 'исходный материал'],
	        ].map(([file, type]) => (
          <div key={file} className="flex items-center justify-between gap-4 py-3 border-b border-[#d4e0ed]">
            <div>
              <div className="text-sm font-medium text-[#0b3558]">{file}</div>
              <div className="text-xs text-[#476788] mt-0.5">{type}</div>
            </div>
            <Download className="w-4 h-4 text-[#a6bbd1]" />
          </div>
        ))}
      </Card>
    </div>
  </div>
);

const ClientBalanceView = ({ navigate }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Финансы и документы</h1>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white border border-[#d4e0ed] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[#476788] mb-2">Доступно для заявок</h3>
          <div className="text-4xl font-semibold text-[#0b3558] tabular-nums mb-8 tracking-tight">{formatMoney(1250000)}</div>
          
          <div className="space-y-4 text-sm mb-8 pb-6 border-b border-[#d4e0ed]">
             <div className="flex justify-between items-center">
               <span className="text-[#476788] flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Заморожено</span>
               <span className="tabular-nums font-medium text-[#0b3558]">{formatMoney(345000)}</span>
             </div>
             <div className="flex justify-between items-center">
               <span className="text-[#476788] flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Всего средств</span>
               <span className="tabular-nums font-medium text-[#0b3558]">{formatMoney(1595000)}</span>
             </div>
          </div>

          <Button variant="primary" className="w-full text-base py-3" onClick={() => navigate('topup')}>
            Пополнить баланс
          </Button>
        </div>

        <Card className="p-5 bg-[#f8f9fb] border-[#d4e0ed] border-dashed">
           <h3 className="text-sm font-medium text-[#0b3558] mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#476788]" /> О комиссии
           </h3>
           <p className="text-xs text-[#476788] mb-3 leading-relaxed">
             Комиссия платформы (15%) списывается в момент пополнения. В каталоге и при оплате заказов вы видите итоговые суммы без скрытых платежей.
           </p>
	           <button className="text-sm text-[#006bff] font-medium hover:underline flex items-center gap-1">Скачать отчет по операциям <Download className="w-3 h-3" /></button>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card className="h-full">
          <div className="px-6 py-5 border-b border-[#d4e0ed] flex justify-between items-center bg-[#f8f9fb]">
            <h3 className="text-base font-semibold text-[#0b3558]">История операций</h3>
            <div className="flex gap-2">
              <Button variant="secondary" className="text-xs px-3 py-1.5 h-8" onClick={() => navigate('operations')}>Все операции</Button>
              <Button variant="secondary" className="text-xs px-3 py-1.5 h-8"><Download className="w-3.5 h-3.5 mr-1.5" /> Экспорт таблицы</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#d4e0ed]">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Дата / номер</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Тип</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Описание</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#d4e0ed]">
                {mockTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#f8f9fb]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#0b3558] tabular-nums">{tx.date}</div>
                      <div className="text-xs text-[#476788] mt-0.5">{tx.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={tx.type === 'Пополнение' ? 'green' : tx.type === 'Удержание' ? 'red' : tx.type === 'Возврат' ? 'amber' : 'blue'}>{tx.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#476788] max-w-[250px] truncate" title={tx.desc}>
                      {tx.desc}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold tabular-nums ${tx.amount > 0 ? 'text-emerald-600' : 'text-[#0b3558]'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
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
        <Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Скачать архив</Button>
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
            {[
	              ['Отчет по размещению', '#1052 · VC.ru', '10.10.2023', 'готов'],
	              ['Счет на пополнение', 'TR-979 · банковский перевод', '01.10.2023', 'оплачен'],
	              ['Отчет по операциям', 'Сентябрь 2023', '30.09.2023', 'готов'],
            ].map(([doc, order, date, status]) => (
              <tr key={`${doc}-${order}`} className="hover:bg-[#f8f9fb]">
                <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{doc}</td>
                <td className="px-6 py-4 text-sm text-[#476788]">{order}</td>
                <td className="px-6 py-4 text-sm text-[#476788]">{date}</td>
                <td className="px-6 py-4"><Badge color={status === 'готов' ? 'green' : 'blue'}>{status}</Badge></td>
                <td className="px-6 py-4 text-right"><Button variant="ghost" className="text-xs"><Download className="w-3.5 h-3.5 mr-1.5" /> Скачать</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const ClientTopUpView = ({ navigate }) => {
  const payment = 500000;
  const fee = payment * 0.15;
  const credited = payment - fee;
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('balance')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К балансу
      </button>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Пополнение баланса</h1>
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="block"><span className="text-sm font-medium text-[#476788]">Сумма платежа</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="500 000 ₽" /></label>
	          <label className="block"><span className="text-sm font-medium text-[#476788]">Способ оплаты</span><CustomSelect className="mt-2" options={['Банковский перевод', 'СБП для бизнеса', 'Карта']} /></label>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">Сумма платежа</div><div className="mt-1 text-xl font-semibold">{formatMoney(payment)}</div></Card>
          <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">Комиссия 15%</div><div className="mt-1 text-xl font-semibold">{formatMoney(fee)}</div></Card>
          <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">К зачислению</div><div className="mt-1 text-xl font-semibold text-[#0b3558]">{formatMoney(credited)}</div></Card>
        </div>
        <div className="mt-6 flex justify-end"><Button variant="primary">Пополнить</Button></div>
      </Card>
      <EmptyState title="Недостаточно средств" text="Если доступного баланса не хватает для заморозки заказа, система блокирует создание заявки и ведет на пополнение." />
    </div>
  );
};

const ClientOperationsView = ({ navigate }) => (
  <div className="space-y-6">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('balance')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К балансу
    </button>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">История операций</h1>
        <p className="text-sm text-[#476788] mt-1">Пополнения, комиссии, заморозки, списания, возвраты, выводы и удержания.</p>
      </div>
      <Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Экспорт</Button>
    </div>
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]"><tr><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Номер / дата</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Описание</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Состояние</th><th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase">Сумма</th></tr></thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {mockTransactions.map(tx => (
            <tr key={tx.id} className="hover:bg-[#f8f9fb]">
              <td className="px-6 py-4"><div className="text-sm font-medium text-[#0b3558]">{tx.id}</div><div className="text-xs text-[#476788]">{tx.date}</div></td>
              <td className="px-6 py-4"><Badge color={tx.type === 'Удержание' ? 'red' : tx.type === 'Пополнение' ? 'green' : 'blue'}>{tx.type}</Badge></td>
              <td className="px-6 py-4 text-sm text-[#476788]">{tx.desc}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{tx.status}</td>
              <td className={`px-6 py-4 text-right text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-[#0b3558]'}`}>{tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const ClientMaterialsView = ({ navigate }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Материалы</h1>
        <p className="text-sm text-[#476788] mt-1">Материалы для размещения</p>
      </div>
      <Button variant="primary" className="w-full sm:w-auto" onClick={() => navigate('create_material')}><Plus className="w-4 h-4 mr-2" /> Добавить материал</Button>
    </div>

    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6bbd1]" />
        <input 
          type="text" 
          placeholder="Поиск по названию или рекламодателю..." 
          className="w-full pl-10 pr-4 py-2 border border-[#476788] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006bff] text-sm"
        />
      </div>
      <div className="w-full sm:w-56">
        <CustomSelect options={['Все статусы', 'Черновик', 'На модерации', 'Принят в систему', 'Требуются правки', 'Используется в заказах', 'Отклонен']} />
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
            {mockMaterials.map((mat) => (
              <tr key={mat.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('material_detail')}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-[#0b3558] max-w-[200px] sm:max-w-xs truncate">{mat.name}</div>
                  <div className="text-xs text-[#476788] mt-0.5">{mat.type}</div>
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

const ClientMaterialDetailView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('materials')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К материалам
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          Пресс-релиз: Запуск новой платформы
          <Badge color="green">Принят в систему</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Материал #M-1048 · обновлен 12.10.2023</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate('create_material')}>Редактировать материал</Button>
        <Button variant="primary" onClick={() => navigate('catalog')}>Выбрать площадки</Button>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Содержание материала</h3>
        <FullMaterialPreview />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Скачать документ</Button>
          <Button variant="ghost">Архивировать</Button>
        </div>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          При редактировании материал вернется в черновики и станет недоступен для новых размещений до повторной модерации.
        </div>
      </Card>
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4">Рекламодатель</h3>
          <div className="space-y-3 text-sm">
            <div><div className="text-[#476788]">Юрлицо</div><div className="font-medium text-[#0b3558]">ООО "Финтех Решения"</div></div>
            <div><div className="text-[#476788]">ИНН</div><div className="font-medium text-[#0b3558]">7700000000</div></div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4">Комментарий модератора</h3>
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
            Материал принят в систему. Доступен выбор площадок и добавление их в избранное.
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4">Размещение</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-[#476788]">Доступно площадок</span><span className="font-medium text-[#0b3558]">128</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#476788]">В избранном</span><span className="font-medium text-[#0b3558]">2</span></div>
            <div className="flex justify-between gap-4"><span className="text-[#476788]">Активных заказов</span><span className="font-medium text-[#0b3558]">3</span></div>
          </div>
          <Button variant="secondary" className="w-full mt-5" onClick={() => navigate('catalog')}>Открыть каталог</Button>
        </Card>
      </div>
    </div>
  </div>
);

const ClientCreateMaterialView = ({ navigate }) => {
  const [aiModal, setAiModal] = useState(null);
  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('materials')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К материалам
    </button>
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Создание материала</h1>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#476788]">Заголовок</span>
            <span className="text-xs text-[#476788]">36 / 200 символов</span>
          </div>
          <input maxLength={200} className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="Пресс-релиз: запуск аналитики" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Рекламодатель</span>
          <CustomSelect className="mt-2" options={['ООО "Финтех Решения"', 'Урбан Групп']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Тип материала</span>
          <CustomSelect className="mt-2" options={['Статья', 'Новость', 'Интервью', 'Пост в Телеграме']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Файлы</span>
          <div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">Перетащите документ, отчет или изображения либо нажмите для загрузки</div>
        </label>
        <div className="block">
          <span className="text-sm font-medium text-[#476788]">Изображения</span>
          <div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">
            Загрузите изображение или <button type="button" className="font-semibold text-[#006bff]" onClick={() => setAiModal('image')}>сгенерируйте с помощью ИИ за 50 ₽</button>
          </div>
        </div>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Примечание и ТЗ</span>
          <textarea className="mt-2 w-full min-h-[120px] border border-[#476788] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="Необязательные пожелания по стилистике, акцентам, площадкам или ограничениям." />
        </label>
        <div className="block md:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#476788]">Текст материала</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#476788]">2 840 знаков</span>
              <Button variant="secondary" className="text-xs py-1.5 px-3" onClick={() => setAiModal('rewrite')}>Рерайт с помощью ИИ · 30 ₽</Button>
            </div>
          </div>
          <div className="mt-2 border border-[#0b3558] rounded-2xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#006bff] focus-within:border-[#006bff]">
            <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-[#d4e0ed] bg-[#f8f9fb]">
              {[
                { label: 'Обычный текст', icon: Type },
                { label: 'Заголовок 1', icon: Heading1 },
                { label: 'Заголовок 2', icon: Heading2 },
                { label: 'Жирный', icon: Bold },
                { label: 'Курсив', icon: Italic },
                { label: 'Список', icon: List },
                { label: 'Цитата', icon: Quote },
                { label: 'Изображение', icon: ImageIcon },
                { label: 'Ссылка', icon: ExternalLink },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.label} type="button" title={tool.label} className="inline-flex items-center justify-center h-9 min-w-9 px-2 rounded-lg text-[#476788] hover:text-[#0b3558] hover:bg-white border border-transparent hover:border-[#d4e0ed]">
                    <Icon className="w-4 h-4" />
                    {tool.label === 'Обычный текст' && <span className="ml-2 text-xs font-medium">Текст</span>}
                  </button>
                );
              })}
              <div className="h-6 w-px bg-[#d4e0ed] mx-1"></div>
              <CustomSelect className="w-32" buttonClassName="min-h-9 px-2 py-1.5 text-xs border-[#d4e0ed]" options={['Manrope', 'Arial', 'Georgia']} />
              <CustomSelect className="w-24" buttonClassName="min-h-9 px-2 py-1.5 text-xs border-[#d4e0ed]" options={['16 px', '18 px', '20 px']} />
            </div>
            <div className="min-h-[360px] p-6 text-[#0b3558] outline-none" contentEditable suppressContentEditableWarning>
              <h1 className="font-display text-3xl font-bold text-[#0b3558] mb-4">Финтех Решения запускает новую платформу аналитики</h1>
              <p className="text-base leading-7 mb-4">Вставьте готовый материал или отредактируйте его прямо в платформе. Редактор поддерживает заголовки, шрифты, базовое форматирование, списки, цитаты, ссылки и изображения.</p>
              <h2 className="font-display text-xl font-bold text-[#0b3558] mb-3">Ключевые тезисы</h2>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>материал проходит модерацию до выбора площадок;</li>
                <li>изображения можно вставлять в тело публикации;</li>
                <li>после принятия материала открывается каталог площадок.</li>
              </ul>
              <blockquote className="border-l-4 border-[#006bff] pl-4 text-[#476788] italic">Платформа не пишет материалы, а размещает готовые пиар-публикации в проверенных каналах.</blockquote>
            </div>
          </div>
        </div>
      </div>
      <details className="mt-6 rounded-2xl border border-[#d4e0ed] bg-[#f8f9fb] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[#0b3558]">Дополнительные настройки</summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block"><span className="text-sm font-medium text-[#476788]">Тэги</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="финтех, аналитика, запуск" /></label>
          <label className="block"><span className="text-sm font-medium text-[#476788]">Title</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Финтех Решения запускает платформу аналитики" /></label>
          <label className="block"><span className="text-sm font-medium text-[#476788]">Description</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Платформа помогает контролировать публикации, ссылки и отчеты." /></label>
          <label className="block"><span className="text-sm font-medium text-[#476788]">Желаемый URL</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="/news/fintech-analytics-platform" /></label>
        </div>
      </details>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788] space-y-2">
        <p>До выбора площадок платформа проверяет базовые требования, рекламодателя, ссылки, изображения и юридические риски.</p>
        <p>Размещая материал, вы подтверждаете, что у вас есть все необходимые авторские права на текст, изображения и другие элементы контента.</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('materials')}>Сохранить черновик</Button>
        <Button variant="primary" onClick={() => navigate('materials')}>Отправить на модерацию</Button>
      </div>
    </Card>
    <AiAssistModal isOpen={Boolean(aiModal)} onClose={() => setAiModal(null)} type={aiModal || 'rewrite'} />
  </div>
  );
};

const ClientAdvertisersView = ({ navigate }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Рекламодатели</h1>
      <Button variant="primary" onClick={() => navigate('advertiser_new')}><Plus className="w-4 h-4 mr-2" /> Добавить рекламодателя</Button>
    </div>
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Название / ФИО</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">ИНН</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Объект</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th>
            <th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase">Действие</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {mockAdvertisers.map(item => (
            <tr key={item.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('advertiser_detail')}>
              <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{item.name}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{item.type}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{item.inn}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{item.object}</td>
              <td className="px-6 py-4"><Badge color={item.color}>{item.status}</Badge></td>
              <td className="px-6 py-4 text-right">
                <button
                  className="text-sm font-medium text-[#006bff] hover:text-[#004eba]"
                  onClick={(event) => { event.stopPropagation(); navigate('advertiser_edit'); }}
                >
                  Редактировать
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const ClientAdvertiserDetailView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('advertisers')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К рекламодателям
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          ООО "Финтех Решения"
          <Badge color="green">Проверен</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Рекламодатель #A-102 · используется в 4 материалах</p>
      </div>
      <Button variant="primary" onClick={() => navigate('advertiser_edit')}>Редактировать</Button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-lg font-bold text-[#0b3558] mb-4">Юридические данные</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {[
            ['Тип', 'Юридическое лицо'],
            ['Название', 'ООО "Финтех Решения"'],
            ['ИНН', '7700000000'],
            ['ОГРН', '1237700000000'],
            ['Юридический адрес', '119019, Москва, ул. Воздвиженка, 10'],
            ['Сайт', 'https://axioma.example/product'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
              <div className="text-xs text-[#476788]">{label}</div>
              <div className="mt-1 font-medium text-[#0b3558]">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Проверка</h2>
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-medium text-[#0b3558]">Данные подтверждены</div>
              <div className="text-[#476788] mt-1">Можно использовать в материалах и заказах.</div>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => navigate('materials')}>Материалы рекламодателя</Button>
        </div>
      </Card>
    </div>

    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Документы и ответственные</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {[
          ['Карточка компании', 'Загружена 10.10.2023'],
          ['Ответственный', 'Мария Орлова, маркетинг'],
          ['Статус ERID-данных', 'Готовы к передаче в заказ'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#d4e0ed] bg-white p-4">
            <div className="text-xs text-[#476788]">{label}</div>
            <div className="mt-1 font-medium text-[#0b3558]">{value}</div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const ClientAdvertiserEditView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('advertiser_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К карточке рекламодателя
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Редактирование рекламодателя</h1>
      <p className="text-sm text-[#476788] mt-1">Изменения юридических данных могут отправить карточку на повторную проверку.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Тип рекламодателя</span>
          <CustomSelect className="mt-2" options={['Юридическое лицо', 'Индивидуальный предприниматель', 'Физическое лицо']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Название / ФИО</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue='ООО "Финтех Решения"' />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ИНН</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="7700000000" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ОГРН / ОГРНИП</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="1237700000000" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Юридический адрес</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="119019, Москва, ул. Воздвиженка, 10" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Сайт рекламодателя</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="https://axioma.example/product" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Документы</span>
          <div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">
            Карточка компании загружена. Можно добавить новую версию или доверенность.
          </div>
        </label>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('advertiser_detail')}>Отмена</Button>
        <Button variant="primary" onClick={() => navigate('advertiser_detail')}>Сохранить изменения</Button>
      </div>
    </Card>
  </div>
);

const ClientAdvertiserNewView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('advertisers')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К рекламодателям
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Новый рекламодатель</h1>
      <p className="text-sm text-[#476788] mt-1">Юридические данные нужны для проверки рекламодателя и дальнейшей работы с маркировкой.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Тип рекламодателя</span>
          <CustomSelect className="mt-2" options={['Юридическое лицо', 'Индивидуальный предприниматель', 'Физическое лицо']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Название / ФИО</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="ООО «Название компании»" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ИНН</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="7700000000" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ОГРН / ОГРНИП</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="1237700000000" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Юридический адрес</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="Индекс, город, улица, дом" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Категория</span>
          <CustomSelect className="mt-2" options={['ПО для бизнеса / аналитика', 'Финансы', 'Недвижимость', 'Образование', 'Другое']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Сайт рекламодателя</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="https://" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Ответственный</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="Имя и должность" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Документы</span>
          <div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">
            Загрузите карточку компании, доверенность или другие документы для проверки.
          </div>
        </label>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        После сохранения рекламодатель появится в списке со статусом «на проверке». Материалы можно создавать сразу, но отправка на площадки станет доступна после проверки данных.
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('advertisers')}>Отмена</Button>
        <Button variant="primary" onClick={() => navigate('advertisers')}>Сохранить рекламодателя</Button>
      </div>
    </Card>
  </div>
);

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
	            const mediologyRank = ((item.id - 100) * 5) % 30 || 30;
	            return (
              <tr key={item.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('platform_detail')}>
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
	                  <div className="text-[11px] text-[#476788]" title="Для федеральных СМИ — общий рейтинг; для региональных и отраслевых — рейтинг по региону или отрасли.">{item.region === 'Федеральные' ? 'общий' : 'по сегменту'}</div>
	                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.aggregators.map((aggregator) => <Badge key={aggregator} color={aggregator === 'нет' ? 'gray' : 'blue'}>{aggregator}</Badge>)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-[#476788] truncate">{item.reach}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-[#0b3558] tabular-nums">{formatMoney(item.price)}</td>
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

const ClientCatalogView = ({ favoritePlatforms, toggleFavoritePlatform, navigate }) => {
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState([]);
  const [isBulkModalOpen, setBulkModalOpen] = useState(false);
  const visiblePlatforms = showFavoritesOnly ? mockCatalog.filter(item => favoritePlatforms.includes(item.id)) : mockCatalog;
  const selectedPlatforms = mockCatalog.filter(item => selectedPlatformIds.includes(item.id));
  const selectedTotal = selectedPlatforms.reduce((sum, item) => sum + item.price, 0);
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
          <Button variant="secondary" className="w-full sm:w-auto"><Filter className="w-4 h-4 mr-2" /> Фильтры</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CustomSelect options={['Все типы', 'СМИ', 'ТГ-канал', 'Паблик ВК']} />
          <CustomSelect options={['Любая цель', 'Пиар', 'SEO', 'SERM']} />
          <CustomSelect options={['Все регионы', 'Федеральные', 'Москва', 'Регионы']} />
          <CustomSelect options={['Любая тематика', 'Финансы', 'ИТ', 'Бизнес']} />
          <CustomSelect options={['Любая цена', 'До 50 000 ₽', '50 000-100 000 ₽', '100 000+ ₽']} />
          <CustomSelect options={['Любой срок', '1 день', '2-3 дня', 'До недели']} />
          <CustomSelect options={['Все форматы', 'Статья', 'Пост', 'Лонгрид']} />
          <CustomSelect options={['SEO / TG-метрики', 'Google News', 'Дзен', 'Вовлеченность TG', 'Индекс качества']} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-bold text-[#0b3558]">Массовое размещение одного материала</h2>
            <p className="text-sm text-[#476788] mt-1">
              Выберите несколько площадок в списке и создайте отдельные заказы для одного текста.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] px-4 py-2 text-sm">
              <span className="text-[#476788]">Выбрано:</span>
              <span className="ml-2 font-semibold text-[#0b3558]">{selectedPlatforms.length}</span>
              <span className="mx-2 text-[#d4d4d4]">/</span>
              <span className="font-semibold text-[#0b3558] tabular-nums">{formatMoney(selectedTotal)}</span>
            </div>
            <Button variant="secondary" className="w-full sm:w-auto" disabled={!selectedPlatforms.length} onClick={() => setSelectedPlatformIds([])}>
              Сбросить
            </Button>
            <Button variant="primary" className="w-full sm:w-auto" disabled={!selectedPlatforms.length} onClick={() => setBulkModalOpen(true)}>
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
      />
    </div>
  );
};

const ClientPlatformDetailView = ({ favoritePlatforms, toggleFavoritePlatform, navigate }) => {
  const item = mockCatalog[0];
  const isFavorite = favoritePlatforms.includes(item.id);
  const [isMaterialModalOpen, setMaterialModalOpen] = useState(false);
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('catalog')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К каталогу
      </button>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl ${item.logo}`}>{item.name.charAt(0)}</div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0b3558]">{item.name}</h1>
            <p className="text-sm text-[#476788] mt-1">{item.type} · {item.theme} · {item.region}</p>
            <div className="flex flex-wrap gap-2 mt-3">{item.tags.map(tag => <Badge key={tag} color="blue">{tag}</Badge>)}</div>
          </div>
        </div>
        <Button variant={isFavorite ? 'primary' : 'secondary'} onClick={() => toggleFavoritePlatform(item.id)}>
          <Star className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-white' : ''}`} /> {isFavorite ? 'В избранном' : 'В избранное'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Цена</div><div className="mt-2 text-xl font-semibold">{formatMoney(item.price)}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Срок публикации</div><div className="mt-2 text-xl font-semibold">{item.deadline}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Хранение</div><div className="mt-2 text-xl font-semibold">{item.storage}</div></Card>
	        <Card className="p-5"><div className="text-xs text-[#476788] uppercase flex items-center gap-1">Медиалогия <Info className="w-3.5 h-3.5" /></div><div className="mt-2 text-xl font-semibold">#{((item.id - 100) * 5) % 30 || 30}</div><div className="text-xs text-[#476788] mt-1">{item.region === 'Федеральные' ? 'общий рейтинг' : 'рейтинг по региону/отрасли'}</div></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Метрики и требования</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><div className="text-[#476788]">Посещаемость</div><div className="font-medium text-[#0b3558]">{item.reach}</div></div>
            <div><div className="text-[#476788]">Агрегаторы</div><div className="font-medium text-[#0b3558]">{item.aggregators.join(', ')}</div></div>
            <div><div className="text-[#476788]">Доступные форматы</div><div className="font-medium text-[#0b3558]">Статья, новость, интервью, нативная интеграция</div></div>
            <div><div className="text-[#476788]">SEO-параметры</div><div className="font-medium text-[#0b3558]">Индексация, dofollow по согласованию, Google News</div></div>
          </div>
          <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">Не принимаются запрещенные тематики, материалы без рекламодателя, внешние контакты в тексте и обещания гарантированного дохода.</div>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Выбор площадки</h2>
          <p className="text-sm text-[#476788] mb-4">Выберите готовый материал, который нужно отправить на эту площадку. Создание заказа заморозит средства.</p>
          <Button variant="primary" className="w-full" onClick={() => setMaterialModalOpen(true)}>Разместить текст на площадке</Button>
          <Button variant="secondary" className="w-full mt-3" onClick={() => navigate('catalog')}>К каталогу</Button>
        </Card>
      </div>
      <MaterialSelectionModal isOpen={isMaterialModalOpen} onClose={() => setMaterialModalOpen(false)} platform={item} />
    </div>
  );
};

const ClientReportsView = ({ navigate }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Отчеты</h1>
      <div className="flex gap-3"><Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Скачать таблицу</Button><Button variant="primary">Сформировать отчет</Button></div>
    </div>
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Заказ</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Материал</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Площадка</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Ссылка</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {mockReports.map(row => (
            <tr key={row.order} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('report_detail')}>
              <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{row.order}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{row.material}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{row.platform}</td>
              <td className="px-6 py-4 text-sm text-[#006bff]">{row.link}</td>
              <td className="px-6 py-4"><Badge color={row.color}>{row.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const ClientSupportView = ({ navigate }) => {
  const [tab, setTab] = useState('tickets');
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
          {[
            ['T-184', 'Вопрос по заказу #1045', 'Открыт', 'blue'],
            ['T-173', 'Документы за сентябрь', 'В работе', 'amber'],
            ['T-169', 'Пополнение баланса', 'Закрыт', 'gray'],
          ].map(([id, title, status, color]) => (
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
            <div className="max-w-[75%] rounded-2xl bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#0b3558]">Нужно уточнить, когда площадка загрузит скриншот публикации.</div>
            <div className="max-w-[75%] ml-auto rounded-2xl bg-[#e6f0ff] border border-[#cfe0ff] p-4 text-sm text-[#0b3558]">Менеджер запросил подтверждение у площадки. Ответ ожидается сегодня до 18:00.</div>
          </div>
          <div className="p-4 border-t border-[#d4e0ed]">
            <textarea className="w-full min-h-[100px] border border-[#476788] rounded-lg px-4 py-3 text-sm" placeholder="Напишите сообщение менеджеру" />
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Прикрепить файл</Button>
              <Button variant="primary">Отправить</Button>
            </div>
          </div>
        </Card>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-[#0b3558] mb-4">Жалобы и споры</h2>
          {[
            ['#C-020', 'Заказ #1045 · РБК Инвестиции', 'на рассмотрении', 'amber'],
            ['#C-018', 'Заказ #1052 · VC.ru', 'решен', 'green'],
          ].map(([id, title, status, color]) => (
            <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-[#d4e0ed]">
              <div>
                <div className="text-sm font-semibold text-[#0b3558]">{id} · {title}</div>
                <div className="text-xs text-[#476788] mt-1">Доказательства, переписка и решение модератора</div>
              </div>
              <div className="flex items-center gap-3"><Badge color={color}>{status}</Badge><Button variant="secondary" onClick={() => navigate('dispute_detail')}>Открыть</Button></div>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558]">Новая жалоба</h3>
          <p className="text-sm text-[#476788] mt-2">Жалоба открывается из карточки заказа, чтобы сохранить связь с публикацией, деньгами и доказательствами.</p>
          <Button variant="primary" className="w-full mt-5" onClick={() => navigate('orders')}>Перейти к заказам</Button>
        </Card>
      </div>
    )}
  </div>
  );
};


// --- 3. КАБИНЕТ ПЛОЩАДКИ ---

const PublisherDashboardView = ({ navigate }) => (
  <div className="space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Панель площадки</h1>
        <p className="text-sm text-[#476788] mt-1">Рабочая сводка по заказам, публикациям и выплатам.</p>
      </div>
      <Button variant="secondary" onClick={() => navigate('pub_orders')}>Все заказы</Button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        ['Новые заявки', '1', 'ответить до 18:00', 'pub_orders', 'Открыть заявки', 'blue'],
        ['В работе', '3', 'приняты редакцией', 'pub_orders', 'Перейти к заказам', 'green'],
        ['Ждут публикации', '2', 'ближайший дедлайн завтра', 'pub_publication', 'Загрузить ссылку', 'amber'],
        ['На приемке', '4', 'ожидают заказчика', 'pub_orders', 'Открыть приемку', 'indigo'],
        ['Жалобы', '1', 'нужны доказательства', 'pub_dispute_detail', 'Открыть спор', 'red'],
        ['Доступно к выводу', formatMoney(235000), 'после проверки реквизитов', 'pub_finance', 'Открыть выплаты', 'green'],
        ['Ожидает приемки', formatMoney(127500), 'начислится после принятия', 'pub_orders', 'Заказы на приемке', 'gray'],
        ['Удержания', formatMoney(52000), 'по жалобе #C-020', 'pub_sanctions', 'Проверить удержания', 'red'],
      ].map(([label, value, note, target, action, color]) => (
        <Card key={label} className="p-5">
          <h3 className="text-xs font-medium text-[#476788] uppercase tracking-wider mb-2">{label}</h3>
          <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{value}</div>
          <div className="mt-2 text-xs text-[#476788]">{note}</div>
          <button
            className={`mt-4 inline-flex items-center text-sm font-medium ${color === 'gray' ? 'text-[#476788] hover:text-[#0b3558]' : 'text-[#006bff] hover:text-[#004eba]'}`}
            onClick={() => navigate(target)}
          >
            {action}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </Card>
      ))}
    </div>

    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb]">
        <h2 className="font-display text-lg font-bold text-[#0b3558]">Что требуется сейчас</h2>
        <p className="text-sm text-[#476788] mt-1">Только реальные задачи, которые сейчас блокируют движение заказа или выплаты.</p>
      </div>
      <div className="divide-y divide-[#d4e0ed]">
        {[
          ['#1048', 'Новая заявка', 'Принять или отклонить заявку', 'до 18:00 сегодня', 'pub_order_detail', 'Рассмотреть'],
          ['#1054', 'Маркировка', 'Подтвердить ответственность за маркировку', 'до публикации', 'pub_order_detail', 'Подтвердить'],
          ['#1045', 'Публикация', 'Загрузить ссылку и скриншот', 'до 20.10', 'pub_publication', 'Загрузить'],
          ['#1055', 'Жалоба', 'Предоставить доказательства по спору', '24 часа', 'pub_dispute_detail', 'Открыть спор'],
        ].map(([order, type, task, deadline, target, action]) => (
          <button key={order} className="w-full px-6 py-4 text-left hover:bg-[#f8f9fb] flex flex-col lg:flex-row lg:items-center gap-3" onClick={() => navigate(target)}>
            <div className="lg:w-24 text-sm font-semibold text-[#0b3558]">{order}</div>
            <div className="lg:w-36"><Badge color={type === 'Жалоба' ? 'red' : type === 'Публикация' ? 'amber' : 'blue'}>{type}</Badge></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#0b3558]">{task}</div>
              <div className="text-xs text-[#476788] mt-1">Дедлайн: {deadline}</div>
            </div>
            <div className="text-sm font-medium text-[#006bff]">{action}</div>
          </button>
        ))}
      </div>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4">Выплаты</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-[#476788]">Доступно</span><span className="font-semibold">{formatMoney(235000)}</span></div>
          <div className="flex justify-between"><span className="text-[#476788]">На выводе</span><span>{formatMoney(180000)}</span></div>
          <div className="flex justify-between"><span className="text-[#476788]">Ближайшая дата</span><span>01.11</span></div>
        </div>
        <Button variant="secondary" className="w-full mt-5" onClick={() => navigate('pub_finance')}>Открыть выплаты</Button>
      </Card>
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4">Площадки</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-[#476788]">Активные</span><span className="font-semibold">1</span></div>
          <div className="flex justify-between"><span className="text-[#476788]">На проверке</span><span>1</span></div>
          <div className="flex justify-between"><span className="text-[#476788]">Требуют правок</span><span>1</span></div>
        </div>
        <Button variant="secondary" className="w-full mt-5" onClick={() => navigate('pub_platforms')}>Мои площадки</Button>
      </Card>
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4">Риски</h3>
        <div className="rounded-lg bg-red-50 border border-red-100 p-4">
          <Badge color="red">удержание</Badge>
          <p className="text-sm text-red-800 mt-3">По заказу #1055 проверяется удаление публикации раньше срока хранения.</p>
        </div>
        <Button variant="secondary" className="w-full mt-5" onClick={() => navigate('pub_sanctions')}>Проверить</Button>
      </Card>
    </div>

    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb]">
        <h3 className="text-base font-semibold text-[#0b3558]">Последние входящие заказы</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Заказ / дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Материал</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Формат</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Начисление</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Статус</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#476788] uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#d4e0ed]">
            {mockOrdersPublisher.slice(0, 4).map((order) => (
              <tr key={order.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('pub_order_detail')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#0b3558]">#{order.id}</div>
                  <div className="text-xs text-[#476788] mt-0.5 tabular-nums">{order.date}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-[#0b3558] font-medium truncate max-w-[240px]">{order.material}</div>
                  <div className="text-xs text-[#476788] truncate max-w-[240px]">{order.advertiser}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#476788]">{order.format}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0b3558] tabular-nums">{formatMoney(order.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap"><Badge color={order.statusColor}>{order.status}</Badge></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[#006bff] font-medium">Открыть</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const PublisherOrdersView = ({ navigate }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Ваши заказы</h1>
        <p className="text-sm text-[#476788] mt-1">Список рабочих заказов с быстрым фильтром по текущему статусу.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[
        ['Новые заявки', '1', 'blue'],
        ['В работе', '2', 'amber'],
        ['На приемке', '1', 'indigo'],
        ['Со спором', '1', 'red'],
      ].map(([label, value, color]) => (
        <Card key={label} className="p-5">
          <div className="text-xs font-medium uppercase text-[#476788]">{label}</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{value}</div>
            <Badge color={color}>{label}</Badge>
          </div>
        </Card>
      ))}
    </div>
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <CustomSelect options={['Все заказы', 'Новые заявки', 'В работе', 'Ждут публикации', 'На приемке', 'С жалобой']} />
        <CustomSelect options={['Все площадки', 'РБК Инвестиции', 'РБК Телеграм']} />
        <CustomSelect options={['Любой дедлайн', 'Сегодня', 'Просрочено', 'На неделе']} />
        <input className="border border-[#476788] rounded-lg px-3 py-2 text-sm" placeholder="Поиск по номеру или материалу" />
      </div>
    </Card>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]">
            <tr>
              {['Номер заказа', 'Материал', 'Рекламодатель / объект', 'Формат', 'Дедлайн ответа', 'Дедлайн публикации', 'Начисление', 'Статус', 'Что требуется', 'Действие'].map((head) => (
                <th key={head} className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase whitespace-nowrap">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d4e0ed]">
            {mockOrdersPublisher.map((order, index) => (
              <tr key={order.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('pub_order_detail')}>
                <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">#{order.id}</td>
                <td className="px-6 py-4 text-sm text-[#476788] min-w-[220px]">{order.material}</td>
                <td className="px-6 py-4 text-sm text-[#476788] min-w-[180px]">{order.advertiser}<div className="text-xs text-[#a6bbd1] mt-1">облачная платформа аналитики</div></td>
                <td className="px-6 py-4 text-sm text-[#476788] whitespace-nowrap">{order.format}</td>
                <td className="px-6 py-4 text-sm text-[#476788] whitespace-nowrap">{index === 4 ? 'истек' : '8 часов'}</td>
                <td className="px-6 py-4 text-sm text-[#476788] whitespace-nowrap">20.10.2023</td>
                <td className="px-6 py-4 text-sm font-semibold text-[#0b3558] whitespace-nowrap">{formatMoney(order.price)}</td>
                <td className="px-6 py-4 whitespace-nowrap"><Badge color={order.statusColor}>{order.status}</Badge></td>
                <td className="px-6 py-4 text-sm text-[#476788] whitespace-nowrap">{index === 0 ? 'Загрузить ссылку' : index === 1 ? 'Принять / отклонить' : index === 3 ? 'Подтвердить маркировку' : index === 4 ? 'Ответить на жалобу' : 'Открыть'}</td>
                <td className="px-6 py-4 text-sm text-[#006bff] font-medium whitespace-nowrap">Открыть</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const PublisherOrderDetailView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex items-center gap-2 text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('pub_orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          Заказ #1045
          <Badge color="amber">Ожидает публикации</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Площадка: РБК Инвестиции · публикация до 20.10.2023</p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-sm text-[#476788]">К начислению</div>
        <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(127500)}</div>
      </div>
    </div>

    <div className="bg-white border border-[#d4e0ed] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-12 h-12 bg-[#f8f9fb] rounded-full flex items-center justify-center border border-[#d4e0ed] flex-shrink-0">
          <Clock className="w-6 h-6 text-[#006bff]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#0b3558]">Заказ принят в работу</h3>
          <p className="text-sm text-[#476788] mt-1 mb-5">
            Проверьте материал, юридические данные рекламодателя и требования к публикации. После размещения отправьте ссылку и подтверждение хранения заказчику.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => navigate('pub_publication')}>Отправить ссылку</Button>
            <Button variant="secondary" onClick={() => navigate('pub_revision_request')}>Запросить правки</Button>
            <Button variant="secondary" onClick={() => navigate('pub_order_chat')}>Чат заказа</Button>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Состав заказа</h3>
          <div className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-[#476788]">Материал</div>
                <div className="mt-1 text-lg font-semibold text-[#0b3558]">Пресс-релиз: Запуск новой платформы</div>
                <p className="mt-2 text-sm leading-6 text-[#476788]">
                  Статья для РБК Инвестиции, публикация от редакции. Ответ 8 часов, дедлайн публикации до 20.10.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:w-[420px] gap-3 text-sm">
                {[
                  ['Площадка', 'РБК Инвестиции'],
                  ['Формат', 'Статья'],
                  ['Начисление', formatMoney(127500)],
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
              <p className="text-xs text-[#476788] mt-1">Контакты скрыты. Для работы доступны только реквизиты рекламодателя и объекта рекламы.</p>
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

          <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
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

          <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
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

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Материал</h3>
          <FullMaterialPreview context="publisher" />
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Публикация</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3"><span className="text-[#476788]">Статус</span><span className="font-medium text-[#0b3558]">ожидает ссылки</span></div>
            <div className="flex justify-between gap-3"><span className="text-[#476788]">Дедлайн</span><span>20.10.2023</span></div>
            <div className="flex justify-between gap-3"><span className="text-[#476788]">Хранение</span><span>минимум 2 года</span></div>
          </div>
          <Button variant="primary" className="w-full mt-5" onClick={() => navigate('pub_publication')}>Загрузить публикацию</Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Финансы</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-[#476788]">Начисление</span><span className="font-semibold text-[#0b3558]">{formatMoney(127500)}</span></div>
            <div className="flex justify-between"><span className="text-[#476788]">Статус</span><span>после приемки</span></div>
            <div className="flex justify-between"><span className="text-[#476788]">Выплата</span><span>в ближайший период</span></div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Таймлайн</h3>
          <div className="space-y-4">
            {[
              ['Заказ поступил', '18.10, 10:15', 'done'],
              ['Площадка приняла заказ', '18.10, 11:40', 'done'],
              ['Ожидается публикация', 'до 20.10', 'current'],
              ['Приемка заказчиком', 'после отправки ссылки', 'next'],
            ].map(([state, time, status]) => (
              <div key={`${state}-${time}`} className="flex items-start gap-3">
                {status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> : status === 'current' ? <Clock className="w-4 h-4 text-amber-500 mt-0.5" /> : <div className="w-4 h-4 rounded-full border-2 border-[#d4e0ed] mt-0.5" />}
                <div>
                  <div className="text-sm font-medium text-[#0b3558]">{state}</div>
                  <div className="text-xs text-[#476788] mt-1">{time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);

const PublisherRevisionRequestView = ({ navigate }) => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_order_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К заказу
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Запрос правок</h1>
      <p className="text-sm text-[#476788] mt-1">Сценарий запроса новой версии материала у заказчика.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Причина запроса</span><CustomSelect className="mt-2" options={['Не соответствует редакционной политике', 'Нужны уточнения по маркировке', 'Требуется заменить фрагмент']} /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Фрагмент / файл</span><CustomSelect className="mt-2" options={['материал версия 2 с правками', 'Абзац 3', 'Архив изображений']} /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Обязательный комментарий</span><textarea className="mt-2 w-full min-h-[150px] border border-[#476788] rounded-lg px-4 py-3 text-sm" defaultValue="Укажите конкретно, какие фрагменты нужно изменить и почему без этого публикация невозможна." /></label>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        После отправки заказчик получит запрос правок в карточке заказа. Дедлайн публикации будет приостановлен до загрузки новой версии.
      </div>
      <div className="mt-6 flex justify-end"><Button variant="primary">Отправить запрос правок</Button></div>
    </Card>
  </div>
);

const PublisherPlatformsView = ({ navigate }) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Мои площадки</h1>
        <p className="text-sm text-[#476788] mt-1">Список площадок, статусы модерации и переход к карточке редактирования.</p>
      </div>
      <Button variant="primary" onClick={() => navigate('pub_platform_new')}><Plus className="w-4 h-4 mr-2" /> Добавить площадку</Button>
    </div>
    <Card className="overflow-hidden">
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]"><tr>{['Название', 'Тип', 'Тематика', 'Регион', 'Форматы', 'Цена', 'Сроки', 'Статус'].map(head => <th key={head} className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">{head}</th>)}</tr></thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {publisherPlatforms.map((platform) => (
            <tr key={platform.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('pub_platform_detail')}>
              <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{platform.name}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.type}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.theme}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.region}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.formats}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.price}</td>
              <td className="px-6 py-4 text-sm text-[#476788]">{platform.answer} / {platform.publication}</td>
              <td className="px-6 py-4"><Badge color={platform.color}>{platform.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const PublisherPlatformDetailView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_platforms')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К площадкам
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Карточка площадки</h1>
        <p className="text-sm text-[#476788] mt-1">Редактирование данных, которые видит заказчик после модерации.</p>
      </div>
      <Badge color="green">Активна</Badge>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Название</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="РБК Инвестиции" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Тип площадки</span><CustomSelect className="mt-2" options={['СМИ', 'ТГ-канал', 'Паблик ВК']} /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Тематика</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Финансы, инвестиции, бизнес" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Регион</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Федеральная" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Форматы размещения</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Статья, новость, интервью" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Цены по форматам</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Статья 150 000 ₽, новость 95 000 ₽" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Срок ответа</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="8 часов" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Срок публикации</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="2 рабочих дня" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Минимальный срок хранения</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="2 года" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Метрики</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="2,5 млн посещений / месяц, Google News, Дзен" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Контакт ответственного</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Редакция, publisher@example.ru" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Реквизиты выплат</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="ООО Редакция, р/с **** 4432" /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Требования к материалам</span><textarea className="mt-2 w-full min-h-[120px] border border-[#476788] rounded-lg px-4 py-3 text-sm" defaultValue="Не принимаем запрещенные тематики, материалы без рекламодателя и публикации с внешними контактами." /></label>
      </div>
      <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
        Последние изменения карточки приняты модерацией. Новые правки можно сохранить как черновик или отправить на проверку.
      </div>
      <div className="mt-6 flex justify-end gap-3"><Button variant="secondary">Сохранить черновик</Button><Button variant="primary">Отправить на проверку</Button></div>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4">Публичная карточка</h3>
        <div className="rounded-2xl border border-[#d4e0ed] p-4">
          <div className="w-10 h-10 rounded-lg bg-[#0b3558] text-white flex items-center justify-center font-bold">Р</div>
          <div className="mt-3 text-sm font-semibold text-[#0b3558]">РБК Инвестиции</div>
          <div className="text-xs text-[#476788] mt-1">СМИ · Финансы · федеральная</div>
          <div className="mt-3 flex flex-wrap gap-1.5"><Badge color="green">активна</Badge><Badge color="blue">Google News</Badge><Badge color="gray">2 года</Badge></div>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4">Проверка админом</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-[#476788]">Последняя проверка</span><span>18.10.2023</span></div>
          <div className="flex justify-between"><span className="text-[#476788]">Изменения</span><Badge color="green">приняты</Badge></div>
          <div className="flex justify-between"><span className="text-[#476788]">В каталоге</span><span>да</span></div>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-base font-semibold text-[#0b3558] mb-4">Доступность заказов</h3>
        <p className="text-sm text-[#476788]">Площадка получает новые заявки только если карточка активна, цены заполнены, срок хранения не меньше 2 лет и реквизиты выплат указаны.</p>
      </Card>
    </div>
  </div>
);

const PublisherPlatformNewView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_platforms')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К площадкам
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Добавление новой площадки</h1>
      <p className="text-sm text-[#476788] mt-1">После отправки карточка уйдет на модерацию. До принятия она не видна заказчикам.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Название площадки</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" placeholder="Например, РБК Инвестиции" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Тип</span><CustomSelect className="mt-2" options={['СМИ', 'ТГ-канал', 'Паблик ВК']} /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Тематика</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" placeholder="Финансы, бизнес, ИТ" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Регион</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" placeholder="Федеральная, Москва, регионы" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Форматы и цены</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" placeholder="Статья 150 000 ₽, пост 60 000 ₽" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Сроки</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" placeholder="Ответ 8 часов, публикация 2 дня" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Минимальный срок хранения</span><CustomSelect className="mt-2" options={['2 года', 'Бессрочно']} /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Метрики</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" placeholder="Посещаемость, подписчики, вовлеченность, агрегаторы" /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Требования к материалам</span><textarea className="mt-2 w-full min-h-[120px] border border-[#476788] rounded-lg px-4 py-3 text-sm" placeholder="Какие тематики и форматы редакция не принимает" /></label>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary">Сохранить черновик</Button>
        <Button variant="primary">Отправить на модерацию</Button>
      </div>
    </Card>
  </div>
);

const PublisherPublicationView = () => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Загрузка публикации</h1>
    <Card className="p-4 border-emerald-200 bg-emerald-50/40">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-emerald-950">Маркировка подтверждена</div>
          <p className="text-sm text-emerald-800 mt-1">Форма загрузки публикации доступна. Ссылка и скриншот обязательны для отправки заказчику.</p>
        </div>
      </div>
    </Card>
    <Card className="p-6">
      <h2 className="font-display text-lg font-bold text-[#0b3558] mb-4">Заказ #1045 · ссылка и подтверждение хранения</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Ссылка на публикацию</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="https://invest.rbc.ru/news/652a9f" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Дата публикации</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="18.10.2023" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Срок хранения</span><CustomSelect className="mt-2" options={['Без планового удаления, минимум 2 года']} /></label>
          <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Скриншот</span><div className="mt-2 border border-[#d4e0ed] rounded-lg p-6 text-sm text-[#166534] bg-[#f8f9fb]">скриншот публикации загружен</div></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Комментарий</span><textarea className="mt-2 w-full min-h-[100px] border border-[#476788] rounded-lg px-4 py-3 text-sm" defaultValue="Комментарий редакции для заказчика: ссылка опубликована, скриншот приложен." /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Метрики, если есть</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Первые просмотры появятся через 24 часа" /></label>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        Перед отправкой площадка подтверждает, что идентификатор рекламы и маркировка оформлены на ее стороне. Платформа идентификатор рекламы не хранит.
      </div>
      <div className="mt-6 flex justify-end"><Button variant="primary">Отправить ссылку заказчику</Button></div>
    </Card>
  </div>
);

const PublisherFinanceView = () => (
  <div className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card className="p-6">
      <h1 className="font-display text-sm font-medium text-[#476788] mb-2">Доступно к выводу</h1>
      <div className="text-4xl font-semibold text-[#0b3558]">{formatMoney(235000)}</div>
      <div className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-[#476788]">Начислено</span><span className="text-[#0b3558]">{formatMoney(684000)}</span></div>
        <div className="flex justify-between"><span className="text-[#476788]">Ожидает приемки</span><span className="text-[#0b3558]">{formatMoney(127500)}</span></div>
        <div className="flex justify-between"><span className="text-[#476788]">Комиссия вывода 15%</span><span className="text-[#0b3558]">{formatMoney(35250)}</span></div>
        <div className="flex justify-between"><span className="text-[#476788]">К получению</span><span className="text-[#0b3558]">{formatMoney(199750)}</span></div>
        <div className="flex justify-between"><span className="text-[#a6bbd1]">Ближайшая выплата</span><span>01.11.2023</span></div>
      </div>
      <Button variant="primary" className="w-full mt-8" disabled>Реквизиты на проверке</Button>
    </Card>
    <Card className="p-6 lg:col-span-2">
      <h2 className="font-display text-lg font-bold text-[#0b3558] mb-4">История выплат</h2>
      <div className="space-y-3">
        {['01.10 · выплата 430 000 ₽', '01.09 · выплата 386 000 ₽', '12.08 · удержание по спору 52 000 ₽'].map(item => (
          <div key={item} className="p-4 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] text-sm text-[#476788]">{item}</div>
        ))}
      </div>
    </Card>
  </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">На выводе</div><div className="mt-2 text-xl font-semibold">{formatMoney(180000)}</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Удержано</div><div className="mt-2 text-xl font-semibold text-red-600">{formatMoney(52000)}</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Комиссия вывода</div><div className="mt-2 text-xl font-semibold">15%</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Минимум вывода</div><div className="mt-2 text-xl font-semibold">{formatMoney(10000)}</div></Card>
    </div>
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
        <div>
          <h2 className="font-display text-base font-bold text-[#0b3558]">Реквизиты для выплаты</h2>
          <p className="text-sm text-[#476788] mt-1">Используются для вывода средств площадке. Пока реквизиты на проверке, запрос выплаты недоступен.</p>
        </div>
        <Badge color="blue">на проверке</Badge>
      </div>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {[
          ['Получатель', 'ООО "Редакция РБК"'],
          ['ИНН', '7700001111'],
          ['КПП', '770001001'],
          ['Банк', 'АО "Банк"'],
          ['Расчетный счет', '40702810900000004432'],
          ['БИК', '044525000'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] px-3 py-2">
            <div className="text-xs text-[#476788]">{label}</div>
            <div className="font-medium text-[#0b3558] mt-1">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end"><Button variant="secondary">Изменить реквизиты</Button></div>
    </Card>
    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb]"><h2 className="font-display text-base font-bold text-[#0b3558]">Заказы-основания</h2></div>
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <tbody className="divide-y divide-[#d4e0ed]">
          {mockOrdersPublisher.slice(0, 4).map(order => <tr key={order.id}><td className="px-6 py-4 text-sm font-medium">#{order.id}</td><td className="px-6 py-4 text-sm text-[#476788]">{order.material}</td><td className="px-6 py-4 text-sm font-semibold">{formatMoney(order.price)}</td><td className="px-6 py-4"><Badge color={order.statusColor}>{order.status}</Badge></td></tr>)}
        </tbody>
      </table>
    </Card>
  </div>
);

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
              <td className="px-5 py-4 text-sm text-[#006bff] max-w-[180px]">Скриншот, веб-архив</td>
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
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_order_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К заказу
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Жалоба заказчика</h1>
      <p className="text-sm text-[#476788] mt-1">Реакция площадки на спор, доказательства и заморозка выплаты до решения.</p>
    </div>
    <Card className="p-4 border-red-200 bg-red-50/40">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-red-950">Ожидается ответ площадки</div>
          <p className="text-sm text-red-800 mt-1">До решения спора выплата по заказу заморожена. Нужно отправить комментарий и доказательства.</p>
        </div>
      </div>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Ответ площадки</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="block"><span className="text-sm font-medium text-[#476788]">Заказ</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="#1055 · Кейс внедрения системы управления клиентами" /></label>
          <label className="block"><span className="text-sm font-medium text-[#476788]">Причина жалобы</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="Нарушен формат публикации" /></label>
          <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Комментарий площадки</span><textarea className="mt-2 w-full min-h-[130px] border border-[#476788] rounded-lg px-4 py-3 text-sm" defaultValue="Опишите позицию редакции и приложите доказательства: ссылка, скриншот, архив страницы, переписка." /></label>
          <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Доказательства</span><div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">Загрузить скриншоты, веб-архив, исходные файлы</div></label>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate('pub_dispute_detail')}>Открыть спор</Button>
          <Button variant="secondary">Дождаться решения</Button>
          <Button variant="primary">Отправить доказательства</Button>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Действия</h2>
        {[
          ['Открыть страницу спора', 'pub_dispute_detail'],
          ['Посмотреть причину', 'pub_dispute_detail'],
          ['Открыть доказательства заказчика', 'pub_dispute_detail'],
          ['Загрузить доказательства', 'pub_complaint'],
          ['Отправить комментарий', 'pub_complaint'],
          ['Дождаться решения', 'pub_dispute_detail'],
        ].map(([action, target]) => <button key={action} className="w-full text-left py-2 text-sm text-[#006bff] border-b border-[#d4e0ed]" onClick={() => navigate(target)}>{action}</button>)}
      </Card>
    </div>
  </div>
);

const PublisherPayoutRequestView = ({ navigate }) => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('pub_finance')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К выплатам
    </button>
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Запрос выплаты</h1>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block"><span className="text-sm font-medium text-[#476788]">Сумма к выводу</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="235 000 ₽" /></label>
        <label className="block"><span className="text-sm font-medium text-[#476788]">Доступная сумма</span><input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="235 000 ₽" /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Реквизиты</span><CustomSelect className="mt-2" options={['ООО Редакция, р/с **** 4432 · на проверке', 'Добавить реквизиты']} /></label>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">Комиссия вывода 15%</div><div className="mt-1 text-xl font-semibold">{formatMoney(35250)}</div></Card>
        <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">К получению</div><div className="mt-1 text-xl font-semibold">{formatMoney(199750)}</div></Card>
        <Card className="p-5 bg-[#f8f9fb]"><div className="text-xs text-[#476788]">Статус</div><div className="mt-1 text-sm font-semibold text-[#0b3558]">форма доступна</div></Card>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        Реквизиты находятся на проверке, поэтому запрос можно подготовить, но отправка станет доступна после подтверждения реквизитов.
      </div>
      <div className="mt-6 flex justify-end"><Button variant="primary" disabled>Дождаться проверки реквизитов</Button></div>
    </Card>
  </div>
);

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
        <p className="text-sm text-[#476788] mt-1">{description}</p>
      </div>
    </div>
    {children}
  </Card>
);

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

const ClientSettingsView = () => {
  const [payerStatus, setPayerStatus] = useState('Юридическое лицо');
  const isLegalEntity = payerStatus === 'Юридическое лицо';
  const legalDocumentsSection = (
    <SettingsSection title="Юридические данные и документы" description="Используются в счетах, отчетах и проверках рекламодателя для маркировки." icon={FileText}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        <SettingField label="Статус плательщика" className="min-w-0">
          <CustomSelect
            className="mt-2"
            options={['Юридическое лицо', 'Физическое лицо']}
            value={payerStatus}
            onChange={setPayerStatus}
          />
        </SettingField>

        {isLegalEntity ? (
          <React.Fragment key="legal-entity-fields">
            <SettingField label="ИНН" className="min-w-0"><input className={settingInputClass} defaultValue="7700000000" /></SettingField>
            <SettingField label="КПП" className="min-w-0"><input className={settingInputClass} defaultValue="770001001" /></SettingField>
            <SettingField label="ОГРН" className="min-w-0"><input className={settingInputClass} defaultValue="1237700000000" /></SettingField>
            <SettingField label="НДС" className="min-w-0"><CustomSelect className="mt-2" options={['20%', 'Без НДС', 'УСН']} /></SettingField>
            <SettingField label="Юридический адрес" className="md:col-span-2 min-w-0"><input className={settingInputClass} defaultValue="125009, Москва, ул. Тверская, 1" /></SettingField>
            <SettingField label="Документооборот" className="min-w-0"><CustomSelect className="mt-2" options={['ЭДО: Диадок', 'ЭДО: СБИС', 'Бумажные оригиналы']} /></SettingField>
            <SettingField label="Идентификатор оператора ЭДО" className="min-w-0"><input className={settingInputClass} defaultValue="2BM-7700000000-770001001-2024010100000000000000000" /></SettingField>
          </React.Fragment>
        ) : (
          <React.Fragment key="individual-fields">
            <SettingField label="ФИО" className="min-w-0"><input className={settingInputClass} defaultValue="Александр Сергеевич Иванов" /></SettingField>
            <SettingField label="ИНН физлица" className="min-w-0"><input className={settingInputClass} defaultValue="770000000000" /></SettingField>
            <SettingField label="Дата рождения" className="min-w-0"><input className={settingInputClass} defaultValue="12.04.1988" /></SettingField>
            <SettingField label="СНИЛС" className="min-w-0"><input className={settingInputClass} defaultValue="123-456-789 00" /></SettingField>
            <SettingField label="Паспортные данные" className="md:col-span-2 min-w-0"><input className={settingInputClass} defaultValue="4510 123456, выдан ОМВД России по г. Москве 12.05.2010" /></SettingField>
            <SettingField label="Адрес регистрации" className="md:col-span-2 min-w-0"><input className={settingInputClass} defaultValue="125009, Москва, ул. Тверская, 1, кв. 10" /></SettingField>
            <SettingField label="Документооборот" className="min-w-0"><CustomSelect className="mt-2" options={['Электронная подпись', 'Бумажные оригиналы', 'Через представителя']} /></SettingField>
            <SettingField label="Налоговый статус" className="min-w-0"><CustomSelect className="mt-2" options={['Физическое лицо', 'Самозанятый', 'ИП']} /></SettingField>
          </React.Fragment>
        )}
      </div>
      <div className="mt-6 rounded-lg border border-dashed border-[#0b3558] p-5 text-sm leading-6 text-[#476788] bg-[#f8f9fb]">
        {isLegalEntity
          ? 'Юрлицо заполняет реквизиты компании, налоговый режим и параметры ЭДО для счетов, отчетов и договоров.'
          : 'Физлицо заполняет паспортные данные и адрес регистрации, чтобы платформа могла подготовить договор и закрывающие документы.'}
      </div>
      <div className="mt-6 flex justify-end"><Button variant="primary">Сохранить документы</Button></div>
    </SettingsSection>
  );

  return (
  <div className="space-y-6 max-w-6xl">
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки заказчика</h1>
      <p className="text-sm text-[#476788] mt-1">Профиль компании, безопасность, уведомления и данные для финансовых документов.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SettingsSection title="Профиль аккаунта" description="Эти данные видят только команда платформы и ваши сотрудники." icon={Briefcase}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingField label="Название компании"><input className={settingInputClass} defaultValue="ООО Финтех Решения" /></SettingField>
            <SettingField label="Ответственный"><input className={settingInputClass} defaultValue="Анна Морозова" /></SettingField>
            <SettingField label="Рабочий почта"><input className={settingInputClass} defaultValue="client@example.ru" /></SettingField>
            <SettingField label="Телефон"><input className={settingInputClass} defaultValue="+7 495 000-00-00" /></SettingField>
	            <SettingField label="Часовой пояс"><CustomSelect options={['Москва, UTC+3', 'Екатеринбург, UTC+5', 'Новосибирск, UTC+7']} /></SettingField>
	            <SettingField label="Язык интерфейса"><CustomSelect options={['Русский', 'English']} /></SettingField>
          </div>
          <div className="mt-6 flex justify-end"><Button variant="primary">Сохранить профиль</Button></div>
        </SettingsSection>

        <SettingsSection title="Безопасность" description="Смена пароля, двухфакторная защита и контроль активных сессий." icon={Lock}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingField label="Текущий пароль"><input type="password" className={settingInputClass} defaultValue="password" /></SettingField>
            <SettingField label="Новый пароль"><input type="password" className={settingInputClass} placeholder="Минимум 12 символов" /></SettingField>
            <SettingField label="Подтверждение пароля"><input type="password" className={settingInputClass} placeholder="Повторите новый пароль" /></SettingField>
	            <SettingField label="Двухфакторная защита"><CustomSelect options={['Включена: код на почту', 'Включить приложение-аутентификатор', 'Отключена']} /></SettingField>
          </div>
          <div className="mt-5 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-[#0b3558]">Активная сессия: Chrome, macOS</div>
                <div className="text-xs text-[#476788] mt-1">Последняя активность сегодня, 12:44 · Москва</div>
              </div>
              <Button variant="secondary" className="text-xs py-1.5 px-3">Завершить другие сессии</Button>
            </div>
          </div>
          <div className="mt-6 flex justify-end"><Button variant="primary">Обновить безопасность</Button></div>
        </SettingsSection>

        {legalDocumentsSection}
      </div>

      <div className="space-y-6">
        <SettingsSection title="Уведомления" description="Выберите события и каналы доставки." icon={Bell}>
          <div className="space-y-3">
            {[
              ['Публикация загружена площадкой', true, true],
              ['Площадка запросила правки', true, false],
              ['Баланс ниже лимита', true, true],
              ['Новый документ или отчет', true, false],
              ['Открыта жалоба или спор', true, true],
            ].map(([label, email, telegram]) => (
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
          <Button variant="secondary" className="w-full mt-4">Сохранить</Button>
        </SettingsSection>

        <SettingsSection title="Доступы команды" description="Кто может загружать материалы, пополнять баланс и принимать размещения." icon={ShieldCheck}>
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-sm font-semibold text-[#0b3558]">Пригласить по email</div>
            <div className="mt-3 space-y-3">
              <input className="w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="name@company.ru" />
              <CustomSelect options={['Роль: материалы', 'Роль: финансы', 'Роль: приемка размещений', 'Роль: администратор']} />
              <Button variant="primary" className="w-full"><Plus className="w-4 h-4 mr-2" /> Отправить приглашение</Button>
            </div>
            <p className="text-xs text-[#476788] mt-3">Сотрудник получит письмо со ссылкой для входа и создания пароля.</p>
          </div>
          <div className="mt-5 space-y-3">
            {[
              ['Анна Морозова', 'anna@fintech.ru', 'Владелец', 'активен', 'green'],
              ['Пиар-менеджер', 'pr@fintech.ru', 'Материалы', 'активен', 'green'],
              ['Бухгалтерия', 'finance@fintech.ru', 'Финансы', 'приглашение отправлено', 'amber'],
            ].map(([name, email, role, status, color]) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-[#d4e0ed] p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#0b3558]">{name}</div>
                  <div className="text-xs text-[#476788] mt-1 truncate">{email}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge color={color}>{status}</Badge>
                  <CustomSelect className="w-36" options={[role, 'Только просмотр', 'Без доступа']} />
                </div>
              </div>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection title="Лимиты и согласования" description="Защита от случайной заморозки крупных сумм." icon={CreditCard}>
          <div className="space-y-4">
            <SettingField label="Лимит заказа без согласования"><input className={settingInputClass} defaultValue="100 000 ₽" /></SettingField>
            <SettingField label="Автоприемка"><CustomSelect options={['Выключена', 'Через 72 часа без жалобы']} /></SettingField>
          </div>
          <Button variant="primary" className="w-full mt-5">Сохранить лимиты</Button>
        </SettingsSection>
      </div>
    </div>
  </div>
  );
};

const PublisherSettingsView = () => (
  <div className="space-y-6 max-w-6xl">
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки площадки</h1>
      <p className="text-sm text-[#476788] mt-1">Профиль редакции, безопасность, выплаты, уведомления и правила обработки заказов.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SettingsSection title="Профиль редакции" description="Данные аккаунта владельца площадок и основного контактного лица." icon={Store}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingField label="Юридическое название"><input className={settingInputClass} defaultValue="ООО Редакция" /></SettingField>
            <SettingField label="Ответственный редактор"><input className={settingInputClass} defaultValue="Редакция" /></SettingField>
            <SettingField label="Почта для заказов"><input className={settingInputClass} defaultValue="publisher@example.ru" /></SettingField>
            <SettingField label="Телефон"><input className={settingInputClass} defaultValue="+7 495 111-22-33" /></SettingField>
            <SettingField label="Рабочие часы"><input className={settingInputClass} defaultValue="Пн-Пт, 10:00-19:00" /></SettingField>
            <SettingField label="Автоответ при новых заявках"><CustomSelect className="mt-2" options={['Выключен', 'Включен: заявка получена']} /></SettingField>
          </div>
          <div className="mt-6 flex justify-end"><Button variant="primary">Сохранить профиль</Button></div>
        </SettingsSection>

        <SettingsSection title="Безопасность" description="Пароль, 2FA, сотрудники редакции и API-ключи для интеграций." icon={Lock}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingField label="Текущий пароль"><input type="password" className={settingInputClass} defaultValue="password" /></SettingField>
            <SettingField label="Новый пароль"><input type="password" className={settingInputClass} placeholder="Новый пароль" /></SettingField>
            <SettingField label="Двухфакторная защита"><CustomSelect className="mt-2" options={['Включена: почта', 'Приложение-аутентификатор', 'Отключена']} /></SettingField>
            <SettingField label="API-доступ"><CustomSelect className="mt-2" options={['Отключен', 'Только чтение заказов', 'Заказы и выплаты']} /></SettingField>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['Главный редактор', 'полный доступ'],
              ['Выпускающий редактор', 'заказы и чат'],
            ].map(([name, role]) => (
              <div key={name} className="rounded-lg border border-[#d4e0ed] p-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#0b3558]">{name}</span>
                <Badge color="gray">{role}</Badge>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="secondary">Добавить сотрудника</Button><Button variant="primary">Обновить безопасность</Button></div>
        </SettingsSection>

        <SettingsSection title="Реквизиты выплат" description="Сюда платформа перечисляет выплаты после приемки заказов и удержания комиссии 15%." icon={CreditCard}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingField label="Получатель"><input className={settingInputClass} defaultValue="ООО Редакция" /></SettingField>
            <SettingField label="ИНН"><input className={settingInputClass} defaultValue="7701000000" /></SettingField>
            <SettingField label="Расчетный счет"><input className={settingInputClass} defaultValue="40702810********4432" /></SettingField>
            <SettingField label="Банк"><input className={settingInputClass} defaultValue="АО Банк" /></SettingField>
            <SettingField label="БИК"><input className={settingInputClass} defaultValue="044525000" /></SettingField>
            <SettingField label="График выплат"><CustomSelect className="mt-2" options={['1 раз в месяц', '2 раза в месяц', 'По запросу после проверки']} /></SettingField>
          </div>
          <div className="mt-5 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[#0b3558]">Статус реквизитов: на проверке</div>
              <div className="text-xs text-[#476788] mt-1">До подтверждения можно готовить запрос выплаты, но нельзя отправить его в обработку.</div>
            </div>
            <Badge color="amber">проверка</Badge>
          </div>
          <div className="mt-6 flex justify-end"><Button variant="primary">Отправить реквизиты на проверку</Button></div>
        </SettingsSection>
      </div>

      <div className="space-y-6">
        <SettingsSection title="Уведомления" description="Новые заявки, дедлайны, споры и выплаты." icon={Bell}>
          <div className="space-y-4">
            {[
              ['Новая заявка', 'почта + Телеграм'],
              ['Дедлайн публикации сегодня', 'Телеграм'],
              ['Открыта жалоба', 'почта + SMS'],
              ['Выплата одобрена', 'почта'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3 pb-3 border-b border-[#d4e0ed]">
                <div className="text-sm text-[#0b3558]">{label}</div>
                <Badge color="gray">{value}</Badge>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full mt-5">Настроить каналы</Button>
        </SettingsSection>

        <SettingsSection title="Правила заказов" description="Как редакция принимает заявки и управляет публикацией." icon={ShieldCheck}>
          <div className="space-y-4">
            <SettingField label="Срок ответа на заявку"><CustomSelect className="mt-2" options={['8 часов', '24 часа', '2 рабочих дня']} /></SettingField>
            <SettingField label="Заявки в выходные"><CustomSelect className="mt-2" options={['Принимать, но считать дедлайн с понедельника', 'Не принимать']} /></SettingField>
            <SettingField label="Маркировка"><CustomSelect className="mt-2" options={['Площадка отвечает за идентификатор рекламы и ОРД', 'Только после проверки редактором']} /></SettingField>
          </div>
          <Button variant="primary" className="w-full mt-5">Сохранить правила</Button>
        </SettingsSection>

        <SettingsSection title="Документы" description="Договоры, отчеты и закрывающие документы площадки." icon={FileText}>
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
          <Button variant="secondary" className="w-full mt-4"><Download className="w-4 h-4 mr-2" /> Скачать архив</Button>
        </SettingsSection>
      </div>
    </div>
  </div>
);

const AdminDashboardView = () => (
  <div className="space-y-8">
    <h1 className="font-display text-2xl font-bold text-[#0b3558]">Админ-панель</h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Материалы</div><div className="text-2xl font-semibold mt-2">18</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Заказы в споре</div><div className="text-2xl font-semibold mt-2">7</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Заморожено</div><div className="text-2xl font-semibold mt-2">12,4 млн ₽</div></Card>
      <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Комиссия 15%</div><div className="text-2xl font-semibold mt-2">1,8 млн ₽</div></Card>
    </div>
    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb]"><h2 className="font-display text-base font-bold text-[#0b3558]">Операционная очередь</h2></div>
      <table className="min-w-full divide-y divide-[#d4e0ed]">
        <thead className="bg-[#f8f9fb]"><tr><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Номер</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Объект</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Риск</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th></tr></thead>
        <tbody className="divide-y divide-[#d4e0ed]">
          {mockAdminQueue.map(item => <tr key={item.id}><td className="px-6 py-4 text-sm font-medium">{item.id}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.object}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.type}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.risk}</td><td className="px-6 py-4"><Badge color={item.color}>{item.status}</Badge></td></tr>)}
        </tbody>
      </table>
    </Card>
  </div>
);

const AdminWorklistView = ({ section = 'admin_moderation', navigate }) => {
  const data = mockAdminSections[section] || mockAdminSections.admin_moderation;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">{data.title}</h1>
          <p className="text-sm text-[#476788] mt-1">Операционный раздел админки с отдельными действиями и подтверждениями.</p>
        </div>
        <Button variant="secondary"><Download className="w-4 h-4 mr-2" /> Экспорт</Button>
      </div>
      <Card className="overflow-hidden">
        <table className="min-w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]"><tr><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Номер / объект</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип / сумма</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Контекст</th><th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase">Действие</th></tr></thead>
          <tbody className="divide-y divide-[#d4e0ed]">
            {data.rows.map((row) => (
              <tr key={row.join('-')} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => section === 'admin_orders' && navigate('admin_order_detail')}>
                <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{row[0]}</td>
                <td className="px-6 py-4 text-sm text-[#476788]">{row[1]}</td>
                <td className="px-6 py-4"><Badge color={String(row[2]).includes('Удержание') || String(row[2]).includes('Риск') ? 'red' : 'blue'}>{row[2]}</Badge></td>
                <td className="px-6 py-4 text-sm text-[#476788]">{row[3]}</td>
                <td className="px-6 py-4 text-right text-sm text-[#006bff] font-medium">{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ConfirmAction title="Принять / отклонить" text="Модерация материала или площадки требует комментарий и подтверждение." action="Подтвердить" />
        <ConfirmAction title="Применить удержание" text="Удержание по жалобе применяется только после проверки доказательств." action="Подтвердить" />
        <ConfirmAction title="Подтвердить выплату" text="Подтверждение выплаты фиксирует операцию и меняет состояние на выплачено." action="Подтвердить" />
      </div>
      {section === 'admin_complaints' && <EmptyState title="Нет новых жалоб" text="Когда активных споров нет, раздел показывает пустое состояние и ссылку на архив." />}
    </div>
  );
};

const AdminOrderDetailView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К заказам
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Админ: заказ #1045</h1>
        <p className="text-sm text-[#476788] mt-1">Полная карточка заказа для контроля споров, финансов и публикации.</p>
      </div>
      <Badge color="indigo">Ожидает приемки</Badge>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Состав заказа</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><div className="text-[#476788]">Материал</div><div className="font-medium">Пресс-релиз: Запуск новой платформы</div></div>
          <div><div className="text-[#476788]">Площадка</div><div className="font-medium">РБК Инвестиции</div></div>
          <div><div className="text-[#476788]">Заказчик</div><div className="font-medium">Заказчик #842</div></div>
          <div><div className="text-[#476788]">Финансы</div><div className="font-medium">{formatMoney(150000)} заморожено</div></div>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Админские действия</h2>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full">Запросить доказательства</Button>
          <Button variant="secondary" className="w-full">Применить удержание</Button>
          <Button variant="primary" className="w-full">Закрыть спор</Button>
        </div>
      </Card>
    </div>
    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Материал на проверке</h2>
      <FullMaterialPreview context="admin" />
    </Card>
    <ConfirmAction title="Подтверждение действия" text="Отклонение заказа, удержание и ручное закрытие спора требуют подтверждения." action="Подтвердить действие" />
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  // Режим интерфейса: лендинг, заказчик, площадка, админка
  const [globalMode, setGlobalMode] = useState('landing');
  
  // Состояние кабинета заказчика
	  const [clientView, setClientView] = useState('dashboard');
	  const [favoritePlatforms, setFavoritePlatforms] = useState([101, 102]);
	  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Состояние кабинета площадки
  const [publisherView, setPublisherView] = useState('pub_dashboard');

  // Состояние админки
  const [adminView, setAdminView] = useState('admin_dashboard');

  const toggleFavoritePlatform = (id) => {
    setFavoritePlatforms((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    );
  };

  const clientNav = [
    { id: 'dashboard', label: 'Панель', icon: LayoutDashboard },
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
    { id: 'pub_finance', label: 'Выплаты', icon: CreditCard },
    { id: 'pub_sanctions', label: 'Санкции', icon: AlertCircle },
    { id: 'pub_settings', label: 'Настройки', icon: Settings },
  ];

  const adminNav = [
    { id: 'admin_dashboard', label: 'Панель', icon: LayoutDashboard },
    { id: 'admin_moderation', label: 'Модерация', icon: ShieldCheck },
    { id: 'admin_orders', label: 'Заказы', icon: Briefcase },
    { id: 'admin_users', label: 'Пользователи', icon: Settings },
    { id: 'admin_platforms', label: 'Площадки', icon: Store },
    { id: 'admin_balances', label: 'Балансы', icon: CreditCard },
    { id: 'admin_operations', label: 'Операции', icon: Download },
    { id: 'admin_complaints', label: 'Жалобы', icon: AlertCircle },
    { id: 'admin_payouts', label: 'Выплаты', icon: Download },
  ];

  // Логика маршрутизации
  if (globalMode === 'landing') {
    return <LandingView setGlobalMode={setGlobalMode} />;
  }

  const isClient = globalMode === 'client';
  const isAdmin = globalMode === 'admin';
  const navItems = isClient ? clientNav : isAdmin ? adminNav : publisherNav;
  const currentView = isClient ? clientView : isAdmin ? adminView : publisherView;
  const setView = isClient ? setClientView : isAdmin ? setAdminView : setPublisherView;

  const renderContent = () => {
    if (isClient) {
      switch (clientView) {
        case 'dashboard': return <ClientDashboardView navigate={setClientView} />;
        case 'materials': return <ClientMaterialsView navigate={setClientView} />;
        case 'material_detail': return <ClientMaterialDetailView navigate={setClientView} />;
        case 'create_material': return <ClientCreateMaterialView navigate={setClientView} />;
        case 'advertisers': return <ClientAdvertisersView navigate={setClientView} />;
        case 'advertiser_new': return <ClientAdvertiserNewView navigate={setClientView} />;
        case 'advertiser_detail': return <ClientAdvertiserDetailView navigate={setClientView} />;
        case 'advertiser_edit': return <ClientAdvertiserEditView navigate={setClientView} />;
        case 'catalog': return <ClientCatalogView favoritePlatforms={favoritePlatforms} toggleFavoritePlatform={toggleFavoritePlatform} navigate={setClientView} />;
        case 'platform_detail': return <ClientPlatformDetailView favoritePlatforms={favoritePlatforms} toggleFavoritePlatform={toggleFavoritePlatform} navigate={setClientView} />;
        case 'order_detail': return <ClientOrderDetailView navigate={setClientView} />;
        case 'complaint': return <ClientComplaintView navigate={setClientView} />;
        case 'dispute_detail': return <DisputeDetailView navigate={setClientView} />;
        case 'order_chat': return <OrderChatView navigate={setClientView} />;
        case 'report_detail': return <ClientReportDetailView navigate={setClientView} />;
        case 'orders': return <ClientOrdersView navigate={setClientView} />;
        case 'reports': return <ClientReportsView navigate={setClientView} />;
        case 'support': return <ClientSupportView navigate={setClientView} />;
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
        case 'pub_dashboard': return <PublisherDashboardView navigate={setPublisherView} />;
        case 'pub_orders': return <PublisherOrdersView navigate={setPublisherView} />;
        case 'pub_order_detail': return <PublisherOrderDetailView navigate={setPublisherView} />;
        case 'pub_order_chat': return <OrderChatView navigate={setPublisherView} role="publisher" />;
        case 'pub_revision_request': return <PublisherRevisionRequestView navigate={setPublisherView} />;
        case 'pub_platforms': return <PublisherPlatformsView navigate={setPublisherView} />;
        case 'pub_platform_new': return <PublisherPlatformNewView navigate={setPublisherView} />;
        case 'pub_platform_detail': return <PublisherPlatformDetailView navigate={setPublisherView} />;
        case 'pub_publication': return <PublisherPublicationView />;
        case 'pub_finance': return <PublisherFinanceView />;
        case 'pub_payout_request': return <PublisherPayoutRequestView navigate={setPublisherView} />;
        case 'pub_complaint': return <PublisherComplaintView navigate={setPublisherView} />;
        case 'pub_dispute_detail': return <DisputeDetailView navigate={setPublisherView} role="publisher" />;
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
      switch (adminView) {
        case 'admin_dashboard': return <AdminDashboardView />;
        case 'admin_moderation': return <AdminWorklistView section="admin_moderation" navigate={setAdminView} />;
        case 'admin_orders': return <AdminWorklistView section="admin_orders" navigate={setAdminView} />;
        case 'admin_order_detail': return <AdminOrderDetailView navigate={setAdminView} />;
        case 'admin_users': return <AdminWorklistView section="admin_users" navigate={setAdminView} />;
        case 'admin_platforms': return <AdminWorklistView section="admin_platforms" navigate={setAdminView} />;
        case 'admin_balances': return <AdminWorklistView section="admin_balances" navigate={setAdminView} />;
        case 'admin_operations': return <AdminWorklistView section="admin_operations" navigate={setAdminView} />;
        case 'admin_complaints': return <AdminWorklistView section="admin_complaints" navigate={setAdminView} />;
        case 'admin_payouts': return <AdminWorklistView section="admin_payouts" navigate={setAdminView} />;
        default: return <AdminDashboardView />;
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fb] font-sans text-[#0b3558] text-[90%]">
      {/* БОКОВАЯ НАВИГАЦИЯ */}
      <aside className="w-64 flex flex-col hidden md:flex flex-shrink-0 border-r border-[#d4e0ed] bg-white text-[#476788]">
        <div className="h-16 flex items-center px-6 border-b border-[#d4e0ed] cursor-pointer text-[#0b3558]" onClick={() => setGlobalMode('landing')}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[#0b3558]">
                <div className="w-3 h-3 border-2 rounded-sm border-white"></div>
            </div>
            <span className="font-display font-bold tracking-tight">Аксиома</span>
          </div>
          <span className="ml-2 text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-[#f8f9fb] text-[#476788]">{isClient ? 'Заказчик' : isAdmin ? 'Админ' : 'Площадка'}</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              let activeClass = '';
              let inactiveClass = '';
              
              activeClass = 'bg-[#f0f3f8] text-[#0b3558] font-medium shadow-[inset_0_0_0_1px_rgba(0,107,255,0.18)]';
              inactiveClass = 'hover:bg-[#f8f9fb] hover:text-[#0b3558]';

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${isActive ? activeClass : inactiveClass}`}
                >
                  <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-[#006bff]' : 'text-[#476788]'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-[#d4e0ed] bg-white">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0 bg-[#f8f9fb] text-[#476788]">
              {isClient ? 'А' : isAdmin ? 'М' : 'П'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-[#0b3558]">
                {isClient ? 'Александр С.' : isAdmin ? 'Модератор' : 'РБК Инвестиции'}
              </div>
              <div className="text-xs truncate text-[#476788]">
                {isClient ? 'ООО "Финтех"' : isAdmin ? 'Операционный доступ' : 'Площадка #842'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ОСНОВНАЯ ОБЛАСТЬ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 bg-white border-b border-[#d4e0ed] flex items-center justify-between px-6 flex-shrink-0 z-10">
           <div className="flex items-center text-sm">
            {isClient ? (
              <>
                <span className="text-[#476788] mr-2">Баланс:</span>
                <span className="font-semibold text-[#0b3558] tabular-nums">{formatMoney(1250000)}</span>
              </>
            ) : isAdmin ? (
              <>
                <span className="text-[#476788] mr-2">Очередь:</span>
                <span className="font-semibold text-[#006bff] tabular-nums">{mockAdminQueue.length} задачи</span>
              </>
            ) : (
              <>
                <span className="text-[#476788] mr-2">Площадка:</span>
                <span className="font-semibold text-[#0b3558]">РБК Инвестиции</span>
              </>
            )}
          </div>
	          <div className="flex items-center gap-3">
	             <button className="text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => setGlobalMode('landing')}>На сайт</button>
	             <div className="relative">
	               <button className="relative p-2 text-[#476788] hover:text-[#0b3558] transition-colors rounded-full hover:bg-[#f8f9fb]" onClick={() => setNotificationsOpen((value) => !value)}>
	                  <Bell className="w-5 h-5" />
	                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#006bff] rounded-full border-2 border-white"></span>
	               </button>
	               {notificationsOpen && (
	                 <div className="absolute right-0 top-full mt-3 w-[360px] rounded-2xl border border-[#d4e0ed] bg-white shadow-[rgba(11,53,88,0.10)_0px_24px_60px] z-50 overflow-hidden">
	                   <div className="px-5 py-4 border-b border-[#d4e0ed] flex items-center justify-between">
	                     <div className="font-semibold text-[#0b3558]">Уведомления</div>
	                     <Badge color="blue">3 новых</Badge>
	                   </div>
	                   {[
	                     ['Площадка загрузила публикацию', 'Заказ #1045 ожидает приемки', 'order_detail', 'blue'],
	                     ['Открыт спор #C-020', 'Модератор запросил доказательства', 'dispute_detail', 'amber'],
	                     ['Баланс ниже лимита', 'Пополните баланс для новых заказов', 'topup', 'red'],
	                   ].map(([title, text, target, color]) => (
	                     <button key={title} className="w-full text-left px-5 py-4 border-b border-[#d4e0ed] hover:bg-[#f8f9fb]" onClick={() => { setNotificationsOpen(false); if (isClient) setClientView(target); }}>
	                       <div className="flex items-start justify-between gap-3">
	                         <div>
	                           <div className="text-sm font-semibold text-[#0b3558]">{title}</div>
	                           <div className="text-xs text-[#476788] mt-1">{text}</div>
	                         </div>
	                         <Badge color={color}>новое</Badge>
	                       </div>
	                     </button>
	                   ))}
	                   <button className="w-full px-5 py-3 text-sm font-semibold text-[#006bff] hover:bg-[#f8f9fb]">Показать все</button>
	                 </div>
	               )}
	             </div>
	          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-[#f8f9fb]">
          <div className="max-w-6xl mx-auto pb-10">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
