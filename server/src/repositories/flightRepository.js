const Flight = require('../models/Flight');

/**
 * Search flights by source, destination, and date.
 * We query departureTime within the given calendar day (UTC midnight to midnight).
 * Populate airline/airport refs so frontend gets names, not just ObjectIds.
 */
const searchFlights = (sourceId, destinationId, date) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);

  return Flight.find({
    source: sourceId,
    destination: destinationId,
    departureTime: { $gte: start, $lte: end },
    status: 'scheduled',
  })
    .populate('airline', 'code name logoUrl')
    .populate('source', 'code city name')
    .populate('destination', 'code city name')
    .lean(); // .lean() returns plain JS objects, not Mongoose docs → faster, less memory
};

const findById = (id) =>
  Flight.findById(id)
    .populate('airline', 'code name logoUrl')
    .populate('source', 'code city name')
    .populate('destination', 'code city name');

const create = (data) => Flight.create(data);

const update = (id, data) =>
  Flight.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const remove = (id) => Flight.findByIdAndDelete(id);

const findAll = () =>
  Flight.find()
    .populate('airline', 'code name')
    .populate('source', 'code city')
    .populate('destination', 'code city')
    .lean();

module.exports = { searchFlights, findById, create, update, remove, findAll };
