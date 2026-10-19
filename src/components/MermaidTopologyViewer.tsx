import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, FileCode, Layers } from 'lucide-react';
import { TopologyNode, TopologyEdge } from '../types';

interface MermaidTopologyViewerProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  projectTitle: string;
  architectureSummary: string;
}

export const MermaidTopologyViewer: React.FC<MermaidTopologyViewerProps> = ({
  nodes,
  edges,
  projectTitle,
  architectureSummary,
}) => {
  const [direction, setDirection] = useState<'LR' | 'TD'>('LR');
  const [zoom, setZoom] = useState(1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid configuration once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      themeVariables: {
        darkMode: true,
        background: '#090d16',
        primaryColor: '#0e7490',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#06b6d4',
        lineColor: '#38bdf8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a',
      },
    });
  }, []);

  // Generate dynamic Mermaid diagram definition from nodes and edges
  const mermaidSyntax = React.useMemo(() => {
    const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_]/g, '_');

    let code = `flowchart ${direction}\n`;
    code += `  %% Architecture: ${projectTitle.split(':')[0]}\n\n`;

    // Group nodes into logical subgraphs
    const ingressNodes = nodes.filter((n) => n.type === 'ingress' || n.type === 'cloud');
    const controlNodes = nodes.filter((n) => n.type === 'control-plane');
    const workloadNodes = nodes.filter((n) => n.type === 'pod' || n.type === 'service' || n.type === 'daemonset');
    const storageNodes = nodes.filter((n) => n.type === 'storage');

    if (ingressNodes.length > 0) {
      code += `  subgraph INGRESS_LAYER["🌐 Ingress & Traffic Perimeter"]\n`;
      ingressNodes.forEach((n) => {
        const id = sanitizeId(n.id);
        const label = n.label.replace(/"/g, "'");
        code += `    ${id}["${label}<br/><small>${n.type} · ${n.status}</small>"]\n`;
      });
      code += `  end\n\n`;
    }

    if (controlNodes.length > 0) {
      code += `  subgraph CONTROL_PLANE["⚙️ Control Plane & Policy Engine"]\n`;
      controlNodes.forEach((n) => {
        const id = sanitizeId(n.id);
        const label = n.label.replace(/"/g, "'");
        code += `    ${id}["${label}<br/><small>ns: ${n.namespace || 'system'}</small>"]\n`;
      });
      code += `  end\n\n`;
    }

    if (workloadNodes.length > 0) {
      code += `  subgraph WORKLOAD_FABRIC["⚡ Microservices & Pod Fabric"]\n`;
      workloadNodes.forEach((n) => {
        const id = sanitizeId(n.id);
        const label = n.label.replace(/"/g, "'");
        code += `    ${id}["${label}<br/><small>ns: ${n.namespace || 'workloads'}</small>"]\n`;
      });
      code += `  end\n\n`;
    }

    if (storageNodes.length > 0) {
      code += `  subgraph DATA_TIER["💾 Storage & Stateful Tier"]\n`;
      storageNodes.forEach((n) => {
        const id = sanitizeId(n.id);
        const label = n.label.replace(/"/g, "'");
        code += `    ${id}[("${label}<br/><small>${n.description.slice(0, 30)}...</small>")]\n`;
      });
      code += `  end\n\n`;
    }

    // Connect edges
    code += `  %% Inter-service connections\n`;
    edges.forEach((edge) => {
      const fromId = sanitizeId(edge.from);
      const toId = sanitizeId(edge.to);
      const proto = edge.protocol.split(' ')[0] || 'TCP';
      code += `  ${fromId} -->|"${proto}"| ${toId}\n`;
    });

    // Custom styling
    code += `\n  classDef default fill:#0f172a,stroke:#334155,stroke-width:1px,color:#f8fafc;\n`;
    code += `  classDef ingress fill:#0c4a6e,stroke:#0284c7,stroke-width:1.5px,color:#bae6fd;\n`;
    code += `  classDef control fill:#3b0764,stroke:#9333ea,stroke-width:1.5px,color:#f3e8ff;\n`;
    code += `  classDef workload fill:#064e3b,stroke:#059669,stroke-width:1.5px,color:#a7f3d0;\n`;
    code += `  classDef storage fill:#451a03,stroke:#d97706,stroke-width:1.5px,color:#fef3c7;\n`;

    ingressNodes.forEach((n) => (code += `  class ${sanitizeId(n.id)} ingress;\n`));
    controlNodes.forEach((n) => (code += `  class ${sanitizeId(n.id)} control;\n`));
    workloadNodes.forEach((n) => (code += `  class ${sanitizeId(n.id)} workload;\n`));
    storageNodes.forEach((n) => (code += `  class ${sanitizeId(n.id)} storage;\n`));

    return code;
  }, [nodes, edges, direction, projectTitle]);

  // Render diagram via mermaid.render
  useEffect(() => {
    let isMounted = true;
    const renderId = `mermaid-render-${Date.now()}`;

    mermaid
      .render(renderId, mermaidSyntax)
      .then(({ svg }) => {
        if (isMounted) {
          setSvgContent(svg);
          setRenderError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setRenderError(err?.message || 'Failed to render Mermaid diagram.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mermaidSyntax]);

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidSyntax);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Top Controls Toolbar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Mermaid.js Flowchart Generator</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 hidden sm:inline">
            Live compiled from cluster components
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Orientation switch */}
          <div className="flex items-center bg-slate-800 rounded border border-slate-700 p-0.5">
            <button
              onClick={() => setDirection('LR')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                direction === 'LR' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Horizontal (LR)
            </button>
            <button
              onClick={() => setDirection('TD')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                direction === 'TD' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vertical (TD)
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 rounded border border-slate-700 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1 text-[11px] tabular-nums text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer border-l border-slate-700 pl-1"
              title="Reset"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Copy Mermaid Syntax */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 cursor-pointer"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'Copied' : 'Mermaid Code'}</span>
          </button>
        </div>
      </div>

      {/* Mermaid Graph Render Container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-auto bg-slate-950 p-6 flex items-center justify-center min-h-[460px] max-h-[560px]"
      >
        {renderError ? (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded text-xs font-mono text-red-300 max-w-md">
            <div className="font-bold mb-1">Mermaid Render Error:</div>
            {renderError}
          </div>
        ) : (
          <div
            className="transition-transform duration-200 w-full flex justify-center"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {/* Mermaid Code Collapsible Drawer */}
      <details className="border-t border-slate-850 bg-slate-900/40 group">
        <summary className="px-4 py-2 text-xs font-mono text-slate-400 cursor-pointer hover:text-slate-200 select-none flex items-center justify-between">
          <span>View Compiled Mermaid Syntax</span>
          <span className="text-[10px] text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <pre className="p-4 text-[11px] font-mono text-slate-300 bg-slate-950 overflow-x-auto border-t border-slate-850 leading-relaxed max-h-48">
          {mermaidSyntax}
        </pre>
      </details>
    </div>
  );
};
