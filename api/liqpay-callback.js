const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const querystring = require('querystring');

const PRODUCTS = {
  'a-ya-vse-plakala': {
    amount: 100,
    name: 'DOROFEEVA — А я все плакала',
    pdf:'a-ya-vse-plakala-noty.pdf',
    mp3:'a-ya-vse-plakala-minus.mp3'
  },
  'enkarapista': {
    amount: 100,
    name: 'DREVO — Енкарапіста',
    pdf:'enkarapista-noty.pdf',
    mp3:'enkarapista-minus.mp3'
  }
};

function sign(privateKey, data) {
  const algo = process.env.LIQPAY_SIGNATURE_ALGO || 'sha1';
  return crypto.createHash(algo).update(privateKey + data + privateKey, 'utf8').digest('base64');
}
function safeEq(a,b){ const A=Buffer.from(String(a||'')),B=Buffer.from(String(b||'')); return A.length===B.length && crypto.timingSafeEqual(A,B); }
async function getBody(req){
  if(req.body && typeof req.body==='object') return req.body;
  if(typeof req.body==='string') return querystring.parse(req.body);
  let raw=''; for await(const chunk of req) raw+=chunk;
  return querystring.parse(raw);
}

module.exports = async (req,res) => {
  if(req.method!=='POST') return res.status(405).send('Method not allowed');
  const privateKey=process.env.LIQPAY_PRIVATE_KEY, publicKey=process.env.LIQPAY_PUBLIC_KEY;
  if(!privateKey || !publicKey) return res.status(500).send('Not configured');

  const body=await getBody(req), data=body.data, signature=body.signature;
  if(!data || !signature) return res.status(400).send('Bad callback');
  if(!safeEq(signature,sign(privateKey,data))) return res.status(403).send('Invalid signature');

  let payment; try { payment=JSON.parse(Buffer.from(data,'base64').toString('utf8')); } catch { return res.status(400).send('Invalid data'); }
  if(payment.public_key!==publicKey) return res.status(403).send('Wrong merchant');
  if(payment.status!=='success') return res.status(200).send('ok');

  let info={}; try{info=JSON.parse(payment.info||'{}')}catch{}
  const product=PRODUCTS[info.product];
  if(!product) return res.status(400).send('Wrong product');
  if(payment.currency!=='UAH' || Number(payment.amount)!==product.amount) return res.status(400).send('Wrong amount');

  const email=String(info.email||'').trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).send('Wrong email');

  const host=process.env.SMTP_HOST, port=Number(process.env.SMTP_PORT||465);
  const secure=String(process.env.SMTP_SECURE||'true').toLowerCase()==='true';
  const user=process.env.SMTP_USER, pass=process.env.SMTP_PASS, from=process.env.MAIL_FROM||user;
  if(!host || !user || !pass || !from) return res.status(500).send('Mail not configured');

  const pdf=path.join(process.cwd(),'private-products',product.pdf);
  const mp3=path.join(process.cwd(),'private-products',product.mp3);
  if(!fs.existsSync(pdf)||!fs.existsSync(mp3)) return res.status(500).send('Files missing');

  const transporter=nodemailer.createTransport({host,port,secure,auth:{user,pass}});
  await transporter.sendMail({
    from,to:email,
    subject:`Ваші ноти — ${product.name}`,
    text:`Дякуємо за покупку!\n\nУ вкладенні: ноти PDF та повна мінусовка MP3.\n\n${product.name}\nSAX UKRAINE`,
    attachments:[
      {filename:`${product.name} - ноти.pdf`,path:pdf},
      {filename:`${product.name} - мінусовка.mp3`,path:mp3}
    ]
  });
  return res.status(200).send('ok');
};