export default function PriorityBadge({ level, score }) {
    const cfg = {
        CRITICAL: { cls: 'badge-critical', dot: 'bg-red-400', label: '🔴 Critical' },
        HIGH: { cls: 'badge-high', dot: 'bg-orange-400', label: '🟠 High' },
        MEDIUM: { cls: 'badge-medium', dot: 'bg-yellow-400', label: '🟡 Medium' },
        LOW: { cls: 'badge-low', dot: 'bg-green-400', label: '🟢 Low' },
    };
    const c = cfg[level] || cfg.LOW;
    return (
        <span className={c.cls}>
            {c.label}
            {score !== undefined && <span className="ml-1 opacity-70">({score?.toFixed(0)})</span>}
        </span>
    );
}
