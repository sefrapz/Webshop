/* =========================================================
   MOTIV. — applikation (router, konfigurator, varukorg, kassa)
   ========================================================= */

const app = document.getElementById('app');

/* ------------------------- Varukorg ------------------------- */

let cart = [];
try { cart = JSON.parse(localStorage.getItem('motiv-cart') || '[]'); } catch (e) { cart = []; }

function saveCart() {
  localStorage.setItem('motiv-cart', JSON.stringify(cart));
  updateCartBadge();
}

function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function cartTotal() { return cart.reduce((s, i) => s + i.qty * PRODUCTS[i.product].price, 0); }

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  const n = cartCount();
  badge.hidden = n === 0;
  badge.textContent = n;
}

function addToCart(item) {
  const key = i => [i.product, i.color, i.size, i.motif, i.placement].join('|');
  const existing = cart.find(i => key(i) === key(item));
  if (existing) existing.qty += item.qty;
  else cart.push(item);
  saveCart();
  renderCartDrawer();
  openCart();
}

function itemPreviewSVG(item, side) {
  const pl = PLACEMENT_BY_ID[item.placement];
  const useSide = side || pl.side;
  return renderGarment(item.product, useSide, COLOR_BY_ID[item.color].hex, {
    motifId: item.motif, placementId: item.placement,
  });
}

function cartItemMeta(item) {
  return `${COLOR_BY_ID[item.color].name} · Stl ${item.size}<br>` +
    `Motiv: ${MOTIF_BY_ID[item.motif].name} · ${PLACEMENT_BY_ID[item.placement].name} (${PLACEMENT_BY_ID[item.placement].size})`;
}

