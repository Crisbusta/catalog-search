const state = {
  page: 0,
  size: 8,
  totalPages: 0,
};
const CLP_RATE = 900;

const el = {
  q: document.getElementById('q'),
  brand: document.getElementById('brand'),
  category: document.getElementById('category'),
  minPrice: document.getElementById('minPrice'),
  maxPrice: document.getElementById('maxPrice'),
  sortBy: document.getElementById('sortBy'),
  sortDir: document.getElementById('sortDir'),
  apply: document.getElementById('applyFilters'),
  clear: document.getElementById('clearFilters'),
  products: document.getElementById('products'),
  summary: document.getElementById('summary'),
  titleResults: document.getElementById('titleResults'),
  error: document.getElementById('error'),
  prevPage: document.getElementById('prevPage'),
  nextPage: document.getElementById('nextPage'),
  pageInfo: document.getElementById('pageInfo'),
  dialog: document.getElementById('productDialog'),
  dialogContent: document.getElementById('dialogContent'),
  closeDialog: document.getElementById('closeDialog'),
};

function formatPrice(value) {
  const clpValue = Math.round(Number(value) * CLP_RATE);
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(clpValue);
}

function formatClpInput(value) {
  const numeric = parseClpInput(value);
  if (numeric === null) {
    return '';
  }

  const formatted = new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 0,
  }).format(numeric);
  return `$ ${formatted}`;
}

function parseClpInput(value) {
  const digitsOnly = String(value || '').replace(/\D/g, '');
  if (!digitsOnly) {
    return null;
  }

  return Number(digitsOnly);
}

function validateFilters() {
  const minClp = parseClpInput(el.minPrice.value);
  const maxClp = parseClpInput(el.maxPrice.value);

  if (minClp !== null && maxClp !== null && minClp > maxClp) {
    setError('El precio minimo no puede ser mayor que el precio maximo.');
    return false;
  }

  if (el.brand.value.trim().length > 60) {
    setError('La marca no puede superar 60 caracteres.');
    return false;
  }

  if (el.category.value.trim().length > 60) {
    setError('La categoria no puede superar 60 caracteres.');
    return false;
  }

  return true;
}

function buildParams() {
  const minClp = parseClpInput(el.minPrice.value);
  const maxClp = parseClpInput(el.maxPrice.value);
  const params = new URLSearchParams({
    page: String(state.page),
    size: String(state.size),
    sortBy: el.sortBy.value,
    sortDir: el.sortDir.value,
  });

  if (el.q.value.trim()) params.set('q', el.q.value.trim());
  if (el.brand.value.trim()) params.set('brand', el.brand.value.trim());
  if (el.category.value.trim()) params.set('category', el.category.value.trim());
  if (minClp !== null) params.set('minPrice', (minClp / CLP_RATE).toFixed(2));
  if (maxClp !== null) params.set('maxPrice', (maxClp / CLP_RATE).toFixed(2));

  return params;
}

function setError(message) {
  if (!message) {
    el.error.textContent = '';
    el.error.classList.add('hidden');
    return;
  }
  el.error.textContent = message;
  el.error.classList.remove('hidden');
}

