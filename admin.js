// Importar Firestore y Config
import { db, storage } from './firebase-config.js';
import { collection, doc, setDoc, deleteDoc, writeBatch, onSnapshot, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// State
let appMode = 'stock';
let currentInventory = [];
let currentCategory = 'Todo';
let searchQuery = '';
let editingId = null;
let tempVariants = [];
let pendingAction = null;
let analyticsMode = 'day';
let allSales = []; // Stores sales from Firestore
let currentOrder = [];

// DOM Elements
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const drawerBody = document.getElementById('drawer-body');
const drawerFooter = document.getElementById('drawer-footer');
const drawerTitle = document.getElementById('drawer-title');
const confirmModal = document.getElementById('confirm-modal');
const confirmMsg = document.getElementById('confirm-msg');
const statusEl = document.getElementById('save-status');

// --- Helper para exponer funciones globales ---
const expose = (name, fn) => window[name] = fn;

document.addEventListener('DOMContentLoaded', () => {
    loadData(); // Initializes listener
    switchAppMode('stock');
});

// --- Data & Persistence (FIRESTORE REAL-TIME) ---
function loadData() {
    statusEl.innerHTML = '<span class="animate-pulse w-2 h-2 rounded-full bg-yellow-400"></span> Conectando...';

    // Listen for real-time updates
    const unsubscribe = onSnapshot(collection(db, "productos"), (querySnapshot) => {
        currentInventory = [];
        querySnapshot.forEach((doc) => {
            currentInventory.push(doc.data());
        });

        // Migration check
        currentInventory.forEach(p => { if (!p.variants) p.variants = []; });

        renderTable();

        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> En Línea';
    }, (error) => {
        console.error("Error getting documents: ", error);
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error Excéntrico';
    });

    // Listen for SALES updates (Real-time History)
    // We order by timestamp desc to have latest first
    const salesQuery = query(collection(db, "ventas"), orderBy("timestamp", "desc"), limit(200));
    onSnapshot(salesQuery, (snapshot) => {
        allSales = [];
        snapshot.forEach((doc) => {
            allSales.push({ id: doc.id, ...doc.data() });
        });
        renderAnalytics();
    });
}
expose('loadData', loadData);

// Ya no usamos autoSave localStorage. Usamos setDoc directo en las acciones.
function saveToDisk() {
    const data = `const products = ${JSON.stringify(currentInventory, null, 4)};`;
    document.getElementById('code-output').value = data;
    document.getElementById('code-output').select();
    document.execCommand('copy');
    alert('Backup copiado. Pégalo en products.js.');
}
expose('saveToDisk', saveToDisk);

// --- Confirm ---
function requestConfirm(message, callback) {
    confirmMsg.innerHTML = message;
    confirmModal.classList.remove('hidden');
    pendingAction = callback;
}
expose('requestConfirm', requestConfirm);

function closeConfirm(confirmed) {
    confirmModal.classList.add('hidden');
    if (confirmed && pendingAction) pendingAction();
    pendingAction = null;
}
expose('closeConfirm', closeConfirm);

// --- Logic ---
function switchAppMode(mode) {
    appMode = mode;
    closeDrawer();

    const btnStock = document.getElementById('btn-mode-stock');
    const btnRegistro = document.getElementById('btn-mode-registro');
    const btnVender = document.getElementById('btn-mode-vender');

    const mainArea = document.getElementById('main-area');
    const registroView = document.getElementById('registro-view');
    const stockActions = document.getElementById('stock-actions');

    // Reset Buttons
    [btnStock, btnRegistro, btnVender].forEach(b => {
        b.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
        b.classList.add('text-gray-400', 'bg-transparent');
    });

    // Reset Views
    mainArea.classList.remove('hidden');
    registroView.classList.add('hidden');
    stockActions.classList.add('hidden');

    if (mode === 'registro') {
        btnRegistro.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btnRegistro.classList.remove('text-gray-400', 'bg-transparent');

        mainArea.classList.add('hidden');
        registroView.classList.remove('hidden');
        renderAnalytics();
        return;
    }

    if (mode === 'vender') {
        btnVender.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btnVender.classList.remove('text-gray-400', 'bg-transparent');
        updateMiniCart();
    }

    if (mode === 'stock') {
        btnStock.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btnStock.classList.remove('text-gray-400', 'bg-transparent');
        stockActions.classList.remove('hidden');
    }
    renderTable();
}
expose('switchAppMode', switchAppMode);


// --- Analytics & History ---
function setFilterMode(mode) {
    analyticsMode = mode;
    const btnDay = document.getElementById('filter-day');
    const btnMonth = document.getElementById('filter-month');
    const pickerDay = document.getElementById('date-picker').parentElement;
    const pickerMonth = document.getElementById('month-picker-container');

    if (mode === 'day') {
        btnDay.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btnDay.classList.remove('text-gray-500', 'hover:text-gray-700');
        btnMonth.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
        btnMonth.classList.add('text-gray-500', 'hover:text-gray-700');

        pickerDay.classList.remove('hidden');
        pickerMonth.classList.add('hidden');
    } else {
        btnMonth.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btnMonth.classList.remove('text-gray-500', 'hover:text-gray-700');
        btnDay.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
        btnDay.classList.add('text-gray-500', 'hover:text-gray-700');

        pickerDay.classList.add('hidden');
        pickerMonth.classList.remove('hidden');
    }
    renderAnalytics();
}
expose('setFilterMode', setFilterMode);

function renderAnalytics() {
    const dateInput = document.getElementById('date-picker');
    const monthInput = document.getElementById('month-picker');
    if (!dateInput.value) dateInput.valueAsDate = new Date();
    if (!monthInput.value) {
        const now = new Date();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        monthInput.value = `${now.getFullYear()}-${m}`;
    }

    const historyBody = document.getElementById('sales-history-body');
    const salesData = allSales;

    let filteredSales = [];
    const label = document.getElementById('showing-label');

    if (analyticsMode === 'day') {
        const selectedDateStr = dateInput.value;
        filteredSales = salesData.filter(s => {
            const d = new Date(s.timestamp);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}` === selectedDateStr;
        });
        label.innerText = `Mostrando: ${selectedDateStr}`;
    } else {
        const selectedMonthStr = monthInput.value;
        filteredSales = salesData.filter(s => {
            const d = new Date(s.timestamp);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            return `${year}-${month}` === selectedMonthStr;
        });
        label.innerText = `Mostrando mes: ${selectedMonthStr}`;
    }

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);

    document.getElementById('stats-count').innerText = filteredSales.length;
    document.getElementById('stats-revenue').innerText = `$${totalRevenue.toLocaleString()}`;

    historyBody.innerHTML = filteredSales.slice(0, 100).map(s => {
        const dateStart = new Date(s.timestamp);
        const dateStr = dateStart.toLocaleDateString() + ' ' + dateStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const itemsStr = s.items.map(i => `<span class="block text-gray-600">${i.name} (${i.color}-${i.size}) x${i.qty}</span>`).join('');

        return `
            <tr class="hover:bg-gray-50 border-b border-gray-50 last:border-0">
                <td class="p-4 font-mono text-xs text-gray-500 whitespace-nowrap align-top">${dateStr}</td>
                <td class="p-4 align-top">${itemsStr}</td>
                <td class="p-4 text-center align-top font-bold text-gray-600">${s.items.length}</td>
                <td class="p-4 text-right align-top font-bold text-gray-900">$${s.total.toLocaleString()}</td>
            </tr>
        `
    }).join('');

    if (filteredSales.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-gray-400 italic">No hay ventas registradas en esta fecha.</td></tr>`;
    }
}
expose('renderAnalytics', renderAnalytics);

function filterCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-tab').forEach(btn => {
        if (btn.dataset.cat === cat) {
            btn.classList.add('text-gray-800', 'border-mint');
            btn.classList.remove('text-gray-400', 'border-transparent');
        } else {
            btn.classList.remove('text-gray-800', 'border-mint');
            btn.classList.add('text-gray-400', 'border-transparent');
        }
    });
    renderTable();
}
expose('filterCategory', filterCategory);

