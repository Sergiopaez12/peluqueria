const cron = require('node-cron');
const Turno = require('../models/Turno');
const { enviarRecordatorio } = require('./emailService');

// Corre cada hora en punto
const iniciarCron = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Cron: verificando recordatorios...');

        try {
            // Calcular fecha de mañana en zona Argentina (UTC-3)
            const ahora = new Date();
            const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
            const y = manana.getFullYear();
            const m = String(manana.getMonth() + 1).padStart(2, '0');
            const d = String(manana.getDate()).padStart(2, '0');
            const fechaManana = `${y}-${m}-${d}`;

            // Buscar turnos de mañana confirmados/pendientes sin recordatorio enviado
            const turnos = await Turno.find({
                fecha: fechaManana,
                estado: { $in: ['confirmado', 'pendiente'] },
                recordatorioEnviado: false
            }).populate('usuarioId', 'nombre email');

            for (const turno of turnos) {
                if (turno.usuarioId?.email) {
                    try {
                        await enviarRecordatorio(turno, turno.usuarioId);
                        turno.recordatorioEnviado = true;
                        await turno.save();
                    } catch (err) {
                        console.error(`Error enviando recordatorio a ${turno.usuarioId.email}:`, err.message);
                    }
                }
            }

            if (turnos.length > 0) {
                console.log(`📧 ${turnos.length} recordatorio(s) enviado(s) para ${fechaManana}`);
            }
        } catch (err) {
            console.error('Error en cron de recordatorios:', err.message);
        }
    }, {
        timezone: 'America/Argentina/Buenos_Aires'
    });

    console.log('⏰ Cron de recordatorios activado (cada hora en punto)');
};

module.exports = { iniciarCron };
