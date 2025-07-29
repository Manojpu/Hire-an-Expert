// Simple auth utilities for testing
export interface User {
  userId: string;
  username: string;
  userType: 'user' | 'expert';
  exp: number;
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const decoded = JSON.parse(atob(token));
    
    // Check if token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      logout();
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
  localStorage.removeItem('userType');
};

export const getUserInfo = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    userId: localStorage.getItem('userId'),
    username: localStorage.getItem('username'),
    userType: localStorage.getItem('userType')
  };
};
