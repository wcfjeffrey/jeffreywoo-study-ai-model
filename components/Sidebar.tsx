
import React from 'react';
import { 
  BookOpen, 
  CreditCard, 
  FileText, 
  Network, 
  HelpCircle, 
  MessageSquare, 
  Upload,
  Settings
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  hasData: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, hasData }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: BookOpen, disabled: !hasData },
    { id: 'flashcards', label: 'Flashcards', icon: CreditCard, disabled: !hasData },
    { id: 'notes', label: 'Study Notes', icon: FileText, disabled: !hasData },
    { id: 'mindmap', label: 'Mindmap', icon: Network, disabled: !hasData },
    { id: 'quiz', label: 'Practice Quiz', icon: HelpCircle, disabled: !hasData },
    { id: 'tutor', label: 'AI Tutor', icon: MessageSquare, disabled: !hasData },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col sticky top-0 shadow-sm z-20">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
            <BookOpen className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">JeffreyWooStudy</h1>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setView('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === 'upload' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Upload size={20} />
            <span className="font-medium">New Session</span>
          </button>

          <div className="pt-4 pb-2 px-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Learning Tools</p>
          </div>

          {menuItems.map((item) => (
            <button
              key={item.id}
              disabled={item.disabled}
              onClick={() => setView(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:text-indigo-600 transition-colors">
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
