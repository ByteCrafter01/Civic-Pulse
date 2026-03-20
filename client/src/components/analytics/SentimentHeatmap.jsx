import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../../api/axios';

const getSentimentColor = (score) => {
    if (score < -0.3) return '#dc2626'; // red - negative
    if (score < 0.3) return '#f59e0b';  // yellow - neutral
    return '#059669';                     // green - positive
};

export default function SentimentHeatmap() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/area-sentiment')
            .then(({ data: res }) => setData(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="card animate-pulse"><div className="h-64 bg-slate-200 dark:bg-slate-700 rounded" /></div>;

    const center = data.length > 0
        ? [data.reduce((s, d) => s + d.lat, 0) / data.length, data.reduce((s, d) => s + d.lng, 0) / data.length]
        : [19.076, 72.8777];

    return (
        <div className="card">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-2">Sentiment by Area</h3>
            <div className="flex gap-4 mb-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Negative</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Neutral</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Positive</span>
            </div>
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600" style={{ height: 300 }}>
                <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {data.map((point, i) => (
                        <CircleMarker
                            key={i}
                            center={[point.lat, point.lng]}
                            radius={Math.min(Math.max(point.count * 3, 6), 25)}
                            fillColor={getSentimentColor(point.avgSentiment)}
                            color={getSentimentColor(point.avgSentiment)}
                            fillOpacity={0.6}
                            weight={1}
                        >
                            <Popup>
                                <div className="text-xs">
                                    <p className="font-semibold">Avg Sentiment: {point.avgSentiment.toFixed(3)}</p>
                                    <p>Complaints: {point.count}</p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
