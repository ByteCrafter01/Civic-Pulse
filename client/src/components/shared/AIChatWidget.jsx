import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';

export default function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I\'m CivicPulse AI. I can help you with complaint guidance, status explanations, or drafting a better description. How can I help?' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiAvailable, setAiAvailable] = useState(null);
    const endRef = useRef(null);

    useEffect(() => {
        api.get('/ai/status').then(({ data }) => {
            setAiAvailable(data.data.groq === 'active');
        }).catch(() => setAiAvailable(false));
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (aiAvailable === false) return null;
    if (aiAvailable === null) return null;

    const send = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input.trim() };
        const updated = [...messages, userMsg];
        setMessages(updated);
        setInput('');
        setLoading(true);

        try {
            const { data } = await api.post('/ai/chat', {
                messages: updated.map(m => ({ role: m.role, content: m.content })),
            });
            setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center"
                title="AI Assistant"
            >
                {open ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Chat panel */}
            {open && (
                <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in" style={{ maxHeight: '28rem' }}>
                    {/* Header */}
                    <div className="bg-primary-600 text-white px-4 py-3 flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center text-xs font-bold">AI</div>
                        <div>
                            <p className="text-sm font-semibold">CivicPulse AI</p>
                            <p className="text-xs text-primary-200">Powered by Llama 3.3</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: '12rem' }}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-none'
                                        : 'bg-slate-100 text-slate-700 rounded-bl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 text-slate-500 px-3 py-2 rounded-lg rounded-bl-none text-sm">
                                    <span className="inline-flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={send} className="border-t border-slate-200 p-2 flex gap-2 shrink-0">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                            placeholder="Ask about complaints..."
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
