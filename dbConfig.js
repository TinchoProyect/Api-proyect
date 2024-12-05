const sql = require('mssql');

// Configuración de la base de datos principal (DatosSQL)
const configDatosSQL = {
    server: 'localhost',
    database: 'DatosSQL',
    user: 'api_usuario',
    password: 'ApiNueva26102024',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

// Configuración de la base de datos de saldos iniciales (SaldoInicialDB)
const configSaldoInicialDB = {
    server: 'localhost',
    database: 'SaldoInicialDB',
    user: 'LamdaDatosConsolidados',
    password: 'Lamda2024!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

// Función para conectar a una base de datos
const connectToDB = async (config) => {
    try {
        const pool = await sql.connect(config);
        console.log(`Conectado a la base de datos ${config.database}`);
        return pool;
    } catch (error) {
        throw new Error(`Error al conectar a la base de datos ${config.database}: ${error.message}`);
    }
};

// Exportar configuraciones y función de conexión
module.exports = {
    configDatosSQL,
    configSaldoInicialDB,
    connectToDB
};
