export default function StatsCard({ title, value, subtitle, icon, trend, color = 'primary' }) {
    const colors = {
        primary: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
        red: 'text-red-400 bg-red-500/10 border-red-500/20',
        green: 'text-green-400 bg-green-500/10 border-green-500/20',
        yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    };
    return (
        <div className="stat-card animate-fade-in">
            <div className="flex items-start justify-between">
                <p className="text-sm text-slate-400 font-medium">{title}</p>
                {icon && (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${colors[color]}`}>
                        <span className="text-lg">{icon}</span>
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-slate-100 mt-2">{value ?? '—'}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            {trend !== undefined && (
                <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
                </p>
            )}
        </div>
    );
}
