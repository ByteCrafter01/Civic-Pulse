import { useEffect, useState, useRef } from 'react';

function useAnimatedCounter(end, duration = 1200) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        if (end == null || started.current) return;
        const numEnd = typeof end === 'string' ? parseFloat(end) : end;
        if (isNaN(numEnd)) { setCount(end); return; }

        started.current = true;
        let start = 0;
        const increment = numEnd / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= numEnd) { setCount(numEnd); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);

    return count;
}

const gradients = {
    primary: 'from-blue-500 to-indigo-600',
    red: 'from-red-500 to-rose-600',
    green: 'from-emerald-500 to-green-600',
    yellow: 'from-amber-400 to-yellow-500',
    orange: 'from-orange-500 to-amber-600',
};

const iconBgs = {
    primary: 'bg-blue-50 dark:bg-blue-950/30',
    red: 'bg-red-50 dark:bg-red-950/30',
    green: 'bg-emerald-50 dark:bg-emerald-950/30',
    yellow: 'bg-amber-50 dark:bg-amber-950/30',
    orange: 'bg-orange-50 dark:bg-orange-950/30',
};

export default function StatsCard({ title, value, subtitle, trend, color = 'primary', icon: Icon }) {
    const numericValue = typeof value === 'number' ? value : null;
    const animatedValue = useAnimatedCounter(numericValue);

    const displayValue = numericValue != null ? animatedValue : (value ?? '--');

    return (
        <div className="stat-card group relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            {/* Gradient accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[color]}`} />

            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{displayValue}</p>
                </div>
                {Icon && (
                    <div className={`w-10 h-10 rounded-lg ${iconBgs[color]} flex items-center justify-center shrink-0 ml-3`}>
                        <Icon className={`w-5 h-5 bg-gradient-to-r ${gradients[color]} bg-clip-text`} style={{ color: color === 'primary' ? '#3b82f6' : color === 'red' ? '#ef4444' : color === 'green' ? '#10b981' : color === 'yellow' ? '#f59e0b' : '#f97316' }} />
                    </div>
                )}
            </div>

            {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{subtitle}</p>}
            {trend !== undefined && (
                <p className={`text-xs mt-2 font-semibold ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {trend >= 0 ? '\u2191' : '\u2193'} {Math.abs(trend)}% vs last week
                </p>
            )}
        </div>
    );
}
