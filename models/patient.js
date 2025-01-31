const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    minlength: [2, 'Debe de tener como mínimo 2 carácteres'],
    maxlength: [50, 'Debe de tener como máximo 50 carácteres'],
  },
  surname: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    minlength: [2, 'Debe de tener como mínimo 2 carácteres'],
    maxlength: [50, 'Debe de tener como máximo 50 carácteres'],
  },
  birthDate: {
    type: Date,
    required: [true, 'La fecha es obligatoria'],  
  },
  address: {
    type: String,
    maxlength: [100, 'Debe de tener como máximo 100 carácteres'],
  },
  insuranceNumber: {
    type: String,
    required: [true, 'Insurance Number es obligatorio'],
    unique:true,
    match: [/^[a-zA-Z0-9]{9}$/, 'Debe contener 9 digitos o números']                                        
  },
  imagen: {
    type: String,
    required : false
  }
});

let Patient = mongoose.model('patients', patientSchema);
module.exports = Patient;