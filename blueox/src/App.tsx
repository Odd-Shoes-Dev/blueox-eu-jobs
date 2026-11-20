import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Jobs from './pages/Jobs';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Portal from './pages/Portal';
import Admin from './pages/Admin';
import PartnerLayout from './pages/partner-portal/PartnerLayout';
import PartnerSignUp from './pages/partner-portal/SignUp';
import PartnerLogin from './pages/partner-portal/Login';
import PartnerDashboard from './pages/partner-portal/Dashboard';
import PartnerCandidateDetail from './pages/partner-portal/CandidateDetail';
import PartnerBilling from './pages/partner-portal/Billing';
import CandidateSelfService from './pages/partner-portal/CandidateSelfService';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  // The Partner Portal is a different audience with its own layout/header
  // (PartnerLayout) — hide the regular client-facing Header/Footer there.
  // The homepage now uses the same Header as every other page; it only
  // keeps its own full-viewport layout (no shared Footer) for its chat UI.
  const isPartnerPortal = location.pathname.startsWith('/partner-portal');

  return (
    <div className="min-h-screen flex flex-col">
      {!isPartnerPortal && <Header />}
      <main className={isHomePage || isPartnerPortal ? '' : 'flex-grow'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/apply/:type" element={<Portal />} />
          <Route path="/admin" element={<Admin />} />

          <Route path="/partner-portal/candidate/:token" element={<CandidateSelfService />} />
          <Route path="/partner-portal" element={<PartnerLayout />}>
            <Route index element={<PartnerDashboard />} />
            <Route path="signup" element={<PartnerSignUp />} />
            <Route path="login" element={<PartnerLogin />} />
            <Route path="candidates/:id" element={<PartnerCandidateDetail />} />
            <Route path="billing" element={<PartnerBilling />} />
          </Route>
        </Routes>
      </main>
      {!isHomePage && !isPartnerPortal && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
