// Importar Firestore y Config
import { db, storage } from './firebase-config.js';
import { collection, doc, setDoc, deleteDoc, writeBatch, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// State
let appMode = 'stock';
let currentInventory = [];
let currentCategory = 'Todo';
let searchQuery = '';
let editingId = null;
let tempVariants = [];
let pendingAction = null;
let currentOrder = [];
let analyticsMode = 'day';

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
        // If drawer is open, we might want to refresh it too? 
        // For now, naive table refresh is enough, drawer sync is more complex (would need to re-find product)

        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> En Línea';
    }, (error) => {
        console.error("Error getting documents: ", error);
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error Excéntrico';
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
    const btnSales = document.getElementById('btn-mode-sales');
    const btnRegistro = document.getElementById('btn-mode-registro');

    const mainArea = document.getElementById('main-area');
    const registroView = document.getElementById('registro-view');

    const stockActions = document.getElementById('stock-actions');

    // Reset Buttons
    [btnStock, btnSales, btnRegistro].forEach(b => {
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

    if (mode === 'stock') {
        btnStock.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btnStock.classList.remove('text-gray-400', 'bg-transparent');
        stockActions.classList.remove('hidden');
    } else {
        btnSales.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
        btnSales.classList.remove('text-gray-400', 'bg-transparent');
    }
    renderTable();
}
expose('switchAppMode', switchAppMode);

// --- Analytics & History (Local + Firestore optional upgrade) ---
// Por ahora mantenemos el historial en local para no complicar, 
// pero podríamos migrar 'ventas' a una colección de Firestore.
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
    const localSales = JSON.parse(localStorage.getItem('puroAmorSales') || '[]');
    localSales.sort((a, b) => b.timestamp - a.timestamp);

    let filteredSales = [];
    const label = document.getElementById('showing-label');

    if (analyticsMode === 'day') {
        const selectedDateStr = dateInput.value;
        filteredSales = localSales.filter(s => {
            const d = new Date(s.timestamp);
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}` === selectedDateStr;
        });
        label.innerText = `Mostrando: ${selectedDateStr}`;
    } else {
        const selectedMonthStr = monthInput.value;
        filteredSales = localSales.filter(s => {
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
        const hasVariantInSection = (p.variants || []).some(v => v.section === currentCategory);
        const isLegacyMatch = p.category === currentCategory;
        return hasVariantInSection || isLegacyMatch;
    });

    if (searchQuery) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery));
    }

    tbody.innerHTML = filtered.map(p => {
        const totalStock = (p.variants || []).reduce((sum, v) => sum + v.stock, 0);
        const stockColor = totalStock === 0 ? 'text-red-500 bg-red-50' : (totalStock < 5 ? 'text-yellow-600 bg-yellow-50' : 'text-green-600 bg-green-50');
        const actionIcon = appMode === 'stock' ? '<i class="fa-solid fa-pen"></i>' : '<i class="fa-solid fa-cart-plus"></i>';
        const actionClass = appMode === 'stock' ? 'bg-gray-100 text-gray-600' : 'bg-mint text-white shadow-md hover:brightness-105';

        return `
        <tr class="hover:bg-gray-50 transition cursor-pointer group" onclick="itemClick(${p.id})">
            <td class="p-4">
                <img src="${p.image}" class="w-12 h-12 rounded-lg object-cover bg-gray-200 shadow-sm border border-gray-100">
            </td>
            <td class="p-4">
                <div class="font-bold text-gray-800 text-base">${p.name}</div>
            </td>
            <td class="p-4 text-center">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${stockColor}">${totalStock} dispo</span>
            </td>
            <td class="p-4 font-mono text-gray-600 font-bold">$${p.price.toLocaleString()}</td>
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
    if (appMode === 'stock') openStockDrawer(id);
    else openSalesDrawer(id);
}
expose('itemClick', itemClick);

// --- STOCK DRAWER ---
function openStockDrawer(id) {
    editingId = id;
    const renderForm = (name, price, image) => `
        <div class="space-y-6">
            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <h3 class="text-xs font-bold uppercase text-gray-400">Datos Principales</h3>
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-1">Nombre de la Prenda</label>
                    <input type="text" id="edit-name" value="${name}" class="w-full border-2 border-gray-100 p-3 rounded-lg focus:bg-white focus:outline-none focus:border-mint font-bold text-gray-800 text-lg placeholder-gray-300" placeholder="Ej: Body Rayado">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Precio ($)</label>
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
        drawerBody.innerHTML = renderForm(p.name, p.price, p.image);
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
        drawerBody.innerHTML = renderForm('', '', '');
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
        const newProduct = {
            id: parseInt(docId), // Keep ID as number for consistency with legacy, but doc name is string
            name: name,
            price: parseInt(document.getElementById('edit-price').value) || 0,
            image: document.getElementById('edit-image').value,
            category: tempVariants.length > 0 ? tempVariants[0].section : 'General',
            variants: tempVariants
        };

        statusEl.innerHTML = '<span class="animate-pulse w-2 h-2 rounded-full bg-blue-500"></span> Subiendo...';

        try {
            await setDoc(doc(db, "productos", docId), newProduct);

            // Local update removed: Handled by onSnapshot


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
            // Local update removed: Handled by onSnapshot


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

// --- SALES DRAWER & POS ---
function openSalesDrawer(id) {
    const p = currentInventory.find(x => x.id === id);
    editingId = id;
    drawerTitle.innerText = 'Agregar al Pedido';
    const availableVariants = (p.variants || []).filter(v => v.stock > 0);

    drawerBody.innerHTML = `
        <div class="flex gap-4 mb-6">
            <img src="${p.image}" class="w-20 h-20 rounded object-cover border bg-white">
            <div>
                <h3 class="font-bold text-xl text-gray-800 leading-tight">${p.name}</h3>
                <p class="font-mono font-bold text-gray-500 mt-1">$${p.price.toLocaleString()}</p>
            </div>
        </div>
        ${availableVariants.length ? `
        <div class="grid grid-cols-1 gap-2">
                ${availableVariants.map(v => `
                <label class="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-mint/10 hover:border-mint group bg-white shadow-sm transition">
                    <input type="radio" name="sale-variant" value="${v.id}" class="peer sr-only" onchange="enableAddToOrderBtn()">
                    <div class="flex items-center gap-3">
                        <span class="w-4 h-4 rounded-full border-2 border-gray-200 peer-checked:bg-mint peer-checked:border-mint transition"></span>
                        <div>
                            <div class="font-bold text-sm text-gray-800">${v.color}</div>
                            <div class="text-xs text-gray-500">Talle ${v.size} (${v.section || 'U'})</div>
                        </div>
                    </div>
                    <span class="font-bold text-gray-400 peer-checked:text-mint">${v.stock} disp.</span>
                </label>
            `).join('')}
        </div>
        <div class="mt-8 flex flex-col items-center">
                <label class="text-xs font-bold uppercase text-gray-400 mb-2">Cantidad</label>
                <div class="flex items-center gap-6">
                    <button onclick="adjSale(-1)" class="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-400 text-gray-400 hover:text-gray-600 font-bold text-xl"><i class="fa-solid fa-minus"></i></button>
                    <span id="sale-qty" class="text-4xl font-bold text-gray-800 w-16 text-center">1</span>
                    <button onclick="adjSale(1)" class="w-12 h-12 rounded-full border-2 border-gray-200 hover:border-gray-400 text-gray-400 hover:text-gray-600 font-bold text-xl"><i class="fa-solid fa-plus"></i></button>
                </div>
        </div>
        ` : `<div class="bg-red-50 text-red-500 font-bold p-6 rounded-xl text-center"><i class="fa-solid fa-ban text-2xl mb-2 block"></i>Sin stock disponible</div>`}
    `;

    drawerFooter.innerHTML = `<button id="btn-add-order" onclick="addToOrder()" disabled class="w-full bg-gray-300 text-gray-500 font-bold py-4 rounded-xl transition-all text-lg shadow-none">Agregar al Pedido <i class="fa-solid fa-cart-plus ml-2"></i></button>`;
    openDrawerAnimation();
}
expose('openSalesDrawer', openSalesDrawer);

let saleQty = 1;

function adjSale(d) {
    saleQty = Math.max(1, saleQty + d);
    document.getElementById('sale-qty').innerText = saleQty;
}
expose('adjSale', adjSale);

function enableAddToOrderBtn() {
    const btn = document.getElementById('btn-add-order');
    btn.disabled = false;
    btn.classList.remove('bg-gray-300', 'text-gray-500', 'shadow-none');
    btn.classList.add('bg-gray-900', 'text-white', 'shadow-lg');
}
expose('enableAddToOrderBtn', enableAddToOrderBtn);

function addToOrder() {
    const radios = document.getElementsByName('sale-variant');
    let selectedId;
    for (const r of radios) { if (r.checked) selectedId = r.value; }

    const p = currentInventory.find(x => x.id === editingId);
    const v = p.variants.find(x => x.id == selectedId);
    const currentInCart = currentOrder.find(item => item.variantId == selectedId);
    const qtyInCart = currentInCart ? currentInCart.qty : 0;

    if ((v.stock - qtyInCart) < saleQty) {
        return alert(`¡STOCK INSUFICIENTE!\nStock Total: ${v.stock}\nYa en carrito: ${qtyInCart}\nIntentas agregar: ${saleQty}`);
    }

    if (currentInCart) {
        currentInCart.qty += saleQty;
    } else {
        currentOrder.push({
            productId: p.id,
            variantId: v.id,
            name: p.name,
            price: p.price,
            color: v.color,
            size: v.size,
            section: v.section,
            qty: saleQty
        });
    }

    updateMiniCart();

    const total = currentOrder.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const msg = `
        <div class="text-green-600 font-bold text-lg mb-2"><i class="fa-solid fa-check-circle"></i> Agregado al Pedido</div>
        <div class="bg-gray-50 p-3 rounded mb-4 text-left text-sm text-gray-600">
            <div>Items: <strong>${currentOrder.length}</strong></div>
            <div>Total Parcial: <strong>$${total.toLocaleString()}</strong></div>
        </div>
        <div class="font-bold text-gray-800 mb-4">¿Necesitas agregar otro producto?</div>
        <div class="flex flex-col gap-2">
            <button onclick="closeConfirm(false); closeDrawer();" class="w-full bg-white border-2 border-gray-900 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-100">
                SI, AGREGAR OTRO
            </button>
            <button onclick="showOrderSummary()" class="w-full bg-mustard text-white font-bold py-3 rounded-lg hover:bg-yellow-500 shadow-md">
                NO, FINALIZAR VENTA ($${total.toLocaleString()})
            </button>
        </div>
    `;

    confirmMsg.innerHTML = msg;
    confirmModal.classList.remove('hidden');
    confirmModal.querySelector('.flex.gap-3').classList.add('hidden');
}
expose('addToOrder', addToOrder);

function showOrderSummary() {
    confirmModal.classList.add('hidden');
    setTimeout(() => confirmModal.querySelector('.flex.gap-3').classList.remove('hidden'), 500);

    closeDrawer();
    drawerTitle.innerText = 'Resumen de Venta';
    const total = currentOrder.reduce((acc, i) => acc + (i.price * i.qty), 0);

    drawerBody.innerHTML = `
        <div class="space-y-4">
            ${currentOrder.map((item, idx) => `
                <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <div class="font-bold text-gray-800">${item.name}</div>
                        <div class="text-xs text-gray-500">${item.color} - Talle ${item.size}</div>
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
            <button onclick="finalizeOrder()" class="w-full bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg text-xl hover:bg-green-600 transition">
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

// --- FINALIZE ORDER (UPDATE FIRESTORE STOCK) ---
function finalizeOrder() {
    statusEl.innerHTML = '<span class="animate-pulse w-2 h-2 rounded-full bg-blue-500"></span> Procesando Venta...';

    // Preparar batch
    const batch = writeBatch(db);

    // Need to group updates by product ID because we might have multiple variants of same product sold
    // Getting fresh copies from memory (assuming memory is sync with DB mostly, but ideally should read-modify-write transactional... 
    // for simplicity we trust memory state + write batch) 

    const updates = new Map(); // prodId -> { productRef, productData }

    currentOrder.forEach(item => {
        if (!updates.has(item.productId)) {
            updates.set(item.productId, {
                // We need a deep clone to modify
                data: JSON.parse(JSON.stringify(currentInventory.find(p => p.id === item.productId)))
            });
        }

        const pData = updates.get(item.productId).data;
        const variant = pData.variants.find(v => v.id == item.variantId);
        if (variant) {
            variant.stock -= item.qty;
            if (variant.stock < 0) variant.stock = 0; // Safety
        }
    });

    // Check updates and add to batch
    updates.forEach((val, key) => {
        const docRef = doc(db, "productos", String(key));
        batch.set(docRef, val.data);
    });

    batch.commit().then(() => {
        // Success
        // Update Local State
        updates.forEach((val, key) => {
            const idx = currentInventory.findIndex(p => p.id === key);
            if (idx !== -1) currentInventory[idx] = val.data;
        });

        // Save Sales History (Virtual/Local for now)
        const saleRecord = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            total: currentOrder.reduce((acc, i) => acc + (i.price * i.qty), 0),
            items: currentOrder
        };
        const history = JSON.parse(localStorage.getItem('puroAmorSales') || '[]');
        history.push(saleRecord);
        localStorage.setItem('puroAmorSales', JSON.stringify(history));

        currentOrder = [];
        updateMiniCart();
        closeDrawer();
        renderTable();

        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-green-500"></span> Venta Exitosa';

        requestConfirm(`
            <div class="text-green-500 text-5xl mb-4"><i class="fa-solid fa-check-circle"></i></div>
            <div class="text-gray-800 font-bold text-xl">¡Venta Registrada!</div>
            <div class="text-gray-500 text-sm mt-2">Stock descontado en la nube.</div>
        `, () => { closeConfirm(false); renderTable(); switchAppMode('registro'); });

    }).catch(err => {
        console.error("Error finalizing:", err);
        statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span> Error Venta';
        alert("Hubo un error al actualizar el stock en la nube.");
    });
}
expose('finalizeOrder', finalizeOrder);

function updateMiniCart() {
    const widget = document.getElementById('mini-cart-widget');
    const list = document.getElementById('mini-cart-items');
    const count = document.getElementById('mini-cart-count');
    const totalEl = document.getElementById('mini-cart-total');

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

    list.innerHTML = currentOrder.map(item => `
        <div class="flex justify-between">
            <span>${item.name} (${item.color}) x${item.qty}</span>
            <span class="font-mono font-bold">$${(item.price * item.qty).toLocaleString()}</span>
        </div>
    `).join('');

    count.innerText = currentOrder.length;
    totalEl.innerText = `$${total.toLocaleString()}`;
}
expose('updateMiniCart', updateMiniCart);

function openDrawerAnimation() { drawer.classList.remove('drawer-closed'); drawer.classList.add('drawer-open'); overlay.classList.remove('hidden'); }
expose('openDrawerAnimation', openDrawerAnimation);

function closeDrawer() { drawer.classList.add('drawer-closed'); drawer.classList.remove('drawer-open'); overlay.classList.add('hidden'); }
expose('closeDrawer', closeDrawer);

// --- IMAGE UPLOAD ---
async function uploadImage(input) {
    const file = input.files[0];
    if (!file) return;

    const status = document.getElementById('upload-status');
    status.innerText = "Subiendo imagen...";
    status.classList.remove('hidden', 'text-green-500', 'text-red-500');
    status.classList.add('text-mint', 'animate-pulse');

    try {
        const path = `productos/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);

        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        document.getElementById('edit-image').value = url;

        status.innerText = "¡Imagen cargada!";
        status.classList.remove('text-mint', 'animate-pulse');
        status.classList.add('text-green-500');
    } catch (error) {
        console.error("Upload failed", error);
        status.innerText = "Error al subir";
        status.classList.remove('text-mint', 'animate-pulse');
        status.classList.add('text-red-500');
        alert("Error al subir la imagen a Firebase Storage");
    }
}
expose('uploadImage', uploadImage);
