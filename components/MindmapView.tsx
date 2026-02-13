
import React, { useState } from 'react';
import { Network, Download, ChevronRight, Share2, Eye, Copy, Check, Code, ListOrdered } from 'lucide-react';
import { MindmapNode } from '../types';

interface MindmapViewProps {
  root: MindmapNode;
}

const TreeBranch: React.FC<{ node: MindmapNode; depth: number; isLast: boolean }> = ({ node, depth, isLast }) => {
  const getStyles = (d: number) => {
    switch (d) {
      case 0: return 'bg-indigo-600 text-white border-indigo-700 shadow-xl ring-4 ring-indigo-100 text-lg font-black';
      case 1: return 'bg-white text-indigo-700 border-indigo-200 shadow-md font-bold text-base hover:bg-indigo-50/30';
      case 2: return 'bg-slate-50 text-slate-800 border-slate-200 shadow-sm text-sm font-semibold hover:border-indigo-300';
      default: return 'bg-white text-slate-600 border-slate-100 shadow-none text-xs font-normal hover:bg-slate-50';
    }
  };

  const getLabelSuffix = (d: number) => {
    if (d === 1) return <span className="ml-2 text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase font-black tracking-tight">Main Branch</span>;
    if (d === 2) return <span className="ml-2 text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black tracking-tight">Sub-branch</span>;
    if (d >= 3) return <span className="ml-2 text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-black tracking-tight">Detail</span>;
    return null;
  };

  return (
    <div className="relative pl-10 md:pl-12 transition-all">
      {/* Horizontal Connector Line */}
      {depth > 0 && (
        <div className="absolute left-0 top-7 w-10 md:w-12 h-px bg-slate-200" />
      )}
      
      {/* Vertical Parent Connector Line */}
      {depth > 0 && !isLast && (
        <div className="absolute left-0 top-7 bottom-[-2.5rem] w-px bg-slate-200" />
      )}

      {/* Vertical Corner Connector (for last items) */}
      {depth > 0 && isLast && (
        <div className="absolute left-0 top-0 h-7 w-px bg-slate-200" />
      )}

      <div className="flex items-center gap-3 group mt-8 first:mt-0">
        <div className={`relative flex items-center gap-3 p-4 px-5 rounded-2xl border transition-all hover:translate-x-1 hover:shadow-lg cursor-default ${getStyles(depth)}`}>
          {depth > 0 && <ChevronRight size={14} className="opacity-30 group-hover:opacity-60 transition-opacity" />}
          <span className="whitespace-normal leading-snug">{node.label}</span>
          {getLabelSuffix(depth)}
          
          {/* Node Dot Indicator */}
          <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 ${depth === 0 ? 'bg-indigo-400' : 'bg-slate-300'}`} />
        </div>
      </div>

      {node.children && node.children.length > 0 && (
        <div className="mt-2 space-y-4">
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
  const [activeMode, setActiveMode] = useState<'visual' | 'mermaid' | 'numbered'>('visual');
  const [copied, setCopied] = useState(false);

  // Generates a simple numbered plain text mindmap (1., 1.1, etc.)
  const generateNumberedOutline = (node: MindmapNode, currentNumber: string = '', depth: number = 0): string => {
    if (depth === 0) {
      let result = node.label.toUpperCase() + '\n\n';
      if (node.children) {
        node.children.forEach((child, index) => {
          result += generateNumberedOutline(child, `${index + 1}`, 1);
        });
      }
      return result;
    }

    const indent = '   '.repeat(depth - 1);
    let result = `${indent}${currentNumber}. ${node.label}\n`;

    if (node.children && node.children.length > 0) {
      node.children.forEach((child, index) => {
        result += generateNumberedOutline(child, `${currentNumber}.${index + 1}`, depth + 1);
      });
    }
    return result;
  };

  // Generates Mermaid.js mindmap syntax
  const generateMermaidCode = (node: MindmapNode, depth: number = 1): string => {
    let result = '';
    if (depth === 1) {
      result = 'mindmap\n  root((' + node.label.replace(/[()]/g, '') + '))\n';
    } else {
      const indent = '  '.repeat(depth);
      result = indent + node.label.replace(/[()]/g, '') + '\n';
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        result += generateMermaidCode(child, depth + 1);
      });
    }
    return result;
  };

  const copyToClipboard = () => {
    let text = '';
    if (activeMode === 'mermaid') text = generateMermaidCode(root);
    else if (activeMode === 'numbered') text = generateNumberedOutline(root);
    
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadText = () => {
    let text = '';
    let ext = 'txt';
    if (activeMode === 'mermaid') { text = generateMermaidCode(root); ext = 'mmd'; }
    else if (activeMode === 'numbered') text = generateNumberedOutline(root);

    if (text) {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmap-${activeMode}.${ext}`;
      a.click();
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Share2 size={24} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Mindmap</h2>
          </div>
          <p className="text-slate-500 ml-1">Hierarchical visualization of key categories and details</p>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto print:hidden">
            <button 
              onClick={() => setActiveMode('visual')}
              className={`flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMode === 'visual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Eye size={16} /> Visual
            </button>
            <button 
              onClick={() => setActiveMode('numbered')}
              className={`flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMode === 'numbered' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListOrdered size={16} /> Numbered
            </button>
            <button 
              onClick={() => setActiveMode('mermaid')}
              className={`flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMode === 'mermaid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Code size={16} /> Mermaid
            </button>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {activeMode !== 'visual' && (
              <button 
                onClick={copyToClipboard}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all text-sm font-bold shadow-sm"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            )}
            <button 
              onClick={activeMode === 'visual' ? () => window.print() : downloadText}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm print:hidden"
            >
              <Download size={18} />
              {activeMode === 'visual' ? 'Export PDF' : 'Download File'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-16 min-h-[600px] border border-slate-200 shadow-sm overflow-x-auto print:shadow-none print:border-none">
        {root && root.label ? (
          activeMode === 'visual' ? (
            <div className="min-w-fit">
              <div className="mb-12">
                 <div className="inline-flex items-center gap-4 bg-indigo-600 text-white p-6 px-10 rounded-3xl border-4 border-indigo-700 shadow-2xl relative z-10 font-black text-2xl tracking-tight">
                  <Network size={28} className="opacity-80" />
                  <div>
                    {root.label}
                    <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded mt-1 font-black uppercase tracking-widest text-white/90">Main Topic (Root)</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                {root.children?.map((child, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-12 top-0 bottom-0 w-px bg-slate-100 last:h-0" />
                    <TreeBranch 
                      node={child} 
                      depth={1} 
                      isLast={idx === root.children!.length - 1} 
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : activeMode === 'numbered' ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Numbered Plain Text Outline</h3>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:inline">AI Studio Optimized</span>
              </div>
              <div className="relative group">
                <pre className="whitespace-pre-wrap font-mono text-slate-700 leading-relaxed bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-sm overflow-auto max-h-[700px] text-sm md:text-base selection:bg-indigo-100">
                  {generateNumberedOutline(root)}
                </pre>
              </div>
              <p className="mt-6 text-sm text-slate-400 italic text-center">
                Numbered format (1., 1.1) provides the cleanest hierarchical rendering for plain-text AI prompts.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800">Mermaid.js Mindmap Code</h3>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Diagram Code</span>
              </div>
              <div className="relative group">
                <pre className="whitespace-pre-wrap font-mono text-indigo-100 leading-relaxed bg-indigo-950 p-8 md:p-12 rounded-3xl shadow-2xl overflow-auto max-h-[700px] text-sm md:text-base selection:bg-white/20">
                  {generateMermaidCode(root)}
                </pre>
              </div>
              <p className="mt-6 text-sm text-slate-400 italic text-center">
                Copy this code and paste it into Google AI Studio to render the diagram.
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Network size={48} className="opacity-20 animate-pulse" />
            </div>
            <p className="font-bold text-slate-600 text-lg">Synthesizing hierarchy...</p>
            <p className="text-sm mt-2 max-w-sm text-center leading-relaxed text-slate-400">
              Applying logical rules: 3-5 word labels, parallel structures, and nested branches.
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Main Topic</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-3 h-3 rounded-full bg-white border border-indigo-200 ring-4 ring-indigo-50" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-3 h-3 rounded-full bg-slate-200 ring-4 ring-slate-50" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub-branch</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Detail</span>
        </div>
      </div>
    </div>
  );
};

export default MindmapView;
