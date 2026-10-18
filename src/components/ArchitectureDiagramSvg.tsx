import React, { useState, useMemo, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Activity, Info, Shield, Database, Cloud, Cpu, Layers } from 'lucide-react';
import { TopologyNode, TopologyEdge } from '../types';

interface ArchitectureDiagramSvgProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  selectedNode: TopologyNode | null;
  onSelectNode: (node: TopologyNode | null) => void;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  node: TopologyNode;
}

export const ArchitectureDiagramSvg: React.FC<ArchitectureDiagramSvgProps> = ({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [isTrafficActive, setIsTrafficActive] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Width and height of diagram canvas
  const canvasWidth = 920;
  const canvasHeight = 520;

  // Calculate layout coordinates dynamically into 3-4 structured logical tiers
  const layout = useMemo(() => {
    // Categorize nodes into logical architecture tiers
    const tier1: TopologyNode[] = []; // Ingress & Clients & Source
    const tier2: TopologyNode[] = []; // Control Plane & Policies
    const tier3: TopologyNode[] = []; // Workload Pods & Services
    const tier4: TopologyNode[] = []; // Storage & Data Layer & Spoke targets

    nodes.forEach((node) => {
      if (node.type === 'cloud' || node.type === 'ingress') {
        tier1.push(node);
      } else if (node.type === 'control-plane') {
        tier2.push(node);
      } else if (node.type === 'pod' || node.type === 'daemonset' || node.type === 'service') {
        tier3.push(node);
      } else {
        tier4.push(node);
      }
    });

    // Fallback if some tier is empty to ensure balanced distribution
    const tiers = [tier1, tier2, tier3, tier4].filter((t) => t.length > 0);
    
    // If fewer than 2 tiers, balance nodes evenly across 3 columns
    if (tiers.length < 2) {
      const perTier = Math.ceil(nodes.length / 3);
      tiers.length = 0;
      tiers.push(nodes.slice(0, perTier));
      tiers.push(nodes.slice(perTier, perTier * 2));
      tiers.push(nodes.slice(perTier * 2));
    }

    const nodePositions: Record<string, NodePosition> = {};
    const nodeWidth = 200;
    const nodeHeight = 84;

    const columnCount = tiers.length;
    const colSpacing = (canvasWidth - 140) / Math.max(1, columnCount - 1);

    tiers.forEach((tierNodes, colIdx) => {
      const colX = 70 + colIdx * colSpacing - nodeWidth / 2;
      const rowSpacing = (canvasHeight - 100) / (tierNodes.length + 1);

      tierNodes.forEach((node, rowIdx) => {
        const rowY = 50 + (rowIdx + 1) * rowSpacing - nodeHeight / 2;
        nodePositions[node.id] = {
          x: Math.max(20, Math.min(canvasWidth - nodeWidth - 20, colX)),
          y: Math.max(20, Math.min(canvasHeight - nodeHeight - 20, rowY)),
          width: nodeWidth,
          height: nodeHeight,
          node,
        };
      });
    });

    return nodePositions;
  }, [nodes]);

  // Handle connected node highlights
  const highlightedEdgeIndices = useMemo(() => {
    const activeId = selectedNode?.id || hoveredNodeId;
    if (!activeId) return new Set<number>();

    const set = new Set<number>();
    edges.forEach((edge, idx) => {
      if (edge.from === activeId || edge.to === activeId) {
        set.add(idx);
      }
    });
    return set;
  }, [selectedNode, hoveredNodeId, edges]);

  const getNodeIcon = (type: TopologyNode['type']) => {
    switch (type) {
      case 'ingress':
        return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
      case 'control-plane':
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      case 'storage':
        return <Database className="w-3.5 h-3.5 text-amber-400" />;
      case 'cloud':
        return <Cloud className="w-3.5 h-3.5 text-sky-400" />;
      case 'pod':
        return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, z - 0.15));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      
      {/* Interactive Controls Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold uppercase tracking-wider">
            Interactive Architecture Topology
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 hidden sm:inline">
            Click any node to inspect runtime spec
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Traffic flow toggle */}
          <button
            onClick={() => setIsTrafficActive(!isTrafficActive)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              isTrafficActive
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Toggle animated data flow packets"
          >
            <Activity className="w-3 h-3" />
            <span className="text-[11px]">{isTrafficActive ? 'Data Flow: Live' : 'Data Flow: Paused'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 rounded border border-slate-700/80 p-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] tabular-nums text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-white text-slate-400 transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:text-white text-slate-400 transition-colors cursor-pointer ml-0.5 border-l border-slate-700 pl-1"
              title="Reset view"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing select-none"
        style={{ minHeight: '440px', height: '480px' }}
      >
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <defs>
            {/* Subtle background tech grid */}
            <pattern id="diag-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M 24 0 L 0 0 0 24"
                fill="none"
                stroke="rgba(51, 65, 85, 0.15)"
                strokeWidth="0.8"
              />
              <circle cx="0" cy="0" r="1" fill="rgba(100, 116, 139, 0.3)" />
            </pattern>

            {/* Standard arrowhead */}
            <marker
              id="edge-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
            </marker>

            {/* Highlighted arrowhead */}
            <marker
              id="edge-arrow-highlight"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#22d3ee" />
            </marker>

            {/* Glow filter for selected node */}
            <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Grid Pattern */}
          <rect width="100%" height="100%" fill="url(#diag-grid)" />

          {/* Render Connections / Edges */}
          <g className="edges-layer">
            {edges.map((edge, index) => {
              const sourcePos = layout[edge.from];
              const targetPos = layout[edge.to];
              if (!sourcePos || !targetPos) return null;

              const isHighlighted = highlightedEdgeIndices.has(index);

              // Calculate start and end coordinates
              const startX = sourcePos.x + sourcePos.width;
              const startY = sourcePos.y + sourcePos.height / 2;
              const endX = targetPos.x;
              const endY = targetPos.y + targetPos.height / 2;

              // Handle backward or vertical connections gracefully with curved cubic Bezier
              const dx = endX - startX;
              const midX = startX + dx * 0.5;
              const curvature = Math.abs(dx) * 0.5;

              let pathD = '';
              if (dx >= 40) {
                // Forward flowing curve
                pathD = `M ${startX} ${startY} C ${startX + curvature} ${startY}, ${endX - curvature} ${endY}, ${endX} ${endY}`;
              } else {
                // Curved loopback or vertical flow
                const offset = 50;
                pathD = `M ${startX} ${startY} C ${startX + offset} ${startY}, ${endX - offset} ${endY}, ${endX} ${endY}`;
              }

              // Midpoint for protocol label
              const labelX = (startX + endX) / 2;
              const labelY = (startY + endY) / 2 - 8;

              return (
                <g key={`${edge.from}-${edge.to}-${index}`}>
                  {/* Background wider hit target */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="14"
                    className="cursor-pointer"
                  />

                  {/* Main connection line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isHighlighted ? '#22d3ee' : '#334155'}
                    strokeWidth={isHighlighted ? 2.2 : 1.5}
                    markerEnd={isHighlighted ? 'url(#edge-arrow-highlight)' : 'url(#edge-arrow)'}
                    className="transition-colors duration-200"
                  />

                  {/* Animated data flow pulses if traffic is active */}
                  {isTrafficActive && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isHighlighted ? '#a5f3fc' : '#0891b2'}
                      strokeWidth={isHighlighted ? 2.5 : 1.6}
                      strokeDasharray="4 12"
                      strokeDashoffset="0"
                      className="pointer-events-none"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="32;0"
                        dur={isHighlighted ? '1.2s' : '2.4s'}
                        repeatCount="indefinite"
                      />
                    </path>
                  )}

                  {/* Connection protocol badge */}
                  <g transform={`translate(${labelX}, ${labelY})`} className="pointer-events-none">
                    <rect
                      x="-34"
                      y="-8"
                      width="68"
                      height="16"
                      rx="3"
                      fill="#0f172a"
                      stroke={isHighlighted ? '#06b6d4' : '#1e293b'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isHighlighted ? '#22d3ee' : '#94a3b8'}
                      fontSize="9"
                      fontFamily="ui-monospace, monospace"
                      fontWeight="600"
                    >
                      {edge.protocol.split(' ')[0]}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Render Nodes */}
          <g className="nodes-layer">
            {Object.values(layout).map(({ x, y, width, height, node }) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isConnected = highlightedEdgeIndices.size > 0 && (
                edges.some(e => (e.from === (selectedNode?.id || hoveredNodeId) && e.to === node.id) ||
                                (e.to === (selectedNode?.id || hoveredNodeId) && e.from === node.id))
              );

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => onSelectNode(isSelected ? null : node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer group"
                  filter={isSelected ? 'url(#node-glow)' : undefined}
                >
                  {/* Node container rectangle */}
                  <rect
                    width={width}
                    height={height}
                    rx="6"
                    fill={isSelected ? '#0c1a2e' : isHovered ? '#162032' : '#0f172a'}
                    stroke={
                      isSelected
                        ? '#22d3ee'
                        : isConnected
                        ? '#06b6d4'
                        : isHovered
                        ? '#475569'
                        : '#1e293b'
                    }
                    strokeWidth={isSelected ? '2' : isConnected ? '1.5' : '1'}
                    className="transition-all duration-150"
                  />

                  {/* Top Header Strip inside Node */}
                  <g transform="translate(10, 16)">
                    {/* Kind indicator */}
                    <text
                      x="0"
                      y="0"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="ui-monospace, monospace"
                      fontWeight="600"
                      letterSpacing="0.05em"
                    >
                      {node.type.toUpperCase()}
                    </text>

                    {/* Status indicator text */}
                    <text
                      x={width - 20}
                      y="0"
                      textAnchor="end"
                      fill="#10b981"
                      fontSize="9"
                      fontFamily="ui-monospace, monospace"
                      fontWeight="600"
                    >
                      {node.status}
                    </text>
                  </g>

                  {/* Primary Node Title */}
                  <text
                    x="10"
                    y="40"
                    fill="#ffffff"
                    fontSize="11.5"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight="700"
                  >
                    {node.label.length > 24 ? `${node.label.slice(0, 23)}…` : node.label}
                  </text>

                  {/* Namespace & Meta description line */}
                  <text
                    x="10"
                    y="58"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontFamily="ui-monospace, monospace"
                  >
                    {node.namespace ? `ns: ${node.namespace}` : 'cluster-wide'}
                  </text>

                  {/* Subtle bottom separator */}
                  <line
                    x1="10"
                    y1="66"
                    x2={width - 10}
                    y2="66"
                    stroke="#1e293b"
                    strokeWidth="0.8"
                  />

                  {/* Quick micro role label */}
                  <text
                    x="10"
                    y="76"
                    fill="#06b6d4"
                    fontSize="8.5"
                    fontFamily="ui-monospace, monospace"
                  >
                    {node.description.slice(0, 32)}…
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend / Overlay Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded px-3 py-1.5 flex items-center gap-4 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-cyan-400" />
            <span>Ingress / Gateway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-purple-400" />
            <span>Control Plane</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-emerald-400" />
            <span>Workload Pods</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded bg-amber-400" />
            <span>Persistent Storage</span>
          </div>
        </div>

        {/* Hint text */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-500 hidden sm:block">
          Double-click or drag to explore
        </div>
      </div>

    </div>
  );
};
