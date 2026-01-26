const { getDevolucionesArticulos } = require('./queries/devolucionesQueries');

async function test() {
    try {
        console.log("Consultando devoluciones...");
        const devoluciones = await getDevolucionesArticulos();
        console.log(`\n=== RESULTADO TOTAL: ${devoluciones.length} devoluciones encontradas ===\n`);

        // Agrupar por mes para mostrar distribución
        const porMes = devoluciones.reduce((acc, curr) => {
            const fecha = new Date(curr.fecha);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            acc[mes] = (acc[mes] || 0) + 1;
            return acc;
        }, {});

        console.log("Distribución por mes:");
        console.table(porMes);

        // Mostrar las últimas 5 para verificar vigencia
        console.log("\nÚltimos 5 registros (más recientes):");
        console.log(JSON.stringify(devoluciones.slice(0, 5), null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

test();
