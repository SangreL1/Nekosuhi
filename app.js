// ── CART STATE ──────────────────────────────────────────
let cart = [];
let deliveryType = 'delivery';

// ── DOM REFS ────────────────────────────────────────────
const cartCount   = document.getElementById('cartCount');
const cartBtn     = document.getElementById('cartBtn');
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose   = document.getElementById('cartClose');
const sauceChecks = document.querySelectorAll('.sauce-check');
const drawerItems = document.getElementById('drawerItems');
const drawerEmpty = document.getElementById('drawerEmpty');
const drawerFooter= document.getElementById('drawerFooter');
const drawerTotal = document.getElementById('drawerTotal');
const clearCartBtn= document.getElementById('clearCart');
const toast       = document.getElementById('toast');
const hamburger   = document.getElementById('hamburger');
const navLinks    = document.getElementById('navLinks');

// ── CART LOGIC ──────────────────────────────────────────
function addToCart(name, price, metadata = null) {
  const existingItem = (metadata) ? null : cart.find(item => item.name === name);

  if (existingItem) {
    existingItem.qty++;
  } else {
    cart.push({
      name,
      price: parseInt(price),
      qty: 1,
      notes: '',
      metadata: metadata
    });
  }

  saveCart();
  updateCartUI();
  showToast(`✅ ${name} agregado`);
  
  // Pulse on cart btn
  cartCount.classList.remove('pulse');
  void cartCount.offsetWidth;
  cartCount.classList.add('pulse');
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

function getTotal() {
  let sum = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  // Add sauces from form
  document.querySelectorAll('.sauce-check:checked').forEach(s => {
    sum += parseInt(s.dataset.price);
  });
  return sum;
}

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CL');
}

function saveCart() {
  localStorage.setItem('nekoCart', JSON.stringify(cart));
}

function loadCart() {
  const storedCart = localStorage.getItem('nekoCart');
  if (storedCart) {
    cart = JSON.parse(storedCart);
  }
}

function updateCartUI() {
  const total = getTotal();
  const count = cart.reduce((s, i) => s + i.qty, 0);

  // Update count badge
  cartCount.textContent = count;


  // ── Drawer cart ──
  renderCartItems(drawerItems, drawerEmpty, 'drawer');
  if (cart.length > 0) {
    drawerFooter.style.display = 'block';
    drawerTotal.textContent = formatPrice(total);
  } else {
    drawerFooter.style.display = 'none';
  }
}

