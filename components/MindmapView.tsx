
import React, { useState } from 'react';
import { Network, Download, ChevronRight, Share2, List, Eye, Copy, Check } from 'lucide-react';
import { MindmapNode } from '../types';

interface MindmapViewProps {
  root: MindmapNode;
}

const TreeBranch: React.FC<{ node: MindmapNode; depth: number; isLast: boolean }> = ({ node, depth, isLast }) => {
  const getStyles = (d: number) => {
    switch (d) {
      case 0: return 'bg-indigo-600 text-white border-indigo-700 shadow-xl ring-4 ring-indigo-100 text-lg font-black';
      case 1: return 'bg-white text-indigo-700 border-indigo-200 shadow-md font-bold text-base';
      case 2: return 'bg-slate-50 text-slate-800 border-slate-200 shadow-sm text-sm font-semibold';
      default: return 'bg-white text-slate-600 border-slate-100 shadow-none text-xs font-normal';
    }
  };

  const getLabelSuffix = (d: number) => {
    if (d === 1) return <span className="ml-2 text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded uppercase font-black tracking-tighter">Main Topic</span>;
    if (d === 2) return <span className="ml-2 text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded uppercase font-black tracking-tighter">Subtopic</span>;
    return null;
  };

  return (
    <div className="relative pl-12 transition-all">
      {/* Horizontal Connector Line */}
      {depth > 0 && (
        <div className="absolute left-0 top-7 w-12 h-px bg-slate-300" />
      )}
      
      {/* Vertical Parent Connector Line */}
      {depth > 0 && !isLast && (
        <div className="absolute left-0 top-7 bottom-[-2rem] w-px bg-slate-300" />
      )}

      {/* Vertical Corner Connector (for last items) */}
      {depth > 0 && isLast && (
        <div className="absolute left-0 top-0 h-7 w-px bg-slate-300" />
      )}

      <div className="flex items-center gap-3 group mt-8 first:mt-0">
        <div className={`relative flex items-center gap-3 p-4 px-6 rounded-2xl border transition-all hover:translate-x-1 hover:shadow-lg ${getStyles(depth)}`}>
          {depth > 0 && <ChevronRight size={14} className="opacity-40" />}
          <span className="whitespace-normal leading-snug">{node.label}</span>
          {getLabelSuffix(depth)}
          
          {/* Node Dot */}
          <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${depth === 0 ? 'bg-indigo-400' : 'bg-slate-300'}`} />
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="mt-2">
          {node.children.map((child, idx) => (
            <TreeBranch 
              key={idx} 
              node={child} 
              depth={depth + 1} 
              isLast={idx === node.children!.length - 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MindmapView: React.FC<MindmapViewProps> = ({ root }) => {
  const [activeMode, setActiveMode] = useState<'visual' | 'text'>('visual');
  const [copied, setCopied] = useState(false);

  const generateOutline = (node: MindmapNode, depth: number = 0): string => {
    const indent = '  '.repeat(depth);
    if (depth === 0) {
      let result = `Central Idea: ${node.label}\n`;
      if (node.children) {
        node.children.forEach(child => {
          result += generateOutline(child, depth + 1);
        });
      }
      return result;
    } else {
      let result = `${indent}- ${node.label}\n`;
      if (node.children) {
        node.children.forEach(child => {
          result += generateOutline(child, depth + 1);
        });
      }
      return result;
    }
  };

  const copyToClipboard = () => {
    const text = generateOutline(root);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const text = generateOutline(root);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap-outline.txt';
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex justify-between items-end mb-12">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Share2 size={24} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Mindmap</h2>
          </div>
          <p className="text-slate-500 ml-13">Hierarchical tree diagram of central ideas and topics</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl print:hidden">
            <button 
              onClick={() => setActiveMode('visual')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMode === 'visual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Eye size={16} /> Visual
            </button>
            <button 
              onClick={() => setActiveMode('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={16} /> Outline
            </button>
          </div>
          <div className="flex gap-3">
            {activeMode === 'text' && (
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all text-sm font-bold shadow-sm"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Outline'}
              </button>
            )}
            <button 
              onClick={activeMode === 'visual' ? () => window.print() : downloadText}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm print:hidden"
            >
              <Download size={18} />
              {activeMode === 'visual' ? 'Export PDF' : 'Download TXT'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 md:p-16 min-h-[600px] border border-slate-200 shadow-sm overflow-x-auto print:shadow-none print:border-none">
        {root && root.label ? (
          activeMode === 'visual' ? (
            <div className="min-w-fit">
              {/* Tree Root */}
              <div className="mb-12">
                 <div className="inline-flex items-center gap-4 bg-indigo-600 text-white p-6 px-10 rounded-3xl border-4 border-indigo-700 shadow-2xl relative z-10 font-black text-2xl tracking-tight">
                  <Network size={28} className="opacity-80" />
                  <div>
                    {root.label}
                    <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded mt-1 font-black uppercase tracking-widest text-white/90">Central Idea</div>
                  </div>
                </div>
              </div>

              {/* Tree Structure */}
              <div className="flex flex-col gap-8">
                {root.children?.map((child, idx) => (
                  <div key={idx} className="relative">
                    {/* Line from root section down */}
                    <div className="absolute -left-12 top-0 bottom-0 w-px bg-slate-200 last:h-0" />
                    <TreeBranch 
                      node={child} 
                      depth={1} 
                      isLast={idx === root.children!.length - 1} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Mindmap Text Outline</h3>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Copy to tools like MindMeister or XMind</span>
              </div>
              <div className="relative group">
                <pre className="whitespace-pre-wrap font-mono text-slate-700 leading-relaxed bg-slate-50 p-10 rounded-3xl border border-slate-100 shadow-inner overflow-auto max-h-[700px]">
                  {generateOutline(root)}
                </pre>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Network size={48} className="opacity-20 animate-pulse" />
            </div>
            <p className="font-bold text-slate-600 text-lg">Extracting hierarchy...</p>
            <p className="text-sm mt-2 max-w-sm text-center leading-relaxed text-slate-400">
              Identifying the central idea, main topics, and specific subtopics from your study material.
            </p>
          </div>
        )}
      </div>

      {activeMode === 'visual' && (
        <div className="mt-10 flex flex-wrap gap-6 print:hidden">
          <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Central Idea</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-3 h-3 rounded-full bg-indigo-400 ring-4 ring-indigo-50" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Main Topic</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-3 h-3 rounded-full bg-slate-300 ring-4 ring-slate-50" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subtopic</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindmapView;
