import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Box, Lock, Mail, ArrowRight, Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  // Only to give a starting email for demonstration
  const handleAdminDemoClick = () => {
    setEmail('admin@example.com');
    setPassword('admin123'); // Assume this was from standard seeding
  };

  const handleUserDemoClick = () => {
    setEmail('user@example.com');
    setPassword('user123'); // Assume this was from standard seeding
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 transition-colors duration-300 relative overflow-hidden">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 backdrop-blur-md transition-all shadow-lg z-50 text-gray-800 dark:text-gray-200"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass p-8 sm:p-10 rounded-3xl shadow-2xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg mb-4">
            <Box size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
            Sign in to orchestrate your multi-regional supply chain.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        
        <div className="mt-6 flex justify-center gap-4 text-center">
            <button type="button" onClick={handleAdminDemoClick} className="text-xs text-blue-500 hover:text-blue-600 underline underline-offset-4">Auto-fill Admin Data</button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <button type="button" onClick={handleUserDemoClick} className="text-xs text-purple-500 hover:text-purple-600 underline underline-offset-4">Auto-fill User Data</button>
        </div>
      </div>
    </div>
  );
};

export default Login;
