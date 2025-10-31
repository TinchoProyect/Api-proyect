const https = require('https');
const http = require('http');

// Configuración
const BASE_URL = 'https://api.lamdaser.com';
const TEST_CLIENT_ID = 1; // ID de cliente de ejemplo para pruebas

// Función para hacer requests HTTP/HTTPS
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const options = {
            timeout: 10000,
            headers: {
                'User-Agent': 'API-Verification-Tool/1.0'
            }
        };

        const req = client.get(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        contentType: res.headers['content-type'],
                        data: jsonData,
                        rawData: data
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        contentType: res.headers['content-type'],
                        data: null,
                        rawData: data,
                        parseError: e.message
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Función para analizar estructura de respuesta
function analyzeResponseStructure(data) {
    if (Array.isArray(data)) {
        return {
            type: 'Array',
            length: data.length,
            firstElement: data.length > 0 ? sanitizeObject(data[0]) : null
        };
    } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
        return {
            type: 'Object(wrapper)',
            length: data.data.length,
            firstElement: data.data.length > 0 ? sanitizeObject(data.data[0]) : null,
            wrapperFields: Object.keys(data)
        };
    } else if (data && typeof data === 'object') {
        return {
            type: 'Object',
            fields: Object.keys(data),
            sanitizedData: sanitizeObject(data)
        };
    }
    return {
        type: 'Unknown',
        data: data
    };
}

