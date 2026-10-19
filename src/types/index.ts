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


