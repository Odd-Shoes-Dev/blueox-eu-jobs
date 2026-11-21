import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import About from './pages/About';
import Jobs from './pages/Jobs';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
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
  // The homepage now uses the same Header and Footer as every other page for
  // its hero/marketing scroll state; once the chatbot conversation starts
  // (?chat=1) it switches to a fixed-viewport "app" layout with its own
  // internal scrolling, where a page-level Footer below it would just add
  // unwanted whole-page scroll to reach something unrelated to the chat.
  const isPartnerPortal = location.pathname.startsWith('/partner-portal');
  const isHomeChatActive = isHomePage && new URLSearchParams(location.search).get('chat') === '1';

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!isPartnerPortal && <Header />}
      <main className={isHomePage || isPartnerPortal ? '' : 'flex-grow'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
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
      {!isPartnerPortal && !isHomeChatActive && <Footer />}
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
