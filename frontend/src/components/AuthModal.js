import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { X, LogIn, UserPlus, Loader2 } from 'lucide-react';

const AuthModal = ({ isOpen, onClose }) => {
  const { loginWithRedirect, isLoading } = useAuth0();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'login'
      }
    });
  };

  const handleSignup = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    });
  };

  const handleGoogleAuth = (mode) => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
        screen_hint: mode
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card max-w-md w-full mx-4 p-8 relative animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground-muted hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {authMode === 'login' ? 'Welcome Back' : 'Join Dora'}
          </h2>
          <p className="text-foreground-muted">
            {authMode === 'login' 
              ? 'Sign in to access your saved itineraries' 
              : 'Create an account to save your travel plans'
            }
          </p>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-4">
          {/* Google OAuth Button */}
          <button
            onClick={() => handleGoogleAuth(authMode)}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-foreground-muted bg-surface">or</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Email/Password Button */}
          <button
            onClick={authMode === 'login' ? handleLogin : handleSignup}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 btn-primary"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : authMode === 'login' ? (
              <LogIn className="w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {authMode === 'login' ? 'Sign In' : 'Sign Up'} with Email
          </button>
        </div>

        {/* Toggle Auth Mode */}
        <div className="text-center mt-6">
          <p className="text-foreground-muted text-sm">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:text-primary-light transition-colors font-medium"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;