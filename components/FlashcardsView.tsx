
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Download, Info, LayoutTemplate } from 'lucide-react';
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
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <LayoutTemplate size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Flashcards Available</h2>
        <p className="text-slate-500">We couldn't generate flashcards for this content. Try uploading more detailed material.</p>
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
    const content = cards.map(c => `"${c.front}","${c.back}"`).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-kit-quizlet.csv';
    a.click();
  };

  // Helper to replace {words} with blanks
  const formatFront = (text: string) => {
    return text.replace(/\{([^}]+)\}/g, '_______');
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Flashcards</h2>
          <p className="text-slate-500 mt-1">Multi-format active recall</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportQuizlet}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
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
                  {currentCard.type === 'cloze' ? 'Cloze' : currentCard.type?.toUpperCase() || 'QA'}
                </span>
                {currentCard.citation && (
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{currentCard.citation}</span>
                )}
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
              
              <p className="absolute bottom-6 text-slate-400 text-sm italic animate-pulse">Click to reveal answer</p>
            </div>
            
            {/* Back */}
            <div className="absolute inset-0 bg-indigo-600 rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180">
              <span className="absolute top-6 left-6 text-xs font-bold text-white/80 uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Correct Answer</span>
              <div className="w-full px-4">
                 <p className="text-2xl font-bold text-white leading-relaxed mb-4">
                  {currentCard.back}
                </p>
              </div>
              <p className="absolute bottom-6 text-white/60 text-sm italic">Click to return to question</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={prevCard} className="p-4 bg-white border border-slate-200 rounded-full hover:border-indigo-400 text-slate-600 shadow-sm"><ChevronLeft size={28} /></button>
          <div className="bg-slate-200 px-6 py-2 rounded-full text-slate-600 font-bold tabular-nums">{currentIndex + 1} / {cards.length}</div>
          <button onClick={nextCard} className="p-4 bg-white border border-slate-200 rounded-full hover:border-indigo-400 text-slate-600 shadow-sm"><ChevronRight size={28} /></button>
        </div>

        <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-1">Active Recall Tip</h4>
            <p className="text-sm text-amber-800/80 leading-relaxed">
              If this is a <strong>Cloze Deletion</strong> card, try to write down the missing word before flipping. 
              The blank represents a key term from your study material.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsView;
