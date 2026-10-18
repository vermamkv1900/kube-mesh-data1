import React, { useState } from 'react';
import { Activity, Database, FileText, Search, Link2, Copy, Check, ArrowRight, Zap } from 'lucide-react';
import { OBSERVABILITY_TOOLS, CORRELATION_DEMO_ITEMS } from '../data/observabilityData';
import { ObservabilityPillar } from '../types';

export const ObservabilityView: React.FC = () => {
  const [selectedPillar, setSelectedPillar] = useState<'All' | ObservabilityPillar>('All');
  const [activeIncidentIndex, setActiveIncidentIndex] = useState(0);
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  const filteredTools = selectedPillar === 'All'
    ? OBSERVABILITY_TOOLS
    : OBSERVABILITY_TOOLS.filter((t) => t.pillar === selectedPillar);

  const activeIncident = CORRELATION_DEMO_ITEMS[activeIncidentIndex];

  const handleCopyQuery = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1 font-mono">
          Metrics · Logs · Traces
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Key Tools for Observability in Kubernetes
        </h2>
        <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
          Cloud-native observability requires three interconnected pillars: continuous metrics for detection and alerting (Prometheus, Grafana, Mimir), centralized log aggregation for granular context (Loki, EFK Stack), and distributed tracing for distributed request profiling (Tempo, Jaeger).
        </p>
      </div>

      {/* Interactive Observability Triad Live Correlation Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
              <Link2 className="w-3.5 h-3.5" />
              <span>Live Triage Demo · Trace-to-Log-to-Metric Correlation</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              The Modern Observability Triad in Action
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Select an ongoing production anomaly to see how Prometheus, Tempo, and Loki correlate via Trace ID to slash MTTR.
            </p>
          </div>

          {/* Anomaly selector */}
          <div className="flex items-center gap-2">
            {CORRELATION_DEMO_ITEMS.map((item, idx) => (
              <button
                key={item.traceId}
                onClick={() => setActiveIncidentIndex(idx)}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  activeIncidentIndex === idx
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
                }`}
              >
                {item.service} (HTTP {item.httpStatus})
              </button>
            ))}
          </div>
        </div>

        {/* 3 Connected Columns: Metric -> Trace -> Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Column 1: Monitoring (Prometheus/Mimir) */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-amber-400 font-semibold uppercase">1. Metric Alert (Prometheus)</span>
                <span className="text-red-400 font-bold">FIRING</span>
              </div>
              <div className="text-xs text-slate-400 mb-2">
                PromQL detects error rate surge on <span className="text-white font-mono">{activeIncident.service}</span>:
              </div>
              <div className="p-2.5 bg-slate-900 rounded font-mono text-xs text-cyan-300 break-all mb-3 border border-slate-800">
                {activeIncident.promMetric}
              </div>
              <div className="text-xs text-slate-300">
                Prometheus Alertmanager extracts endpoint and passes target labels to Grafana.
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900 text-xs text-slate-500 font-mono">
              Detection: 15s window
            </div>
          </div>

          {/* Column 2: Tracing (Tempo/Jaeger) */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-cyan-400 font-semibold uppercase">2. Distributed Trace (Tempo)</span>
                <span className="text-slate-400 font-mono">TraceID: {activeIncident.traceId}</span>
              </div>
              <div className="text-xs text-slate-400 mb-2">
                Span waterfall identifies bottleneck taking <span className="text-red-400 font-bold font-mono">{activeIncident.durationMs}ms</span>:
              </div>
              <div className="p-2.5 bg-slate-900 rounded font-mono text-xs text-amber-300 break-all mb-3 border border-slate-800">
                SQL Span: {activeIncident.sqlQuery}
              </div>
              <div className="text-xs text-slate-300">
                Tempo pinpoints that 92% of request time was spent stalled waiting on the storage layer.
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900 text-xs text-slate-500 font-mono">
              Profile: {activeIncident.durationMs}ms total latency
            </div>
          </div>

          {/* Column 3: Logging (Loki) */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-emerald-400 font-semibold uppercase">3. Correlated Log (Loki)</span>
                <span className="text-slate-400 font-mono">LogQL Filter</span>
              </div>
              <div className="text-xs text-slate-400 mb-2">
                Exact log record linked by matching <span className="text-cyan-300 font-mono">trace_id</span>:
              </div>
              <div className="p-2.5 bg-slate-900 rounded font-mono text-xs text-red-300 break-words mb-3 border border-slate-800">
                {activeIncident.logMessage}
              </div>
              <div className="text-xs text-slate-300">
                Root cause verified instantly: Database connection pool was exhausted by unindexed query.
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900 text-xs text-emerald-400 font-mono">
              Triage completed in &lt;60s
            </div>
          </div>

        </div>
      </div>

      {/* Pillar Filter Buttons */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setSelectedPillar('All')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            selectedPillar === 'All'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          All Observability Tools
        </button>
        <button
          onClick={() => setSelectedPillar('Monitoring')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            selectedPillar === 'Monitoring'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Monitoring (Prometheus, Grafana, Mimir)
        </button>
        <button
          onClick={() => setSelectedPillar('Logging')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            selectedPillar === 'Logging'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Logging (Loki, EFK Stack)
        </button>
        <button
          onClick={() => setSelectedPillar('Tracing')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            selectedPillar === 'Tracing'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Tracing (Tempo, Jaeger)
        </button>
      </div>

      {/* Observability Tools Detailed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between"
          >
            <div>
              {/* Pillar indicator */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span className="text-cyan-400 uppercase font-semibold">{tool.pillar}</span>
                <span>Storage: {tool.storageBackend.split('(')[0]}</span>
              </div>

              {/* Name & Purpose */}
              <h3 className="text-lg font-bold text-white mb-2">{tool.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{tool.primaryFunction}</p>

              {/* Architecture & Kubernetes Integration */}
              <div className="p-3 bg-slate-950/70 border border-slate-850 rounded text-xs space-y-2 mb-4 font-mono">
                <div>
                  <span className="text-slate-500">Architecture:</span>{' '}
                  <span className="text-slate-300">{tool.architecture}</span>
                </div>
                <div>
                  <span className="text-slate-500">K8s Deployment:</span>{' '}
                  <span className="text-cyan-400">{tool.k8sIntegrationPattern}</span>
                </div>
              </div>

              {/* Key Features */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase block mb-1.5 font-mono">
                  Key Capabilities
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {tool.keyFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trade-offs & Limitations */}
              <div className="mb-4 pt-3 border-t border-slate-800">
                <span className="text-xs font-semibold text-amber-400 uppercase block mb-1.5 font-mono">
                  Trade-offs & Operational Limitations
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {tool.tradeoffsAndLimitations.map((limit, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">!</span>
                      <span>{limit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Query / Configuration Sample */}
            <div className="mt-4 pt-3 border-t border-slate-850">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span>Sample {tool.exampleQueryOrConfig.language}</span>
                <button
                  onClick={() => handleCopyQuery(tool.id, tool.exampleQueryOrConfig.sample)}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  {copiedQueryId === tool.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedQueryId === tool.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-slate-950 rounded font-mono text-[11px] text-slate-200 overflow-x-auto">
                {tool.exampleQueryOrConfig.sample}
              </pre>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
