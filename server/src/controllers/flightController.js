const flightService = require('../services/flightService');
const { asyncHandler } = require('../middlewares/errorHandler');

// Public
const searchFlights = asyncHandler(async (req, res) => {
  const flights = await flightService.searchFlights(req.query);
  res.json({ success: true, count: flights.length, data: flights });
});

const getSeatMap = asyncHandler(async (req, res) => {
  const result = await flightService.getSeatMap(req.params.id);
  res.json({ success: true, data: result });
});

const getFlightById = asyncHandler(async (req, res) => {
  const flight = await flightService.getFlightById(req.params.id);
  res.json({ success: true, data: flight });
});

const getAllAirports = asyncHandler(async (req, res) => {
  const airports = await flightService.getAllAirports();
  res.json({ success: true, data: airports });
});

// Admin
const getAllFlights = asyncHandler(async (req, res) => {
  const flights = await flightService.getAllFlights();
  res.json({ success: true, data: flights });
});

const createFlight = asyncHandler(async (req, res) => {
  const flight = await flightService.createFlight(req.body);
  res.status(201).json({ success: true, data: flight });
});

const updateFlight = asyncHandler(async (req, res) => {
  const flight = await flightService.updateFlight(req.params.id, req.body);
  res.json({ success: true, data: flight });
});

const deleteFlight = asyncHandler(async (req, res) => {
  await flightService.deleteFlight(req.params.id);
  res.json({ success: true, message: 'Flight deleted' });
});

module.exports = {
  searchFlights, getSeatMap, getFlightById, getAllAirports,
  getAllFlights, createFlight, updateFlight, deleteFlight,
};
