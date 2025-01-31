const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'La fecha es obligatoria'],
  },
  physio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'physios',
    required: [true, 'El fisio es obligatorio'],
  },
  diagnosis: {
    type: String,
    required: [true, 'El diagnóstico es obligatorio'],
    minlength: [10, 'Debe de tener como mínimo 10 carácteres'],
    maxlength: [500, 'Debe de tener como máximo 500 carácteres'],
  },
  treatment: {
    type: String,
    required: [true, 'El tratamiento es obligatorio'],
  },
  observations: {
    type: String,
    maxlength: [500, 'Debe de tener como máximo 500 carácteres'],
  }
});

const recordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'patients',
    required: [true, 'El paciente es obligatorio'],
  },
  medicalRecord: {
    type: String,
    maxlength: [1000, 'Debe de tener como máximo 500 carácteres'],
  },
  appointments: [appointmentSchema]
});


let Record = mongoose.model('records', recordSchema);
module.exports = Record;