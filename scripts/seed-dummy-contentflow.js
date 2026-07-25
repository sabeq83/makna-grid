import { getDb, upsertContentFlowItem } from '../lib/db.js';

const sourceTypes = ['opc', 'strategic', 're', 'instant', 'recipe', 'bridge'];
const products = [
  'Serum Cokelat Glow',
  'Ceramide Moisturizer Cream',
  'Cocoa Powder Premium 500g',
  'Sunscreen SPF50 Invisible',
  'Choco Crunch Snack Pack',
  'Gentle Facial Cleanser'
];
const campaignTitles = [
  'Q3 Organic Skincare Growth',
  'Launch Serum Cokelat Anti-Aging',
  'Viral TikTok Challenge 2026',
  'Flash Sale Bundle Promo',
  'Recipe Review & Unboxing',
  'Affiliate Multiplier Campaign'
];

const hooks = [
  'Ternyata ini rahasia kulit glowing bebas kusam cuma dalam 7 hari!',
  'Stop beli serum mahal sebelum coba trik ampuh yang satu ini!',
  '3 Kesalahan pakai moisturizer yang bikin muka makin berminyak.',
  'Resep simpel 5 menit camilan manis cokelat lelehan disukai anak.',
  'Review jujur pemakaian 30 hari paket skincare viral TikTok!',
  'Rahasia makeup tahan seharian walaupun keringatan saat outdoor.',
  'Pernah ngalamin kulit breakout mendadak? Ini solusi cepatnya!',
  'Jangan skip sunscreen kalau gak mau muka cepat berflek hitam!'
];

const captions = [
  'Siapa yang masih suka bingung milih serum buat kulit sensitif? 🧐 Cobain rahasia kulit sehat pakai Serum Cokelat Glow ini guys! ✨ #skincareroutine #glowing #dummybrand #fyp #racuntiktok',
  'Jangan skip step ini kalau kamu mau hasil maksimal! Save dulu biar gak lupa ya 💖 #moisturizer #skincaretips #dummybrand #beautyhacks',
  'Bikin camilan sehat cuma pakai 3 bahan aja! Rasanya nyoklat banget 🍫 #resepsimpel #chococrunch #dummybrand #kuliner',
  'Spill promo spesial khusus minggu ini diskon up to 50%! Cek keranjang kuning sekarang 🛒 #promotiktok #dummybrand #diskonmurah',
  'Perbandingan sebelum dan sesudah 2 minggu rutin pemakaian. Hasilnya beneran sesuai ekspektasi! 😍 #transformation #dummybrand #honestreview'
];

const statuses = ['Not Published', 'Scheduled', 'Published'];
const pipelineStatuses = ['Completed', 'Completed', 'Completed', 'In Production'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysBack = 30) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString().split('T')[0];
}

console.log('🌱 Starting dummy data generator for brand "dummybrand"...');

let count = 0;
for (let i = 1; i <= 52; i++) {
  const sourceType = getRandomElement(sourceTypes);
  const prod = getRandomElement(products);
  const title = getRandomElement(campaignTitles);
  const hook = getRandomElement(hooks);
  const caption = getRandomElement(captions);
  const pipelineStatus = getRandomElement(pipelineStatuses);

  const tiktokStatus = getRandomElement(statuses);
  const fbStatus = getRandomElement(statuses);
  const igStatus = getRandomElement(statuses);

  const pDate = getRandomDate(20);
  const videoId = `${sourceType.toUpperCase()}-DUMMY-${String(i).padStart(3, '0')}`;

  const hasAsset = Math.random() > 0.15; // 85% ready asset
  const driveLink = hasAsset ? `https://drive.google.com/drive/folders/dummybrand_asset_${i}` : '';
  const nextcloudUrl = hasAsset ? `http://100.78.186.123:8080/remote.php/webdav/dummybrand/${videoId}.mp4` : '';
  const urlAsset = hasAsset ? driveLink : '';

  upsertContentFlowItem({
    id: `cf_dummy_${String(i).padStart(3, '0')}`,
    source_type: sourceType,
    source_campaign_id: `camp_dummy_${i}`,
    source_item_id: `item_dummy_${i}`,
    account_name: 'dummybrand',
    video_id: videoId,
    campaign_title: title,
    hook: hook,
    nama_produk: prod,
    link_affiliate: `https://vt.tiktok.com/dummybrand_${i}`,
    link_produk: `https://dummybrand.id/products/${prod.toLowerCase().replace(/\s+/g, '-')}`,
    caption: caption,
    production_date: pDate,
    url_asset: urlAsset,
    drive_link: driveLink,
    nextcloud_url: nextcloudUrl,
    pipeline_status: pipelineStatus,
    tiktok_status: tiktokStatus,
    tiktok_publish_date: tiktokStatus !== 'Not Published' ? pDate : null,
    permalink_tiktok: tiktokStatus === 'Published' ? `https://vt.tiktok.com/ZS_dummy_${i}/` : null,
    facebook_status: fbStatus,
    facebook_publish_date: fbStatus !== 'Not Published' ? pDate : null,
    permalink_facebook: fbStatus === 'Published' ? `https://facebook.com/reel/dummy_${i}` : null,
    instagram_status: igStatus,
    instagram_publish_date: igStatus !== 'Not Published' ? pDate : null,
    permalink_instagram: igStatus === 'Published' ? `https://instagram.com/reel/dummy_${i}` : null,
  });

  count++;
}

console.log(`✅ Berhasil membuat ${count} data dummy untuk akun "dummybrand"!`);
