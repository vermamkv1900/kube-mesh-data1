export interface NodeMetric {
  id: string;
  name: string;
  role: 'control-plane' | 'worker-spot' | 'worker-ondemand' | 'worker-gpu';
  zone: string;
  instanceType: string;
  cpuPercent: number;
  memoryPercent: number;
  podCount: number;
  maxPods: number;
  temperatureC: number;
  diskIoPercent: number;
  status: 'Ready' | 'Warning' | 'Critical';
}

export interface PodMetric {
  id: string;
  name: string;
  namespace: string;
  node: string;
  cpuThrottlePercent: number;
  memoryPercent: number;
  restarts: number;
  networkRxMb: number;
  networkTxMb: number;
  status: 'Running' | 'CrashLoop' | 'Evicted' | 'Throttled';
}

export interface AnomalyFinding {
  id: string;
  title: string;
  severity: 'Critical' | 'Warning' | 'High';
  affectedResource: string;
  resourceKind: 'Node' | 'Pod' | 'Service' | 'DaemonSet';
  cluster: string;
  region: string;
  detectedAt: string;
  summary: string;
  rootCauseAnalysis: string;
  recommendedRemediation: string;
  telemetryEvidence: {
    promql: string;
    logSnippet: string;
    metricValue: string;
  };
}

export const INITIAL_NODE_METRICS: NodeMetric[] = [
  { id: 'node-cp-01', name: 'control-plane-01', role: 'control-plane', zone: 'us-east-1a', instanceType: 'm6i.xlarge', cpuPercent: 34, memoryPercent: 48, podCount: 16, maxPods: 110, temperatureC: 38, diskIoPercent: 22, status: 'Ready' },
  { id: 'node-w-01', name: 'worker-spot-1a-01', role: 'worker-spot', zone: 'us-east-1a', instanceType: 'c6g.2xlarge', cpuPercent: 88, memoryPercent: 84, podCount: 42, maxPods: 58, temperatureC: 62, diskIoPercent: 78, status: 'Warning' },
  { id: 'node-w-02', name: 'worker-spot-1b-02', role: 'worker-spot', zone: 'us-east-1b', instanceType: 'c6g.2xlarge', cpuPercent: 46, memoryPercent: 52, podCount: 31, maxPods: 58, temperatureC: 44, diskIoPercent: 35, status: 'Ready' },
  { id: 'node-w-03', name: 'worker-ondemand-1c-03', role: 'worker-ondemand', zone: 'us-east-1c', instanceType: 'm6i.2xlarge', cpuPercent: 94, memoryPercent: 91, podCount: 48, maxPods: 58, temperatureC: 71, diskIoPercent: 89, status: 'Critical' },
  { id: 'node-w-04', name: 'worker-spot-1a-04', role: 'worker-spot', zone: 'us-east-1a', instanceType: 'r6g.xlarge', cpuPercent: 28, memoryPercent: 41, podCount: 22, maxPods: 58, temperatureC: 40, diskIoPercent: 18, status: 'Ready' },
  { id: 'node-gpu-01', name: 'gpu-worker-h100-01', role: 'worker-gpu', zone: 'us-east-1a', instanceType: 'p5.48xlarge', cpuPercent: 79, memoryPercent: 82, podCount: 8, maxPods: 32, temperatureC: 68, diskIoPercent: 64, status: 'Ready' },
  { id: 'node-gpu-02', name: 'gpu-worker-h100-02', role: 'worker-gpu', zone: 'us-east-1b', instanceType: 'p5.48xlarge', cpuPercent: 92, memoryPercent: 89, podCount: 8, maxPods: 32, temperatureC: 76, diskIoPercent: 82, status: 'Warning' },
  { id: 'node-edge-01', name: 'edge-store-node-01', role: 'worker-ondemand', zone: 'edge-site-01', instanceType: 'baremetal-arm64', cpuPercent: 42, memoryPercent: 38, podCount: 12, maxPods: 30, temperatureC: 36, diskIoPercent: 15, status: 'Ready' },
];

