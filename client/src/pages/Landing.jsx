import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Shield, Brain, BarChart3, Bell, MapPin, Clock,
    ArrowRight, CheckCircle2, Users, Building2, Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [end, duration]);
    return <>{count.toLocaleString()}{suffix}</>;
}

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' } }),
};

const features = [
    { icon: Brain, title: 'AI-Powered Scoring', desc: 'XGBoost + NLP automatically scores complaint priority using sentiment, urgency keywords, and historical patterns.' },
    { icon: MapPin, title: 'Smart Routing', desc: 'Complaints are auto-routed to the correct department using ML classification with 90%+ accuracy.' },
    { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live dashboards with sentiment trends, department performance, and predictive insights.' },
    { icon: Bell, title: 'Multi-Channel Alerts', desc: 'Socket.IO real-time notifications plus email alerts for status changes and SLA warnings.' },
    { icon: Clock, title: 'SLA Monitoring', desc: 'Automatic deadline tracking with escalation alerts when complaints approach or breach SLA.' },
    { icon: Shield, title: 'Transparent Tracking', desc: 'Public portal lets citizens track complaints without login. Full status timeline visibility.' },
];

const stats = [
    { value: 500, suffix: '+', label: 'Complaints Processed' },
    { value: 95, suffix: '%', label: 'Routing Accuracy' },
    { value: 5, suffix: '', label: 'Departments Connected' },
    { value: 60, suffix: 's', label: 'Avg AI Response' },
];

export default function Landing() {
    const { theme } = useTheme();

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-600/25">CP</div>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">CivicPulse</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link to="/public" className="hidden sm:inline-flex text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            Public Portal
                        </Link>
                        <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-2">
                            Sign In
                        </Link>
                        <Link to="/register" className="btn-primary text-sm py-2 px-4 shadow-lg shadow-blue-600/25">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
                {/* Background gradient orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-400/20 dark:from-blue-400/10 dark:to-indigo-400/10 blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-400/15 dark:from-cyan-400/5 dark:to-blue-400/5 blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto text-center relative">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            AI-Powered Civic Infrastructure
                        </span>
                    </motion.div>

                    <motion.h1
                        className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight"
                        initial="hidden" animate="visible" variants={fadeUp} custom={1}
                    >
                        Intelligent Municipal{' '}
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Complaint Management
                        </span>
                    </motion.h1>

                    <motion.p
                        className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
                        initial="hidden" animate="visible" variants={fadeUp} custom={2}
                    >
                        Transform how your city handles citizen complaints with AI-driven priority scoring,
                        smart department routing, and real-time transparency.
                    </motion.p>

                    <motion.div
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial="hidden" animate="visible" variants={fadeUp} custom={3}
                    >
                        <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5">
                            Start Filing Complaints
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/public" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-md">
                            View Public Dashboard
                        </Link>
                    </motion.div>

                    {/* Trust badges */}
                    <motion.div
                        className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-500"
                        initial="hidden" animate="visible" variants={fadeUp} custom={4}
                    >
                        {['AI-Scored Priority', 'Real-Time Updates', 'SLA Tracking', 'Multilingual'].map((badge) => (
                            <span key={badge} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                {badge}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-y border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                className="text-center"
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                            >
                                <p className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 sm:py-28 px-4">
                <div className="max-w-6xl mx-auto">
                    <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                            Built for Modern Governance
                        </h2>
                        <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                            Every feature designed to make civic complaint management faster, fairer, and more transparent.
                        </p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feat, i) => (
                            <motion.div
                                key={feat.title}
                                className="group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-600/5 transition-all duration-300 hover:-translate-y-1"
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform duration-300">
                                    <feat.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-200/50 dark:border-slate-800/50 px-4">
                <div className="max-w-4xl mx-auto">
                    <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">How It Works</h2>
                        <p className="mt-4 text-lg text-slate-500 dark:text-slate-400">From complaint to resolution in four steps</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { step: '01', icon: Users, title: 'Citizen Files', desc: 'Submit complaint with description, location, and photo' },
                            { step: '02', icon: Brain, title: 'AI Analyzes', desc: 'Priority scored, department routed, duplicates detected' },
                            { step: '03', icon: Building2, title: 'Officer Resolves', desc: 'Assigned officer works the complaint with SLA tracking' },
                            { step: '04', icon: CheckCircle2, title: 'Citizen Rates', desc: 'Satisfaction survey closes the feedback loop' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.step}
                                className="text-center"
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                            >
                                <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
                                    <item.icon className="w-7 h-7 text-white" />
                                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-slate-950 border-2 border-blue-600 text-blue-600 text-xs font-bold flex items-center justify-center">{item.step}</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 sm:py-28 px-4">
                <motion.div
                    className="max-w-3xl mx-auto text-center"
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        Ready to Transform Civic Engagement?
                    </h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-xl mx-auto">
                        Join the platform making city governance smarter, faster, and more accountable.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5">
                            Create Free Account
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/public" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            or explore the public dashboard &rarr;
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold">CP</div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">CivicPulse</span>
                        <span className="text-xs text-slate-400">v2.0</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <Link to="/public" className="hover:text-slate-900 dark:hover:text-white transition-colors">Public Portal</Link>
                        <Link to="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">Sign In</Link>
                        <Link to="/register" className="hover:text-slate-900 dark:hover:text-white transition-colors">Register</Link>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        &copy; 2026 CivicPulse. Intelligent Municipal Complaint Management.
                    </p>
                </div>
            </footer>
        </div>
    );
}
