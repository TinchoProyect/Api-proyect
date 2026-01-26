const express = require('express');
const cors = require('cors');
const { getDevolucionesArticulos } = require('./queries/devolucionesQueries');

const app = express();
const PORT = 4372;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos (HTML)

// Endpoint específico solicitado
app.get('/devoluciones', async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Solicitud recibida en /devoluciones`);
        const devoluciones = await getDevolucionesArticulos();
        res.json(devoluciones);
    } catch (err) {
        console.error('Error al obtener devoluciones:', err);
        res.status(500).send('Error al obtener devoluciones');
    }
});

const { exec } = require('child_process');

// Función para liberar el puerto en Windows
const liberarPuerto = (port) => {
    return new Promise((resolve) => {
        exec(`netstat -aon | findstr :${port}`, (err, stdout) => {
            if (err || !stdout) {
                // No hay proceso en ese puerto o error al buscar
                return resolve();
            }

            // El formato es: TCP    0.0.0.0:4372           0.0.0.0:0              LISTENING       1234
            // Buscamos el último token que es el PID
            const lines = stdout.trim().split('\n');
            if (lines.length === 0) return resolve();

            const line = lines[0].trim();
            const parts = line.split(/\s+/);
            const pid = parts[parts.length - 1];

            if (pid && !isNaN(pid)) {
                console.log(`Liberando puerto ${port} (Matando proceso PID: ${pid})...`);
                exec(`taskkill /F /PID ${pid}`, (err) => {
                    if (err) console.error(`Error al matar proceso: ${err.message}`);
                    else console.log('Puerto liberado.');
                    // Damos un pequeño respiro al sistema
                    setTimeout(resolve, 1000);
                });
            } else {
                resolve();
            }
        });
    });
};

// Iniciar servidor asegurando que el puerto esté libre
const startServer = async () => {
    await liberarPuerto(PORT);

    app.listen(PORT, () => {
        console.log(`\n=== SERVICIO DE DEVOLUCIONES INICIADO ===`);
        console.log(`Puerto: ${PORT}`);
        console.log(`Ver Tabla: http://localhost:${PORT}/`);
        console.log(`API JSON:  http://localhost:${PORT}/devoluciones`);
        console.log(`Presiona Ctrl+C para detener el servicio.`);
    });
};

startServer();
