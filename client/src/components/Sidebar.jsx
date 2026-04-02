import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MapPin, Truck, Box } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MapPin, label: 'Nodes & Facilities', path: '/nodes' },
  { icon: Truck, label: 'Shipments', path: '/shipments' },
];

const Sidebar = () => {
  return (
    <aside className="glass w-64 h-full flex flex-col hidden md:flex border-r border-border drop-shadow-sm">
      <div className="h-16 flex items-center justify-center border-b border-border">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Box className="w-8 h-8" />
          <span className="text-xl font-black tracking-tight">SCO</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-1",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 glass-hover"
              )
            }
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span className="font-semibold text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">All Systems Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
