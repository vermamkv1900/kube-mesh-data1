import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Network, Key, CheckCircle, Copy, Check, Filter } from 'lucide-react';
import { K8sProject, SecurityPractice } from '../types';
import { SECURITY_PROFILES } from '../data/securityData';

interface SecurityHardeningViewProps {
  project: K8sProject;
}

export const SecurityHardeningView: React.FC<SecurityHardeningViewProps> = ({ project }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [auditedIds, setAuditedIds] = useState<Set<string>>(new Set());

  const profile = SECURITY_PROFILES[project.id] || SECURITY_PROFILES['kubefleet-gitops'];

  const filteredPractices = selectedCategory === 'All'
    ? profile.practices
    : profile.practices.filter((p) => p.category === selectedCategory);

  const categories = Array.from(new Set(profile.practices.map((p) => p.category)));

  const handleCopySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const toggleAudited = (id: string) => {
    setAuditedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const auditProgress = Math.round((auditedIds.size / profile.practices.length) * 100);

  return (
    <div className="space-y-6">
      
      {/* Top Security Overview & PSA Banner */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Security Architecture & Hardening Baseline
              </h3>
              <div className="text-xs text-slate-400 font-mono">
                Tailored for <span className="text-slate-200">{project.title.split(':')[0]}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-mono uppercase">Pod Security Admission</div>
              <div className="text-xs font-bold text-cyan-300 font-mono">
                {profile.psaLevel}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {profile.overview}
        </p>

        {/* Audit Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>Cluster Security Audit Checklist</span>
            <span className="text-cyan-400 font-bold tabular-nums">
              {auditedIds.size} of {profile.practices.length} Verified ({auditProgress}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${auditProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Segmented Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap ${
            selectedCategory === 'All'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          All Practices ({profile.practices.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Security Practices List */}
      <div className="space-y-4">
        {filteredPractices.map((practice) => {
          const isAudited = auditedIds.has(practice.id);
          const isCritical = practice.severity === 'Critical';

          return (
            <div
              key={practice.id}
              className={`p-5 rounded-lg border transition-colors ${
                isAudited
                  ? 'bg-slate-950/40 border-emerald-500/40'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span
                      className={`font-bold ${
                        isCritical ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      [{practice.severity.toUpperCase()}]
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-cyan-400">{practice.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {practice.title}
                  </h4>
                </div>

                {/* Audit toggle button */}
                <button
                  onClick={() => toggleAudited(practice.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer shrink-0 ${
                    isAudited
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isAudited ? 'Audit: Verified' : 'Mark Verified'}</span>
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {practice.description}
              </p>

              {/* Threat Mitigated Callout */}
              <div className="p-2.5 bg-slate-900/80 border border-slate-850 rounded text-xs text-slate-300 mb-3 font-mono">
                <span className="text-amber-400 font-semibold block mb-0.5">Threat Vector Mitigated:</span>
                {practice.threatMitigated}
              </div>

              {/* Implementation Manifest / Config Snippet */}
              <div className="bg-slate-900 border border-slate-850 rounded overflow-hidden">
                <div className="px-3 py-1.5 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">{practice.implementationSnippet.language}</span>
                  <button
                    onClick={() => handleCopySnippet(practice.id, practice.implementationSnippet.code)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    {copiedSnippetId === practice.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedSnippetId === practice.id ? 'Copied' : 'Copy Snippet'}</span>
                  </button>
                </div>
                <pre className="p-3 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-48 bg-slate-950">
                  {practice.implementationSnippet.code}
                </pre>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