// Función para sanitizar objetos (ocultar datos sensibles)
function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.length > 10) {
            sanitized[key] = value.substring(0, 10) + '...';
        } else if (typeof value === 'number') {
            sanitized[key] = '<number>';
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// Función para calcular porcentajes de campos faltantes
function calculateMissingFields(data, requiredFields) {
    if (!Array.isArray(data) || data.length === 0) {
        return { total: 0, missing: {} };
    }
    
    const missing = {};
    const total = data.length;
    
    requiredFields.forEach(field => {
        const missingCount = data.filter(item => 
            item[field] === null || 
            item[field] === undefined || 
            item[field] === ''
        ).length;
        
        missing[field] = {
            count: missingCount,
            percentage: ((missingCount / total) * 100).toFixed(1)
        };
    });
    
    return { total, missing };
}

// Función principal de verificación
async function verifyAPI() {
    console.log('🔍 VERIFICACIÓN EN VIVO DE API - SIN MODIFICAR CÓDIGO');
    console.log('='.repeat(60));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Cliente de prueba: ${TEST_CLIENT_ID}`);
    console.log('');

    const results = {};
    
    // 1. Verificar /consulta
    console.log('📋 Verificando /consulta...');
    try {
        const response = await makeRequest(`${BASE_URL}/consulta`);
        const structure = analyzeResponseStructure(response.data);
        
        let dataArray = response.data;
        if (structure.type === 'Object(wrapper)' && response.data.data) {
            dataArray = response.data.data;
        }
        
        const fieldAnalysis = calculateMissingFields(dataArray, ['cliente_id', 'nombre', 'apellido']);
        
        results.consulta = {
            status: response.status,
            contentType: response.contentType,
            structure: structure,
            fieldAnalysis: fieldAnalysis,
            success: response.status === 200
        };
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.contentType}`);
        console.log(`   Tipo: ${structure.type}`);
        console.log(`   Longitud: ${structure.length || 'N/A'}`);
        if (fieldAnalysis.total > 0) {
            console.log(`   % sin Número: ${fieldAnalysis.missing.cliente_id?.percentage || 0}%`);
            console.log(`   % sin Nombre: ${fieldAnalysis.missing.nombre?.percentage || 0}%`);
            console.log(`   % sin Apellido: ${fieldAnalysis.missing.apellido?.percentage || 0}%`);
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.consulta = { error: error.message, success: false };
    }
    
    console.log('');
    
    // 2. Verificar /saldos-iniciales/{id}
    console.log(`💰 Verificando /saldos-iniciales/${TEST_CLIENT_ID}...`);
    try {
        const response = await makeRequest(`${BASE_URL}/saldos-iniciales/${TEST_CLIENT_ID}`);
        const structure = analyzeResponseStructure(response.data);
        
        const hasMonto = response.data && typeof response.data.Monto !== 'undefined';
        const montoType = hasMonto ? typeof response.data.Monto : 'undefined';
        
        results.saldosIniciales = {
            status: response.status,
            contentType: response.contentType,
            structure: structure,
            hasMonto: hasMonto,
            montoType: montoType,
            success: response.status === 200
        };
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.contentType}`);
        console.log(`   Tipo: ${structure.type}`);
        console.log(`   Monto: ${montoType}`);
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.saldosIniciales = { error: error.message, success: false };
    }
    
    console.log('');
    
    // 3. Verificar /movimientos?clienteId={id}
    console.log(`📊 Verificando /movimientos?clienteId=${TEST_CLIENT_ID}...`);
    try {
        const response = await makeRequest(`${BASE_URL}/movimientos?clienteId=${TEST_CLIENT_ID}`);
        const structure = analyzeResponseStructure(response.data);
        
        const dataArray = Array.isArray(response.data) ? response.data : [];
        const requiredFields = ['codigo', 'nombre_comprobante', 'importe_total', 'fecha', 'numero'];
        const fieldAnalysis = calculateMissingFields(dataArray, requiredFields);
        
        results.movimientos = {
            status: response.status,
            contentType: response.contentType,
            structure: structure,
            fieldAnalysis: fieldAnalysis,
            success: response.status === 200
        };
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.contentType}`);
        console.log(`   Tipo: ${structure.type}`);
        console.log(`   Longitud: ${structure.length || dataArray.length}`);
        if (fieldAnalysis.total > 0) {
            requiredFields.forEach(field => {
                const missing = fieldAnalysis.missing[field];
                if (missing) {
                    console.log(`   % sin ${field}: ${missing.percentage}%`);
                }
            });
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.movimientos = { error: error.message, success: false };
    }
    
    console.log('');
    
    // 4. Verificar /movimientos_detalles?clienteId={id}
    console.log(`📋 Verificando /movimientos_detalles?clienteId=${TEST_CLIENT_ID}...`);
    try {
        const response = await makeRequest(`${BASE_URL}/movimientos_detalles?clienteId=${TEST_CLIENT_ID}`);
        const structure = analyzeResponseStructure(response.data);
        
        const dataArray = Array.isArray(response.data) ? response.data : [];
        const requiredFields = ['Codigo_Movimiento', 'Articulo_Detalle', 'Descripcion_Detalle', 'Cantidad_Detalle', 'Punto_Venta_Detalle'];
        const fieldAnalysis = calculateMissingFields(dataArray, requiredFields);
        
        results.movimientosDetalles = {
            status: response.status,
            contentType: response.contentType,
            structure: structure,
            fieldAnalysis: fieldAnalysis,
            success: response.status === 200
        };
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.contentType}`);
        console.log(`   Tipo: ${structure.type}`);
        console.log(`   Longitud: ${structure.length || dataArray.length}`);
        if (fieldAnalysis.total > 0) {
            requiredFields.forEach(field => {
                const missing = fieldAnalysis.missing[field];
                if (missing) {
                    console.log(`   % sin ${field}: ${missing.percentage}%`);
                }
            });
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.movimientosDetalles = { error: error.message, success: false };
    }
    
    console.log('');
    console.log('📋 RESUMEN FINAL');
    console.log('='.repeat(40));
    
    // Resumen por endpoint
    console.log(`GET /consulta → tipo=${results.consulta?.structure?.type || 'Error'}, length=${results.consulta?.structure?.length || 0}`);
    if (results.consulta?.fieldAnalysis?.total > 0) {
        const fa = results.consulta.fieldAnalysis.missing;
        console.log(`   %sin Número: ${fa.cliente_id?.percentage || 0}%, %sin Nombre: ${fa.nombre?.percentage || 0}%, %sin Apellido: ${fa.apellido?.percentage || 0}%`);
    }
    
    console.log(`GET /saldos-iniciales/{id} → ${results.saldosIniciales?.success ? 'ok' : 'falla'}, Monto: ${results.saldosIniciales?.montoType || 'undefined'}`);
    
    console.log(`GET /movimientos?clienteId={id} → tipo=${results.movimientos?.structure?.type || 'Error'}, length=${results.movimientos?.structure?.length || 0}`);
    
    console.log(`GET /movimientos_detalles?clienteId={id} → tipo=${results.movimientosDetalles?.structure?.type || 'Error'}, length=${results.movimientosDetalles?.structure?.length || 0}`);
    
    // Conclusión
    const hasWrapperIssues = results.consulta?.structure?.type === 'Object(wrapper)';
    const hasMissingFields = Object.values(results).some(r => 
        r.fieldAnalysis && Object.values(r.fieldAnalysis.missing).some(f => parseFloat(f.percentage) > 0)
    );
    
    console.log('');
    if (hasWrapperIssues || hasMissingFields) {
        console.log('❌ CONCLUSIÓN: Mismatch detectado');
        if (hasWrapperIssues) console.log('   - Wrapper detectado en /consulta');
        if (hasMissingFields) console.log('   - Campos faltantes detectados');
    } else {
        console.log('✅ CONCLUSIÓN: Match con lo esperado');
    }
    
    return results;
}

// Ejecutar verificación
if (require.main === module) {
    verifyAPI().catch(console.error);
}

module.exports = { verifyAPI };
