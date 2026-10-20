import React, { useState, useMemo } from 'react';
import {
  Network,
  Activity,
  Zap,
  ArrowRight,
  Shield,
  Lock,
  Layers,
  Radio,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge,
  Sliders,
} from 'lucide-react';
import { POD_CONNECTIONS, DETAILED_PODS } from '../data/clusterRealisticData';
import { PodConnection, ClusterPodDetailed } from '../types';

interface ClusterPodConnectionsViewProps {
  onSelectPod?: (podId: string) => void;
}

export const ClusterPodConnectionsView: React.FC<ClusterPodConnectionsViewProps> = ({
  onSelectPod,
}) => {
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>(POD_CONNECTIONS[2].id); // default to checkout -> payment-processor
  const [selectedPodId, setSelectedPodId] = useState<string | null>(null);
  const [isTrafficFlowing, setIsTrafficFlowing] = useState(true);
  const [matrixMetric, setMatrixMetric] = useState<'bandwidth' | 'rps' | 'latency'>('bandwidth');
  const [namespaceFilter, setNamespaceFilter] = useState<string>('all');

  const selectedConn = useMemo(() => {
    return POD_CONNECTIONS.find((c) => c.id === selectedConnectionId) || POD_CONNECTIONS[0];
  }, [selectedConnectionId]);

  // Unique communicating pods list for matrix
  const matrixPods = useMemo(() => {
    const podIds = new Set<string>();
    POD_CONNECTIONS.forEach((c) => {
      podIds.add(c.sourcePodId);
      podIds.add(c.targetPodId);
    });
    return DETAILED_PODS.filter((p) => podIds.has(p.id));
  }, []);

  // Filter connections
  const filteredConnections = useMemo(() => {
    return POD_CONNECTIONS.filter((conn) => {
      if (selectedPodId) {
        return conn.sourcePodId === selectedPodId || conn.targetPodId === selectedPodId;
      }
      if (namespaceFilter === 'all') return true;
      return conn.sourceNamespace === namespaceFilter || conn.targetNamespace === namespaceFilter;
    });
  }, [selectedPodId, namespaceFilter]);

  const getHealthBadge = (health: PodConnection['health']) => {
    switch (health) {
      case 'nominal':
        return <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Nominal</span>;
      case 'elevated':
        return <span className="text-amber-400 flex items-center gap-1 font-mono text-xs"><AlertTriangle className="w-3.5 h-3.5" /> Elevated Traffic</span>;
      case 'congested':
        return <span className="text-orange-400 flex items-center gap-1 font-mono text-xs font-semibold"><Flame className="w-3.5 h-3.5" /> Congested</span>;
      case 'degraded':
        return <span className="text-rose-400 flex items-center gap-1 font-mono text-xs font-semibold"><AlertTriangle className="w-3.5 h-3.5" /> Degraded / Packet Loss</span>;
    }
  };

  // Node positions in the interactive canvas
  const podLayoutMap = useMemo(() => {
    // Coordinate layout for key pods
    const map: Record<string, { x: number; y: number; label: string; ns: string }> = {
      'pod-11': { x: 70, y: 190, label: 'checkout-frontend', ns: 'production' },
      'pod-01': { x: 280, y: 80, label: 'auth-service', ns: 'production' },
      'pod-12': { x: 280, y: 190, label: 'inventory-svc', ns: 'production' },
      'pod-02': { x: 280, y: 310, label: 'payment-processor', ns: 'payments' },
      'pod-03': { x: 280, y: 430, label: 'order-consumer-1', ns: 'workers' },
      'pod-04': { x: 280, y: 530, label: 'order-consumer-2', ns: 'workers' },
      'pod-05': { x: 540, y: 310, label: 'postgres-primary', ns: 'databases' },
      'pod-06': { x: 740, y: 310, label: 'postgres-replica', ns: 'databases' },
      'pod-07': { x: 540, y: 100, label: 'vllm-llama-head', ns: 'ml-platform' },
      'pod-08': { x: 740, y: 100, label: 'vllm-llama-worker', ns: 'ml-platform' },
      'pod-09': { x: 540, y: 490, label: 'hubble-relay', ns: 'kube-system' },
      'pod-10': { x: 740, y: 490, label: 'cilium-agent', ns: 'kube-system' },
    };
    return map;
  }, []);

  const getNamespaceColor = (ns: string) => {
    switch (ns) {
      case 'production':
        return { bg: '#064e3b', border: '#059669', text: '#34d399' };
      case 'payments':
        return { bg: '#451a03', border: '#d97706', text: '#fbbf24' };
      case 'databases':
        return { bg: '#3b0764', border: '#9333ea', text: '#c084fc' };
      case 'ml-platform':
        return { bg: '#1e1b4b', border: '#4f46e5', text: '#818cf8' };
      case 'workers':
        return { bg: '#0c4a6e', border: '#0284c7', text: '#38bdf8' };
      default:
        return { bg: '#1e293b', border: '#475569', text: '#94a3b8' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Toolbar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-0.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Kubernetes Pod-to-Pod Network & Traffic Mesh</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Microservice Inter-Pod Connectivity & Real-Time Flow Dynamics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive topology showing protocol multiplexing (HTTP/2, gRPC, PostgreSQL wire), throughput rates, Cilium eBPF network policies, and the inter-pod traffic matrix.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => {
                setSelectedPodId(null);
                setNamespaceFilter('all');
              }}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                namespaceFilter === 'all' && !selectedPodId
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Connections ({POD_CONNECTIONS.length})
            </button>
            <button
              onClick={() => setNamespaceFilter('production')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                namespaceFilter === 'production'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setNamespaceFilter('payments')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                namespaceFilter === 'payments'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setNamespaceFilter('databases')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                namespaceFilter === 'databases'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Databases
            </button>
          </div>

          <button
            onClick={() => setIsTrafficFlowing(!isTrafficFlowing)}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
              isTrafficFlowing
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            {isTrafficFlowing ? 'Packet Animation: ON' : 'Animation: PAUSED'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid: Left Canvas, Right Connection Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Topology Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-auto min-h-[580px] flex flex-col justify-between">
          <div className="overflow-x-auto">
            <svg
              viewBox="0 0 840 600"
              className="w-full h-auto select-none font-mono min-w-[760px]"
            >
              <defs>
                <marker
                  id="flow-arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
                </marker>
                <marker
                  id="flow-arrow-amber"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" />
                </marker>
                <marker
                  id="flow-arrow-rose"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#f43f5e" />
                </marker>
                <marker
                  id="flow-arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#06b6d4" />
                </marker>
              </defs>

              {/* Grid Background Pattern */}
              <pattern id="net-grid-pattern" width="25" height="25" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#1e293b" opacity="0.4" />
              </pattern>
              <rect width="840" height="600" fill="url(#net-grid-pattern)" />

              {/* Draw Edges between Pods */}
              {POD_CONNECTIONS.map((conn) => {
                const src = podLayoutMap[conn.sourcePodId];
                const dst = podLayoutMap[conn.targetPodId];
                if (!src || !dst) return null;

                const isSelected = conn.id === selectedConn.id;
                const isFilteredOut = !filteredConnections.some((c) => c.id === conn.id);

                let strokeColor = '#0284c7';
                let markerId = 'flow-arrow-cyan';

                if (conn.health === 'nominal') {
                  strokeColor = '#10b981';
                  markerId = 'flow-arrow-emerald';
                } else if (conn.health === 'elevated') {
                  strokeColor = '#f59e0b';
                  markerId = 'flow-arrow-amber';
                } else if (conn.health === 'congested' || conn.health === 'degraded') {
                  strokeColor = '#f43f5e';
                  markerId = 'flow-arrow-rose';
                }

                // Node box dimensions
                const boxW = 140;
                const boxH = 46;

                const startX = src.x + boxW;
                const startY = src.y + boxH / 2;
                const endX = dst.x;
                const endY = dst.y + boxH / 2;

                const midX = (startX + endX) / 2;

                const pathData = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                return (
                  <g
                    key={conn.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedConnectionId(conn.id)}
                    opacity={isFilteredOut ? 0.2 : 1}
                  >
                    {/* Background hit area */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="14"
                    />

                    {/* Base edge path */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isSelected ? '#38bdf8' : strokeColor}
                      strokeWidth={isSelected ? '2.5' : '1.5'}
                      strokeDasharray={isTrafficFlowing ? '4,4' : 'none'}
                      className={isTrafficFlowing ? 'animate-pulse' : ''}
                      markerEnd={`url(#${markerId})`}
                    />

                    {/* Edge Label Pill */}
                    <rect
                      x={midX - 35}
                      y={(startY + endY) / 2 - 10}
                      width="70"
                      height="20"
                      rx="3"
                      fill="#020617"
                      stroke={isSelected ? '#38bdf8' : '#1e293b'}
                      strokeWidth="1"
                    />
                    <text
                      x={midX}
                      y={(startY + endY) / 2 + 3}
                      fill={strokeColor}
                      fontSize="7.5"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {conn.bandwidthMbps} Mbps
                    </text>
                  </g>
                );
              })}

              {/* Draw Pod Nodes */}
              {Object.entries(podLayoutMap).map(([podId, pos]) => {
                const pod = DETAILED_PODS.find((p) => p.id === podId);
                const isSelected = selectedPodId === podId;
                const colors = getNamespaceColor(pos.ns);
                const boxW = 140;
                const boxH = 46;

                return (
                  <g
                    key={podId}
                    className="cursor-pointer"
                    onClick={() => {
                      if (selectedPodId === podId) {
                        setSelectedPodId(null);
                      } else {
                        setSelectedPodId(podId);
                      }
                    }}
                  >
                    <rect
                      x={pos.x}
                      y={pos.y}
                      width={boxW}
                      height={boxH}
                      rx="5"
                      fill={colors.bg}
                      stroke={isSelected ? '#38bdf8' : colors.border}
                      strokeWidth={isSelected ? '2.5' : '1.2'}
                    />

                    {/* Pod Name */}
                    <text
                      x={pos.x + 8}
                      y={pos.y + 18}
                      fill="#f8fafc"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {pos.label}
                    </text>

                    {/* Namespace and status */}
                    <text
                      x={pos.x + 8}
                      y={pos.y + 32}
                      fill={colors.text}
                      fontSize="7.5"
                    >
                      ns: {pos.ns}
                    </text>

                    <circle
                      cx={pos.x + boxW - 12}
                      cy={pos.y + 16}
                      r="3.5"
                      fill={pod?.status === 'Running' ? '#10b981' : pod?.status === 'Throttled' ? '#f59e0b' : '#f43f5e'}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Click any pod to highlight isolated traffic edges · Click any edge to inspect flow</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Nominal (&lt;10ms)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Elevated Latency
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Congested / Drops
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Connection Telemetry Spec (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col justify-between font-mono">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-[10px] uppercase font-semibold">
                  Selected Network Flow
                </span>
                {getHealthBadge(selectedConn.health)}
              </div>

              <h4 className="text-base font-bold text-white tracking-tight">
                {selectedConn.sourcePodName}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 my-1">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{selectedConn.targetPodName}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Port: <strong className="text-slate-200">TCP {selectedConn.port}</strong> · Protocol: <strong className="text-cyan-300">{selectedConn.protocol}</strong>
              </div>
            </div>

            {/* Traffic Rates & Latency Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="text-slate-500 text-[10px] block">Bandwidth</span>
                <span className="text-cyan-400 font-bold text-sm tabular-nums">
                  {selectedConn.bandwidthMbps} Mbps
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="text-slate-500 text-[10px] block">Requests / sec</span>
                <span className="text-white font-bold text-sm tabular-nums">
                  {selectedConn.requestsPerSec.toLocaleString()} RPS
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="text-slate-500 text-[10px] block">Latency (p95)</span>
                <span className={`font-bold text-sm tabular-nums ${selectedConn.latencyP95Ms > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {selectedConn.latencyP95Ms} ms
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-850 rounded">
                <span className="text-slate-500 text-[10px] block">Latency (p99)</span>
                <span className="text-slate-300 font-bold text-sm tabular-nums">
                  {selectedConn.latencyP99Ms} ms
                </span>
              </div>
            </div>

            {/* Security & Network Policy Layer */}
            <div className="p-3.5 bg-slate-950 border border-slate-850 rounded text-xs space-y-2">
              <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                Cilium eBPF Security & Policy Enforcer
              </span>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">L7 Network Policy:</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Shield className="w-3.5 h-3.5" /> Allowed (BPF Map)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">WireGuard mTLS:</span>
                <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                  <Lock className="w-3.5 h-3.5" /> Encrypted In-Transit
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Packet Loss Rate:</span>
                <span className={`font-bold tabular-nums ${selectedConn.packetLossPercent > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {selectedConn.packetLossPercent}%
                </span>
              </div>
            </div>

            {/* Quick Pod Jumper */}
            {onSelectPod && (
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectPod(selectedConn.sourcePodId)}
                  className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[11px] transition-colors cursor-pointer text-center"
                >
                  Inspect Source Pod
                </button>
                <button
                  onClick={() => onSelectPod(selectedConn.targetPodId)}
                  className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[11px] transition-colors cursor-pointer text-center"
                >
                  Inspect Target Pod
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            Total Active Flow Streams: {POD_CONNECTIONS.length} multiplexed routes
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION: POD-TO-POD TRAFFIC FLOW HEAT MATRIX            */}
      {/* ======================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase mb-0.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Inter-Pod Traffic Flow Heat Matrix (N × N)</span>
            </div>
            <h4 className="text-base font-bold text-white">
              Communicating Microservices Matrix
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Cell intensities represent cross-pod communication intensity across availability zones.
            </p>
          </div>

          {/* Metric Selector for Heatmap */}
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setMatrixMetric('bandwidth')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                matrixMetric === 'bandwidth'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bandwidth (Mbps)
            </button>
            <button
              onClick={() => setMatrixMetric('rps')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                matrixMetric === 'rps'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Request Rate (RPS)
            </button>
            <button
              onClick={() => setMatrixMetric('latency')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                matrixMetric === 'latency'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Latency p95 (ms)
            </button>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-500 bg-slate-950 font-normal">
                  Source \ Target
                </th>
                {matrixPods.map((p) => (
                  <th
                    key={p.id}
                    className="p-2 text-slate-400 font-normal text-[11px] truncate max-w-[90px] border-b border-slate-800"
                    title={p.name}
                  >
                    {p.name.split('-')[0] + '-' + (p.name.split('-')[1] || '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {matrixPods.map((srcPod) => (
                <tr key={srcPod.id}>
                  <td
                    className="p-2 text-left font-semibold text-slate-300 text-[11px] truncate max-w-[140px] bg-slate-950/70"
                    title={srcPod.name}
                  >
                    {srcPod.name.split('-')[0] + '-' + (srcPod.name.split('-')[1] || '')}
                  </td>
                  {matrixPods.map((dstPod) => {
                    const conn = POD_CONNECTIONS.find(
                      (c) => c.sourcePodId === srcPod.id && c.targetPodId === dstPod.id
                    );

                    if (srcPod.id === dstPod.id) {
                      return (
                        <td key={dstPod.id} className="p-2 bg-slate-950 text-slate-700 text-[10px]">
                          —
                        </td>
                      );
                    }

                    if (!conn) {
                      return (
                        <td key={dstPod.id} className="p-2 text-slate-700 text-[10px]">
                          0
                        </td>
                      );
                    }

                    let valDisplay = '';
                    let bgClass = 'bg-slate-950';

                    if (matrixMetric === 'bandwidth') {
                      valDisplay = `${conn.bandwidthMbps}M`;
                      if (conn.bandwidthMbps > 200) bgClass = 'bg-purple-950/80 text-purple-300 font-bold border border-purple-500/40';
                      else if (conn.bandwidthMbps > 50) bgClass = 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40';
                      else bgClass = 'bg-emerald-950/50 text-emerald-300';
                    } else if (matrixMetric === 'rps') {
                      valDisplay = `${conn.requestsPerSec}`;
                      if (conn.requestsPerSec > 2000) bgClass = 'bg-purple-950/80 text-purple-300 font-bold border border-purple-500/40';
                      else if (conn.requestsPerSec > 800) bgClass = 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40';
                      else bgClass = 'bg-emerald-950/50 text-emerald-300';
                    } else {
                      valDisplay = `${conn.latencyP95Ms}ms`;
                      if (conn.latencyP95Ms > 30) bgClass = 'bg-rose-950/80 text-rose-300 font-bold border border-rose-500/40';
                      else if (conn.latencyP95Ms > 10) bgClass = 'bg-amber-950/80 text-amber-300 font-bold border border-amber-500/40';
                      else bgClass = 'bg-emerald-950/50 text-emerald-300';
                    }

                    return (
                      <td
                        key={dstPod.id}
                        onClick={() => setSelectedConnectionId(conn.id)}
                        className={`p-2 cursor-pointer transition-colors hover:brightness-125 ${bgClass} tabular-nums`}
                        title={`${srcPod.name} -> ${dstPod.name}: ${valDisplay}`}
                      >
                        {valDisplay}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
