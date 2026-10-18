import React from 'react';
import { Layers, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'projects' | 'networking' | 'observability' | 'opensource' | 'terminal';
  setActiveTab: (tab: 'projects' | 'networking' | 'observability' | 'opensource' | 'terminal') => void;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenExport }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('projects')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            KubeForge
          </span>
        </button>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('projects')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              activeTab === 'projects'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Infrastructure Projects
          </button>
          
          <button
            onClick={() => setActiveTab('networking')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              activeTab === 'networking'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Networking & CNI Matrix
          </button>

          <button
            onClick={() => setActiveTab('observability')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              activeTab === 'observability'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Observability Stack
          </button>

          <button
            onClick={() => setActiveTab('opensource')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              activeTab === 'opensource'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Open-Source Tools
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
              activeTab === 'terminal'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live CLI Console
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Manifests</span>
          </button>
        </div>

      </div>

      {/* Mobile navigation row */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2 border-t border-slate-850 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'projects' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('networking')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'networking' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Networking
        </button>
        <button
          onClick={() => setActiveTab('observability')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'observability' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Observability
        </button>
        <button
          onClick={() => setActiveTab('opensource')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'opensource' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          Open-Source
        </button>
        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'terminal' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
        >
          CLI Terminal
        </button>
      </div>
    </header>
  );
};
