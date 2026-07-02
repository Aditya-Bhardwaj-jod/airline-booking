const Airport = require('../models/Airport');

const findAll = () => Airport.find().lean();
const findById = (id) => Airport.findById(id);
const findByCode = (code) => Airport.findOne({ code: code.toUpperCase() });
const create = (data) => Airport.create(data);
const update = (id, data) => Airport.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const remove = (id) => Airport.findByIdAndDelete(id);

module.exports = { findAll, findById, findByCode, create, update, remove };
