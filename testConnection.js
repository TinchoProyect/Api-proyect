const sql = require('mssql');
const { configSaldoInicialDB } = require('./dbConfig'); // Importa la configuración de conexión

(async () => {
    try {
        // Conexión a la base de datos
        const pool = await sql.connect(configSaldoInicialDB);
        console.log('Conexión exitosa a SaldoInicialDB');

        // Consultar tablas disponibles
        const result = await pool.request().query(`
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
        `);

        console.log('Tablas disponibles en SaldoInicialDB:');
        result.recordset.forEach((table) => {
            console.log(`${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
        });

        // Cerrar conexión
        pool.close();
    } catch (error) {
        console.error('Error al conectar a SaldoInicialDB:', error.message);
    }
})();
