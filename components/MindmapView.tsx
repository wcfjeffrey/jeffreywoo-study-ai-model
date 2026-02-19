import React, { useState, useEffect, useRef } from 'react';
import { Network, Download, ChevronRight, Share2, Copy, Check, ListOrdered, GitMerge, RefreshCw, ZoomIn, ZoomOut, Maximize2, Hand } from 'lucide-react';
import { MindmapNode } from '../types';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'monospace',
  themeVariables: {
    'primaryColor': '#4f46e5',
    'primaryTextColor': '#ffffff',
    'primaryBorderColor': '#3730a3',
    'lineColor': '#94a3b8',
    'secondaryColor': '#f1f5f9',
    'tertiaryColor': '#ffffff',
    'clusterBkg': '#ffffff',
    'clusterBorder': '#e2e8f0'
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
    padding: 20
  }
});

interface MindmapViewProps {
  root: MindmapNode;
}

const COLORS = {
  root: {
    bg: 'bg-gradient-to-br from-purple-600 to-purple-700',
    border: 'border-purple-800',
    text: 'text-white',
    shadow: 'shadow-purple-200',
    dot: 'bg-purple-400',
    light: 'bg-purple-50'
  },
  level1: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    border: 'border-blue-700',
    text: 'text-white',
    shadow: 'shadow-blue-200',
    dot: 'bg-blue-400',
    light: 'bg-blue-50'
  },
  level2: {
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    border: 'border-emerald-700',
    text: 'text-white',
    shadow: 'shadow-emerald-200',
    dot: 'bg-emerald-400',
    light: 'bg-emerald-50'
  },
  level3: {
    bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    border: 'border-amber-700',
    text: 'text-white',
    shadow: 'shadow-amber-200',
    dot: 'bg-amber-400',
    light: 'bg-amber-50'
  }
};

const generateMermaidCode = (node: MindmapNode): string => {
  let result = 'graph TD\n';

  const processNode = (n: MindmapNode, parentId: string = 'root', depth: number = 0): string => {
    let code = '';
    const nodeId = `n${depth}_${n.label.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;

    switch(depth) {
      case 0:
        code += `    ${nodeId}(${n.label})\n`;
        code += `    style ${nodeId} fill:#9333ea,stroke:#6b21a8,stroke-width:4px,color:#fff\n`;
        break;
      case 1:
        code += `    ${nodeId}[${n.label}]\n`;
        code += `    style ${nodeId} fill:#3b82f6,stroke:#1e40af,stroke-width:3px,color:#fff\n`;
        break;
      case 2:
        code += `    ${nodeId}(${n.label})\n`;
        code += `    style ${nodeId} fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff\n`;
        break;
      default:
        code += `    ${nodeId}["${n.label}"]\n`;
        code += `    style ${nodeId} fill:#f59e0b,stroke:#b45309,stroke-width:1px,color:#fff\n`;
    }

    if (parentId !== 'root') {
      code += `    ${parentId} --> ${nodeId}\n`;
    }

    if (n.children && n.children.length > 0) {
      n.children.forEach(child => {
        code += processNode(child, nodeId, depth + 1);
      });
    }

    return code;
  };

  result += processNode(node);
  return result;
};

const generateSimpleMindmapCode = (node: MindmapNode): string => {
  let result = 'mindmap\n';

  const processNode = (n: MindmapNode, depth: number = 0): string => {
    const indent = '  '.repeat(depth + 1);
    let code = '';

    if (depth === 0) {
      code += `${indent}root((${n.label}))\n`;
    } else {
      code += `${indent}${n.label}\n`;
    }

    if (n.children && n.children.length > 0) {
      n.children.forEach(child => {
        code += processNode(child, depth + 1);
      });
    }

    return code;
  };

  result += processNode(node);
  return result;
};

