import { AuthContext, useAuthState } from '../../hooks/useAuth';

export function AuthProvider({ children }) {
  const auth = useAuthState();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
