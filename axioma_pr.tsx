import React, { useEffect, useRef, useState } from 'react';
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
  { id: 1055, material: 'Обзор рынка недвижимости за третий квартал', platform: 'Бизнес Среда', price: 146000, frozen: 0, status: 'Площадка отказала', statusColor: 'red', date: '19.10.2023', action: 'Посмотреть причину' },
];

const mockOrdersPublisher = [
  { id: 1045, material: 'Пресс-релиз: Запуск новой платформы', advertiser: 'Заказчик #842', price: 127500, status: 'Ожидает публикации', statusColor: 'amber', date: '16.10.2023', format: 'СМИ (Статья)' },
  { id: 1048, material: 'Анонс вебинара по инвестициям', advertiser: 'Заказчик #112', price: 85000, status: 'Новая заявка', statusColor: 'blue', date: '18.10.2023', format: 'СМИ (Новость)' },
  { id: 1052, material: 'Обзор ИТ рынка', advertiser: 'Заказчик #55', price: 150000, status: 'Завершено', statusColor: 'gray', date: '05.10.2023', format: 'СМИ (Лонгрид)' },
  { id: 1054, material: 'Интервью с генеральным директором', advertiser: 'Заказчик #901', price: 60000, status: 'Ожидает публикации', statusColor: 'amber', date: '18.10.2023', format: 'ТГ-канал (Нативный пост)' },
  { id: 1055, material: 'Кейс внедрения системы управления клиентами', advertiser: 'Заказчик #842', price: 146000, status: 'Жалоба открыта', statusColor: 'red', date: '19.10.2023', format: 'Паблик ВК (Новость)' },
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

const mockAdvertisers = [
  { id: 1, code: 'A-842', name: 'ООО "Финтех Решения"', type: 'Юридическое лицо', inn: '7700000000', ogrn: '1237700000000', status: 'Проверен', color: 'green' },
  { id: 2, code: 'A-901', name: 'АО "Урбан Групп"', type: 'Юридическое лицо', inn: '7709000000', ogrn: '1237709000000', status: 'Проверка запрошена', color: 'amber' },
  { id: 3, code: 'A-112', name: 'ИП Смирнова Анна', type: 'Индивидуальный предприниматель', inn: '771100000000', ogrn: '323770000000000', status: 'Не проверялся', color: 'gray' },
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
const complaintStates = ['Черновик', 'Открыта', 'На рассмотрении', 'Нужны доказательства', 'Решена в пользу заказчика', 'Решена в пользу паблишера', 'Удержание применено'];

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
      ['LOG-8841', 'moderator@axioma.ru', 'Изменен статус материала', '#M-1052 · 13:42', 'Открыть событие'],
      ['LOG-8840', 'finance@axioma.ru', 'Подтверждена выплата', 'W-108 · 13:18', 'Открыть событие'],
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
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006bff] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
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

const CustomSelect = ({ options, defaultValue = undefined, value: controlledValue = undefined, placeholder = undefined, onChange = undefined, className = '', buttonClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue ?? (placeholder ? undefined : options[0]));
  const selectRef = useRef(null);
  const selectIdRef = useRef(`custom-select-${Math.random().toString(36).slice(2)}`);
  const selectedValue = controlledValue ?? value;
  const displayValue = selectedValue ?? placeholder ?? options[0];
  const listboxId = `${selectIdRef.current}-listbox`;

  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
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

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('axioma-select-open', closeOnOtherSelectOpen);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('axioma-select-open', closeOnOtherSelectOpen);
    };
  }, [isOpen]);

  const openSelect = () => {
    window.dispatchEvent(new CustomEvent('axioma-select-open', { detail: selectIdRef.current }));
    setIsOpen(true);
  };
  const selectOption = (option) => {
    setValue(option);
    onChange?.(option);
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
      {isOpen && (
        <div id={listboxId} role="listbox" className="ui-enter absolute left-0 right-0 top-full mt-2 z-[70] max-h-72 overflow-y-auto rounded-2xl border border-[#d4e0ed] bg-white p-1.5 shadow-[rgba(11,53,88,0.08)_0px_10px_24px,rgba(11,53,88,0.10)_0px_24px_60px]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selectedValue === option}
              className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-3 ${selectedValue === option ? 'bg-[#e6f0ff] text-[#004eba] font-semibold' : 'text-[#0b3558] hover:bg-[#f8f9fb]'}`}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                selectOption(option);
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

const FullMaterialPreview = ({ context = 'client', showLinks = true }) => (
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
  const [loginRole, setLoginRole] = useState('client');
  const [authStep, setAuthStep] = useState('credentials');
  const [recoverySent, setRecoverySent] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleLogin = (role) => {
    setLoginModalOpen(false);
    setGlobalMode(role);
  };
  const openLoginModal = () => {
    setAuthMode('login');
    setAuthStep('credentials');
    setRecoverySent(false);
    setLoginModalOpen(true);
  };
  const openRegistrationModal = (role = 'client') => {
    setAuthMode('registration');
    setRegistrationRole(role);
    setLoginModalOpen(true);
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
    <div className="min-h-screen scroll-smooth bg-[#f4f6f8] font-sans text-[#102f4f] selection:bg-[#b8ffcf] selection:text-[#102f4f] text-[90%]">
      <header className="sticky top-0 z-50 border-b border-[#dce3eb] bg-white shadow-[0_4px_18px_rgba(11,53,88,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[72px]">
            <div className="flex items-center">
              <span className="landing-heading text-[24px] font-bold text-[#004cca]">Аксиома</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#526d86]">
              <a href="#product" className="px-4 py-2 hover:text-[#004cca] transition-colors">Продукт</a>
              <a href="#catalog" className="px-4 py-2 hover:text-[#004cca] transition-colors">Каталог</a>
              <a href="#publishers" className="px-4 py-2 hover:text-[#004cca] transition-colors">Паблишерам</a>
              <a href="#faq" className="px-4 py-2 hover:text-[#004cca] transition-colors">Вопросы</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button className="px-3 py-2 text-sm font-bold text-[#102f4f] hover:text-[#004cca]" onClick={openLoginModal}>Вход</button>
              <button className="rounded-xl bg-[#004cca] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(0,76,202,0.18)] transition-colors hover:bg-[#003798]" onClick={() => openRegistrationModal('client')}>Зарегистрироваться</button>
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
              <button className="landing-shimmer inline-flex items-center justify-center gap-3 rounded-2xl bg-[#004cca] px-9 py-4 text-sm font-bold text-white premium-shadow-lg transition-all hover:bg-[#003798] active:scale-95" onClick={() => openRegistrationModal('client')}>Зарегистрироваться <ArrowRight className="h-4 w-4" /></button>
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
            <button className="landing-shimmer rounded-2xl bg-[#004cca] px-9 py-4 text-sm font-bold text-white premium-shadow transition-all hover:bg-[#003798]" onClick={() => openRegistrationModal('client')}>Зарегистрироваться и посмотреть</button>
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
                <button className="landing-shimmer rounded-2xl bg-[#004cca] px-8 py-4 text-sm font-bold text-white premium-shadow hover:bg-[#003798]" onClick={() => openRegistrationModal('publisher')}>Стать паблишером</button>
                <button className="rounded-2xl border border-[#c3c6d6] bg-white px-8 py-4 text-sm font-bold text-[#191c1e] hover:bg-[#e7e8ea]" onClick={openLoginModal}>Войти в кабинет</button>
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
                  ['15%', 'Комиссия на вывод'],
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
                <button className="rounded-2xl bg-white px-10 py-5 text-base font-bold text-[#0642aa] shadow-xl transition-colors hover:bg-[#e7efff]" onClick={() => openRegistrationModal('client')}>Зарегистрироваться</button>
                <button className="rounded-2xl border border-white/35 bg-transparent px-10 py-5 text-base font-bold text-white transition-colors hover:bg-white/10" onClick={() => openRegistrationModal('client')}>Перейти в каталог</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#24415f] bg-[#102f4f] py-14 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
           <div>
              <span className="landing-heading text-lg font-bold text-white">Аксиома</span>
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
                <button className="text-left font-semibold text-[#68a1ff] hover:text-white" onClick={() => handleLogin('admin')}>Вход для администратора</button>
              </div>
            </div>
        </div>
      </footer>

      <Modal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} title={authMode === 'registration' ? 'Регистрация' : authStep === 'recovery' ? 'Восстановление доступа' : 'Вход на платформу'} className="max-w-3xl">
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
                Код подтверждения отправлен на почту.
              </div>
              <label className="block">
                <span className="text-sm font-medium text-[#476788]">Код 2FA</span>
                <input inputMode="numeric" maxLength={6} className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-lg tracking-[0.35em] font-semibold text-[#0b3558] focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="123456" />
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button className="text-sm font-semibold text-[#006bff]" onClick={() => setAuthStep('credentials')}>Изменить email или пароль</button>
                <Button variant="primary" onClick={() => handleLogin(loginRole)}>Подтвердить и войти</Button>
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
                  <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue={loginRole === 'client' ? 'owner@fintech.ru' : 'editor@publisher.ru'} />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-[#476788]">Пароль</span>
                  <input type="password" className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="password" />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#476788] text-[#006bff]" defaultChecked />
                <span className="text-sm leading-6 text-[#476788]">Запомнить устройство на 30 дней после прохождения 2FA.</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <button className="font-semibold text-[#006bff]" onClick={() => { setAuthStep('recovery'); setRecoverySent(false); }}>Забыли пароль?</button>
                  <button className="font-semibold text-[#006bff]" onClick={() => openRegistrationModal(loginRole)}>Зарегистрироваться</button>
                </div>
                <Button variant="primary" onClick={() => setAuthStep('2fa')}>Продолжить</Button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#f8f9fb] border border-[#d4e0ed] p-1">
              {[
                ['client', 'Заказчик', Briefcase],
                ['publisher', 'Паблишер', Store],
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
                : 'После регистрации вы попадете в кабинет паблишера: сможете заполнить карточку площадки, цены, сроки, требования и отправить площадку на модерацию.'}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button className="text-sm font-semibold text-[#006bff]" onClick={openLoginModal}>Уже есть аккаунт</button>
              <Button variant="primary" onClick={() => handleLogin(registrationRole)}>
                {registrationRole === 'client' ? 'Создать кабинет заказчика' : 'Создать кабинет паблишера'}
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
            ['#1045', 'Проверить публикацию', 'РБК Инвестиции загрузила ссылку на публикацию', 'order_detail', 'Проверить'],
            ['#1048', 'Площадка рассматривает заказ', 'Ожидается решение площадки до 18.10', 'order_pending_detail', 'Открыть'],
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

const ClientOrderDetailView = ({ navigate, state = 'acceptance' }) => {
  const [linksOpen, setLinksOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const isPendingState = state === 'pending';
  const isRejectedState = state === 'rejected';
  const order = isPendingState
    ? {
        id: 1048,
        status: 'Площадка рассматривает',
        color: 'blue',
        subtitle: 'отправлен 16.10.2023 · ответ до 18.10.2023',
        amount: 45000,
        platform: 'Технологии сегодня',
        title: 'Пресс-релиз: Запуск новой платформы',
        format: 'Новость',
      }
    : isRejectedState
      ? {
          id: 1055,
          status: 'Площадка отказала',
          color: 'red',
          subtitle: 'отказ получен 19.10.2023',
          amount: 146000,
          platform: 'Бизнес Среда',
          title: 'Обзор рынка недвижимости за третий квартал',
          format: 'Новость',
        }
      : {
          id: 1045,
          status: 'Ожидает приемки',
          color: 'indigo',
          subtitle: 'ссылка отправлена 18.10.2023',
          amount: 150000,
          platform: 'РБК Инвестиции',
          title: 'Пресс-релиз: Запуск новой платформы',
          format: 'Статья',
        };

  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex items-center gap-2 text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
    </div>
    
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          Заказ #{order.id}
          <Badge color={order.color}>{order.status}</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Площадка: {order.platform} · {order.subtitle}</p>
      </div>
      <div className="text-left sm:text-right">
        <div className="text-sm text-[#476788]">К списанию</div>
        <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{formatMoney(order.amount)}</div>
      </div>
    </div>

    <div className="bg-white border border-[#d4e0ed] rounded-2xl p-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-12 h-12 bg-[#f8f9fb] rounded-full flex items-center justify-center border border-[#d4e0ed] flex-shrink-0">
           {isRejectedState
             ? <AlertCircle className="w-6 h-6 text-red-500" />
             : isPendingState
               ? <Clock className="w-6 h-6 text-[#006bff]" />
               : <CheckCircle2 className="w-6 h-6 text-[#006bff]" />}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#0b3558]">
            {isRejectedState ? 'Площадка отказалась от заказа' : isPendingState ? 'Заказ отправлен площадке' : 'Публикация загружена'}
          </h3>
          <p className="text-sm text-[#476788] mt-1 mb-5">
            {isRejectedState
              ? 'Площадка рассмотрела заказ и отказалась от размещения. Средства по заказу не будут списаны и останутся доступны на балансе.'
              : isPendingState
                ? 'Площадка получила заказ и должна принять или отклонить его до указанного срока. До решения площадки редактирование условий заказа недоступно.'
                : 'Площадка загрузила ссылку на опубликованный материал. Проверьте корректность размещения. Нажимая «Принять и оплатить», вы подтверждаете отсутствие претензий, средства будут списаны с замороженного баланса.'}
          </p>
          {!isPendingState && !isRejectedState && (
            <div className="bg-[#f8f9fb] rounded-lg p-4 border border-[#d4e0ed] flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-2 truncate">
                <ExternalLink className="w-4 h-4 text-[#a6bbd1] flex-shrink-0" />
                <a href="#" className="text-sm text-[#006bff] hover:underline truncate">https://invest.rbc.ru/news/652a9f...</a>
              </div>
              <span className="text-xs text-[#476788] whitespace-nowrap bg-[#f8f9fb] px-2 py-1 rounded">Опубликовано 18.10.2023</span>
            </div>
          )}
          {isRejectedState && (
            <div className="mb-5 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
              <div className="text-xs font-medium text-[#476788]">Причина отказа</div>
              <div className="mt-1 text-sm font-semibold text-[#0b3558]">Нет свободного редакционного слота в срок заказа</div>
              <p className="mt-3 text-sm leading-6 text-[#476788]">
                Редакция не сможет подготовить и выпустить материал до указанного дедлайна. Предлагаем создать новый заказ с датой публикации после 25.10.
              </p>
              <div className="mt-3 text-xs text-[#476788]">РБК Инвестиции · редакция · 19.10.2023, 14:20</div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3">
            {!isPendingState && !isRejectedState && (
              <>
                <Button variant="primary">Принять и оплатить</Button>
                <Button variant="secondary" onClick={() => navigate('complaint')}>Открыть жалобу</Button>
              </>
            )}
            {isRejectedState && <Button variant="primary" onClick={() => navigate('catalog')}>Выбрать другую площадку</Button>}
            <Button variant="secondary" onClick={() => navigate('order_chat')}>Чат заказа</Button>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Состав заказа</h3>
          <div className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
            <div className="min-w-0">
              <div className="text-xs text-[#476788]">Материал</div>
              <div className="mt-1 text-xl font-semibold text-[#0b3558]">{order.title}</div>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {[
                ['Площадка', order.platform],
                ['Формат', order.format],
                ['Сумма', formatMoney(order.amount)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-lg bg-white border border-[#d4e0ed] px-4 py-3">
                  <div className="text-xs text-[#476788]">{label}</div>
                  <div className="mt-1 font-medium text-[#0b3558] break-words">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Материал</h3>
          <FullMaterialPreview showLinks={false} />
          <div className="mt-6 space-y-3">
            <div className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
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

            <div className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
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
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Таймлайн</h3>
          <div className="space-y-4">
            {[
              ['Заказ создан', '15.10, 10:15', 'done'],
              ...(isRejectedState
                ? [
                    ['Площадка рассмотрела заказ', '19.10, 14:20', 'done'],
                    ['Площадка отказала', '19.10, 14:20', 'current'],
                    ['Средства доступны на балансе', 'списания не было', 'next'],
                  ]
                : isPendingState
                  ? [
                      ['Заказ отправлен площадке', '16.10, 11:40', 'done'],
                      ['Решение площадки', 'до 18.10', 'current'],
                      ['Публикация', 'после принятия', 'next'],
                    ]
                  : [
                      ['Площадка приняла заказ', '16.10, 11:40', 'done'],
                      ['Площадка отправила ссылку', '18.10, 12:30', 'done'],
                      ['Приемка публикации', 'ожидает решения', 'current'],
                      ['Оплата заказа', 'после приемки', 'next'],
                    ]),
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
};

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
              <tr
                key={order.id}
                className="hover:bg-[#f8f9fb] cursor-pointer"
                onClick={() => navigate(order.status === 'Площадка рассматривает' ? 'order_pending_detail' : order.status === 'Площадка отказала' ? 'order_rejected_detail' : 'order_detail')}
              >
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
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Описание</span><textarea className="mt-2 w-full min-h-[150px] border border-[#476788] rounded-lg px-4 py-3 text-sm" defaultValue="Опишите, что именно нарушено: ссылка, фрагмент публикации, отличие от согласованного материала." /></label>
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Доказательства</span><div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">Загрузите файл или несколько доказательств</div></label>
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
          <p className="text-sm text-[#476788] mt-1">Средства по заказу заморожены, модератор ожидает доказательства от паблишера.</p>
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

	    <Card className="p-6">
	      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Ход рассмотрения</h2>
	      <div className="space-y-4">
	        {[
	          ['19.10 10:12', 'Заказчик открыл спор', 'done'],
	          ['19.10 11:00', 'Оплата и выплата заблокированы до решения', 'done'],
	          ['19.10 13:30', 'Админ запросил доказательства у паблишера', 'current'],
	          ['20.10 18:00', 'Дедлайн ответа паблишера', 'next'],
	          ['после ответа', 'Модератор проверит материал, ссылку и условия заказа', 'next'],
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
	  </div>
);

const OrderChatView = ({ navigate, role = 'client' }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
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
          <p className="text-sm text-[#476788] mt-1">Проверьте ссылку, полноту материала и корректность маркировки. После приемки средства будут списаны с холда.</p>
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
          ].map(([item, color]) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[#476788]">
              <CheckCircle2 className={`w-4 h-4 ${color === 'green' ? 'text-emerald-500' : 'text-[#d4e0ed]'}`} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Файлы отчета</h2>
	        {[
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
        <CustomSelect placeholder="Статус материала" options={['Все статусы', 'Черновик', 'На модерации', 'Принят в систему', 'Требуются правки', 'Используется в заказах', 'Отклонен']} />
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
    <Card className="p-5 bg-[#f8f9fb]">
      <p className="text-sm text-[#476788]">
        Рекламодатель нужен только для маркировки. После сохранения данных платформа автоматически проверяет юрлицо через ЕГРЮЛ и присваивает статус.
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
            <tr key={item.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate('advertiser_detail')}>
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-[#0b3558]">{item.name}</div>
                <div className="mt-1 text-xs text-[#476788]">{item.code}</div>
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
);

const ClientAdvertiserDetailView = ({ navigate }) => {
  const advertiser = {
    code: 'A-842',
    name: 'ООО "Финтех Решения"',
    status: 'Проверен',
    color: 'green',
    legal: [
      ['Тип рекламодателя', 'Юридическое лицо'],
      ['Юридическое название', 'ООО "Финтех Решения"'],
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
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('advertisers')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> К рекламодателям
      </button>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558] flex flex-wrap items-center gap-3">
            {advertiser.name}
            <Badge color={advertiser.color}>{advertiser.status.toLowerCase()}</Badge>
          </h1>
          <p className="text-sm text-[#476788] mt-1">{advertiser.code} · рекламодатель для маркировки</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('advertiser_edit')}>Изменить данные</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 bg-[#f8f9fb]">
            <p className="text-sm text-[#476788]">
              Рекламодатель используется только для маркировки. В карточке хранится юридическое лицо, которое автоматически проверяется через внешний сервис.
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
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#d4e0ed] pb-3">
              <h2 className="font-display text-base font-bold text-[#0b3558]">Заявки с рекламодателем</h2>
              <Badge color="blue">{advertiser.requests.length} заявки</Badge>
            </div>
            <div className="space-y-3">
              {advertiser.requests.map(([id, material, platform, requestStatus]) => (
                <button key={id} className="w-full rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4 text-left transition-colors hover:border-[#006bff] hover:bg-white" onClick={() => navigate('order_detail')}>
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
        </div>

        <Card className="p-6 h-fit">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Автоматическая проверка</h2>
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-[#0b3558]">Юрлицо подтверждено</div>
                <div className="mt-1 text-xs leading-5 text-[#476788]">Внешний сервис подтвердил существование юрлица и совпадение идентификаторов.</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ClientAdvertiserEditView = ({ navigate }) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('advertiser_detail')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К карточке рекламодателя
    </button>
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Редактирование рекламодателя</h1>
      <p className="text-sm text-[#476788] mt-1">После изменения юридических данных проверка через внешний сервис запускается повторно.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Тип рекламодателя</span>
          <CustomSelect className="mt-2" options={['Юридическое лицо', 'Индивидуальный предприниматель']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Юридическое название</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue='ООО "Финтех Решения"' />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ИНН</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="7700000000" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">КПП</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="770001001" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ОГРН / ОГРНИП</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="1237700000000" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Юридический адрес</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" defaultValue="119019, Москва, ул. Воздвиженка, 10" />
        </label>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        После сохранения платформа автоматически запросит проверку юрлица через внешний сервис.
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
      <p className="text-sm text-[#476788] mt-1">Добавьте юрлицо для маркировки. Проверка существования запускается автоматически через внешний сервис.</p>
    </div>
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Тип рекламодателя</span>
          <CustomSelect className="mt-2" options={['Юридическое лицо', 'Индивидуальный предприниматель']} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">Юридическое название</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="ООО «Название компании»" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ИНН</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="7700000000" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">КПП</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="770001001" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#476788]">ОГРН / ОГРНИП</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="1237700000000" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[#476788]">Юридический адрес</span>
          <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="Индекс, город, улица, дом" />
        </label>
      </div>
      <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
        После сохранения рекламодатель появится в списке со статусом «проверка запрошена». Результат применится автоматически после ответа API.
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
  const [audienceFilter, setAudienceFilter] = useState(undefined);
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
  const visiblePlatforms = (showFavoritesOnly ? mockCatalog.filter(item => favoritePlatforms.includes(item.id)) : mockCatalog)
    .filter(matchesAudience);
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
          <CustomSelect placeholder="Тип площадки" options={['Все типы', 'СМИ', 'ТГ-канал', 'Паблик ВК']} />
          <CustomSelect placeholder="Цель размещения" options={['Любая цель', 'Пиар', 'SEO', 'SERM']} />
          <CustomSelect placeholder="Регион" options={['Все регионы', 'Федеральные', 'Москва', 'Регионы']} />
          <CustomSelect placeholder="Тематика" options={['Любая тематика', 'Финансы', 'ИТ', 'Бизнес']} />
          <CustomSelect placeholder="Цена" options={['Любая цена', 'До 50 000 ₽', '50 000-100 000 ₽', '100 000+ ₽']} />
          <CustomSelect placeholder="Срок публикации" options={['Любой срок', '1 день', '2-3 дня', 'До недели']} />
          <CustomSelect placeholder="Формат" options={['Все форматы', 'Статья', 'Пост', 'Лонгрид']} />
          <CustomSelect placeholder="Аудитория" options={['Любая аудитория', 'До 100 тыс.', '100 тыс.-1 млн', '1 млн+']} value={audienceFilter} onChange={setAudienceFilter} />
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

const PublisherDashboardView = ({ navigate }) => (
  <div className="space-y-8">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Панель паблишера</h1>
        <p className="text-sm text-[#476788] mt-1">Рабочая сводка по заказам, публикациям и выплатам.</p>
      </div>
      <Button variant="secondary" onClick={() => navigate('pub_orders')}>Все заказы</Button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        ['Новые заявки', '1', 'ответить до 18:00', 'pub_orders', 'Открыть заявки', 'blue'],
        ['В работе', '3', 'приняты редакцией', 'pub_orders', 'Перейти к заказам', 'green'],
        ['Ждут публикации', '2', 'ближайший дедлайн завтра', 'pub_order_detail', 'Загрузить ссылку', 'amber'],
        ['На приемке', '4', 'ожидают заказчика', 'pub_orders', 'Открыть приемку', 'indigo'],
        ['Жалобы', '1', 'нужны доказательства', 'pub_dispute_detail', 'Открыть спор', 'red'],
        ['Доступно к выводу', formatMoney(235000), 'после проверки реквизитов', 'pub_finance', 'Открыть выплаты', 'green'],
        ['Ожидает приемки', formatMoney(127500), 'начислится после принятия', 'pub_order_acceptance_detail', 'Открыть приемку', 'gray'],
        ['Удержания', formatMoney(52000), 'по жалобе #C-020', '', '', 'red'],
      ].map(([label, value, note, target, action, color]) => (
        <Card key={label} className="p-5">
          <h3 className="text-xs font-medium text-[#476788] uppercase tracking-wider mb-2">{label}</h3>
          <div className="text-2xl font-semibold text-[#0b3558] tabular-nums">{value}</div>
          <div className="mt-2 text-xs text-[#476788]">{note}</div>
          {target && action && (
            <button
              className={`mt-4 inline-flex items-center text-sm font-medium ${color === 'gray' ? 'text-[#476788] hover:text-[#0b3558]' : 'text-[#006bff] hover:text-[#004eba]'}`}
              onClick={() => navigate(target)}
            >
              {action}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          )}
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
          ['#1048', 'Новая заявка', 'Принять или отклонить заявку', 'до 18:00 сегодня', 'pub_order_new_detail', 'Рассмотреть'],
          ['#1045', 'Публикация', 'Загрузить ссылку', 'до 20.10', 'pub_order_detail', 'Загрузить'],
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
      </Card>
    </div>

    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-[#d4e0ed] bg-[#f8f9fb]">
        <h3 className="text-base font-semibold text-[#0b3558]">Последние входящие заказы</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] table-fixed divide-y divide-[#d4e0ed]">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[27%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[31%]" />
          </colgroup>
          <thead className="bg-[#f8f9fb]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Заказ / дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Материал</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Формат</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Начисление</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#476788] uppercase tracking-wider">Статус</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#d4e0ed]">
            {mockOrdersPublisher.slice(0, 4).map((order) => (
              <tr key={order.id} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => navigate(order.status === 'Ожидает приемки' ? 'pub_order_acceptance_detail' : order.id === 1048 ? 'pub_order_new_detail' : 'pub_order_detail')}>
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
        <CustomSelect placeholder="Статус заказа" options={['Все заказы', 'Новые заявки', 'В работе', 'Ждут публикации', 'На приемке', 'С жалобой']} />
        <CustomSelect placeholder="Площадка" options={['Все площадки', 'РБК Инвестиции', 'РБК Телеграм']} />
        <CustomSelect placeholder="Дедлайн" options={['Любой дедлайн', 'Сегодня', 'Просрочено', 'На неделе']} />
        <input className="border border-[#476788] rounded-lg px-3 py-2 text-sm" placeholder="Поиск по номеру или материалу" />
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
                onClick={() => navigate(order.status === 'Ожидает приемки' ? 'pub_order_acceptance_detail' : order.id === 1048 ? 'pub_order_new_detail' : 'pub_order_detail')}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#0b3558]">#{order.id}</div>
                  <div className="text-xs text-[#476788] mt-1 tabular-nums">{order.date}</div>
                </td>
                <td className="px-6 py-4 text-sm text-[#0b3558] font-medium truncate">{order.material}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge color={order.statusColor}>{order.status}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-[#476788]">
                  {order.status === 'Новая заявка' ? 'принять или отклонить' : order.status === 'Завершено' ? 'действий нет' : order.status === 'Жалоба открыта' ? 'ответить на жалобу' : 'загрузить ссылку'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

const PublisherOrderDetailView = ({ navigate, state = 'publication' }) => {
  const [publicationPanelOpen, setPublicationPanelOpen] = useState(false);
  const [rejectionPanelOpen, setRejectionPanelOpen] = useState(false);
  const [markingDataOpen, setMarkingDataOpen] = useState(false);
  const isAcceptanceState = state === 'acceptance';
  const isNewState = state === 'new';
  const order = isNewState
    ? {
        id: 1048,
        status: 'Новая заявка',
        statusColor: 'blue',
        subtitle: 'ответ до 18:00 сегодня',
        amount: 85000,
        title: 'Анонс вебинара по инвестициям',
        description: 'Новость для РБК Инвестиции. Требуется принять или отклонить заявку до конца рабочего дня.',
        format: 'Новость',
      }
    : {
        id: 1045,
        status: isAcceptanceState ? 'Ожидает приемки' : 'Ожидает публикации',
        statusColor: isAcceptanceState ? 'indigo' : 'amber',
        subtitle: isAcceptanceState ? 'ссылка отправлена 18.10.2023' : 'публикация до 20.10.2023',
        amount: 127500,
        title: 'Пресс-релиз: Запуск новой платформы',
        description: 'Статья для РБК Инвестиции, публикация от редакции. Ответ 8 часов, дедлайн публикации до 20.10.',
        format: 'Статья',
      };

  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="flex items-center gap-2 text-sm text-[#476788] cursor-pointer hover:text-[#0b3558]" onClick={() => navigate('pub_orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">
          Заказ #{order.id}
          <Badge color={order.statusColor}>{order.status}</Badge>
        </h1>
        <p className="text-sm text-[#476788] mt-1">Площадка: РБК Инвестиции · {order.subtitle}</p>
      </div>
      <div className="text-left sm:text-right">
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
            {isAcceptanceState ? 'Публикация отправлена на приемку' : isNewState ? 'Заказ еще не принят' : 'Заказ принят в работу'}
          </h3>
          <p className="text-sm text-[#476788] mt-1 mb-5">
            {isAcceptanceState
              ? 'Заказчик получил ссылку на публикацию. Начисление станет доступно после приемки публикации или после решения модератора, если будет открыт спор.'
              : isNewState
                ? 'Проверьте материал, юридические данные рекламодателя и требования к публикации. После принятия заказа станет доступна отправка ссылки на публикацию.'
                : 'Проверьте материал, юридические данные рекламодателя и требования к публикации. После размещения отправьте ссылку и подтверждение маркировки заказчику.'}
          </p>
          <div className="flex flex-wrap gap-3">
            {isNewState && (
              <>
                <Button variant="primary">Принять заказ</Button>
                <Button variant="secondary" onClick={() => setRejectionPanelOpen((value) => !value)}>
                  {rejectionPanelOpen ? 'Скрыть форму отказа' : 'Отказать'}
                </Button>
              </>
            )}
            {!isAcceptanceState && !isNewState && (
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
                  <a className="text-sm font-medium text-[#006bff] break-all" href="https://invest.rbc.ru/news/652a9f">https://invest.rbc.ru/news/652a9f</a>
                  <CopyButton value="https://invest.rbc.ru/news/652a9f" label="Скопировать ссылку" />
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
          {!isAcceptanceState && !isNewState && (
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
                  <input className="mt-2 w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm" defaultValue="https://invest.rbc.ru/news/652a9f" />
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-[#d4e0ed] bg-white p-4">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-[#476788] text-[#006bff]" />
                  <span className="text-sm leading-6 text-[#0b3558]">
                    Подтверждаю, что опубликованный материал содержит обязательную пометку о рекламе, идентификатор рекламы (ERID) получен через оператора рекламных данных, сведения о рекламе переданы в ЕРИР в установленном порядке, а ERID размещен в публикации.
                  </span>
                </label>
              </div>
              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={() => setPublicationPanelOpen(false)}>Отмена</Button>
                <Button variant="primary">Отправить на приемку</Button>
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
                  />
                </label>
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <Button variant="secondary" onClick={() => setRejectionPanelOpen(false)}>Отмена</Button>
                  <Button variant="primary">Отправить отказ</Button>
                </div>
              </div>
            </CollapsiblePanel>
          )}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Состав заказа</h3>
          <div className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
            <div className="min-w-0">
              <div className="text-xs text-[#476788]">Материал</div>
              <div className="mt-1 text-xl font-semibold text-[#0b3558]">{order.title}</div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#476788]">
                {order.description}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {[
                ['Площадка', 'РБК Инвестиции'],
                ['Формат', order.format],
                ['Начисление', formatMoney(order.amount)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-lg bg-white border border-[#d4e0ed] px-4 py-3">
                  <div className="text-xs text-[#476788]">{label}</div>
                  <div className="mt-1 font-medium text-[#0b3558] break-words">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
            <button
              className={`w-full px-4 py-3 flex items-center justify-between gap-3 text-left ${markingDataOpen ? 'border-b border-[#d4e0ed]' : ''}`}
              onClick={() => setMarkingDataOpen((value) => !value)}
            >
              <div className="text-sm font-semibold text-[#0b3558]">Данные для маркировки</div>
              <ChevronRight className={`w-4 h-4 text-[#476788] transition-transform ${markingDataOpen ? 'rotate-90' : ''}`} />
            </button>
            <CollapsiblePanel open={markingDataOpen}>
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
            </CollapsiblePanel>
          </div>

        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Материал</h3>
          <FullMaterialPreview context="publisher" showLinks={false} />
          <div className="mt-6 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] overflow-hidden">
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
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Таймлайн</h3>
          <div className="space-y-4">
            {[
              ['Заказ поступил', '18.10, 10:15', 'done'],
              ...(isNewState
                ? [
                    ['Решение площадки', 'до 18:00', 'current'],
                    ['Площадка принимает заказ', 'после решения', 'next'],
                    ['Ожидается публикация', 'после принятия', 'next'],
                  ]
                : [
                    ['Площадка приняла заказ', '18.10, 11:40', 'done'],
                  ]),
              ...(isAcceptanceState
                ? [
                    ['Площадка отправила ссылку', '18.10, 12:30', 'done'],
                    ['Приемка заказчиком', 'ожидается', 'current'],
                    ['Начисление доступно', 'после приемки', 'next'],
                  ]
                : isNewState ? [] : [
                    ['Ожидается публикация', 'до 20.10', 'current'],
                    ['Приемка заказчиком', 'после отправки ссылки', 'next'],
                  ]),
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

        <Card className="p-6">
          <h3 className="text-base font-semibold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Таймлайн</h3>
          <div className="space-y-4">
            {[
              ['Заявка поступила', '18.10, 10:15', 'done'],
              ['Ожидается решение площадки', 'до 18:00', 'current'],
              ['Принятие заказа', 'после решения', 'next'],
              ['Публикация', 'после принятия', 'next'],
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
};

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
      <div className="mb-5 rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 md:items-center">
          <div>
            <div className="text-sm font-semibold text-[#0b3558]">Активность площадки</div>
            <div className="text-xs text-[#476788] mt-1">Управляет видимостью в каталоге и приемом новых заказов.</div>
          </div>
          <CustomSelect className="w-full" options={['Активна: принимает новые заказы', 'Пауза: не принимать новые заказы', 'Скрыта из каталога']} />
        </div>
      </div>
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
          <p className="text-sm text-[#476788] mt-1">Используются для вывода средств паблишеру. Пока реквизиты на проверке, запрос выплаты недоступен.</p>
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
        <label className="block md:col-span-2"><span className="text-sm font-medium text-[#476788]">Доказательства</span><div className="mt-2 border border-dashed border-[#476788] rounded-lg p-6 text-sm text-[#476788] bg-[#f8f9fb]">Загрузите файл или несколько доказательств</div></label>
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
        {description && <p className="text-sm text-[#476788] mt-1">{description}</p>}
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
  const [editing, setEditing] = useState(false);
  const roleOptions = (currentRole) => Array.from(new Set([currentRole, 'Администратор', 'Заказы и чат', 'Публикации', 'Выплаты', 'Материалы', 'Финансы', 'Только просмотр', 'Без доступа']));

  return (
    <SettingsSection
      title="Доступы команды"
      description={editing ? description : ''}
      icon={ShieldCheck}
    >
      {editing ? (
        <div className="ui-enter">
          <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4">
            <div className="text-sm font-semibold text-[#0b3558]">Пригласить по email</div>
            <div className="mt-3 space-y-3">
              <input className="w-full border border-[#476788] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#006bff]" placeholder="name@company.ru" />
              <CustomSelect options={['Роль: администратор', 'Роль: заказы и чат', 'Роль: публикации', 'Роль: выплаты', 'Только просмотр']} />
              <Button variant="primary" className="w-full"><Plus className="w-4 h-4 mr-2" /> Отправить приглашение</Button>
            </div>
            <p className="text-xs text-[#476788] mt-3">Сотрудник получит письмо со ссылкой для входа и создания пароля.</p>
          </div>
          <div className="mt-5 space-y-3">
            {members.map(([name, email, role, status, color]) => (
              <div key={email} className="rounded-lg border border-[#d4e0ed] bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#0b3558] truncate">{email}</div>
                    <div className="text-xs text-[#476788] mt-1 truncate">{role}</div>
                  </div>
                  <Badge color={color}>{status}</Badge>
                </div>
                <div className="mt-3">
                  <CustomSelect options={roleOptions(role)} />
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" className="w-full mt-4" onClick={() => setEditing(false)}>Сохранить</Button>
        </div>
      ) : (
        <div className="ui-enter">
          <div className="space-y-2">
            {members.map(([name, email, role, status, color]) => (
              <div key={email} className="flex items-center justify-between gap-3 rounded-lg border border-[#d4e0ed] bg-white px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#0b3558] truncate">{email}</div>
                  <div className="text-xs text-[#476788] mt-0.5 truncate">{role}</div>
                </div>
                <Badge color={color}>{status}</Badge>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full mt-4" onClick={() => setEditing(true)}>Редактировать</Button>
        </div>
      )}
    </SettingsSection>
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

const PublisherSettingsView = () => {
  const [payeeStatus, setPayeeStatus] = useState('Юридическое лицо');
  const isLegalPayee = payeeStatus === 'Юридическое лицо';

  return (
  <div className="space-y-6 max-w-6xl">
    <div>
      <h1 className="font-display text-2xl font-bold text-[#0b3558]">Настройки паблишера</h1>
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

        <SettingsSection title="Безопасность" description="Пароль, 2FA и API-ключи для интеграций." icon={Lock}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SettingField label="Текущий пароль"><input type="password" className={settingInputClass} defaultValue="password" /></SettingField>
            <SettingField label="Новый пароль"><input type="password" className={settingInputClass} placeholder="Новый пароль" /></SettingField>
            <SettingField label="Двухфакторная защита"><CustomSelect className="mt-2" options={['Включена: почта', 'Приложение-аутентификатор', 'Отключена']} /></SettingField>
            <SettingField label="API-доступ"><CustomSelect className="mt-2" options={['Отключен', 'Только чтение заказов', 'Заказы и выплаты']} /></SettingField>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3"><Button variant="primary">Обновить безопасность</Button></div>
        </SettingsSection>

        <SettingsSection title="Реквизиты выплат" description="Сюда платформа перечисляет выплаты после приемки заказов и удержания комиссии 15%." icon={CreditCard}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <SettingField label="Статус получателя" className="min-w-0">
              <CustomSelect
                className="mt-2"
                options={['Юридическое лицо', 'Физическое лицо']}
                value={payeeStatus}
                onChange={setPayeeStatus}
              />
            </SettingField>
            <SettingField label="График выплат" className="min-w-0">
              <CustomSelect className="mt-2" options={['1 раз в месяц', '2 раза в месяц', 'По запросу после проверки']} />
            </SettingField>

            {isLegalPayee ? (
              <React.Fragment key="publisher-legal-payee">
                <SettingField label="Получатель" className="min-w-0"><input className={settingInputClass} defaultValue="ООО Редакция" /></SettingField>
                <SettingField label="ИНН" className="min-w-0"><input className={settingInputClass} defaultValue="7701000000" /></SettingField>
                <SettingField label="КПП" className="min-w-0"><input className={settingInputClass} defaultValue="770101001" /></SettingField>
                <SettingField label="ОГРН" className="min-w-0"><input className={settingInputClass} defaultValue="1237701000000" /></SettingField>
                <SettingField label="Расчетный счет" className="min-w-0"><input className={settingInputClass} defaultValue="40702810********4432" /></SettingField>
                <SettingField label="Банк" className="min-w-0"><input className={settingInputClass} defaultValue="АО Банк" /></SettingField>
                <SettingField label="БИК" className="min-w-0"><input className={settingInputClass} defaultValue="044525000" /></SettingField>
                <SettingField label="НДС" className="min-w-0"><CustomSelect className="mt-2" options={['20%', 'Без НДС', 'УСН']} /></SettingField>
                <SettingField label="Юридический адрес" className="md:col-span-2 min-w-0"><input className={settingInputClass} defaultValue="125009, Москва, ул. Тверская, 7" /></SettingField>
                <SettingField label="Документооборот" className="min-w-0"><CustomSelect className="mt-2" options={['ЭДО: Диадок', 'ЭДО: СБИС', 'Бумажные оригиналы']} /></SettingField>
                <SettingField label="Идентификатор оператора ЭДО" className="min-w-0"><input className={settingInputClass} defaultValue="2BM-7701000000-770101001-2024010100000000000000000" /></SettingField>
              </React.Fragment>
            ) : (
              <React.Fragment key="publisher-individual-payee">
                <SettingField label="ФИО" className="min-w-0"><input className={settingInputClass} defaultValue="Александр Сергеевич Иванов" /></SettingField>
                <SettingField label="ИНН физлица" className="min-w-0"><input className={settingInputClass} defaultValue="770100000000" /></SettingField>
                <SettingField label="Дата рождения" className="min-w-0"><input className={settingInputClass} defaultValue="12.04.1988" /></SettingField>
                <SettingField label="СНИЛС" className="min-w-0"><input className={settingInputClass} defaultValue="123-456-789 00" /></SettingField>
                <SettingField label="Банк" className="min-w-0"><input className={settingInputClass} defaultValue="АО Банк" /></SettingField>
                <SettingField label="БИК" className="min-w-0"><input className={settingInputClass} defaultValue="044525000" /></SettingField>
                <SettingField label="Номер счета" className="md:col-span-2 min-w-0"><input className={settingInputClass} defaultValue="40817810********7788" /></SettingField>
                <SettingField label="Паспортные данные" className="md:col-span-2 min-w-0"><input className={settingInputClass} defaultValue="4510 123456, выдан ОМВД России по г. Москве 12.05.2010" /></SettingField>
                <SettingField label="Адрес регистрации" className="md:col-span-2 min-w-0"><input className={settingInputClass} defaultValue="125009, Москва, ул. Тверская, 7, кв. 14" /></SettingField>
                <SettingField label="Налоговый статус" className="min-w-0"><CustomSelect className="mt-2" options={['Физическое лицо', 'Самозанятый', 'ИП']} /></SettingField>
                <SettingField label="Документооборот" className="min-w-0"><CustomSelect className="mt-2" options={['Электронная подпись', 'Бумажные оригиналы', 'Через представителя']} /></SettingField>
              </React.Fragment>
            )}
          </div>
          <div className="mt-6 rounded-lg border border-dashed border-[#0b3558] p-5 text-sm leading-6 text-[#476788] bg-[#f8f9fb]">
            {isLegalPayee
              ? 'Юрлицо заполняет реквизиты компании, налоговый режим и параметры ЭДО для выплат, отчетов и закрывающих документов.'
              : 'Физлицо заполняет паспортные данные, счет и налоговый статус, чтобы платформа могла подготовить договор и выплаты.'}
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
          <Button variant="secondary" className="w-full mt-4"><Download className="w-4 h-4 mr-2" /> Скачать архив</Button>
        </SettingsSection>
      </div>
    </div>
  </div>
  );
};

const AdminDashboardView = ({ navigate }) => (
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
          {mockAdminQueue.map(item => <tr key={item.id} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => navigate(item.type === 'Спор' ? 'admin_dispute_detail' : 'admin_moderation_detail')}><td className="px-6 py-4 text-sm font-medium">{item.id}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.object}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.type}</td><td className="px-6 py-4 text-sm text-[#476788]">{item.risk}</td><td className="px-6 py-4"><Badge color={item.color}>{item.status}</Badge></td></tr>)}
        </tbody>
      </table>
    </Card>
  </div>
);

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
      const matchesRegion = !regionFilter || regionFilter === 'Все регионы' || item.region === regionFilter;
      const matchesTheme = !themeFilter || themeFilter === 'Любая тематика' || item.theme === themeFilter;
      const matchesFormat = !formatFilter || formatFilter === 'Все форматы' || item.format === formatFilter || (formatFilter === 'Статья / лонгрид' && ['Статья', 'Лонгрид'].includes(item.format));
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
        <Button variant="secondary" onClick={() => setExported(true)}><Download className="w-4 h-4 mr-2" /> {exported ? 'Экспорт готов' : 'Экспорт'}</Button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a6bbd1]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-[#476788] bg-white py-2.5 pl-10 pr-4 text-sm" placeholder="Поиск по названию, ID или паблишеру" />
          </div>
          <CustomSelect placeholder="Статус" options={['Все статусы', 'Активна', 'На проверке', 'Требуются правки', 'Приостановлена']} value={statusFilter} onChange={setStatusFilter} />
          <CustomSelect placeholder="Сортировка" options={['Сначала требуют внимания', 'Сначала дороже', 'Сначала дешевле', 'По названию']} value={sortMode} onChange={setSortMode} />
          <CustomSelect placeholder="Тип площадки" options={['Все типы', 'СМИ', 'ТГ-канал', 'Паблик ВК']} value={typeFilter} onChange={setTypeFilter} />
          <CustomSelect placeholder="Регион" options={['Все регионы', 'Федеральные', 'Москва', 'Регионы']} value={regionFilter} onChange={setRegionFilter} />
          <CustomSelect placeholder="Тематика" options={['Любая тематика', 'Финансы', 'ИТ', 'Бизнес']} value={themeFilter} onChange={setThemeFilter} />
          <CustomSelect placeholder="Формат" options={['Все форматы', 'Статья', 'Пост', 'Статья / лонгрид']} value={formatFilter} onChange={setFormatFilter} />
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
                      <div className="text-[11px] text-[#476788]">{item.region === 'Федеральные' ? 'общий' : 'по сегменту'}</div>
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
  const data = mockAdminSections[section] || mockAdminSections.admin_moderation;
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
    const matchesQuery = row.join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesUserType = section !== 'admin_users' || userTypeFilter === 'Все типы' || row[2] === userTypeFilter;
    const matchesStatus = section === 'admin_users'
      ? statusFilter === 'Все статусы' || row[3] === statusFilter
      : statusFilter === 'Все статусы'
      || (statusFilter === 'Требует действия' && !String(row[4]).match(/Открыть|Проверено|Завершено|Закрыто/))
      || (statusFilter === 'Завершено' && String(row.join(' ')).match(/Завершено|Закрыто|Выплачено|Проверен/))
      || (statusFilter === 'В работе' && String(row.join(' ')).match(/ожидает|провер|работ|актив/i))
      || (statusFilter === 'Архив' && String(row.join(' ')).match(/архив/i));
    return matchesQuery && matchesUserType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b3558]">{data.title}</h1>
          <p className="text-sm text-[#476788] mt-1">Операционный раздел админки с отдельными действиями и подтверждениями.</p>
        </div>
        <Button variant="secondary" onClick={() => setExported(true)}><Download className="w-4 h-4 mr-2" /> {exported ? 'Экспорт готов' : 'Экспорт'}</Button>
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
            : ['Все статусы', 'Требует действия', 'В работе', 'Завершено', 'Архив']}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <CustomSelect options={['Сначала срочные', 'Сначала новые', 'Сначала старые']} />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full divide-y divide-[#d4e0ed]">
          <thead className="bg-[#f8f9fb]"><tr><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Номер / объект</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Тип / сумма</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Статус</th><th className="px-6 py-4 text-left text-xs font-medium text-[#476788] uppercase">Контекст</th><th className="px-6 py-4 text-right text-xs font-medium text-[#476788] uppercase">Действие</th></tr></thead>
          <tbody className="divide-y divide-[#d4e0ed]">
            {filteredRows.map((row) => (
              <tr key={row.join('-')} className="hover:bg-[#f8f9fb] cursor-pointer" onClick={() => detailRoute && (onSelect ? onSelect(section, row, detailRoute) : navigate(detailRoute))}>
                <td className="px-6 py-4 text-sm font-medium text-[#0b3558]">{row[0]}</td>
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

const AdminOrderDetailView = ({ navigate, selection }) => {
  const [result, setResult] = useState('');
  const row = selection?.row || mockAdminSections.admin_orders.rows[0];
  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_orders')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К заказам
    </button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558]">Админ: заказ {row[0]}</h1>
        <p className="text-sm text-[#476788] mt-1">Полная карточка заказа для контроля споров, финансов и публикации.</p>
      </div>
      <Badge color="indigo">{row[1]}</Badge>
    </div>
    <Card className="p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        <div className="w-11 h-11 rounded-full border border-[#d4e0ed] bg-[#f8f9fb] flex items-center justify-center"><Clock className="w-5 h-5 text-[#006bff]" /></div>
        <div className="flex-1"><h2 className="font-display text-lg font-bold">Ожидается решение заказчика</h2><p className="mt-1 text-sm text-[#476788]">Площадка отправила ссылку. Средства остаются замороженными до приемки публикации или открытия спора.</p><div className="mt-4 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => navigate('admin_order_chat')}>Открыть чат заказа</Button><Button variant="secondary" onClick={() => navigate('admin_dispute_detail')}>Связанные споры</Button></div></div>
      </div>
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Состав заказа</h2>
        <div className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">Материал</div><div className="mt-1 text-lg font-semibold">Пресс-релиз: Запуск новой платформы</div><div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">{[['Заказчик', 'Заказчик #842'], ['Площадка', 'РБК Инвестиции'], ['Формат', 'Статья']].map(([label, value]) => <div key={label} className="rounded-lg border border-[#d4e0ed] bg-white p-3"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-sm font-medium">{value}</div></div>)}</div></div>
        <div className="mt-4 rounded-lg border border-[#d4e0ed] p-4"><div className="flex justify-between gap-3 text-sm"><span className="text-[#476788]">Ссылка на публикацию</span><a className="text-[#006bff]" href="https://invest.rbc.ru/news/652a9f">invest.rbc.ru/news/652a9f</a></div></div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Админские действия</h2>
        <div className="space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => setResult('Запрос доказательств отправлен обеим сторонам.')}>Запросить доказательства</Button>
          <Button variant="secondary" className="w-full" onClick={() => setResult('Удержание создано и ожидает подтверждения финансового контролера.')}>Применить удержание</Button>
          <Button variant="primary" className="w-full" onClick={() => navigate('admin_dispute_detail')}>Открыть решение спора</Button>
        </div>
        <div className="mt-4"><ActionResult text={result} /></div>
      </Card>
    </div>
    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Материал на проверке</h2>
      <FullMaterialPreview context="admin" />
    </Card>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6"><h2 className="font-display text-base font-bold mb-4">Финансы заказа</h2><div className="space-y-3 text-sm">{[['Стоимость', formatMoney(150000)], ['Заморожено', formatMoney(150000)], ['Комиссия', formatMoney(22500)], ['К выплате паблишеру', formatMoney(127500)]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><span className="text-[#476788]">{label}</span><span className="font-medium">{value}</span></div>)}</div></Card>
      <Card className="p-6"><h2 className="font-display text-base font-bold mb-4">Таймлайн</h2><div className="space-y-4">{[['Заказ создан', '15.10, 10:15', 'done'], ['Средства заморожены', '15.10, 10:16', 'done'], ['Площадка отправила ссылку', '18.10, 12:30', 'done'], ['Приемка заказчиком', 'ожидается', 'current']].map(([label, time, status]) => <div key={label} className="flex gap-3">{status === 'done' ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : <Clock className="mt-0.5 h-4 w-4 text-amber-500" />}<div><div className="text-sm font-medium">{label}</div><div className="text-xs text-[#476788]">{time}</div></div></div>)}</div></Card>
    </div>
  </div>
  );
};

const AdminModerationDetailView = ({ navigate, selection, onOpenPublisher }) => {
  const [comment, setComment] = useState('');
  const [result, setResult] = useState('');
  const [linksOpen, setLinksOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const row = selection?.row || mockAdminSections.admin_moderation.rows[0];
  const isPlatform = String(row[0]).startsWith('#P-');
  const moderationOrder = {
    material: row[0] === '#M-1054' ? 'Интервью с генеральным директором' : 'Пресс-релиз: Запуск новой платформы',
    platform: 'РБК Инвестиции',
    customer: 'Заказчик #842',
    advertiser: 'ООО "Финтех Решения"',
    format: row[0] === '#M-1054' ? 'Интервью' : 'Статья',
    amount: row[0] === '#M-1054' ? 60000 : 127500,
    deadline: row[0] === '#M-1054' ? 'публикация до 22.10.2023' : 'публикация до 20.10.2023',
  };
  const submitDecision = (decision) => {
    if (decision !== 'Принят' && !comment.trim()) {
      setResult('Добавьте комментарий: он обязателен при отклонении.');
      return;
    }
    setResult(`${isPlatform ? 'Площадка' : 'Материал'}: ${decision.toLowerCase()}. Решение сохранено в журнале аудита.`);
  };
  const publisherProfileRow = mockAdminSections.admin_users.rows.find((userRow) => userRow[0] === 'P-044') || mockAdminSections.admin_users.rows.find((userRow) => userRow[2] === 'Паблишер');

  return (
  <div className="space-y-6 max-w-6xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_moderation')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К очереди модерации
    </button>
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">{isPlatform ? 'Площадка' : 'Материал'} {row[0]} <Badge color="amber">{row[3]}</Badge></h1>
        <p className="text-sm text-[#476788] mt-1">{row[1]} · {row[2]} · поступил сегодня, 12:40</p>
      </div>
      <div className="text-left lg:text-right"><div className="text-sm text-[#476788]">SLA проверки</div><div className="text-xl font-semibold text-[#0b3558]">1 ч 18 мин</div></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {!isPlatform && (
          <Card className="p-6">
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">Состав заказа</h2>
            <div className="rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4">
              <div className="min-w-0">
                <div className="text-xs text-[#476788]">Материал</div>
                <div className="mt-1 text-xl font-semibold text-[#0b3558]">{moderationOrder.material}</div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#476788]">
                  {moderationOrder.format} для {moderationOrder.platform}, публикация от редакции. {moderationOrder.deadline}.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[
                  ['Заказчик', moderationOrder.customer],
                  ['Площадка', moderationOrder.platform],
                  ['Формат', moderationOrder.format],
                  ['Начисление', formatMoney(moderationOrder.amount)],
                  ['Рекламодатель', moderationOrder.advertiser],
                  ['Срок', moderationOrder.deadline],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-lg bg-white border border-[#d4e0ed] px-4 py-3">
                    <div className="text-xs text-[#476788]">{label}</div>
                    <div className="mt-1 font-medium text-[#0b3558] break-words">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4 pb-3 border-b border-[#d4e0ed]">{isPlatform ? 'Карточка площадки' : 'Материал на проверке'}</h2>
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
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Решение</h2>
          <label className="block">
            <span className="text-sm font-medium text-[#476788]">Комментарий модератора</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} className="mt-2 min-h-[140px] w-full rounded-lg border border-[#476788] px-3 py-2.5 text-sm" placeholder={isPlatform ? 'Обязателен при отклонении' : 'Обязателен при отклонении или возврате на доработку'} />
          </label>
          <div className="mt-4 space-y-2">
            <Button variant="primary" className="w-full" onClick={() => submitDecision('Принят')}>Принять</Button>
            {!isPlatform && <Button variant="secondary" className="w-full" onClick={() => submitDecision('Возвращен на доработку')}>Вернуть на доработку</Button>}
            <Button variant="secondary" className="w-full text-red-600" onClick={() => submitDecision('Отклонен')}>Отклонить</Button>
          </div>
          <div className="mt-4"><ActionResult text={result} tone={result.startsWith('Добавьте') ? 'error' : 'success'} /></div>
        </Card>
      </div>
    </div>
  </div>
  );
};

const AdminDisputeDetailView = ({ navigate, selection }) => {
  const [reason, setReason] = useState('');
  const [result, setResult] = useState('');
  const [evidenceRequested, setEvidenceRequested] = useState(false);
  const row = selection?.row || mockAdminSections.admin_complaints.rows[0];
  const disputeData = {
    orderId: String(row[1] || 'Заказ #1045').replace('Заказ ', ''),
    orderTitle: 'Пресс-релиз: Запуск новой платформы',
    platform: 'РБК Инвестиции',
    customer: 'Заказчик #842',
    publicationUrl: row[0] === 'C-020' ? '' : 'https://invest.rbc.ru/news/652a9f',
    publicationLabel: row[0] === 'C-020' ? 'ссылка не загружена или недоступна' : 'invest.rbc.ru/news/652a9f',
  };
  const resolve = (decision) => {
    if (!reason.trim()) {
      setResult('Добавьте обоснование решения.');
      return;
    }
    setResult(`Спор закрыт: ${decision.toLowerCase()}. Финансовое последствие зафиксировано.`);
  };
  return (
  <div className="space-y-6 max-w-6xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_complaints')}>
      <ChevronRight className="w-4 h-4 rotate-180" /> К жалобам
    </button>
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
      <div><h1 className="font-display text-2xl font-bold text-[#0b3558] flex items-center gap-3">Спор {row[0]} <Badge color="amber">{row[2]}</Badge></h1><p className="text-sm text-[#476788] mt-1">{row[1]} · открыт заказчиком 19.10.2023</p></div>
      <div className="text-left lg:text-right"><div className="text-sm text-[#476788]">На холде</div><div className="text-2xl font-semibold">{formatMoney(150000)}</div></div>
    </div>
    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Предмет спора</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {[['Причина', 'Материал изменен после согласования'], ['Основание', row[3]], ['Срок ответа', 'до 20.10, 18:00']].map(([label, value]) => <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 font-medium">{value}</div></div>)}
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
      {[['Позиция заказчика', 'В публикации изменен согласованный заголовок и удалена ссылка на продукт.', 'доказательства получены'], ['Позиция паблишера', 'Изменения внесены по редакционной политике и не меняют предмет материала.', 'ожидается дополнение']].map(([title, text, status]) => (
        <Card key={title} className="p-6"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-base font-bold">{title}</h2><Badge color={status.includes('получены') ? 'green' : 'amber'}>{status}</Badge></div><p className="mt-4 text-sm leading-6 text-[#476788]">{text}</p><Button variant="secondary" className="mt-5" onClick={() => setEvidenceRequested(true)}>{evidenceRequested ? 'Запрос отправлен' : 'Запросить доказательства'}</Button></Card>
      ))}
    </div>
    <Card className="p-6">
      <h2 className="font-display text-base font-bold text-[#0b3558]">Решение администратора</h2>
      <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-4 min-h-[130px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm" placeholder="Обоснование решения обязательно и будет доступно обеим сторонам" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button variant="secondary" onClick={() => resolve('Полный возврат заказчику')}>Полный возврат</Button>
        <Button variant="secondary" onClick={() => resolve('Полная выплата паблишеру')}>Полная выплата</Button>
        <Button variant="secondary" onClick={() => resolve('Частичное удержание')}>Частичное удержание</Button>
        <Button variant="primary" onClick={() => resolve('Без санкций')}>Закрыть без санкций</Button>
      </div>
      <div className="mt-4"><ActionResult text={result} tone={result.startsWith('Добавьте') ? 'error' : 'success'} /></div>
    </Card>
  </div>
  );
};

const AdminPayoutDetailView = ({ navigate, selection }) => {
  const [comment, setComment] = useState('');
  const [result, setResult] = useState('');
  const row = selection?.row || mockAdminSections.admin_payouts.rows[0];
  const decide = (decision) => {
    if (decision !== 'Подтверждена' && !comment.trim()) {
      setResult('Укажите причину возврата или отклонения выплаты.');
      return;
    }
    setResult(`Выплата ${decision.toLowerCase()}. Операция добавлена в финансовый журнал.`);
  };
  return (
  <div className="space-y-6 max-w-5xl mx-auto">
    <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_payouts')}><ChevronRight className="w-4 h-4 rotate-180" /> К выплатам</button>
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div><h1 className="font-display text-2xl font-bold flex items-center gap-3">Выплата {row[0]} <Badge color="blue">{row[3]}</Badge></h1><p className="mt-1 text-sm text-[#476788]">{row[1]} · создана 19.10.2023</p></div><div className="sm:text-right"><div className="text-sm text-[#476788]">К перечислению</div><div className="text-2xl font-semibold">{formatMoney(199750)}</div></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="font-display text-base font-bold mb-4">Расчет выплаты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[['Начислено', formatMoney(235000)], ['Комиссия 15%', formatMoney(35250)], ['Итого', formatMoney(199750)]].map(([label, value]) => <div key={label} className="rounded-lg border border-[#d4e0ed] bg-[#f8f9fb] p-4"><div className="text-xs text-[#476788]">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>)}</div>
        <h3 className="mt-6 text-sm font-semibold">Заказы-основания</h3>
        <div className="mt-3 divide-y divide-[#d4e0ed] rounded-lg border border-[#d4e0ed]">{[['#1045', 'РБК Инвестиции', '127 500 ₽'], ['#1041', 'РБК Инвестиции', '107 500 ₽']].map(row => <div key={row[0]} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm"><span className="font-medium">{row[0]}</span><span className="text-[#476788]">{row[1]}</span><span className="text-right font-medium">{row[2]}</span></div>)}</div>
      </Card>
      <Card className="p-6">
        <h2 className="font-display text-base font-bold mb-4">Реквизиты</h2>
        <div className="space-y-3 text-sm">{[['Получатель', 'ООО «Редакция РБК»'], ['ИНН', '7700001111'], ['Счет', '•••• 4432'], ['БИК', '044525000']].map(([label, value]) => <div key={label}><div className="text-xs text-[#476788]">{label}</div><div className="mt-0.5 font-medium">{value}</div></div>)}</div>
        <Badge color="green" className="mt-4">реквизиты проверены</Badge>
      </Card>
    </div>
    <Card className="p-6"><label className="block"><span className="text-sm font-medium text-[#476788]">Комментарий финансового контролера</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="mt-2 min-h-[100px] w-full rounded-lg border border-[#476788] px-4 py-3 text-sm" /></label><div className="mt-4 flex flex-wrap justify-end gap-3"><Button variant="secondary" onClick={() => decide('Возвращена на проверку')}>Вернуть на проверку</Button><Button variant="secondary" onClick={() => decide('Отклонена')}>Отклонить</Button><Button variant="primary" onClick={() => decide('Подтверждена')}>Подтвердить выплату</Button></div><div className="mt-4"><ActionResult text={result} tone={result.startsWith('Укажите') ? 'error' : 'success'} /></div></Card>
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
  const status = row?.[3] || 'Активен';
  const suspendPlatform = () => {
    setResult('Площадка приостановлена и скрыта из каталога до повторной проверки.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button className="flex items-center gap-2 text-sm text-[#476788] hover:text-[#0b3558]" onClick={() => navigate('admin_platforms')}>
        <ChevronRight className="w-4 h-4 rotate-180" /> Назад к списку
      </button>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl ${item.logo}`}>{item.name.charAt(0)}</div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0b3558] flex flex-wrap items-center gap-3">
              {item.name}
              <Badge color={status === 'Принята' || status === 'Активен' ? 'green' : status === 'На проверке' ? 'blue' : 'amber'}>{status}</Badge>
            </h1>
            <p className="text-sm text-[#476788] mt-1">{item.type} · {item.theme} · {item.region} · Паблишер P-017</p>
          </div>
        </div>
        <Button variant="secondary" onClick={suspendPlatform}>Приостановить площадку</Button>
      </div>

      <div className="flex flex-wrap justify-start gap-2">
        {item.tags.map(tag => <Badge key={tag} color="blue">{tag}</Badge>)}
        <Badge color="green">реквизиты проверены</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Цена</div><div className="mt-2 text-xl font-semibold">{formatMoney(item.price)}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Срок публикации</div><div className="mt-2 text-xl font-semibold">{item.deadline}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase">Хранение</div><div className="mt-2 text-xl font-semibold">{item.storage}</div></Card>
        <Card className="p-5"><div className="text-xs text-[#476788] uppercase flex items-center gap-1">Медиалогия <Info className="w-3.5 h-3.5" /></div><div className="mt-2 text-xl font-semibold">#5</div><div className="text-xs text-[#476788] mt-1">общий рейтинг</div></Card>
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
          <div className="mt-5 rounded-lg bg-[#f8f9fb] border border-[#d4e0ed] p-4 text-sm text-[#476788]">
            Не принимаются запрещенные тематики, материалы без рекламодателя, внешние контакты в тексте и обещания гарантированного дохода.
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Администрирование</h2>
          <div className="space-y-3 text-sm">
            {[
              ['Паблишер', 'Редакция РБК Инвестиции'],
              ['Статус реквизитов', 'проверены'],
              ['Активных заказов', '4'],
              ['Открытых споров', '0'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-[#476788]">{label}</span>
                <span className="font-medium text-[#0b3558] text-right">{value}</span>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full mt-5" onClick={() => navigate('admin_users')}>Открыть паблишера</Button>
          <Button variant="secondary" className="w-full mt-3" onClick={() => navigate('admin_orders')}>Заказы площадки</Button>
          <div className="mt-4"><ActionResult text={result} /></div>
        </Card>
      </div>
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
    audit: { back: 'admin_audit', title: 'Событие #LOG-8841', badge: 'зафиксировано', fields: [['Сотрудник', 'moderator@axioma.ru'], ['Действие', 'Изменен статус материала'], ['Объект', '#M-1052'], ['Время', '19.10.2023, 13:42']], action: 'Открыть объект' },
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
  const [status, setStatus] = useState(row[3]);
  const [result, setResult] = useState('');
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
        text: 'Внешний сервис подтвердил существование юрлица и совпадение идентификаторов.',
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
            text: 'Запрос отправлен во внешний сервис. Результат применится автоматически после ответа API.',
            icon: Clock,
            color: 'amber',
          }
        : {
            title: 'Проверка не запускалась',
            text: 'Запустите автоматическую проверку юрлица через внешний сервис.',
            icon: Clock,
            color: 'gray',
          };
  const CheckIcon = checkState.icon;

  const requestCheck = () => {
    setStatus('Проверка запрошена');
    setResult('Запрос на проверку отправлен во внешний сервис. Статус обновится автоматически после ответа API.');
  };

  const blockAdvertiser = () => {
    setStatus('Заблокирован');
    setResult('Рекламодатель заблокирован и не может использоваться в данных для маркировки.');
  };

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
              Рекламодатель используется только в данных для маркировки. В админке проверяется факт существования юрлица и корректность идентификаторов: ИНН, КПП, ОГРН и юридического наименования.
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
            <h2 className="font-display text-base font-bold text-[#0b3558] mb-4">Автоматическая проверка</h2>
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
              <Button variant="primary" className="w-full" onClick={requestCheck}>Запросить проверку</Button>
              <Button variant="secondary" className="w-full text-red-600" onClick={blockAdvertiser}>Заблокировать</Button>
            </div>
            <div className="mt-4"><ActionResult text={result} tone={isBlocked ? 'error' : 'success'} /></div>
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
        related: 'Материал #M-1052',
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
        ? [['Статус получателя', 'Юридическое лицо'], ['Получатель', 'ООО Редакция'], ['ИНН', '7701000000'], ['КПП', '770101001'], ['ОГРН', '1237701000000'], ['Система налогообложения', 'ОСНО, НДС 20%'], ['Юридический адрес', '125009, Москва, ул. Тверская, 7']]
        : [['Статус плательщика', 'Юридическое лицо'], ['Юридическое название', 'ООО «Финтех Решения»'], ['ИНН', '7700000000'], ['КПП', '770001001'], ['ОГРН', '1237700000000'], ['Система налогообложения', 'ОСНО, НДС 20%'], ['Юридический адрес', '125009, Москва, ул. Тверская, 1']]
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
              ['РБК Телеграм', 'ТГ-канал', 'На проверке', '210 тыс. подписчиков', 'Нативный пост', '60 000 ₽'],
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
        <div className="overflow-x-auto"><table className="min-w-[900px] w-full divide-y divide-[#d4e0ed]"><thead className="bg-[#f8f9fb]"><tr>{['Заказ', 'Материал', 'Контрагент', 'Сумма', 'Статус', ''].map(head => <th key={head || 'action'} className="px-5 py-3 text-left text-xs text-[#476788] uppercase">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#d4e0ed]">{mockOrdersClient.slice(0, 4).map(order => <tr key={order.id} className="cursor-pointer hover:bg-[#f8f9fb]" onClick={() => navigate('admin_order_detail')}><td className="px-5 py-4 text-sm font-medium text-[#006bff]">#{order.id}</td><td className="px-5 py-4 text-sm">{order.material}</td><td className="px-5 py-4 text-sm text-[#476788]">{isPublisher ? `Заказчик #${order.id - 203}` : order.platform}</td><td className="px-5 py-4 text-sm font-medium">{formatMoney(order.price)}</td><td className="px-5 py-4"><Badge color={order.statusColor}>{order.status}</Badge></td><td className="px-5 py-4 text-right text-sm font-medium text-[#006bff]">Открыть</td></tr>)}</tbody></table></div>
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
  return (
  <div className="space-y-6">
    <div><h1 className="font-display text-2xl font-bold">Настройки админки</h1><p className="mt-1 text-sm text-[#476788]">Роли, уведомления и операционные параметры платформы.</p></div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <TeamAccessSettingsBlock description="Назначайте доступ к модерации, финансам и поддержке." members={[
        ['Модератор', 'moderator@axioma.ru', 'Модерация', 'активен', 'green'],
        ['Финансы', 'finance@axioma.ru', 'Финансы', 'активен', 'green'],
        ['Поддержка', 'support@axioma.ru', 'Поддержка', 'активен', 'green'],
      ]} />
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

export default function App() {
  // Режим интерфейса: лендинг, заказчик, площадка, админка
  const [globalMode, setGlobalMode] = useState('landing');

  // Состояние кабинета заказчика
	  const [clientView, setClientView] = useState('dashboard');
	  const [favoritePlatforms, setFavoritePlatforms] = useState([101, 102]);
	  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Состояние кабинета паблишера
  const [publisherView, setPublisherView] = useState('pub_dashboard');
  const [adminSelection, setAdminSelection] = useState(null);

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
    { id: 'pub_support', label: 'Поддержка', icon: MessageSquare },
    { id: 'pub_finance', label: 'Выплаты', icon: CreditCard },
    { id: 'pub_settings', label: 'Настройки', icon: Settings },
  ];

  const adminNav = [
    { id: 'admin_dashboard', label: 'Панель', icon: LayoutDashboard },
    { id: 'admin_moderation', label: 'Модерация', icon: ShieldCheck },
    { id: 'admin_orders', label: 'Заказы', icon: Briefcase },
    { id: 'admin_users', label: 'Пользователи', icon: Settings },
    { id: 'admin_advertisers', label: 'Рекламодатели', icon: Briefcase },
    { id: 'admin_platforms', label: 'Площадки', icon: Store },
    { id: 'admin_balances', label: 'Балансы', icon: CreditCard },
    { id: 'admin_operations', label: 'Операции', icon: Download },
    { id: 'admin_complaints', label: 'Жалобы', icon: AlertCircle },
    { id: 'admin_payouts', label: 'Выплаты', icon: Download },
    { id: 'admin_support', label: 'Поддержка', icon: MessageSquare },
    { id: 'admin_documents', label: 'Документы', icon: FileText },
    { id: 'admin_audit', label: 'Аудит', icon: ShieldCheck },
    { id: 'admin_settings', label: 'Настройки', icon: Settings },
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
  const notifications = isAdmin
    ? [
        ['Новый материал на модерации', 'Материал #M-1052 ожидает проверки', 'admin_moderation', 'blue'],
        ['Тикет с высоким приоритетом', 'Паблишер РБК Инвестиции ждет ответ по выплате', 'admin_support', 'red'],
        ['Выплата ожидает подтверждения', 'W-112 · 235 000 ₽ на выводе', 'admin_payouts', 'amber'],
      ]
    : isClient
      ? [
          ['Паблишер загрузил публикацию', 'Заказ #1045 ожидает приемки', 'order_detail', 'blue'],
          ['Открыт спор #C-020', 'Модератор запросил доказательства', 'dispute_detail', 'amber'],
          ['Баланс ниже лимита', 'Пополните баланс для новых заказов', 'topup', 'red'],
        ]
      : [
          ['Новый входящий заказ', 'Заказ #1048 ожидает решения паблишера', 'pub_order_new_detail', 'blue'],
          ['Заказ ожидает публикации', 'По заказу #1045 нужно загрузить ссылку', 'pub_order_detail', 'amber'],
          ['Открыт спор #C-020', 'Админ запросил доказательства паблишера', 'pub_dispute_detail', 'red'],
        ];
  const openNotificationTarget = (target) => {
    setNotificationsOpen(false);
    setView(target);
  };
  const parentViewByDetail = {
    admin_moderation_detail: 'admin_moderation',
    admin_order_detail: 'admin_orders',
    admin_order_chat: 'admin_orders',
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
    setAdminSelection({ section, row });
    setAdminView(route);
  };
  const openAdminPublisherProfile = (row) => {
    setAdminSelection({ section: 'admin_users', row });
    setAdminView('admin_user_detail');
  };
  const openAdminOrderById = (orderId) => {
    const row = mockAdminSections.admin_orders.rows.find((orderRow) => orderRow[0] === orderId) || mockAdminSections.admin_orders.rows[0];
    setAdminSelection({ section: 'admin_orders', row });
    setAdminView('admin_order_detail');
  };

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
        case 'order_pending_detail': return <ClientOrderDetailView navigate={setClientView} state="pending" />;
        case 'order_rejected_detail': return <ClientOrderDetailView navigate={setClientView} state="rejected" />;
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
        case 'pub_order_acceptance_detail': return <PublisherOrderDetailView navigate={setPublisherView} state="acceptance" />;
        case 'pub_order_new_detail': return <PublisherOrderDetailView navigate={setPublisherView} state="new" />;
        case 'pub_order_chat': return <OrderChatView navigate={setPublisherView} role="publisher" />;
        case 'pub_platforms': return <PublisherPlatformsView navigate={setPublisherView} />;
        case 'pub_platform_new': return <PublisherPlatformNewView navigate={setPublisherView} />;
        case 'pub_platform_detail': return <PublisherPlatformDetailView navigate={setPublisherView} />;
        case 'pub_publication': return <PublisherOrderDetailView navigate={setPublisherView} />;
        case 'pub_finance': return <PublisherFinanceView />;
        case 'pub_payout_request': return <PublisherPayoutRequestView navigate={setPublisherView} />;
        case 'pub_complaint': return <PublisherComplaintView navigate={setPublisherView} />;
        case 'pub_dispute_detail': return <DisputeDetailView navigate={setPublisherView} role="publisher" />;
        case 'pub_support': return <ClientSupportView navigate={setPublisherView} role="publisher" />;
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
        case 'admin_dashboard': return <AdminDashboardView navigate={setAdminView} />;
        case 'admin_moderation': return <AdminWorklistView section="admin_moderation" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_moderation_detail': return <AdminModerationDetailView navigate={setAdminView} selection={adminSelection} onOpenPublisher={openAdminPublisherProfile} />;
        case 'admin_orders': return <AdminWorklistView section="admin_orders" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_order_detail': return <AdminOrderDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_order_chat': return <OrderChatView navigate={setAdminView} role="admin" />;
        case 'admin_users': return <AdminWorklistView section="admin_users" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_user_detail': return <AdminUserDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_advertisers': return <AdminWorklistView section="admin_advertisers" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_advertiser_detail': return <AdminAdvertiserDetailView navigate={setAdminView} selection={adminSelection} onOpenOrder={openAdminOrderById} />;
        case 'admin_platforms': return <AdminPlatformsCatalogView navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_platform_detail': return <AdminPlatformDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_balances': return <AdminWorklistView section="admin_balances" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_finance_detail': return <AdminFinanceDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_operations': return <AdminWorklistView section="admin_operations" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_complaints': return <AdminWorklistView section="admin_complaints" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_dispute_detail': return <AdminDisputeDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_payouts': return <AdminWorklistView section="admin_payouts" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_payout_detail': return <AdminPayoutDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_support': return <AdminWorklistView section="admin_support" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_ticket_detail': return <AdminTicketDetailView navigate={setAdminView} selection={adminSelection} />;
        case 'admin_documents': return <AdminWorklistView section="admin_documents" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_document_detail': return <AdminEntityDetailView navigate={setAdminView} type="document" selection={adminSelection} />;
        case 'admin_audit': return <AdminWorklistView section="admin_audit" navigate={setAdminView} onSelect={openAdminDetail} />;
        case 'admin_audit_detail': return <AdminEntityDetailView navigate={setAdminView} type="audit" selection={adminSelection} />;
        case 'admin_settings': return <AdminSettingsView />;
        default: return <AdminDashboardView navigate={setAdminView} />;
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
          <span className="ml-2 text-[10px] uppercase font-medium px-2 py-0.5 rounded-full bg-[#f8f9fb] text-[#476788]">{isClient ? 'Заказчик' : isAdmin ? 'Админ' : 'Паблишер'}</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavView === item.id;
              
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
                {isClient ? 'ООО "Финтех"' : isAdmin ? 'Операционный доступ' : 'Паблишер #842'}
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
	                     <Badge color="blue">{notifications.length} новых</Badge>
	                   </div>
	                   {notifications.map(([title, text, target, color]) => (
	                     <button key={title} className="w-full text-left px-5 py-4 border-b border-[#d4e0ed] hover:bg-[#f8f9fb]" onClick={() => openNotificationTarget(target)}>
	                       <div className="flex items-start justify-between gap-3">
	                         <div>
	                           <div className="text-sm font-semibold text-[#0b3558]">{title}</div>
	                           <div className="text-xs text-[#476788] mt-1">{text}</div>
	                         </div>
	                         <Badge color={color}>новое</Badge>
	                       </div>
	                     </button>
	                   ))}
	                   <button className="w-full px-5 py-3 text-sm font-semibold text-[#006bff] hover:bg-[#f8f9fb]" onClick={() => openNotificationTarget(isAdmin ? 'admin_audit' : isClient ? 'support' : 'pub_support')}>Показать все</button>
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