function renderCards(items) {
  if (!items.length) {
    el.products.innerHTML = '<p class="empty">No encontramos productos con esos filtros.</p>';
    return;
  }

  el.products.innerHTML = items.map((p) => {
    const tags = (p.tags || []).slice(0, 2);
    const discount = p.oldPrice ? Math.max(0, Math.round(((Number(p.oldPrice) - Number(p.price)) / Number(p.oldPrice)) * 100)) : 0;

    return `
      <article class="product-card">
        <div class="card-image-wrap">
          ${discount > 0 ? `<span class="sale-badge">Rebaja ${discount}%</span>` : ''}
          <img class="product-image" src="${p.imageUrl || ''}" alt="${p.name}" loading="lazy" />
          <div class="image-placeholder hidden" aria-hidden="true">
            <span>Imagen pronto</span>
          </div>
        </div>
        <button data-id="${p.id}" class="add-btn">+ Agregar</button>
        <div class="price-row">
          <strong>${formatPrice(p.price)}</strong>
          ${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ''}
        </div>
        <p class="brand">${p.brand}</p>
        <h3 class="name">${p.name}</h3>
        <div class="meta-row">
          <span class="stock">Stock ${p.stock}</span>
          <span class="category">${p.category}</span>
        </div>
        <div class="tags">${tags.map((t) => `<span>#${t}</span>`).join('')}</div>
      </article>
    `;
  }).join('');

  document.querySelectorAll('.add-btn').forEach((btn) => {
    btn.addEventListener('click', () => loadProductDetail(btn.dataset.id));
  });

  document.querySelectorAll('.card-image-wrap').forEach((wrap) => {
    const img = wrap.querySelector('.product-image');
    const placeholder = wrap.querySelector('.image-placeholder');

    const showPlaceholder = () => {
      img.classList.add('hidden');
      placeholder.classList.remove('hidden');
    };

    if (!img.getAttribute('src')) {
      showPlaceholder();
      return;
    }

    img.addEventListener('error', showPlaceholder, { once: true });
  });
}

async function loadProducts() {
  setError('');
  if (!validateFilters()) {
    return;
  }

  try {
    const res = await fetch(`/api/v1/products?${buildParams()}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || 'Error consultando productos');
    }

    state.totalPages = data.totalPages;
    renderCards(data.items);

    const query = el.q.value.trim();
    el.titleResults.textContent = query ? `Resultados para ${query}` : 'Resultados';
    el.summary.textContent = `${data.totalItems} productos encontrados`;
    el.pageInfo.textContent = `Pagina ${data.totalPages === 0 ? 0 : data.page + 1} de ${data.totalPages}`;

    el.prevPage.disabled = data.page <= 0;
    el.nextPage.disabled = data.totalPages === 0 || data.page + 1 >= data.totalPages;
  } catch (err) {
    setError(err.message || 'Error inesperado');
  }
}

async function loadProductDetail(id) {
  try {
    const res = await fetch(`/api/v1/products/${id}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'No se pudo obtener el detalle');
    }

    el.dialogContent.innerHTML = `
      <h3>${data.name}</h3>
      <p>${data.description}</p>
      <p><strong>Marca:</strong> ${data.brand}</p>
      <p><strong>Categoria:</strong> ${data.category}</p>
      <p><strong>Precio:</strong> ${formatPrice(data.price)}</p>
      <p><strong>Stock:</strong> ${data.stock}</p>
      <p><strong>Tags:</strong> ${(data.tags || []).join(', ')}</p>
    `;

    el.dialog.showModal();
  } catch (err) {
    setError(err.message || 'Error cargando detalle');
  }
}

function resetFilters() {
  el.q.value = '';
  el.brand.value = '';
  el.category.value = '';
  el.minPrice.value = '';
  el.maxPrice.value = '';
  el.sortBy.value = 'name';
  el.sortDir.value = 'asc';
  state.page = 0;
  loadProducts();
}

function normalizePriceInput(input) {
  input.value = formatClpInput(input.value);
}

function applyAndResetPage() {
  state.page = 0;
  loadProducts();
}

el.apply.addEventListener('click', applyAndResetPage);
el.clear.addEventListener('click', resetFilters);
el.sortBy.addEventListener('change', applyAndResetPage);
el.sortDir.addEventListener('change', applyAndResetPage);

[el.brand, el.category, el.minPrice, el.maxPrice].forEach((input) => {
  input.addEventListener('change', applyAndResetPage);
});

[el.minPrice, el.maxPrice].forEach((input) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^\d]/g, '');
  });
  input.addEventListener('blur', () => normalizePriceInput(input));
});

el.q.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    applyAndResetPage();
  }
});

el.prevPage.addEventListener('click', () => {
  if (state.page > 0) {
    state.page -= 1;
    loadProducts();
  }
});

el.nextPage.addEventListener('click', () => {
  if (state.page + 1 < state.totalPages) {
    state.page += 1;
    loadProducts();
  }
});

el.closeDialog.addEventListener('click', () => el.dialog.close());

loadProducts();
