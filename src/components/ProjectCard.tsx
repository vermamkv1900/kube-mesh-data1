import React from 'react';
import { ArrowRight, Code, Cpu, ShieldCheck } from 'lucide-react';
import { K8sProject } from '../types';

interface ProjectCardProps {
  project: K8sProject;
  index: number;
  onSelect: (project: K8sProject) => void;
  onOpenTerminalWithCmd?: (cmd: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  onSelect,
}) => {
  const indexFormatted = String(index + 1).padStart(2, '0');

  return (
    <article className="flex flex-col justify-between bg-slate-900/70 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors group">
      <div>
        
        {/* Editorial Index & Unboxed Metadata (Zero-Pill Discipline) */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-mono">
          <span className="text-cyan-400 font-semibold">{indexFormatted}</span>
          <div className="flex items-center gap-2">
            <span>{project.category}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">{project.maturity}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
          {project.title}
        </h2>

        {/* Tagline */}
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          {project.tagline}
        </p>

        {/* Primary Stack List - Clean unboxed text list */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Core Technology Stack
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300 font-mono">
            {project.primaryStack.map((tech, idx) => (
              <span key={tech} className="inline-flex items-center">
                <span className="text-cyan-400/90">{tech}</span>
                {idx < project.primaryStack.length - 1 && (
                  <span className="text-slate-600 ml-2" aria-hidden="true">/</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Production Impact Note */}
        <div className="mt-4 p-3 bg-slate-950/60 border border-slate-850 rounded text-xs text-slate-300">
          <span className="text-emerald-400 font-semibold block mb-0.5">Measurable Production Benefit</span>
          {project.businessImpact}
        </div>

      </div>

      {/* Card Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span className="tabular-nums">{project.manifests.length}</span> manifests
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span className="tabular-nums">{project.topology.nodes.length}</span> nodes
          </span>
        </div>

        <button
          onClick={() => onSelect(project)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-cyan-600 rounded transition-colors cursor-pointer group-hover:bg-cyan-500 group-hover:text-slate-950"
        >
          <span>Explore Blueprint</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
