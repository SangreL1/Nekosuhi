const PROTEINS = ["Pollo", "Carne", "Camarón", "Kanikama", "Vegetariano", "Vegano"];
const INGREDIENTS = ["Queso", "Palta", "Cebollín", "Morrón", "Pepino", "Champiñón"];
const WRAPS = [
  "Panco", "Queso", "Palta", "Sésamo", "Cebollín", "Nori", "Merquén", 
  "Nori-Panco", "Panco Merquén", "Salmón", "Jamón Serrano", "Mango", "Plátano Frito"
];

// ── STATE ───────────────────────────────────────────────────
let cart = [];
let deliveryType = 'delivery';

// ── DOM REFS ───────────────────────────────────────────────
const cartCount = document.getElementById('cartCount');
const drawerItems = document.getElementById('drawerItems');
const drawerEmpty = document.getElementById('drawerEmpty');
const drawerFooter = document.getElementById('drawerFooter');
const drawerTotal = document.getElementById('drawerTotal');

// ── PROMO BUILDER ──────────────────────────────────────────
const PromoBuilder = {
  active: false,
  currentPromo: null, // { qty, rolls, price, name }
  selections: [], // [{ protein, ingredients: [], wrap }]
  currentRollIndex: 0,

  open(promo, imgUrl) {
    this.active = true;
    this.currentPromo = promo;
    this.selections = Array.from({ length: promo.rolls }, () => ({
      protein: null,
      ingredients: [],
      wrap: "Panco"
    }));

    document.getElementById('promoBuilderModal').classList.add('open');
    if (imgUrl) document.getElementById('builderPromoImg').src = imgUrl;
    document.getElementById('builderTitle').textContent = promo.name;
    document.body.style.overflow = 'hidden';
    this.render();
  },

  close() {
    this.active = false;
    document.getElementById('promoBuilderModal').classList.remove('open');
    document.body.style.overflow = '';
  },

  render() {
    const container = document.getElementById('builderRollContainer');
    const itemCount = document.getElementById('builderItemsCount');
    const totalPriceEl = document.getElementById('builderTotalPrice');
    const confirmBtn = document.getElementById('btnConfirmPromo');

    let html = '';
    this.selections.forEach((roll, idx) => {
      html += `
        <div class="selection-row">
          <h5>ROLL ${idx + 1}</h5>
          
          <div class="builder-protein">
            <label>PROTEÍNA (Elige 1)</label>
            <div class="ingredient-grid">
              ${PROTEINS.map(p => `
                <button class="btn-select ${roll.protein === p ? 'active' : ''}" 
                  onclick="PromoBuilder.setProtein(${idx}, '${p}')">${p}</button>
              `).join('')}
            </div>
          </div>

          <div class="builder-ingredients">
            <label>RELLENOS (Elige 2)</label>
            <div class="ingredient-grid">
              ${INGREDIENTS.map(i => `
                <button class="btn-select ${roll.ingredients.includes(i) ? 'active' : ''}" 
                  onclick="PromoBuilder.toggleIngredient(${idx}, '${i}')">${i}</button>
              `).join('')}
            </div>
          </div>

          <div class="builder-wrap">
            <label>ENVOLTURA</label>
            <select class="selection-select" onchange="PromoBuilder.setWrap(${idx}, this.value)">
              ${WRAPS.map(w => `
                <option value="${w}" ${roll.wrap === w ? 'selected' : ''}>${w}</option>
              `).join('')}
            </select>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    const completedRolls = this.selections.filter(s => s.protein && s.ingredients.length === 2).length;
    const total = this.currentPromo.price;

    itemCount.textContent = `${completedRolls} / ${this.currentPromo.rolls} Rolls listos`;
    totalPriceEl.textContent = formatPrice(total);
    confirmBtn.disabled = completedRolls < this.currentPromo.rolls;
  },

  setProtein(rollIdx, val) {
    this.selections[rollIdx].protein = val;
    this.render();
  },

  toggleIngredient(rollIdx, val) {
    const roll = this.selections[rollIdx];
    if (roll.ingredients.includes(val)) {
      roll.ingredients = roll.ingredients.filter(i => i !== val);
    } else if (roll.ingredients.length < 2) {
      roll.ingredients.push(val);
    }
    this.render();
  },

  setWrap(rollIdx, name) {
    this.selections[rollIdx].wrap = name;
    this.render();
  },

  confirm() {
    const finalPrice = this.currentPromo.price;
    const details = this.selections.map((s, idx) =>
      `Roll ${idx + 1}: ${s.protein} + ${s.ingredients.join(' e ')} en ${s.wrap}`
    ).join(' | ');

    addToCart(this.currentPromo.name, finalPrice, { details });
    this.close();
  }
};

window.PromoBuilder = PromoBuilder; // Make global for onclick

// ── CART LOGIC ──────────────────────────────────────────────
function addToCart(name, price, metadata = null) {
  cart.push({
    name,
    price: parseInt(price),
    qty: 1,
    notes: '',
    metadata: metadata
  });

  saveCart();
  updateCartUI();
  showToast(`✅ ${name} agregado`);

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
  if (storedCart) cart = JSON.parse(storedCart);
}

function updateCartUI() {
  const total = getTotal();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  cartCount.textContent = count;

  renderCartItems(drawerItems, drawerEmpty);
  drawerFooter.style.display = cart.length > 0 ? 'block' : 'none';
  drawerTotal.textContent = formatPrice(total);
}

function renderCartItems(container, emptyEl) {
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
      <div class="cart-item">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          ${item.metadata && item.metadata.details ? `<small class="cart-item-details">${item.metadata.details}</small>` : ''}
        </div>
        <div class="cart-item-right">
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
          </div>
          <span class="cart-item-price">${formatPrice(item.price * item.qty)}</span>
          <button class="cart-item-remove" onclick="removeFromCart(${idx})">🗑</button>
        </div>
      </div>
    `;

    const itemNotes = document.createElement('div');
    itemNotes.className = 'cart-item-notes';
    itemNotes.innerHTML = `<textarea class="item-note-input" placeholder="Nota..." oninput="updateNote(${idx}, this.value)">${item.notes || ''}</textarea>`;

    const itemContainer = document.createElement('div');
    itemContainer.className = 'cart-item-wrapper';
    itemContainer.appendChild(div);
    itemContainer.appendChild(itemNotes);
    container.appendChild(itemContainer);
  });
}

function updateNote(idx, val) {
  cart[idx].notes = val;
  saveCart();
}

window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.updateNote = updateNote;

// ── UTILS ───────────────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── EVENTS ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  updateCartUI();

  // Click Delegation
  document.addEventListener('click', (e) => {
    // Menu Tabs
    if (e.target.classList.contains('tab-btn')) {
      const target = e.target.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === target));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + target));
    }

    // Delivery Toggle
    if (e.target.classList.contains('dt-btn')) {
      document.querySelectorAll('.dt-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      deliveryType = e.target.dataset.type;
      document.getElementById('drawerAddressGroup').style.display = deliveryType === 'delivery' ? 'block' : 'none';
      document.getElementById('drawerPickupInfo').style.display = deliveryType === 'retiro' ? 'block' : 'none';
    }

    // Add normal item
    if (e.target.classList.contains('btn-add-cart')) {
      addToCart(e.target.dataset.name, e.target.dataset.price);
    }
    if (e.target.classList.contains('btn-add-cart-sm')) {
      const card = e.target.closest('.menu-card');
      addToCart(card.dataset.name, card.dataset.price);
    }

    // Add Promo (Open Builder)
    const promoBtn = e.target.closest('.btn-add-promo');
    if (promoBtn) {
      const card = promoBtn.closest('.product-card');
      const img = card.querySelector('.product-img').src;
      PromoBuilder.open({
        qty: parseInt(promoBtn.dataset.qty),
        rolls: parseInt(promoBtn.dataset.rolls),
        price: parseInt(promoBtn.dataset.price),
        name: `Promo ${promoBtn.dataset.qty} Piezas`
      }, img);
    }

    // Modal Closes
    if (e.target.closest('#builderClose') || e.target.id === 'builderOverlay') PromoBuilder.close();
    if (e.target.closest('#btnConfirmPromo')) PromoBuilder.confirm();
 
    // Drawer Closes
    if (e.target.closest('#cartBtn')) document.getElementById('cartDrawer').classList.add('open');
    if (e.target.closest('#cartClose') || e.target.id === 'cartOverlay') document.getElementById('cartDrawer').classList.remove('open');

    // Hamburger
    if (e.target.closest('#hamburger')) {
      document.getElementById('navLinks').classList.toggle('open');
    }

    // Auto-close mobile menu on link click
    if (e.target.tagName === 'A' && e.target.closest('#navLinks')) {
      document.getElementById('navLinks').classList.remove('open');
    }
  });

  // Order Submission
  document.getElementById('btnSendOrderDrawer').addEventListener('click', () => {
    const name = document.getElementById('drawerName').value;
    const address = document.getElementById('drawerAddress').value;
    const payment = document.getElementById('drawerPayment').value;

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
      if (item.metadata && item.metadata.details) msg += `\n  (${item.metadata.details})`;
      if (item.notes) msg += `\n  📝 _Nota: ${item.notes}_`;
      msg += `\n  Subtotal: ${formatPrice(item.price * item.qty)}\n\n`;
    });

    const sauces = Array.from(document.querySelectorAll('.sauce-check:checked')).map(s => s.dataset.name);
    if (sauces.length > 0) msg += `🥣 *Salsas:* ${sauces.join(', ')}\n\n`;

    msg += `*TOTAL A PAGAR: ${formatPrice(getTotal())}*`;

    window.open(`https://wa.me/56935220586?text=${encodeURIComponent(msg)}`, '_blank');
  });
});

