import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle } from 'lucide-react';
import { usePartnerAuth } from '../../contexts/PartnerAuthContext';

const PartnerSignUp: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signUp } = usePartnerAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreedToTerms) {
      setError('Please accept the Terms of Use and Privacy Policy to continue');
      return;
    }
    setLoading(true);
    const { error } = await signUp({
      company_name: companyName,
      contact_person_name: contactPersonName,
      contact_email: contactEmail,
      contact_phone: contactPhone || undefined,
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message || 'Could not create account');
      return;
    }
    navigate('/partner-portal');
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h1 className="font-orbitron text-2xl font-bold text-navy mb-2">Become a Partner</h1>
      <p className="text-gray-600 mb-6">Submit candidates for Blue Ox to process and place.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact person</label>
          <input
            required
            value={contactPersonName}
            onChange={(e) => setContactPersonName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact email</label>
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact phone</label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Login email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="text-coral hover:underline">Terms of Use</Link>
            {' '}and{' '}
            <Link to="/privacy" target="_blank" className="text-coral hover:underline">Privacy Policy</Link>.
          </span>
        </label>
        <button
          type="submit"
          disabled={loading || !agreedToTerms}
          className="w-full bg-coral text-white py-3 rounded-lg font-space font-semibold hover:bg-coral-dark transition flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" /> Create Account
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/partner-portal/login" className="text-coral hover:underline font-medium">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
};

export default PartnerSignUp;
