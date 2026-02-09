import { db } from './firebase-config.js';
import { collection, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Referencias al DOM
const inputCsv = document.getElementById('input-csv');
const btnCargar = document.getElementById('btn-cargar');
const fileNameDisplay = document.getElementById('file-name-display');
const statusDiv = document.getElementById('import-status');
const modal = document.getElementById('import-modal');

// Evento: Al seleccionar archivo
inputCsv.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.innerText = file.name;
        fileNameDisplay.classList.add('text-mint', 'font-bold');
        statusDiv.classList.add('hidden');
    } else {
        fileNameDisplay.innerText = "Click para elegir archivo";
        fileNameDisplay.classList.remove('text-mint', 'font-bold');
    }
});

// Evento: Al hacer click en subir
btnCargar.addEventListener('click', async () => {
    const file = inputCsv.files[0];
    if (!file) {
        alert("Por favor selecciona un archivo CSV primero.");
        return;
    }

    setLoading(true);

    // 1. Detect Delimiter (Comma vs Semicolon)
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const firstLine = text.split('\n')[0];

        let delimiter = ',';
        if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
            delimiter = ';';
        }

        console.log(`Delimitador detectado: "${delimiter}"`);

        // 2. Parse with detected delimiter
        Papa.parse(file, {
            header: true,
            delimiter: delimiter, // Force detected delimiter
            skipEmptyLines: true,
            dynamicTyping: true,
            transformHeader: (h) => {
                // Remove BOM, quotes, and whitespace, then lowercase
                return h.replace(/^\uFEFF/, '').replace(/["']/g, '').trim().toLowerCase();
            },
            complete: async function (results) {
                try {
                    const rawData = results.data;
                    console.log("Datos crudos:", rawData);

                    if (rawData.length === 0) {
                        setLoading(false);
                        setStatus("El archivo está vacío o no se pudo leer.", "error");
                        return;
                    }

                    const productsMap = new Map();
                    let processedCount = 0;
                    let skippedCount = 0;

                    rawData.forEach((row, index) => {
                        const getVal = (possibleKeys) => {
                            const keys = Object.keys(row);
                            // Exact match preferred
                            const match = keys.find(k => possibleKeys.includes(k));
                            return match ? row[match] : undefined;
                        };

                        // MAPPING: {Nombre; Talle; Color; Precio al costo; Porcentaje de recargo; Precio; URL foto; Tipo de ropa; Categoria}
                        // Note: Keys are lowercased by transformHeader

                        const name = getVal(['nombre', 'nombre producto']);
                        // Validation: Must have name
                        if (!name) {
                            // Try to see if it's a "ghost" row or header repetition
                            skippedCount++;
                            return;
                        }

                        const size = getVal(['talle', 'talla']);
                        const color = getVal(['color']);

                        const costPriceRaw = getVal(['precio al costo', 'costo', 'precio costo', 'cost price']);
                        const markupRaw = getVal(['porcentaje de recargo', 'recargo', 'porcentaje recargo', 'ganancia']);

                        const price = getVal(['precio', 'precio final', 'precio venta']);
                        const imageRaw = getVal(['url foto', 'foto', 'imagen', 'link foto']);

                        const clothingType = getVal(['tipo de ropa', 'tipo', 'prenda']);
                        const category = getVal(['categoria', 'categoría', 'seccion', 'sección']);

                        // Parsing Numbers
                        const parseDecimal = (val) => {
                            if (typeof val === 'number') return val;
                            if (!val) return 0;
                            // Remove $ symbol if present, replace comma
                            const clean = String(val).replace('$', '').replace(/\s/g, '').replace(',', '.');
                            return parseFloat(clean) || 0;
                        };

                        const costPrice = parseDecimal(costPriceRaw);
                        const markupPercentage = parseDecimal(markupRaw);

                        let finalPrice = Number(parseDecimal(price)) || 0;

                        // Auto-Calculate Price if needed
                        if (costPrice > 0 && markupPercentage > 0) {
                            let markupFactor = markupPercentage;
                            // If user puts "30", treat as 30%. If "0.3", treat as 30%.
                            if (markupPercentage > 1) markupFactor = markupPercentage / 100;

                            finalPrice = costPrice * (1 + markupFactor);
                            finalPrice = Math.ceil(finalPrice / 10) * 10;
                        }

                        const cleanName = String(name).trim();
                        const cleanColor = String(color || 'Unico').trim();
                        const variantKey = `${cleanColor}|${String(size || 'U').trim()}|${String(category || 'General').trim()}`;

                        if (!productsMap.has(cleanName)) {
                            productsMap.set(cleanName, {
                                id: Date.now() + index,
                                name: cleanName,
                                price: finalPrice,
                                costPrice: costPrice,
                                markupPercentage: markupPercentage,
                                image: '',
                                category: getStandardCategory(category),
                                clothingType: clothingType ? String(clothingType).trim() : 'General',
                                imagesByColor: {},
                                variantsMap: new Map()
                            });
                        }

                        const transformDriveUrl = (url) => {
                            if (!url) return '';
                            const str = String(url).trim();
                            const fileDMatch = str.match(/\/file\/d\/([-\w]+)/);
                            if (fileDMatch && fileDMatch[1]) return `https://drive.google.com/uc?export=view&id=${fileDMatch[1]}`;
                            const idParamMatch = str.match(/[?&]id=([-\w]+)/);
                            if (idParamMatch && idParamMatch[1]) return `https://drive.google.com/uc?export=view&id=${idParamMatch[1]}`;
                            if (str.includes('drive.google.com') || str.includes('docs.google.com')) {
                                const broadMatch = str.match(/[-\w]{25,}/);
                                if (broadMatch) return `https://drive.google.com/uc?export=view&id=${broadMatch[0]}`;
                            }
                            return str;
                        };

                        const image = transformDriveUrl(imageRaw);
                        const product = productsMap.get(cleanName);

                        if (clothingType && product.clothingType === 'General') product.clothingType = String(clothingType).trim();
                        if (image && cleanColor !== 'Unico') product.imagesByColor[cleanColor] = image;
                        if (image && (!product.image || product.image === '')) product.image = image;

                        if (product.variantsMap.has(variantKey)) {
                            product.variantsMap.get(variantKey).stock += 1;
                        } else {
                            product.variantsMap.set(variantKey, {
                                id: Date.now() + Math.random(),
                                color: cleanColor,
                                size: String(size || 'U').trim(),
                                section: getStandardCategory(category || product.category),
                                stock: 1
                            });
                        }
                    });

                    // 3. FINALIZAR
                    const productsToUpload = [];
                    productsMap.forEach(p => {
                        const finalVariants = Array.from(p.variantsMap.values());
                        if (p.category === 'General' && finalVariants.length > 0) p.category = finalVariants[0].section;

                        finalVariants.forEach(v => {
                            if (p.imagesByColor[v.color]) v.image = p.imagesByColor[v.color];
                            else if (!v.image && p.image) v.image = p.image;
                        });

                        if ((!p.image || p.image.includes('placeholder')) && Object.keys(p.imagesByColor).length > 0) {
                            p.image = p.imagesByColor[Object.keys(p.imagesByColor)[0]];
                        }

                        productsToUpload.push({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            costPrice: p.costPrice,
                            markupPercentage: p.markupPercentage,
                            image: p.image || '',
                            category: p.category,
                            clothingType: p.clothingType || 'Varios',
                            imagesByColor: p.imagesByColor || {},
                            variants: finalVariants
                        });
                    });

                    if (productsToUpload.length === 0) {
                        setLoading(false);
                        const firstRow = rawData[0] || {};
                        const detectedKeys = Object.keys(firstRow).join("; ");
                        setStatus(`
                            <strong>No se importaron productos.</strong><br>
                            Delimitador usado: [${delimiter}]<br>
                            Filas leídas: ${rawData.length}<br>
                            Filas saltadas: ${skippedCount}<br>
                            <hr class="my-2 border-gray-200">
                            <strong>Columnas encontradas:</strong><br>
                            <span class="text-xs font-mono bg-gray-100 p-1 rounded block mt-1">${detectedKeys}</span>
                        `, "error");
                        return;
                    }

                    console.log(`Subiendo ${productsToUpload.length} productos...`);
                    await uploadToFirestore(productsToUpload);
                    setLoading(false);
                    setStatus(`¡Éxito! Procesados ${rawData.length - skippedCount} registros. Creados ${productsToUpload.length} productos.`, "success");

                    if (window.normalizeDatabase) window.normalizeDatabase(true);
                    setTimeout(() => location.reload(), 2000);

                } catch (error) {
                    console.error("Error procesando CSV:", error);
                    setLoading(false);
                    setStatus(`Error al procesar: ${error.message}`, "error");
                }
            },
            error: function (error) {
                console.error("Error parseando CSV:", error);
                setLoading(false);
                setStatus(`Error critico leyendo CSV: ${error.message}`, "error");
            }
        });
    };
    reader.readAsText(file.slice(0, 5000)); // Read first 5KB to detect delimiter
});

