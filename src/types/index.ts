export type ProjectCategory = 
  | 'GitOps & Control Plane'
  | 'Networking & Security'
  | 'Observability & SRE'
  | 'FinOps & Autoscaling'
  | 'AI/ML Infrastructure'
  | 'Storage & Stateful'
  | 'Edge & Hybrid';

export interface TopologyNode {
  id: string;
  label: string;
  type: 'ingress' | 'control-plane' | 'service' | 'daemonset' | 'storage' | 'cloud' | 'pod';
  namespace?: string;
  description: string;
  status: 'Ready' | 'Healthy' | 'Active';
}

export interface TopologyEdge {
  from: string;
  to: string;
  protocol: string;
  label?: string;
}

export interface ProjectScenario {
  id: string;
  title: string;
  description: string;
  actionName: string;
  resultLogs: string[];
  impactSummary: string;
}

export interface ManifestFile {
  title: string;
  type: 'Kubernetes YAML' | 'Helm Values' | 'Terraform / OpenTofu' | 'Crossplane XRD' | 'ArgoCD App';
  filename: string;
  content: string;
}

export interface SecurityPractice {
  id: string;
  category: 'Pod Security Standards' | 'Network Isolation' | 'RBAC & Least Privilege' | 'Supply Chain & Image' | 'Secrets & Identity';
  title: string;
  severity: 'Critical' | 'High' | 'Recommended';
  description: string;
  threatMitigated: string;
  implementationSnippet: {
    language: string;
    code: string;
  };
}

export interface SecurityProfile {
  psaLevel: 'Restricted (Highest)' | 'Baseline' | 'Privileged (Isolated)';
  overview: string;
  practices: SecurityPractice[];
}

export interface PipelineStep {
  name: string;
  command: string;
  durationSeconds: number;
  status: 'passed' | 'running' | 'pending';
  logs: string[];
}

export interface PipelineStage {
  id: string;
  name: 'Build' | 'Test' | 'Scan' | 'Deploy' | 'Verify';
  title: string;
  description: string;
  steps: PipelineStep[];
  artifacts?: string[];
}

export interface PipelineWorkflow {
  engine: 'GitHub Actions' | 'GitLab CI' | 'Argo Workflows' | 'Tekton';
  trigger: string;
  estimatedTotalMinutes: number;
  stages: PipelineStage[];
  pipelineYaml: string;
}

export interface K8sProject {
  id: string;
  title: string;
  tagline: string;
  category: ProjectCategory;
  maturity: 'Production-Hardened' | 'Enterprise Scale' | 'High Performance';
  description?: string;
  starsOrScale: string;
  primaryStack: string[];
  businessImpact: string;
  architectureSummary: string;
  topology: {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
  };
  manifests: ManifestFile[];
  scenarios: ProjectScenario[];
  keyBenefits: string[];
  tradeoffs: string[];
  securityHardening?: SecurityProfile;
  pipelineWorkflow?: PipelineWorkflow;
}

export type NetworkCategory = 'CNI' | 'Service Mesh';

export interface NetworkSolution {
  id: string;
  name: string;
  category: NetworkCategory;
  underlyingTech: string;
  dataplane: string;
  networkPolicySupport: string;
  encryptionMethod: string;
  primaryPurpose: string;
  howItWorks: string;
  pros: string[];
  cons: string[];
  idealUseCases: string[];
  resourceOverhead: 'Ultra-Low (<10MB/pod)' | 'Low (15-30MB/node)' | 'Moderate (50-100MB/node)' | 'High (Sidecar + Daemon)';
  complexity: 'Low' | 'Medium' | 'High' | 'Advanced';
}

export type ObservabilityPillar = 'Monitoring' | 'Logging' | 'Tracing';

export interface ObservabilityTool {
  id: string;
  name: string;
  pillar: ObservabilityPillar;
  primaryFunction: string;
  architecture: string;
  storageBackend: string;
  keyFeatures: string[];
  tradeoffsAndLimitations: string[];
  k8sIntegrationPattern: string;
  exampleQueryOrConfig: {
    language: string;
    sample: string;
  };
}

export interface OpenSourceProject {
  id: string;
  name: string;
  tagline: string;
  category: string;
  primaryFunction: string;
  benefitsInKubernetes: string[];
  architectureRole: string;
  githubUrl: string;
  codeSnippet: {
    title: string;
    code: string;
  };
}

export type BenchmarkStandard = 
  | 'CIS Kubernetes Benchmark'
  | 'NSA & CISA Hardening Guide'
  | 'PCI-DSS v4.0'
  | 'SOC 2 Type II'
  | 'NIST SP 800-190';

export type ComplianceCheckCategory =
  | 'Control Plane & API'
  | 'Worker Nodes & Kubelet'
  | 'Pod Security & Admission'
  | 'Network Policies & Mesh'
  | 'RBAC & Identity'
  | 'Secrets & Data Protection';

export type ComplianceSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type ComplianceStatus = 'PASS' | 'FAIL' | 'WARN';

export interface ComplianceCheck {
  id: string;
  standard: BenchmarkStandard;
  section: string;
  category: ComplianceCheckCategory;
  title: string;
  description: string;
  auditCommand?: string;
  rationale: string;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  remediation: {
    title: string;
    type: 'kubectl' | 'yaml' | 'helm';
    snippet: string;
  };
  affectedResource?: string;
}

export interface ComplianceScorecard {
  overallScore: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'C' | 'Non-Compliant';
  totalChecks: number;
  passedCount: number;
  warningCount: number;
  failedCount: number;
  categoryScores: {
    category: ComplianceCheckCategory;
    score: number;
    passed: number;
    total: number;
  }[];
  benchmarkBreakdown: {
    standard: BenchmarkStandard;
    score: number;
    passed: number;
    total: number;
  }[];
  checks: ComplianceCheck[];
  lastAuditedAt: string;
  auditTool: string;
}

