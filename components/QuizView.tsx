
import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, Award, RefreshCw, Quote, HelpCircle } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
}

const QuizView: React.FC<QuizViewProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-6 text-center">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <HelpCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">No Quiz Questions</h2>
        <p className="text-slate-500">We couldn't generate a quiz for this material. Try providing more factual content.</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === currentQ.answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowResult(false);
  };

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <Award size={48} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Completed!</h2>
        <p className="text-slate-500 mb-8 text-lg">
          You scored <span className="text-indigo-600 font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span>
        </p>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-12">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Performance Summary</div>
          <div className="flex justify-between items-center px-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{Math.round((score / questions.length) * 100)}%</div>
              <div className="text-xs text-slate-500 uppercase">Accuracy</div>
            </div>
            <div className="w-px h-12 bg-slate-100" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{questions.length}</div>
              <div className="text-xs text-slate-500 uppercase">Total Questions</div>
            </div>
          </div>
        </div>
        <button 
          onClick={restartQuiz}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold mx-auto"
        >
          <RefreshCw size={20} />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Practice Quiz</h2>
          <p className="text-slate-500 mt-1">Test your comprehension immediately</p>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full font-bold">
          Q {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 mb-12">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl font-semibold text-slate-800 leading-tight">
          {currentQ.question}
        </h3>

        <div className="grid gap-4">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQ.answer;
            let bgColor = 'bg-white border-slate-200 hover:border-indigo-400';
            let textColor = 'text-slate-700';
            let icon = null;

            if (isAnswered) {
              if (isCorrect) {
                bgColor = 'bg-green-50 border-green-200 ring-1 ring-green-200';
                textColor = 'text-green-800';
                icon = <CheckCircle2 size={20} className="text-green-600" />;
              } else if (isSelected) {
                bgColor = 'bg-red-50 border-red-200 ring-1 ring-red-200';
                textColor = 'text-red-800';
                icon = <XCircle size={20} className="text-red-600" />;
              }
            } else if (isSelected) {
              bgColor = 'bg-indigo-50 border-indigo-400 ring-1 ring-indigo-400';
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(option)}
                className={`flex justify-between items-center p-5 rounded-2xl border-2 transition-all text-left group ${bgColor}`}
              >
                <span className={`font-medium ${textColor}`}>{option}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Quote size={20} />
              </div>
              <div className="flex-1">
                <p className="text-indigo-900 font-medium mb-3">{currentQ.explanation}</p>
                {currentQ.citation && (
                  <div className="text-sm text-indigo-600/70 font-bold bg-indigo-100/50 inline-block px-3 py-1 rounded-full uppercase tracking-widest">
                    Source: {currentQ.citation}
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={nextQuestion}
              className="w-full mt-6 flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              {currentIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
