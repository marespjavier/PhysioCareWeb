const express = require('express');
let router = express.Router();

const User = require('../models/users');

// Renderizado del formulario de login
router.get('/login', (req, res) => {
    res.render('login', { errores: {} });
});

// Procesar el formulario de login
router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await User.findOne({ login });
        if (!user || user.password !== password) {
            return res.render('login', { error: 'Credenciales inválidas.' });
        }

        req.session.userId = user._id.toString(); 
        req.session.usuario = user.login;
        req.session.rol = user.rol;

        console.log('Usuario autenticado:', req.session); 
        res.redirect('/patients'); 
    } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        res.render('error', { error: 'Error durante el inicio de sesión.' });
    }
});

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error cerrando la sesión:', err);
            return res.status(500).render('error', { error: 'No se pudo cerrar la sesión' });
        }
        res.redirect('/auth/login'); // Redirigir al formulario de login
    });
});



module.exports = router;