// Middlewares de autenticación y autorización

function autenticacion(req, res, next) {
    if (req.session && req.session.usuario) {
        return next(); 
    }

    res.redirect('/auth/login');
}

function rol(...rolesPermitidos) {
    return (req, res, next) => {
        if (rolesPermitidos.includes(req.session.rol)) {
            return next(); 
        }

        return res.status(403).render('error', { error: 'Acceso denegado: no tienes los permisos necesarios.' });
    };
}

module.exports = { autenticacion, rol };
