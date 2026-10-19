import React, { useState } from 'react';
import { Cpu, HardDrive, Server, Activity, AlertTriangle, RefreshCw, Send, Check, ShieldAlert } from 'lucide-react';
import { INITIAL_NODE_METRICS, INITIAL_POD_METRICS, NodeMetric, PodMetric } from '../data/heatMapData';

interface ClusterHeatMapProps {
  onOpenAnomalyReport?: (findingId?: string) => void;
}

export const ClusterHeatMap: React.FC<ClusterHeatMapProps> = ({ onOpenAnomalyReport }) => {
  const [viewMode, setViewMode] = useState<'nodes' | 'pods'>('nodes');
  const [nodeMetricKey, setNodeMetricKey] = useState<'cpuPercent' | 'memoryPercent' | 'diskIoPercent' | 'temperatureC'>('cpuPercent');
  const [podMetricKey, setPodMetricKey] = useState<'cpuThrottlePercent' | 'memoryPercent' | 'restarts'>('cpuThrottlePercent');
  const [selectedNode, setSelectedNode] = useState<NodeMetric | null>(null);
  const [selectedPod, setSelectedPod] = useState<PodMetric | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [nodes, setNodes] = useState<NodeMetric[]>(INITIAL_NODE_METRICS);
  const [pods, setPods] = useState<PodMetric[]>(INITIAL_POD_METRICS);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Apply slight realistic jitter
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          cpuPercent: Math.max(10, Math.min(98, n.cpuPercent + Math.floor(Math.random() * 9 - 4))),
          memoryPercent: Math.max(15, Math.min(96, n.memoryPercent + Math.floor(Math.random() * 5 - 2))),
        }))
      );
      setPods((prev) =>
        prev.map((p) => ({
          ...p,
          cpuThrottlePercent: Math.max(0, Math.min(95, p.cpuThrottlePercent + Math.floor(Math.random() * 7 - 3))),
        }))
      );
      setIsRefreshing(false);
    }, 600);
  };

  const getNodeColor = (val: number, key: string) => {
    const threshold = key === 'temperatureC' ? 70 : 80;
    const warning = key === 'temperatureC' ? 55 : 55;

    if (val >= threshold) return 'bg-rose-950/80 border-rose-500/80 text-rose-300';
    if (val >= warning) return 'bg-amber-950/80 border-amber-500/80 text-amber-300';
    return 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300';
  };

  const getPodColor = (val: number, key: string) => {
    const threshold = key === 'restarts' ? 2 : 75;
    const warning = key === 'restarts' ? 1 : 45;

    if (val >= threshold) return 'bg-rose-950/80 border-rose-500/80 text-rose-300';
    if (val >= warning) return 'bg-amber-950/80 border-amber-500/80 text-amber-300';
    return 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300';
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls Strip */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Kubernetes Cluster Telemetry Heat Map</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Node & Pod Resource Saturation Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time heat map tracking CPU saturation, memory limits, OOMKill risks, and container restarts across all cluster tiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* View toggle (Nodes vs Pods) */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5 font-mono text-xs">
            <button
              onClick={() => {
                setViewMode('nodes');
                setSelectedPod(null);
              }}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'nodes' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nodes ({nodes.length})
            </button>
            <button
              onClick={() => {
                setViewMode('pods');
                setSelectedNode(null);
              }}
              className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'pods' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pods ({pods.length})
            </button>
          </div>

          {/* Metric Selector */}
          {viewMode === 'nodes' ? (
            <select
              value={nodeMetricKey}
              onChange={(e) => setNodeMetricKey(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="cpuPercent">Metric: CPU Utilization %</option>
              <option value="memoryPercent">Metric: Memory Utilization %</option>
              <option value="diskIoPercent">Metric: Disk I/O Saturation %</option>
              <option value="temperatureC">Metric: Thermal Temp (°C)</option>
            </select>
          ) : (
            <select
              value={podMetricKey}
              onChange={(e) => setPodMetricKey(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="cpuThrottlePercent">Metric: CPU Throttle %</option>
              <option value="memoryPercent">Metric: Memory Limit %</option>
              <option value="restarts">Metric: Restarts Count</option>
            </select>
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded transition-colors cursor-pointer"
            title="Refresh Prometheus scrape metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Report Anomaly button */}
          {onOpenAnomalyReport && (
            <button
              onClick={() => onOpenAnomalyReport()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded transition-colors cursor-pointer shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 fill-current" />
              <span>Report Anomalies to IT Admin & DL</span>
            </button>
          )}
        </div>
      </div>

      {/* Heat Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/80" />
            <span>Nominal (&lt;55%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/80" />
            <span>Elevated (55% - 80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500/80" />
            <span>Critical Saturation (&gt;80%)</span>
          </div>
        </div>

        <div className="text-slate-500">
          Showing {viewMode === 'nodes' ? `${nodes.length} Worker & Control Nodes` : `${pods.length} Active Pods`} · Scrape Interval: 15s
        </div>
      </div>

      {/* NODE HEAT MAP GRID */}
      {viewMode === 'nodes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {nodes.map((node) => {
            const metricVal = node[nodeMetricKey];
            const isSelected = selectedNode?.id === node.id;
            const colorClass = getNodeColor(metricVal, nodeMetricKey);

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(isSelected ? null : node)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${colorClass} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    {node.role}
                  </span>
                  <span className="text-[10px] text-slate-400">{node.zone}</span>
                </div>

                <div className="text-sm font-bold text-white truncate mb-1">
                  {node.name}
                </div>

                <div className="text-[11px] font-mono text-slate-400 mb-3">
                  {node.instanceType} · {node.podCount}/{node.maxPods} pods
                </div>

                {/* Primary Metric Score */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80 font-mono">
                  <span className="text-[10px] text-slate-400 uppercase">
                    {nodeMetricKey === 'cpuPercent' ? 'CPU' : nodeMetricKey === 'memoryPercent' ? 'RAM' : nodeMetricKey === 'diskIoPercent' ? 'Disk IO' : 'Temp'}
                  </span>
                  <span className="text-xl font-bold tabular-nums">
                    {metricVal}
                    {nodeMetricKey === 'temperatureC' ? '°C' : '%'}
                  </span>
                </div>

                {/* Secondary metric bars */}
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div>CPU: <span className="text-slate-200 tabular-nums">{node.cpuPercent}%</span></div>
                  <div>RAM: <span className="text-slate-200 tabular-nums">{node.memoryPercent}%</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POD HEAT MAP GRID */}
      {viewMode === 'pods' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {pods.map((pod) => {
            const metricVal = pod[podMetricKey];
            const isSelected = selectedPod?.id === pod.id;
            const colorClass = getPodColor(metricVal, podMetricKey);

            return (
              <div
                key={pod.id}
                onClick={() => setSelectedPod(isSelected ? null : pod)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${colorClass} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:border-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-400">
                  <span className="truncate max-w-[80px]">{pod.namespace}</span>
                  <span className={pod.status === 'CrashLoop' ? 'text-rose-400 font-bold' : ''}>{pod.status}</span>
                </div>

                <div className="text-xs font-bold text-white truncate mb-2" title={pod.name}>
                  {pod.name}
                </div>

                <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-800/80 font-mono">
                  <span className="text-[9px] text-slate-400 uppercase">
                    {podMetricKey === 'cpuThrottlePercent' ? 'Throttle' : podMetricKey === 'memoryPercent' ? 'RAM' : 'Restarts'}
                  </span>
                  <span className="text-base font-bold tabular-nums">
                    {metricVal}
                    {podMetricKey !== 'restarts' ? '%' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="p-4 bg-slate-900 border border-cyan-500/50 rounded-lg shadow-xl font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">{selectedNode.name}</span>
              <span className="text-slate-400">({selectedNode.zone} · {selectedNode.instanceType})</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center mb-3">
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">CPU LOAD</div>
              <div className="text-sm font-bold text-white tabular-nums">{selectedNode.cpuPercent}%</div>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">RAM USAGE</div>
              <div className="text-sm font-bold text-white tabular-nums">{selectedNode.memoryPercent}%</div>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">DISK I/O</div>
              <div className="text-sm font-bold text-white tabular-nums">{selectedNode.diskIoPercent}%</div>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">TEMPERATURE</div>
              <div className="text-sm font-bold text-white tabular-nums">{selectedNode.temperatureC}°C</div>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">ALLOCATED PODS</div>
              <div className="text-sm font-bold text-cyan-400 tabular-nums">{selectedNode.podCount} / {selectedNode.maxPods}</div>
            </div>
          </div>

          {selectedNode.cpuPercent > 80 && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded text-rose-300 flex items-center justify-between">
              <span>Node saturation alert: CPU exceeds 80%. High risk of noisy-neighbor throttling.</span>
              {onOpenAnomalyReport && (
                <button
                  onClick={() => onOpenAnomalyReport()}
                  className="px-2 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded cursor-pointer shrink-0 ml-2"
                >
                  Send Report
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Pod Details Drawer */}
      {selectedPod && (
        <div className="p-4 bg-slate-900 border border-cyan-500/50 rounded-lg shadow-xl font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-white">{selectedPod.name}</span>
              <span className="text-slate-400">ns: {selectedPod.namespace} · on {selectedPod.node}</span>
            </div>
            <button
              onClick={() => setSelectedPod(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">CPU THROTTLE</div>
              <div className="text-sm font-bold text-white tabular-nums">{selectedPod.cpuThrottlePercent}%</div>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">MEM CGROUP</div>
              <div className="text-sm font-bold text-white tabular-nums">{selectedPod.memoryPercent}%</div>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">RESTARTS</div>
              <div className="text-sm font-bold text-amber-400 tabular-nums">{selectedPod.restarts}</div>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <div className="text-[10px] text-slate-500">NET TRAFFIC</div>
              <div className="text-sm font-bold text-cyan-300 tabular-nums">{selectedPod.networkRxMb} MB in / {selectedPod.networkTxMb} MB out</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
