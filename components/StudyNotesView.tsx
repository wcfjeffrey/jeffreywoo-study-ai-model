
import React from 'react';
import { FileText, Copy, Printer, Download } from 'lucide-react';
import { StudyStyle, CornellNotes } from '../types';

interface StudyNotesViewProps {
  notes: string;
  style: StudyStyle;
  cornell?: CornellNotes;
}

const StudyNotesView: React.FC<StudyNotesViewProps> = ({ notes, style, cornell }) => {
  const exportPDF = () => {
    window.print();
  };

  const renderCornell = () => {
    if (!cornell) return <div>No Cornell structure found.</div>;
    return (
      <div className="border-2 border-slate-800 rounded-lg overflow-hidden bg-white">
        <div className="flex border-b-2 border-slate-800 min-h-[500px]">
          {/* Cues Column */}
          <div className="w-1/3 border-r-2 border-slate-800 p-6 bg-slate-50">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Cues & Questions</h4>
            <div className="space-y-8">
              {cornell.cues.map((cue, i) => (
                <p key={i} className="font-bold text-slate-800 text-sm italic">{cue}</p>
              ))}
            </div>
          </div>
          {/* Notes Column */}
          <div className="w-2/3 p-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Notes</h4>
            <div className="space-y-6">
              {cornell.notes.map((note, i) => (
                <p key={i} className="text-slate-700 leading-relaxed border-b border-slate-100 pb-2">{note}</p>
              ))}
            </div>
          </div>
        </div>
        {/* Summary Row */}
        <div className="p-6 bg-indigo-50 border-t-2 border-slate-800">
          <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3">Summary</h4>
          <p className="text-indigo-900 font-medium">{cornell.summary}</p>
        </div>
      </div>
    );
  };

  const renderStandard = () => (
    <div className="prose prose-slate max-w-none bg-white p-10 border border-slate-200 rounded-3xl shadow-sm">
      {notes.split('\n').map((line, idx) => {
        if (line.startsWith('# ')) return <h1 key={idx} className="text-3xl font-bold text-slate-900 mb-6">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-bold text-slate-800 mt-10 mb-4">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold text-slate-800 mt-8 mb-3">{line.slice(4)}</h3>;
        if (line.startsWith('- ')) return <li key={idx} className="text-slate-700 ml-4 mb-2">{line.slice(2)}</li>;
        if (line.startsWith('|')) return <div key={idx} className="font-mono text-sm bg-slate-50 p-2 my-1 overflow-x-auto">{line}</div>;
        if (line.trim() === '') return <br key={idx} />;
        return <p key={idx} className="text-slate-700 leading-relaxed mb-4">{line}</p>;
      })}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 print:p-0">
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Study Notes</h2>
          <p className="text-slate-500 mt-1">Formatted as: <span className="font-bold text-indigo-600">{style}</span></p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {style === 'Cornell' ? renderCornell() : renderStandard()}
    </div>
  );
};

export default StudyNotesView;
