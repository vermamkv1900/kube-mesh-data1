import React, { useState } from 'react';
import { Sparkles, ExternalLink, Copy, Check, Terminal, Layers, ShieldCheck } from 'lucide-react';
import { OPEN_SOURCE_PROJECTS } from '../data/openSourceData';

export const OpenSourceView: React.FC = () => {
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1 font-mono">
          Ecosystem Standard Bearers
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Impactful Open-Source Projects in Kubernetes
        </h2>
        <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
          Kubernetes achieves production maturity through a vibrant cloud-native open-source ecosystem. Here are the 5+ most popular and impactful open-source projects, detailing their primary function and measurable benefits in Kubernetes environments.
        </p>
      </div>

      {/* Projects List */}
      <div className="space-y-8">
        {OPEN_SOURCE_PROJECTS.map((project, index) => {
          const indexFormatted = String(index + 1).padStart(2, '0');

          return (
            <article
              key={project.id}
              className="p-6 md:p-8 bg-slate-900/80 border border-slate-800 rounded-lg"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Description & Benefits */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="text-cyan-400 font-bold">{indexFormatted}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300 font-semibold">{project.category}</span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>{project.name}</span>
                    </h3>
                    <p className="text-sm text-cyan-300 mt-1 font-medium">
                      {project.tagline}
                    </p>
                  </div>

                  {/* Primary Function */}
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 border border-slate-850 rounded">
                    <span className="text-slate-400 font-semibold block mb-1 uppercase font-mono">
                      Primary Function:
                    </span>
                    {project.primaryFunction}
                  </div>

                  {/* Benefits in a Kubernetes Environment */}
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 uppercase block mb-2 font-mono">
                      Benefits in a Kubernetes Environment:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {project.benefitsInKubernetes.map((benefit, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Architectural Role */}
                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-850 font-mono">
                    <span className="text-slate-500">Cluster Role:</span> {project.architectureRole}
                  </div>
                </div>

                {/* Right Column: Code Snippet */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden flex flex-col h-full">
                    <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400 font-semibold truncate">
                        {project.codeSnippet.title}
                      </span>
                      <button
                        onClick={() => handleCopySnippet(project.id, project.codeSnippet.code)}
                        className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                      >
                        {copiedSnippetId === project.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedSnippetId === project.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="p-3.5 overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-200 bg-slate-950 flex-1">
                      <pre>{project.codeSnippet.code}</pre>
                    </div>
                  </div>
                </div>

              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
};
