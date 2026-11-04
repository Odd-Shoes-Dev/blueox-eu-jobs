import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { SignIn, SignUp, useAuth as useClerkAuthState } from '@clerk/clerk-react';
import * as applicationsService from '../services/applicationsService';
import * as clientsService from '../services/clientsService';

interface ConversationData {
  userPath?: string;
  targetCountries?: string[] | string;
  [key: string]: unknown;
}

// Approximates the brand's coral/navy palette on Clerk's prebuilt components.
const clerkAppearance = {
  variables: {
    colorPrimary: '#FF4040',
  },
};

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useClerkAuthState();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
  const stateConversationData = (location.state as { conversationData?: ConversationData })?.conversationData;

  // Once Clerk reports a signed-in user (fresh sign-in or sign-up), save any
  // chatbot conversation data as an application, then continue to where the user
  // was headed. This replaces the old dual signIn/signUp branches in handleSubmit —
  // Clerk unifies both into "became signed in."
  useEffect(() => {
    if (!isSignedIn) return;

    const run = async () => {
      let data: ConversationData | null = stateConversationData ?? null;
      if (!data) {
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
        try {
          const { client } = await clientsService.getMe();
          // data.userPath is already one of the DB's allowed application_type values.
          const { error } = await applicationsService.createApplication({
            client_id: client.id,
            application_type: data.userPath,
            target_country: Array.isArray(data.targetCountries) ? data.targetCountries.join(', ') : data.targetCountries,
            status: 'pending',
            conversation_context: data,
          });
          if (!error) localStorage.removeItem('blueox_conversation_data');
        } catch (err) {
          console.error('Error creating application:', err);
        }
      }

      navigate(from, { replace: true });
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="font-inter pt-20 min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Blue OX" className="h-12 mx-auto mb-4" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>

        {stateConversationData && !isLogin && (
          <div className="bg-coral/10 border border-coral/20 rounded-lg p-4 mb-6 text-center">
            <p className="text-sm font-medium text-navy">Your conversation is saved</p>
            <p className="text-xs text-gray-600 mt-1">
              Finish creating your account and we'll attach it to your application.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          {isLogin ? (
            <SignIn routing="virtual" appearance={clerkAppearance} />
          ) : (
            <SignUp routing="virtual" appearance={clerkAppearance} />
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
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
