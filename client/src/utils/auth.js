const AUTH_STORAGE_KEY = "task-manager-auth";

export const getStoredAuth = () => {
  try {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    return storedAuth ? JSON.parse(storedAuth) : null;
  } catch {
    clearAuth();
    return null;
  }
};

export const saveAuth = ({ user, token }) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getToken = () => getStoredAuth()?.token || null;

export const getCurrentUser = () => getStoredAuth()?.user || null;

export const isAuthenticated = () => Boolean(getToken());
