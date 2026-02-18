import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Layers } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  cards: Flashcard[];
}

// 處理 cloze 文本，將 [word] 轉換為底線
const formatClozeText = (text: string): { displayText: string; answer: string } => {
  // 匹配 [任何內容] 的模式
  const regex = /\[(.*?)\]/g;
  const matches = [...text.matchAll(regex)];

  if (matches.length === 0) {
    return { displayText: text, answer: '' };
  }

  // 獲取第一個匹配的答案
  const answer = matches[0][1];
  const displayText = text.replace(regex, ' __________ ');

  return { displayText, answer };
};

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // 如果沒有卡片，顯示提示
  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200">
          <Layers size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Flashcards Available</h3>
          <p className="text-slate-400">Try uploading different study material.</p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  // 根據卡片類型處理顯示內容
  const getFrontContent = () => {
    if (currentCard.type === 'cloze') {
      const { displayText } = formatClozeText(currentCard.front);
      return displayText;
    }
    return currentCard.front;
  };

  const getBackContent = () => {
    if (currentCard.type === 'cloze') {
      const { answer } = formatClozeText(currentCard.front);
      return answer || currentCard.back;
    }
    return currentCard.back;
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setIsFlipped(false);
  };

  // 獲取卡片類型標籤
  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'qa': return 'Q&A';
      case 'cloze': return 'Fill in the Blank';
      case 'mcq': return 'Multiple Choice';
      default: return type;
    }
  };

  // 獲取卡片類型顏色
  const getTypeColor = (type: string) => {
    switch(type) {
      case 'qa': return 'bg-blue-100 text-blue-600';
      case 'cloze': return 'bg-purple-100 text-purple-600';
      case 'mcq': return 'bg-amber-100 text-amber-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Flashcards</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-black px-2 py-1 rounded-full ${getTypeColor(currentCard.type)}`}>
              {getTypeLabel(currentCard.type)}
            </span>
          </div>
        </div>
        <div className="text-sm font-bold text-slate-500">
          {currentIndex + 1} / {cards.length} cards
        </div>
      </div>

      <div
        className="perspective-1000 cursor-pointer mb-8"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative preserve-3d transition-transform duration-500 min-h-[400px] ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="backface-hidden absolute inset-0 bg-white rounded-3xl p-12 flex flex-col items-center justify-center border-2 border-indigo-100 shadow-xl">
            <span className="text-sm font-bold text-indigo-600 mb-4">FRONT</span>

            {/* 卡片正面內容 */}
            <div className="text-2xl font-bold text-slate-800 text-center">
              {currentCard.type === 'cloze' ? (
                <div>
                  {/* 將文本分段顯示，保持底線格式 */}
                  {getFrontContent().split('*__________*').map((part, index, array) => (
                    <React.Fragment key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <span className="inline-block border-b-4 border-indigo-300 w-32 mx-2 align-middle" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                getFrontContent()
              )}
            </div>

            {/* MCQ 選項 */}
            {currentCard.type === 'mcq' && currentCard.options && (
              <div className="mt-6 space-y-2 w-full max-w-md">
                {currentCard.options.map((opt, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl text-slate-600 text-left">
                    <span className="inline-block w-6 font-bold text-indigo-600">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </div>
                ))}
              </div>
            )}

            {/* 提示用戶點擊翻轉 */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-xs text-slate-400">Click to flip</span>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-indigo-600 rounded-3xl p-12 flex flex-col items-center justify-center border-2 border-indigo-700 shadow-xl">
            <span className="text-sm font-bold text-indigo-200 mb-4">BACK</span>

            {/* 卡片背面內容 */}
            <div className="text-2xl font-bold text-white text-center">
              {currentCard.type === 'cloze' ? (
                <div>
                  <span className="bg-indigo-500 px-4 py-2 rounded-lg inline-block">
                    {getBackContent()}
                  </span>
                </div>
              ) : (
                getBackContent()
              )}
            </div>

            {/* MCQ 顯示正確答案 */}
            {currentCard.type === 'mcq' && (
              <div className="mt-6 p-4 bg-indigo-500 rounded-xl">
                <p className="text-white/80 text-sm mb-1">Correct Answer:</p>
                <p className="text-white font-bold text-lg">{currentCard.back}</p>
              </div>
            )}

            {/* 提示用戶點擊翻轉 */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-xs text-indigo-200">Click to flip back</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrev}
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={cards.length <= 1}
        >
          <ChevronLeft size={24} className="text-slate-600" />
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
        >
          <RotateCw size={20} /> Flip Card
        </button>

        <button
          onClick={handleNext}
          className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={cards.length <= 1}
        >
          <ChevronRight size={24} className="text-slate-600" />
        </button>
      </div>

      {/* 卡片計數器 */}
      <div className="mt-8 flex justify-center gap-2">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentIndex(idx);
              setIsFlipped(false);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex 
                ? 'w-6 bg-indigo-600' 
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FlashcardsView;
