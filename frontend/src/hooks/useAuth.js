import { useAuth0 } from '@auth0/auth0-react';
import { useCallback, useState } from 'react';

const useAuth = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    logout, 
    getAccessTokenSilently 
  } = useAuth0();
  
  const [tokenRefreshAttempts, setTokenRefreshAttempts] = useState(0);

  const getTokenWithRetry = useCallback(async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            scope: "openid profile email"
          },
          cacheMode: attempt > 1 ? 'off' : 'on'
        });

        setTokenRefreshAttempts(0);
        return token;
      } catch (error) {
        console.warn(`Token refresh attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          console.error('All token refresh attempts failed');
          throw error;
        }

        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }, [getAccessTokenSilently]);

  const secureApiCall = useCallback(async (url, options = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await getTokenWithRetry();
      if (!token) return null;

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response;
    } catch (error) {
      console.error('Secure API call failed:', error);
      throw error;
    }
  }, [getTokenWithRetry, isAuthenticated]);

  const handleLogout = useCallback(() => {
    logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }, [logout]);

  return {
    isAuthenticated,
    isLoading,
    user,
    secureApiCall,
    getTokenWithRetry,
    logout: handleLogout
  };
};

export default useAuth;