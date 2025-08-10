// Contract checks para verificar los contratos de API
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Función helper para hacer requests HTTP
function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const req = http.get(`${BASE_URL}${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function runContractChecks() {
    console.log('🔍 Ejecutando Contract Checks...\n');
    
    try {
        // Check 1: /consulta debe devolver Array
        console.log('📋 Check 1: GET /consulta → Array.isArray(respuesta) === true');
        const consultaResponse = await makeRequest('/consulta');
        const isConsultaArray = Array.isArray(consultaResponse.data);
        
        console.log(`   Status: ${consultaResponse.status}`);
        console.log(`   Es Array: ${isConsultaArray}`);
        console.log(`   Tipo: ${typeof consultaResponse.data}`);
        console.log(`   Count: ${isConsultaArray ? consultaResponse.data.length : 'N/A'}`);
        console.log(`   ✅ RESULTADO: ${isConsultaArray ? 'PASS' : 'FAIL'}\n`);
        
        // Check 2: /api/clientes debe devolver objeto con data array
        console.log('📋 Check 2: GET /api/clientes → typeof respuesta === "object" && Array.isArray(respuesta.data)');
        const apiClientesResponse = await makeRequest('/api/clientes');
        const isApiClientesObject = typeof apiClientesResponse.data === 'object' && apiClientesResponse.data !== null;
        const hasDataArray = isApiClientesObject && Array.isArray(apiClientesResponse.data.data);
        
        console.log(`   Status: ${apiClientesResponse.status}`);
        console.log(`   Es Object: ${isApiClientesObject}`);
        console.log(`   Tiene data array: ${hasDataArray}`);
        console.log(`   Estructura: ${JSON.stringify(Object.keys(apiClientesResponse.data || {}))}`);
        console.log(`   Count: ${hasDataArray ? apiClientesResponse.data.data.length : 'N/A'}`);
        console.log(`   ✅ RESULTADO: ${isApiClientesObject && hasDataArray ? 'PASS' : 'FAIL'}\n`);
        
        // Resumen
        const allPassed = isConsultaArray && isApiClientesObject && hasDataArray;
        console.log('📊 RESUMEN DE CONTRACT CHECKS:');
        console.log(`   /consulta: ${isConsultaArray ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   /api/clientes: ${isApiClientesObject && hasDataArray ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   GENERAL: ${allPassed ? '✅ TODOS LOS CONTRATOS OK' : '❌ HAY CONTRATOS ROTOS'}`);
        
        return allPassed;
        
    } catch (error) {
        console.error('❌ Error ejecutando contract checks:', error.message);
        return false;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runContractChecks().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runContractChecks };
