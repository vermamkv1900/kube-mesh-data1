import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Check, Copy, Terminal, GitCommit, FileCode, Clock, ArrowRight, ShieldCheck, Layers, Cpu, Package } from 'lucide-react';
import { K8sProject, PipelineStage, PipelineStep } from '../types';
import { PIPELINE_WORKFLOWS } from '../data/pipelineData';

interface PipelineFlowViewProps {
  project: K8sProject;
}

export const PipelineFlowView: React.FC<PipelineFlowViewProps> = ({ project }) => {
  const workflow = PIPELINE_WORKFLOWS[project.id] || PIPELINE_WORKFLOWS['kubefleet-gitops'];
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatedStageIndex, setSimulatedStageIndex] = useState<number>(-1);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [copiedYaml, setCopiedYaml] = useState<boolean>(false);
  const [showYaml, setShowYaml] = useState<boolean>(false);

  const selectedStage = workflow.stages[selectedStageIndex] || workflow.stages[0];

  // Simulation execution runner
  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimulatedStageIndex(0);
    setSelectedStageIndex(0);
    setSimulatedLogs(['[PIPELINE START] Triggered by push to main branch...', `[AGENT] Allocated Ubuntu 24.04 runner on ${workflow.engine}`]);

    let stageIdx = 0;
    const interval = setInterval(() => {
      stageIdx += 1;
      if (stageIdx < workflow.stages.length) {
        setSimulatedStageIndex(stageIdx);
        setSelectedStageIndex(stageIdx);
        const current = workflow.stages[stageIdx];
        setSimulatedLogs((prev) => [
          ...prev,
          `[STAGE ${stageIdx + 1}] Completed: ${workflow.stages[stageIdx - 1].name} (${workflow.stages[stageIdx - 1].title})`,
          `[STAGE ${stageIdx + 1}] Starting: ${current.name} - ${current.steps[0]?.name || ''}`,
        ]);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setSimulatedStageIndex(workflow.stages.length);
        setSimulatedLogs((prev) => [
          ...prev,
          `[SUCCESS] All ${workflow.stages.length} pipeline stages completed cleanly in ~${workflow.estimatedTotalMinutes}m.`,
          '[DEPLOYED] Production clusters healthy; zero configuration drift detected.',
        ]);
      }
    }, 1800);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulatedStageIndex(-1);
    setSelectedStageIndex(0);
    setSimulatedLogs([]);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(workflow.pipelineYaml);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const getStageIcon = (name: PipelineStage['name']) => {
    switch (name) {
      case 'Build':
        return <Package className="w-4 h-4 text-cyan-400" />;
      case 'Test':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'Scan':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'Deploy':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'Verify':
        return <Check className="w-4 h-4 text-teal-400" />;
      default:
        return <Terminal className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Pipeline Summary Bar */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <GitCommit className="w-3.5 h-3.5" />
            <span>Continuous Delivery Workflow · {workflow.engine}</span>
          </div>
          <h3 className="text-sm font-bold text-white">
            {project.title.split(':')[0]} Automated Deployment Pipeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Trigger: <span className="text-slate-300">{workflow.trigger}</span> · Est. Total: <span className="text-slate-300 tabular-nums">{workflow.estimatedTotalMinutes} min</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowYaml(!showYaml)}
            className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
              showYaml
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              <span>{showYaml ? 'Hide YAML' : 'View Pipeline YAML'}</span>
            </span>
          </button>

          <button
            disabled={isSimulating}
            onClick={handleStartSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded transition-colors cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Simulating Run...' : 'Simulate Pipeline'}</span>
          </button>

          {simulatedStageIndex >= 0 && (
            <button
              onClick={handleResetSimulation}
              className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
              title="Reset simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* CI/CD YAML Viewer Box if toggled */}
      {showYaml && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-semibold">.github/workflows/deploy.yaml</span>
            <button
              onClick={handleCopyYaml}
              className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
            >
              {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedYaml ? 'Copied' : 'Copy Spec'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-56 bg-slate-950">
            {workflow.pipelineYaml}
          </pre>
        </div>
      )}

      {/* Step-by-Step Visual Workflow Tracker */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-4">
          Pipeline Stages Flow ({workflow.stages.length} Gates)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {workflow.stages.map((stage, idx) => {
            const isSelected = selectedStageIndex === idx;
            const isSimulationPassed = simulatedStageIndex > idx;
            const isSimulationCurrent = simulatedStageIndex === idx;

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageIndex(idx)}
                className={`p-3.5 rounded border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Stage number & status */}
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-500 font-bold">0{idx + 1}</span>
                  {isSimulationPassed ? (
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passed
                    </span>
                  ) : isSimulationCurrent ? (
                    <span className="text-amber-400 font-bold text-[11px] animate-pulse">
                      Running...
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Ready</span>
                  )}
                </div>

                {/* Stage Header */}
                <div className="flex items-center gap-2 mb-1">
                  {getStageIcon(stage.name)}
                  <span className="text-sm font-bold text-white">{stage.name}</span>
                </div>

                <div className="text-[11px] text-slate-400 truncate">
                  {stage.title}
                </div>

                {/* Micro step count */}
                <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{stage.steps.length} tasks</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Inspector */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-5">
        
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-850">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-0.5">
              <span>Stage 0{selectedStageIndex + 1}</span>
              <span className="text-slate-600">/</span>
              <span>{selectedStage.name}</span>
            </div>
            <h4 className="text-base font-bold text-white">
              {selectedStage.title}
            </h4>
          </div>
          <p className="text-xs text-slate-400 max-w-md sm:text-right">
            {selectedStage.description}
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-semibold uppercase text-slate-400">
            Step Tasks & Terminal Commands
          </div>

          {selectedStage.steps.map((step, sIdx) => (
            <div
              key={sIdx}
              className="p-3.5 bg-slate-900/80 border border-slate-850 rounded text-xs space-y-2 font-mono"
            >
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-white font-sans text-xs font-bold">{step.name}</span>
                </span>
                <span className="text-slate-500 tabular-nums">~{step.durationSeconds}s</span>
              </div>

              {/* Command line */}
              <div className="p-2 bg-slate-950 rounded border border-slate-850 text-[11px] text-cyan-300 overflow-x-auto">
                <span className="text-slate-500 mr-2">$</span>
                {step.command}
              </div>

              {/* Step logs */}
              {step.logs && step.logs.length > 0 && (
                <div className="pl-3 border-l border-slate-800 space-y-0.5 text-[11px] text-slate-400">
                  {step.logs.map((log, lIdx) => (
                    <div key={lIdx}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stage Artifacts */}
        {selectedStage.artifacts && selectedStage.artifacts.length > 0 && (
          <div className="pt-3 border-t border-slate-850 flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="text-slate-500">Stage Artifacts:</span>
            <div className="flex flex-wrap items-center gap-2">
              {selectedStage.artifacts.map((art, aIdx) => (
                <span key={aIdx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">
                  {art}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Real-Time Simulated Runner Terminal Log */}
      {simulatedLogs.length > 0 && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 space-y-1.5 shadow-xl">
          <div className="flex items-center justify-between text-[11px] text-slate-500 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Terminal className="w-3.5 h-3.5" />
              <span>Simulated CI/CD Runner Output</span>
            </span>
            <span>Live Stream</span>
          </div>
          {simulatedLogs.map((log, lIdx) => (
            <div
              key={lIdx}
              className={`leading-tight ${
                log.startsWith('[SUCCESS]')
                  ? 'text-emerald-400 font-bold'
                  : log.startsWith('[STAGE')
                  ? 'text-cyan-300 font-semibold'
                  : 'text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
