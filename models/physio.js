const mongoose = require('mongoose');

let physioSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: [2, 'Debe de tener como mínimo 2 carácteres'],
        maxlength: [50, 'Debe de tener como máximo 50 carácteres'],
        required: [true, 'El nombre es obligatorio']
    },
    surname: {
        type: String,
        minlength: [2, 'Debe de tener como mínimo 2 carácteres'],
        maxlength: [50, 'Debe de tener como máximo 50 carácteres'],
        required: [true, 'El apellido es obligatorio']
    },
    speciality: {
        type: String,
        required: [true, 'La especialidad es obligatoria'],
        enum: {
            values: ['Sports', 'Neurological', 'Pediatric', 'Geriatric', 'Oncological'],
            message: 'La especialidad introducida no es válida'
        }
      },
    licenseNumber: {
        type: String,
        unique: true,
        required: [true, 'Número de licencia obligatorio'],
        match: [/^[a-zA-Z0-9]{8}$/,'Debe contener 8 digitos o números'],
        minlength: [8, 'Debe de tener 8 carácteres'],
        maxlength: [8, 'Debe de tener 8 carácteres'],
    },
    imagen: {
        type: String,
        required : false
      }

})

let Physio = mongoose.model('physios', physioSchema);
module.exports = Physio;