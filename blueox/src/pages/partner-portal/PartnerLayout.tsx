import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PartnerAuthProvider, usePartnerAuth } from '../../contexts/PartnerAuthContext';
import SiteHeader from '../../components/SiteHeader';

const PUBLIC_PATHS = ['/partner-portal/login', '/partner-portal/signup'];

const PartnerLayoutInner: React.FC = () => {
  const { partner, loading, signOut } = usePartnerAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

  React.useEffect(() => {
    if (!loading && !partner && !isPublicPage) {
      navigate('/partner-portal/login', { replace: true });
    }
  }, [loading, partner, isPublicPage, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!partner && !isPublicPage) return null;

  return (
    <div className="font-inter min-h-screen bg-gray-50 flex flex-col pt-16 sm:pt-20">
      <SiteHeader
        homeTo="/partner-portal"
        brand={
          <>
            <img src="/logo1.png" alt="Blue OX" className="h-10" />
            <span className="font-orbitron font-bold text-navy">Partner Portal</span>
          </>
        }
        desktopNav={
          partner ? (
            <>
              <Link to="/partner-portal" className="font-space font-medium text-navy hover:text-coral transition">Candidates</Link>
              <Link to="/partner-portal/billing" className="font-space font-medium text-navy hover:text-coral transition">Billing</Link>
              <span className="text-sm text-gray-500">{partner.company_name}</span>
              <button onClick={signOut} className="text-sm text-gray-500 hover:text-coral">Logout</button>
            </>
          ) : (
            <>
              <Link to="/" className="font-space font-medium text-navy hover:text-coral transition">Back to Blue OX</Link>
              {location.pathname === '/partner-portal/signup' ? (
                <Link
                  to="/partner-portal/login"
                  className="bg-coral text-white px-6 py-2 rounded-lg font-space font-medium hover:bg-coral-dark transition"
                >
                  Log In
                </Link>
              ) : (
                <Link
                  to="/partner-portal/signup"
                  className="bg-coral text-white px-6 py-2 rounded-lg font-space font-medium hover:bg-coral-dark transition"
                >
                  Become a Partner
                </Link>
              )}
            </>
          )
        }
        mobileNav={
          partner ? (
            <>
              <Link to="/partner-portal" className="font-space text-navy hover:text-coral">Candidates</Link>
              <Link to="/partner-portal/billing" className="font-space text-navy hover:text-coral">Billing</Link>
              <span className="text-sm text-gray-500">{partner.company_name}</span>
              <button onClick={signOut} className="text-left text-sm text-gray-500 hover:text-coral">Logout</button>
            </>
          ) : (
            <>
              <Link to="/" className="font-space text-navy hover:text-coral">Back to Blue OX</Link>
              {location.pathname === '/partner-portal/signup' ? (
                <Link to="/partner-portal/login" className="bg-coral text-white px-4 py-2 rounded-lg text-center">Log In</Link>
              ) : (
                <Link to="/partner-portal/signup" className="bg-coral text-white px-4 py-2 rounded-lg text-center">Become a Partner</Link>
              )}
            </>
          )
        }
      />
      <main className="flex-grow container mx-auto px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
};

const PartnerLayout: React.FC = () => (
  <PartnerAuthProvider>
    <PartnerLayoutInner />
  </PartnerAuthProvider>
);

export default PartnerLayout;
