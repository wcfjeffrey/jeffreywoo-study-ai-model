
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import FlashcardsView from './components/FlashcardsView';
import StudyNotesView from './components/StudyNotesView';
import QuizView from './components/QuizView';
import MindmapView from './components/MindmapView';
import TutorView from './components/TutorView';
import { StudySession, ViewState, StudyStyle } from './types';
import { processStudyMaterial } from './services/chatanywhereService.ts';
// Added ChevronRight to imports to fix missing symbol errors
import { Upload, FileType, Languages, LayoutTemplate, BrainCircuit, Rocket, Loader2, Sparkles, AlertCircle, Bookmark, ChevronRight, Layers, HelpCircle } from 'lucide-react';
// @ts-ignore
import mammoth from 'mammoth';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('upload');
  const [session, setSession] = useState<StudySession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [style, setStyle] = useState<StudyStyle>('Cornell');
  const [language, setLanguage] = useState('English');
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [quizCount, setQuizCount] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      let content = "";
      let image: { data: string; mimeType: string } | undefined;

      const fileName = file.name.toLowerCase();

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        image = { data: imageData, mimeType: file.type };
        content = "[Visual Study Material]";
      } else if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;
      } else if (fileName.endsWith('.txt')) {
        content = await file.text();
      } else if (fileName.endsWith('.pdf') || fileName.endsWith('.doc')) {
        // Simple fallback for environments without complex PDF parsers
        const rawText = await file.text();
        if (rawText.includes('%PDF-')) {
          throw new Error("PDF parsing is limited. Please copy and paste the text into a .txt file, or upload a screenshot of the page.");
        }
        content = rawText;
      } else {
        content = await file.text();
      }

      // Conservative limit to stay within RPC payload constraints
      if (content.length > 5000) {
        content = content.substring(0, 5000);
      }

      if (!content || content.trim().length < 10) {
        throw new Error("The file seems empty or contains unreadable text.");
      }

      const result = await processStudyMaterial(content, image, language, style, flashcardCount, quizCount);
      
      if (!result.title) {
        throw new Error("Could not extract meaningful study data. Try a different section of text.");
      }

      setSession({
        id: Date.now().toString(),
        originalText: content,
        ...result
      } as StudySession);
      setView('dashboard');
    } catch (err: any) {
      console.error("Analysis error:", err);
      if (err.message?.includes("500") || err.message?.includes("Rpc failed") || err.message?.includes("xhr")) {
        setError("The server or proxy timed out. This usually happens with large files. Please try a much smaller snippet of text (approx. 2-3 paragraphs) or a clear screenshot.");
      } else {
        setError(err.message || "An unexpected error occurred during processing.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const languages = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Italian", "Portuguese", "Russian", "Arabic"
  ];

  const renderDashboard = () => (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">{session?.title}</h2>
          <div className="flex items-center gap-4">
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{session?.language}</span>
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Ready</span>
          </div>
        </div>
        <button onClick={() => setView('tutor')} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <Sparkles size={18} /> Ask AI Tutor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Bookmark className="text-indigo-600" size={24} /> Key Concepts
            </h3>
            <div className="space-y-4">
              {session?.concepts && session.concepts.length > 0 ? (
                session.concepts.map((c, i) => (
                  <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-lg font-bold text-slate-900">{c.term}</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-black uppercase">Term</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-3">{c.definition}</p>
                    <div className="pt-3 border-t border-slate-200/50 text-xs italic text-slate-500">
                      e.g. {c.example}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 italic py-8 text-center">No major concepts found. Try more detailed input.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div onClick={() => setView('flashcards')} className="bg-slate-900 text-white rounded-3xl p-8 cursor-pointer hover:scale-[1.02] transition-all group">
              <LayoutTemplate className="mb-4 opacity-80 group-hover:text-indigo-400" size={32} />
              <h3 className="text-2xl font-bold mb-2">Flashcards</h3>
              <p className="text-slate-400 text-sm">{session?.flashcards?.length || 0} cards generated</p>
            </div>
            <div onClick={() => setView('quiz')} className="bg-indigo-600 text-white rounded-3xl p-8 cursor-pointer hover:scale-[1.02] transition-all group">
              <Rocket className="mb-4 opacity-80 group-hover:text-amber-400" size={32} />
              <h3 className="text-2xl font-bold mb-2">Practice Quiz</h3>
              <p className="text-indigo-100 text-sm">{session?.quiz?.length || 0} questions</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Tools</h3>
            <div className="space-y-4">
              <button onClick={() => setView('notes')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-700">
                 Read Notes <ChevronRight size={18} />
              </button>
              <button onClick={() => setView('mindmap')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all font-bold text-slate-700">
                 Mindmap View <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={view} setView={setView} hasData={!!session} />
      <main className="flex-1 overflow-y-auto">
        {view === 'upload' ? (
          <div className="max-w-4xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">JeffreyWoo<span className="text-indigo-600">Study</span></h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">Turn any material into a structured study kit.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 block">Language</label>
                      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700">
                        {languages.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                        Flashcards <Layers size={12} className="text-indigo-400" />
                      </label>
                      <select 
                        value={flashcardCount} 
                        onChange={(e) => setFlashcardCount(Number(e.target.value))} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                      >
                        <option value={5}>5 Cards</option>
                        <option value={10}>10 Cards</option>
                        <option value={15}>15 Cards</option>
                        <option value={20}>20 Cards</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                        Quiz <HelpCircle size={12} className="text-amber-500" />
                      </label>
                      <select 
                        value={quizCount} 
                        onChange={(e) => setQuizCount(Number(e.target.value))} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700"
                      >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 block">Notes Format</label>
                    <select value={style} onChange={(e) => setStyle(e.target.value as StudyStyle)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700">
                      <option value="Cornell">Cornell Method</option>
                      <option value="Summary">Structured Summary</option>
                      <option value="Compact">Compact List</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-white border-2 border-dashed border-indigo-200 rounded-3xl p-8 flex flex-col items-center justify-center group hover:border-indigo-400 transition-all">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">{isProcessing ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}</div>
                <label className="cursor-pointer">
                  <span className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg block mb-4">{isProcessing ? 'Thinking...' : 'Start Analysis'}</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.docx,image/*" disabled={isProcessing} />
                </label>
                <p className="text-xs text-slate-400 font-medium">Try .txt or Screenshots for best results</p>
              </div>
            </div>
            {error && <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-3 font-bold border border-red-100 shadow-sm transition-all animate-in fade-in zoom-in duration-300"><AlertCircle size={24} />{error}</div>}
          </div>
        ) : (
          session && (
            <>
              {view === 'dashboard' && renderDashboard()}
              {view === 'flashcards' && <FlashcardsView cards={session.flashcards || []} />}
              {view === 'notes' && <StudyNotesView notes={session.notes || ""} style={style} cornell={session.cornell} />}
              {view === 'quiz' && <QuizView questions={session.quiz || []} />}
              {view === 'mindmap' && <MindmapView root={session.mindmap} />}
              {view === 'tutor' && <TutorView context={session.originalText} />}
            </>
          )
        )}
      </main>
    </div>
  );
};

export default App;
