import React, { useState } from 'react';
import { X, Copy, Check, Download, Play, Terminal, ArrowRight, Layers, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import { K8sProject, TopologyNode } from '../types';
import { ArchitectureDiagramSvg } from './ArchitectureDiagramSvg';
import { MermaidTopologyViewer } from './MermaidTopologyViewer';
import { ResourceEstimationCalculator } from './ResourceEstimationCalculator';
import { SecurityHardeningView } from './SecurityHardeningView';
import { ComplianceAuditView } from './ComplianceAuditView';
import { PipelineFlowView } from './PipelineFlowView';
import { ClusterHeatMap } from './ClusterHeatMap';
import { AggregatedLogExplorer } from './AggregatedLogExplorer';

interface ProjectDetailModalProps {
  project: K8sProject | null;
  onClose: () => void;
  onExecuteInTerminal?: (cmd: string) => void;
  onOpenAnomalyReport?: (findingId?: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onExecuteInTerminal,
  onOpenAnomalyReport,
}) => {
  const [activeTab, setActiveTab] = useState<'topology' | 'heatmap' | 'logs' | 'manifests' | 'calculator' | 'security' | 'compliance' | 'pipeline' | 'scenarios' | 'tradeoffs'>('topology');
  const [topologyRenderer, setTopologyRenderer] = useState<'svg' | 'mermaid'>('svg');
  const [selectedManifestIndex, setSelectedManifestIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  // Scenario execution state
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [scenarioLogs, setScenarioLogs] = useState<Record<string, string[]>>({});

  if (!project) return null;

  const currentManifest = project.manifests[selectedManifestIndex] || project.manifests[0];

  const handleCopyManifest = () => {
    if (currentManifest) {
      navigator.clipboard.writeText(currentManifest.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadManifest = () => {
    if (currentManifest) {
      const blob = new Blob([currentManifest.content], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentManifest.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRunScenario = (scenarioId: string, initialLogs: string[]) => {
    setRunningScenarioId(scenarioId);
    setScenarioLogs((prev) => ({ ...prev, [scenarioId]: [] }));

    // Emulate sequential log emission
    initialLogs.forEach((log, index) => {
      setTimeout(() => {
        setScenarioLogs((prev) => ({
          ...prev,
          [scenarioId]: [...(prev[scenarioId] || []), log],
        }));
        if (index === initialLogs.length - 1) {
          setRunningScenarioId(null);
        }
      }, (index + 1) * 350);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
              <span className="text-cyan-400">{project.category}</span>
              <span aria-hidden="true">·</span>
              <span>{project.maturity}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-semibold">{project.starsOrScale}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {project.title}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {onOpenAnomalyReport && (
              <button
                onClick={() => onOpenAnomalyReport()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Report Anomaly to IT Admin</span>
                <span className="sm:hidden">Report</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs (Interactive Segmented Control) */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'topology'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Topology ({project.topology.nodes.length} Nodes)
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'heatmap'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Cluster Heat Map & Nodes
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Aggregated Log Explorer
          </button>
          <button
            onClick={() => setActiveTab('manifests')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'manifests'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Declarative Manifests ({project.manifests.length})
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Resource Calculator
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Security Hardening
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'compliance'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Compliance Audit (CIS)
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pipeline'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Flow
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'scenarios'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Scenario Simulator ({project.scenarios.length})
          </button>
          <button
            onClick={() => setActiveTab('tradeoffs')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'tradeoffs'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Benefits & Trade-offs
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: Topology */}
          {activeTab === 'topology' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
                <div className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {project.architectureSummary}
                </div>

                {/* Switch between SVG and Mermaid renderer */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs font-mono shrink-0">
                  <button
                    onClick={() => setTopologyRenderer('svg')}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      topologyRenderer === 'svg'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom SVG Graph
                  </button>
                  <button
                    onClick={() => setTopologyRenderer('mermaid')}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      topologyRenderer === 'mermaid'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mermaid.js Flowchart
                  </button>
                </div>
              </div>

              {/* Render either SVG or Mermaid */}
              {topologyRenderer === 'svg' ? (
                <ArchitectureDiagramSvg
                  nodes={project.topology.nodes}
                  edges={project.topology.edges}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                />
              ) : (
                <MermaidTopologyViewer
                  nodes={project.topology.nodes}
                  edges={project.topology.edges}
                  projectTitle={project.title}
                  architectureSummary={project.architectureSummary}
                />
              )}

              {/* Selected Node Details Drawer */}
              {selectedNode && (
                <div className="p-4 bg-slate-950 border border-cyan-500/50 rounded-lg shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-white">{selectedNode.label}</span>
                    </div>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 cursor-pointer"
                    >
                      Dismiss Inspector
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-mono mb-2">
                    <div><span className="text-slate-500">Resource Kind:</span> <span className="text-cyan-300">{selectedNode.type}</span></div>
                    <div><span className="text-slate-500">Namespace:</span> <span className="text-slate-200">{selectedNode.namespace || 'cluster-wide'}</span></div>
                    <div><span className="text-slate-500">Health State:</span> <span className="text-emerald-400 font-semibold">{selectedNode.status}</span></div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-850">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              {/* Component Nodes Grid & Interconnects */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Component Inventory & Interconnect Pathways
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {project.topology.nodes.length} Nodes · {project.topology.edges.length} Protocols
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {project.topology.nodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(isSelected ? null : node)}
                        className={`p-3.5 rounded border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                          <span className="text-slate-400 uppercase text-[10px]">
                            {node.type}
                          </span>
                          <span className="text-emerald-400 font-semibold text-[11px]">
                            {node.status}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-white truncate">
                          {node.label}
                        </div>
                        {node.namespace && (
                          <div className="text-xs text-slate-400 font-mono mt-0.5">
                            ns: {node.namespace}
                          </div>
                        )}
                        <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                          {node.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Edges Summary */}
                <div className="mt-5 pt-4 border-t border-slate-900">
                  <div className="text-xs font-mono text-slate-400 mb-2 uppercase">
                    Protocol & Ingress Pathways
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    {project.topology.edges.map((edge, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 bg-slate-900/50 rounded">
                        <span className="text-slate-300 truncate max-w-[140px]">{edge.from}</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="text-slate-300 truncate max-w-[140px]">{edge.to}</span>
                        <span className="text-cyan-400 ml-auto font-semibold">[{edge.protocol}]</span>
                        {edge.label && <span className="text-slate-400 hidden sm:inline truncate max-w-[200px]">· {edge.label}</span>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Node & Pod Heat Map */}
          {activeTab === 'heatmap' && (
            <ClusterHeatMap onOpenAnomalyReport={onOpenAnomalyReport} />
          )}

          {/* TAB: Aggregated Log Explorer (Grafana Loki & Kibana Engine) */}
          {activeTab === 'logs' && (
            <AggregatedLogExplorer
              project={project}
              onOpenAnomalyReport={onOpenAnomalyReport}
              onExecuteInTerminal={onExecuteInTerminal}
            />
          )}

          {/* TAB 3: Manifests */}
          {activeTab === 'manifests' && (
            <div className="space-y-4">
              {/* Manifest selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {project.manifests.map((manifest, idx) => (
                  <button
                    key={manifest.filename}
                    onClick={() => setSelectedManifestIndex(idx)}
                    className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      selectedManifestIndex === idx
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {manifest.filename}
                  </button>
                ))}
              </div>

              {/* Manifest Viewer Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-cyan-400 font-semibold">{currentManifest.filename}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400 font-mono">{currentManifest.type}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyManifest}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleDownloadManifest}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 overflow-x-auto max-h-[460px] text-xs font-mono leading-relaxed text-slate-200 bg-slate-950">
                  <pre>{currentManifest.content}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Resource Estimation Calculator */}
          {activeTab === 'calculator' && (
            <ResourceEstimationCalculator project={project} />
          )}

          {/* TAB 4: Security Hardening Architecture */}
          {activeTab === 'security' && (
            <SecurityHardeningView project={project} />
          )}

          {/* TAB: Compliance Audit & CIS Benchmark Scorecard */}
          {activeTab === 'compliance' && (
            <ComplianceAuditView
              project={project}
              onExecuteInTerminal={onExecuteInTerminal}
              onOpenAnomalyReport={onOpenAnomalyReport}
            />
          )}

          {/* TAB 5: CI/CD Pipeline Flow */}
          {activeTab === 'pipeline' && (
            <PipelineFlowView project={project} />
          )}

          {/* TAB 6: Scenarios Simulator */}
          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-300">
                Trigger simulated chaos events, drift occurrences, or failovers to inspect how this infrastructure project self-heals in production.
              </p>

              <div className="space-y-4">
                {project.scenarios.map((scenario) => {
                  const isRunning = runningScenarioId === scenario.id;
                  const logs = scenarioLogs[scenario.id] || [];

                  return (
                    <div key={scenario.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{scenario.title}</h4>
                          <p className="text-xs text-slate-300 mt-0.5">{scenario.description}</p>
                        </div>
                        <button
                          disabled={isRunning}
                          onClick={() => handleRunScenario(scenario.id, scenario.resultLogs)}
                          className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded transition-colors whitespace-nowrap cursor-pointer shrink-0"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isRunning ? 'Executing...' : scenario.actionName}</span>
                        </button>
                      </div>

                      {/* Execution Terminal Output */}
                      <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-300 min-h-[90px] space-y-1">
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-cyan-400" />
                          <span>Real-Time Controller Logs</span>
                        </div>
                        {logs.length === 0 ? (
                          <div className="text-slate-500 italic">
                            Click &ldquo;{scenario.actionName}&rdquo; to execute this operational scenario.
                          </div>
                        ) : (
                          logs.map((log, idx) => (
                            <div key={idx} className="leading-tight">
                              {log.startsWith('[WARN]') && <span className="text-amber-400 font-semibold">{log}</span>}
                              {log.startsWith('[SUCCESS]') && <span className="text-emerald-400 font-semibold">{log}</span>}
                              {log.startsWith('[DENIED]') && <span className="text-red-400 font-semibold">{log}</span>}
                              {log.startsWith('[ACTION]') && <span className="text-cyan-400 font-semibold">{log}</span>}
                              {!log.startsWith('[WARN]') && !log.startsWith('[SUCCESS]') && !log.startsWith('[DENIED]') && !log.startsWith('[ACTION]') && <span>{log}</span>}
                            </div>
                          ))
                        )}
                      </div>

                      {logs.length > 0 && (
                        <div className="mt-2 text-xs text-emerald-400 font-medium">
                          Outcome: {scenario.impactSummary}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Trade-offs & Benefits */}
          {activeTab === 'tradeoffs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key Benefits */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Key Production Benefits</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {project.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Architectural Trade-offs & Caveats */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Engineering Trade-offs & Operational Cost</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {project.tradeoffs.map((tradeoff, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">!</span>
                      <span>{tradeoff}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="font-mono">
            Blueprint ID: <span className="text-slate-300">{project.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
