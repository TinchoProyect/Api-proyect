const sql = require('mssql');

// Configuración de la nueva base de datos
const configSaldoInicialDB = {
    server: 'localhost',
    database: 'SaldoInicialDB',
    user: 'LamdaDatosConsolidados',
    password: 'Lamda2024!',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
    connectionTimeout: 30000, // Tiempo de espera de conexión en milisegundos (30 segundos)
    requestTimeout: 30000,    // Tiempo de espera de solicitud en milisegundos (30 segundos)
};

// Función para verificar la conexión antes de operar
const validarConexion = async () => {
    try {
        console.log('Validando conexión a la base de datos...');
        const pool = new sql.ConnectionPool(configSaldoInicialDB);
        await pool.connect();
        console.log('Conexión exitosa a la base de datos.');

        // Validar el usuario actual
        const userResult = await pool.request().query('SELECT CURRENT_USER AS CurrentUser;');
        const currentUser = userResult.recordset[0].CurrentUser;
        console.log('Usuario actual:', currentUser);

        // Permitir conexión tanto con LamdaDatosConsolidados como con dbo
        if (currentUser !== 'LamdaDatosConsolidados' && currentUser !== 'dbo') {
            throw new Error(
                `El usuario actual no es el esperado. Usuario actual: ${currentUser}`
            );
        }

        // Forzar el uso de la base de datos en cada conexión
        await pool.request().query('USE SaldoInicialDB;');
        console.log('Base de datos seleccionada: SaldoInicialDB.');

        return pool; // Devuelve la conexión activa
    } catch (error) {
        console.error('Error al validar la conexión:', error.message);
        throw new Error('No se pudo conectar a la base de datos: ' + error.message);
    }
};

// Función para obtener el saldo inicial de un cliente
const obtenerSaldoInicial = async (IDCliente) => {
    let pool;
    try {
        console.log('Paso 1: Ejecutando consulta para IDCliente:', IDCliente);
        pool = await validarConexion(); // Validar conexión
        console.log('Paso 2: Conexión validada, ejecutando consulta SQL...');

        const result = await pool.request()
            .input('IDCliente', sql.Int, IDCliente)
            .query(`
                SELECT IDCliente, Monto, Fecha, UltimaModificacion
                FROM dbo.SaldosIniciales
                WHERE IDCliente = @IDCliente;
            `);
        console.log('Paso 3: Resultado de la consulta SQL:', result.recordset);

        if (result.recordset.length === 0) {
            console.log('Paso 4: No se encontró saldo inicial para el cliente.');
            return null; // No se encontró saldo inicial para el cliente
        }

        console.log('Paso 5: Devolviendo resultado del saldo inicial:', result.recordset[0]);
        return result.recordset[0]; // Retorna el saldo inicial del cliente
    } catch (error) {
        console.error('Error al obtener saldo inicial:', error.message); // Log del error
        throw new Error('Error al obtener saldo inicial: ' + error.message);
    } finally {
        if (pool) {
            console.log('Cerrando conexión con la base de datos...');
            await pool.close();
        }
    }
};

// Función para insertar un saldo inicial
const insertarSaldoInicial = async (IDCliente, Monto, Fecha, Usuario) => {
    let pool;
    try {
        console.log('Paso 1: Validando conexión para insertar saldo inicial...');
        pool = await validarConexion(); // Validar conexión
        console.log('Paso 2: Conexión validada, ejecutando inserción...');

        await pool.request()
            .input('IDCliente', sql.Int, IDCliente)
            .input('Monto', sql.Decimal(18, 2), Monto)
            .input('Fecha', sql.Date, Fecha)
            .query(`
                INSERT INTO dbo.SaldosIniciales (IDCliente, Monto, Fecha, UltimaModificacion, Usuario)
                VALUES (@IDCliente, @Monto, @Fecha, GETDATE(), @Usuario);
            `);
        console.log('Paso 3: Inserción realizada con éxito.');
    } catch (error) {
        console.error('Error al insertar saldo inicial:', error.message);
        throw new Error('Error al insertar saldo inicial: ' + error.message);
    } finally {
        if (pool) {
            console.log('Cerrando conexión con la base de datos...');
            await pool.close();
        }
    }
};

// Función para actualizar un saldo inicial
const actualizarSaldoInicial = async (IDCliente, Monto, Fecha, Usuario) => {
    let pool;
    try {
        console.log('Paso 1: Validando conexión para actualizar saldo inicial...');
        pool = await validarConexion(); // Validar conexión
        console.log('Paso 2: Conexión validada, ejecutando actualización...');

        await pool.request()
            .input('IDCliente', sql.Int, IDCliente)
            .input('Monto', sql.Decimal(18, 2), Monto)
            .input('Fecha', sql.Date, Fecha)
            .query(`
                UPDATE dbo.SaldosIniciales
                SET Monto = @Monto, Fecha = @Fecha, UltimaModificacion = GETDATE(), Usuario = @Usuario
                WHERE IDCliente = @IDCliente;
            `);
        console.log('Paso 3: Actualización realizada con éxito.');
    } catch (error) {
        console.error('Error al actualizar saldo inicial:', error.message);
        throw new Error('Error al actualizar saldo inicial: ' + error.message);
    } finally {
        if (pool) {
            console.log('Cerrando conexión con la base de datos...');
            await pool.close();
        }
    }
};

// Función para verificar si existe un saldo inicial
const existeSaldoInicial = async (IDCliente) => {
    let pool;
    try {
        console.log('Paso 1: Validando conexión para verificar existencia de saldo inicial...');
        pool = await validarConexion(); // Validar conexión
        console.log('Paso 2: Conexión validada, ejecutando verificación...');

        const result = await pool.request()
            .input('IDCliente', sql.Int, IDCliente)
            .query(`
                SELECT COUNT(*) AS Count
                FROM dbo.SaldosIniciales
                WHERE IDCliente = @IDCliente;
            `);
        console.log('Paso 3: Resultado de la verificación:', result.recordset[0].Count);
        return result.recordset[0].Count > 0;
    } catch (error) {
        console.error('Error al verificar saldo inicial:', error.message);
        throw new Error('Error al verificar saldo inicial: ' + error.message);
    } finally {
        if (pool) {
            console.log('Cerrando conexión con la base de datos...');
            await pool.close();
        }
    }
};

module.exports = { insertarSaldoInicial, actualizarSaldoInicial, existeSaldoInicial, obtenerSaldoInicial };



