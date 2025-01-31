const express = require('express');
const mongoose = require('mongoose');
const { autenticacion, rol } = require('../middlewares/auth'); 

const upload = require(__dirname + '/../utils/uploads.js');
const Patient = require('../models/patient');
const User = require('../models/users');
let router = express.Router();

const ObjectId = mongoose.Types.ObjectId;

router.get('/me', autenticacion, async (req, res) => {
    try {
        console.log('UserID en sesión:', req.session.userId);

        const userId = new ObjectId(req.session.userId);
        const patient = await Patient.findOne({ userId });

        if (!patient) {
            console.log('Paciente no encontrado con el UserID proporcionado.');
            return res.render('error', { error: 'Paciente no encontrado.' });
        }

        console.log('Paciente encontrado:', patient);
        res.render('patients_detail', { patient });
    } catch (error) {
        console.error('Error obteniendo los datos del paciente:', error);
        res.render('error', { error: 'Hubo un problema al obtener los datos del paciente.' });
    }
});

// Listado general
router.get('/', autenticacion, rol('admin', 'physio'), async (req, res) => {
    try {
        const patients = await Patient.find();
        res.render('patients_list', { patients });
    } catch (error) {
        res.render('error', { error: 'Error obteniendo la lista de pacientes' });
    }
});

//Búsqueda de pacientes por apellido
router.get('/find', autenticacion, rol('admin', 'physio'), async (req, res) => {
    console.log('Dentro del controlador de /find');
    try {
        const { surname } = req.query;
        const filter = surname ? { surname: { $regex: surname, $options: 'i' } } : {};
        const patients = await Patient.find(filter);
        if (patients.length > 0) {
            res.render('patients_list', { patients });
        } else {
            res.render('error', { error: 'No se encontraron pacientes asociados al apellido ingresado.' });
        }
    } catch (error) {
        res.render('error', { error: 'Hubo un problema al procesar la búsqueda. Inténtelo más tarde.' });
    }
});

//Renderizado insercción de pacientes
router.get('/new',autenticacion, rol('admin', 'physio'), (req, res) => {
    res.render('patient_add');
})

//Insertar pacientes
router.post('/', autenticacion, rol('admin', 'physio'), upload.upload.single('imagen'), async (req, res) => {
    let nuevoPaciente = new Patient({
        name: req.body.name,
        surname: req.body.surname,
        birthDate: new Date(req.body.birthDate),
        address: req.body.address,
        insuranceNumber: req.body.insuranceNumber
    });

    let nuevoLogin = new User({
        login: req.body.login,
        password: req.body.password,
        rol: 'patient'
    });

    if (req.file) {
        nuevoPaciente.imagen = req.file.filename;
    }

    try {
        console.log('Validando datos antes de guardar...');

        const erroresPaciente = nuevoPaciente.validateSync();
        const erroresUsuario = nuevoLogin.validateSync();

        if (erroresPaciente || erroresUsuario) {
            const allErrors = {
                ...erroresPaciente?.errors,
                ...erroresUsuario?.errors,
            };
            throw { errors: allErrors };
        }

        const pacienteExistente = await Patient.findOne({ insuranceNumber: req.body.insuranceNumber });
        if (pacienteExistente) {
            throw {
                errors: { insuranceNumber: { message: 'El número de seguro ya está registrado.' } }
            };
        }

        const loginExistente = await User.findOne({ login: req.body.login });
        if (loginExistente) {
            throw {
                errors: { login: { message: 'El login ya está en uso.' } }
            };
        }

        console.log('Datos validados correctamente.');

        const pacienteGuardado = await nuevoPaciente.save();
        console.log('Paciente creado:', pacienteGuardado);

        const usuarioGuardado = await nuevoLogin.save();
        console.log('Usuario creado:', usuarioGuardado);

        res.redirect('/patients');
    } catch (error) {
        console.error('Error durante la inserción del paciente o usuario:', error);

        let errores = {
            general: 'Error insertando datos'
        };

        if (error.errors) {
            if (error.errors.name) errores.name = error.errors.name.message;
            if (error.errors.surname) errores.surname = error.errors.surname.message;
            if (error.errors.birthDate) errores.birthDate = error.errors.birthDate.message;
            if (error.errors.address) errores.address = error.errors.address.message;
            if (error.errors.insuranceNumber) errores.insuranceNumber = error.errors.insuranceNumber.message;
            if (error.errors.imagen) errores.imagen = error.errors.imagen.message;
            if (error.errors.login) errores.login = error.errors.login.message;
            if (error.errors.password) errores.password = error.errors.password.message;
        }

        res.render('patient_add', { errores: errores, datos: req.body });
    }
});

//Renderizado edición de pacientes.
router.get('/:id/edit',autenticacion, rol('admin', 'physio'), async (req, res) => {
    try {
        console.log('ID recibido:', req.params.id);
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            console.error('Paciente no encontrado con ese ID');
            return res.status(404).send('Paciente no encontrado');
        }
        console.log('Paciente encontrado:', patient);
        res.render('patient_edit', { patient, errores: {} });
    } catch (error) {
        console.error('Error obteniendo el paciente:', error);
        res.status(500).send('Error interno del servidor');
    }
});

//Edición de pacientes
router.post('/:id', autenticacion, rol('admin', 'physio'), upload.upload.single('imagen'), (req, res) => {
    Patient.findById(req.params.id).then(resultado => {
        if (resultado) {
            resultado.name = req.body.name;
            resultado.surname = req.body.surname;
            resultado.birthDate = new Date(req.body.birthDate);
            resultado.address = req.body.address;
            resultado.insuranceNumber = req.body.insuranceNumber;

            if (req.file) {
                resultado.imagen = req.file.filename;
            }

            resultado.save().then(resultadoActualizado => {
                res.redirect(req.baseUrl);
            }).catch(error2 => {
                let errores = {
                    general: 'Error editando paciente'
                };

                if (error2.errors.name) {
                    errores.name = error2.errors.name.message;
                }
                if (error2.errors.surname) {
                    errores.surname = error2.errors.surname.message;
                }
                if (error2.errors.birthDate) {
                    errores.birthDate = error2.errors.birthDate.message;
                }
                if (error2.errors.address) {
                    errores.address = error2.errors.address.message;
                }
                if (error2.errors.insuranceNumber) {
                    errores.insuranceNumber = error2.errors.insuranceNumber.message;
                }

                res.render('patient_edit', {
                    errores: errores,
                    patient: {
                        _id: req.params.id,
                        name: req.body.name,
                        surname: req.body.surname,
                        birthDate: req.body.birthDate,
                        address: req.body.address,
                        insuranceNumber: req.body.insuranceNumber,
                        imagen: resultado.imagen
                    }
                });
            });
        } else {
            res.render('error', { error: 'Paciente no encontrado' });
        }
    }).catch(error => {
        res.render('error', { error: 'Error editando paciente' });
    });
});

//Renderizado de detalles de paciente
router.get('/:id',autenticacion, rol('admin', 'physio'), (req, res) => {
    Patient.findById(req.params.id).then(resultado => {
        if (resultado)
            res.render('patients_detail', { patient: resultado});
        else    
            res.render('error', {error: "Paciente no encontrado"});
    }).catch (error => {
    }); 
});


module.exports = router;