const TreeBranch: React.FC<{ node: MindmapNode; depth: number; isLast: boolean }> = ({ node, depth, isLast }) => {
  const getColorScheme = (d: number) => {
    switch (d) {
      case 0: return COLORS.root;
      case 1: return COLORS.level1;
      case 2: return COLORS.level2;
      default: return COLORS.level3;
    }
  };

  const colors = getColorScheme(depth);

  const getConnectorColor = (d: number) => {
    switch(d) {
      case 1: return 'bg-blue-300';
      case 2: return 'bg-emerald-300';
      default: return 'bg-amber-300';
    }
  };

  const getVerticalColor = (d: number) => {
    switch(d) {
      case 1: return 'bg-blue-200';
      case 2: return 'bg-emerald-200';
      default: return 'bg-amber-200';
    }
  };

  return (
    <div className="relative pl-10 md:pl-12 transition-all">
      {depth > 0 && (
        <div className={`absolute left-0 top-7 w-10 md:w-12 h-0.5 ${getConnectorColor(depth)}`} />
      )}

      {depth > 0 && !isLast && (
        <div className={`absolute left-0 top-7 bottom-[-2.5rem] w-0.5 ${getVerticalColor(depth)}`} />
      )}

      {depth > 0 && isLast && (
        <div className={`absolute left-0 top-0 h-7 w-0.5 ${getVerticalColor(depth)}`} />
      )}

      <div className="flex items-center gap-3 group mt-8 first:mt-0">
        <div className={`
          relative flex items-center gap-3 p-4 px-5 rounded-2xl border-2 
          transition-all hover:translate-x-1 hover:shadow-xl cursor-default
          ${colors.bg} ${colors.border} ${colors.text} ${colors.shadow}
          ${depth === 0 ? 'text-lg font-black shadow-2xl ring-4 ring-purple-100' : 
            depth === 1 ? 'text-base font-bold' : 
            depth === 2 ? 'text-sm font-semibold' : 
            'text-xs font-medium'}
        `}>
          {depth > 0 && <ChevronRight size={14} className="opacity-50 group-hover:opacity-80 transition-opacity" />}
          <span className="whitespace-normal leading-snug">{node.label}</span>
          <div className={`
            absolute -left-1.5 top-1/2 -translate-y-1/2 
            w-3 h-3 rounded-full border-2 border-white shadow-md 
            transition-transform group-hover:scale-125
            ${colors.dot}
          `} />
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
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 10.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomTo200 = () => setScale(2.0);
  const zoomTo300 = () => setScale(3.0);
  const zoomTo400 = () => setScale(4.0);
  const zoomTo500 = () => setScale(5.0);
  const zoomTo600 = () => setScale(6.0);
  const zoomTo700 = () => setScale(7.0);
  const zoomTo800 = () => setScale(8.0);
  const zoomTo900 = () => setScale(9.0);
  const zoomTo1000 = () => setScale(10.0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeMode !== 'mermaid') return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activeMode !== 'mermaid') return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const renderMermaidDiagram = async () => {
    if (!root) return;

    setIsRendering(true);
    setRenderError(null);
    setPosition({ x: 0, y: 0 });

    try {
      const code = generateMermaidCode(root);
      setMermaidCode(code);

      if (!mermaidRef.current) {
        throw new Error('Mermaid container not found');
      }

      mermaidRef.current.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.className = 'mermaid';
      wrapper.textContent = code;
      mermaidRef.current.appendChild(wrapper);

      try {
        await mermaid.run({
          nodes: [wrapper],
          suppressErrors: true
        });
      } catch (renderErr) {
        console.warn('Flowchart render failed, trying mindmap format:', renderErr);

        const simpleCode = generateSimpleMindmapCode(root);
        wrapper.textContent = simpleCode;

        await mermaid.run({
          nodes: [wrapper],
          suppressErrors: true
        });
      }

      console.log('Mermaid diagram rendered successfully');

    } catch (error) {
      console.error('Mermaid render error:', error);
      setRenderError('Failed to render diagram. Using fallback text format.');

      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = `
          <div class="p-8 text-center">
            <p class="text-red-600 mb-4">Failed to render diagram</p>
            <pre class="text-left bg-slate-50 p-4 rounded-lg overflow-auto max-h-96 text-xs">
              ${generateSimpleMindmapCode(root)}
            </pre>
          </div>
        `;
      }
    } finally {
      setIsRendering(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'mermaid' && root) {
      setTimeout(() => {
        renderMermaidDiagram();
      }, 100);
    }
  }, [activeMode, root]);

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

  const downloadSVG = () => {
    if (mermaidRef.current) {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmap-${Date.now()}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  const downloadText = () => {
    let text = '';
    let filename = '';

    if (activeMode === 'numbered') {
      text = generateNumberedOutline(root);
      filename = `outline-${Date.now()}.txt`;
    } else if (activeMode === 'mermaid') {
      text = mermaidCode;
      filename = `mindmap-${Date.now()}.mmd`;
    }

    if (text) {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderMermaidPreview = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <GitMerge size={20} className="text-indigo-600" />
          Interactive Mermaid Mindmap
        </h3>
        <div className="flex gap-2">
          <button
            onClick={renderMermaidDiagram}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all text-sm font-bold"
            disabled={isRendering}
          >
            <RefreshCw size={16} className={isRendering ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {renderError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          {renderError}
        </div>
      )}

      <div
        className="relative group overflow-hidden rounded-3xl border border-slate-200"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Control panel */}
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 min-w-[200px]">
          <div className="flex flex-col gap-2">
            {/* Main zoom controls */}
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={zoomOut}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-all text-indigo-600"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>
              <span className="text-sm font-bold text-slate-700 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-all text-indigo-600"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={resetZoom}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-all text-indigo-600 ml-1"
                title="Reset View"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Drag tip */}
        <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2">
          <Hand size={16} className="text-indigo-600" />
          <span>Click and drag to move</span>
        </div>

        {/* Current zoom level indicator */}
        <div className="absolute bottom-4 right-4 z-20 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
          {Math.round(scale * 100)}%
        </div>

        {isRendering ? (
          <div className="flex items-center justify-center h-96 bg-slate-50">
            <div className="text-center">
              <RefreshCw size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-slate-600">Rendering diagram...</p>
            </div>
          </div>
        ) : (
          <div
            className="bg-white p-4 min-h-[600px] transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center',
              willChange: 'transform'
            }}
          >
            <div ref={mermaidRef} />
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="font-bold text-slate-700 mb-2">Color Guide</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-600" />
              <span className="text-sm text-slate-600">Root / Main Topic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm text-slate-600">Main Branch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-sm text-slate-600">Sub-branch</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm text-slate-600">Detail</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h4 className="font-bold text-slate-700 mb-2">Mermaid Code</h4>
          <pre className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200 overflow-auto max-h-32">
            {mermaidCode || 'Generating code...'}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(mermaidCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-2 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-400 italic text-center">
        Interactive diagram generated with Mermaid.js. Use zoom controls (up to 1000%) and drag to navigate.
      </p>
    </div>
  );

  const renderNumberedOutline = () => {
    const outline = generateNumberedOutline(root);
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ListOrdered size={20} className="text-indigo-600" />
            Numbered Plain Text Outline
          </h3>
        </div>
        <div className="relative group">
          <pre className="whitespace-pre-wrap font-mono text-slate-700 leading-relaxed bg-gradient-to-br from-white to-slate-50 border border-slate-200 p-8 md:p-12 rounded-3xl shadow-sm overflow-auto max-h-[700px] text-sm md:text-base selection:bg-indigo-100">
            {outline}
          </pre>
        </div>
        <p className="mt-6 text-sm text-slate-400 italic text-center">
          Numbered format (1., 1.1, 1.1.1) provides clear hierarchical structure.
        </p>
      </div>
    );
  };

  const renderVisualMindmap = () => (
    <div className="min-w-fit">
      <div className="mb-12">
        <div className={`
          inline-flex items-center gap-4 
          ${COLORS.root.bg} ${COLORS.root.border} ${COLORS.root.text} ${COLORS.root.shadow}
          p-6 px-10 rounded-3xl border-4 shadow-2xl relative z-10 
          font-black text-2xl tracking-tight
        `}>
          <Network size={28} className="opacity-80" />
          <div>{root.label}</div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {root.children?.map((child, idx) => (
          <div key={idx} className="relative">
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
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Share2 size={24} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Mindmap Studio</h2>
          </div>
          <p className="text-slate-500 ml-1">Choose your preferred format: Visual, Numbered, or Interactive Mermaid</p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto print:hidden">
            <button
              onClick={() => setActiveMode('visual')}
              className={`flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeMode === 'visual' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Network size={16} /> Visual
            </button>
            <button
              onClick={() => setActiveMode('numbered')}
              className={`flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeMode === 'numbered' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ListOrdered size={16} /> Numbered
            </button>
            <button
              onClick={() => setActiveMode('mermaid')}
              className={`flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeMode === 'mermaid' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <GitMerge size={16} /> Interactive
            </button>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {/* Copy Text button is only displayed in Numbered mode */}
            {activeMode === 'numbered' && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateNumberedOutline(root));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all text-sm font-bold shadow-sm"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            )}

            {/* Download button */}
            <button
              onClick={() => {
                if (activeMode === 'visual') {
                  window.print();
                } else if (activeMode === 'mermaid') {
                  downloadSVG();
                } else {
                  downloadText();
                }
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-sm font-bold shadow-sm print:hidden"
            >
              <Download size={18} />
              {activeMode === 'visual' ? 'Export PDF' :
               activeMode === 'mermaid' ? 'Download SVG' :
               'Download .txt'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-16 min-h-[600px] border border-slate-200 shadow-sm overflow-x-auto print:shadow-none print:border-none">
        {root && root.label ? (
          <>
            {activeMode === 'visual' && renderVisualMindmap()}
            {activeMode === 'numbered' && renderNumberedOutline()}
            {activeMode === 'mermaid' && renderMermaidPreview()}
          </>
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

      {activeMode === 'visual' && (
        <div className="mt-10 flex flex-wrap justify-center gap-6 print:hidden">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
            <div className="w-4 h-4 rounded-full bg-purple-600 ring-4 ring-purple-50" />
            <span className="text-xs font-bold text-slate-600">Root</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
            <div className="w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50" />
            <span className="text-xs font-bold text-slate-600">Main Branch</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
            <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
            <span className="text-xs font-bold text-slate-600">Sub-branch</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
            <div className="w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-50" />
            <span className="text-xs font-bold text-slate-600">Detail</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindmapView;
