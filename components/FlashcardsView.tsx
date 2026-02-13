
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Download, Info, LayoutTemplate, RefreshCw } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  cards: Flashcard[];
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-6 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <LayoutTemplate size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Generating Flashcards...</h2>
        <p className="text-slate-500 mb-8">If this message persists, the system was unable to extract enough facts for cards. Try a longer text snippet.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          <RefreshCw size={18} /> New Session
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const exportQuizlet = () => {
    const content = cards.map(c => `"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-kit-quizlet.csv';
    a.click();
  };

  // Helper to replace {words} or [words] with blanks (underlines)
  const formatFront = (text: string) => {
    // Replace {content} and [content] with a series of underscores
    let formatted = text.replace(/\{([^}]+)\}/g, '__________');
    formatted = formatted.replace(/\[([^\]]+)\]/g, '__________');
    
    // Safety: remove any remaining structural markers
    return formatted.replace(/[{}[\]]/g, '');
  };

  // Helper to remove any accidental braces/brackets from the answer
  const formatBack = (text: string) => {
    return text.replace(/[{}[\]]/g, '');
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Flashcards</h2>
          <p className="text-slate-500 mt-1">Active recall using active extraction</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportQuizlet}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Download size={18} />
            Quizlet CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div 
          className="w-full h-96 perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 bg-white border border-slate-200 rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center text-center backface-hidden">
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                  {currentCard.type === 'cloze' ? 'Fill in the Blank' : currentCard.type?.toUpperCase() || 'QA'}
                </span>
              </div>
              
              <div className="w-full">
                <p className="text-2xl font-bold text-slate-800 leading-relaxed mb-6">
                  {formatFront(currentCard.front)}
                </p>
                
                {currentCard.type === 'mcq' && currentCard.options && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {currentCard.options.map((opt, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600">
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="absolute bottom-6 text-slate-400 text-sm font-medium animate-pulse">Click to reveal answer</p>
            </div>
            
            {/* Back */}
            <div className="absolute inset-0 bg-indigo-600 rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
              <span className="absolute top-6 left-6 text-xs font-bold text-white/80 uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Correct Answer</span>
              <div className="w-full px-4">
                 <p className="text-2xl font-bold text-white leading-relaxed mb-4">
                  {formatBack(currentCard.back)}
                </p>
              </div>
              <p className="absolute bottom-6 text-white/60 text-sm font-medium">Click to return to question</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={prevCard} className="p-4 bg-white border border-slate-200 rounded-full hover:border-indigo-400 hover:text-indigo-600 text-slate-600 shadow-sm transition-all">
            <ChevronLeft size={28} />
          </button>
          <div className="bg-slate-200 px-6 py-2 rounded-full text-slate-800 font-black tabular-nums shadow-inner">
            {currentIndex + 1} / {cards.length}
          </div>
          <button onClick={nextCard} className="p-4 bg-white border border-slate-200 rounded-full hover:border-indigo-400 hover:text-indigo-600 text-slate-600 shadow-sm transition-all">
            <ChevronRight size={28} />
          </button>
        </div>

        <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 mb-1">Study Tip</h4>
            <p className="text-sm text-indigo-800/80 leading-relaxed">
              For <strong>Fill in the Blank</strong> cards, the __________ represents a key concept hidden in brackets. 
              Try saying the answer out loud before flipping!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsView;