async function uploadToFirestore(items) {
    const batchSize = 400;
    let batch = writeBatch(db);
    let count = 0;
    let batches = [];

    for (const item of items) {
        // Usamos el ID generado o uno nuevo si quisiéramos
        const docRef = doc(db, "productos", String(item.id));
        batch.set(docRef, item);
        count++;

        if (count >= batchSize) {
            batches.push(batch.commit());
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        batches.push(batch.commit());
    }

    await Promise.all(batches);
}

// UI Helpers
function setLoading(isLoading) {
    const btnText = document.getElementById('btn-text');
    const icon = btnCargar.querySelector('i');

    if (isLoading) {
        btnText.innerText = "Procesando...";
        icon.className = "fa-solid fa-spinner fa-spin";
        btnCargar.disabled = true;
        btnCargar.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btnText.innerText = "Subir Inventario";
        icon.className = "fa-solid fa-arrow-right";
        btnCargar.disabled = false;
        btnCargar.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

function setStatus(msg, type) {
    statusDiv.innerText = msg;
    statusDiv.classList.remove('hidden', 'text-red-500', 'text-green-500', 'text-gray-500');

    if (type === 'error') {
        statusDiv.classList.add('text-red-500');
        statusDiv.innerHTML = `<i class="fa-solid fa-circle-xmark mr-2"></i> ${msg}`;
    } else if (type === 'success') {
        statusDiv.classList.add('text-green-500');
        statusDiv.innerHTML = `<i class="fa-solid fa-check-circle mr-2"></i> ${msg}`;
    } else {
        statusDiv.classList.add('text-gray-500');
    }
}

function getStandardCategory(input) {
    if (!input) return 'General';
    const lower = String(input).toLowerCase().trim();

    const map = {
        'Bebés': ['bebes', 'bebe', 'bebé', 'bebe rn', 'recién nacido', 'rn', 'bba'],
        'No caminantes': ['no caminantes', 'no caminante', 'nocaminantes'],
        'Niños': ['niños', 'niño', 'ninos', 'nino', 'varon'],
        'Niñas': ['niñas', 'niña', 'ninas', 'nina', 'nena']
    };

    for (const [standard, variations] of Object.entries(map)) {
        if (variations.some(v => lower.includes(v))) {
            return standard;
        }
    }
    // Si no matchea nada específico, devolvemos el original prolijo
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}
