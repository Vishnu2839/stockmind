import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/shared/AuthProvider';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import BottomNav from './components/layout/BottomNav';
import HomeScreen from './components/screens/HomeScreen';
import MarketsScreen from './components/screens/MarketsScreen';
import StockDetail from './components/screens/StockDetail';
import AIBrainScreen from './components/screens/AIBrainScreen';
import PortfolioScreen from './components/screens/PortfolioScreen';
import LoginScreen from './components/screens/LoginScreen';
import RegisterScreen from './components/screens/RegisterScreen';
import AIChatbot from './components/shared/AIChatbot';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <LayoutWrapper />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function LayoutWrapper() {
  return (
    <div className="min-h-screen bg-bg text-text font-body">
      <Sidebar />
      <div className="md:ml-[220px]">
        <Topbar />
        <main className="max-w-4xl mx-auto p-0 md:p-4">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/markets" element={<MarketsScreen />} />
            <Route path="/stock/:ticker" element={<StockDetail />} />
            <Route path="/brain" element={<AIBrainScreen />} />
            <Route path="/portfolio" element={<PortfolioScreen />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
      <AIChatbot />
    </div>
  );
}