// ── NAVIGATION ──────────────────────────────────────────────
function showCategorySection(id) {
  // Hide only the menu sections, leave map/reviews/footer visible
  document.querySelectorAll('.menu-section').forEach(s => s.style.display = 'none');
  document.querySelector('.categories-section').style.display = 'none';
  
  const target = document.getElementById(id);
  if (target) {
    target.style.display = 'block';
    // Add back button if not already added
    let header = target.querySelector('.section-header');
    if (header && !header.querySelector('.back-to-menu')) {
      const backBtn = document.createElement('button');
      backBtn.className = 'back-to-menu';
      backBtn.innerHTML = '← Volver al inicio';
      backBtn.onclick = hideCategorySections;
      header.prepend(backBtn);
    }
  }
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

function hideCategorySections() {
  // Only hide menu sections — map, reviews, footer stay visible
  document.querySelectorAll('.menu-section').forEach(s => s.style.display = 'none');
  document.querySelector('.categories-section').style.display = 'block';
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

// Ensure logo returns home
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.nav-logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      hideCategorySections();
    });
  }
});

function closeMenu() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.remove('open');
}

// ── BOX ADD TO CART ──────────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-box-add');
  if (!btn) return;
  
  const boxCard = btn.closest('.box-card');
  const name = btn.dataset.name;
  const price = parseInt(btn.dataset.price);
  
  // Get selected topping from dropdown
  const select = boxCard.querySelector('.box-select');
  const toppingValue = select ? select.value : null;
  
  let details = '';
  if (toppingValue && toppingValue !== 'Sin topping') {
    details = `Topping: ${toppingValue}`;
  } else if (select) {
    details = 'Sin topping seleccionado';
  }
  
  // Use addToCart with correct metadata format
  addToCart(name, price, details ? { details } : null);
});

window.showCategorySection = showCategorySection;
window.hideCategorySections = hideCategorySections;
window.closeMenu = closeMenu;
