import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

const getDuration = (dep, arr) => {
  const diff = (new Date(arr) - new Date(dep)) / 60000;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

export default function FlightResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const seatClass = params.get('class') || 'economy';

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/flights/search?${params.toString()}`);
        setFlights(data.data);
      } catch (err) {
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch flights');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFlights();
  }, [params]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin text-4xl">✈</div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {params.get('source')} → {params.get('destination')}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {formatDate(params.get('date'))} · {params.get('passengers')} passenger(s) ·{' '}
          <span className="capitalize">{seatClass.replace('_', ' ')}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {!error && flights.length === 0 && (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">✈️</div>
          <p className="text-lg font-medium">No flights found for this route and date.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            Search Again
          </button>
        </div>
      )}

      <div className="space-y-4">
        {flights.map((flight) => {
          const seatsLeft = flight.seats.filter(
            (s) => s.class === seatClass && !s.isBooked
          ).length;

          return (
            <div
              key={flight._id}
              className="card hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              {/* Airline */}
              <div className="flex items-center gap-3 min-w-[140px]">
                <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {flight.airline.code}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{flight.airline.name}</div>
                  <div className="text-xs text-gray-400">{flight.flightNumber}</div>
                </div>
              </div>

              {/* Times */}
              <div className="flex items-center gap-6 flex-1 justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold">{formatTime(flight.departureTime)}</div>
                  <div className="text-xs text-gray-400">{flight.source.code}</div>
                </div>
                <div className="text-center text-gray-400 text-xs">
                  <div>──────</div>
                  <div>{getDuration(flight.departureTime, flight.arrivalTime)}</div>
                  <div>──────</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold">{formatTime(flight.arrivalTime)}</div>
                  <div className="text-xs text-gray-400">{flight.destination.code}</div>
                </div>
              </div>

              {/* Price + CTA */}
              <div className="text-center min-w-[130px]">
                <div className="text-2xl font-bold text-brand-500">
                  ₹{flight.price[seatClass]?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400 mb-2">{seatsLeft} seats left</div>
                <button
                  onClick={() =>
                    navigate(`/flights/${flight._id}/seats`, {
                      state: { flight, seatClass, passengers: params.get('passengers') },
                    })
                  }
                  className="btn-primary text-sm w-full"
                >
                  Select Seats
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
