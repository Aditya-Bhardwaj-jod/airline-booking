import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FlightResults from './pages/FlightResults';
import SeatSelection from './pages/SeatSelection';
import BookingConfirm from './pages/BookingConfirm';
import BookingDetail from './pages/BookingDetail';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/flights" element={<FlightResults />} />
            <Route path="/flights/:id/seats" element={<SeatSelection />} />

            {/* Auth required */}
            <Route path="/bookings/confirm" element={
              <ProtectedRoute><BookingConfirm /></ProtectedRoute>
            } />
            <Route path="/bookings/:id" element={
              <ProtectedRoute><BookingDetail /></ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute><MyBookings /></ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
            } />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
