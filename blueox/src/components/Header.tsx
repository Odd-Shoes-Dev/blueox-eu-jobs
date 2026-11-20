import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SiteHeader from './SiteHeader';

const Header: React.FC = () => {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const { user, client, signOut, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (path: string) =>
    `font-space font-medium ${isActive(path) ? 'text-coral' : 'text-navy hover:text-coral'} transition`;

  return (
    <SiteHeader
      homeTo="/"
      brand={
        <>
          <img src="/logo1.png" alt="Blue OX" className="h-10" />
          <span className="hidden sm:block text-sm font-medium text-navy max-w-[200px] leading-tight">
            Guaranteed Job in Europe in 90 Days Or We Work for Free
          </span>
        </>
      }
      desktopNav={
        <>
          <Link to="/" className={navLinkClass('/')}>Home</Link>
          <Link to="/about" className={navLinkClass('/about')}>Why Blue OX</Link>
          <Link to="/jobs" className={navLinkClass('/jobs')}>Jobs</Link>

          <div className="relative">
            <button
              onClick={() => setIsApplyOpen(!isApplyOpen)}
              className="flex items-center font-space font-medium text-navy hover:text-coral transition"
            >
              Apply <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {isApplyOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                <Link
                  to="/apply/student"
                  onClick={() => setIsApplyOpen(false)}
                  className="block px-4 py-2 text-navy hover:bg-gray-50 hover:text-coral"
                >
                  Student Portal
                </Link>
                <Link
                  to="/apply/workforce"
                  onClick={() => setIsApplyOpen(false)}
                  className="block px-4 py-2 text-navy hover:bg-gray-50 hover:text-coral"
                >
                  Workforce Portal
                </Link>
              </div>
            )}
          </div>

          <Link to="/contact" className={navLinkClass('/contact')}>Contact</Link>

          <Link
            to="/partner-portal/signup"
            className="font-space font-medium text-sm text-gray-500 hover:text-coral transition"
          >
            For Recruitment Agencies
          </Link>

          {user ? (
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link to="/admin" className="font-space font-medium text-coral hover:text-coral-dark transition">
                  Admin
                </Link>
              )}
              <span className="text-sm text-gray-600">{client?.full_name}</span>
              <button onClick={signOut} className="text-sm text-gray-500 hover:text-coral">
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-coral text-white px-6 py-2 rounded-lg font-space font-medium hover:bg-coral-dark transition"
            >
              Sign In
            </Link>
          )}
        </>
      }
      mobileNav={
        <>
          <Link to="/" className="font-space text-navy hover:text-coral">Home</Link>
          <Link to="/about" className="font-space text-navy hover:text-coral">Why Blue OX</Link>
          <Link to="/jobs" className="font-space text-navy hover:text-coral">Jobs</Link>
          <Link to="/apply/student" className="font-space text-navy hover:text-coral">Student Portal</Link>
          <Link to="/apply/workforce" className="font-space text-navy hover:text-coral">Workforce Portal</Link>
          <Link to="/contact" className="font-space text-navy hover:text-coral">Contact</Link>
          <Link to="/partner-portal/signup" className="font-space text-sm text-gray-500 hover:text-coral">For Recruitment Agencies</Link>
          {user ? (
            <>
              {isAdmin && <Link to="/admin" className="font-space text-coral">Admin</Link>}
              <button onClick={signOut} className="text-left text-gray-500">Logout</button>
            </>
          ) : (
            <Link to="/login" className="bg-coral text-white px-4 py-2 rounded-lg text-center">Sign In</Link>
          )}
        </>
      }
    />
  );
};

export default Header;
