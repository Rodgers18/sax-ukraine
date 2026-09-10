const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const querystring = require('querystring');

const PRODUCTS = {
  'a-ya-vse-plakala': {name:'DOROFEEVA — А я все плакала', amount:100, pdf:'a-ya-vse-plakala-noty.pdf', mp3:'a-ya-vse-plakala-minus.mp3'},
  'enkarapista': {name:'DREVO — Енкарапіста', amount:100, pdf:'enkarapista-noty.pdf', mp3:'enkarapista-minus.mp3'},
  'zatsiluyu': {name:'Поль Манандіз — Зацілую', amount:100, pdf:'zatsiluyu-noty.pdf', mp3:'zatsiluyu-minus.mp3'},
  'chervona-ruta': {name:'Володимир Івасюк — Червона рута', amount:100, pdf:'chervona-ruta-noty.pdf', mp3:'chervona-ruta-minus.mp3'},
  'zelen-klen': {name:'Ігор Поклад — Юрій Рибчинський — Зелен клен', amount:100, pdf:'zelen-klen-noty.pdf', mp3:'zelen-klen-minus.mp3'},
  'hey-nalyvay': {name:'PARACOM — Гей наливай', amount:100, pdf:'hey-nalyvay-noty.pdf', mp3:'hey-nalyvay-minus.mp3'},
  'yevreiska-polka': {name:'Єврейська полька (Фрейлик 1)', amount:100, pdf:'yevreiska-polka-noty.pdf', mp3:'yevreiska-polka-minus.mp3'},
  'polka-soloviy': {name:'Полька «Соловей»', amount:100, pdf:'polka-soloviy-noty.pdf', mp3:'polka-soloviy-minus.mp3'},
  'ya-nikoly-nikomu-tebe-ne-viddam': {name:'Олександр Пономарьов — Я ніколи нікому тебе не віддам', amount:100, pdf:'ya-nikoly-nikomu-tebe-ne-viddam-noty.pdf', mp3:'ya-nikoly-nikomu-tebe-ne-viddam-minus.mp3'},
  'ni-ya-ne-tu-kokhav': {name:'Анатолій Говорадло — Ні я не ту кохав', amount:100, pdf:'ni-ya-ne-tu-kokhav-noty.pdf', mp3:'ni-ya-ne-tu-kokhav-minus.mp3'},
  'hay-zelenyy-hay': {name:'Назарій Яремчук — Гай зелений гай', amount:100, pdf:'hay-zelenyy-hay-noty.pdf', mp3:'hay-zelenyy-hay-minus.mp3'},
};
function sign(secret,payload){ return crypto.createHmac('sha256',secret).update(payload).digest('base64url'); }
function safeEq(a,b){ const A=Buffer.from(String(a||'')),B=Buffer.from(String(b||'')); return A.length===B.length && crypto.timingSafeEqual(A,B); }
function esc(s=''){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function verify(token,secret){
  if(!token || !secret) throw new Error('invalid');
  const parts=String(token).split('.'); if(parts.length!==2) throw new Error('invalid');
  const [payload,sig]=parts; if(!safeEq(sig,sign(secret,payload))) throw new Error('invalid');
  const data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));
  if(!data.exp || Date.now()>Number(data.exp)) throw new Error('expired');
  return data;
}
async function getBody(req){
  if(req.body && typeof req.body==='object') return req.body;
  if(typeof req.body==='string') return querystring.parse(req.body);
  let raw=''; for await(const c of req) raw+=c; return querystring.parse(raw);
}
function page(title, body){ return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{margin:0;background:#07111f;color:#f6fbff;font-family:system-ui,Segoe UI,Arial;display:grid;place-items:center;min-height:100vh}.box{width:min(620px,calc(100% - 32px));padding:30px;border:1px solid #243c58;border-radius:22px;background:#0d1b2c}.muted{color:#aab9ca;line-height:1.6}button{background:#ffd84d;color:#111827;border:0;border-radius:12px;padding:14px 18px;font-weight:900;cursor:pointer}.danger{color:#ffabab}</style></head><body><div class="box">${body}</div></body></html>`; }

module.exports = async (req,res) => {
  const secret=process.env.ADMIN_SECRET;
  let token='';
  if(req.method==='GET') token=String(req.query?.token||'');
  else if(req.method==='POST') { const body=await getBody(req); token=String(body.token||''); }
  else return res.status(405).send('Method not allowed');

  let order; try{ order=verify(token,secret); }catch(e){ return res.status(400).send(page('Недійсне посилання','<h2>Посилання недійсне або прострочене</h2><p class="muted">Поверніться до листа із замовленням.</p>')); }
  const product=PRODUCTS[order.product];
  if(!product || Number(order.amount)!==product.amount) return res.status(400).send(page('Помилка','<h2>Невідоме замовлення</h2>'));

  if(req.method==='GET'){
    return res.status(200).send(page('Підтвердження оплати',`<h2>Підтвердити відправку?</h2><p class="muted"><b>Твір:</b> ${esc(product.name)}<br><b>Сума:</b> ${product.amount} грн<br><b>Ім’я платника:</b> ${esc(order.payerName)}<br><b>Email покупця:</b> ${esc(order.email)}<br><b>Коментар:</b> ${esc(order.note||'—')}</p><p class="muted">Спочатку перевірте, що оплата 100 грн дійсно надійшла у Конверт Приват24.</p><form method="post"><input type="hidden" name="token" value="${esc(token)}"><button type="submit">✅ Оплата є — відправити PDF + MP3</button></form>`));
  }

  const host=process.env.SMTP_HOST, port=Number(process.env.SMTP_PORT||465);
  const secure=String(process.env.SMTP_SECURE||'true').toLowerCase()==='true';
  const user=process.env.SMTP_USER, pass=process.env.SMTP_PASS, from=process.env.MAIL_FROM||user;
  if(!host || !user || !pass || !from) return res.status(500).send(page('Не налаштовано','<h2>Пошта не налаштована</h2>'));
  const pdf=path.join(process.cwd(),'private-products',product.pdf);
  const mp3=path.join(process.cwd(),'private-products',product.mp3);
  if(!fs.existsSync(pdf)||!fs.existsSync(mp3)) return res.status(500).send(page('Файли відсутні','<h2>Файли товару не знайдено</h2>'));

  const transporter=nodemailer.createTransport({host,port,secure,auth:{user,pass}});
  await transporter.sendMail({
    from,to:order.email,
    subject:`Ваші ноти — ${product.name}`,
    text:`Дякуємо за покупку!\n\nУ вкладенні: ноти PDF та повна мінусовка MP3.\n\n${product.name}\nSAX UKRAINE`,
    html:`<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>🎷 Дякуємо за покупку!</h2><p>Ваш комплект <b>${esc(product.name)}</b> готовий.</p><p>У вкладенні: <b>ноти PDF</b> та <b>повна мінусовка MP3</b>.</p><p>SAX UKRAINE</p></div>`,
    attachments:[
      {filename:`${product.name} - ноти.pdf`,path:pdf},
      {filename:`${product.name} - мінусовка.mp3`,path:mp3}
    ]
  });
  return res.status(200).send(page('Відправлено',`<h2>✅ Файли відправлено</h2><p class="muted">${esc(product.name)} надіслано на <b>${esc(order.email)}</b>.</p>`));
};
