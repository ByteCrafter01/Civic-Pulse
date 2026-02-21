export default function PriorityBadge({ level, score }) {
    const cfg = {
        CRITICAL: { cls: 'badge-critical', label: 'Critical' },
        HIGH: { cls: 'badge-high', label: 'High' },
        MEDIUM: { cls: 'badge-medium', label: 'Medium' },
        LOW: { cls: 'badge-low', label: 'Low' },
    };
    const c = cfg[level] || cfg.LOW;
    return (
        <span className={c.cls}>
            {c.label}
            {score !== undefined && <span className="ml-1 opacity-70">({score?.toFixed(0)})</span>}
        </span>
    );
}