export const INITIAL_POD_METRICS: PodMetric[] = [
  { id: 'pod-01', name: 'auth-service-7cf948b-xk92m', namespace: 'production', node: 'worker-spot-1a-01', cpuThrottlePercent: 24, memoryPercent: 82, restarts: 0, networkRxMb: 420, networkTxMb: 390, status: 'Running' },
  { id: 'pod-02', name: 'payment-processor-5d8f99-4nxpz', namespace: 'payments', node: 'worker-ondemand-1c-03', cpuThrottlePercent: 84, memoryPercent: 94, restarts: 3, networkRxMb: 890, networkTxMb: 810, status: 'Throttled' },
  { id: 'pod-03', name: 'order-consumer-keda-8f7a-v9x12', namespace: 'workers', node: 'worker-spot-1b-02', cpuThrottlePercent: 12, memoryPercent: 54, restarts: 0, networkRxMb: 610, networkTxMb: 120, status: 'Running' },
  { id: 'pod-04', name: 'order-consumer-keda-8f7a-pl481', namespace: 'workers', node: 'worker-spot-1a-01', cpuThrottlePercent: 18, memoryPercent: 58, restarts: 0, networkRxMb: 590, networkTxMb: 110, status: 'Running' },
  { id: 'pod-05', name: 'banking-postgres-cluster-1', namespace: 'databases', node: 'worker-ondemand-1c-03', cpuThrottlePercent: 78, memoryPercent: 88, restarts: 0, networkRxMb: 1200, networkTxMb: 1850, status: 'Running' },
  { id: 'pod-06', name: 'banking-postgres-cluster-2', namespace: 'databases', node: 'worker-spot-1b-02', cpuThrottlePercent: 31, memoryPercent: 62, restarts: 0, networkRxMb: 1100, networkTxMb: 320, status: 'Running' },
  { id: 'pod-07', name: 'vllm-llama-3-70b-head-49xf', namespace: 'ml-platform', node: 'gpu-worker-h100-01', cpuThrottlePercent: 45, memoryPercent: 84, restarts: 0, networkRxMb: 2400, networkTxMb: 3100, status: 'Running' },
  { id: 'pod-08', name: 'vllm-llama-3-70b-worker-0', namespace: 'ml-platform', node: 'gpu-worker-h100-02', cpuThrottlePercent: 91, memoryPercent: 92, restarts: 1, networkRxMb: 4800, networkTxMb: 4700, status: 'Throttled' },
  { id: 'pod-09', name: 'hubble-relay-557dc85f4-8d9qm', namespace: 'kube-system', node: 'control-plane-01', cpuThrottlePercent: 4, memoryPercent: 28, restarts: 0, networkRxMb: 750, networkTxMb: 740, status: 'Running' },
  { id: 'pod-10', name: 'cilium-agent-k8j4m', namespace: 'kube-system', node: 'worker-spot-1a-01', cpuThrottlePercent: 6, memoryPercent: 32, restarts: 0, networkRxMb: 1400, networkTxMb: 1400, status: 'Running' },
  { id: 'pod-11', name: 'checkout-frontend-69f8c-2qwsx', namespace: 'production', node: 'worker-spot-1a-04', cpuThrottlePercent: 8, memoryPercent: 39, restarts: 0, networkRxMb: 280, networkTxMb: 320, status: 'Running' },
  { id: 'pod-12', name: 'inventory-svc-9b8cf-m4k18', namespace: 'production', node: 'worker-spot-1a-04', cpuThrottlePercent: 68, memoryPercent: 89, restarts: 4, networkRxMb: 520, networkTxMb: 490, status: 'CrashLoop' },
];

