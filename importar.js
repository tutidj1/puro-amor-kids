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
        dynamicTyping: true,
        complete: async function (results) {
            const rawData = results.data;
            console.log("Datos crudos:", rawData);

            if (rawData.length === 0) {
                setLoading(false);
                setStatus("El archivo está vacío.", "error");
                return;
            }

            // PROCESAMIENTO INTELIGENTE: Agrupar por "Nombre"
            const productsMap = new Map();
            let errors = [];

            // Diagnóstico rápido de headers
            const firstRowHeaders = rawData.length > 0 ? Object.keys(rawData[0]) : [];
            console.log("Headers detectados:", firstRowHeaders);

            rawData.forEach((row, index) => {
                // Normalizar keys (minúsculas y trim) para evitar problemas
                const cleanRow = {};
                Object.keys(row).forEach(k => {
                    cleanRow[k.trim().toLowerCase()] = row[k];
                });

                // Mapeo de columnas del Usuario -> Campos del Sistema
                // Excel del user: Nombre, Talle, Color, Precio, Stock, Nombre de Archivo de Imagen, Categoría
                const name = cleanRow['nombre'];
                const price = cleanRow['precio'];
                // Soporte para varias formas de llamar a la imagen
                const image = cleanRow['nombre de archivo de imagen'] || cleanRow['imagen'] || cleanRow['foto'] || 'https://via.placeholder.com/300';
                const category = cleanRow['categoría'] || cleanRow['categoria'] || 'General';

                // Variantes
                const size = cleanRow['talle'];
                const color = cleanRow['color'];
                const stock = cleanRow['stock'];

                if (!name) return; // Saltar filas vacías

                // Si no existe el producto en el mapa, lo creamos
                if (!productsMap.has(name)) {
                    productsMap.set(name, {
                        id: Date.now() + Math.floor(Math.random() * 1000) + index, // ID único temporal basado en tiempo+index
                        name: String(name).trim(),
                        price: Number(price) || 0,
                        image: String(image).trim(),
                        category: String(category).trim(),
                        variants: []
                    });
                }

                // Agregamos la variante (si tiene datos de variante)
                if (size || color || stock !== undefined) {
                    const product = productsMap.get(name);
                    product.variants.push({
                        id: Date.now() + Math.random(), // ID único para la variante
                        color: String(color || 'Único').trim(),
                        size: String(size || 'U').trim(),
                        stock: Number(stock) || 0,
                        section: String(category).trim() // Usamos la categoría como sección por defecto
                    });
                }
            });

            const productsToUpload = Array.from(productsMap.values());

            if (productsToUpload.length === 0) {
                setLoading(false);
                let msg = "No encontré la columna 'Nombre'. ";
                if (firstRowHeaders.length > 0) {
                    msg += `Detecté estas columnas: [${firstRowHeaders.join(', ')}]. `;
                    if (firstRowHeaders.length === 1 && firstRowHeaders[0].includes(';')) {
                        msg += "Parece un error de 'Punto y coma'. Guarda el CSV separado por COMAS.";
                    }
                }
                setStatus(msg, "error");
                return;
            }

            try {
                await uploadToFirestore(productsToUpload);
                setLoading(false);
                setStatus(`¡Éxito! Se procesaron ${rawData.length} filas y se crearon ${productsToUpload.length} productos agrupados.`, "success");

                setTimeout(() => {
                    location.reload();
                }, 2500);

            } catch (error) {
                console.error("Error subiendo a Firebase:", error);
                setLoading(false);
                setStatus("Error al subir datos. Revisa la consola.", "error");
            }
        },
        error: function (error) {
            console.error("Error parseando CSV:", error);
            setLoading(false);
            setStatus("Error al leer el archivo CSV.", "error");
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
