const mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
    login: {
        type: String,
        required: [true, 'Usuario obligatorio'],
        minlength: [4, 'Debe tener al menos 4 carácteres'],
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [7, 'Debe tener como mínimo 7 carácteres'],
    },
    rol: {
        type: String,
        enum: ['admin', 'physio', 'patient'], 
    },
});

let User = mongoose.model('users',userSchema);
module.exports = User;