export type LogLevel = 'FATAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  podName: string;
  namespace: string;
  message: string;
  rawJson?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  caller?: string;
  httpStatus?: number;
  durationMs?: number;
}

// ==========================================
// REALISTIC KUBERNETES CLUSTER & TELEMETRY TYPES
// ==========================================

export interface NodeTimeSeriesPoint {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
  diskIoOpsSec: number;
  networkThroughputMbps: number;
  temperatureC: number;
  load1m: number;
}

export interface NodeCondition {
  type: 'Ready' | 'DiskPressure' | 'MemoryPressure' | 'PIDPressure' | 'NetworkUnavailable';
  status: boolean;
  message: string;
  lastTransitionTime: string;
}

export interface NodeTaint {
  key: string;
  value?: string;
  effect: 'NoSchedule' | 'PreferNoSchedule' | 'NoExecute';
}

export interface ClusterNodeDetailed {
  id: string;
  name: string;
  role: 'control-plane' | 'worker-spot' | 'worker-ondemand' | 'worker-gpu' | 'worker-edge';
  zone: string;
  instanceType: string;
  internalIP: string;
  externalIP?: string;
  kubeletVersion: string;
  containerRuntime: string;
  osImage: string;
  kernelVersion: string;
  podCIDR: string;
  status: 'Ready' | 'Warning' | 'Critical';
  capacity: {
    cpuCores: number;
    memoryGiB: number;
    pods: number;
    ephemeralStorageGiB: number;
  };
  allocatable: {
    cpuCores: number;
    memoryGiB: number;
    pods: number;
    ephemeralStorageGiB: number;
  };
  usage: {
    cpuPercent: number;
    cpuCores: number;
    memoryPercent: number;
    memoryGiB: number;
    memoryWorkingSetGiB: number;
    diskIoPercent: number;
    diskIoOpsSec: number;
    networkRxMbps: number;
    networkTxMbps: number;
    temperatureC: number;
    podCount: number;
  };
  conditions: NodeCondition[];
  taints: NodeTaint[];
  labels: Record<string, string>;
  history: NodeTimeSeriesPoint[];
  runningPodIds: string[];
}

export interface VolumeTimeSeriesPoint {
  timestamp: string;
  iopsRead: number;
  iopsWrite: number;
  throughputMBs: number;
  usedGiB: number;
}

export interface PodVolumetric {
  volumeName: string;
  pvcName: string;
  pvName: string;
  storageClass: string;
  accessMode: 'ReadWriteOnce' | 'ReadWriteMany' | 'ReadOnlyMany';
  csiDriver: string;
  mountPath: string;
  capacityGiB: number;
  usedGiB: number;
  usagePercent: number;
  iopsRead: number;
  iopsWrite: number;
  throughputReadMBs: number;
  throughputWriteMBs: number;
  inodesTotal: number;
  inodesUsed: number;
  inodesPercent: number;
  fileSystemType: 'ext4' | 'xfs';
  volumeStatus: 'Bound' | 'Mounted' | 'Syncing' | 'Degraded';
  history: VolumeTimeSeriesPoint[];
}

export interface PodTimeSeriesPoint {
  timestamp: string;
  cpuThrottlePercent: number;
  memoryPercent: number;
  networkThroughputMbps: number;
  volumetricIops: number;
}

export interface PodRestartEvent {
  timestamp: string;
  exitCode: number;
  reason: string;
  message: string;
}

export interface ClusterPodDetailed {
  id: string;
  name: string;
  namespace: string;
  nodeName: string;
  podIP: string;
  qosClass: 'Guaranteed' | 'Burstable' | 'BestEffort';
  status: 'Running' | 'Throttled' | 'CrashLoop' | 'Evicted';
  restarts: number;
  cpuUsageCores: number;
  cpuLimitCores: number;
  cpuRequestCores: number;
  cpuThrottlePercent: number;
  memoryUsageMiB: number;
  memoryLimitMiB: number;
  memoryRequestMiB: number;
  memoryPercent: number;
  networkRxMb: number;
  networkTxMb: number;
  containerStatuses: {
    name: string;
    image: string;
    ready: boolean;
    restartCount: number;
    state: 'running' | 'waiting' | 'terminated';
    lastTerminationReason?: string;
    lastExitCode?: number;
  }[];
  volumetrics: PodVolumetric[];
  history: PodTimeSeriesPoint[];
  restartEvents: PodRestartEvent[];
}

export interface PodConnection {
  id: string;
  sourcePodId: string;
  targetPodId: string;
  sourcePodName: string;
  targetPodName: string;
  sourceNamespace: string;
  targetNamespace: string;
  protocol: 'HTTP/2' | 'gRPC' | 'TCP' | 'TLS/mTLS' | 'PostgreSQL Wire' | 'Redis RESP' | 'eBPF Direct';
  port: number;
  requestsPerSec: number;
  bandwidthMbps: number;
  latencyP95Ms: number;
  latencyP99Ms: number;
  packetLossPercent: number;
  health: 'nominal' | 'elevated' | 'congested' | 'degraded';
  networkPolicyAllowed: boolean;
  encrypted: boolean;
}

export interface ClusterArchitectureComponent {
  id: string;
  name: string;
  layer: 'control-plane' | 'node-pools' | 'networking-fabric' | 'storage-csi' | 'observability';
  sublayer?: string;
  role: string;
  redundancy: string;
  health: 'Operational' | 'Degraded' | 'Warning';
  details: {
    version: string;
    instances: number;
    ports: string;
    protocol: string;
    description: string;
    keyMetrics: Record<string, string>;
  };
}


