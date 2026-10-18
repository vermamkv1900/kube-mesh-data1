import { OpenSourceProject } from '../types';

export const OPEN_SOURCE_PROJECTS: OpenSourceProject[] = [
  {
    id: 'argocd',
    name: 'Argo CD',
    tagline: 'Declarative, GitOps continuous delivery tool for Kubernetes',
    category: 'GitOps & Continuous Delivery',
    primaryFunction: 'Continuously monitors Git repositories containing Kubernetes manifests (or Helm/Kustomize charts) and reconciles the live cluster state with the desired state stored in Git.',
    benefitsInKubernetes: [
      'Eliminates direct developer kubectl write access in production clusters, enforcing zero-trust compliance.',
      'Automated drift detection immediately alerts or self-heals when someone makes manual, out-of-band changes.',
      'Instant rollbacks by simply reverting a Git commit in the repository.',
      'ApplicationSet controller allows managing 100+ clusters from a single centralized control plane.',
      'Visual web UI provides real-time pod health status, logs, diffs, and sync status for every microservice.',
    ],
    architectureRole: 'Central CD Controller reconciling Git repos with Kubernetes API server.',
    githubUrl: 'https://github.com/argoproj/argo-cd',
    codeSnippet: {
      title: 'ArgoCD Application CRD',
      code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: billing-service-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/k8s-fleet.git
    targetRevision: main
    path: environments/production/billing
  destination:
    server: https://kubernetes.default.svc
    namespace: billing
  syncPolicy:
    automated:
      prune: true
      selfHeal: true`,
    },
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    tagline: 'Cloud-native systems monitoring and time-series alerting standard',
    category: 'Monitoring & Alerting',
    primaryFunction: 'Collects and stores time-series metric data by pulling metrics from HTTP endpoints exposed by applications, nodes, and cluster infrastructure components at scheduled scrape intervals.',
    benefitsInKubernetes: [
      'Dynamic Kubernetes service discovery automatically discovers new pods, services, and nodes as they scale.',
      'PromQL provides an expressive query language to calculate P99 latencies, error percentages, and SLO burn rates.',
      'Prometheus Operator simplifies cluster lifecycle with declarative ServiceMonitor and PodMonitor CRDs.',
      'Alertmanager routes and groups critical outages to on-call teams with flexible deduplication and silence rules.',
      'Serves as the universal metrics foundation for Horizontal Pod Autoscaling (HPA) and Grafana dashboards.',
    ],
    architectureRole: 'Metrics collection engine querying /metrics endpoints across all namespaces.',
    githubUrl: 'https://github.com/prometheus/prometheus',
    codeSnippet: {
      title: 'ServiceMonitor Custom Resource',
      code: `apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: payment-api-monitor
  namespace: payments
spec:
  selector:
    matchLabels:
      app: payment-api
  endpoints:
    - port: metrics
      interval: 15s
      scrapeTimeout: 10s
      path: /metrics`,
    },
  },
  {
    id: 'cilium',
    name: 'Cilium',
    tagline: 'eBPF-based networking, observability, and zero-trust security',
    category: 'Networking, Security & Observability',
    primaryFunction: 'Leverages Linux kernel eBPF (Extended Berkeley Packet Filter) technology to provide high-performance network routing, security policy enforcement, and observability without iptables bottlenecks.',
    benefitsInKubernetes: [
      'Replaces kube-proxy with constant-time O(1) eBPF hash tables, eliminating iptables scaling slowdowns.',
      'Sidecarless service mesh features (mTLS, L7 traffic management) reduce node memory and CPU overhead.',
      'L7-aware network security filters traffic by HTTP method/path, Kafka topic, or fully qualified domain name (FQDN).',
      'Hubble observability module extracts kernel network traces, DNS queries, and drops with zero packet sampling loss.',
      'Transparent pod-to-pod WireGuard or IPsec encryption configured with a single configuration flag.',
    ],
    architectureRole: 'Kernel eBPF CNI and security agent running as a DaemonSet on every worker node.',
    githubUrl: 'https://github.com/cilium/cilium',
    codeSnippet: {
      title: 'Cilium L7 Network Policy',
      code: `apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: restrict-kafka-egress
  namespace: analytics
spec:
  endpointSelector:
    matchLabels:
      app: stream-consumer
  egress:
    - toPorts:
        - ports:
            - port: "9092"
              protocol: TCP
          rules:
            kafka:
              - role: "consume"
                topic: "telemetry-raw"`,
    },
  },
  {
    id: 'cert-manager',
    name: 'Cert-Manager',
    tagline: 'Automated X.509 TLS certificate lifecycle management for Kubernetes',
    category: 'Security & PKI Management',
    primaryFunction: 'Automates the issuance, renewal, and rotation of SSL/TLS certificates within Kubernetes from diverse public and private Certificate Authorities (Let\'s Encrypt, HashiCorp Vault, Venafi, or internal CAs).',
    benefitsInKubernetes: [
      'Completely eliminates website downtime caused by expired HTTPS certificates through automated background renewals.',
      'Integrates natively with Ingress controllers and the Kubernetes Gateway API using simple annotations or references.',
      'Supports automated ACME DNS-01 and HTTP-01 challenge solving (Cloudflare, AWS Route53, Google Cloud DNS).',
      'Provides internal mutual TLS (mTLS) certificate bootstrapping for microservices and webhook admissions.',
      'Stores certificates securely in native Kubernetes Secret resources, ready for instant volume mounting.',
    ],
    architectureRole: 'Custom controller monitoring Certificate and Issuer CRDs to keep secrets valid.',
    githubUrl: 'https://github.com/cert-manager/cert-manager',
    codeSnippet: {
      title: 'ClusterIssuer (Let\'s Encrypt Production)',
      code: `apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: platform-admin@company.com
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
      - http01:
          ingress:
            class: nginx`,
    },
  },
  {
    id: 'karpenter',
    name: 'Karpenter',
    tagline: 'High-performance, intelligent Kubernetes node autoprovisioner',
    category: 'Autoscaling & Cloud FinOps',
    primaryFunction: 'Directly watches pending unschedulable pods and calls cloud provider compute APIs (e.g. AWS EC2 Fleet, GCP) to dynamically provision right-sized nodes in seconds without static node group limits.',
    benefitsInKubernetes: [
      'Provisions replacement nodes in 15–20 seconds, drastically outperforming the 5–10 minute wait of Cluster Autoscaler.',
      'Spot instance diversification automatically launches across dozens of suitable instance types to avoid Spot capacity droughts.',
      'Workload consolidation continuously bin-packs pods, terminating or downsizing underutilized nodes to save 30–50% on compute.',
      'Supports mixed architectures (Graviton ARM64 and AMD64) and GPU instance types on demand based on pod requirements.',
      'No complex Auto Scaling Groups (ASGs) to configure or pre-size.',
    ],
    architectureRole: 'Control plane controller communicating directly with cloud compute APIs.',
    githubUrl: 'https://github.com/kubernetes-sigs/karpenter',
    codeSnippet: {
      title: 'Karpenter NodePool Configuration',
      code: `apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: spot-cost-saver
spec:
  template:
    spec:
      requirements:
        - key: "karpenter.sh/capacity-type"
          operator: In
          values: ["spot"]
        - key: "kubernetes.io/arch"
          operator: In
          values: ["arm64", "amd64"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized`,
    },
  },
  {
    id: 'crossplane',
    name: 'Crossplane',
    tagline: 'Universal cloud control plane turning Kubernetes into an infrastructure engine',
    category: 'Cloud Infrastructure as Code',
    primaryFunction: 'Extends Kubernetes with custom controllers (Providers) that reconcile external cloud services (AWS RDS, S3 buckets, GCP BigQuery, Azure VNet) as native Kubernetes custom resources.',
    benefitsInKubernetes: [
      'Unifies application deployments and external cloud dependencies into the exact same GitOps workflow.',
      'Enables platform teams to build custom self-service APIs (Composite Resource Definitions - XRDs) tailored for internal teams.',
      'Eliminates the impedance mismatch between CI/CD Terraform pipelines and Kubernetes controllers.',
      'Continuous reconciliation loop detects and repairs cloud drift automatically in real-time.',
    ],
    architectureRole: 'Kubernetes operator managing cloud infrastructure through Cloud Provider APIs.',
    githubUrl: 'https://github.com/crossplane/crossplane',
    codeSnippet: {
      title: 'Crossplane S3 Bucket Resource',
      code: `apiVersion: s3.aws.upbound.io/v1beta1
kind: Bucket
metadata:
  name: telemetry-cold-storage
spec:
  forProvider:
    region: us-east-1
  providerConfigRef:
    name: aws-provider-config`,
    },
  },
];
