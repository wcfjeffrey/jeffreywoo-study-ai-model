import React, { useState } from 'react';
import { CheckCircle, XCircle, HelpCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
}

const QuizView: React.FC<QuizViewProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  // 如果沒有問題，顯示提示
  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center">
        <div className="bg-white rounded-3xl p-12 border border-slate-200">
          <HelpCircle size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Quiz Questions Available</h3>
          <p className="text-slate-400">Try uploading different study material.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    if (answer === currentQuestion.answer) {
      setScore(score + 1);
    }
    if (!completed.includes(currentQuestion.id)) {
      setCompleted([...completed, currentQuestion.id]);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setCompleted([]);
  };

  const isCorrect = selectedAnswer === currentQuestion.answer;

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Practice Quiz</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-slate-500">
            Score: {score}/{questions.length}
          </div>
          <div className="text-sm font-bold text-indigo-600">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-8">
        <div className="mb-8">
          <span className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 block">
            Question {currentIndex + 1}
          </span>
          <p className="text-xl font-bold text-slate-800">{currentQuestion.question}</p>
        </div>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === currentQuestion.answer;

            let buttonStyle = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium";

            if (!selectedAnswer) {
              buttonStyle += " border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50";
            } else if (isSelected) {
              buttonStyle += isCorrect
                ? " border-emerald-500 bg-emerald-50 text-emerald-700"
                : " border-red-500 bg-red-50 text-red-700";
            } else if (isCorrectOption && showExplanation) {
              buttonStyle += " border-emerald-500 bg-emerald-50 text-emerald-700";
            } else {
              buttonStyle += " border-slate-200 opacity-50";
            }

            return (
              <button
                key={idx}
                className={buttonStyle}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
              >
                <span className="inline-block w-6 font-bold">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
                {selectedAnswer === option && (
                  <span className="float-right">
                    {isCorrect ? (
                      <CheckCircle size={20} className="text-emerald-500" />
                    ) : (
                      <XCircle size={20} className="text-red-500" />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedAnswer && !showExplanation && (
          <button
            onClick={() => setShowExplanation(true)}
            className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all"
          >
            Show Explanation
          </button>
        )}

        {showExplanation && (
          <div className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-700 mb-2">Explanation:</h4>
            <p className="text-slate-600">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              selectedAnswer
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Next Question <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
          >
            <RotateCcw size={18} /> Start Over
          </button>
        )}

        {completed.length === questions.length && (
          <div className="text-lg font-bold text-emerald-600">
            🎉 Completed! Final Score: {score}/{questions.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
