import { useEffect, useState } from 'react';
import api from '../lib/api';

const TABS = ['Flights', 'Bookings'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Flights');
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [fRes, bRes] = await Promise.all([
          api.get('/flights'),
          api.get('/bookings/my'), // admin sees all via service layer
        ]);
        setFlights(fRes.data.data);
        setBookings(bRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleDeleteFlight = async (id) => {
    if (!window.confirm('Delete this flight?')) return;
    try {
      await api.delete(`/flights/${id}`);
      setFlights((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-4xl animate-spin">✈</div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Flights', value: flights.length, icon: '✈' },
          { label: 'Total Bookings', value: bookings.length, icon: '🎟️' },
          {
            label: 'Confirmed',
            value: bookings.filter((b) => b.status === 'confirmed').length,
            icon: '✅',
          },
        ].map((stat) => (
          <div key={stat.label} className="card text-center">
            <div className="text-3xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-brand-500">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
              tab === t
                ? 'bg-brand-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Flights Tab */}
      {tab === 'Flights' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pr-4">Flight</th>
                <th className="pb-3 pr-4">Route</th>
                <th className="pb-3 pr-4">Departure</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Economy</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flights.map((f) => (
                <tr key={f._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium">{f.flightNumber}</td>
                  <td className="py-3 pr-4 text-gray-500">
                    {f.source?.code} → {f.destination?.code}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">
                    {new Date(f.departureTime).toLocaleString([], {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        f.status === 'scheduled'
                          ? 'bg-green-100 text-green-700'
                          : f.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">₹{f.price?.economy?.toLocaleString()}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDeleteFlight(f._id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flights.length === 0 && (
            <p className="text-center text-gray-400 py-8">No flights found.</p>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {tab === 'Bookings' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pr-4">PNR</th>
                <th className="pb-3 pr-4">Flight</th>
                <th className="pb-3 pr-4">Seats</th>
                <th className="pb-3 pr-4">Amount</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-mono font-medium text-xs">
                    {b.bookingReference}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">
                    {b.flight?.flightNumber || '—'}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">
                    {b.seats?.map((s) => s.seatNumber).join(', ')}
                  </td>
                  <td className="py-3 pr-4 font-medium text-brand-500">
                    ₹{b.totalAmount?.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        b.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {b.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="text-center text-gray-400 py-8">No bookings found.</p>
          )}
        </div>
      )}
    </div>
  );
}