function renderCartDrawer() {
  const wrap = document.getElementById('cartItems');
  const foot = document.getElementById('cartFoot');
  if (cart.length === 0) {
    wrap.innerHTML = `<div class="cart-empty">Din varukorg är tom.<br>Dags att designa något snyggt? 👕</div>`;
    foot.innerHTML = '';
    return;
  }
  wrap.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-img">${itemPreviewSVG(item)}</div>
      <div class="cart-item-info">
        <h4>${PRODUCTS[item.product].name}</h4>
        <div class="ci-meta">${cartItemMeta(item)}</div>
        <div class="cart-item-row">
          <span class="ci-qty">
            <button data-cart-dec="${idx}" aria-label="Minska antal">−</button>
            <span>${item.qty}</span>
            <button data-cart-inc="${idx}" aria-label="Öka antal">+</button>
          </span>
          <span class="ci-price">${item.qty * PRODUCTS[item.product].price} kr</span>
        </div>
        <button class="ci-remove" data-cart-remove="${idx}">Ta bort</button>
      </div>
    </div>`).join('');
  foot.innerHTML = `
    <div class="cart-total-row"><span>Summa</span><span>${cartTotal()} kr</span></div>
    <div class="cart-fine">Fri frakt · tryck ingår i priset</div>
    <button class="checkout-btn" id="toCheckoutBtn">Till kassan →</button>`;

  wrap.querySelectorAll('[data-cart-dec]').forEach(b => b.onclick = () => {
    const i = +b.dataset.cartDec;
    cart[i].qty -= 1;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    saveCart(); renderCartDrawer();
  });
  wrap.querySelectorAll('[data-cart-inc]').forEach(b => b.onclick = () => {
    cart[+b.dataset.cartInc].qty += 1;
    saveCart(); renderCartDrawer();
  });
  wrap.querySelectorAll('[data-cart-remove]').forEach(b => b.onclick = () => {
    cart.splice(+b.dataset.cartRemove, 1);
    saveCart(); renderCartDrawer();
  });
  const toCheckout = document.getElementById('toCheckoutBtn');
  if (toCheckout) toCheckout.onclick = () => { closeCart(); location.hash = '#/kassa'; };
}

const drawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('drawerOverlay');
const cartBtn = document.getElementById('cartBtn');

function cartIsOpen() { return drawer.classList.contains('open'); }

function openCart() {
  renderCartDrawer();
  drawer.classList.add('open');
  overlay.hidden = false;
  drawer.removeAttribute('aria-hidden');
  cartBtn.setAttribute('aria-expanded', 'true');
  syncBodyScroll();
  focusFirst(drawer);
}

function closeCart() {
  if (!cartIsOpen()) return;
  drawer.classList.remove('open');
  overlay.hidden = true;
  drawer.setAttribute('aria-hidden', 'true');
  cartBtn.setAttribute('aria-expanded', 'false');
  syncBodyScroll();
  cartBtn.focus();
}

cartBtn.onclick = openCart;
document.getElementById('cartCloseBtn').onclick = closeCart;
overlay.onclick = closeCart;

/* ------------------- Tangentbord & fokus ------------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
  'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableIn(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
}

function focusFirst(container) {
  const first = focusableIn(container)[0];
  if (first) first.focus();
}

/** Håller kvar tabbningen inuti en öppen dialog. */
function trapFocus(container, e) {
  const items = focusableIn(container);
  if (items.length === 0) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/** Sidan bakom en öppen dialog ska inte kunna scrollas. */
function syncBodyScroll() {
  document.body.classList.toggle('no-scroll', cartIsOpen() || !motifModal.hidden);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!motifModal.hidden) { closeMotifModal(); return; }
    if (cartIsOpen()) { closeCart(); return; }
    if (navIsOpen()) closeNav();
    return;
  }
  if (e.key === 'Tab') {
    if (!motifModal.hidden) trapFocus(motifModal.querySelector('.modal'), e);
    else if (cartIsOpen()) trapFocus(drawer, e);
  }
});

/* ------------------------- Mobilmeny ------------------------- */

const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');

function navIsOpen() { return !mobileNav.hidden; }

function openNav() {
  mobileNav.hidden = false;
  navToggle.classList.add('open');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Stäng menyn');
}

function closeNav() {
  if (!navIsOpen()) return;
  mobileNav.hidden = true;
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Öppna menyn');
}

navToggle.onclick = () => (navIsOpen() ? closeNav() : openNav());
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
document.addEventListener('click', e => {
  if (navIsOpen() && !mobileNav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
});

/* ------------------------- Toast ------------------------- */

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/* ------------------------- Router ------------------------- */

function route() {
  const hash = location.hash || '#/';
  const [path, query] = hash.replace(/^#\//, '').split('?');
  const parts = path.split('/');
  const params = new URLSearchParams(query || '');
  window.scrollTo(0, 0);
  closeNav();
  closeMotifModal();
  if (parts[0] === 'produkt' && PRODUCTS[parts[1]]) renderProductPage(parts[1], params);
  else if (parts[0] === 'kassa') renderCheckoutPage();
  else if (parts[0] === 'tack') renderConfirmationPage();
  else if (parts[0] === 'storleksguide') renderSizeGuidePage();
  else if (parts[0] === 'leverans') renderDeliveryPage();
  else if (parts[0] === 'kontakt') renderContactPage();
  else renderHomePage();
}
window.addEventListener('hashchange', route);

/* ------------------------- Startsida ------------------------- */

function renderHomePage() {
  const cats = [
    { id: 'tshirt', color: '#28345c', note: 'från 249 kr' },
    { id: 'longsleeve', color: '#77755b', note: 'från 299 kr' },
    { id: 'sweatshirt', color: '#722336', note: 'från 379 kr' },
    { id: 'hoodie', color: '#232327', note: 'från 449 kr' },
  ];
  app.innerHTML = `
    <section class="hero">
      <div class="hero-kicker">Tryckt för hand · Levereras inom 3–5 dagar</div>
      <h1>Ditt motiv.<br><em>Dina</em> kläder.</h1>
      <p class="lead">Välj plagg, färg och storlek. Välj bland 25 unika motiv och bestäm exakt var trycket ska sitta — och se resultatet live innan du beställer.</p>
      <a class="hero-cta" href="#/produkt/tshirt">Börja designa <span>→</span></a>
    </section>

    <section class="category-section">
      <div class="section-head">
        <h2>Välj ditt plagg</h2>
        <span>4 plagg · 12 färger · 25 motiv · 3 placeringar</span>
      </div>
      <div class="category-grid">
        ${cats.map(c => `
          <a class="category-card" href="#/produkt/${c.id}">
            <div class="card-img">${renderGarment(c.id, 'front', c.color)}</div>
            <div class="card-body">
              <div>
                <h3>${PRODUCTS[c.id].name}</h3>
                <small>${c.note}</small>
              </div>
              <span class="card-arrow">→</span>
            </div>
          </a>`).join('')}
      </div>
    </section>

    <section class="steps-strip">
      <div class="steps-inner">
        <div class="step-item">
          <div class="step-num">STEG 01</div>
          <h4>Välj plagg &amp; färg</h4>
          <p>T-shirt, långärmat, sweatshirt eller hoodie — i 12 noga utvalda färger, XS till 5XL.</p>
        </div>
        <div class="step-item">
          <div class="step-num">STEG 02</div>
          <h4>Välj motiv</h4>
          <p>25 handplockade motiv, tryckta för hand med slitstark och miljövänlig färg.</p>
        </div>
        <div class="step-item">
          <div class="step-num">STEG 03</div>
          <h4>Välj placering</h4>
          <p>Hjärta 10×10 cm, mage 22×22 cm eller rygg 22×22 cm — du bestämmer.</p>
        </div>
        <div class="step-item">
          <div class="step-num">STEG 04</div>
          <h4>Se det live &amp; beställ</h4>
          <p>Förhandsgranska exakt hur plagget blir och betala smidigt med Klarna.</p>
        </div>
      </div>
    </section>`;
}

/* ------------------------- Produktsida ------------------------- */

const configState = {};

/* ---------------------------------------------------------
   Designen ligger i adressfältet: #/produkt/hoodie?farg=svart…
   Det gör att den överlever omladdning och går att dela.
   --------------------------------------------------------- */

function designHash(s) {
  const p = new URLSearchParams();
  if (s.color) p.set('farg', s.color);
  if (s.size) p.set('stl', s.size);
  if (s.motif) p.set('motiv', s.motif);
  if (s.placement) p.set('plats', s.placement);
  const q = p.toString();
  return `#/produkt/${s.product}${q ? '?' + q : ''}`;
}