function handleSearch(val) {
    searchQuery = val.toLowerCase();
    renderTable();
}
expose('handleSearch', handleSearch);

function renderTable() {
    const tbody = document.getElementById('inventory-table');
    let filtered = currentInventory.filter(p => {
        if (currentCategory === 'Todo') return true;
        if (currentCategory === 'Ofertas') return p.isOffer === true; // Nuevo filtro Ofertas

        // Normalize helper
        const normalize = (str) => str ? str.toLowerCase().trim() : '';
        const target = normalize(currentCategory);

        // Synonym map
        const synonyms = {
            'bebés': ['bebes', 'bebe', 'bebé', 'bebe rn', 'recién nacido', 'rn', 'bebés'],
            'no caminantes': ['no caminantes', 'no caminante'],
            'niños': ['niños', 'niño', 'ninos', 'nino'],
            'niñas': ['niñas', 'niña', 'ninas', 'nina']
        };

        const targetSynonyms = synonyms[target] || [target];

        const hasVariantInSection = (p.variants || []).some(v => {
            const s = normalize(v.section);
            return targetSynonyms.some(syn => s.includes(syn) || syn.includes(s));
        });

        const cat = normalize(p.category);
        const isLegacyMatch = targetSynonyms.some(syn => cat.includes(syn) || syn.includes(cat));

        return hasVariantInSection || isLegacyMatch;
    });

    if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
    }

    tbody.innerHTML = filtered.map(p => {
        const totalStock = (p.variants || []).reduce((sum, v) => sum + v.stock, 0);
        const stockColor = totalStock === 0 ? 'text-red-500 bg-red-50' : (totalStock < 5 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50');

        let actionIcon = '<i class="fa-solid fa-pen"></i>';
        let actionClass = 'bg-gray-100 text-gray-600 hover:bg-gray-200';

        if (appMode === 'vender') {
            actionIcon = '<i class="fa-solid fa-cart-plus"></i>';
            actionClass = 'bg-mint/10 text-mint hover:bg-mint hover:text-white';
        }

        // Offer Visuals
        const offerBadge = p.isOffer ? '<span class="ml-2 bg-mustard text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Oferta</span>' : '';
        const priceDisplay = p.isOffer
            ? `<div class="flex flex-col"><span class="text-green-600">$${p.offerPrice.toLocaleString()}</span><span class="text-xs text-gray-400 line-through">$${p.price.toLocaleString()}</span></div>`
            : `$${p.price.toLocaleString()}`;

        return `
        <tr class="hover:bg-gray-50 transition cursor-pointer group" onclick="itemClick(${p.id})">
            <td class="p-4">
                <img src="${p.image}" class="w-12 h-12 rounded-lg object-cover bg-gray-200 shadow-sm border border-gray-100">
            </td>
            <td class="p-4">
                <div class="font-bold text-gray-800 text-base flex items-center">${p.name} ${offerBadge}</div>
            </td>
            <td class="p-4 text-center">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${stockColor}">${totalStock} dispo</span>
            </td>
            <td class="p-4 font-mono text-gray-600 font-bold">${priceDisplay}</td>
            <td class="p-4 text-right">
                <button class="w-10 h-10 rounded-full ${actionClass} flex items-center justify-center transition-all">
                    ${actionIcon}
                </button>
            </td>
        </tr>
        `
    }).join('');
}
expose('renderTable', renderTable);

