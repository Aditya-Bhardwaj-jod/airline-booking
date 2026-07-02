import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-brand-500">
          ✈ SkyBook
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                Hi, <span className="font-medium">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="ml-1 text-xs bg-brand-500 text-white px-1.5 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </span>
              <Link to="/bookings" className="text-sm text-gray-700 hover:text-brand-500 transition-colors">
                My Bookings
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-sm text-gray-700 hover:text-brand-500">
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-700 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700 hover:text-brand-500">
                Login
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
