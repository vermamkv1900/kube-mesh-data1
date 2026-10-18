import React, { useState } from 'react';
import { Network, ShieldCheck, Zap, Layers, ArrowRight, Gauge, Check, AlertTriangle } from 'lucide-react';
import { NETWORKING_SOLUTIONS, PACKET_FLOW_SCENARIOS } from '../data/networkingData';
import { NetworkCategory } from '../types';

export const NetworkingView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | NetworkCategory>('All');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('flannel-flow');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const filteredSolutions = selectedCategory === 'All'
    ? NETWORKING_SOLUTIONS
    : NETWORKING_SOLUTIONS.filter((s) => s.category === selectedCategory);

  const currentScenario = PACKET_FLOW_SCENARIOS.find((s) => s.id === activeScenarioId) || PACKET_FLOW_SCENARIOS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Editorial Section Header */}
      <div>
        <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase mb-1 font-mono">
          Container Network Interfaces & Service Mesh Topologies
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Kubernetes Networking Solutions & Architectural Trade-offs
        </h2>
        <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
          Kubernetes networking is split into two primary layers: the <strong>Container Network Interface (CNI)</strong> responsible for IP allocation and pod-to-pod cross-node routing, and the <strong>Service Mesh</strong> responsible for L7 traffic management, mutual TLS (mTLS), and zero-trust identity.
        </p>
      </div>

      {/* Layer Filter Buttons */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          All Networking Technologies
        </button>
        <button
          onClick={() => setSelectedCategory('CNI')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            selectedCategory === 'CNI'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          CNI Plugins (Calico, Flannel, Cilium, AWS VPC CNI)
        </button>
        <button
          onClick={() => setSelectedCategory('Service Mesh')}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            selectedCategory === 'Service Mesh'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Service Meshes (Istio, Linkerd, Cilium Mesh)
        </button>
      </div>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSolutions.map((sol) => (
          <div
            key={sol.id}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between"
          >
            <div>
              {/* Card Meta (Zero-Pill Discipline) */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                <span className="text-cyan-400 uppercase font-semibold">{sol.category}</span>
                <div className="flex items-center gap-2">
                  <span>Overhead: {sol.resourceOverhead}</span>
                  <span aria-hidden="true">·</span>
                  <span>Complexity: {sol.complexity}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-white mb-2">{sol.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{sol.primaryPurpose}</p>

              {/* Technical Specifications */}
              <div className="p-3 bg-slate-950/70 border border-slate-850 rounded text-xs space-y-2 mb-4 font-mono">
                <div>
                  <span className="text-slate-500">Underlying Tech:</span>{' '}
                  <span className="text-slate-300">{sol.underlyingTech}</span>
                </div>
                <div>
                  <span className="text-slate-500">Dataplane:</span>{' '}
                  <span className="text-slate-300">{sol.dataplane}</span>
                </div>
                <div>
                  <span className="text-slate-500">Network Policies:</span>{' '}
                  <span className="text-cyan-400">{sol.networkPolicySupport}</span>
                </div>
                <div>
                  <span className="text-slate-500">Encryption:</span>{' '}
                  <span className="text-emerald-400">{sol.encryptionMethod}</span>
                </div>
              </div>

              {/* Mechanism */}
              <div className="text-xs text-slate-300 mb-4 leading-relaxed">
                <span className="text-slate-400 font-semibold block mb-1">How It Works:</span>
                {sol.howItWorks}
              </div>

              {/* Trade-offs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 mb-1.5">
                    <Check className="w-3.5 h-3.5" /> Architectural Pros
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {sol.pros.map((pro, i) => (
                      <li key={i} className="leading-tight">• {pro}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-amber-400 font-semibold flex items-center gap-1 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Operational Cons
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {sol.cons.map((con, i) => (
                      <li key={i} className="leading-tight">• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Ideal Use Cases */}
            <div className="mt-5 pt-3 border-t border-slate-850 text-xs text-slate-400">
              <span className="text-slate-300 font-semibold">Ideal Production Fit:</span>{' '}
              {sol.idealUseCases.join(' · ')}
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Architectural Comparison Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-1">
          Architectural Trade-off Comparison Matrix
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Direct evaluation of throughput, memory overhead, policy enforcement, and operational maintenance across major options.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 pr-4 font-semibold uppercase">Solution</th>
                <th className="pb-3 px-4 font-semibold uppercase">Category</th>
                <th className="pb-3 px-4 font-semibold uppercase">Dataplane Mechanism</th>
                <th className="pb-3 px-4 font-semibold uppercase">Throughput / Latency</th>
                <th className="pb-3 px-4 font-semibold uppercase">Policy Enforcement</th>
                <th className="pb-3 px-4 font-semibold uppercase">Memory Footprint</th>
                <th className="pb-3 pl-4 font-semibold uppercase">Ops Complexity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              <tr>
                <td className="py-3 pr-4 font-bold text-white">Flannel</td>
                <td className="py-3 px-4 text-slate-400">CNI</td>
                <td className="py-3 px-4">Linux VXLAN / Bridge</td>
                <td className="py-3 px-4 text-amber-400">Moderate (MTU penalty)</td>
                <td className="py-3 px-4 text-red-400">None (Open by default)</td>
                <td className="py-3 px-4 text-emerald-400">&lt;10MB / node</td>
                <td className="py-3 pl-4 text-emerald-400">Very Low</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-white">Calico</td>
                <td className="py-3 px-4 text-slate-400">CNI</td>
                <td className="py-3 px-4">BGP Native / VXLAN / eBPF</td>
                <td className="py-3 px-4 text-emerald-400">Wire-speed (BGP Flat)</td>
                <td className="py-3 px-4 text-emerald-400">L3/L4 Global Policies</td>
                <td className="py-3 px-4 text-slate-300">~60MB / node</td>
                <td className="py-3 pl-4 text-amber-400">Medium</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-white">Cilium CNI</td>
                <td className="py-3 px-4 text-slate-400">CNI</td>
                <td className="py-3 px-4">Linux Kernel eBPF (XDP/tc)</td>
                <td className="py-3 px-4 text-emerald-400">Ultra-High (O(1) Hash)</td>
                <td className="py-3 px-4 text-emerald-400">L3/L4/L7 + DNS Filtering</td>
                <td className="py-3 px-4 text-emerald-400">~25MB / node</td>
                <td className="py-3 pl-4 text-amber-400">Medium-High</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-white">AWS VPC CNI</td>
                <td className="py-3 px-4 text-slate-400">CNI</td>
                <td className="py-3 px-4">Native AWS ENI Secondary IPs</td>
                <td className="py-3 px-4 text-emerald-400">Native VPC Line Rate</td>
                <td className="py-3 px-4 text-cyan-400">EKS Policies / Calico</td>
                <td className="py-3 px-4 text-slate-300">~20MB / node</td>
                <td className="py-3 pl-4 text-slate-300">Low-Medium</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-white">Istio (Classic)</td>
                <td className="py-3 px-4 text-slate-400">Service Mesh</td>
                <td className="py-3 px-4">Envoy Proxy Sidecar per Pod</td>
                <td className="py-3 px-4 text-amber-400">+1.5ms to 3ms P99</td>
                <td className="py-3 px-4 text-emerald-400">L7 Routing, JWT, SPIFFE</td>
                <td className="py-3 px-4 text-red-400">50-150MB per Pod</td>
                <td className="py-3 pl-4 text-red-400">High</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-white">Linkerd</td>
                <td className="py-3 px-4 text-slate-400">Service Mesh</td>
                <td className="py-3 px-4">Rust Micro-Proxy Sidecar</td>
                <td className="py-3 px-4 text-emerald-400">&lt;1ms P99 Latency</td>
                <td className="py-3 px-4 text-cyan-400">ServerAuth & mTLS</td>
                <td className="py-3 px-4 text-emerald-400">15-30MB per Pod</td>
                <td className="py-3 pl-4 text-emerald-400">Low-Medium</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-white">Cilium Mesh</td>
                <td className="py-3 px-4 text-slate-400">Service Mesh</td>
                <td className="py-3 px-4">Kernel eBPF + Node Envoy</td>
                <td className="py-3 px-4 text-emerald-400">Sub-millisecond L4</td>
                <td className="py-3 px-4 text-emerald-400">CiliumNetworkPolicy L7</td>
                <td className="py-3 px-4 text-emerald-400">Shared per Node (0/pod)</td>
                <td className="py-3 pl-4 text-amber-400">Medium</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Packet Flow Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">
              Interactive Packet Flow & Latency Pathway Visualizer
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Trace how a packet travels through Linux network namespaces, iptables, eBPF maps, and Envoy proxies.
            </p>
          </div>

          {/* Scenario Picker */}
          <div className="flex items-center gap-2">
            {PACKET_FLOW_SCENARIOS.map((scen) => (
              <button
                key={scen.id}
                onClick={() => {
                  setActiveScenarioId(scen.id);
                  setActiveStepIndex(0);
                }}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                  activeScenarioId === scen.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
                }`}
              >
                {scen.solutionType}
              </button>
            ))}
          </div>
        </div>

        {/* Current Scenario Info */}
        <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg mb-6">
          <div className="text-sm font-bold text-white">{currentScenario.title}</div>
          <div className="text-xs text-slate-300 mt-0.5">{currentScenario.description}</div>
        </div>

        {/* Timeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-6">
          {currentScenario.steps.map((st, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={st.step}
                onClick={() => setActiveStepIndex(idx)}
                className={`p-3 rounded border text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/20'
                    : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-cyan-400 font-bold">Step {st.step}</span>
                  <span className="text-slate-400 tabular-nums">+{st.latencyMicroseconds}µs</span>
                </div>
                <div className="text-xs font-semibold text-white truncate">{st.location}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep-Dive */}
        {currentScenario.steps[activeStepIndex] && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-cyan-400 font-semibold mb-1">
                Active Step {currentScenario.steps[activeStepIndex].step}: {currentScenario.steps[activeStepIndex].location}
              </div>
              <div className="text-sm font-bold text-white">
                {currentScenario.steps[activeStepIndex].action}
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                {currentScenario.steps[activeStepIndex].detail}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500 uppercase font-mono">Segment Overhead</div>
              <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
                {currentScenario.steps[activeStepIndex].latencyMicroseconds} µs
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
