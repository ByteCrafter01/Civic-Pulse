export default function StatsCard({ title, value, subtitle, trend, color = 'primary' }) {
    const colors = {
        primary: 'border-l-primary-500',
        red: 'border-l-red-500',
        green: 'border-l-green-500',
        yellow: 'border-l-yellow-500',
        orange: 'border-l-orange-500',
    };
    return (
        <div className={`stat-card border-l-4 ${colors[color]} animate-fade-in`}>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value ?? '--'}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            {trend !== undefined && (
                <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? '+' : ''}{Math.abs(trend)}% vs last week
                </p>
            )}
        </div>
    );
}
