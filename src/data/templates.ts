export type TemplateKey = 'landing' | 'dashboard' | 'ecommerce'

export const TEMPLATES: Record<TemplateKey, string> = {
  landing: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#0a0a12;color:#e4e4ef;min-height:100vh}
.nav{display:flex;align-items:center;justify-content:space-between;padding:20px 60px;border-bottom:1px solid rgba(255,255,255,.08)}
.logo{font-size:20px;font-weight:700;color:#7c6fff}
.nav-links{display:flex;gap:32px;list-style:none}
.nav-links a{color:#888;text-decoration:none;font-size:14px;transition:color .2s}
.nav-links a:hover{color:#fff}
.btn-nav{padding:8px 20px;border:1px solid #7c6fff;border-radius:8px;color:#7c6fff;background:transparent;font-size:13px;cursor:pointer;transition:all .2s}
.btn-nav:hover{background:#7c6fff;color:#fff}
.hero{text-align:center;padding:100px 60px 60px}
.hero-tag{display:inline-block;padding:5px 14px;border:1px solid rgba(124,111,255,.4);border-radius:20px;font-size:12px;color:#7c6fff;margin-bottom:24px;letter-spacing:.05em}
h1{font-size:62px;font-weight:800;line-height:1.1;margin-bottom:20px;background:linear-gradient(135deg,#fff 40%,#7c6fff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{font-size:18px;color:#888;max-width:540px;margin:0 auto 40px;line-height:1.6}
.hero-btns{display:flex;gap:12px;justify-content:center}
.btn-primary{padding:14px 32px;border-radius:12px;border:none;background:#7c6fff;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s}
.btn-primary:hover{opacity:.85}
.btn-secondary{padding:14px 32px;border-radius:12px;border:1px solid rgba(255,255,255,.15);color:#ccc;background:transparent;font-size:15px;cursor:pointer;transition:all .2s}
.btn-secondary:hover{border-color:#fff;color:#fff}
.features{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:60px;max-width:1100px;margin:0 auto}
.card{background:#14141e;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px}
.card-icon{font-size:28px;margin-bottom:14px}
.card h3{font-size:17px;font-weight:600;margin-bottom:8px}
.card p{font-size:14px;color:#888;line-height:1.6}
</style></head><body>
<nav class="nav"><div class="logo">Приложение</div><ul class="nav-links"><li><a href="#">Возможности</a></li><li><a href="#">Цены</a></li><li><a href="#">Блог</a></li></ul><button class="btn-nav">Начать →</button></nav>
<section class="hero"><div class="hero-tag">✦ Новый уровень продуктивности</div><h1>Делай больше<br>за меньше<br>времени</h1><p class="hero-sub">Умный инструмент для управления задачами, командами и проектами. Всё в одном месте.</p><div class="hero-btns"><button class="btn-primary">Попробовать бесплатно</button><button class="btn-secondary">Смотреть демо</button></div></section>
<section class="features"><div class="card"><div class="card-icon">⚡</div><h3>Молниеносная скорость</h3><p>Всё работает мгновенно. Никаких загрузок и ожиданий.</p></div><div class="card"><div class="card-icon">🎨</div><h3>Красивый дизайн</h3><p>Интуитивный интерфейс, который приятно использовать каждый день.</p></div><div class="card"><div class="card-icon">🔒</div><h3>Полная безопасность</h3><p>Ваши данные зашифрованы и надёжно защищены.</p></div></section>
</body></html>`,

  dashboard: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;display:flex;background:#f5f6fa;color:#1a1a2e;min-height:100vh}
.sidebar{width:220px;background:#1a1a2e;padding:24px 0;display:flex;flex-direction:column;flex-shrink:0}
.sidebar-logo{padding:0 20px 24px;font-size:18px;font-weight:700;color:#7c6fff;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:16px}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 20px;color:#888;font-size:13px;cursor:pointer;transition:all .15s}
.nav-item:hover{background:rgba(255,255,255,.05);color:#fff}
.nav-item.active{background:rgba(124,111,255,.15);color:#7c6fff;border-right:2px solid #7c6fff}
.nav-icon{font-size:16px}
.content{flex:1;padding:28px;overflow-y:auto}
.page-title{font-size:22px;font-weight:700;margin-bottom:4px}
.page-sub{font-size:13px;color:#888;margin-bottom:24px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.stat-label{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.stat-value{font-size:28px;font-weight:700;margin-bottom:4px}
.stat-delta{font-size:12px;color:#3ecf8e}
.charts{display:grid;grid-template-columns:2fr 1fr;gap:16px}
.chart-card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.chart-title{font-size:14px;font-weight:600;margin-bottom:16px}
.bar-group{display:flex;align-items:flex-end;gap:6px;height:120px;margin-bottom:8px}
.bar{background:#7c6fff;border-radius:4px 4px 0 0;flex:1;opacity:.8;transition:opacity .2s;cursor:pointer}
.bar:hover{opacity:1}
.bar-labels{display:flex;gap:6px;font-size:11px;color:#888}
.bar-label{flex:1;text-align:center}
.list-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0}
.list-item:last-child{border-bottom:none}
.list-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7c6fff,#a78bfa);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;flex-shrink:0}
.list-info{flex:1}
.list-name{font-size:13px;font-weight:500}
.list-detail{font-size:11px;color:#888}
.list-value{font-size:13px;font-weight:600;color:#7c6fff}
</style></head><body>
<aside class="sidebar"><div class="sidebar-logo">📊 Analytics</div>
<div class="nav-item active"><span class="nav-icon">🏠</span>Обзор</div>
<div class="nav-item"><span class="nav-icon">📈</span>Статистика</div>
<div class="nav-item"><span class="nav-icon">👥</span>Пользователи</div>
<div class="nav-item"><span class="nav-icon">💰</span>Доходы</div>
<div class="nav-item"><span class="nav-icon">⚙️</span>Настройки</div></aside>
<main class="content"><div class="page-title">Дашборд</div><div class="page-sub">Обновлено только что · Март 2026</div>
<div class="stats">
<div class="stat-card"><div class="stat-label">Пользователи</div><div class="stat-value">12,847</div><div class="stat-delta">↑ 12% за месяц</div></div>
<div class="stat-card"><div class="stat-label">Доход</div><div class="stat-value">₽ 842K</div><div class="stat-delta">↑ 8% за месяц</div></div>
<div class="stat-card"><div class="stat-label">Конверсия</div><div class="stat-value">3.4%</div><div class="stat-delta">↑ 0.3% за месяц</div></div>
<div class="stat-card"><div class="stat-label">NPS</div><div class="stat-value">68</div><div class="stat-delta">↑ 5 пунктов</div></div></div>
<div class="charts">
<div class="chart-card"><div class="chart-title">Активность за неделю</div>
<div class="bar-group">
<div class="bar" style="height:40%"></div><div class="bar" style="height:65%"></div>
<div class="bar" style="height:55%"></div><div class="bar" style="height:90%"></div>
<div class="bar" style="height:70%"></div><div class="bar" style="height:85%"></div>
<div class="bar" style="height:60%"></div></div>
<div class="bar-labels"><div class="bar-label">Пн</div><div class="bar-label">Вт</div><div class="bar-label">Ср</div><div class="bar-label">Чт</div><div class="bar-label">Пт</div><div class="bar-label">Сб</div><div class="bar-label">Вс</div></div></div>
<div class="chart-card"><div class="chart-title">Топ пользователи</div>
<div class="list-item"><div class="list-avatar">А</div><div class="list-info"><div class="list-name">Алексей М.</div><div class="list-detail">312 действий</div></div><div class="list-value">Pro</div></div>
<div class="list-item"><div class="list-avatar">М</div><div class="list-info"><div class="list-name">Мария К.</div><div class="list-detail">287 действий</div></div><div class="list-value">Pro</div></div>
<div class="list-item"><div class="list-avatar">И</div><div class="list-info"><div class="list-name">Иван С.</div><div class="list-detail">203 действия</div></div><div class="list-value">Free</div></div>
</div></div></main></body></html>`,

  ecommerce: `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#fafafa;color:#1a1a1a}
header{background:#fff;border-bottom:1px solid #eee;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
.logo{font-size:20px;font-weight:800;color:#111}
.logo span{color:#7c6fff}
.search{display:flex;align-items:center;flex:1;max-width:400px;margin:0 32px;background:#f5f5f5;border-radius:10px;padding:0 14px;gap:8px}
.search input{flex:1;border:none;background:transparent;padding:10px 0;font-size:14px;outline:none}
.header-actions{display:flex;align-items:center;gap:20px}
.action-btn{background:none;border:none;cursor:pointer;font-size:20px;position:relative}
.badge{position:absolute;top:-6px;right:-6px;width:18px;height:18px;background:#7c6fff;color:#fff;border-radius:50%;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
.banner{background:linear-gradient(135deg,#7c6fff,#a78bfa);padding:60px 40px;color:#fff;display:flex;justify-content:space-between;align-items:center}
.banner-text h1{font-size:44px;font-weight:800;line-height:1.15;margin-bottom:12px}
.banner-text p{font-size:16px;opacity:.85;margin-bottom:28px}
.btn-white{padding:13px 28px;border-radius:10px;border:none;background:#fff;color:#7c6fff;font-size:15px;font-weight:700;cursor:pointer}
.banner-img{font-size:100px;opacity:.15}
.section{padding:40px}
.section-title{font-size:20px;font-weight:700;margin-bottom:20px}
.products{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.product{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer;transition:transform .2s,box-shadow .2s}
.product:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.1)}
.product-img{aspect-ratio:4/3;background:linear-gradient(135deg,#ede9fe,#ddd6fe);display:flex;align-items:center;justify-content:center;font-size:48px}
.product-info{padding:14px}
.product-name{font-size:14px;font-weight:600;margin-bottom:4px}
.product-brand{font-size:12px;color:#888;margin-bottom:10px}
.product-footer{display:flex;align-items:center;justify-content:space-between}
.product-price{font-size:17px;font-weight:700}
.btn-cart{width:32px;height:32px;border-radius:8px;border:none;background:#7c6fff;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center}
</style></head><body>
<header><div class="logo">Shop<span>.</span></div><div class="search"><span>🔍</span><input type="text" placeholder="Поиск товаров..."></div>
<div class="header-actions"><button class="action-btn">❤️</button><button class="action-btn">🛒<span class="badge">3</span></button><button class="action-btn">👤</button></div></header>
<div class="banner"><div class="banner-text"><h1>Весенняя<br>коллекция<br>2026</h1><p>Новинки уже доступны.<br>Успей получить скидку 20%.</p><button class="btn-white">Смотреть всё →</button></div><div class="banner-img">🛍️</div></div>
<section class="section"><div class="section-title">Популярные товары</div>
<div class="products">
<div class="product"><div class="product-img">👟</div><div class="product-info"><div class="product-name">Кроссовки Urban</div><div class="product-brand">Nike</div><div class="product-footer"><span class="product-price">₽ 8,990</span><button class="btn-cart">+</button></div></div></div>
<div class="product"><div class="product-img">👜</div><div class="product-info"><div class="product-name">Сумка Minimal</div><div class="product-brand">Zara</div><div class="product-footer"><span class="product-price">₽ 4,500</span><button class="btn-cart">+</button></div></div></div>
<div class="product"><div class="product-img">⌚</div><div class="product-info"><div class="product-name">Часы Smart X</div><div class="product-brand">Samsung</div><div class="product-footer"><span class="product-price">₽ 22,000</span><button class="btn-cart">+</button></div></div></div>
<div class="product"><div class="product-img">🎧</div><div class="product-info"><div class="product-name">Наушники Pro</div><div class="product-brand">Sony</div><div class="product-footer"><span class="product-price">₽ 14,990</span><button class="btn-cart">+</button></div></div></div>
</div></section>
</body></html>`,
}

export function detectTemplate(prompt: string): TemplateKey {
  const p = prompt.toLowerCase()
  if (p.includes('магазин') || p.includes('shop') || p.includes('товар') || p.includes('ecommerce'))
    return 'ecommerce'
  if (
    p.includes('дашборд') ||
    p.includes('dashboard') ||
    p.includes('аналитик') ||
    p.includes('статист')
  )
    return 'dashboard'
  return 'landing'
}

export function mutateTemplate(html: string, variant: 2 | 3): string {
  if (variant === 2) {
    return html.replace(/#7c6fff/g, '#10b981').replace(/#a78bfa/g, '#34d399')
  }
  return html
    .replace(/#7c6fff/g, '#f59e0b')
    .replace(/#a78bfa/g, '#fcd34d')
    .replace(/background:#0a0a12/g, 'background:#fff')
    .replace(/color:#e4e4ef/g, 'color:#1a1a1a')
}
