const { getDevolucionesArticulos } = require('./queries/devolucionesQueries');

async function testOutput() {
    try {
        console.log("Simulando llamada a la API con: Cliente=13, Art=NMELCHx5, Cant=1, Fecha=2026-01-24");
        // Nota: cantidad se pasa como número o string, la función lo maneja
        const result = await getDevolucionesArticulos(13, 'NMELCHx5', '2026-01-24', 1);
        console.log("--- RESPUESTA JSON EXACTA ---");
        console.log(JSON.stringify(result, null, 2));
        console.log("-----------------------------");
    } catch (err) {
        console.error("Error:", err);
    } // No process.exit() explícito si la conexión queda abierta, pero node suele cerrar.
    // Force exit to be sure
    setTimeout(() => process.exit(0), 2000);
}

testOutput();
