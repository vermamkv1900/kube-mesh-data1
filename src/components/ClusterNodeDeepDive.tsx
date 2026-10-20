import React, { useState, useMemo } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Thermometer,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Clock,
  Terminal,
} from 'lucide-react';
import { DETAILED_NODES, DETAILED_PODS } from '../data/clusterRealisticData';
import { ClusterNodeDetailed, NodeCondition, NodeTimeSeriesPoint } from '../types';

interface ClusterNodeDeepDiveProps {
  onSelectPod?: (podId: string) => void;
  onOpenAnomalyReport?: (findingId?: string) => void;
}

export const ClusterNodeDeepDive: React.FC<ClusterNodeDeepDiveProps> = ({
  onSelectPod,
  onOpenAnomalyReport,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(DETAILED_NODES[1].id);
  const [roleFilter, setRoleFilter] = useState<'all' | 'control-plane' | 'worker-spot' | 'worker-ondemand' | 'worker-gpu' | 'worker-edge'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMetricTab, setActiveMetricTab] = useState<'cpu' | 'memory' | 'disk' | 'network' | 'temperature'>('cpu');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const selectedNode = useMemo(() => {
    return DETAILED_NODES.find((n) => n.id === selectedNodeId) || DETAILED_NODES[0];
  }, [selectedNodeId]);

  const filteredNodes = useMemo(() => {
    return DETAILED_NODES.filter((node) => {
      const matchesRole = roleFilter === 'all' || node.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesRole;
      return (
        matchesRole &&
        (node.name.toLowerCase().includes(q) ||
          node.instanceType.toLowerCase().includes(q) ||
          node.zone.toLowerCase().includes(q) ||
          node.internalIP.toLowerCase().includes(q))
      );
    });
  }, [roleFilter, searchQuery]);

  // Pods running on the selected node
  const runningPods = useMemo(() => {
    return DETAILED_PODS.filter((p) => selectedNode.runningPodIds.includes(p.id));
  }, [selectedNode]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(id);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const getStatusBadge = (status: ClusterNodeDetailed['status']) => {
    switch (status) {
      case 'Ready':
        return (
          <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
          </span>
        );
      case 'Warning':
        return (
          <span className="text-amber-400 flex items-center gap-1 font-mono text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Warning
          </span>
        );
      case 'Critical':
        return (
          <span className="text-rose-400 flex items-center gap-1 font-mono text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Critical Saturation
          </span>
        );
    }
  };

  // Helper to render SVG time-series sparkline / area chart for the node history
  const renderHistoryChart = (
    data: NodeTimeSeriesPoint[],
    key: 'cpuPercent' | 'memoryPercent' | 'diskIoOpsSec' | 'networkThroughputMbps' | 'temperatureC',
    colorHex: string,
    unit: string,
    threshold?: number
  ) => {
    const values = data.map((d) => d[key]);
    const maxVal = Math.max(...values, threshold ? threshold * 1.1 : 100);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    const width = 640;
    const height = 140;
    const padX = 35;
    const padY = 20;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const points = values.map((val, idx) => {
      const x = padX + (idx / (values.length - 1)) * chartW;
      const y = padY + chartH - ((val - minVal) / range) * chartH;
      return `${x},${y}`;
    });

    const areaPath = `M ${padX},${padY + chartH} L ${points.join(' L ')} L ${padX + chartW},${padY + chartH} Z`;
    const linePath = `M ${points.join(' L ')}`;

    // Threshold Y coordinate
    const thresholdY = threshold
      ? padY + chartH - ((threshold - minVal) / range) * chartH
      : null;

    return (
      <div className="relative bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">
              24-Hour Telemetry History ({unit})
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">1-hour Prometheus scrapes</span>
          </div>
          <div className="flex items-center gap-4 text-xs tabular-nums">
            <span className="text-slate-400">
              Min: <strong className="text-white">{Math.min(...values)}{unit}</strong>
            </span>
            <span className="text-slate-400">
              Current: <strong style={{ color: colorHex }}>{values[values.length - 1]}{unit}</strong>
            </span>
            <span className="text-slate-400">
              Max: <strong className="text-white">{Math.max(...values)}{unit}</strong>
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible select-none">
          <defs>
            <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.35" />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padX} y1={padY} x2={padX + chartW} y2={padY} stroke="#1e293b" strokeDasharray="2,2" />
          <line x1={padX} y1={padY + chartH / 2} x2={padX + chartW} y2={padY + chartH / 2} stroke="#1e293b" strokeDasharray="2,2" />
          <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#334155" />

          {/* Threshold alert line */}
          {thresholdY !== null && thresholdY >= padY && thresholdY <= padY + chartH && (
            <g>
              <line
                x1={padX}
                y1={thresholdY}
                x2={padX + chartW}
                y2={thresholdY}
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <text x={padX + chartW + 5} y={thresholdY + 3} fill="#f43f5e" fontSize="8">
                Alert: {threshold}{unit}
              </text>
            </g>
          )}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#grad-${key})`} />

          {/* Line stroke */}
          <path d={linePath} fill="none" stroke={colorHex} strokeWidth="2" />

          {/* Interactive dots at intervals */}
          {values.map((val, idx) => {
            const x = padX + (idx / (values.length - 1)) * chartW;
            const y = padY + chartH - ((val - minVal) / range) * chartH;
            if (idx % 3 === 0 || idx === values.length - 1) {
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#020617"
                  stroke={colorHex}
                  strokeWidth="1.5"
                />
              );
            }
            return null;
          })}

          {/* X axis labels */}
          <text x={padX} y={height - 2} fill="#64748b" fontSize="8">
            24h ago ({data[0]?.timestamp})
          </text>
          <text x={padX + chartW / 2} y={height - 2} fill="#64748b" fontSize="8" textAnchor="middle">
            12h ago ({data[12]?.timestamp})
          </text>
          <text x={padX + chartW} y={height - 2} fill="#64748b" fontSize="8" textAnchor="end">
            Now ({data[data.length - 1]?.timestamp})
          </text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Search Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-0.5">
            <Server className="w-3.5 h-3.5" />
            <span>Kubernetes Node Telemetry & Allocation Explorer</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Node Fleet Historical Saturation & Capacity Diagnostics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Detailed 24h history for CPU load, memory RSS, disk I/O ops/sec, thermal load, and hardware kernel conditions across {DETAILED_NODES.length} nodes.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter node or IP..."
              className="bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-44"
            />
          </div>

          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({DETAILED_NODES.length})
            </button>
            <button
              onClick={() => setRoleFilter('worker-spot')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                roleFilter === 'worker-spot'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spot
            </button>
            <button
              onClick={() => setRoleFilter('worker-ondemand')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                roleFilter === 'worker-ondemand'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              On-Demand
            </button>
            <button
              onClick={() => setRoleFilter('worker-gpu')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                roleFilter === 'worker-gpu'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GPU (H100)
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Left Node List, Right Node Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Node Selection Cards (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
          {filteredNodes.map((node) => {
            const isSelected = node.id === selectedNode.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer font-mono ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/80 shadow-sm'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{node.name}</span>
                    <span className="text-[10px] text-slate-500">({node.zone})</span>
                  </div>
                  {getStatusBadge(node.status)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>{node.instanceType}</span>
                  <span className="text-slate-500">{node.internalIP}</span>
                </div>

                {/* Progress Mini Bars */}
                <div className="space-y-1.5 pt-1 border-t border-slate-900 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">CPU Usage:</span>
                    <span className={`font-semibold tabular-nums ${node.usage.cpuPercent > 80 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {node.usage.cpuPercent}% ({node.usage.cpuCores} / {node.capacity.cpuCores} cores)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${node.usage.cpuPercent > 80 ? 'bg-rose-500' : 'bg-cyan-500'}`}
                      style={{ width: `${node.usage.cpuPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">RAM Usage:</span>
                    <span className={`font-semibold tabular-nums ${node.usage.memoryPercent > 80 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {node.usage.memoryPercent}% ({node.usage.memoryGiB} / {node.capacity.memoryGiB} GiB)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${node.usage.memoryPercent > 80 ? 'bg-rose-500' : 'bg-purple-500'}`}
                      style={{ width: `${node.usage.memoryPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-slate-500 pt-0.5">
                    <span>Pods: {node.usage.podCount} / {node.capacity.pods}</span>
                    <span>Temp: {node.usage.temperatureC}°C</span>
                    <span>Disk: {node.usage.diskIoOpsSec} IOPS</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Node Deep Dive Telemetry & Statistics (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-6">
          
          {/* Header of Selected Node */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-xl font-bold text-white tracking-tight font-mono">
                  {selectedNode.name}
                </h4>
                {getStatusBadge(selectedNode.status)}
                {selectedNode.status !== 'Ready' && onOpenAnomalyReport && (
                  <button
                    onClick={() => onOpenAnomalyReport('anom-01')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-mono cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>View SRE Anomaly</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span>Role: <strong className="text-cyan-400 uppercase">{selectedNode.role}</strong></span>
                <span className="text-slate-600">·</span>
                <span>Zone: <strong className="text-slate-300">{selectedNode.zone}</strong></span>
                <span className="text-slate-600">·</span>
                <span>Type: <strong className="text-slate-300">{selectedNode.instanceType}</strong></span>
                <span className="text-slate-600">·</span>
                <span>IP: <strong className="text-slate-300">{selectedNode.internalIP}</strong></span>
              </div>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="text-slate-500 block">Kubelet Runtime</span>
              <span className="text-slate-300 font-semibold">{selectedNode.kubeletVersion}</span>
            </div>
          </div>

          {/* Allocation vs Capacity KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">CPU Cores</span>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                {selectedNode.usage.cpuCores} <span className="text-xs text-slate-500 font-normal">/ {selectedNode.capacity.cpuCores} cores</span>
              </div>
              <div className="text-[11px] text-cyan-400 mt-1">
                Allocatable: {selectedNode.allocatable.cpuCores} cores
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">Memory GiB</span>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                {selectedNode.usage.memoryGiB} <span className="text-xs text-slate-500 font-normal">/ {selectedNode.capacity.memoryGiB} GiB</span>
              </div>
              <div className="text-[11px] text-purple-400 mt-1">
                Allocatable: {selectedNode.allocatable.memoryGiB} GiB
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">Pod Slots</span>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                {selectedNode.usage.podCount} <span className="text-xs text-slate-500 font-normal">/ {selectedNode.capacity.pods} pods</span>
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                Remaining: {selectedNode.capacity.pods - selectedNode.usage.podCount} slots
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">Ephemeral Storage</span>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                {selectedNode.capacity.ephemeralStorageGiB} <span className="text-xs text-slate-500 font-normal">GiB</span>
              </div>
              <div className="text-[11px] text-amber-400 mt-1">
                Allocatable: {selectedNode.allocatable.ephemeralStorageGiB} GiB
              </div>
            </div>
          </div>

          {/* Detailed Time-Series History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h5 className="text-sm font-bold text-white font-mono">
                  Historical Telemetry Stream
                </h5>
              </div>

              {/* Metric Tab Selector */}
              <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-xs font-mono">
                <button
                  onClick={() => setActiveMetricTab('cpu')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMetricTab === 'cpu'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CPU %
                </button>
                <button
                  onClick={() => setActiveMetricTab('memory')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMetricTab === 'memory'
                      ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Memory %
                </button>
                <button
                  onClick={() => setActiveMetricTab('disk')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMetricTab === 'disk'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Disk IOPS
                </button>
                <button
                  onClick={() => setActiveMetricTab('network')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMetricTab === 'network'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Net Mbps
                </button>
                <button
                  onClick={() => setActiveMetricTab('temperature')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activeMetricTab === 'temperature'
                      ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Thermal °C
                </button>
              </div>
            </div>

            {/* Active Chart */}
            {activeMetricTab === 'cpu' &&
              renderHistoryChart(selectedNode.history, 'cpuPercent', '#06b6d4', '%', 80)}
            {activeMetricTab === 'memory' &&
              renderHistoryChart(selectedNode.history, 'memoryPercent', '#a855f7', '%', 85)}
            {activeMetricTab === 'disk' &&
              renderHistoryChart(selectedNode.history, 'diskIoOpsSec', '#f59e0b', ' IOPS', 3000)}
            {activeMetricTab === 'network' &&
              renderHistoryChart(selectedNode.history, 'networkThroughputMbps', '#10b981', ' Mbps')}
            {activeMetricTab === 'temperature' &&
              renderHistoryChart(selectedNode.history, 'temperatureC', '#f43f5e', '°C', 70)}
          </div>

          {/* Node Conditions Table */}
          <div className="space-y-2 font-mono">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Node Conditions (Hardware & Kubelet Health Status)
            </span>
            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="px-3 py-2">Condition</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Message</th>
                    <th className="px-3 py-2 text-right">Last Transition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {selectedNode.conditions.map((cond) => {
                    const isHealthy = cond.type === 'Ready' ? cond.status : !cond.status;
                    return (
                      <tr key={cond.type} className="hover:bg-slate-900/60 transition-colors">
                        <td className="px-3 py-2 font-semibold text-slate-200">
                          {cond.type}
                        </td>
                        <td className="px-3 py-2">
                          {isHealthy ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Nominal
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1 text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Pressure Detected
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-300 text-[11px]">
                          {cond.message}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-500 text-[11px]">
                          {cond.lastTransitionTime.split('T')[1]?.replace('Z', ' UTC')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Hardware & Kernel Specs */}
          <div className="p-3 bg-slate-950 border border-slate-850 rounded font-mono text-xs space-y-2">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              System Environment & Kernel Subsystem
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">OS Image:</span>
                <span className="text-slate-300 font-medium">{selectedNode.osImage}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kernel Version:</span>
                <span className="text-slate-300 font-medium">{selectedNode.kernelVersion}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Container Runtime:</span>
                <span className="text-slate-300 font-medium">{selectedNode.containerRuntime}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pod CIDR:</span>
                <span className="text-cyan-400 font-medium">{selectedNode.podCIDR}</span>
              </div>
            </div>
          </div>

          {/* Running Pods on this Node */}
          {runningPods.length > 0 && (
            <div className="space-y-2 font-mono">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                Workload Pods Hosted on {selectedNode.name} ({runningPods.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {runningPods.map((pod) => (
                  <div
                    key={pod.id}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-center justify-between hover:border-cyan-500/50 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 truncate max-w-[200px]">
                        {pod.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ns: <span className="text-cyan-400">{pod.namespace}</span> · QoS: {pod.qosClass}
                      </div>
                    </div>
                    {onSelectPod && (
                      <button
                        onClick={() => onSelectPod(pod.id)}
                        className="px-2 py-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded transition-colors cursor-pointer flex items-center gap-1"
                      >
                        Inspect <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Node Taints & Labels */}
          <div className="space-y-2 font-mono text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Node Labels & Scheduling Taints
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {Object.entries(selectedNode.labels).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => handleCopy(`${k}=${v}`, k)}
                  className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-slate-300 cursor-pointer flex items-center gap-1"
                  title="Click to copy label"
                >
                  <span className="text-slate-500">{k}:</span>
                  <span className="text-cyan-400">{v || '""'}</span>
                  {copiedLabel === k ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
