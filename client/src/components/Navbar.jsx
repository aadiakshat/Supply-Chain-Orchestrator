import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <nav className="glass sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here */}
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 hidden sm:block">
          Orchestrator
        </h2>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-3 border-l border-gray-300 dark:border-gray-700 pl-4 sm:pl-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-md">
            <UserIcon size={18} />
          </div>
          <button
            onClick={logout}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors ml-2"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
