import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Home() {
  const navigate = useNavigate();
  const [airports, setAirports] = useState([]);
  const [form, setForm] = useState({
    source: '',
    destination: '',
    date: '',
    class: 'economy',
    passengers: 1,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/flights/airports').then(({ data }) => setAirports(data.data));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');
    if (!form.source || !form.destination || !form.date) {
      setError('Please fill all fields');
      return;
    }
    if (form.source === form.destination) {
      setError('Source and destination cannot be the same');
      return;
    }
    const params = new URLSearchParams(form).toString();
    navigate(`/flights?${params}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Find Your Next Flight</h1>
          <p className="text-blue-200 text-lg">
            Search, select seats, and book — powered by Redis seat locking & rate limiting.
          </p>
        </div>
      </div>

      {/* Search card */}
      <div className="max-w-3xl mx-auto px-4 -mt-10">
        <div className="card shadow-lg">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select
                  className="input"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                >
                  <option value="">Select origin</option>
                  {airports.map((a) => (
                    <option key={a._id} value={a.code}>
                      {a.city} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select
                  className="input"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                >
                  <option value="">Select destination</option>
                  {airports.map((a) => (
                    <option key={a._id} value={a.code}>
                      {a.city} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="input"
                  min={today}
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  className="input"
                  value={form.class}
                  onChange={(e) => setForm({ ...form, class: e.target.value })}
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={9}
                  value={form.passengers}
                  onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button type="submit" className="btn-primary w-full">
              🔍 Search Flights
            </button>
          </form>
        </div>
      </div>

      {/* Feature callouts */}
      <div className="max-w-3xl mx-auto px-4 mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        {[
          { icon: '🔒', title: 'Redis Seat Lock', desc: '5-min temporary hold prevents double booking' },
          { icon: '⚡', title: 'Rate Limiter', desc: 'Custom Sliding Window algorithm on Redis Sorted Sets' },
          { icon: '🏗️', title: 'Clean Architecture', desc: 'Routes → Controller → Service → Repository' },
        ].map((f) => (
          <div key={f.title} className="card text-center">
            <div className="text-3xl mb-2">{f.icon}</div>
            <div className="font-semibold text-gray-800">{f.title}</div>
            <div className="text-sm text-gray-500 mt-1">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
