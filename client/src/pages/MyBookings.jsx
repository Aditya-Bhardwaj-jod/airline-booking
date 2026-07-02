import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookings/my')
      .then(({ data }) => setBookings(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64 text-4xl animate-spin">✈</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">My Bookings</h2>

      {bookings.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🎟️</div>
          <p className="text-lg">No bookings yet.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            Search Flights
          </button>
        </div>
      )}

      <div className="space-y-4">
        {bookings.map((b) => (
          <div
            key={b._id}
            className="card hover:shadow-md transition-shadow cursor-pointer flex justify-between items-center"
            onClick={() => navigate(`/bookings/${b._id}`)}
          >
            <div>
              <div className="font-semibold text-gray-800 font-mono">{b.bookingReference || 'N/A'}</div>
              {b.flight && (
                <div className="text-sm text-gray-500 mt-1">
                  {b.flight.flightNumber} ·{' '}
                  {new Date(b.flight.departureTime).toLocaleDateString([], {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </div>
              )}
              <div className="text-sm text-gray-400 mt-0.5">
                {b.seats?.length} seat(s) · ₹{b.totalAmount?.toLocaleString()}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {b.status?.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
