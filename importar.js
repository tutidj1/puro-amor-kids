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

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true, // Auto-converts numbers
        transformHeader: (h) => h.trim().toLowerCase(), // Normalize headers
        complete: async function (results) {
            const rawData = results.data;
            console.log("Datos crudos:", rawData);

            if (rawData.length === 0) {
                setLoading(false);
                setStatus("El archivo está vacío.", "error");
                return;
            }

            // PROCESAMIENTO: Agrupación por Nombre y Conteo de Variantes
            const productsMap = new Map();
            /* 
               Estructura del Map:
               Key: "Nombre producto" (string normalizado)
               Value: {
                   id: timestamp + random,
                   name: "Nombre Original",
                   price: 1234,
                   image: "nombre.jpg",
                   category: "General",
                   variantsMap: Map<"Color|Size|Section", { color, size, section, stock }>
               }
            */

            let processedCount = 0;
            let skippedCount = 0;

            rawData.forEach((row, index) => {
                // Normalizamos las keys para ser tolerantes a espacios o mayúsculas
                // Pero buscamos las columnas específicas pedidas por el usuario

                // Helper para buscar key insensible a case/espacios
                const getVal = (possibleKeys) => {
                    const keys = Object.keys(row);
                    const match = keys.find(k => possibleKeys.includes(k.trim().toLowerCase()));
                    return match ? row[match] : undefined;
                };

                const name = getVal(['nombre producto', 'nombre']);
                const price = getVal(['precio']);
                const image = getVal(['nombre del archivo imagen', 'imagen', 'foto', 'archivo']);
                const category = getVal(['categoria', 'categoría', 'seccion']);

                // Variantes
                const size = getVal(['talle', 'talla']);
                const color = getVal(['color']);

                if (!name) {
                    skippedCount++;
                    return;
                }

                const cleanName = String(name).trim();
                const variantKey = `${String(color || 'Unico').trim()}|${String(size || 'U').trim()}|${String(category || 'General').trim()}`;

                // 1. Crear o Recuperar Producto
                if (!productsMap.has(cleanName)) {
                    productsMap.set(cleanName, {
                        id: Date.now() + index, // ID único
                        name: cleanName,
                        price: Number(price) || 0,
                        image: image ? String(image).trim() : 'https://via.placeholder.com/150',
                        image: image ? String(image).trim() : 'https://via.placeholder.com/150',
                        category: getStandardCategory(category),
                        variantsMap: new Map() // Usamos un mapa interno para agrupar variantes y contar stock
                    });
                }

                const product = productsMap.get(cleanName);

                // 2. Manejar Variante (Conteo de Stock)
                if (product.variantsMap.has(variantKey)) {
                    product.variantsMap.get(variantKey).stock += 1;
                } else {
                    product.variantsMap.set(variantKey, {
                        id: Date.now() + Math.random(),
                        color: String(color || 'Único').trim(),
                        size: String(size || 'U').trim(),
                        section: getStandardCategory(category || product.category),
                        stock: 1 // Primera aparición cuenta como 1
                    });
                }
                processedCount++;
            });

            // Convertir la estructura intermedia a la estructura final de Firestore
            const productsToUpload = [];
            productsMap.forEach(p => {
                const finalVariants = Array.from(p.variantsMap.values());

                // Actualizamos la categoría principal si hay variantes (usamos la de la primera variante como default)
                // Esto es opcional, pero mantiene coherencia
                if (finalVariants.length > 0) {
                    p.category = finalVariants[0].section;
                }

                productsToUpload.push({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    image: p.image,
                    category: p.category,
                    variants: finalVariants
                });
            });

            if (productsToUpload.length === 0) {
                setLoading(false);
                setStatus("No se encontraron productos válidos. Revisa las columnas (Nombre producto, Precio, etc).", "error");
                return;
            }

            try {
                console.log(`Subiendo ${productsToUpload.length} productos...`);
                await uploadToFirestore(productsToUpload);
                setLoading(false);
                setStatus(`¡Éxito! Procesados ${processedCount} registros. Creados ${productsToUpload.length} productos con sus variantes.`, "success");

                // Trigger Auto-Normalization
                if (window.normalizeDatabase) {
                    console.log("Iniciando normalización automática...");
                    window.normalizeDatabase(true);
                }

                setTimeout(() => {
                    location.reload();
                }, 2000);

            } catch (error) {
                console.error("Error subiendo a Firebase:", error);
                setLoading(false);
                setStatus("Error al subir datos. Revisa la consola.", "error");
            }
        },
        error: function (error) {
            console.error("Error parseando CSV:", error);
            setLoading(false);
            setStatus("Error crítico al leer el archivo CSV.", "error");
        }
    });
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
