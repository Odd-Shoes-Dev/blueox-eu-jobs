import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PartnerAuthProvider, usePartnerAuth } from '../../contexts/PartnerAuthContext';

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
    <div className="font-inter min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/partner-portal" className="flex items-center gap-2">
            <img src="/logo1.png" alt="Blue OX" className="h-8" />
            <span className="font-orbitron font-bold text-navy">Partner Portal</span>
          </Link>
          {partner && (
            <nav className="flex items-center gap-6">
              <Link to="/partner-portal" className="font-space text-sm text-navy hover:text-coral">Candidates</Link>
              <Link to="/partner-portal/billing" className="font-space text-sm text-navy hover:text-coral">Billing</Link>
              <span className="text-sm text-gray-500">{partner.company_name}</span>
              <button onClick={signOut} className="text-sm text-gray-500 hover:text-coral">Logout</button>
            </nav>
          )}
        </div>
      </header>
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
