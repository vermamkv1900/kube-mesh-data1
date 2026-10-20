import React, { useState, useMemo } from 'react';
import {
  HardDrive,
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  ArrowDownUp,
  TrendingUp,
  FileCode,
  ShieldAlert,
  Server,
  Filter,
  Search,
  Clock,
  Radio,
  FileText,
} from 'lucide-react';
import { DETAILED_PODS, DETAILED_NODES } from '../data/clusterRealisticData';
import { ClusterPodDetailed, PodVolumetric, VolumeTimeSeriesPoint } from '../types';

interface ClusterPodVolumetricsProps {
  initialPodId?: string;
  onOpenAnomalyReport?: (findingId?: string) => void;
}

export const ClusterPodVolumetrics: React.FC<ClusterPodVolumetricsProps> = ({
  initialPodId,
  onOpenAnomalyReport,
}) => {
  const [selectedPodId, setSelectedPodId] = useState<string>(
    initialPodId || 'pod-05' // Default to banking-postgres-cluster-1 which has rich volumetrics
  );
  const [namespaceFilter, setNamespaceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [volumetricViewTab, setVolumetricViewTab] = useState<'iops' | 'throughput' | 'capacity'>('iops');

  const selectedPod = useMemo(() => {
    return DETAILED_PODS.find((p) => p.id === selectedPodId) || DETAILED_PODS[0];
  }, [selectedPodId]);

  const namespaces = useMemo(() => {
    const set = new Set<string>();
    DETAILED_PODS.forEach((p) => set.add(p.namespace));
    return ['all', ...Array.from(set)];
  }, []);

  const filteredPods = useMemo(() => {
    return DETAILED_PODS.filter((pod) => {
      const matchesNs = namespaceFilter === 'all' || pod.namespace === namespaceFilter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesNs;
      return (
        matchesNs &&
        (pod.name.toLowerCase().includes(q) ||
          pod.namespace.toLowerCase().includes(q) ||
          pod.nodeName.toLowerCase().includes(q) ||
          pod.volumetrics.some((v) => v.pvcName.toLowerCase().includes(q) || v.mountPath.toLowerCase().includes(q)))
      );
    });
  }, [namespaceFilter, searchQuery]);

  const getStatusBadge = (status: ClusterPodDetailed['status']) => {
    switch (status) {
      case 'Running':
        return (
          <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Running
          </span>
        );
      case 'Throttled':
        return (
          <span className="text-amber-400 flex items-center gap-1 font-mono text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> CPU Throttled
          </span>
        );
      case 'CrashLoop':
        return (
          <span className="text-rose-400 flex items-center gap-1 font-mono text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> CrashLoopBackOff
          </span>
        );
      case 'Evicted':
        return (
          <span className="text-rose-500 flex items-center gap-1 font-mono text-xs">
            <AlertTriangle className="w-3.5 h-3.5" /> Evicted
          </span>
        );
    }
  };

  // Helper to render volumetric time series chart
  const renderVolumeChart = (
    data: VolumeTimeSeriesPoint[],
    metricKey: 'iops' | 'throughput' | 'capacity'
  ) => {
    if (!data || data.length === 0) return null;

    const width = 620;
    const height = 130;
    const padX = 40;
    const padY = 15;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    let points: string[] = [];
    let color = '#f59e0b';
    let unit = '';
    let values: number[] = [];

    if (metricKey === 'iops') {
      values = data.map((d) => d.iopsRead + d.iopsWrite);
      unit = ' IOPS';
      color = '#06b6d4';
    } else if (metricKey === 'throughput') {
      values = data.map((d) => d.throughputMBs);
      unit = ' MB/s';
      color = '#10b981';
    } else {
      values = data.map((d) => d.usedGiB);
      unit = ' GiB';
      color = '#f59e0b';
    }

    const maxVal = Math.max(...values, 10);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    points = values.map((val, idx) => {
      const x = padX + (idx / (values.length - 1)) * chartW;
      const y = padY + chartH - ((val - minVal) / range) * chartH;
      return `${x},${y}`;
    });

    const areaPath = `M ${padX},${padY + chartH} L ${points.join(' L ')} L ${padX + chartW},${padY + chartH} Z`;
    const linePath = `M ${points.join(' L ')}`;

    return (
      <div className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-semibold">
            Volume IO History ({unit.trim()})
          </span>
          <div className="flex items-center gap-3 tabular-nums">
            <span className="text-slate-500">Min: <strong className="text-slate-200">{Math.min(...values)}{unit}</strong></span>
            <span className="text-slate-500">Peak: <strong className="text-cyan-400">{Math.max(...values)}{unit}</strong></span>
            <span className="text-slate-500">Now: <strong className="text-white">{values[values.length - 1]}{unit}</strong></span>
          </div>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible select-none">
          <defs>
            <linearGradient id={`grad-vol-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line x1={padX} y1={padY} x2={padX + chartW} y2={padY} stroke="#1e293b" strokeDasharray="2,2" />
          <line x1={padX} y1={padY + chartH} x2={padX + chartW} y2={padY + chartH} stroke="#334155" />

          <path d={areaPath} fill={`url(#grad-vol-${metricKey})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="1.8" />

          <text x={padX} y={height - 1} fill="#64748b" fontSize="8">24h ago</text>
          <text x={padX + chartW} y={height - 1} fill="#64748b" fontSize="8" textAnchor="end">Now</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Filter Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-0.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Kubernetes Pod Storage & Volumetrics Diagnostics</span>
          </div>
          <h3 className="text-base font-bold text-white">
            PersistentVolumeClaim (PVC), IOPS & Inode Volumetrics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time storage analytics tracking CSI driver attachments, read/write IOPS, throughput MB/s, disk capacity utilization, inode saturation, and crash histories.
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
              placeholder="Filter pod or PVC..."
              className="bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-44"
            />
          </div>

          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-xs font-mono">
            {namespaces.map((ns) => (
              <button
                key={ns}
                onClick={() => setNamespaceFilter(ns)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer capitalize ${
                  namespaceFilter === ns
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ns}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Pod Selection List (4 cols) */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[720px] overflow-y-auto pr-1 font-mono">
          {filteredPods.map((pod) => {
            const isSelected = pod.id === selectedPod.id;
            const volumeCount = pod.volumetrics.length;
            const totalStorageGb = pod.volumetrics.reduce((acc, v) => acc + v.capacityGiB, 0);

            return (
              <div
                key={pod.id}
                onClick={() => setSelectedPodId(pod.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/80 shadow-sm'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white text-xs truncate max-w-[210px]">
                    {pod.name}
                  </span>
                  {getStatusBadge(pod.status)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="text-cyan-400">ns: {pod.namespace}</span>
                  <span className="text-slate-500">{pod.nodeName}</span>
                </div>

                {/* Volumetric Meta */}
                <div className="pt-2 border-t border-slate-900 text-[10px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Storage Volume:</span>
                    <span className="text-amber-400 font-semibold">
                      {volumeCount > 0 ? `${totalStorageGb} GiB across ${volumeCount} PVC(s)` : 'Stateless (No PVC)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">CPU Throttling:</span>
                    <span className={`font-semibold tabular-nums ${pod.cpuThrottlePercent > 70 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {pod.cpuThrottlePercent}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Memory Working Set:</span>
                    <span className={`font-semibold tabular-nums ${pod.memoryPercent > 85 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {pod.memoryPercent}% ({pod.memoryUsageMiB} MiB)
                    </span>
                  </div>

                  {pod.restarts > 0 && (
                    <div className="text-rose-400 font-semibold pt-0.5">
                      Restarts: {pod.restarts} (OOMKilled events recorded)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Pod & Volumetrics Deep Dive (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-6">
          
          {/* Header of Selected Pod */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-xl font-bold text-white tracking-tight font-mono">
                  {selectedPod.name}
                </h4>
                {getStatusBadge(selectedPod.status)}
                {selectedPod.status !== 'Running' && onOpenAnomalyReport && (
                  <button
                    onClick={() => onOpenAnomalyReport('anom-01')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[11px] font-mono cursor-pointer"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Investigate SRE Incident</span>
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                <span>Namespace: <strong className="text-cyan-400">{selectedPod.namespace}</strong></span>
                <span className="text-slate-600">·</span>
                <span>Host Node: <strong className="text-slate-300">{selectedPod.nodeName}</strong></span>
                <span className="text-slate-600">·</span>
                <span>Pod IP: <strong className="text-slate-300">{selectedPod.podIP}</strong></span>
                <span className="text-slate-600">·</span>
                <span>QoS: <strong className="text-purple-400">{selectedPod.qosClass}</strong></span>
              </div>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="text-slate-500 block">Network Traffic</span>
              <span className="text-slate-300 font-semibold">
                Rx {selectedPod.networkRxMb}MB · Tx {selectedPod.networkTxMb}MB
              </span>
            </div>
          </div>

          {/* Core Resource Quotas Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">CPU Usage</span>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                {selectedPod.cpuUsageCores} <span className="text-xs text-slate-500 font-normal">/ {selectedPod.cpuLimitCores} cores</span>
              </div>
              <div className={`text-[11px] mt-1 ${selectedPod.cpuThrottlePercent > 70 ? 'text-rose-400 font-semibold' : 'text-cyan-400'}`}>
                Throttle: {selectedPod.cpuThrottlePercent}%
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">Memory Limit</span>
              <div className="text-base font-bold text-white tabular-nums mt-0.5">
                {selectedPod.memoryUsageMiB} <span className="text-xs text-slate-500 font-normal">/ {selectedPod.memoryLimitMiB} MiB</span>
              </div>
              <div className={`text-[11px] mt-1 ${selectedPod.memoryPercent > 85 ? 'text-rose-400 font-semibold' : 'text-purple-400'}`}>
                Saturation: {selectedPod.memoryPercent}%
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">Container Restarts</span>
              <div className={`text-base font-bold tabular-nums mt-0.5 ${selectedPod.restarts > 0 ? 'text-rose-400' : 'text-white'}`}>
                {selectedPod.restarts} <span className="text-xs text-slate-500 font-normal">restarts</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {selectedPod.restarts > 0 ? 'CrashLoop events logged' : 'Nominal zero restarts'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded">
              <span className="text-slate-500 text-[10px] block uppercase font-semibold">Attached Volumes</span>
              <div className="text-base font-bold text-amber-400 tabular-nums mt-0.5">
                {selectedPod.volumetrics.length} <span className="text-xs text-slate-500 font-normal">bound PVC(s)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {selectedPod.volumetrics.reduce((a, b) => a + b.capacityGiB, 0)} GiB persistent
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION: DETAILED STORAGE VOLUMETRICS & IOPS             */}
          {/* ======================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-mono">
                <Database className="w-4 h-4 text-amber-400" />
                <h5 className="text-sm font-bold text-white">
                  Persistent Storage Volumetrics & CSI Subsystem
                </h5>
              </div>

              {selectedPod.volumetrics.length > 0 && (
                <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setVolumetricViewTab('iops')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      volumetricViewTab === 'iops'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    IOPS History
                  </button>
                  <button
                    onClick={() => setVolumetricViewTab('throughput')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      volumetricViewTab === 'throughput'
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Throughput MB/s
                  </button>
                  <button
                    onClick={() => setVolumetricViewTab('capacity')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      volumetricViewTab === 'capacity'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Storage GiB
                  </button>
                </div>
              )}
            </div>

            {selectedPod.volumetrics.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded font-mono text-xs text-slate-400">
                <HardDrive className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">Stateless Microservice Container</p>
                <p className="text-slate-500 mt-1">This pod does not mount any persistent volume claims (PVC). Ephemeral local storage is backed by host root volume.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPod.volumetrics.map((vol) => (
                  <div
                    key={vol.pvcName}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 font-mono"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{vol.volumeName}</span>
                          <span className="text-xs text-cyan-400">({vol.storageClass})</span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px]">
                            {vol.volumeStatus}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Mount: <strong className="text-slate-200">{vol.mountPath}</strong> · PVC: <span className="text-slate-500">{vol.pvcName}</span>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-slate-500 block">CSI Driver</span>
                        <span className="text-slate-300 font-medium">{vol.csiDriver}</span>
                      </div>
                    </div>

                    {/* Capacity Usage Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Capacity Allocation: <strong className="text-white tabular-nums">{vol.usedGiB} GiB</strong> of <strong className="text-slate-300">{vol.capacityGiB} GiB</strong>
                        </span>
                        <span className={`font-bold tabular-nums ${vol.usagePercent > 80 ? 'text-rose-400' : 'text-amber-400'}`}>
                          {vol.usagePercent}% used
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${vol.usagePercent > 80 ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${vol.usagePercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Volumetrics KPI Matrix (IOPS, Throughput, Inodes, FS) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                        <span className="text-slate-500 text-[10px] block">Read / Write IOPS</span>
                        <span className="text-cyan-400 font-bold tabular-nums">
                          {vol.iopsRead} / {vol.iopsWrite}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Total: {vol.iopsRead + vol.iopsWrite} IOPS</span>
                      </div>

                      <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                        <span className="text-slate-500 text-[10px] block">IO Throughput</span>
                        <span className="text-emerald-400 font-bold tabular-nums">
                          {vol.throughputReadMBs}R / {vol.throughputWriteMBs}W
                        </span>
                        <span className="text-[10px] text-slate-500 block">MB/s rate</span>
                      </div>

                      <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                        <span className="text-slate-500 text-[10px] block">Inode Saturation</span>
                        <span className="text-purple-400 font-bold tabular-nums">
                          {vol.inodesPercent}%
                        </span>
                        <span className="text-[10px] text-slate-500 block">{vol.inodesUsed.toLocaleString()} / {vol.inodesTotal.toLocaleString()}</span>
                      </div>

                      <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                        <span className="text-slate-500 text-[10px] block">Filesystem & Mode</span>
                        <span className="text-slate-200 font-bold uppercase">
                          {vol.fileSystemType}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{vol.accessMode}</span>
                      </div>
                    </div>

                    {/* Historical Sparkline */}
                    {vol.history && vol.history.length > 0 && renderVolumeChart(vol.history, volumetricViewTab)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Container Lifecycle & Crash Events History */}
          <div className="space-y-3 font-mono">
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">
              Container Lifecycle & Process Termination Events
            </span>

            {selectedPod.restartEvents.length === 0 ? (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero crash events recorded. Container running continuously without restarts.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedPod.restartEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-950/20 border border-rose-500/40 rounded text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-rose-300 font-semibold">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Termination: {evt.reason} (Exit Code {evt.exitCode})</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{evt.timestamp}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {evt.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
