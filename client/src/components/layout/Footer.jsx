import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">CP</div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">CivicPulse</span>
                </div>
                <div className="flex items-center gap-5 text-xs text-slate-500 dark:text-slate-400">
                    <Link to="/public" className="hover:text-slate-900 dark:hover:text-white transition-colors">Public Portal</Link>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>&copy; 2026 CivicPulse</span>
                </div>
            </div>
        </footer>
    );
}
