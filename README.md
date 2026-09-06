# SAX UKRAINE — готовий магазин

У проекті вже зроблено:

- каталог товару **DOROFEEVA — «А я все плакала»**;
- ціна **100 грн**;
- публічний аудіоплеєр із демо;
- форма email перед оплатою;
- перехід на захищений Checkout LiqPay / ПриватБанк;
- перевірка callback-підпису LiqPay;
- перевірка статусу `success`, суми 100 UAH та товару;
- автоматичне надсилання **PDF нот + повної MP3 мінусовки** на email покупця;
- повні файли лежать поза `public/` і не доступні напряму з сайту.

## Чому не GitHub Pages

GitHub Pages запускає лише статичні HTML/CSS/JS. Для автоматичної перевірки оплати та відправки файлів потрібна серверна частина. Цей проект підготовлено для **Vercel**.

## Що потрібно один раз заповнити

### 1. LiqPay
Створіть/активуйте магазин у LiqPay і візьміть:
- `public_key`
- `private_key`

У Vercel → Project → Settings → Environment Variables додайте:
- `LIQPAY_PUBLIC_KEY`
- `LIQPAY_PRIVATE_KEY`

### 2. Адреса сайту
Після першого деплою скопіюйте домен Vercel і додайте:
- `SITE_URL=https://ваш-сайт.vercel.app`

Після зміни змінних зробіть Redeploy.

### 3. Email-відправка
Для Gmail:
- увімкніть двофакторну автентифікацію Google;
- створіть окремий **App Password** для пошти;
- НЕ використовуйте звичайний пароль від Google.

Environment Variables:
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=ваша_пошта@gmail.com`
- `SMTP_PASS=app_password`
- `MAIL_FROM=SAX UKRAINE <ваша_пошта@gmail.com>`

## Підпис LiqPay
У коді алгоритм задається змінною `LIQPAY_SIGNATURE_ALGO`. У поточній документації LiqPay трапляється SHA3-256, тоді як офіційні SDK/приклади також містять SHA1. Тому алгоритм винесено в налаштування.

За замовчуванням:
`LIQPAY_SIGNATURE_ALGO=sha1`

Якщо у вашому кабінеті/актуальній документації для мерчанта вказано SHA3:
`LIQPAY_SIGNATURE_ALGO=sha3-256`

## Файли товару

Публічно:
`public/assets/a-ya-vse-plakala-demo.mp3`

Приватно, для відправки після успішної оплати:
`private-products/a-ya-vse-plakala-noty.pdf`
`private-products/a-ya-vse-plakala-minus.mp3`

Не переносіть повні файли в `public/`.

## Деплой на Vercel

1. Розпакуйте ZIP.
2. Завантажте проект у GitHub.
3. На Vercel виберіть **Add New → Project** і імпортуйте репозиторій.
4. Framework Preset: **Other**.
5. Додайте Environment Variables з `.env.example`.
6. Deploy.
7. Після отримання адреси сайту встановіть правильний `SITE_URL` та зробіть Redeploy.
8. Зробіть тестову покупку в тестовому/дозволеному режимі LiqPay перед запуском реальних продажів.

## Важливо

IBAN-переказ сам по собі не дає надійного автоматичного callback про оплату. Автовідправка у цьому проекті працює через підтверджений callback LiqPay.

Секретні ключі LiqPay і пароль SMTP ніколи не вставляйте в HTML або GitHub-репозиторій.
