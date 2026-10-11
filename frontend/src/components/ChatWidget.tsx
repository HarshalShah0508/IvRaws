import { useState, useRef, useEffect } from 'react';
import { api, ApiError } from '../lib/api.ts';
import type { ChatReply, ChatSuggestion } from '../lib/types.ts';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  suggestions?: ChatSuggestion[];
}

const GREETING: Message = {
  id: 'greeting',
  role: 'bot',
  text: "Hi! Ask me about shipping, returns, sizing, or say \"where is my order\" if you're logged in.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const result = await api.post<ChatReply>('/chat/query', { message: trimmed });
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'bot', text: result.reply, suggestions: result.suggestions },
      ]);
    } catch (err) {
      const text = err instanceof ApiError ? err.message : "Sorry, I couldn't reach the support bot just now.";
      setMessages((prev) => [...prev, { id: `b-${Date.now()}`, role: 'bot', text }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 h-96 bg-white border-2 border-black shadow-xl flex flex-col overflow-hidden">
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
            <span className="font-display text-sm uppercase tracking-wide">IvRaws Support</span>
            <button type="button" onClick={() => setOpen(false)} className="text-white/70 hover:text-accent text-sm">
              ✕
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-sm">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <span
                  className={`inline-block px-3 py-2 max-w-[85%] ${
                    m.role === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {m.text}
                </span>
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 justify-start">
                    {m.suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => send(s.question)}
                        className="text-xs border border-black px-2.5 py-1 hover:bg-accent transition-colors"
                      >
                        {s.question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {sending && <div className="text-left text-gray-400 text-xs">Typing...</div>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t-2 border-black flex"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="px-4 text-xs font-bold uppercase tracking-wide text-black disabled:text-gray-400 hover:text-accent-dark"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-black text-white shadow-lg flex items-center justify-center text-xl hover:bg-accent hover:text-black transition-colors"
        aria-label="Open support chat"
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
