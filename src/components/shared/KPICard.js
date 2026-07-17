export default function KPICard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && <div className="text-gray-400"><Icon size={24} /></div>}
      </div>
    </div>
  );
}