/** Läser designen ur länken. Okända värden ignoreras tyst. */
function applyDesignParams(params) {
  const s = configState;
  const farg = params.get('farg');
  if (farg && COLOR_BY_ID[farg]) s.color = farg;
  const stl = params.get('stl');
  if (stl && sizesFor(s.product).includes(stl)) s.size = stl;
  const motiv = params.get('motiv');
  if (motiv && MOTIF_BY_ID[motiv]) s.motif = motiv;
  const plats = params.get('plats');
  if (plats && PLACEMENT_BY_ID[plats]) {
    s.placement = plats;
    s.side = PLACEMENT_BY_ID[plats].side;
  }
}

/** Full delbar länk till den design som visas just nu. */
function designUrl(s) {
  return location.origin + location.pathname + location.search + designHash(s);
}

function renderProductPage(productId, params) {
  const product = PRODUCTS[productId];

  if (configState.product !== productId) {
    configState.product = productId;
    configState.color = COLORS[0].id;
    configState.side = 'front';
    configState.size = null;
    configState.qty = 1;
    configState.motif = null;
    configState.placement = null;
  }
  if (params) applyDesignParams(params);
  const s = configState;

  app.innerHTML = `
    <div class="product-page">
      <div class="breadcrumb"><a href="#/">Hem</a> / ${product.name}</div>
      <div class="product-layout">

        <div class="preview-col">
          <div class="preview-stage">
            <div class="side-toggle">
              <button id="sideFront" aria-pressed="false">FRAMSIDA</button>
              <button id="sideBack" aria-pressed="false">BAKSIDA</button>
            </div>
            <div class="preview-badge" id="previewBadge"></div>
            <div id="previewSvg"></div>
          </div>
          <div class="color-thumbs" id="colorThumbs"></div>
          <button class="share-btn" id="shareBtn">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
              stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
            </svg>
            Dela designen
          </button>
        </div>

        <div class="config-col">
          <h1>${product.name}</h1>
          <p class="product-tagline">${product.tagline}</p>
          <div class="product-price">${product.price} kr <small>· tryck &amp; frakt ingår</small></div>
          <p class="product-desc">${product.desc}</p>

          <div class="config-step done" id="stepColor">
            <div class="config-step-head">
              <span class="step-index">1</span><h3>Färg</h3>
              <span class="step-value" id="colorValue"></span>
            </div>
          </div>

          <div class="config-step" id="stepSize">
            <div class="config-step-head">
              <span class="step-index">2</span><h3>Storlek &amp; antal</h3>
              <span class="step-value" id="sizeValue"></span>
            </div>
            <div class="size-grid" id="sizeGrid"></div>
            <div class="qty-row">
              <label>Antal</label>
              <span class="qty-stepper">
                <button id="qtyDec" aria-label="Minska antal">−</button>
                <span class="qty-val" id="qtyVal">1</span>
                <button id="qtyInc" aria-label="Öka antal">+</button>
              </span>
            </div>
          </div>

          <div class="config-step" id="stepMotif">
            <div class="config-step-head">
              <span class="step-index">3</span><h3>Motiv</h3>
              <span class="step-value" id="motifValue"></span>
            </div>
            <button class="motif-cta" id="motifBtn"></button>
          </div>

          <div class="config-step" id="stepPlacement">
            <div class="config-step-head">
              <span class="step-index">4</span><h3>Placering</h3>
              <span class="step-value" id="placementValue"></span>
            </div>
            <div class="placement-grid" id="placementGrid"></div>
          </div>

          <div class="addtocart-wrap">
            <button class="addtocart-btn" id="addBtn" disabled></button>
            <div class="addtocart-hint" id="addHint"></div>
          </div>
        </div>
      </div>
    </div>`;

  /* --- färgminiatyrer --- */
  const thumbs = document.getElementById('colorThumbs');
  thumbs.innerHTML = COLORS.map(c => `
    <button class="color-thumb ${c.id === s.color ? 'selected' : ''}" data-color="${c.id}"
      title="${c.name}" aria-pressed="${c.id === s.color}" aria-label="Färg: ${c.name}">
      ${renderThumb(productId, c.hex)}
      <span class="thumb-name">${c.name}</span>
    </button>`).join('');
  thumbs.querySelectorAll('[data-color]').forEach(b => b.onclick = () => {
    s.color = b.dataset.color;
    thumbs.querySelectorAll('.color-thumb').forEach(t => {
      const on = t.dataset.color === s.color;
      t.classList.toggle('selected', on);
      t.setAttribute('aria-pressed', on);
    });
    update();
  });

  /* --- fram/bak --- */
  document.getElementById('sideFront').onclick = () => { s.side = 'front'; update(); };
  document.getElementById('sideBack').onclick = () => { s.side = 'back'; update(); };

  /* --- storlekar --- */
  const sizeGrid = document.getElementById('sizeGrid');
  sizeGrid.innerHTML = sizesFor(productId).map(sz =>
    `<button class="size-btn ${s.size === sz ? 'selected' : ''}" data-size="${sz}"
      aria-pressed="${s.size === sz}" aria-label="Storlek ${sz}">${sz}</button>`).join('');
  sizeGrid.querySelectorAll('[data-size]').forEach(b => b.onclick = () => {
    s.size = b.dataset.size;
    sizeGrid.querySelectorAll('.size-btn').forEach(x => {
      const on = x.dataset.size === s.size;
      x.classList.toggle('selected', on);
      x.setAttribute('aria-pressed', on);
    });
    update();
  });

  /* --- antal --- */
  document.getElementById('qtyDec').onclick = () => { s.qty = Math.max(1, s.qty - 1); update(); };
  document.getElementById('qtyInc').onclick = () => { s.qty = Math.min(99, s.qty + 1); update(); };

  /* --- motiv --- */
  document.getElementById('motifBtn').onclick = openMotifModal;

  /* --- placering --- */
  const plGrid = document.getElementById('placementGrid');
  const plIcon = (pl) => {
    const marks = {
      hjarta: { x: 54, y: 30, s: 12 },
      mage:   { x: 38, y: 42, s: 24 },
      rygg:   { x: 38, y: 36, s: 24 },
    };
    const m = marks[pl];
    const neck = pl === 'rygg'
      ? `<path d="M38 14 C42 18 58 18 62 14" stroke="currentColor" stroke-width="5" fill="none"/>`
      : `<path d="M37 13 C40 24 60 24 63 13" stroke="currentColor" stroke-width="5" fill="none"/>`;
    return `<svg viewBox="0 0 100 100" width="36" height="36">
      <path d="M31 13 L14 29 L24 42 L30 37 L30 87 L70 87 L70 37 L76 42 L86 29 L69 13 C62 19 38 19 31 13Z"
        fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
      ${neck}
      <rect x="${m.x}" y="${m.y}" width="${m.s}" height="${m.s}" rx="3" fill="currentColor"/>
    </svg>`;
  };
  plGrid.innerHTML = PLACEMENTS.map(p => `
    <button class="placement-card ${s.placement === p.id ? 'selected' : ''}" data-placement="${p.id}"
      aria-pressed="${s.placement === p.id}" aria-label="Placering: ${p.name}, ${p.size}. ${p.desc}">
      <div class="pl-icon" aria-hidden="true">${plIcon(p.id)}</div>
      <h4>${p.name}</h4>
      <small>${p.size}</small>
    </button>`).join('');
  plGrid.querySelectorAll('[data-placement]').forEach(b => b.onclick = () => {
    s.placement = b.dataset.placement;
    s.side = PLACEMENT_BY_ID[s.placement].side; // visa rätt sida direkt
    plGrid.querySelectorAll('.placement-card').forEach(x => {
      const on = x.dataset.placement === s.placement;
      x.classList.toggle('selected', on);
      x.setAttribute('aria-pressed', on);
    });
    update();
  });

  /* --- dela design --- */
  document.getElementById('shareBtn').onclick = async () => {
    const url = designUrl(s);
    /* Mobilens egen delningsmeny först — det är den kunden väntar sig. */
    if (navigator.share) {
      try {
        await navigator.share({ title: `${product.name} från MOTIV.`, url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // kunden ångrade sig
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Länken är kopierad ✓');
    } catch (err) {
      /* Urklipp kräver säker kontext — länken syns ändå i adressfältet. */
      toast('Länken till din design finns i adressfältet.');
    }
  };

  /* --- lägg i varukorg --- */
  document.getElementById('addBtn').onclick = () => {
    if (!isConfigComplete()) return;
    addToCart({
      product: s.product, color: s.color, size: s.size,
      qty: s.qty, motif: s.motif, placement: s.placement,
    });
    toast('Tillagd i varukorgen ✓');
  };

  function isConfigComplete() {
    return s.color && s.size && s.motif && s.placement;
  }

  function update() {
    const color = COLOR_BY_ID[s.color];

    /* Designen speglas i adressfältet vid varje ändring. replaceState
       triggar ingen hashchange, så routern startar inte om sidan. */
    try {
      history.replaceState(null, '', designHash(s));
    } catch (e) {
      /* file:// tillåter inte replaceState — strunt samma, sidan fungerar ändå. */
    }

    /* förhandsvisning */
    document.getElementById('previewSvg').innerHTML = renderGarment(
      s.product, s.side, color.hex,
      { motifId: s.motif, placementId: s.placement, showPrintAreas: !s.placement && !!s.motif }
    );
    const sideFront = document.getElementById('sideFront');
    const sideBack = document.getElementById('sideBack');
    sideFront.classList.toggle('active', s.side === 'front');
    sideBack.classList.toggle('active', s.side === 'back');
    sideFront.setAttribute('aria-pressed', s.side === 'front');
    sideBack.setAttribute('aria-pressed', s.side === 'back');
    document.getElementById('previewBadge').textContent =
      `${product.name} · ${color.name} · ${s.side === 'front' ? 'Framsida' : 'Baksida'}`;

    /* stegvärden */
    document.getElementById('colorValue').textContent = color.name;
    document.getElementById('sizeValue').textContent =
      s.size ? `${s.size} · ${s.qty} st` : '';
    document.getElementById('motifValue').textContent = s.motif ? MOTIF_BY_ID[s.motif].name : '';
    document.getElementById('placementValue').textContent =
      s.placement ? `${PLACEMENT_BY_ID[s.placement].name} · ${PLACEMENT_BY_ID[s.placement].size}` : '';

    document.getElementById('stepSize').classList.toggle('done', !!s.size);
    document.getElementById('stepMotif').classList.toggle('done', !!s.motif);
    document.getElementById('stepPlacement').classList.toggle('done', !!s.placement);

    document.getElementById('qtyVal').textContent = s.qty;

    /* motivknapp */
    const motifBtn = document.getElementById('motifBtn');
    if (s.motif) {
      const m = MOTIF_BY_ID[s.motif];
      motifBtn.classList.add('has-motif');
      motifBtn.innerHTML = `
        <span class="motif-preview"><svg viewBox="${motifViewBox(m.id)}" aria-hidden="true">${m.svg}</svg></span>
        <span>${m.name}<small>Klicka för att byta motiv</small></span>
        <span class="cta-arrow">→</span>`;
    } else {
      motifBtn.classList.remove('has-motif');
      motifBtn.innerHTML = `
        <span class="motif-preview" style="display:flex;align-items:center;justify-content:center;font-size:1.4rem;">✦</span>
        <span>Välj motiv<small>25 motiv att välja mellan</small></span>
        <span class="cta-arrow">→</span>`;
    }

    /* knapp */
    const addBtn = document.getElementById('addBtn');
    const hint = document.getElementById('addHint');
    addBtn.disabled = !isConfigComplete();
    addBtn.innerHTML = `Lägg i varukorgen · ${s.qty * product.price} kr`;
    if (!s.size) hint.textContent = 'Välj storlek för att gå vidare.';
    else if (!s.motif) hint.textContent = 'Välj ett motiv — steg 3.';
    else if (!s.placement) hint.textContent = 'Välj placering av trycket — steg 4.';
    else hint.textContent = 'Allt klart! Förhandsvisningen ovan visar exakt hur plagget blir.';
  }

  update();
}

/* ------------------------- Motiv-modal ------------------------- */

const motifModal = document.getElementById('motifModal');
const motifGrid = document.getElementById('motifGrid');
const motifSearch = document.getElementById('motifSearch');
const motifEmpty = document.getElementById('motifEmpty');
const motifCount = document.getElementById('motifCount');

/* Elementet som öppnade modalen — dit går fokus tillbaka när den stängs. */
let motifOpener = null;

function renderMotifGrid(query = '') {
  const q = query.trim().toLowerCase();
  const list = q ? MOTIFS.filter(m => m.name.toLowerCase().includes(q)) : MOTIFS;

  motifGrid.innerHTML = list.map(m => {
    const selected = configState.motif === m.id;
    return `
    <button class="motif-tile ${selected ? 'selected' : ''}" data-motif="${m.id}" aria-pressed="${selected}">
      <svg viewBox="${motifViewBox(m.id)}" aria-hidden="true">${m.svg}</svg>
      <span>${m.name}</span>
    </button>`;
  }).join('');

  motifEmpty.hidden = list.length > 0;
  motifCount.textContent = q
    ? `${list.length} av ${MOTIFS.length}`
    : `${MOTIFS.length} motiv`;

  motifGrid.querySelectorAll('[data-motif]').forEach(b => b.onclick = () => {
    configState.motif = b.dataset.motif;
    closeMotifModal();
    renderProductPage(configState.product);
    const btn = document.getElementById('motifBtn');
    if (btn) btn.focus();
  });
}

function openMotifModal() {
  motifOpener = document.activeElement;
  motifSearch.value = '';
  renderMotifGrid();
  motifModal.hidden = false;
  syncBodyScroll();
  /* Fokusera det valda motivet, inte sökrutan — annars tar mobilens
     tangentbord halva skärmen direkt när galleriet öppnas. */
  const selected = motifGrid.querySelector('.motif-tile.selected');
  (selected || motifGrid.querySelector('.motif-tile') || motifSearch).focus();
}

function closeMotifModal() {
  if (motifModal.hidden) return;
  motifModal.hidden = true;
  syncBodyScroll();
  if (motifOpener && document.contains(motifOpener)) motifOpener.focus();
  motifOpener = null;
}

motifSearch.addEventListener('input', () => renderMotifGrid(motifSearch.value));
document.getElementById('motifCloseBtn').onclick = closeMotifModal;
motifModal.addEventListener('click', e => { if (e.target === motifModal) closeMotifModal(); });

/* ------------------------- Kassa ------------------------- */

function renderCheckoutPage() {
  if (cart.length === 0) {
    app.innerHTML = `
      <div class="checkout-page">
        <h1>Kassan</h1>
        <div class="checkout-card" style="text-align:center;padding:60px 30px;">
          <p style="color:var(--ink-soft);margin-bottom:20px;">Din varukorg är tom.</p>
          <a class="hero-cta" href="#/">Börja designa →</a>
        </div>
      </div>`;
    return;
  }

  /* Varje fält validerar sig självt och har rätt tangentbord på mobil. */
  const fields = [
    { id: 'email', label: 'E-postadress', type: 'email', full: true, ph: 'namn@exempel.se',
      autocomplete: 'email', inputmode: 'email',
      test: v => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v),
      error: 'Ange en giltig e-postadress.' },
    { id: 'fname', label: 'Förnamn', ph: 'Anna', autocomplete: 'given-name',
      test: v => v.length >= 2, error: 'Ange ditt förnamn.' },
    { id: 'lname', label: 'Efternamn', ph: 'Andersson', autocomplete: 'family-name',
      test: v => v.length >= 2, error: 'Ange ditt efternamn.' },
    { id: 'address', label: 'Gatuadress', full: true, ph: 'Exempelgatan 12',
      autocomplete: 'street-address',
      test: v => v.length >= 5 && /\d/.test(v),
      error: 'Ange gatuadress med gatunummer.' },
    { id: 'zip', label: 'Postnummer', ph: '123 45', autocomplete: 'postal-code', inputmode: 'numeric',
      test: v => /^\d{3}\s?\d{2}$/.test(v),
      error: 'Postnummer ska vara fem siffror.' },
    { id: 'city', label: 'Ort', ph: 'Stockholm', autocomplete: 'address-level2',
      test: v => v.length >= 2, error: 'Ange ort.' },
    { id: 'phone', label: 'Mobilnummer', type: 'tel', full: true, ph: '070-123 45 67',
      autocomplete: 'tel', inputmode: 'tel',
      test: v => /^(0|\+46)7\d{8}$/.test(v.replace(/[\s-]/g, '')),
      error: 'Ange ett svenskt mobilnummer, t.ex. 070-123 45 67.' },
  ];

  const total = cartTotal();
  const monthly = Math.ceil(total / 3);

  app.innerHTML = `
    <div class="checkout-page">
      <h1>Kassan</h1>
      <div class="checkout-layout">
        <div>
          <div class="checkout-card">
            <h2>1 · Dina uppgifter</h2>
            <div class="form-grid" id="checkoutForm">
              ${fields.map(f => `
                <div class="form-field ${f.full ? 'full' : ''}">
                  <label for="f-${f.id}">${f.label}</label>
                  <input id="f-${f.id}" type="${f.type || 'text'}" placeholder="${f.ph}"
                    autocomplete="${f.autocomplete}"
                    ${f.inputmode ? `inputmode="${f.inputmode}"` : ''}
                    aria-describedby="e-${f.id}">
                  <span class="field-error" id="e-${f.id}" role="alert" hidden></span>
                </div>`).join('')}
            </div>
          </div>

          <div class="checkout-card">
            <h2>2 · Betalning</h2>
            <div class="klarna-box">
              <div class="klarna-head">
                <span class="klarna-logo">Klarna.</span>
                <small>Smidiga betalningar</small>
              </div>
              <label class="klarna-option">
                <input type="radio" name="klarna" value="now" checked>
                <span class="ko-body"><strong>Betala nu</strong><small>Direktbetalning med kort eller bank</small></span>
                <span class="ko-price">${total} kr</span>
              </label>
              <label class="klarna-option">
                <input type="radio" name="klarna" value="later">
                <span class="ko-body"><strong>Betala om 30 dagar</strong><small>Först prova hemma, betala sen — utan avgift</small></span>
                <span class="ko-price">${total} kr</span>
              </label>
              <label class="klarna-option">
                <input type="radio" name="klarna" value="split">
                <span class="ko-body"><strong>Delbetala</strong><small>Dela upp köpet på 3 månader, räntefritt</small></span>
                <span class="ko-price">${monthly} kr/mån</span>
              </label>
            </div>
            <button class="pay-btn" id="payBtn">Slutför köp · ${total} kr</button>
            <div class="pay-fine">Demobutik — ingen riktig betalning genomförs. I skarp drift kopplas Klarna Checkout in här.</div>
          </div>
        </div>

        <div class="summary-card">
          <h2>Din beställning</h2>
          ${cart.map(item => `
            <div class="summary-item">
              <div class="cart-item-img">${itemPreviewSVG(item)}</div>
              <div>
                <strong>${item.qty} × ${PRODUCTS[item.product].name}</strong>
                <span class="ci-meta">${cartItemMeta(item)}</span>
              </div>
              <span class="si-price">${item.qty * PRODUCTS[item.product].price} kr</span>
            </div>`).join('')}
          <div class="summary-rows">
            <div><span>Delsumma</span><span>${total} kr</span></div>
            <div><span>Frakt</span><span>0 kr</span></div>
            <div class="total"><span>Totalt</span><span>${total} kr</span></div>
          </div>
        </div>
      </div>
    </div>`;

  /* Validerar ett fält och visar felet under det. Tomt fält innan man
     rört det ska inte skrika — därför flaggas fel först vid blur eller köp. */
  function validateField(f, show) {
    const input = document.getElementById(`f-${f.id}`);
    const errEl = document.getElementById(`e-${f.id}`);
    const value = input.value.trim();
    const ok = value.length > 0 && f.test(value);
    if (show) {
      input.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      errEl.textContent = ok ? '' : (value.length === 0 ? `${f.label} saknas.` : f.error);
      errEl.hidden = ok;
    }
    return ok;
  }

  fields.forEach(f => {
    const input = document.getElementById(`f-${f.id}`);
    input.addEventListener('blur', () => validateField(f, true));
    /* När fältet väl är rödmarkerat ska det bli grönt så fort det blir rätt. */
    input.addEventListener('input', () => {
      if (input.classList.contains('invalid')) validateField(f, true);
    });
  });

  document.getElementById('payBtn').onclick = () => {
    const firstInvalid = fields.filter(f => !validateField(f, true))[0];
    if (firstInvalid) {
      const input = document.getElementById(`f-${firstInvalid.id}`);
      input.focus();
      input.scrollIntoView({ block: 'center', behavior: 'smooth' });
      toast('Kontrollera de markerade fälten.');
      return;
    }

    const btn = document.getElementById('payBtn');
    btn.disabled = true;
    btn.textContent = 'Behandlar betalning …';
    setTimeout(() => {
      const orderNo = 'MV-' + Date.now().toString().slice(-6);
      sessionStorage.setItem('motiv-last-order', JSON.stringify({ orderNo, items: cart, total }));
      cart = [];
      saveCart();
      location.hash = '#/tack';
    }, 1400);
  };
}

/* ------------------------- Orderbekräftelse ------------------------- */

function renderConfirmationPage() {
  let order = null;
  try { order = JSON.parse(sessionStorage.getItem('motiv-last-order')); } catch (e) {}
  if (!order) { location.hash = '#/'; return; }

  app.innerHTML = `
    <div class="confirmation-page">
      <div class="conf-check">✓</div>
      <h1>Tack för din beställning!</h1>
      <p class="conf-order">Ordernummer <strong>${order.orderNo}</strong> · en bekräftelse har skickats till din e-post.<br>
      Ditt plagg trycks för hand och skickas inom 3–5 arbetsdagar.</p>
      <div class="conf-items">
        ${order.items.map(item => `
          <div class="summary-item">
            <div class="cart-item-img">${itemPreviewSVG(item)}</div>
            <div>
              <strong>${item.qty} × ${PRODUCTS[item.product].name}</strong>
              <span class="ci-meta">${cartItemMeta(item)}</span>
            </div>
            <span class="si-price">${item.qty * PRODUCTS[item.product].price} kr</span>
          </div>`).join('')}
        <div class="summary-rows">
          <div class="total"><span>Betalt med Klarna</span><span>${order.total} kr</span></div>
        </div>
      </div>
      <a class="hero-cta" href="#/">Designa ett till plagg →</a>
    </div>`;
}

/* ------------------------- Storleksguide ------------------------- */

function renderSizeGuidePage() {
  const tables = Object.keys(SIZE_CHART).map(id => {
    const chart = SIZE_CHART[id];
    return `
      <section class="guide-block">
        <h2>${PRODUCTS[id].name}</h2>
        <div class="table-scroll">
          <table class="size-table">
            <thead>
              <tr><th scope="col">Storlek</th>${chart.columns.map(c => `<th scope="col">${c}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${sizesFor(id).map(sz => `
                <tr>
                  <th scope="row">${sz}</th>
                  ${chart.rows[sz].map(v => `<td>${v} cm</td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }).join('');

  app.innerHTML = `
    <div class="info-page">
      <div class="breadcrumb"><a href="#/">Hem</a> / Storleksguide</div>
      <h1>Storleksguide</h1>
      <p class="lead">Måtten är tagna på plagget när det ligger platt, inte på kroppen.
      Bröstvidden mäts rakt över från söm till söm en bit under ärmhålet.</p>

      <div class="guide-tip">
        <strong>Osäker mellan två storlekar?</strong>
        Mät ett plagg du redan gillar och jämför med tabellen — det är säkrare än att
        gissa utifrån vad du brukar ha. Hoodien är oversized och sitter en storlek
        rymligare än t-shirten.
      </div>

      ${tables}

      <p class="info-fine">Måtten är ungefärliga och kan avvika med ±2 cm mellan enskilda plagg.</p>
      <a class="hero-cta" href="#/">Börja designa →</a>
    </div>`;
}

/* ------------------------- Leverans & retur ------------------------- */

function renderDeliveryPage() {
  app.innerHTML = `
    <div class="info-page">
      <div class="breadcrumb"><a href="#/">Hem</a> / Leverans &amp; retur</div>
      <h1>Leverans &amp; retur</h1>
      <p class="lead">Varje plagg trycks för hand efter att du lagt din beställning.
      Det tar några dagar extra — och det är hela poängen.</p>

      <div class="info-grid">
        <section class="info-card">
          <h2>Leverans</h2>
          <dl class="info-list">
            <dt>Tryck &amp; packning</dt><dd>1–2 arbetsdagar</dd>
            <dt>Frakt inom Sverige</dt><dd>2–3 arbetsdagar</dd>
            <dt>Fraktkostnad</dt><dd>0 kr — fri frakt på alla ordrar</dd>
            <dt>Spårning</dt><dd>Länk skickas via e-post när paketet lämnar oss</dd>
          </dl>
        </section>

        <section class="info-card">
          <h2>Retur</h2>
          <p>Du har <strong>14 dagars ångerrätt</strong> från att du tagit emot paketet.
          Plagget ska vara oanvänt och otvättat, med etiketter kvar.</p>
          <p>Hör av dig till <a href="mailto:hej@motiv.se">hej@motiv.se</a> med ditt
          ordernummer så skickar vi en returfraktsedel.</p>
          <p class="info-fine">Pengarna är tillbaka på ditt konto inom 14 dagar från att
          vi tagit emot returen.</p>
        </section>

        <section class="info-card">
          <h2>Om något blivit fel</h2>
          <p>Har trycket blivit snett, plagget skadat eller fick du fel storlek levererad?
          Skicka en bild till <a href="mailto:hej@motiv.se">hej@motiv.se</a> så gör vi om
          plagget kostnadsfritt — du behöver inte skicka tillbaka det första.</p>
        </section>
      </div>

      <div class="guide-tip">
        <strong>Demobutik.</strong> MOTIV. är ett demoprojekt. Inga riktiga beställningar
        expedieras och ingen betalning genomförs.
      </div>

      <a class="hero-cta" href="#/">Börja designa →</a>
    </div>`;
}

/* ------------------------- Kontakt ------------------------- */

function renderContactPage() {
  app.innerHTML = `
    <div class="info-page">
      <div class="breadcrumb"><a href="#/">Hem</a> / Kontakta oss</div>
      <h1>Kontakta oss</h1>
      <p class="lead">Vi är ett litet team och svarar oftast samma dag.</p>

      <div class="info-grid">
        <section class="info-card">
          <h2>Skriv till oss</h2>
          <dl class="info-list">
            <dt>Kundservice</dt><dd><a href="mailto:hej@motiv.se">hej@motiv.se</a></dd>
            <dt>Order &amp; retur</dt><dd><a href="mailto:order@motiv.se">order@motiv.se</a></dd>
            <dt>Telefon</dt><dd><a href="tel:+46812345678">08-123 456 78</a></dd>
          </dl>
          <p class="info-fine">Ha ditt ordernummer nära till hands — det står i
          orderbekräftelsen och börjar med MV-.</p>
        </section>

        <section class="info-card">
          <h2>Öppettider</h2>
          <dl class="info-list">
            <dt>Måndag–fredag</dt><dd>09.00–17.00</dd>
            <dt>Lördag</dt><dd>10.00–14.00</dd>
            <dt>Söndag</dt><dd>Stängt</dd>
          </dl>
        </section>

        <section class="info-card">
          <h2>Tryckeriet</h2>
          <p>MOTIV.<br>Exempelgatan 12<br>111 22 Stockholm</p>
          <p class="info-fine">Tryckeriet tar inte emot besök utan bokning.</p>
        </section>
      </div>

      <div class="guide-tip">
        <strong>Demobutik.</strong> Kontaktuppgifterna ovan är påhittade och går inte
        att nå — MOTIV. är ett demoprojekt.
      </div>

      <a class="hero-cta" href="#/">Börja designa →</a>
    </div>`;
}

/* ------------------------- Init ------------------------- */

drawer.setAttribute('aria-hidden', 'true');
updateCartBadge();
route();
