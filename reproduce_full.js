const { getDevolucionesArticulos } = require('./queries/devolucionesQueries');
// Simulamos las entradas como strings, que vienen de req.query
const cliente = '13';
const articulo = 'NMELCHx5';
const fecha = '2026-01-25';
const cantidad = '1.000';

async function reproduceFull() {
    try {
        console.log(`Llamando a getDevolucionesArticulos('${cliente}', '${articulo}', '${fecha}', '${cantidad}')`);

        const result = await getDevolucionesArticulos(cliente, articulo, fecha, cantidad);

        console.log("Resultados:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } // No exit explícito
    setTimeout(() => process.exit(0), 2000);
}

reproduceFull();