export const DETECTED_ANOMALIES: AnomalyFinding[] = [
  {
    id: 'anom-01',
    title: 'Severe CPU Throttling & Memory Saturation on Payment Gateway',
    severity: 'Critical',
    affectedResource: 'payment-processor-5d8f99-4nxpz',
    resourceKind: 'Pod',
    cluster: 'production-us-east-1',
    region: 'us-east-1',
    detectedAt: '2026-10-19T04:12:44Z',
    summary: 'Container CPU throttling exceeded 84% over 5 consecutive evaluation windows. Resident memory usage reached 94% of cgroup limit, inducing intermittent HTTP 504 timeouts on upstream ingress.',
    rootCauseAnalysis: 'Sudden spike in cryptographic signature verification requests exceeded the assigned CPU limit of 1.0 vCPU. The node worker-ondemand-1c-03 is experiencing noisy neighbor CPU starvation.',
    recommendedRemediation: '1) Increase resources.limits.cpu from 1000m to 2500m in payment-processor deployment. 2) Configure HorizontalPodAutoscaler targetCPUUtilizationPercentage: 70%. 3) Trigger Karpenter node-drain to rebalance onto empty spot nodes.',
    telemetryEvidence: {
      promql: 'sum(increase(container_cpu_cfs_throttled_periods_total{pod="payment-processor-5d8f99-4nxpz"}[5m])) / sum(increase(container_cpu_cfs_periods_total[5m])) = 0.842',
      logSnippet: '[ERROR] 04:12:38 HTTP 504 Gateway Timeout: connection to payment-processor timed out after 3000ms',
      metricValue: '84.2% CPU Throttled / 94.1% RAM Limit',
    },
  },
  {
    id: 'anom-02',
    title: 'CrashLoopBackOff Detected on Inventory Redis Cache Adapter',
    severity: 'High',
    affectedResource: 'inventory-svc-9b8cf-m4k18',
    resourceKind: 'Pod',
    cluster: 'production-us-east-1',
    region: 'us-east-1',
    detectedAt: '2026-10-19T04:15:10Z',
    summary: 'Pod has restarted 4 times in the past 12 minutes due to unhandled OOMKilled termination (Exit Code 137).',
    rootCauseAnalysis: 'Unbounded in-memory LRU cache leak during bulk inventory synchronization batch jobs.',
    recommendedRemediation: '1) Adjust container memory limit from 512Mi to 2Gi. 2) Apply GOGC=80 memory tuning or patch cache eviction TTL.',
    telemetryEvidence: {
      promql: 'kube_pod_container_status_last_terminated_reason{pod="inventory-svc-9b8cf-m4k18", reason="OOMKilled"} == 1',
      logSnippet: '[FATAL] 04:15:02 fatal error: runtime: out of memory (signal: killed, exit code: 137)',
      metricValue: '4 Restarts (Exit Code 137)',
    },
  },
  {
    id: 'anom-03',
    title: 'High GPU Thermal Saturation & Memory Fragmentation',
    severity: 'Warning',
    affectedResource: 'gpu-worker-h100-02',
    resourceKind: 'Node',
    cluster: 'ml-platform-us-east-1',
    region: 'us-east-1',
    detectedAt: '2026-10-19T04:18:22Z',
    summary: 'NVIDIA H100 GPU core temperature peaked at 76°C under heavy continuous token generation with 92% VRAM allocation.',
    rootCauseAnalysis: 'Ray worker running unoptimized KV cache allocation with tensor parallelism size 4 under concurrent prompt surge.',
    recommendedRemediation: 'Enable vLLM prefix caching and adjust --gpu-memory-utilization to 0.88 to prevent CUDA out-of-memory kernel traps.',
    telemetryEvidence: {
      promql: 'DCGM_FI_DEV_GPU_TEMP{instance="gpu-worker-h100-02"} >= 76',
      logSnippet: '[WARN] 04:18:19 NVIDIA-SMI: GPU 1 core temp 76C exceeds threshold; fan at 92%',
      metricValue: '76°C Core Temp / 92% VRAM',
    },
  },
];
