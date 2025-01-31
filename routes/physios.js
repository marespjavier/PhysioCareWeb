const express = require('express');
const { autenticacion, rol } = require('../middlewares/auth');

const upload = require(__dirname + '/../utils/uploads.js');
const Physio = require('../models/physio');
const User = require('../models/users');
let router = express.Router();

// Listado general
router.get('/', autenticacion, rol('admin'), async (req, res) => {
    try {
        const physios = await Physio.find();
        res.render('physios_list', { physios });
    } catch (error) {
        res.render('error', { error: 'Error obteniendo la lista de fisios.' });
    }
})

// Búsqueda de fisios por especialidad
router.get('/find', autenticacion, rol('admin'), async (req, res) => {
    console.log('Dentro del controlador de /find para fisios');
    try {
        const { speciality } = req.query; 
        const filter = speciality ? { speciality: { $regex: speciality, $options: 'i' } } : {};
        console.log('Filtro generado:', filter);

        const physios = await Physio.find(filter); 
        console.log('Resultados encontrados:', physios);

        if (physios.length > 0) {
            res.render('physios_list', { physios }); 
        } else {
            res.render('error', { error: 'No se encontraron fisios asociados a la especialidad ingresada.' });
        }
    } catch (error) {
        console.error('Error durante la búsqueda de fisios:', error);
        res.render('error', { error: 'Hubo un problema al procesar la búsqueda. Inténtelo más tarde.' });
    }
});

//Renderizado insercción de fisios
router.get('/new', autenticacion, rol('admin'), (req, res) => {
    res.render('physio_add');
})

//Insertar fisios
router.post('/', autenticacion, rol('admin'), upload.upload.single('imagen'), async (req, res) => {
    let nuevoFisio = new Physio({
        name: req.body.name,
        surname: req.body.surname,
        speciality: req.body.speciality,
        licenseNumber: req.body.licenseNumber
    });

    let nuevoLogin = new User({
        login: req.body.login,
        password: req.body.password,
        rol : 'physio'
    });

    if (req.file) {
        nuevoFisio.imagen = req.file.filename;
    }

    try {
        console.log('Validando datos antes de guardar...');

        const erroresFisio = nuevoFisio.validateSync();
        const erroresUsuario = nuevoLogin.validateSync();

        if (erroresFisio || erroresUsuario) {
            const allErrors = {
                ...erroresFisio?.errors,
                ...erroresUsuario?.errors,
            };
            throw { errors: allErrors };
        }

        const fisioExistente = await Physio.findOne({ licenseNumber: req.body.licenseNumber });
        if (fisioExistente) {
            throw {
                errors: { licenseNumber: { message: 'El número de licencia ya está registrado.' } }
            };
        }
        const loginExistente = await User.findOne({ login: req.body.login });
        if (loginExistente) {
            throw {
                errors: { login: { message: 'El login ya está en uso.' } }
            };
        }

        console.log('Datos validados correctamente.');

        const fisioGuardado = await nuevoFisio.save();
        console.log('Fisio creado:', fisioGuardado);
        const usuarioGuardado = await nuevoLogin.save();
        console.log('Usuario creado:', usuarioGuardado);

        res.redirect('/physios');
    } catch (error) {
        console.error('Error durante la inserción del fisio o usuario:', error);

        let errores = {
            general: 'Error insertando datos'
        };

        // Manejar errores de validación
        if (error.errors) {
            if (error.errors.name) errores.name = error.errors.name.message;
            if (error.errors.surname) errores.surname = error.errors.surname.message;
            if (error.errors.speciality) errores.speciality = error.errors.speciality.message;
            if (error.errors.licenseNumber) errores.licenseNumber = error.errors.licenseNumber.message;
            if (error.errors.imagen) errores.imagen = error.errors.imagen.message;
            if (error.errors.login) errores.login = error.errors.login.message;
            if (error.errors.password) errores.password = error.errors.password.message;
        }

        // Renderizar la vista del formulario con los errores y datos enviados
        res.render('physio_add', { errores: errores, datos: req.body });
    }
});

//Renderizado edición de fisios.
router.get('/:id/edit', autenticacion, rol('admin'), async (req, res) => {
    try {
        console.log('ID recibido:', req.params.id); 
        const physio = await Physio.findById(req.params.id); 
        if (!physio) {
            console.error('Fisio no encontrado con ese ID');
            return res.status(404).send('Fisio no encontrado');
        }
        console.log('Fisio encontrado:', physio); 
        res.render('physio_edit', { physio, errores: {} }); 
    } catch (error) {
        console.error('Error obteniendo el fisio:', error);
        res.status(500).send('Error interno del servidor');
    }
});

//Edición de fisios
router.post('/:id', autenticacion, rol('admin'), upload.upload.single('imagen'), (req, res) => {
    Physio.findById(req.params.id).then(resultado => {
        if (resultado) {
            resultado.name = req.body.name;
            resultado.surname = req.body.surname;
            resultado.speciality = req.body.speciality;
            resultado.licenseNumber = req.body.licenseNumber;

            if (req.file) {
                resultado.imagen = req.file.filename;
            }

            resultado.save().then(resultadoActualizado => {
                res.redirect(req.baseUrl);
            }).catch(error2 => {
                let errores = {
                    general: 'Error editando fisio'
                };

                if (error2.errors.name) {
                    errores.name = error2.errors.name.message;
                }
                if (error2.errors.surname) {
                    errores.surname = error2.errors.surname.message;
                }
                if (error2.errors.speciality) {
                    errores.speciality = error2.errors.speciality.message;
                }
                if (error2.errors.licenseNumber) {
                    errores.licenseNumber = error2.errors.licenseNumber.message;
                }

                res.render('physio_edit', {
                    errores: errores,
                    physio: {
                        _id: req.params.id,
                        name: req.body.name,
                        surname: req.body.surname,
                        speciality: req.body.speciality,
                        licenseNumber: req.body.licenseNumber,
                        imagen: resultado.imagen
                    }
                });
            });
        } else {
            res.render('error', { error: 'Fisio no encontrado' });
        }
    }).catch(error => {
        res.render('error', { error: 'Error editando fisio' });
    });
});

//Renderizado de detalles del fisio
router.get('/:id', autenticacion, rol('admin'), (req, res) => {
    Physio.findById(req.params.id).then(resultado => {
        if (resultado)
            res.render('physios_detail', { physio: resultado});
        else    
            res.render('error', {error: "Fisio no encontrado"});
    }).catch (error => {
    }); 
});


module.exports = router;
