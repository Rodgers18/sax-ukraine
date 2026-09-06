const crypto = require('crypto');

const PRODUCTS = {
  'a-ya-vse-plakala': {
    amount: 100,
    name: 'DOROFEEVA — А я все плакала',
    description: 'Ноти для альт-саксофона PDF + мінусовка MP3'
  },
  'enkarapista': {
    amount: 100,
    name: 'DREVO — Енкарапіста',
    description: 'Ноти для альт-саксофона PDF + мінусовка MP3'
  }
};

function sign(privateKey, data) {
  const algo = process.env.LIQPAY_SIGNATURE_ALGO || 'sha1';
  return crypto.createHash(algo).update(privateKey + data + privateKey, 'utf8').digest('base64');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const publicKey = process.env.LIQPAY_PUBLIC_KEY;
  const privateKey = process.env.LIQPAY_PRIVATE_KEY;
  const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/,'');
  if (!publicKey || !privateKey || !siteUrl) return res.status(500).json({error:'Оплата ще не активована адміністратором сайту.'});

  const email = String(req.body?.email || '').trim().toLowerCase();
  const productId = String(req.body?.product || '');
  const product = PRODUCTS[productId];
  if (!product) return res.status(400).json({error:'Невідомий товар'});
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) return res.status(400).json({error:'Вкажіть правильний email'});

  const orderId = `SAX-${productId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const payload = {
    public_key: publicKey, version: 7, action:'pay',
    amount: product.amount, currency:'UAH',
    description: `${product.name}: ${product.description}`,
    order_id: orderId, language:'uk',
    result_url: `${siteUrl}/success.html`,
    server_url: `${siteUrl}/api/liqpay-callback`,
    product_name: product.name,
    product_category:'digital_music',
    product_description: product.description,
    info: JSON.stringify({email, product: productId})
  };
  const data = Buffer.from(JSON.stringify(payload),'utf8').toString('base64');
  return res.status(200).json({data, signature:sign(privateKey,data)});
};