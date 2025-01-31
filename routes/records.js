const express = require('express');
const mongoose = require('mongoose');
const { autenticacion, rol } = require('../middlewares/auth');

const ObjectId = mongoose.Types.ObjectId;
const Record = require('../models/record');
const Patient = require('../models/patient');

let router = express.Router();

// Listado de expedientes médicos
router.get('/', autenticacion, rol('patient', 'admin', 'physio'), async (req, res) => {
    try {
        console.log('UserID en sesión:', req.session.userId);

        let records = [];

        if (req.session.rol === 'patient') {
            // Lógica para el paciente: solo ve sus propios expedientes
            const patient = await Patient.findOne({ userId: new ObjectId(req.session.userId) });

            if (!patient) {
                console.log('Paciente no encontrado con el UserID proporcionado.');
                return res.render('error', { error: 'Paciente no encontrado.' });
            }

            console.log('Paciente encontrado:', patient);
            records = await Record.find({ patient: patient._id }).populate('patient');

        } else if (req.session.rol === 'admin' || req.session.rol === 'physio') {
            // Admin y physio: pueden ver todos los expedientes
            records = await Record.find().populate('patient');
        }

        if (records.length > 0) {
            console.log('Expedientes encontrados:', records);
            res.render('records_list', { records });
        } else {
            console.log('No se encontraron expedientes.');
            res.render('records_list', { records: [], error: 'No se encontraron expedientes.' });
        }
    } catch (error) {
        console.error('Error obteniendo los expedientes:', error);
        res.render('error', { error: 'Hubo un problema al obtener los expedientes médicos.' });
    }
});


// Búsqueda de expedientes médicos por apellido
router.get('/find', autenticacion, rol('admin', 'physio'), async (req, res) => {
    try {
        const { surname } = req.query;
        const patients = await Patient.find({ surname: { $regex: surname, $options: 'i' } });
        const patientIds = patients.map(patient => patient._id);

        const records = await Record.find({ patient: { $in: patientIds } }).populate('patient');
        if (records.length > 0) {
            res.render('records_list', { records });
        } else {
            res.render('error', { error: 'No se encontraron expedientes asociados al apellido ingresado.' });
        }
    } catch (error) {
        console.error('Error durante la búsqueda de expedientes:', error);
        res.render('error', { error: 'Hubo un problema al procesar la búsqueda. Inténtelo más tarde.' });
    }
});

// Renderizado para crear nuevo expediente
router.get('/new', autenticacion, rol('admin', 'physio'), (req, res) => {
    res.render('record_add', { errores: {}, datos: {} });
});

// Inserción de expediente médico
router.post('/', autenticacion, rol('admin', 'physio'), async (req, res) => {
    try {
        const paciente = await Patient.findById(req.body.patientId);
        if (!paciente) {
            throw new Error('El ID del paciente no existe.');
        }

        const nuevoExpediente = new Record({
            patient: req.body.patientId,
            medicalRecord: req.body.medicalRecord
        });

        const errores = nuevoExpediente.validateSync();
        if (errores) {
            throw { errors: errores.errors };
        }

        await nuevoExpediente.save();
        res.redirect('/records');
    } catch (error) {
        console.error('Error registrando el expediente:', error);

        res.render('record_add', {
            errores: error.errors || { general: 'Error registrando el expediente médico.' },
            datos: req.body
        });
    }
});

// Renderizado de detalles de expediente
router.get('/:id', autenticacion, rol('admin', 'physio'),async (req, res) => {
    try {
        const record = await Record.findById(req.params.id)
            .populate('patient')
            .populate('appointments.physio');

        if (!record) {
            return res.render('error', { error: 'Expediente no encontrado.' });
        }

        res.render('records_detail', { record });
    } catch (error) {
        console.error('Error obteniendo el detalle del expediente:', error);
        res.render('error', { error: 'Hubo un problema al obtener el detalle del expediente.' });
    }
});

// Renderizado para añadir una cita al expediente médico
router.get('/:id/appointments/new', autenticacion, rol('admin', 'physio'),async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);
        if (!record) {
            return res.render('error', { error: 'Expediente no encontrado.' });
        }
        res.render('appointment_add', { recordId: req.params.id, errores: {}, datos: {} });
    } catch (error) {
        console.error('Error obteniendo el expediente:', error);
        res.render('error', { error: 'Hubo un problema al cargar el formulario para añadir una cita.' });
    }
});

// Inserción de citas en expedientes médicos
router.post('/:id/appointments', autenticacion, rol('admin', 'physio'),async (req, res) => {
    try {
        const record = await Record.findById(req.params.id);
        if (!record) {
            return res.render('error', { error: 'Expediente no encontrado.' });
        }

        const nuevaCita = {
            date: new Date(req.body.date),
            physio: req.body.physio,
            diagnosis: req.body.diagnosis,
            treatment: req.body.treatment,
            observations: req.body.observations
        };

        record.appointments.push(nuevaCita);
        await record.save();

        res.redirect(`/records/${req.params.id}`);
    } catch (error) {
        console.error('Error añadiendo la cita:', error);

        res.render('appointment_add', {
            recordId: req.params.id,
            errores: { general: 'Error añadiendo la cita al expediente.' },
            datos: req.body
        });
    }
});

// Borrado de expedientes
router.delete('/:id', autenticacion, rol('admin'), async (req, res) => {
    try {
        const record = await Record.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.render('error', { error: 'Expediente no encontrado.' });
        }

        res.redirect('/records');
    } catch (error) {
        console.error('Error eliminando el expediente:', error);
        res.render('error', { error: 'Hubo un problema al eliminar el expediente médico.' });
    }
});


module.exports = router;
