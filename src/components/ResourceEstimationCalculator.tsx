import React, { useState, useMemo } from 'react';
import { Cpu, HardDrive, Server, DollarSign, Zap, Copy, Check, Sliders, ShieldCheck, ArrowRight } from 'lucide-react';
import { K8sProject } from '../types';

interface ResourceEstimationCalculatorProps {
  project: K8sProject;
}

export const ResourceEstimationCalculator: React.FC<ResourceEstimationCalculatorProps> = ({ project }) => {
  // Calculator inputs
  const [rps, setRps] = useState<number>(5000);
  const [concurrentUsers, setConcurrentUsers] = useState<number>(25000);
  const [trafficProfile, setTrafficProfile] = useState<'standard' | 'compute-heavy' | 'io-heavy' | 'ai-inference'>('standard');
  const [availabilityZones, setAvailabilityZones] = useState<number>(3);
  const [useSpotInstances, setUseSpotInstances] = useState<boolean>(project.id === 'kubescale-finops');
  const [copiedHpa, setCopiedHpa] = useState<boolean>(false);

  // Quick preset buttons
  const applyPreset = (presetRps: number, presetUsers: number, profile: 'standard' | 'compute-heavy' | 'io-heavy' | 'ai-inference') => {
    setRps(presetRps);
    setConcurrentUsers(presetUsers);
    setTrafficProfile(profile);
  };

  // Architecture-specific coefficient multipliers
  const estimations = useMemo(() => {
    // Baseline CPU (millicores per 100 RPS)
    let cpuPer100Rps = 120; // 120m CPU per 100 RPS
    let ramMbPerUser = 1.8; // 1.8MB per concurrent session
    let podMemoryBaseMb = 512;
    let podRpsCapacity = 450;

    // Architectural adjustments based on project type
    const isEbpf = project.id === 'kubemesh-cilium';
    const isAi = project.id === 'kuberay-llm';
    const isStateful = project.id === 'kubestate-storage';
    const isKarpenter = project.id === 'kubescale-finops';

    if (isEbpf) {
      // Cilium eBPF eliminates sidecars, reducing CPU overhead by 28% and saving 80MB RAM per pod
      cpuPer100Rps *= 0.72;
      ramMbPerUser *= 0.85;
      podMemoryBaseMb = 384;
      podRpsCapacity = 650;
    } else if (isAi) {
      // AI Inference is heavily compute & GPU bound
      cpuPer100Rps *= 2.8;
      ramMbPerUser *= 4.5;
      podMemoryBaseMb = 4096;
      podRpsCapacity = 120;
    } else if (isStateful) {
      // Storage & database intensive
      cpuPer100Rps *= 1.4;
      ramMbPerUser *= 2.2;
      podMemoryBaseMb = 2048;
      podRpsCapacity = 300;
    }

    if (trafficProfile === 'compute-heavy') {
      cpuPer100Rps *= 1.6;
    } else if (trafficProfile === 'io-heavy') {
      ramMbPerUser *= 1.5;
    } else if (trafficProfile === 'ai-inference') {
      cpuPer100Rps *= 2.2;
      ramMbPerUser *= 3.0;
    }

    // Pod Replicas calculation (with minimum replicas and AZ balance)
    const rawReplicas = Math.ceil(rps / podRpsCapacity);
    const redundancyMultiplier = availabilityZones === 3 ? 1.35 : 1.2; // Headroom for zone failure
    const recommendedPods = Math.max(availabilityZones * 2, Math.ceil(rawReplicas * redundancyMultiplier));

    // Total CPU calculation
    const totalMillicores = (rps / 100) * cpuPer100Rps * redundancyMultiplier + (concurrentUsers * 0.4);
    const totalVcpu = Math.max(4, Math.ceil(totalMillicores / 1000));

    // Total RAM calculation (GB)
    const totalRamMb = (recommendedPods * podMemoryBaseMb) + (concurrentUsers * ramMbPerUser);
    const totalRamGb = Math.max(8, Math.ceil(totalRamMb / 1024));

    // Worker Node Sizing (Assuming standard cloud node type: 8 vCPU, 32GB RAM e.g. m6i.2xlarge / c6g.2xlarge)
    const vCpuPerNode = 8;
    const ramPerNode = 32;
    const nodesByCpu = Math.ceil((totalVcpu * 1.25) / vCpuPerNode); // 25% system reservation
    const nodesByRam = Math.ceil((totalRamGb * 1.25) / ramPerNode);
    const recommendedNodes = Math.max(availabilityZones, Math.max(nodesByCpu, nodesByRam));

    // GPU sizing if AI workload
    const estimatedGpus = isAi ? Math.max(2, Math.ceil(rps / 250)) : 0;

    // Monthly Cost estimation ($0.048 per vCPU/hr on-demand, spot discount ~65%)
    const hourlyCostPerNode = isAi ? 3.40 : 0.384; // GPU node vs standard m6i.2xlarge
    const baseMonthlyCost = recommendedNodes * hourlyCostPerNode * 730;
    const spotDiscount = useSpotInstances || isKarpenter ? 0.42 : 1.0;
    const estimatedMonthlyCost = Math.round(baseMonthlyCost * spotDiscount);
    const estimatedSavings = Math.round(baseMonthlyCost * (1 - spotDiscount));

    // Architecture specific bonus savings
    const ebpfSavingsGb = isEbpf ? Math.round(recommendedPods * 0.08) : 0;

    return {
      recommendedPods,
      totalVcpu,
      totalRamGb,
      recommendedNodes,
      estimatedGpus,
      estimatedMonthlyCost,
      estimatedSavings,
      ebpfSavingsGb,
      podCpuReq: (totalVcpu / recommendedPods).toFixed(2),
      podRamReq: (totalRamGb / recommendedPods).toFixed(1),
    };
  }, [rps, concurrentUsers, trafficProfile, availabilityZones, useSpotInstances, project.id]);

  const hpaYaml = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${project.id}-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${project.id}-workload
  minReplicas: ${availabilityZones * 2}
  maxReplicas: ${estimations.recommendedPods * 2}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 75
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80`;

  const handleCopyHpa = () => {
    navigator.clipboard.writeText(hpaYaml);
    setCopiedHpa(true);
    setTimeout(() => setCopiedHpa(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Intro & presets strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-lg">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Architecture-Aware Sizing Engine</span>
          </div>
          <h3 className="text-sm font-bold text-white">
            Kubernetes Capacity & FinOps Estimator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Estimates compute, memory, and cluster node footprint tailored to <span className="text-slate-200 font-semibold">{project.title.split(':')[0]}</span>.
          </p>
        </div>

        {/* Preset chips */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-500 font-mono mr-1">Presets:</span>
          <button
            onClick={() => applyPreset(1000, 5000, 'standard')}
            className="px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
          >
            1k RPS
          </button>
          <button
            onClick={() => applyPreset(10000, 40000, 'standard')}
            className="px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
          >
            10k RPS
          </button>
          <button
            onClick={() => applyPreset(50000, 250000, 'compute-heavy')}
            className="px-2.5 py-1 text-xs font-mono bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
          >
            50k Peak
          </button>
        </div>
      </div>

      {/* Two Column Layout: Controls on Left, Live Estimations on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-5 p-5 bg-slate-950 border border-slate-800 rounded-lg">
          
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono pb-2 border-b border-slate-850">
            1. Workload Traffic Inputs
          </div>

          {/* Peak RPS Input & Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <label htmlFor="rps-slider" className="text-slate-300 font-medium">Expected Peak Throughput</label>
              <span className="text-cyan-400 font-bold tabular-nums">
                {rps.toLocaleString()} RPS
              </span>
            </div>
            <input
              id="rps-slider"
              type="range"
              min="100"
              max="100000"
              step="500"
              value={rps}
              onChange={(e) => setRps(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>100 RPS</span>
              <span>25k</span>
              <span>50k</span>
              <span>100k RPS</span>
            </div>
          </div>

          {/* Concurrent Users Input & Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <label htmlFor="users-slider" className="text-slate-300 font-medium">Active Concurrent Sessions</label>
              <span className="text-purple-400 font-bold tabular-nums">
                {concurrentUsers.toLocaleString()} Users
              </span>
            </div>
            <input
              id="users-slider"
              type="range"
              min="500"
              max="500000"
              step="2500"
              value={concurrentUsers}
              onChange={(e) => setConcurrentUsers(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>500</span>
              <span>100k</span>
              <span>250k</span>
              <span>500k Users</span>
            </div>
          </div>

          {/* Traffic Profile Segmented Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2 font-mono">
              Workload Profile
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {[
                { id: 'standard', label: 'Standard REST/gRPC' },
                { id: 'compute-heavy', label: 'Compute Intensive' },
                { id: 'io-heavy', label: 'I/O & DB Intensive' },
                { id: 'ai-inference', label: 'AI/LLM Inference' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTrafficProfile(p.id as any)}
                  className={`p-2 rounded border text-center transition-colors cursor-pointer ${
                    trafficProfile === p.id
                      ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/60 font-semibold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Zones & Spot Switch */}
          <div className="pt-3 border-t border-slate-850 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">High Availability Zones</span>
              <div className="flex items-center gap-1.5">
                {[2, 3].map((zones) => (
                  <button
                    key={zones}
                    onClick={() => setAvailabilityZones(zones)}
                    className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                      availabilityZones === zones
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {zones} AZs
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Spot Instance Optimization</span>
              <button
                onClick={() => setUseSpotInstances(!useSpotInstances)}
                className={`px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                  useSpotInstances
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {useSpotInstances ? 'Active (Spot Diversified)' : 'Disabled (On-Demand)'}
              </button>
            </div>
          </div>

        </div>

        {/* Output Metrics (Right 7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Key Output Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* Total vCPU */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total vCPU</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {estimations.totalVcpu}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                ~{estimations.podCpuReq} vCPU / pod
              </div>
            </div>

            {/* Total RAM */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>Total RAM</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {estimations.totalRamGb} <span className="text-sm font-normal text-slate-400">GiB</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                ~{estimations.podRamReq} GiB / pod
              </div>
            </div>

            {/* Pod Replicas */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pod Replicas</span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {estimations.recommendedPods}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                spread across {availabilityZones} AZs
              </div>
            </div>

            {/* Worker Nodes */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                <span>Worker Nodes</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {estimations.recommendedNodes}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                8vCPU / 32GB shape
              </div>
            </div>

          </div>

          {/* Architecture-Specific FinOps & Sizing Impact Banner */}
          <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-semibold">Estimated Monthly Cloud Compute</span>
              <div className="flex items-center gap-2">
                {estimations.estimatedSavings > 0 && (
                  <span className="text-emerald-400 font-bold tabular-nums">
                    Save ~${estimations.estimatedSavings.toLocaleString()}/mo
                  </span>
                )}
                <span className="text-xl font-bold text-white tabular-nums font-mono">
                  ${estimations.estimatedMonthlyCost.toLocaleString()}
                  <span className="text-xs text-slate-400 font-normal"> /mo</span>
                </span>
              </div>
            </div>

            {/* Architecture-specific callout */}
            <div className="p-3 bg-slate-900/70 border border-slate-800 rounded text-xs text-slate-300 space-y-1">
              <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Architecture-Specific Efficiency Impact</span>
              </div>
              {project.id === 'kubemesh-cilium' && (
                <p>
                  <strong>Kernel eBPF Sidecarless Mesh:</strong> Saves approximately <strong>{estimations.ebpfSavingsGb} GiB RAM</strong> across the cluster by terminating mTLS in the Linux kernel instead of injecting Envoy sidecars into all {estimations.recommendedPods} pods.
                </p>
              )}
              {project.id === 'kubescale-finops' && (
                <p>
                  <strong>Karpenter Spot Provisioning:</strong> Dynamically bin-packs pods into spot instances with automated consolidation, slashing compute bills by <strong>48% to 65%</strong> compared to static Auto Scaling Groups.
                </p>
              )}
              {project.id === 'kuberay-llm' && (
                <p>
                  <strong>GPU Tensor Parallelism:</strong> Allocates approximately <strong>{estimations.estimatedGpus} high-memory GPUs</strong> with pre-cached Safetensors model weights, eliminating 15-minute cold starts.
                </p>
              )}
              {project.id === 'kubefleet-gitops' && (
                <p>
                  <strong>vCluster Virtual Tenancy:</strong> Consolidates tenant workloads on shared compute pools, avoiding standalone control plane fees ($73/mo per cluster on AWS/GKE).
                </p>
              )}
              {project.id === 'kubestate-storage' && (
                <p>
                  <strong>CloudNativePG Local Replication:</strong> Streaming replication with continuous Barman WAL archival to S3 provides zero data loss ($RPO=0$) without paying managed database markup.
                </p>
              )}
              {project.id === 'kubetelemetry-lgtm' && (
                <p>
                  <strong>LGTM Object Storage Retention:</strong> Storing compacted metrics, traces, and logs directly in S3 cuts observability ingestion costs by 75% compared to legacy Elasticsearch.
                </p>
              )}
              {project.id === 'kubeedge-hybrid' && (
                <p>
                  <strong>K3s Lightweight Agents:</strong> Consumes &lt;512MB RAM per edge store node, operating continuously on low-cost edge hardware without cloud dependency.
                </p>
              )}
            </div>
          </div>

          {/* Generated HPA Manifest Preview */}
          <div className="bg-slate-950 border border-slate-850 rounded-lg overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-850 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Generated Autoscaler (HPA v2)</span>
              <button
                onClick={handleCopyHpa}
                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {copiedHpa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHpa ? 'Copied' : 'Copy HPA Spec'}</span>
              </button>
            </div>
            <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-40">
              {hpaYaml}
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
};
