import clsx from "clsx";

const StatCard = ({ title, value, icon: Icon, color = "blue", subtitle }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <div className="glass p-6 rounded-2xl flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-gray-400">{title}</h3>
        <div className={clsx("p-3 rounded-xl", colorMap[color])}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
