const PROTEINS = ["Pollo", "Carne", "Camarón", "Kanikama", "Vegetariano", "Vegano"];
const INGREDIENTS = ["Queso", "Palta", "Cebollín", "Morrón", "Pepino", "Champiñón", "Palmito"];

const INGREDIENT_PRICES = {
  "Champiñón": 500,
  "Palmito": 500
};

const RESTRICTED_PROTEINS = ["Pollo", "Carne", "Camarón", "Kanikama"];
const RESTRICTED_INGREDIENTS = ["Queso", "Palta", "Cebollín", "Morrón"];

const WRAPS = [
  "Panco", "Queso", "Palta", "Sésamo", "Cebollín", "Nori", "Merquén", 
  "Nori-Panco", "Panco Merquén", "Salmón", "Jamón Serrano", "Mango", "Plátano Frito",
  "Champiñón", "Palmito"
];

const WRAP_PRICES = {
  "Salmón": 1500,
  "Jamón Serrano": 1500,
  "Mango": 1000,
  "Champiñón": 500,
  "Palmito": 500
};

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
  currentPromo: null, // { qty, rolls, price, name, restricted, customFee }
  selections: [], // [{ protein, ingredients: [], wrap }]
  customizing: false,

  open(promo, imgUrl) {
    this.active = true;
    this.currentPromo = promo;
    this.customizing = !promo.restricted; // For restricted promos, start with customizing = false (Fixed)
    
    this.selections = Array.from({ length: promo.rolls }, () => ({
      protein: null,
      ingredients: [],
      wrap: "Panco",
      nori: "Con Nori"
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
    
    // Header for customization choice
    if (this.currentPromo.restricted) {
      html += `
        <div class="custom-toggle-area" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--dark); border-radius: 12px; border: 1px dashed var(--primary);">
          <h4 style="margin-bottom: 0.5rem; font-weight: 800; color: var(--light);">¿CÓMO QUIERES TU PROMO?</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.2rem;">Las piezas de esta promo son fijas. Si deseas personalizarlas, se cobrará un adicional.</p>
          <div style="display: flex; gap: 1rem;">
            <button class="btn-select ${!this.customizing ? 'active' : ''}" onclick="PromoBuilder.setCustomizing(false)">COMBO FIJO (Estándar)</button>
            <button class="btn-select ${this.customizing ? 'active' : ''}" onclick="PromoBuilder.setCustomizing(true)">PERSONALIZAR (+${formatPrice(this.currentPromo.customFee)})</button>
          </div>
        </div>
      `;
    }

    if (this.customizing) {
      const pList = this.currentPromo.restricted ? RESTRICTED_PROTEINS : PROTEINS;
      const iList = this.currentPromo.restricted ? RESTRICTED_INGREDIENTS : INGREDIENTS;

      this.selections.forEach((roll, idx) => {
        html += `
          <div class="selection-row">
            <h5>ROLL ${idx + 1}</h5>
            <div class="builder-protein">
              <label>PROTEÍNA (Elige 1)</label>
              <div class="ingredient-grid">
                ${pList.map(p => `
                  <button class="btn-select ${roll.protein === p ? 'active' : ''}" 
                    onclick="PromoBuilder.setProtein(${idx}, '${p}')">${p}</button>
                `).join('')}
              </div>
            </div>
            <div class="builder-ingredients">
              <label>RELLENOS (Elige 2)</label>
              <div class="ingredient-grid">
                ${iList.map(i => `
                  <button class="btn-select ${roll.ingredients.includes(i) ? 'active' : ''}" 
                    onclick="PromoBuilder.toggleIngredient(${idx}, '${i}')">
                    ${i} ${INGREDIENT_PRICES[i] ? '<br><small>(+' + formatPrice(INGREDIENT_PRICES[i]) + ')</small>' : ''}
                  </button>
                `).join('')}
              </div>
            </div>
            <div class="builder-wrap">
            <div style="display:flex; gap:0.5rem;">
              <div style="flex:1">
                <label>ENVOLTURA</label>
                <select class="selection-select" onchange="PromoBuilder.setWrap(${idx}, this.value)">
                  ${WRAPS.map(w => `
                    <option value="${w}" ${roll.wrap === w ? 'selected' : ''}>${w} ${WRAP_PRICES[w] ? '(' + formatPrice(WRAP_PRICES[w]) + ')' : ''}</option>
                  `).join('')}
                </select>
              </div>
              <div style="flex:1">
                <label>NORI</label>
                <select class="selection-select" onchange="PromoBuilder.setNori(${idx}, this.value)">
                  <option value="Con Nori" ${roll.nori === 'Con Nori' ? 'selected' : ''}>Con Nori</option>
                  <option value="Sin Nori" ${roll.nori === 'Sin Nori' ? 'selected' : ''}>Sin Nori</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;
      });
    } else {
      html += `
        <div style="text-align: center; padding: 3rem 0;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🍱</div>
          <h3 style="font-weight: 900;">COMBO ESTÁNDAR SELECCIONADO</h3>
          <p style="color: #666;">Se agregarán los rellenos mixtos tradicionales de la casa.</p>
        </div>
      `;
    }

    container.innerHTML = html;

    const completedRolls = this.selections.filter(s => s.protein && s.ingredients.length === 2).length;
    let total = this.currentPromo.price;
    
    if (this.customizing) {
      if (this.currentPromo.restricted) total += this.currentPromo.customFee;
      // Add wrap surcharges
      this.selections.forEach(s => {
        if (WRAP_PRICES[s.wrap]) total += WRAP_PRICES[s.wrap];
        // Add ingredient surcharges
        s.ingredients.forEach(ing => {
          if (INGREDIENT_PRICES[ing]) total += INGREDIENT_PRICES[ing];
        });
      });
    }

    if (this.customizing) {
      itemCount.textContent = `${completedRolls} / ${this.currentPromo.rolls} Rolls listos`;
      confirmBtn.disabled = completedRolls < this.currentPromo.rolls;
    } else {
      itemCount.textContent = `Combo Fijo`;
      confirmBtn.disabled = false;
    }
    
    totalPriceEl.textContent = formatPrice(total);
  },

  setCustomizing(val) {
    this.customizing = val;
    this.render();
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

  setNori(rollIdx, name) {
    this.selections[rollIdx].nori = name;
    this.render();
  },

  confirm() {
    let finalPrice = this.currentPromo.price;
    let details = 'Combo Estándar (Fijo)';
    
    if (this.customizing) {
      if (this.currentPromo.restricted) finalPrice += this.currentPromo.customFee;
      
      // Add wrap surcharges to final price
      this.selections.forEach(s => {
        if (WRAP_PRICES[s.wrap]) finalPrice += WRAP_PRICES[s.wrap];
        // Add ingredient surcharges to final price
        s.ingredients.forEach(ing => {
          if (INGREDIENT_PRICES[ing]) finalPrice += INGREDIENT_PRICES[ing];
        });
      });

      details = this.selections.map((s, idx) =>
        `Roll ${idx + 1}: ${s.protein} + ${s.ingredients.join(' e ')} en ${s.wrap} (${s.nori})`
      ).join(' | ');
    } else {
      // Check if there's a global nori select in the promo card
      const nori = document.querySelector('.nori-global-promo')?.value || 'Con Nori';
      details += ` | ${nori}`;
    }

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
      const card = e.target.closest('.product-card');
      const nori = card.querySelector('.nori-select')?.value || 'Con Nori';
      const wrap = card.querySelector('.wrap-select')?.value;
      
      let price = parseInt(e.target.dataset.price);
      if (wrap && WRAP_PRICES[wrap]) {
        price += WRAP_PRICES[wrap];
      }

      let details = `Nori: ${nori}`;
      if (wrap) details = `Envuelto en ${wrap} | ${details}`;
      
      const existingDetails = e.target.dataset.details || '';
      const finalDetails = existingDetails ? `${existingDetails} | ${details}` : details;
      addToCart(e.target.dataset.name, price, { details: finalDetails });
    }
    if (e.target.classList.contains('btn-add-cart-sm')) {
      const card = e.target.closest('.menu-card');
      const nori = card.querySelector('.nori-select')?.value || 'Con Nori';
      const finalDetails = `Nori: ${nori}`;
      addToCart(card.dataset.name, card.dataset.price, { details: finalDetails });
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
        name: promoBtn.dataset.name || `Promo ${promoBtn.dataset.qty} Piezas`,
        restricted: promoBtn.dataset.restricted === "true",
        customFee: parseInt(promoBtn.dataset.customFee || 0)
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
// ── BOXES ADD TO CART ───────────────────────────────────────
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-box-add')) {
    const card = e.target.closest('.box-card');
    const topping = card.querySelector('.box-select')?.value || 'Sin topping';
    const nori = card.querySelector('.nori-select')?.value || 'Con Nori';
    const name = e.target.dataset.name;
    const price = parseInt(e.target.dataset.price);
    addToCart(name, price, { details: `Topping: ${topping} | Nori: ${nori}` });
  }
});

// ── OFERTAS ADD TO CART ─────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-add-offer-custom');
  if (!btn) return;

  const card = btn.closest('.product-card');
  const name = card.dataset.name;
  const price = parseInt(card.dataset.price);
  const type = btn.dataset.type;

  let finalPrice = price;
  let details = '';
  if (type === '20-mixtas') {
    const f1 = card.querySelector('.fill-choice-1').value;
    const w1 = card.querySelector('.wrap-choice-1').value;
    const f2 = card.querySelector('.fill-choice-2').value;
    const w2 = card.querySelector('.wrap-choice-2').value;
    const nori = card.querySelector('.nori-select')?.value || 'Con Nori';
    
    // Add surcharges for both rolls
    if (WRAP_PRICES[w1]) finalPrice += WRAP_PRICES[w1];
    if (WRAP_PRICES[w2]) finalPrice += WRAP_PRICES[w2];

    details = `Roll 1: ${f1} en ${w1} | Roll 2: ${f2} en ${w2} | ${nori}`;
  } else if (type === '3-hr') {
    const nori = card.querySelector('.nori-choice').value;
    details = `Relleno Fijo (Pollo). ${nori}`;
  }

  addToCart(name, finalPrice, details ? { details } : null);
});

window.showCategorySection = showCategorySection;
window.hideCategorySections = hideCategorySections;
window.closeMenu = closeMenu;
