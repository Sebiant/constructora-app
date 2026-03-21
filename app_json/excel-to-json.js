const XLSX = require("xlsx");
const fs = require("fs");

const workbook = XLSX.readFile("importe_items.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

let itemActual = null;
let tipoActual = "otro";

const items = [];

function limpiarTexto(texto) {
    return (texto || "").toString().trim();
}

function detectarTipoPorCodigo(codigo) {
    if (!codigo) return null;

    if (codigo.startsWith("1")) return "material";
    if (codigo.startsWith("2")) return "mano_obra";
    if (codigo.startsWith("3")) return "equipo";

    return null;
}

data.forEach((row) => {
    const codigo = limpiarTexto(row["CODIGO"]);
    const descripcion = limpiarTexto(row["DESCRIPCION"]);

    if (!codigo && !descripcion) return;

    // 🔹 Detectar ITEM
    if (codigo.startsWith("ITEM")) {
        itemActual = {
            codigo: codigo.replace("ITEM", "").trim(),
            nombre: descripcion,
            componentes: [],
        };

        items.push(itemActual);
        return;
    }

    if (!itemActual) return;

    const descUpper = descripcion.toUpperCase();

    // 🔹 Detectar tipo por secciones (Solo si es el encabezado de la sección)
    if (codigo === "G1" || descUpper === "MATERIALES") {
        tipoActual = "material";
        return;
    }

    if (codigo === "G2" || descUpper === "MANO DE OBRA") {
        tipoActual = "mano_obra";
        return;
    }

    if (codigo === "G3" || descUpper === "EQUIPO") {
        tipoActual = "equipo";
        return;
    }

    if (codigo === "G4" || descUpper === "TRANSPORTES" || descUpper === "TRANSPORTE") {
        tipoActual = "transporte";
        return;
    }

    // 🔹 FILTRO BASURA
    const ignorar = [
        "COSTOS INDIRECTOS",
        "ADMINISTRACION",
        "IMPREVISTOS",
        "UTILIDAD",
        "IVA",
        "TOTAL",
        "DESCRIPCION",
        "SUBTOTAL",
        "VALOR",
        "COSTO DIRECTO"
    ];

    if (ignorar.some(p => descUpper.includes(p))) return;
    if (!codigo || codigo.length === 0) return;

    // Ignorar marcadores de sección del Excel
    const marcadores = ["STG", "ESP", "G1", "G2", "G3", "G4", "C.D.", "TTL", "EM_", "ADM", "IMP", "UTL", "STAIU"];
    if (marcadores.some(m => codigo.startsWith(m))) return;

    // 🔹 Mapeo de columnas según el tipo
    let cantidad = 0;
    let desperdicio = 0;

    if (tipoActual === "material") {
        cantidad = parseFloat(row["CANT."]) || 0;
        desperdicio = parseFloat(row["DESP.%"]) || 0;
    } else if (tipoActual === "mano_obra") {
        // En MO, la cantidad suele ser 1 / Rendimiento
        // El rendimiento está en " PRECIO UNIT " según el Excel
        const rendimiento = parseFloat(row[" PRECIO UNIT "]) || 0;
        cantidad = rendimiento > 0 ? 1 / rendimiento : 0;
        desperdicio = 0; // Opcional: podrías guardar el JORNAL+PS si fuera necesario
    } else if (tipoActual === "equipo") {
        // En Equipo, según el Excel, la columna DESP.% contiene la CANTIDAD
        cantidad = parseFloat(row["DESP.%"]) || 0;
        desperdicio = 0;
    } else if (tipoActual === "transporte") {
        cantidad = parseFloat(row[" VALOR TOTAL "]) || 0; // O lo que corresponda
    }

    // 🔹 Validar que sea componente real
    if (cantidad === 0 && tipoActual !== "transporte") return;

    // 🔥 SOLO REFERENCIA (LO IMPORTANTE)
    const componente = {
        codigo: codigo, // 🔥 FK directa
        tipo: detectarTipoPorCodigo(codigo) || tipoActual,
        cantidad: cantidad,
        desperdicio: desperdicio,
    };

    itemActual.componentes.push(componente);
});

// Guardar JSON
fs.writeFileSync(
    "items_limpios.json",
    JSON.stringify(items, null, 2)
);

console.log("🔥 JSON optimizado para importación generado");