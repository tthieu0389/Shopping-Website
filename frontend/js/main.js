// ── NAVBAR SHARED ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Active nav link
  const links = document.querySelectorAll('.nav-links a');
  const path = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(l => {
    if (l.getAttribute('href') === path) l.classList.add('active');
  });

  // Cart count from localStorage
  const cartCount = JSON.parse(localStorage.getItem('vnpt_cart') || '[]').length;
  const badge = document.querySelector('.cart-badge');
  if (badge) badge.textContent = cartCount || '0';

  // Wishlist heart toggle
  document.querySelectorAll('.wish-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      btn.classList.toggle('active');
      btn.innerHTML = btn.classList.contains('active') ? '❤️' : '🤍';
    });
  });

  // Add to cart buttons
  document.querySelectorAll('.btn-add, .btn-add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      let cart = JSON.parse(localStorage.getItem('vnpt_cart') || '[]');
      cart.push({ id: Date.now(), added: new Date().toISOString() });
      localStorage.setItem('vnpt_cart', JSON.stringify(cart));
      const b = document.querySelector('.cart-badge');
      if (b) b.textContent = cart.length;
      btn.textContent = '✓ Đã thêm!';
      btn.style.background = 'var(--success)';
      setTimeout(() => {
        btn.textContent = 'Mua ngay';
        btn.style.background = '';
      }, 1500);
    });
  });

  // Flash sale countdown
  startCountdown();

  // Quantity buttons
  const qtyMinus = document.querySelector('.qty-minus');
  const qtyPlus  = document.querySelector('.qty-plus');
  const qtyInput = document.querySelector('.qty-input');
  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      const v = parseInt(qtyInput.value);
      if (v > 1) qtyInput.value = v - 1;
    });
    qtyPlus.addEventListener('click', () => {
      qtyInput.value = parseInt(qtyInput.value) + 1;
    });
  }
});

function startCountdown() {
  const hEl = document.getElementById('t-h');
  const mEl = document.getElementById('t-m');
  const sEl = document.getElementById('t-s');
  if (!hEl) return;
  let h = 1, m = 47, s = 23;
  setInterval(() => {
    s--;
    if (s < 0) { s = 59; m--; }
    if (m < 0) { m = 59; h--; }
    if (h < 0) { h = 0; m = 0; s = 0; }
    hEl.textContent = String(h).padStart(2, '0');
    mEl.textContent = String(m).padStart(2, '0');
    sEl.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// ── PRODUCT DATA ───────────────────────────────────────────────────────────
const PRODUCTS = [
  { id:1, name:'iPhone 16 Pro Max 256GB', brand:'Apple', category:'dien-thoai', price:29990000, oldPrice:39990000, discount:25, rating:5, reviews:1248, sold:156, stock:200,
    img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=400&hei=400&fmt=jpeg',
    slug:'iphone-16-pro-max', desc:'Chip A18 Pro mạnh nhất từ trước đến nay. Camera 48MP chuyên nghiệp. Màn hình Super Retina XDR 6.9 inch.' },
  { id:2, name:'Samsung Galaxy S25 Ultra 512GB', brand:'Samsung', category:'dien-thoai', price:32990000, oldPrice:39990000, discount:17, rating:5, reviews:987, sold:89, stock:150,
    img:'https://images.samsung.com/vn/smartphones/galaxy-s25-ultra/images/galaxy-s25-ultra-highlights-color-titaniumblack.jpg',
    slug:'samsung-s25-ultra', desc:'Màn hình Dynamic AMOLED 6.9" QHD+. Chip Snapdragon 8 Elite. Pin 5000mAh sạc nhanh 45W.' },
  { id:3, name:'Xiaomi Redmi Note 13 Pro+ 5G', brand:'Xiaomi', category:'dien-thoai', price:7490000, oldPrice:10690000, discount:30, rating:5, reviews:2104, sold:180, stock:200,
    img:'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F/pms_1696326576.png',
    slug:'redmi-note-13-pro-plus', desc:'Camera 200MP đỉnh cao. Sạc siêu nhanh 120W HyperCharge. Màn hình AMOLED 120Hz.' },
  { id:4, name:'Samsung Galaxy Tab S9 FE 128GB', brand:'Samsung', category:'may-tinh-bang', price:11990000, oldPrice:14990000, discount:20, rating:4, reviews:847, sold:110, stock:200,
    img:'https://images.samsung.com/vn/tablets/galaxy-tab-s9-fe/images/galaxy-tab-s9-fe-highlights-color-graphite-back.jpg',
    slug:'galaxy-tab-s9-fe', desc:'Màn hình 10.9" TFT LCD sáng rõ. Chip Exynos 1380. Pin 8000mAh.' },
  { id:5, name:'Apple iPad Pro M4 11" Wi-Fi 256GB', brand:'Apple', category:'may-tinh-bang', price:26990000, oldPrice:29990000, discount:10, rating:5, reviews:432, sold:67, stock:100,
    img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-pro-model-select-gallery-2-202405?wid=400&hei=400&fmt=jpeg',
    slug:'ipad-pro-m4', desc:'Chip Apple M4 mạnh mẽ. Màn hình Ultra Retina XDR OLED. Mỏng nhất lịch sử Apple.' },
  { id:6, name:'Tai nghe AirPods Pro 2nd Gen', brand:'Apple', category:'tai-nghe', price:5990000, oldPrice:7490000, discount:20, rating:5, reviews:2341, sold:195, stock:200,
    img:'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=400&hei=400&fmt=jpeg',
    slug:'airpods-pro-2', desc:'Chống ồn chủ động ANC thế hệ 2. Âm thanh Spatial Audio. Pin 6h + 24h với hộp sạc.' },
  { id:7, name:'Samsung Galaxy Watch 6 Classic 47mm', brand:'Samsung', category:'dong-ho', price:8990000, oldPrice:10990000, discount:18, rating:4, reviews:543, sold:78, stock:120,
    img:'https://images.samsung.com/vn/smartphones/galaxy-watch6-classic/images/galaxy-watch6-classic-highlights-color-black.jpg',
    slug:'galaxy-watch-6-classic', desc:'Bezel xoay thực vật kinh điển. ECG & theo dõi sức khoẻ nâng cao. Pin 40h.' },
  { id:8, name:'OPPO Reno 12 Pro 5G 256GB', brand:'OPPO', category:'dien-thoai', price:13990000, oldPrice:16990000, discount:18, rating:4, reviews:671, sold:134, stock:180,
    img:'https://image.oppo.com/content/dam/oppo/product-asset-library/reno/reno12-pro/reno12-pro-overview/reno12-pro-kv.png',
    slug:'oppo-reno-12-pro', desc:'Camera portrait AI 50MP. Màn hình AMOLED 120Hz. Sạc nhanh SUPERVOOC 80W.' },
];

window.PRODUCTS = PRODUCTS;
