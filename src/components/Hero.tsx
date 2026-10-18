import React from 'react';
import { Search, Server, Network, Activity, Cpu } from 'lucide-react';
import { ProjectCategory } from '../types';

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: ProjectCategory[];
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
}) => {
  return (
    <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        
        {/* Kicker & Title */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-2">
            Cloud-Native Architecture & Platform Engineering
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white" style={{ textWrap: 'balance' }}>
            Production Kubernetes Infrastructure & Platform Blueprints
          </h1>
          <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-2xl">
            A curated suite of enterprise-grade Kubernetes infrastructure projects: GitOps fleet control planes, kernel eBPF service meshes, unified LGTM observability stacks, dynamic Karpenter autoscaling, and stateful database meshes.
          </p>
        </div>

        {/* Proof & Scale Strip (Tabular figures, no pills) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tabular-nums">7 Production</div>
              <div className="text-xs text-slate-400">Battle-tested blueprints</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tabular-nums">100% Sidecarless</div>
              <div className="text-xs text-slate-400">Kernel eBPF routing</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tabular-nums">3.2m MTTR</div>
              <div className="text-xs text-slate-400">Trace-to-Log triage</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white font-mono tabular-nums">48% FinOps</div>
              <div className="text-xs text-slate-400">Spot & consolidation cut</div>
            </div>
          </div>
        </div>

        {/* Interactive Filter Bar & Search */}
        <div className="mt-8 pt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manifests, operators, CNIs, stacks..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Segmented category filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              All Projects
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
