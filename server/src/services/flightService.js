const flightRepository = require('../repositories/flightRepository');
const airportRepository = require('../repositories/airportRepository');
const redisClient = require('../config/redisClient');
const { get, set, del, delByPattern, buildKey } = require('../redis/cache');
const { AppError } = require('../middlewares/errorHandler');

const SEARCH_CACHE_TTL = 300; // 5 minutes
const AIRPORTS_CACHE_TTL = 3600; // 1 hour — airports change very rarely

/**
 * Search flow:
 * 1. Resolve IATA codes (e.g "DEL") → MongoDB ObjectIds (we store refs by ObjectId)
 * 2. Check Redis cache for this exact search query
 * 3. Cache hit  → return cached result immediately
 * 4. Cache miss → query MongoDB, store result in Redis, return
 *
 * Why cache flight search and not every query?
 * "DEL→BOM on June 15" is an extremely common repeated query (hundreds of
 * users searching the same route). Without cache, every search does a full
 * MongoDB query + two .populate() joins. With cache, the first user pays
 * the DB cost and everyone else for the next 5 minutes gets it from Redis
 * in ~1ms instead of ~50ms.
 */
const searchFlights = async ({ source, destination, date, class: seatClass, passengers }) => {
  const [srcAirport, destAirport] = await Promise.all([
    airportRepository.findByCode(source),
    airportRepository.findByCode(destination),
  ]);

  if (!srcAirport) throw new AppError(`Airport not found: ${source}`, 404);
  if (!destAirport) throw new AppError(`Airport not found: ${destination}`, 404);
  if (srcAirport._id.equals(destAirport._id))
    throw new AppError('Source and destination cannot be the same', 400);

  const cacheKey = buildKey('flights', 'search', `${source}-${destination}-${date}-${seatClass}`);
  const cached = await get(cacheKey);
  if (cached) return cached;

  const flights = await flightRepository.searchFlights(srcAirport._id, destAirport._id, date);

  // Filter by class availability and passenger count
  const available = flights.filter((f) => {
    const freeSeats = f.seats.filter((s) => s.class === seatClass && !s.isBooked);
    return freeSeats.length >= passengers;
  });

  await set(cacheKey, available, SEARCH_CACHE_TTL);
  return available;
};

/**
 * Seat map: return all seats for a flight WITH their live Redis lock status.
 * MongoDB `isBooked` = permanently sold.
 * Redis key existence = temporarily held by another user mid-checkout.
 * Frontend renders three states: Available / Temporarily Reserved / Booked.
 */
const getSeatMap = async (flightId) => {
  const flight = await flightRepository.findById(flightId);
  if (!flight) throw new AppError('Flight not found', 404);

  // Check Redis locks for all seats in ONE pipeline (one round-trip, not N)
  const pipeline = redisClient.pipeline();
  flight.seats.forEach((seat) => {
    pipeline.exists(`seat:lock:${flightId}:${seat.seatNumber}`);
  });
  const lockResults = await pipeline.exec();

  const seatMap = flight.seats.map((seat, i) => ({
    seatNumber: seat.seatNumber,
    class: seat.class,
    status: seat.isBooked
      ? 'booked'
      : lockResults[i][1] === 1
      ? 'locked'
      : 'available',
  }));

  return { flight, seatMap };
};

const getFlightById = async (id) => {
  const flight = await flightRepository.findById(id);
  if (!flight) throw new AppError('Flight not found', 404);
  return flight;
};

// ---- Admin operations ----

const getAllFlights = () => flightRepository.findAll();

const createFlight = (data) => flightRepository.create(data);

const updateFlight = async (id, data) => {
  const flight = await flightRepository.update(id, data);
  if (!flight) throw new AppError('Flight not found', 404);
  // Invalidate all search cache entries — flight data has changed
  await delByPattern('flights:search:*');
  return flight;
};

const deleteFlight = async (id) => {
  const flight = await flightRepository.remove(id);
  if (!flight) throw new AppError('Flight not found', 404);
  await delByPattern('flights:search:*');
};

const getAllAirports = async () => {
  const cacheKey = buildKey('airports', 'all');
  const cached = await get(cacheKey);
  if (cached) return cached;

  const Airport = require('../models/Airport');
  const airports = await Airport.find().lean();
  await set(cacheKey, airports, AIRPORTS_CACHE_TTL);
  return airports;
};

module.exports = {
  searchFlights,
  getSeatMap,
  getFlightById,
  getAllFlights,
  createFlight,
  updateFlight,
  deleteFlight,
  getAllAirports,
};
