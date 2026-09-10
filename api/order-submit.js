const crypto = require('crypto');
const nodemailer = require('nodemailer');

const PRODUCTS = {
  'a-ya-vse-plakala': {name:'DOROFEEVA — А я все плакала', amount:100},
  'enkarapista': {name:'DREVO — Енкарапіста', amount:100},
  'zatsiluyu': {name:'Поль Манандіз — Зацілую', amount:100},
  'chervona-ruta': {name:'Володимир Івасюк — Червона рута', amount:100},
  'zelen-klen': {name:'Ігор Поклад — Юрій Рибчинський — Зелен клен', amount:100},
  'hey-nalyvay': {name:'PARACOM — Гей наливай', amount:100},
  'yevreiska-polka': {name:'Єврейська полька (Фрейлик 1)', amount:100},
  'polka-soloviy': {name:'Полька «Соловей»', amount:100},
  'ya-nikoly-nikomu-tebe-ne-viddam': {name:'Олександр Пономарьов — Я ніколи нікому тебе не віддам', amount:100},
  'ni-ya-ne-tu-kokhav': {name:'Анатолій Говорадло — Ні я не ту кохав', amount:100},
  'hay-zelenyy-hay': {name:'Назарій Яремчук — Гай зелений гай', amount:100},
};

function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function b64url(s){ return Buffer.from(s,'utf8').toString('base64url'); }
function sign(secret, payload){ return crypto.createHmac('sha256',secret).update(payload).digest('base64url'); }

module.exports = async (req,res) => {
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const productId=String(req.body?.product||'');
  const product=PRODUCTS[productId];
  const payerName=String(req.body?.payerName||'').trim();
  const email=String(req.body?.email||'').trim().toLowerCase();
  const note=String(req.body?.note||'').trim();
  const honeypot=String(req.body?.website||'').trim();
  if(honeypot) return res.status(200).json({ok:true});
  if(!product) return res.status(400).json({error:'Невідомий товар'});
  if(!payerName || payerName.length>80) return res.status(400).json({error:'Вкажіть ім’я платника'});
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>180) return res.status(400).json({error:'Вкажіть правильний email'});
  if(note.length>120) return res.status(400).json({error:'Коментар занадто довгий'});

  const siteUrl=String(process.env.SITE_URL||'').replace(/\/+$/,'');
  const adminEmail=process.env.ADMIN_EMAIL;
  const adminSecret=process.env.ADMIN_SECRET;
  const host=process.env.SMTP_HOST, port=Number(process.env.SMTP_PORT||465);
  const secure=String(process.env.SMTP_SECURE||'true').toLowerCase()==='true';
  const user=process.env.SMTP_USER, pass=process.env.SMTP_PASS, from=process.env.MAIL_FROM||user;
  if(!siteUrl || !adminEmail || !adminSecret || !host || !user || !pass || !from)
    return res.status(500).json({error:'Система повідомлень ще не налаштована адміністратором.'});

  const order={product:productId,email,payerName,note,amount:product.amount,exp:Date.now()+7*24*60*60*1000};
  const payload=b64url(JSON.stringify(order));
  const token=payload+'.'+sign(adminSecret,payload);
  const confirmUrl=`${siteUrl}/api/order-confirm?token=${encodeURIComponent(token)}`;

  const transporter=nodemailer.createTransport({host,port,secure,auth:{user,pass}});
  await transporter.sendMail({
    from,to:adminEmail,
    subject:`Нова оплата SAX UKRAINE — ${product.name}`,
    text:`Нова заявка після оплати\n\nТвір: ${product.name}\nСума: ${product.amount} грн\nІм'я платника: ${payerName}\nEmail покупця: ${email}\nКоментар: ${note||'—'}\n\nПеревірте надходження у Конверті Приват24. Якщо оплата є, відкрийте посилання і натисніть підтвердження:\n${confirmUrl}`,
    html:`<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:620px">
      <h2>🎷 Нова заявка SAX UKRAINE</h2>
      <p><b>Твір:</b> ${esc(product.name)}<br><b>Сума:</b> ${product.amount} грн<br><b>Ім’я платника:</b> ${esc(payerName)}<br><b>Email:</b> ${esc(email)}<br><b>Коментар:</b> ${esc(note||'—')}</p>
      <p><b>1.</b> Перевірте надходження у Конверті Приват24.<br><b>2.</b> Якщо оплата є — відкрийте кнопку нижче й підтвердьте відправку.</p>
      <p><a href="${confirmUrl}" style="display:inline-block;background:#ffd84d;color:#111827;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:10px">Перевірити та підтвердити</a></p>
      <p style="color:#667;font-size:12px">Посилання діє 7 днів. Сам перехід за посиланням ще не відправляє файли — потрібно натиснути підтвердження на наступній сторінці.</p>
    </div>`
  });
  return res.status(200).json({ok:true});
};
