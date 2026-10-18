import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CornerDownLeft, Trash2, HelpCircle } from 'lucide-react';
import { TERMINAL_COMMANDS } from '../data/terminalData';

interface HistoryItem {
  command: string;
  output: string;
  timestamp: string;
}

export const TerminalSimulator: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      command: 'kubectl get pods -A',
      output: TERMINAL_COMMANDS['kubectl get pods -A'].output,
      timestamp: '06:21:50',
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === 'clear') {
      setHistory([]);
      setInputVal('');
      return;
    }

    const matched = TERMINAL_COMMANDS[trimmed] || {
      output: `command not found: "${trimmed}". Type "help" or click one of the suggested commands above.`,
      isError: true,
    };

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setHistory((prev) => [
      ...prev,
      {
        command: trimmed,
        output: matched.output,
        timestamp: timeStr,
      },
    ]);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(inputVal);
    }
  };

  const suggestedCommands = [
    'kubectl get pods -A',
    'kubectl get nodes -o wide',
    'cilium status',
    'argocd app list',
    'kubectl get nodepool -n karpenter',
    'cnpg status banking-postgres-cluster -n databases',
    'helm list -A',
    'help',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1 font-mono">
          Interactive Platform Engineering Console
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Live Kubernetes Cluster CLI Simulator
        </h2>
        <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
          Execute real Kubernetes commands against our simulated production cluster. Inspect live pod distributions, Karpenter nodepools, Cilium eBPF status, ArgoCD GitOps synchronizations, and CloudNativePG PostgreSQL clusters.
        </p>
      </div>

      {/* Suggested Commands Strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400 mr-1">Quick Run:</span>
        {suggestedCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => executeCommand(cmd)}
            className="px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 rounded transition-colors cursor-pointer"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Window */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl flex flex-col h-[580px]">
        
        {/* Terminal Title Bar */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-mono text-slate-400">
              admin@kubeforge-control-plane: ~ (k8s-v1.31)
            </span>
          </div>

          <button
            onClick={() => setHistory([])}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs leading-relaxed text-slate-200 space-y-4">
          <div className="text-slate-500">
            KubeForge Platform CLI v1.31.0-alpha · Cluster: production-us-east · Context: admin-ctx
            <br />
            Type &ldquo;help&rdquo; to list all available platform queries.
          </div>

          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <span className="text-emerald-400">❯</span>
                <span>{item.command}</span>
                <span className="text-[10px] text-slate-500 ml-auto tabular-nums">{item.timestamp}</span>
              </div>
              <div className="whitespace-pre overflow-x-auto text-slate-300 pl-4 py-1">
                {item.output}
              </div>
            </div>
          ))}

          <div ref={terminalEndRef} />
        </div>

        {/* Input Line */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-850 flex items-center gap-2">
          <span className="text-emerald-400 font-mono text-sm font-bold">❯</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type kubectl, cilium, argocd, helm, or help..."
            className="flex-1 bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => executeCommand(inputVal)}
            className="p-1.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
            aria-label="Send command"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
