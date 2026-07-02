import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function BookingConfirm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!state?.flightId) {
    navigate('/');
    return null;
  }

  const { flightId, flight, selectedSeats, seatClass } = state;
  const pricePerSeat = flight?.price?.[seatClass] || 0;
  const total = pricePerSeat * selectedSeats.length;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', {
        flightId,
        seats: selectedSeats.map((s) => ({ seatNumber: s.seatNumber, class: seatClass })),
      });
      navigate(`/bookings/${data.data._id}`, { state: { booking: data.data, fresh: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Your seat lock may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Confirm Booking</h2>

      <div className="card mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Flight Details</h3>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Flight</span>
          <span className="font-medium">{flight?.flightNumber}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Route</span>
          <span className="font-medium">
            {flight?.source?.code} → {flight?.destination?.code}
          </span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Departure</span>
          <span className="font-medium">{formatTime(flight?.departureTime)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Class</span>
          <span className="font-medium capitalize">{seatClass.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Seat Summary</h3>
        {selectedSeats.map((seat) => (
          <div key={seat.seatNumber} className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Seat {seat.seatNumber}</span>
            <span>₹{pricePerSeat.toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t mt-3 pt-3 flex justify-between font-bold text-gray-800">
          <span>Total</span>
          <span className="text-brand-500">₹{total.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
        ⏱ Your seats are locked for 5 minutes. Complete booking before the lock expires.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <button onClick={handleConfirm} disabled={loading} className="btn-primary w-full">
        {loading ? 'Confirming...' : `Confirm & Pay ₹${total.toLocaleString()}`}
      </button>
    </div>
  );
}
