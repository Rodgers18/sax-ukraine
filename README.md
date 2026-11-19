# SAX UKRAINE — версія з Конвертом Приват24

## Як працює

1. Покупець слухає демо та переглядає заблюрені ноти.
2. Натискає **«Оплатити через Приват24»** і сплачує 100 грн у Конверт SAX UKRAINE.
3. Повертається на сайт, вводить ім’я платника та email і натискає **«Я оплатив»**.
4. На `ADMIN_EMAIL` приходить лист із даними замовлення та кнопкою підтвердження.
5. Ви перевіряєте надходження у Приват24, відкриваєте кнопку з листа і ще раз натискаєте **«Оплата є — відправити»**.
6. Сайт автоматично прикріплює правильний PDF + MP3 і надсилає покупцю.

Сам перехід за посиланням із листа НЕ відправляє файли: потрібне окреме ручне підтвердження. Це захищає від автоматичного відкриття посилань поштовими сканерами.

## Що змінити у Vercel

У `Settings → Environment Variables` додайте:

- `SITE_URL` — ваша реальна Vercel-адреса, наприклад `https://sax-ukraine.vercel.app`
- `ADMIN_EMAIL` — email, куди приходять заявки про оплату
- `ADMIN_SECRET` — довга випадкова секретна строка (не публікуйте в GitHub)
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `465`
- `SMTP_SECURE` = `true`
- `SMTP_USER` — Gmail, з якого сайт надсилатиме листи
- `SMTP_PASS` — App Password Google, не звичайний пароль
- `MAIL_FROM` — наприклад `SAX UKRAINE <yourmail@gmail.com>`

Після збереження змінних зробіть **Redeploy**.

## Оновлення вже існуючого GitHub/Vercel

Замініть у тому ж репозиторії файли з цього архіву і зробіть commit/push. Vercel автоматично запустить новий deploy. Новий проект створювати не потрібно.

## Безпека

- На сайті використовується тільки публічне посилання Конверта Приват24.
- Повні PDF/MP3 залишаються у `private-products/` і не відкриваються як публічні URL.
- `ADMIN_SECRET` та `SMTP_PASS` не додавайте в GitHub.

## Додано 7 вересня 2026
- Володимир Івасюк — «Червона рута» для альт-саксофона, 100 грн.


## Додано: Зелен клен
- Ігор Поклад — Юрій Рибчинський
- Альт-саксофон
- PDF + MP3, демо
- Ціна: 100 грн
- Сторінка: `/zelen-klen-saxophone.html`

## Додано: Гей наливай
- PARACOM — «Гей наливай»
- Альт-саксофон
- PDF + MP3, демо
- Ціна: 100 грн
- Сторінка: `/hey-nalyvay-saxophone.html`


## Додано 8 вересня 2026
- Єврейська полька (Фрейлик 1): PDF, повна мінусовка MP3, демо, сторінка товару.
- Полька «Соловій»: PDF, повна мінусовка MP3, демо, сторінка товару.

## Додано 17 листопада 2026
- ШУГАР — «Німесіл», ціна 100 грн. Ноти PDF із логотипом SAX UKRAINE, MP3-конверсія повного WAV і наданий демозапис без змін.
- Сторінка `/shugar-nimesil-saxophone.html`. Відправлення повних PDF+MP3 після підтвердження платежу в адмін-листі.

## Додано 19 листопада 2026 — DOROFEEVA, труба B♭
- Каталог: `/noty-dlya-truby.html`, товар: `/a-ya-vse-plakala-trumpet.html`.
- Публічні файли: `public/assets/a-ya-vse-plakala-trumpet-demo.mp3`, `public/assets/a-ya-vse-plakala-trumpet-preview-blur.png`.
- Приватні файли: `private-products/a-ya-vse-plakala-trumpet-noty.pdf`, `private-products/a-ya-vse-plakala-trumpet-minus.mp3`.
- Ціна 100 грн. Саксофонна версія і старі товари не змінені.

## Новий товар для труби B♭ — DREVO «Енкарапіста» (19.11.2026)
- Каталог: `public/noty-dlya-truby.html`, сторінка: `public/enkarapista-trumpet.html`.
- Демо: `public/assets/enkarapista-trumpet-demo.mp3`; заблюрене прев’ю: `public/assets/enkarapista-trumpet-preview-blur.png`.
- Приватні файли: `private-products/enkarapista-trumpet-noty.pdf` (труба B♭) і `private-products/enkarapista-trumpet-minus.mp3`.
- Ціна: 100 грн; доставка PDF + MP3 після підтвердження оплати.