function itemClick(id) {
    if (appMode === 'stock') {
        openStockDrawer(id);
    } else if (appMode === 'vender') {
        openVariantSelector(id);
    }
}
expose('itemClick', itemClick);

// --- STOCK DRAWER ---
function openStockDrawer(id) {
    editingId = id;
    const renderForm = (name, price, image, isOffer, offerPrice) => `
        <div class="space-y-6">
            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 class="text-xs font-bold uppercase text-gray-400">Datos Principales</h3>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Nombre de la Prenda</label>
                    <input type="text" id="edit-name" value="${name}" class="w-full border-2 border-gray-100 p-3 rounded-lg focus:bg-white focus:outline-none focus:border-mint font-bold text-gray-800 text-lg placeholder-gray-300" placeholder="Ej: Body Rayado">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Precio Real ($)</label>
                        <input type="number" id="edit-price" value="${price}" class="w-full border-2 border-gray-100 p-3 rounded-lg focus:border-mint focus:outline-none font-mono font-bold" placeholder="0">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Imagen (URL)</label>
                        <div class="flex gap-2">
                             <input type="text" id="edit-image" value="${image}" class="w-full border-2 border-gray-100 p-3 rounded-lg focus:border-mint focus:outline-none text-xs" placeholder="https://...">
                             <label class="cursor-pointer bg-gray-900 text-white w-12 flex items-center justify-center rounded-lg hover:bg-black transition shadow-sm" title="Subir Imagen">
                                <input type="file" class="hidden" onchange="uploadImage(this)">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                             </label>
                        </div>
                        <div id="upload-status" class="text-[10px] font-bold text-mint mt-1 hidden">Subiendo...</div>
                    </div>
                </div>

                <!-- Oferta Section -->
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mt-2">
                    <div class="flex items-center justify-between mb-2">
                        <label class="flex items-center cursor-pointer gap-2">
                            <input type="checkbox" id="edit-is-offer" class="w-5 h-5 accent-mustard" ${isOffer ? 'checked' : ''} onchange="document.getElementById('offer-price-container').classList.toggle('hidden', !this.checked)">
                            <span class="text-sm font-bold text-gray-800">¿Es una Oferta?</span>
                        </label>
                        <i class="fa-solid fa-tag text-mustard text-xl"></i>
                    </div>
                    <div id="offer-price-container" class="${isOffer ? '' : 'hidden'} animate-fade-in-down">
                        <label class="block text-xs font-bold text-gray-600 mb-1">Precio Promocional ($)</label>
                        <input type="number" id="edit-offer-price" value="${offerPrice || ''}" class="w-full border-2 border-yellow-200 bg-white p-2 rounded-lg focus:border-mustard focus:outline-none font-mono font-bold text-gray-800" placeholder="Ej: 4000">
                        <div class="text-[10px] text-gray-400 mt-1 italic">El precio anterior aparecerá tachado.</div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                    <i class="fa-solid fa-tags text-mint"></i> Variantes & Stock
                </h3>
                
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                    <div class="grid grid-cols-12 gap-2 items-end">
                        <div class="col-span-3">
                            <label class="text-xs font-bold text-gray-400 block mb-1">Sección</label>
                            <select id="new-var-section" class="w-full border p-2 rounded text-sm bg-white font-bold text-gray-700">
                                <option value="Bebés">Bebé</option>
                                <option value="No caminantes">No caminantes</option>
                                <option value="Niños">Niño</option>
                                <option value="Niñas">Niña</option>
                            </select>
                        </div>
                        <div class="col-span-3">
                            <label class="text-xs font-bold text-gray-400 block mb-1">Color</label>
                            <input type="text" id="new-var-color" placeholder="Ej: Rojo" class="w-full border p-2 rounded text-sm">
                        </div>
                        <div class="col-span-3">
                            <label class="text-xs font-bold text-gray-400 block mb-1">Talle</label>
                            <input type="text" id="new-var-size" placeholder="Ej: 4" class="w-full border p-2 rounded text-sm">
                        </div>
                        <div class="col-span-2">
                            <label class="text-xs font-bold text-gray-400 block mb-1">Cant.</label>
                            <input type="number" id="new-var-stock" placeholder="1" class="w-full border p-2 rounded text-sm text-center font-bold">
                        </div>
                        <div class="col-span-1">
                            <button onclick="addVariant()" class="w-full bg-gray-900 text-white h-[38px] rounded hover:bg-black flex items-center justify-center transition">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="variants-list" class="space-y-2 max-h-[300px] overflow-y-auto pr-1"></div>
            </div>
        </div>
    `;

    if (id) {
        const p = currentInventory.find(x => x.id === id);
        tempVariants = JSON.parse(JSON.stringify(p.variants || []));
        drawerTitle.innerText = 'Editar Producto';
        drawerBody.innerHTML = renderForm(p.name, p.price, p.image, p.isOffer || false, p.offerPrice || 0);
        drawerFooter.innerHTML = `
            <div class="space-y-3">
                <button onclick="preSaveCheck()" class="w-full bg-mint text-white font-bold py-4 rounded-xl hover:bg-[#8BCBCB] shadow-lg text-lg">Guardar Cambios</button>
                <button onclick="preDeleteCheck()" class="w-full text-red-400 text-sm font-bold hover:text-red-600">Eliminar Producto</button>
            </div>
        `;
    } else {
        editingId = null;
        tempVariants = [];
        drawerTitle.innerText = 'Nuevo Producto';
        // Default offer false
        drawerBody.innerHTML = renderForm('', '', '', false, 0);
        drawerFooter.innerHTML = `<button onclick="preSaveCheck()" class="w-full bg-mint text-white font-bold py-4 rounded-xl shadow-lg text-lg">Crear Producto</button>`;
    }

    renderStockVariants();
    openDrawerAnimation();
}
expose('openStockDrawer', openStockDrawer);

