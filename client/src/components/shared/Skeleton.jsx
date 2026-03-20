export function SkeletonCard() {
    return (
        <div className="card animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-3" />
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="card animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4" />
            <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }) {
    return (
        <div className="card animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                </div>
            ))}
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonChart />
                <SkeletonChart />
            </div>
        </div>
    );
}
