const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const { getClientes } = require('./queries/clientesQueries');  
const { getMovimientosPorCliente } = require('./queries/movimientosQueries'); 
const { getKardex } = require('./queries/kardexQueries');  
const { getArticulosAsociados } = require('./queries/artXartQueries'); 
const { getArticulos } = require('./queries/articulosQueries'); 
const { getMovimientosYDetalles } = require('./queries/MovKaxQueries');  
const { insertarSaldoInicial, actualizarSaldoInicial, existeSaldoInicial, obtenerSaldoInicial } = require('./queries/saldosIniciales'); // Importar las funciones de saldos iniciales
const { getArticulosConCodigosBarras } = require('./queries/articuloCodBarrasQueries');

const app = express();

app.use(cors()); // Middleware para permitir solicitudes CORS
app.use(express.json()); // Middleware para leer cuerpos de solicitudes JSON

// Configuración de la base de datos SQL Server
const config = {
    server: 'localhost',  
    database: 'DatosSQL',
    user: 'api_usuario',
    password: 'ApiNueva26102024',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

// Conectar a la base de datos
sql.connect(config).then(() => {
    console.log('Conectado a la base de datos SQL Server');
}).catch(err => console.error('Error al conectar a la base de datos:', err));

// Ruta para obtener la lista de clientes
app.get('/consulta', async (req, res) => {
    try {
        const clientes = await getClientes();  
        res.json(clientes);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener la lista de clientes');
    }
});

// Ruta para obtener los movimientos de un cliente específico
app.get('/movimientos', async (req, res) => {
    const clienteId = req.query.clienteId;
    console.log(`clienteId recibido: ${clienteId}`);
    
    if (!clienteId) {
        return res.status(400).send('El ID del cliente es necesario');
    }
    
    try {
        const movimientos = await getMovimientosPorCliente(clienteId);  
        res.json(movimientos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los movimientos del cliente');
    }
});

// Nueva ruta para obtener los movimientos y detalles de Kardex
app.get('/movimientos_detalles', async (req, res) => {
    const clienteId = req.query.clienteId;
    console.log(`clienteId recibido para detalles: ${clienteId}`);
    
    if (!clienteId) {
        return res.status(400).send('El ID del cliente es necesario');
    }
    
    try {
        const movimientosYDetalles = await getMovimientosYDetalles(clienteId);  
        res.json(movimientosYDetalles);  
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los movimientos y detalles del cliente');
    }
});

// Ruta para obtener los datos de Kardex
app.get('/kardex', async (req, res) => {
    try {
        const kardex = await getKardex();  
        res.json(kardex);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los datos de Kardex');
    }
});

// Ruta para obtener los artículos asociados
app.get('/articulos_asociados', async (req, res) => {
    try {
        const articulosAsociados = await getArticulosAsociados();  
        res.json(articulosAsociados);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los artículos asociados');
    }
});

// Nueva ruta para obtener los artículos
app.get('/articulos', async (req, res) => {
    try {
        const articulos = await getArticulos();  
        res.json(articulos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los artículos');
    }
});

// Nuevo endpoint para obtener artículos con códigos de barras
app.get('/etiquetas/articulos', async (req, res) => {
    try {
        const articulosConCodigos = await getArticulosConCodigosBarras();
        res.json(articulosConCodigos);
    } catch (err) {
        console.error('Error al obtener artículos con códigos de barras:', err);
        res.status(500).send('Error al obtener artículos con códigos de barras');
    }
});

// Nuevo endpoint para obtener el saldo inicial de un cliente
app.get('/saldos-iniciales/:idCliente', async (req, res) => {
    const idCliente = parseInt(req.params.idCliente, 10); // Convertir el ID del cliente a número

    if (isNaN(idCliente)) { // Verificar si la conversión fue exitosa
        return res.status(400).send('El ID del cliente debe ser un número válido');
    }

    try {
        const saldoInicial = await obtenerSaldoInicial(idCliente); // Llamar a la función en saldosIniciales.js
        if (saldoInicial) {
            res.json(saldoInicial); // Enviar el saldo inicial al cliente
        } else {
            res.status(404).send('Saldo inicial no encontrado para el cliente especificado');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al obtener el saldo inicial: ' + error.message);
    }
});

// Nuevo endpoint para manejar saldos iniciales
app.post('/saldos-iniciales', async (req, res) => {
    const { IDCliente, Monto, Fecha } = req.body;

    // Validar campos requeridos
    if (IDCliente === undefined || Monto === undefined || Fecha === undefined) {
        return res.status(400).send('Faltan campos requeridos en la solicitud');
    }

    try {
        // Verificar si existe el saldo inicial antes de actualizar
        const saldoExiste = await existeSaldoInicial(IDCliente);
        
        if (saldoExiste) {
            // Si existe, actualizar el saldo inicial
            await actualizarSaldoInicial(IDCliente, Monto, Fecha);
            return res.status(200).send('Saldo inicial actualizado correctamente');
        } else {
            // Si no existe, enviar un mensaje de error
            return res.status(404).send('Cliente no encontrado para actualizar saldo inicial');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al procesar la solicitud: ' + error.message);
    }
});

// Verificar si la API está activa
app.get('/', (req, res) => {
    res.send('API funcionando correctamente');
});

// Middleware para manejar errores globales
app.use((err, req, res, next) => {
    console.error('Error global:', err.stack);
    res.status(500).send('Algo salió mal en el servidor.');
});

// Usar el puerto proporcionado por el entorno o el puerto 8080 por defecto
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`La API está escuchando en el puerto ${port}`);
});