function renderStockVariants() {
    const list = document.getElementById('variants-list');
    if (tempVariants.length === 0) {
        list.innerHTML = '<div class="text-gray-400 text-center py-4 text-sm italic">No tiene variantes cargadas.</div>';
        return;
    }
    list.innerHTML = tempVariants.map((v, idx) => `
        <div class="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-sm group hover:border-mint transition">
            <div class="flex items-center gap-3">
                <span class="bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wide px-2 py-1 rounded font-bold">${v.section || 'Bebés'}</span>
                <div>
                    <div class="font-bold text-gray-800">${v.color}</div>
                    <div class="text-xs text-gray-400">Talle: ${v.size}</div>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <div class="flex items-center bg-gray-50 rounded-lg p-1 border">
                    <button onclick="quickStock(${idx}, -1)" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white rounded transition"><i class="fa-solid fa-minus text-xs"></i></button>
                    <span class="w-8 text-center font-bold text-gray-800">${v.stock}</span>
                    <button onclick="quickStock(${idx}, 1)" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-green-500 hover:bg-white rounded transition"><i class="fa-solid fa-plus text-xs"></i></button>
                </div>
                <button onclick="removeVariant(${idx})" class="text-gray-300 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 transition">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}
expose('renderStockVariants', renderStockVariants);

function addVariant() {
    const section = document.getElementById('new-var-section').value;
    const color = document.getElementById('new-var-color').value.trim();
    const size = document.getElementById('new-var-size').value.trim();
    const stock = parseInt(document.getElementById('new-var-stock').value) || 0;

    if (!color || !size) return alert('Por favor completa Color y Talle');

    tempVariants.push({ id: Date.now(), section, color, size, stock });

    document.getElementById('new-var-color').value = '';
    document.getElementById('new-var-size').value = '';
    document.getElementById('new-var-stock').value = '';
    renderStockVariants();
}
expose('addVariant', addVariant);

function quickStock(idx, delta) {
    const newStock = tempVariants[idx].stock + delta;
    if (newStock < 0) return;
    tempVariants[idx].stock = newStock;
    renderStockVariants();
}
expose('quickStock', quickStock);

function removeVariant(index) {
    tempVariants.splice(index, 1);
    renderStockVariants();
}
expose('removeVariant', removeVariant);

// --- SAVE TO FIRESTORE ---
function preSaveCheck() {
    const name = document.getElementById('edit-name').value;
    if (!name) return alert('Falta el nombre de la prenda');
    if (tempVariants.length === 0 && !confirm('¿Guardar sin variantes (stock 0)?')) return;

    const action = editingId ? "editar" : "agregar";
    const msg = `
        <div>¿Estás seguro de <strong>${action}</strong> esta prenda?</div>
        <div class="font-bold text-lg text-gray-800 my-2">${name}</div>
        <ul class="text-left bg-gray-50 p-3 rounded text-sm text-gray-600 space-y-1">
            <li>Variantes: ${tempVariants.length}</li>
            <li>Stock Total: ${tempVariants.reduce((a, b) => a + b.stock, 0)}</li>
        </ul>
        <div class="mt-2 text-xs text-gray-400">Se guardará en la nube.</div>
    `;

    requestConfirm(msg, async () => {
        const docId = editingId ? String(editingId) : String(Date.now());

        const isOffer = document.getElementById('edit-is-offer').checked;
        const offerPrice = isOffer ? (parseInt(document.getElementById('edit-offer-price').value) || 0) : 0;

        const newProduct = {
            id: parseInt(docId),
            name: name,
            price: parseInt(document.getElementById('edit-price').value) || 0,
            image: document.getElementById('edit-image').value,
            category: tempVariants.length > 0 ? tempVariants[0].section : 'General',
            variants: tempVariants,
            isOffer: isOffer,
            offerPrice: offerPrice
        };

        statusEl.innerHTML = '<span class="animate-pulse w-2 h-2 rounded-full bg-blue-500"></span> Subiendo...';

        try {
            await setDoc(doc(db, "productos", docId), newProduct);

            statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Guardado Nube';
            closeDrawer();
            renderTable();
        } catch (e) {
            console.error("Error saving:", e);
            statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error al Guardar';
            alert("Error al guardar en la nube.");
        }
    });
}
expose('preSaveCheck', preSaveCheck);

function preDeleteCheck() {
    requestConfirm('¿Seguro quieres <strong>ELIMINAR</strong> esta prenda y todo su stock?<br>Esta acción no se puede deshacer.', async () => {
        statusEl.innerHTML = '<span class="animate-pulse w-2 h-2 rounded-full bg-red-400"></span> Eliminando...';
        try {
            await deleteDoc(doc(db, "productos", String(editingId)));

            statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Eliminado';
            closeDrawer();
            renderTable();
        } catch (e) {
            console.error(e);
            statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error al Eliminar';
            alert("Error al eliminar.");
        }
    });
}
expose('preDeleteCheck', preDeleteCheck);

// --- Drawer Animation Helper ---
function openDrawerAnimation() {
    drawer.classList.remove('drawer-closed');
    drawer.classList.add('drawer-open');
    overlay.classList.remove('hidden');
}

function closeDrawer() {
    drawer.classList.add('drawer-closed');
    drawer.classList.remove('drawer-open');
    overlay.classList.add('hidden');
    editingId = null;
    tempVariants = [];
}
expose('closeDrawer', closeDrawer);

// Image Upload Mockup/Helper
function uploadImage(input) {
    // In a real app we would upload to Firebase Storage here
    // For now we just let the user know they can use a URL
    alert('Por ahora ingresa la URL de la imagen manualmente.');
    // Or implement actual upload if desired
}
expose('uploadImage', uploadImage);

// --- POS / SELLING LOGIC ---

function openVariantSelector(id) {
    const p = currentInventory.find(x => x.id === id);
    if (!p) return;

    drawerTitle.innerText = p.name;
    const hasVariants = p.variants && p.variants.length > 0;

    let html = `
        <div class="space-y-6">
            <div class="flex gap-4">
                <img src="${p.image}" class="w-24 h-24 rounded-xl object-cover border bg-gray-100">
                <div>
                    <div class="text-2xl font-bold text-gray-800">$${p.price.toLocaleString()}</div>
                    <div class="text-gray-500 text-sm mt-1">${p.category}</div>
                </div>
            </div>
    `;

    if (!hasVariants) {
        html += `
            <div class="bg-yellow-50 p-4 rounded-lg text-yellow-700 text-sm font-bold text-center">
                Este producto no tiene stock cargado.
            </div>
        `;
    } else {
        html += `<div class="grid grid-cols-1 gap-2">`;
        p.variants.forEach(v => {
            const isLow = v.stock < 3;
            const noStock = v.stock === 0;
            const stockClass = noStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:border-mint cursor-pointer';

            html += `
                <div onclick="${noStock ? '' : `addToOrder(${p.id}, ${v.id})`}" 
                    class="${stockClass} p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center group transition">
                    <div>
                        <div class="font-bold text-gray-800 group-hover:text-mint transition">${v.color}</div>
                        <div class="text-xs text-gray-500">Talle: ${v.size}</div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold ${noStock ? 'text-gray-400' : (isLow ? 'text-red-500' : 'text-green-500')}">
                            ${v.stock} disp.
                        </span>
                        ${!noStock ? '<i class="fa-solid fa-plus-circle text-2xl text-gray-200 group-hover:text-mint transition"></i>' : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    drawerBody.innerHTML = html;

    // Footer is hidden or just close
    drawerFooter.innerHTML = ``;

    openDrawerAnimation();
}
expose('openVariantSelector', openVariantSelector);

function addToOrder(productId, variantId) {
    const p = currentInventory.find(x => x.id === productId);
    const v = p.variants.find(x => x.id === variantId);

    if (v.stock <= 0) return alert('No hay stock disponible');

    // Check if already in cart to limit by stock
    const inCart = currentOrder.filter(i => i.productId === productId && i.variantId === variantId).reduce((a, b) => a + b.qty, 0);
    if (inCart >= v.stock) return alert('No puedes agregar más de lo que hay en stock');

    // Add to cart
    const existing = currentOrder.find(i => i.productId === productId && i.variantId === variantId);
    if (existing) {
        existing.qty++;
    } else {
        currentOrder.push({
            productId: p.id,
            variantId: v.id,
            name: p.name,
            color: v.color,
            size: v.size,
            price: p.price,
            qty: 1,
            image: p.image
        });
    }

    closeDrawer();
    updateMiniCart();

    // Small feedback
    const widget = document.getElementById('mini-cart-widget');
    widget.classList.add('scale-110');
    setTimeout(() => widget.classList.remove('scale-110'), 200);
}
expose('addToOrder', addToOrder);

function showOrderSummary() {
    drawerTitle.innerText = 'Tu Pedido';
    const total = currentOrder.reduce((acc, i) => acc + (i.price * i.qty), 0);

    if (currentOrder.length === 0) {
        drawerBody.innerHTML = '<div class="text-center text-gray-400 mt-10">El carrito está vacío</div>';
        drawerFooter.innerHTML = '';
        openDrawerAnimation();
        return;
    }

    drawerBody.innerHTML = `
        <div class="space-y-4">
            ${currentOrder.map((item, idx) => `
                <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div class="flex items-center gap-3">
                        <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover bg-gray-100">
                        <div>
                            <div class="font-bold text-gray-800 text-sm">${item.name}</div>
                            <div class="text-xs text-gray-500">${item.color} - Talle ${item.size}</div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-lg text-gray-800">x${item.qty}</div>
                        <div class="font-mono text-gray-400 text-xs">$${(item.price * item.qty).toLocaleString()}</div>
                        <button onclick="removeFromOrder(${idx})" class="text-red-400 text-xs underline mt-1">Quitar</button>
                    </div>
                </div>
            `).join('')}
            
            <div class="border-t pt-4 mt-6">
                <div class="flex justify-between items-center text-2xl font-bold text-gray-900">
                    <span>Total a Cobrar:</span>
                    <span>$${total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;

    drawerFooter.innerHTML = `
            <button onclick="askToFinalize()" class="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg text-xl hover:bg-green-600 transition">
            <i class="fa-solid fa-money-bill-wave mr-2"></i> Confirmar Venta
            </button>
    `;
    openDrawerAnimation();
}
expose('showOrderSummary', showOrderSummary);

function removeFromOrder(idx) {
    currentOrder.splice(idx, 1);
    updateMiniCart();
    if (currentOrder.length === 0) {
        closeDrawer();
        alert("Pedido cancelado (vacío).");
    } else {
        showOrderSummary();
    }
}
expose('removeFromOrder', removeFromOrder);

function askToFinalize() {
    const total = currentOrder.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const defaultBtns = confirmModal.querySelector('.flex.gap-3');
    if (defaultBtns) defaultBtns.classList.remove('hidden');

    requestConfirm(`
        <div class="text-gray-800 text-lg">¿Estás seguro de finalizar la venta por <strong>$${total.toLocaleString()}</strong>?</div>
        <div class="text-xs text-gray-500 mt-2">Esta acción descontará el stock de la base de datos.</div>
    `, () => {
        executeSale();
    });
}
expose('askToFinalize', askToFinalize);

async function executeSale() {
    statusEl.innerHTML = '<span class="animate-pulse w-2 h-2 rounded-full bg-blue-500"></span> Procesando Venta...';

    const batch = writeBatch(db);
    const updates = new Map();

    // 1. Prepare updates based on order
    currentOrder.forEach(item => {
        if (!updates.has(item.productId)) {
            updates.set(item.productId, {
                data: JSON.parse(JSON.stringify(currentInventory.find(p => p.id === item.productId)))
            });
        }
        const pData = updates.get(item.productId).data;
        const variant = pData.variants.find(v => v.id == item.variantId);
        if (variant) {
            variant.stock -= item.qty;
            if (variant.stock < 0) variant.stock = 0;
        }
    });

    // 2. Add updates to batch
    updates.forEach((val, key) => {
        const docRef = doc(db, "productos", String(key));
        batch.set(docRef, val.data);
    });

    try {
        await batch.commit();

        // 3. Local inventory update
        updates.forEach((val, key) => {
            const idx = currentInventory.findIndex(p => p.id === key);
            if (idx !== -1) currentInventory[idx] = val.data;
        });

        // 4. Save Sale History
        const saleRecord = {
            timestamp: Date.now(),
            total: currentOrder.reduce((acc, i) => acc + (i.price * i.qty), 0),
            items: currentOrder,
            dateString: new Date().toLocaleDateString()
        };
        await addDoc(collection(db, "ventas"), saleRecord);

        // 5. Cleanup and Success UI
        currentOrder = [];
        updateMiniCart();
        closeDrawer();
        renderTable();

        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Venta Exitosa';

        const defaultBtns = confirmModal.querySelector('.flex.gap-3');
        if (defaultBtns) defaultBtns.classList.add('hidden');

        requestConfirm(`
            <div class="text-green-500 text-5xl mb-4"><i class="fa-solid fa-check-circle"></i></div>
            <div class="text-gray-800 font-bold text-xl">¡Venta Registrada!</div>
            <div class="text-gray-500 text-sm mt-2 mb-4">Stock descontado en la nube.</div>
            <button onclick="closeConfirm(false); renderTable(); switchAppMode('registro');" class="w-full bg-gray-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-black transition">
                Aceptar
            </button>
        `, null);

    } catch (e) {
        console.error("Error executing sale:", e);
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error Venta';
        alert("Hubo un error al procesar la venta.");
    }
}
expose('executeSale', executeSale);

// --- DATA NORMALIZATION ---
async function normalizeDatabase(isAutomatic = false) {
    const runNormalization = async () => {
        if (!isAutomatic) {
            statusEl.innerHTML = '<span class="animate-pulse w-2 h-2 rounded-full bg-purple-500"></span> Normalizando...';
        }

        const map = {
            'Bebés': ['bebes', 'bebe', 'bebé', 'bebe rn', 'recién nacido', 'rn', 'bba'],
            'No caminantes': ['no caminantes', 'no caminante', 'nocaminantes'],
            'Niños': ['niños', 'niño', 'ninos', 'nino', 'varon'],
            'Niñas': ['niñas', 'niña', 'ninas', 'nina', 'nena']
        };

        const getStandard = (val) => {
            if (!val) return val;
            const lower = val.toLowerCase().trim();
            for (const [std, vars] of Object.entries(map)) {
                if (vars.some(v => lower === v || lower.includes(v))) return std;
            }
            return val;
        };

        let updatedCount = 0;
        const batch = writeBatch(db);
        let batchCount = 0;

        currentInventory.forEach(p => {
            let changed = false;
            let newCat = getStandard(p.category);

            if (newCat !== p.category) {
                p.category = newCat;
                changed = true;
            }

            if (p.variants) {
                p.variants.forEach(v => {
                    let newSec = getStandard(v.section);
                    if (newSec !== v.section) {
                        v.section = newSec;
                        changed = true;
                    }
                });
            }

            if (changed) {
                const ref = doc(db, "productos", String(p.id));
                batch.update(ref, { category: p.category, variants: p.variants });
                updatedCount++;
                batchCount++;
            }
        });

        if (updatedCount === 0) {
            if (!isAutomatic) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Todo en orden';
                alert('No se encontraron categorías para corregir.');
            }
            return;
        }

        try {
            await batch.commit();
            if (!isAutomatic) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Datos Normalizados';
                alert(`Se actualizaron ${updatedCount} productos correctamente.`);
            } else {
                console.log(`Auto-Normalización: ${updatedCount} productos corregidos.`);
            }
            // Reload to reflect changes locally
            loadData();
        } catch (e) {
            console.error(e);
            if (!isAutomatic) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error Normalizando';
                alert('Hubo un error al normalizar.');
            }
        }
    };

    if (isAutomatic) {
        runNormalization();
    } else {
        requestConfirm(`
            <div class="text-gray-800 font-bold mb-2">¿Normalizar Categorías?</div>
            <div class="text-sm text-gray-600 mb-2">
                Esto buscará productos con categorías antiguas y las actualizará al nuevo estándar.
            </div>
        `, runNormalization);
    }
}
expose('normalizeDatabase', normalizeDatabase);

function updateMiniCart() {
    const widget = document.getElementById('mini-cart-widget');
    const count = document.getElementById('mini-cart-count');
    const totalEl = document.getElementById('mini-cart-total');

    if (!widget || !count || !totalEl) return;

    if (appMode !== 'vender') {
        widget.classList.add('hidden');
        return;
    }

    if (currentOrder.length === 0) {
        widget.classList.remove('opacity-100', 'translate-y-0');
        widget.classList.add('opacity-0', 'translate-y-10');
        setTimeout(() => widget.classList.add('hidden'), 300);
        return;
    }

    widget.classList.remove('hidden');
    setTimeout(() => {
        widget.classList.remove('opacity-0', 'translate-y-10');
        widget.classList.add('opacity-100', 'translate-y-0');
    }, 10);

    const total = currentOrder.reduce((acc, i) => acc + (i.price * i.qty), 0);
    count.innerText = currentOrder.length;
    totalEl.innerText = `$${total.toLocaleString()}`;
}
expose('updateMiniCart', updateMiniCart);