function renderCartItems(container, emptyEl, prefix) {
  // Remove old cart items (keep the empty notice)
  Array.from(container.querySelectorAll('.cart-item-wrapper')).forEach(el => el.remove());

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  cart.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span class="cart-item-name">${item.name}</span>
      <div class="cart-item-qty">
        <button class="qty-btn" data-idx="${idx}" data-delta="-1">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" data-idx="${idx}" data-delta="1">+</button>
      </div>
      <span class="cart-item-price">${formatPrice(item.price * item.qty)}</span>
      <button class="cart-item-remove" data-idx="${idx}" title="Eliminar">🗑</button>
    `;
    // Render item notes
    const itemNotes = document.createElement('div');
    itemNotes.className = 'cart-item-notes';
    itemNotes.innerHTML = `
      <textarea class="item-note-input" placeholder="Nota para este producto..." data-index="${idx}">${item.notes || ''}</textarea>
    `;

    // Listen for note changes
    itemNotes.querySelector('textarea').addEventListener('input', (e) => {
      cart[idx].notes = e.target.value;
      saveCart();
    });

    const itemContainer = document.createElement('div');
    itemContainer.className = 'cart-item-wrapper';
    itemContainer.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
    itemContainer.style.paddingBottom = "0.5rem";
    itemContainer.appendChild(div);
    itemContainer.appendChild(itemNotes);

    container.appendChild(itemContainer);
  });

  // Events
  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      changeQty(parseInt(btn.dataset.idx), parseInt(btn.dataset.delta));
    });
  });
  container.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(parseInt(btn.dataset.idx));
    });
  });
}

function openDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) {
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeDrawer() {
  const drawer = document.getElementById('cartDrawer');
  if (drawer) {
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  try {
    loadCart();
    updateCartUI();
    console.log('🐱 Neko Sushi Rolls - Script cargado correctamente');
  } catch (e) {
    console.error('Error en inicialización de carrito:', e);
  }
});

// ── TOAST ───────────────────────────────────────────────
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── GLOBAL CLICK DELEGATION ────────────────────────────
document.addEventListener('click', (e) => {
  // Menu Tabs
  const tabBtn = e.target.closest('.tab-btn');
  if (tabBtn) {
    const targetTabId = tabBtn.getAttribute('data-tab');
    if (targetTabId) {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-tab') === targetTabId);
      });
      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === 'tab-' + targetTabId);
      });
    }
  }

  // Delivery Toggle
  const dtBtn = e.target.closest('.dt-btn');
  if (dtBtn) {
    document.querySelectorAll('.dt-btn').forEach(b => b.classList.remove('active'));
    dtBtn.classList.add('active');
    deliveryType = dtBtn.getAttribute('data-type') || 'delivery';
    const addrGroup = document.getElementById('drawerAddressGroup');
    const pickGroup = document.getElementById('drawerPickupInfo');
    if (addrGroup) {
      addrGroup.style.display = (deliveryType === 'delivery') ? 'block' : 'none';
    }
    if (pickGroup) {
      pickGroup.style.display = (deliveryType === 'retiro') ? 'block' : 'none';
    }
  }

  // Add to Cart
  const addBtn = e.target.closest('.btn-add-cart');
  if (addBtn) {
    addToCart(addBtn.dataset.name, addBtn.dataset.price);
  }

  const addBtnSm = e.target.closest('.btn-add-cart-sm');
  if (addBtnSm) {
    const card = addBtnSm.closest('.menu-card');
    if (card) addToCart(card.dataset.name, card.dataset.price);
  }

  const addBtnTable = e.target.closest('.btn-add-table');
  if (addBtnTable) {
    e.stopPropagation();
    const row = addBtnTable.closest('.price-row');
    if (row) addToCart(`Promo ${row.dataset.qty} Piezas`, row.dataset.price);
  }


  // Drawer Controls
  if (e.target.closest('#cartBtn')) openDrawer();
  if (e.target.closest('#cartClose') || e.target.closest('#cartOverlay')) closeDrawer();
  if (e.target.closest('#clearCart')) clearCart();
  if (e.target.closest('#hamburger')) {
    const nav = document.getElementById('navLinks');
    if (nav) nav.classList.toggle('open');
  }
  
  // Close nav on link click
  if (e.target.closest('.nav-links a')) {
    const nav = document.getElementById('navLinks');
    if (nav) nav.classList.remove('open');
  }

  // Builder Options
  const builderOpt = e.target.closest('.builder-opt');
  if (builderOpt) {
    const type = builderOpt.dataset.type;
    const value = builderOpt.dataset.value;

    if (type === 'protein') {
      document.querySelectorAll('.builder-opt[data-type="protein"]').forEach(b => b.classList.remove('active'));
      builderOpt.classList.add('active');
      builderState.protein = value;
    } else if (type === 'ingredient') {
      if (builderOpt.classList.contains('active')) {
        builderOpt.classList.remove('active');
        builderState.ingredients = builderState.ingredients.filter(i => i !== value);
      } else if (builderState.ingredients.length < 2) {
        builderOpt.classList.add('active');
        builderState.ingredients.push(value);
      }
    } else if (type === 'wrap') {
      document.querySelectorAll('.builder-opt[data-type="wrap"]').forEach(b => b.classList.remove('active'));
      builderOpt.classList.add('active');
      builderState.wrap = value;
      builderState.extraPrice = parseInt(builderOpt.dataset.extra || 0);
    }
    updateBuilderPrice();
  }

  // Builder Add to Cart
  if (e.target.id === 'btnAddCustomRoll') {
    if (!builderState.protein || builderState.ingredients.length < 1) {
      alert('Por favor elige al menos una proteína y un ingrediente.');
      return;
    }
    const name = `Roll Personalizado (${builderState.protein})`;
    const desc = `Relleno: ${builderState.ingredients.join(', ')}. Envoltura: ${builderState.wrap}`;
    const price = 4500 + builderState.extraPrice;
    addToCart(name, price, { desc });
  }
});

// ── BUILDER STATE ──────────────────────────────────────
const builderState = {
  protein: null,
  ingredients: [],
  wrap: 'Panco',
  extraPrice: 0
};

function updateBuilderPrice() {
  const el = document.getElementById('builderPrice');
  if (el) {
    const total = 4500 + builderState.extraPrice;
    el.innerText = formatPrice(total);
  }
}

// ── SAUCE UPDATE ──────────────────────────────────────
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('sauce-check')) {
    updateCartUI();
  }
});

// ── ORDER SUBMISSION ──────────────────────────────────
document.addEventListener('click', (e) => {
  if (e.target.id === 'btnSendOrderDrawer') {
    const name = document.getElementById('drawerName')?.value;
    const address = document.getElementById('drawerAddress')?.value;
    const payment = document.getElementById('drawerPayment')?.value;
    
    if (cart.length === 0) return alert('El carrito está vacío');
    if (!name) return alert('Por favor ingresa tu nombre');
    if (deliveryType === 'delivery' && !address) return alert('Por favor ingresa tu dirección');

    let msg = `*NUEVO PEDIDO - NEKO SUSHI ROLLS*\n\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    msg += `🚚 *Tipo:* ${deliveryType === 'delivery' ? '🛵 Delivery' : '🏠 Retiro'}\n`;
    if (deliveryType === 'delivery') msg += `📍 *Dirección:* ${address}\n`;
    msg += `💳 *Pago:* ${payment}\n\n`;

    msg += `🛒 *DETALLE DEL PEDIDO:*\n`;
    cart.forEach(item => {
      msg += `• *${item.name}* x${item.qty}`;
      if (item.metadata && item.metadata.desc) msg += `\n  (${item.metadata.desc})`;
      if (item.notes) msg += `\n  📝 _Nota: ${item.notes}_`;
      msg += `\n  Subtotal: ${formatPrice(item.price * item.qty)}\n\n`;
    });

    const sauces = Array.from(document.querySelectorAll('.sauce-check:checked')).map(s => s.dataset.name);
    if (sauces.length > 0) {
      msg += `🥣 *Salsas:* ${sauces.join(', ')}\n\n`;
    }

    msg += `*TOTAL A PAGAR: ${formatPrice(getTotal())}*`;

    const waUrl = `https://wa.me/56935220586?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }
});

// ── UTILS (Robust) ────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

function initObserver() {
  document.querySelectorAll('.promo-card, .menu-card, .review-card, .gallery-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.borderBottomColor = 'rgba(232,126,26,0.35)';
    } else {
      navbar.style.borderBottomColor = 'rgba(232,126,26,0.2)';
    }
  });
}

document.addEventListener('DOMContentLoaded', initObserver);
