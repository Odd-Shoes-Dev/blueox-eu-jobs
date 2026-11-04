// Custom email/password login/signup. Clerk is intentionally NOT used right now —
// see blueox-api/AUTH.md and Login.clerk.tsx for the dormant Clerk version. One
// upside of being back on a custom form: the chatbot-data pre-fill (lost under
// Clerk's prebuilt UI) works again below.
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle, CheckCircle, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as applicationsService from '../services/applicationsService';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface ConversationData {
  userPath?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  targetCountries?: string[] | string;
  [key: string]: unknown;
}

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'student' | 'workforce' | 'company'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
  const stateConversationData = (location.state as { conversationData?: ConversationData })?.conversationData;

  useEffect(() => {
    let data: ConversationData | null = null;

    if (stateConversationData) {
      data = stateConversationData;
    } else {
      const stored = localStorage.getItem('blueox_conversation_data');
      if (stored) {
        try {
          data = JSON.parse(stored);
        } catch {
          console.error('Failed to parse stored conversation data');
        }
      }
    }

    if (data) {
      setConversationData(data);
      setIsLogin(false);

      if (data.fullName) setFullName(data.fullName as string);
      if (data.email) setEmail(data.email as string);
      if (data.phone) setPhone(data.phone as string);
      if (data.contactName) setFullName(data.contactName as string);
      if (data.contactEmail) setEmail(data.contactEmail as string);
      if (data.contactPhone) setPhone(data.contactPhone as string);

      if (data.userPath) {
        if (data.userPath === 'company') {
          setRole('company');
        } else if ((data.userPath as string).includes('student')) {
          setRole('student');
        } else {
          setRole('workforce');
        }
      }
    }
  }, [stateConversationData]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const createApplicationFromConversation = async (clientId: string, data: ConversationData) => {
    try {
      const { error } = await applicationsService.createApplication({
        client_id: clientId,
        // data.userPath already matches the DB's allowed application_type values.
        application_type: data.userPath,
        target_country: Array.isArray(data.targetCountries) ? data.targetCountries.join(', ') : data.targetCountries,
        status: 'pending',
        conversation_context: data,
      });
      if (!error) localStorage.removeItem('blueox_conversation_data');
    } catch (err) {
      console.error('Error creating application:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { client, error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          if (conversationData && client) {
            await createApplicationFromConversation(client.id, conversationData);
          }
          navigate(from, { replace: true });
        }
      } else {
        if (!fullName.trim()) {
          setError('Full name is required');
          setLoading(false);
          return;
        }

        const baseRole = role === 'company' ? 'workforce' : role;
        const { client, error } = await signUp(email, password, fullName, baseRole, phone);

        if (error) {
          setError(error.message);
        } else {
          if (conversationData && client) {
            await createApplicationFromConversation(client.id, conversationData);
          }

          setToast({
            message: 'Account created! Welcome to Blue OX.',
            type: 'success',
          });
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="font-inter pt-20 min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      {toast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className={`rounded-lg shadow-lg p-4 flex items-start ${
            toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div className={`ml-3 flex-1 ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className={`ml-4 flex-shrink-0 ${toast.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {conversationData && !isLogin && (
          <div className="bg-coral/10 border border-coral/20 rounded-lg p-4 mb-6 flex items-start">
            <MessageSquare className="w-5 h-5 text-coral mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-navy">Your information has been pre-filled</p>
              <p className="text-xs text-gray-600 mt-1">
                Based on your conversation with our AI Consultant. Complete registration to save your application.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <img src="/images/logo.png" alt="Blue OX" className="h-12 mx-auto mb-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <h1 className="font-orbitron text-2xl font-bold text-navy">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to access your portal' : 'Start your European journey today'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">I am applying to</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setRole('student')} className={`py-3 rounded-lg font-medium transition text-sm ${role === 'student' ? 'bg-coral text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    Study
                  </button>
                  <button type="button" onClick={() => setRole('workforce')} className={`py-3 rounded-lg font-medium transition text-sm ${role === 'workforce' ? 'bg-coral text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    Work
                  </button>
                  <button type="button" onClick={() => setRole('company')} className={`py-3 rounded-lg font-medium transition text-sm ${role === 'company' ? 'bg-coral text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    Hire
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coral text-white py-3 rounded-lg font-space font-semibold hover:bg-coral-dark transition flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5 mr-2" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 mr-2" /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-coral hover:underline font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-gray-500 hover:text-coral text-sm">
            Back to AI Consultant
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
