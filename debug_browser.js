// -----------------------------------------------------------------------------
// SCRIPT DE DEPURACIÓN PARA CONSOLA DEL NAVEGADOR
// Copia y pega esto en la consola (F12) del navegador donde corre tu cliente web.
// -----------------------------------------------------------------------------

(async () => {
    // 1. CONFIGURACIÓN
    // Ajusta esta URL si el cliente apunta a otro dominio (ej: localhost:3000 o api.lamdaser.com)
    const BASE_URL = 'http://localhost:3000';
    // const BASE_URL = 'https://api.lamdaser.com'; // Descomentar si es producción

    const params = new URLSearchParams({
        cliente: '13',
        articulo: 'NMELCHx5',
        cantidad: '1',
        fecha: '2026-01-24'
    });

    const url = `${BASE_URL}/devoluciones?${params.toString()}`;

    console.clear();
    console.log(`%c🕵️‍♂️ INICIANDO DIAGNÓSTICO DE DEVOLUCIONES`, 'color: #00aaff; font-size: 14px; font-weight: bold;');
    console.log(`🌍 Consultando URL: ${url}`);

    try {
        const start = performance.now();
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const duration = (performance.now() - start).toFixed(2);

        console.log(`⏱️ Latencia: ${duration}ms`);
        console.log(`📥 Status HTTP: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status}`);
        }

        const data = await response.json();

        console.log(`%c📦 DATOS RECIBIDOS (Raw JSON):`, 'color: #00ff00; font-weight: bold;');
        console.dir(data); // Muestra el objeto interactivo

        if (Array.isArray(data)) {
            console.log(`📏 Cantidad de resultados: ${data.length}`);
            if (data.length === 0) {
                console.warn(`%c⚠️ EL ARRAY ESTÁ VACÍO. Revisa los filtros.`, 'color: orange; font-weight: bold;');
            } else {
                console.log(`%c✅ ÉXITO: Se encontró registro.`, 'color: #00ff00; font-weight: bold;');
                const item = data[0];
                console.group('🔍 Detalles del primer registro:');
                console.log(`📄 Comprobante: ${item.tipo_comprobante} ${item.punto_venta}-${item.numero_comprobante}`);
                console.log(`📦 Artículo: ${item.codigo_articulo} (${item.articulo})`);
                console.log(`🔢 Cantidad: ${item.cantidad}`);
                console.log(`📅 Fecha: ${item.fecha}`);
                console.groupEnd();
            }
        } else {
            console.error(`❌ ERROR DE FORMATO: Se esperaba un Array, se recibió: ${typeof data}`);
        }

    } catch (error) {
        console.error(`%c🔥 ERROR CRÍTICO:`, 'color: red; font-weight: bold;', error.message);
    }
})();
