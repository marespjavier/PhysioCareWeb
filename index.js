// Carga de librerias
const express = require('express');
const mongoose = require('mongoose');
const nunjucks = require('nunjucks');
const path = require('path'); 
const methodOverride = require('method-override');
const session = require('express-session');

//Enrutadores
const patients = require(__dirname + "/routes/patients");
const physios = require(__dirname + "/routes/physios");
const records = require(__dirname + "/routes/records");
const authRoutes = require(__dirname + "/routes/auth.js");
const User = require(__dirname + "/models/users");
const Patient = require(__dirname + "/models/patient");
const Physio = require(__dirname + "/models/physio");
const Record = require(__dirname + "/models/record");

//Conectar con la base de datos
mongoose.connect('mongodb://localhost:27017/physiocare');

//Inicializar express
let app = express();

//Confinguración de la sesión
app.use(session({
    secret: 'daw2025admin',
    resave: false,
    saveUninitialized: false,
    expires: new Date(Date.now() + (30 * 60 * 1000)),
    cookie: { secure: false } 
}));

// Configuración de Nunjucks
const env = nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Agregar un filtro personalizado al entorno de Nunjucks
env.addFilter('formatDate', (date) => {
    if (!date) return '';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(date).toLocaleDateString('es-ES', options); // Formato dd/mm/yyyy
});

// Motor de plantillas views/.njk
app.set('view engine', 'njk');

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware para procesar otras peticiones que no sean GET o POST
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      let method = req.body._method;
      delete req.body._method;
      return method;
    } 
}));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});
// Ruta principal (redirige al login si no hay sesión)
app.get('/', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/auth/login');
    }
    res.redirect('/menu');
});
app.get('/menu', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/auth/login');
    }
    res.render('menu');
});

app.use('/auth', authRoutes);
app.use('/patients', patients);
app.use('/physios', physios);
app.use('/records', records);

// Puerto utilizado 8080
const port = 8080;
app.listen(port, () => {
    console.log(`Servidor en funcionamiento en el puerto ${port}`);
});
