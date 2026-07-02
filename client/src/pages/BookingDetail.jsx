import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function BookingDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(state?.booking || null);
  const [loading, setLoading] = useState(!state?.booking);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!booking) {
      api.get(`/bookings/${id}`)
        .then(({ data }) => setBooking(data.data))
        .catch(() => setError('Booking not found'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`);
      setBooking(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-4xl animate-spin">✈</div>;
  if (error) return <div className="max-w-xl mx-auto px-4 py-8 text-red-600">{error}</div>;
  if (!booking) return null;

  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {state?.fresh && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 text-center">
          <div className="text-3xl mb-1">✅</div>
          <div className="font-bold text-lg">Booking Confirmed!</div>
          <div className="text-sm text-green-600 mt-1">PNR: <span className="font-mono font-bold">{booking.bookingReference}</span></div>
        </div>
      )}

      <div className="card mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Booking Details</h2>
            <p className="text-sm text-gray-500 font-mono">{booking.bookingReference}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isConfirmed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {booking.status.toUpperCase()}
          </span>
        </div>

        {booking.flight && (
          <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
            <div className="flex justify-between">
              <span>Flight</span>
              <span className="font-medium">{booking.flight.flightNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Departure</span>
              <span className="font-medium">
                {new Date(booking.flight.departureTime).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="card mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Seats</h3>
        {booking.seats.map((seat) => (
          <div key={seat.seatNumber} className="flex justify-between text-sm text-gray-600 py-1 border-b last:border-0">
            <span>Seat {seat.seatNumber} · <span className="capitalize">{seat.class.replace('_', ' ')}</span></span>
            <span>₹{seat.price.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-gray-800 pt-3">
          <span>Total Paid</span>
          <span className="text-brand-500">₹{booking.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => navigate('/bookings')} className="flex-1 border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
          My Bookings
        </button>
        {isConfirmed && (
          <button onClick={handleCancel} disabled={cancelling} className="flex-1 bg-red-50 border border-red-200 text-red-600 font-semibold px-4 py-2.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
            {cancelling ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        )}
      </div>
    </div>
  );
}
