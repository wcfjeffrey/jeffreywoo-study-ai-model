
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { askTutor } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface TutorViewProps {
  context: string;
}

const TutorView: React.FC<TutorViewProps> = ({ context }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm your 24/7 AI Tutor. I've analyzed your materials. What concept should we break down first?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await askTutor(userMsg, context, messages);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error. Could you try rephrasing that?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto py-12 px-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800">AI Study Tutor</h2>
        <p className="text-slate-500 mt-1">Ask questions, clarify diagrams, or get step-by-step explanations</p>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-3xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Explain the first slide in simple terms..."
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Sparkles size={12} className="text-amber-400" />
            AI tutor leverages your specific materials for grounded answers
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorView;
