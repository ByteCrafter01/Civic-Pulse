export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
    const spinner = (
        <div className={`${sizes[size]} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
    );
    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }
    return <div className="flex justify-center p-4">{spinner}</div>;
}
