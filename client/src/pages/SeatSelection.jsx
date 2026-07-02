import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  available: 'bg-gray-100 hover:bg-brand-500 hover:text-white cursor-pointer border border-gray-300',
  locked: 'bg-yellow-100 border border-yellow-300 cursor-not-allowed text-yellow-700',
  booked: 'bg-red-100 border border-red-300 cursor-not-allowed text-red-400',
  selected: 'bg-brand-500 text-white border border-brand-600 cursor-pointer',
};

const STATUS_LEGEND = [
  { status: 'available', label: 'Available' },
  { status: 'locked', label: 'Temporarily Reserved' },
  { status: 'booked', label: 'Booked' },
  { status: 'selected', label: 'Your Selection' },
];

export default function SeatSelection() {
  const { id: flightId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [seatMap, setSeatMap] = useState([]);
  const [flight, setFlight] = useState(state?.flight || null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState('');

  const seatClass = state?.seatClass || 'economy';
  const passengers = parseInt(state?.passengers || 1);

  useEffect(() => {
    const fetchSeatMap = async () => {
      try {
        const { data } = await api.get(`/flights/${flightId}/seats`);
        setSeatMap(data.data.seatMap);
        if (!flight) setFlight(data.data.flight);
      } catch {
        setError('Failed to load seat map');
      } finally {
        setLoading(false);
      }
    };
    fetchSeatMap();
    // Refresh seat map every 30s to show updated lock status
    const interval = setInterval(fetchSeatMap, 30000);
    return () => clearInterval(interval);
  }, [flightId]);

  const toggleSeat = (seat) => {
    if (seat.status === 'booked' || seat.status === 'locked') return;
    if (seat.class !== seatClass) return;

    setSelectedSeats((prev) => {
      const isSelected = prev.find((s) => s.seatNumber === seat.seatNumber);
      if (isSelected) return prev.filter((s) => s.seatNumber !== seat.seatNumber);
      if (prev.length >= passengers) {
        setError(`You can only select ${passengers} seat(s)`);
        return prev;
      }
      setError('');
      return [...prev, seat];
    });
  };

  const handleLockAndBook = async () => {
    if (!user) { navigate('/login'); return; }
    if (selectedSeats.length !== passengers) {
      setError(`Please select exactly ${passengers} seat(s)`);
      return;
    }

    setLocking(true);
    setError('');
    try {
      // Lock all selected seats
      for (const seat of selectedSeats) {
        await api.post('/bookings/lock-seat', {
          flightId,
          seatNumber: seat.seatNumber,
        });
      }
      // Navigate to confirmation
      navigate(`/bookings/confirm`, {
        state: { flightId, flight, selectedSeats, seatClass },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to lock seat. Please try again.');
      // Refresh seat map to show updated status
      const { data } = await api.get(`/flights/${flightId}/seats`);
      setSeatMap(data.data.seatMap);
    } finally {
      setLocking(false);
    }
  };

  // Group seats by row for grid display
  const rows = seatMap
    .filter((s) => s.class === seatClass)
    .reduce((acc, seat) => {
      const row = seat.seatNumber.replace(/[A-Z]/g, '');
      if (!acc[row]) acc[row] = [];
      acc[row].push(seat);
      return acc;
    }, {});

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-4xl animate-spin">✈</div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-1">Select Your Seat</h2>
      {flight && (
        <p className="text-gray-500 text-sm mb-6">
          {flight.flightNumber} · {flight.source?.code || ''} → {flight.destination?.code || ''} ·{' '}
          <span className="capitalize">{seatClass.replace('_', ' ')}</span> ·{' '}
          ₹{flight.price?.[seatClass]?.toLocaleString()} per seat
        </p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {STATUS_LEGEND.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-xs ${STATUS_STYLES[status]}`}>
              A
            </div>
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Seat grid */}
      <div className="card mb-6">
        <div className="text-center text-sm text-gray-400 mb-4 border-b pb-3">
          ✈ FRONT OF AIRCRAFT
        </div>
        <div className="space-y-2">
          {Object.entries(rows).map(([row, seats]) => (
            <div key={row} className="flex items-center gap-2 justify-center">
              <span className="w-6 text-xs text-gray-400 text-right">{row}</span>
              <div className="flex gap-1.5">
                {seats.slice(0, 3).map((seat) => {
                  const isSelected = selectedSeats.find((s) => s.seatNumber === seat.seatNumber);
                  const displayStatus = isSelected ? 'selected' : seat.status;
                  return (
                    <button
                      key={seat.seatNumber}
                      onClick={() => toggleSeat(seat)}
                      className={`w-9 h-9 rounded text-xs font-medium transition-all ${STATUS_STYLES[displayStatus]}`}
                      title={`${seat.seatNumber} — ${displayStatus}`}
                    >
                      {seat.seatNumber.replace(row, '')}
                    </button>
                  );
                })}
              </div>
              <div className="w-6" /> {/* aisle */}
              <div className="flex gap-1.5">
                {seats.slice(3).map((seat) => {
                  const isSelected = selectedSeats.find((s) => s.seatNumber === seat.seatNumber);
                  const displayStatus = isSelected ? 'selected' : seat.status;
                  return (
                    <button
                      key={seat.seatNumber}
                      onClick={() => toggleSeat(seat)}
                      className={`w-9 h-9 rounded text-xs font-medium transition-all ${STATUS_STYLES[displayStatus]}`}
                      title={`${seat.seatNumber} — ${displayStatus}`}
                    >
                      {seat.seatNumber.replace(row, '')}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedSeats.length > 0 && (
        <div className="card mb-4 bg-brand-500 text-white">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">Selected: {selectedSeats.map((s) => s.seatNumber).join(', ')}</div>
              <div className="text-blue-200 text-sm">
                {selectedSeats.length} seat(s) · ₹{(flight?.price?.[seatClass] * selectedSeats.length).toLocaleString()} total
              </div>
            </div>
            <div className="text-sm text-blue-200">⏱ Lock valid 5 min</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleLockAndBook}
        disabled={selectedSeats.length !== passengers || locking}
        className="btn-primary w-full"
      >
        {locking ? 'Locking seats...' : `Lock & Proceed to Booking (${selectedSeats.length}/${passengers})`}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">
        Seats are temporarily reserved for 5 minutes while you complete booking.
      </p>
    </div>
  );
}
