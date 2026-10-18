import React, { useState } from 'react';
import { X, Copy, Check, Download, Layers, Server } from 'lucide-react';
import { KUBERNETES_PROJECTS } from '../data/projectsData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState<'aws' | 'gcp' | 'azure' | 'baremetal'>('aws');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    KUBERNETES_PROJECTS.map((p) => p.id)
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectedProjects = KUBERNETES_PROJECTS.filter((p) =>
    selectedProjectIds.includes(p.id)
  );

  const generateBootstrapScript = () => {
    return `#!/usr/bin/env bash
# ==============================================================================
# KubeForge Platform Engineering Bootstrap Script
# Target Cloud: ${provider.toUpperCase()}
# Generated: 2026-10-18
# ==============================================================================
set -euo pipefail

echo "==> [1/4] Verifying Kubernetes cluster connectivity..."
kubectl cluster-info

echo "==> [2/4] Bootstrapping Core Platform CRDs & Namespaces..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace cilium-system --dry-run=client -o yaml | kubectl apply -f -

${selectedProjects
  .map(
    (p) => `# Blueprint: ${p.title}
echo "==> Deploying ${p.title}..."
# Applying manifests: ${p.manifests.map((m) => m.filename).join(', ')}
`
  )
  .join('\n')}

echo "==> [3/4] Validating healthy deployment rollouts..."
kubectl get pods -A

echo "==> [4/4] Bootstrap completed successfully!"
`;
  };

  const scriptContent = generateBootstrapScript();

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kubeforge-bootstrap-${provider}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Export Infrastructure Manifests</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Target Cloud Provider */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
              1. Select Target Cloud Infrastructure
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'aws', label: 'AWS (EKS)' },
                { id: 'gcp', label: 'Google Cloud (GKE)' },
                { id: 'azure', label: 'Azure (AKS)' },
                { id: 'baremetal', label: 'Bare-Metal / On-Prem' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  onClick={() => setProvider(prov.id as any)}
                  className={`p-2.5 text-xs font-medium rounded border text-center transition-colors cursor-pointer ${
                    provider === prov.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {prov.label}
                </button>
              ))}
            </div>
          </div>

          {/* Included Blueprints Checklist */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
              2. Select Blueprints to Include ({selectedProjectIds.length}/{KUBERNETES_PROJECTS.length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {KUBERNETES_PROJECTS.map((proj) => {
                const isSelected = selectedProjectIds.includes(proj.id);
                return (
                  <button
                    key={proj.id}
                    onClick={() => toggleProject(proj.id)}
                    className={`p-2.5 rounded border text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500/50 text-white'
                        : 'bg-slate-950/40 border-slate-850 text-slate-500'
                    }`}
                  >
                    <span className="truncate pr-2">{proj.title.split(':')[0]}</span>
                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generated Bootstrap Script Preview */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>Bootstrap Script (bash)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Script'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 cursor-pointer ml-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sh</span>
                </button>
              </div>
            </div>

            <pre className="p-3.5 bg-slate-950 rounded border border-slate-850 text-xs font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
              {scriptContent}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Manifests</span>
          </button>
        </div>

      </div>
    </div>
  );
};
