import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Shield,
  Layers,
  Database,
  Server,
  Activity,
  Cpu,
  Radio,
  Eye,
  Info,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  HardDrive,
  X,
} from 'lucide-react';
import { CLUSTER_ARCHITECTURE_SPEC } from '../data/clusterRealisticData';
import { ClusterArchitectureComponent } from '../types';

interface ClusterRealisticArchitectureProps {
  onSelectComponent?: (comp: ClusterArchitectureComponent) => void;
}

export const ClusterRealisticArchitecture: React.FC<ClusterRealisticArchitectureProps> = ({
  onSelectComponent,
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedComp, setSelectedComp] = useState<ClusterArchitectureComponent | null>(
    CLUSTER_ARCHITECTURE_SPEC[0]
  );
  const [isTrafficFlowing, setIsTrafficFlowing] = useState(true);
  const [activeLayerFilter, setActiveLayerFilter] = useState<'all' | 'control-plane' | 'node-pools' | 'networking-fabric' | 'storage-csi' | 'observability'>('all');

  const filteredComponents = activeLayerFilter === 'all'
    ? CLUSTER_ARCHITECTURE_SPEC
    : CLUSTER_ARCHITECTURE_SPEC.filter((c) => c.layer === activeLayerFilter);

  const getLayerColor = (layer: ClusterArchitectureComponent['layer']) => {
    switch (layer) {
      case 'control-plane':
        return 'text-purple-400 border-purple-500/40 bg-purple-950/20';
      case 'node-pools':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
      case 'networking-fabric':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20';
      case 'storage-csi':
        return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
      case 'observability':
        return 'text-blue-400 border-blue-500/40 bg-blue-950/20';
    }
  };

  const getLayerBadge = (layer: ClusterArchitectureComponent['layer']) => {
    switch (layer) {
      case 'control-plane':
        return 'Control Plane';
      case 'node-pools':
        return 'Worker Node Pool';
      case 'networking-fabric':
        return 'Networking & CNI';
      case 'storage-csi':
        return 'Storage & CSI';
      case 'observability':
        return 'Telemetry & SRE';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Layer Controls */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-0.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Kubernetes Multi-Tier Cluster Architecture</span>
          </div>
          <h3 className="text-base font-bold text-white">
            High-Availability Production Topology Map
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Declarative layout of HA Control Plane (API server, etcd quorum, scheduler, controllers), heterogeneous worker pools, eBPF CNI fabric, CSI storage drivers, and Hubble telemetry.
          </p>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5 text-xs font-mono">
            <button
              onClick={() => setActiveLayerFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayerFilter === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => setActiveLayerFilter('control-plane')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayerFilter === 'control-plane'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Control Plane
            </button>
            <button
              onClick={() => setActiveLayerFilter('node-pools')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayerFilter === 'node-pools'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Node Pools
            </button>
            <button
              onClick={() => setActiveLayerFilter('networking-fabric')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayerFilter === 'networking-fabric'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Networking
            </button>
            <button
              onClick={() => setActiveLayerFilter('storage-csi')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayerFilter === 'storage-csi'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Storage CSI
            </button>
          </div>

          <button
            onClick={() => setIsTrafficFlowing(!isTrafficFlowing)}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
              isTrafficFlowing
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isTrafficFlowing ? 'Traffic Flow: ON' : 'Traffic Flow: PAUSED'}
          </button>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Architecture Visualizer Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive SVG Architecture Canvas */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-auto min-h-[580px] flex flex-col justify-between">
          <div
            className="transition-transform duration-200 origin-top-left"
            style={{ transform: `scale(${zoom})`, minWidth: '780px' }}
          >
            {/* SVG Diagram Canvas */}
            <svg
              viewBox="0 0 860 620"
              className="w-full h-auto select-none font-mono"
            >
              <defs>
                {/* Linear Gradients for tiers */}
                <linearGradient id="grad-control" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1035" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0c0716" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="grad-worker" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06241a" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#03120c" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="grad-net" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#082333" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#04121b" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="grad-storage" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2b1a06" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#140c03" stopOpacity="0.9" />
                </linearGradient>

                {/* Filter for glow */}
                <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Arrow markers */}
                <marker
                  id="arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#06b6d4" />
                </marker>
                <marker
                  id="arrow-purple"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#a855f7" />
                </marker>
                <marker
                  id="arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
                </marker>
              </defs>

              {/* Grid Background Pattern */}
              <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.3" />
              </pattern>
              <rect width="860" height="620" fill="url(#grid-pattern)" />

              {/* ======================================================== */}
              {/* TIER 1: CLIENTS & INGRESS PERIMETER (Top)               */}
              {/* ======================================================== */}
              <g className="cursor-pointer" onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-net-ingress') || null)}>
                <rect
                  x="30"
                  y="20"
                  width="800"
                  height="64"
                  rx="6"
                  fill="url(#grad-net)"
                  stroke={selectedComp?.id === 'arch-net-ingress' ? '#06b6d4' : '#1e3a5f'}
                  strokeWidth={selectedComp?.id === 'arch-net-ingress' ? '2' : '1'}
                />
                <text x="50" y="44" fill="#38bdf8" fontSize="11" fontWeight="bold">
                  PERIMETER TRAFFIC GATEWAY & INGRESS
                </text>
                <text x="50" y="62" fill="#94a3b8" fontSize="9">
                  Cloud Network Load Balancer (NLB) · Envoy Gateway API v1.1.0 · TLS 1.3 Termination · WAF Rate-Limiting
                </text>
                <rect x="710" y="36" width="100" height="24" rx="4" fill="#0c4a6e" stroke="#0284c7" strokeWidth="1" />
                <text x="760" y="52" fill="#e0f2fe" fontSize="9" textAnchor="middle" fontWeight="bold">
                  4,850 RPS
                </text>
              </g>

              {/* Connecting lines from Ingress down to API Server and Worker Pods */}
              <path
                d="M 230 84 L 230 130"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray={isTrafficFlowing ? "4,4" : "none"}
                className={isTrafficFlowing ? "animate-pulse" : ""}
                markerEnd="url(#arrow-cyan)"
              />
              <path
                d="M 630 84 L 630 260"
                stroke="#06b6d4"
                strokeWidth="1.5"
                strokeDasharray={isTrafficFlowing ? "4,4" : "none"}
                className={isTrafficFlowing ? "animate-pulse" : ""}
                markerEnd="url(#arrow-cyan)"
              />

              {/* ======================================================== */}
              {/* TIER 2: HIGH-AVAILABILITY CONTROL PLANE (Left Box)       */}
              {/* ======================================================== */}
              <rect
                x="30"
                y="130"
                width="380"
                height="320"
                rx="6"
                fill="url(#grad-control)"
                stroke="#4c1d95"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
              <text x="45" y="152" fill="#c084fc" fontSize="11" fontWeight="bold">
                KUBERNETES CONTROL PLANE (HA TIER)
              </text>
              <text x="45" y="168" fill="#a855f7" fontSize="8">
                3-Node Active-Active API + Raft Quorum (v1.30.2)
              </text>

              {/* Component: kube-apiserver */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-apiserver') || null)}
              >
                <rect
                  x="45"
                  y="185"
                  width="350"
                  height="48"
                  rx="4"
                  fill="#2e1065"
                  stroke={selectedComp?.id === 'arch-apiserver' ? '#c084fc' : '#581c87'}
                  strokeWidth={selectedComp?.id === 'arch-apiserver' ? '2' : '1'}
                />
                <text x="60" y="206" fill="#f3e8ff" fontSize="10" fontWeight="bold">
                  kube-apiserver (3x HA Instances)
                </text>
                <text x="60" y="222" fill="#d8b4fe" fontSize="8">
                  TCP 6443 · Declarative REST Gatekeeper · RBAC Admission
                </text>
                <circle cx="375" cy="209" r="4" fill="#10b981" />
              </g>

              {/* Component: etcd Raft Quorum */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-etcd') || null)}
              >
                <rect
                  x="45"
                  y="245"
                  width="350"
                  height="48"
                  rx="4"
                  fill="#2e1065"
                  stroke={selectedComp?.id === 'arch-etcd' ? '#c084fc' : '#581c87'}
                  strokeWidth={selectedComp?.id === 'arch-etcd' ? '2' : '1'}
                />
                <text x="60" y="266" fill="#f3e8ff" fontSize="10" fontWeight="bold">
                  etcd Distributed Raft Quorum
                </text>
                <text x="60" y="282" fill="#d8b4fe" fontSize="8">
                  TCP 2379/2380 · Multi-AZ Raft Quorum · Single Source of Truth
                </text>
                <circle cx="375" cy="269" r="4" fill="#10b981" />
              </g>

              {/* Component: kube-scheduler */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-scheduler') || null)}
              >
                <rect
                  x="45"
                  y="305"
                  width="170"
                  height="46"
                  rx="4"
                  fill="#2e1065"
                  stroke={selectedComp?.id === 'arch-scheduler' ? '#c084fc' : '#581c87'}
                  strokeWidth={selectedComp?.id === 'arch-scheduler' ? '2' : '1'}
                />
                <text x="55" y="325" fill="#f3e8ff" fontSize="9" fontWeight="bold">
                  kube-scheduler
                </text>
                <text x="55" y="340" fill="#d8b4fe" fontSize="7.5">
                  Bin-packing & Topology
                </text>
                <circle cx="195" cy="328" r="3.5" fill="#10b981" />
              </g>

              {/* Component: kube-controller-manager */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-controller-manager') || null)}
              >
                <rect
                  x="225"
                  y="305"
                  width="170"
                  height="46"
                  rx="4"
                  fill="#2e1065"
                  stroke={selectedComp?.id === 'arch-controller-manager' ? '#c084fc' : '#581c87'}
                  strokeWidth={selectedComp?.id === 'arch-controller-manager' ? '2' : '1'}
                />
                <text x="235" y="325" fill="#f3e8ff" fontSize="9" fontWeight="bold">
                  kube-controller-mgr
                </text>
                <text x="235" y="340" fill="#d8b4fe" fontSize="7.5">
                  Node & Pod Reconcilers
                </text>
                <circle cx="375" cy="328" r="3.5" fill="#10b981" />
              </g>

              {/* Cilium eBPF Kernel Datapath Box inside Control Plane bridge */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-net-cilium') || null)}
              >
                <rect
                  x="45"
                  y="365"
                  width="350"
                  height="70"
                  rx="4"
                  fill="#082f49"
                  stroke={selectedComp?.id === 'arch-net-cilium' ? '#38bdf8' : '#0369a1'}
                  strokeWidth={selectedComp?.id === 'arch-net-cilium' ? '2' : '1'}
                />
                <text x="60" y="388" fill="#e0f2fe" fontSize="10" fontWeight="bold">
                  Cilium eBPF Datapath & Kube-Proxy Replacement
                </text>
                <text x="60" y="404" fill="#7dd3fc" fontSize="8">
                  TC & XDP Hook Filters · BPF Host Routing · WireGuard Node Encryption
                </text>
                <text x="60" y="420" fill="#38bdf8" fontSize="7.5">
                  Zero iptables overhead · Latency &lt; 0.05ms
                </text>
                <circle cx="375" cy="400" r="4" fill="#10b981" />
              </g>

              {/* Connecting line from Control Plane to Worker Pools */}
              <path
                d="M 410 210 L 440 210 L 440 330 L 450 330"
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray={isTrafficFlowing ? "4,4" : "none"}
                className={isTrafficFlowing ? "animate-pulse" : ""}
                markerEnd="url(#arrow-purple)"
              />

              {/* ======================================================== */}
              {/* TIER 3: WORKER NODE COMPUTE POOLS (Right Box)            */}
              {/* ======================================================== */}
              <rect
                x="450"
                y="130"
                width="380"
                height="320"
                rx="6"
                fill="url(#grad-worker)"
                stroke="#065f46"
                strokeWidth="1"
                strokeDasharray="4,2"
              />
              <text x="465" y="152" fill="#6ee7b7" fontSize="11" fontWeight="bold">
                CLUSTER WORKER NODE POOLS (DATA PLANE)
              </text>
              <text x="465" y="168" fill="#34d399" fontSize="8">
                8 Heterogeneous Nodes across 3 Availability Zones (Karpenter Autoscaled)
              </text>

              {/* Pool 1: Spot Compute Pool */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-pool-spot') || null)}
              >
                <rect
                  x="465"
                  y="185"
                  width="170"
                  height="115"
                  rx="4"
                  fill="#064e3b"
                  stroke={selectedComp?.id === 'arch-pool-spot' ? '#34d399' : '#047857'}
                  strokeWidth={selectedComp?.id === 'arch-pool-spot' ? '2' : '1'}
                />
                <text x="475" y="205" fill="#ecfdf5" fontSize="9" fontWeight="bold">
                  Spot Worker Pool (ARM64)
                </text>
                <text x="475" y="220" fill="#a7f3d0" fontSize="7.5">
                  4x c6g / r6g Nodes
                </text>
                <text x="475" y="235" fill="#6ee7b7" fontSize="7">
                  Pods: checkout, auth, keda
                </text>
                <text x="475" y="250" fill="#34d399" fontSize="7">
                  CPU Avg: 58% · Spot Savings: 68%
                </text>
                <rect x="475" y="265" width="150" height="20" rx="3" fill="#022c22" />
                <text x="550" y="278" fill="#10b981" fontSize="7.5" textAnchor="middle">
                  Karpenter Price-Optimized
                </text>
              </g>

              {/* Pool 2: On-Demand Stateful Core */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-pool-ondemand') || null)}
              >
                <rect
                  x="645"
                  y="185"
                  width="170"
                  height="115"
                  rx="4"
                  fill="#064e3b"
                  stroke={selectedComp?.id === 'arch-pool-ondemand' ? '#f59e0b' : '#b45309'}
                  strokeWidth={selectedComp?.id === 'arch-pool-ondemand' ? '2' : '1'}
                />
                <text x="655" y="205" fill="#fef3c7" fontSize="9" fontWeight="bold">
                  On-Demand Core (x86_64)
                </text>
                <text x="655" y="220" fill="#fde68a" fontSize="7.5">
                  2x m6i.2xlarge Nodes
                </text>
                <text x="655" y="235" fill="#fbbf24" fontSize="7">
                  Pods: postgres-1, payments
                </text>
                <text x="655" y="250" fill="#f59e0b" fontSize="7">
                  Mem Saturation: 91% (Alert)
                </text>
                <rect x="655" y="265" width="150" height="20" rx="3" fill="#451a03" />
                <text x="730" y="278" fill="#f59e0b" fontSize="7.5" textAnchor="middle">
                  Persistent Storage Attached
                </text>
              </g>

              {/* Pool 3: GPU AI/ML Pool */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-pool-gpu') || null)}
              >
                <rect
                  x="465"
                  y="310"
                  width="170"
                  height="125"
                  rx="4"
                  fill="#064e3b"
                  stroke={selectedComp?.id === 'arch-pool-gpu' ? '#34d399' : '#047857'}
                  strokeWidth={selectedComp?.id === 'arch-pool-gpu' ? '2' : '1'}
                />
                <text x="475" y="330" fill="#ecfdf5" fontSize="9" fontWeight="bold">
                  GPU AI/ML Pool (H100)
                </text>
                <text x="475" y="345" fill="#a7f3d0" fontSize="7.5">
                  2x p5.48xlarge (16 GPUs)
                </text>
                <text x="475" y="360" fill="#6ee7b7" fontSize="7">
                  vLLM Llama-3-70B Head+Worker
                </text>
                <text x="475" y="375" fill="#34d399" fontSize="7">
                  AWS EFA 3.2 Tbps · NCCL
                </text>
                <rect x="475" y="395" width="150" height="24" rx="3" fill="#022c22" />
                <text x="550" y="410" fill="#10b981" fontSize="7.5" textAnchor="middle">
                  1,840 tokens/sec
                </text>
              </g>

              {/* Pool 4: Edge Hybrid Store */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-pool-edge') || null)}
              >
                <rect
                  x="645"
                  y="310"
                  width="170"
                  height="125"
                  rx="4"
                  fill="#064e3b"
                  stroke={selectedComp?.id === 'arch-pool-edge' ? '#34d399' : '#047857'}
                  strokeWidth={selectedComp?.id === 'arch-pool-edge' ? '2' : '1'}
                />
                <text x="655" y="330" fill="#ecfdf5" fontSize="9" fontWeight="bold">
                  Edge Store Node (ARM64)
                </text>
                <text x="655" y="345" fill="#a7f3d0" fontSize="7.5">
                  1x Baremetal K3s Agent
                </text>
                <text x="655" y="360" fill="#6ee7b7" fontSize="7">
                  Store POS & Local Cache
                </text>
                <text x="655" y="375" fill="#34d399" fontSize="7">
                  WireGuard Tunnel to Cloud
                </text>
                <rect x="655" y="395" width="150" height="24" rx="3" fill="#022c22" />
                <text x="730" y="410" fill="#10b981" fontSize="7.5" textAnchor="middle">
                  Offline Autonomous Ready
                </text>
              </g>

              {/* ======================================================== */}
              {/* TIER 4: STORAGE & OBSERVABILITY SUB-SYSTEM (Bottom Strip) */}
              {/* ======================================================== */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-storage-csi') || null)}
              >
                <rect
                  x="30"
                  y="470"
                  width="380"
                  height="120"
                  rx="6"
                  fill="url(#grad-storage)"
                  stroke={selectedComp?.id === 'arch-storage-csi' ? '#f59e0b' : '#78350f'}
                  strokeWidth={selectedComp?.id === 'arch-storage-csi' ? '2' : '1'}
                />
                <text x="50" y="495" fill="#fde68a" fontSize="10.5" fontWeight="bold">
                  STORAGE SUBSYSTEM & CSI CONTROLLERS
                </text>
                <text x="50" y="515" fill="#fbbf24" fontSize="8.5">
                  AWS EBS gp3 & Azure Disk CSI · Local NVMe Fast-SSD StorageClasses
                </text>
                <text x="50" y="535" fill="#d97706" fontSize="7.5">
                  Total Managed Volume: 3.82 TiB across 18 PersistentVolumeClaims
                </text>
                <rect x="50" y="550" width="340" height="24" rx="4" fill="#451a03" stroke="#b45309" strokeWidth="1" />
                <text x="220" y="565" fill="#fef3c7" fontSize="8" textAnchor="middle" fontWeight="bold">
                  Automated Volume Snapshotting & CSI Multipath I/O
                </text>
              </g>

              <g
                className="cursor-pointer"
                onClick={() => setSelectedComp(CLUSTER_ARCHITECTURE_SPEC.find(c => c.id === 'arch-obs-telemetry') || null)}
              >
                <rect
                  x="450"
                  y="470"
                  width="380"
                  height="120"
                  rx="6"
                  fill="#0b1b36"
                  stroke={selectedComp?.id === 'arch-obs-telemetry' ? '#38bdf8' : '#1e3a8a'}
                  strokeWidth={selectedComp?.id === 'arch-obs-telemetry' ? '2' : '1'}
                />
                <text x="470" y="495" fill="#93c5fd" fontSize="10.5" fontWeight="bold">
                  OBSERVABILITY & eBPF SENSOR BUS
                </text>
                <text x="470" y="515" fill="#60a5fa" fontSize="8.5">
                  Prometheus High-Frequency Scrapes · Hubble Kernel Network Flow Sensor
                </text>
                <text x="470" y="535" fill="#3b82f6" fontSize="7.5">
                  84,000 samples/sec · Loki Log Fabric · Anomaly ML Detector
                </text>
                <rect x="470" y="550" width="340" height="24" rx="4" fill="#172554" stroke="#1d4ed8" strokeWidth="1" />
                <text x="640" y="565" fill="#eff6ff" fontSize="8" textAnchor="middle" fontWeight="bold">
                  Real-time Kernel Sockets & Cgroup Latency Telemetry
                </text>
              </g>
            </svg>
          </div>

          <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Click any tier or component above to inspect runtime specs</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Right 1 Col: Component Inspector Detail Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          {selectedComp ? (
            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${getLayerColor(selectedComp.layer)}`}>
                    {getLayerBadge(selectedComp.layer)}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    {selectedComp.health === 'Operational' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Nominal
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Warning
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-lg font-bold text-white tracking-tight">
                  {selectedComp.name}
                </h4>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">
                  {selectedComp.sublayer}
                </p>
              </div>

              {/* Architectural Role */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded text-xs space-y-2">
                <span className="text-slate-500 font-mono uppercase font-semibold text-[10px] block">
                  Architectural Role & Function
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedComp.role}
                </p>
              </div>

              {/* Redundancy & HA Topology */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded text-xs space-y-1 font-mono">
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                  Redundancy & Failover
                </span>
                <p className="text-slate-300 text-xs">
                  {selectedComp.redundancy}
                </p>
              </div>

              {/* Runtime Technical Specs */}
              <div className="space-y-2 text-xs font-mono">
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                  Runtime Specifications
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-slate-500 text-[10px] block">Version</span>
                    <span className="text-slate-200 font-semibold">{selectedComp.details.version}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-slate-500 text-[10px] block">Active Instances</span>
                    <span className="text-slate-200 font-semibold">{selectedComp.details.instances} replicas</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-slate-500 text-[10px] block">Network Ports</span>
                    <span className="text-slate-200 font-semibold truncate block">{selectedComp.details.ports}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-slate-500 text-[10px] block">Datapath Protocol</span>
                    <span className="text-slate-200 font-semibold truncate block">{selectedComp.details.protocol}</span>
                  </div>
                </div>
              </div>

              {/* Live Telemetry KPI Metrics */}
              <div className="space-y-2 text-xs font-mono">
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                  Live Telemetry Metrics
                </span>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-2">
                  {Object.entries(selectedComp.details.keyMetrics).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-cyan-400 font-semibold tabular-nums">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs font-mono">
              Select a component on the diagram to inspect its architecture.
            </div>
          )}

          {/* Selector pills for other components */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-slate-500 font-mono text-[10px] uppercase font-semibold block mb-2">
              Browse Cluster Components ({CLUSTER_ARCHITECTURE_SPEC.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {CLUSTER_ARCHITECTURE_SPEC.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedComp(c)}
                  className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                    selectedComp?.id === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
