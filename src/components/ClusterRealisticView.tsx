import React, { useState } from 'react';
import {
  Server,
  Layers,
  HardDrive,
  Network,
  Activity,
  Flame,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import { ClusterRealisticArchitecture } from './ClusterRealisticArchitecture';
import { ClusterNodeDeepDive } from './ClusterNodeDeepDive';
import { ClusterPodVolumetrics } from './ClusterPodVolumetrics';
import { ClusterPodConnectionsView } from './ClusterPodConnectionsView';
import { INITIAL_NODE_METRICS, INITIAL_POD_METRICS, NodeMetric, PodMetric } from '../data/heatMapData';
import { DETAILED_NODES, DETAILED_PODS } from '../data/clusterRealisticData';

interface ClusterRealisticViewProps {
  initialSubTab?: 'architecture' | 'nodes' | 'volumetrics' | 'connections' | 'heatmap';
  onOpenAnomalyReport?: (findingId?: string) => void;
}

export const ClusterRealisticView: React.FC<ClusterRealisticViewProps> = ({
  initialSubTab = 'architecture',
  onOpenAnomalyReport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'nodes' | 'volumetrics' | 'connections' | 'heatmap'>(
    initialSubTab
  );
  const [selectedPodForVolumetrics, setSelectedPodForVolumetrics] = useState<string | undefined>(undefined);

  // Saturation heatmap state (for the heatmap sub-tab)
  const [viewMode, setViewMode] = useState<'nodes' | 'pods'>('nodes');
  const [nodeMetricKey, setNodeMetricKey] = useState<'cpuPercent' | 'memoryPercent' | 'diskIoPercent' | 'temperatureC'>('cpuPercent');
  const [podMetricKey, setPodMetricKey] = useState<'cpuThrottlePercent' | 'memoryPercent' | 'restarts'>('cpuThrottlePercent');
  const [selectedHeatNode, setSelectedHeatNode] = useState<NodeMetric | null>(null);
  const [selectedHeatPod, setSelectedHeatPod] = useState<PodMetric | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [heatNodes, setHeatNodes] = useState<NodeMetric[]>(INITIAL_NODE_METRICS);
  const [heatPods, setHeatPods] = useState<PodMetric[]>(INITIAL_POD_METRICS);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setHeatNodes((prev) =>
        prev.map((n) => ({
          ...n,
          cpuPercent: Math.max(10, Math.min(98, n.cpuPercent + Math.floor(Math.random() * 9 - 4))),
          memoryPercent: Math.max(15, Math.min(96, n.memoryPercent + Math.floor(Math.random() * 5 - 2))),
        }))
      );
      setHeatPods((prev) =>
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

  const handleJumpToPod = (podId: string) => {
    setSelectedPodForVolumetrics(podId);
    setActiveSubTab('volumetrics');
  };

  return (
    <div className="space-y-6">
      
      {/* Editorial Sub-Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 overflow-x-auto gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSubTab === 'architecture'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Diagram</span>
          </button>

          <button
            onClick={() => setActiveSubTab('nodes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSubTab === 'nodes'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Node Fleet & History ({DETAILED_NODES.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('volumetrics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSubTab === 'volumetrics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Pod Volumetrics & Storage ({DETAILED_PODS.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('connections')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSubTab === 'connections'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Pod Connections & Traffic Flow</span>
          </button>

          <button
            onClick={() => setActiveSubTab('heatmap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSubTab === 'heatmap'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Resource Saturation Heat Map</span>
          </button>
        </div>

        {/* Action Button: Report Anomaly */}
        {onOpenAnomalyReport && (
          <button
            onClick={() => onOpenAnomalyReport()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 fill-current" />
            <span>Escalate Anomaly</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: DETAILED KUBERNETES CLUSTER ARCHITECTURE DIAGRAM */}
      {activeSubTab === 'architecture' && (
        <ClusterRealisticArchitecture />
      )}

      {/* SUB-TAB 2: NODE FLEET & DETAILED HISTORY */}
      {activeSubTab === 'nodes' && (
        <ClusterNodeDeepDive
          onSelectPod={handleJumpToPod}
          onOpenAnomalyReport={onOpenAnomalyReport}
        />
      )}

      {/* SUB-TAB 3: POD VOLUMETRICS & STORAGE */}
      {activeSubTab === 'volumetrics' && (
        <ClusterPodVolumetrics
          initialPodId={selectedPodForVolumetrics}
          onOpenAnomalyReport={onOpenAnomalyReport}
        />
      )}

      {/* SUB-TAB 4: POD CONNECTIONS & TRAFFIC FLOW */}
      {activeSubTab === 'connections' && (
        <ClusterPodConnectionsView
          onSelectPod={handleJumpToPod}
        />
      )}

      {/* SUB-TAB 5: RESOURCE SATURATION HEAT MAP */}
      {activeSubTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase mb-0.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Kubernetes Cluster Saturation Matrix</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Cluster Hardware & Pod Saturation Grid
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time color-graded matrix identifying CPU throttling, OOMKill probability, thermal heat, and cgroup pressure.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => {
                    setViewMode('nodes');
                    setSelectedHeatPod(null);
                  }}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'nodes' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Nodes ({heatNodes.length})
                </button>
                <button
                  onClick={() => {
                    setViewMode('pods');
                    setSelectedHeatNode(null);
                  }}
                  className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'pods' ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pods ({heatPods.length})
                </button>
              </div>

              {viewMode === 'nodes' ? (
                <select
                  value={nodeMetricKey}
                  onChange={(e) => setNodeMetricKey(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
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
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="cpuThrottlePercent">Metric: CPU Throttle %</option>
                  <option value="memoryPercent">Metric: Memory Limit %</option>
                  <option value="restarts">Metric: Restarts Count</option>
                </select>
              )}

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded transition-colors cursor-pointer"
                title="Refresh Prometheus scrape metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Legend */}
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
          </div>

          {/* Node Grid */}
          {viewMode === 'nodes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 font-mono">
              {heatNodes.map((node) => {
                const metricVal = node[nodeMetricKey];
                const isSelected = selectedHeatNode?.id === node.id;
                const colorClass = getNodeColor(metricVal, nodeMetricKey);

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedHeatNode(isSelected ? null : node)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${colorClass} ${
                      isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400">
                        {node.role}
                      </span>
                      <span className="text-[10px] text-slate-400">{node.zone}</span>
                    </div>

                    <div className="text-sm font-bold text-white truncate mb-1">
                      {node.name}
                    </div>

                    <div className="text-[11px] text-slate-400 mb-3">
                      {node.instanceType} · {node.podCount}/{node.maxPods} pods
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase">
                        {nodeMetricKey === 'cpuPercent' ? 'CPU' : nodeMetricKey === 'memoryPercent' ? 'RAM' : nodeMetricKey === 'diskIoPercent' ? 'Disk IO' : 'Temp'}
                      </span>
                      <span className="text-xl font-bold tabular-nums">
                        {metricVal}
                        {nodeMetricKey === 'temperatureC' ? '°C' : '%'}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                      <div>CPU: <span className="text-slate-200 tabular-nums">{node.cpuPercent}%</span></div>
                      <div>RAM: <span className="text-slate-200 tabular-nums">{node.memoryPercent}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pod Grid */}
          {viewMode === 'pods' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
              {heatPods.map((pod) => {
                const metricVal = pod[podMetricKey];
                const isSelected = selectedHeatPod?.id === pod.id;
                const colorClass = getPodColor(metricVal, podMetricKey);

                return (
                  <div
                    key={pod.id}
                    onClick={() => setSelectedHeatPod(isSelected ? null : pod)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${colorClass} ${
                      isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1 text-slate-400">
                      <span className="truncate max-w-[80px]">{pod.namespace}</span>
                      <span className={pod.status === 'CrashLoop' ? 'text-rose-400 font-bold' : ''}>{pod.status}</span>
                    </div>

                    <div className="text-xs font-bold text-white truncate mb-2" title={pod.name}>
                      {pod.name}
                    </div>

                    <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-800/80">
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

          {/* Selected Pod or Node Quick Card */}
          {selectedHeatNode && (
            <div className="p-4 bg-slate-900 border border-cyan-500/50 rounded-lg shadow-xl font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">{selectedHeatNode.name}</span>
                  <span className="text-slate-400">({selectedHeatNode.zone} · {selectedHeatNode.instanceType})</span>
                </div>
                <button
                  onClick={() => setSelectedHeatNode(null)}
                  className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-2 bg-slate-950 rounded">
                  <div className="text-[10px] text-slate-500">CPU LOAD</div>
                  <div className="text-sm font-bold text-white tabular-nums">{selectedHeatNode.cpuPercent}%</div>
                </div>
                <div className="p-2 bg-slate-950 rounded">
                  <div className="text-[10px] text-slate-500">RAM USAGE</div>
                  <div className="text-sm font-bold text-white tabular-nums">{selectedHeatNode.memoryPercent}%</div>
                </div>
                <div className="p-2 bg-slate-950 rounded">
                  <div className="text-[10px] text-slate-500">DISK I/O</div>
                  <div className="text-sm font-bold text-white tabular-nums">{selectedHeatNode.diskIoPercent}%</div>
                </div>
                <div className="p-2 bg-slate-950 rounded">
                  <div className="text-[10px] text-slate-500">TEMPERATURE</div>
                  <div className="text-sm font-bold text-white tabular-nums">{selectedHeatNode.temperatureC}°C</div>
                </div>
                <div className="p-2 bg-slate-950 rounded">
                  <div className="text-[10px] text-slate-500">ALLOCATED PODS</div>
                  <div className="text-sm font-bold text-cyan-400 tabular-nums">{selectedHeatNode.podCount} / {selectedHeatNode.maxPods}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
