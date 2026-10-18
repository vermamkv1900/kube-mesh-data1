import { K8sProject } from '../types';

export const KUBERNETES_PROJECTS: K8sProject[] = [
  {
    id: 'kubefleet-gitops',
    title: 'KubeFleet: Enterprise Multi-Cluster GitOps & Control Plane',
    tagline: 'Automated hub-and-spoke multi-cluster lifecycle, virtual tenant isolation, and drift reconciliation.',
    category: 'GitOps & Control Plane',
    maturity: 'Enterprise Scale',
    starsOrScale: '50+ Managed Clusters · 1,400 Microservices',
    primaryStack: ['ArgoCD', 'Crossplane', 'vCluster', 'Kyverno', 'External Secrets Operator'],
    businessImpact: 'Cut tenant cluster spin-up time from 3 days to 4 minutes; 100% auditable Git-controlled infrastructure.',
    architectureSummary: 'Central management hub cluster housing ArgoCD ApplicationSets and Crossplane control plane. Downstream tenant workloads run either in physical spoke clusters provisioned via Cluster API (CAPI) or within virtual clusters (vClusters) on shared compute pools. Kyverno enforces zero-trust cluster policies and signed container admission.',
    topology: {
      nodes: [
        { id: 'git-repo', label: 'Git Repository (Monorepo / Fleet-State)', type: 'cloud', description: 'Declarative source of truth containing environment overlays', status: 'Ready' },
        { id: 'argocd-hub', label: 'ArgoCD Hub ApplicationSet Controller', type: 'control-plane', namespace: 'argocd', description: 'Reconciles desired Git state across all spoke targets', status: 'Healthy' },
        { id: 'crossplane', label: 'Crossplane Universal Cloud Control Plane', type: 'control-plane', namespace: 'crossplane-system', description: 'Composes AWS/GCP managed databases & VPC peerings via XRDs', status: 'Healthy' },
        { id: 'kyverno', label: 'Kyverno Policy & Admission Controller', type: 'service', namespace: 'kyverno', description: 'Validates Sigstore Cosign image signatures and pod security standards', status: 'Active' },
        { id: 'vcluster-pool', label: 'vCluster Multi-Tenant Virtual Pool', type: 'pod', namespace: 'tenant-workspaces', description: 'Isolated tenant control planes on shared baremetal nodes', status: 'Active' },
        { id: 'spoke-prod', label: 'Spoke Cluster (AWS EKS Production)', type: 'ingress', namespace: 'external-secrets', description: 'Pulls dynamic secrets from AWS Secrets Manager via ESO', status: 'Ready' },
      ],
      edges: [
        { from: 'git-repo', to: 'argocd-hub', protocol: 'Git/HTTPS', label: 'Webhook Webhook trigger' },
        { from: 'argocd-hub', to: 'crossplane', protocol: 'Kube API', label: 'Applies Crossplane Claims' },
        { from: 'argocd-hub', to: 'spoke-prod', protocol: 'mTLS Kube API', label: 'Reconciles Spoke Manifests' },
        { from: 'argocd-hub', to: 'vcluster-pool', protocol: 'Internal API', label: 'Spawns Virtual Tenant Pods' },
        { from: 'kyverno', to: 'spoke-prod', protocol: 'Admission Webhook', label: 'Enforces Security Policies' },
      ],
    },
    manifests: [
      {
        title: 'ArgoCD ApplicationSet (Fleet Target Generator)',
        type: 'ArgoCD App',
        filename: 'applicationset-fleet.yaml',
        content: `apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: platform-fleet-workloads
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - clusters:
              selector:
                matchLabels:
                  environment: production
          - git:
              repoURL: https://github.com/kubeforge-infra/fleet-manifests.git
              revision: HEAD
              directories:
                - path: apps/*
  template:
    metadata:
      name: '{{name}}-{{path.basename}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/kubeforge-infra/fleet-manifests.git
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        server: '{{server}}'
        namespace: '{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - ApplyOutOfSyncOnly=true`,
      },
      {
        title: 'Kyverno Policy (Require Non-Root & Cosign Signature)',
        type: 'Kubernetes YAML',
        filename: 'kyverno-security-policy.yaml',
        content: `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-root-and-verify-signature
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: check-image-cosign-signature
      match:
        any:
          - resources:
              kinds:
                - Pod
      verifyImages:
        - imageReferences:
            - "ghcr.io/kubeforge/*"
          key: |-
            -----BEGIN PUBLIC KEY-----
            MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9f/h12k...
            -----END PUBLIC KEY-----
    - name: require-run-as-non-root
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        message: "Running as root user is prohibited across all fleet clusters."
        pattern:
          spec:
            securityContext:
              runAsNonRoot: true`,
      },
      {
        title: 'Crossplane Composite Resource (Managed Postgres Claim)',
        type: 'Crossplane XRD',
        filename: 'crossplane-rds-claim.yaml',
        content: `apiVersion: database.kubeforge.io/v1alpha1
kind: PostgreSQLInstance
metadata:
  name: tenant-auth-db
  namespace: tenant-production
spec:
  parameters:
    storageGB: 50
    engineVersion: "16.2"
    multiAZ: true
  compositionSelector:
    matchLabels:
      provider: aws
      tier: production
  writeConnectionSecretToRef:
    name: tenant-auth-db-credentials`,
      },
    ],
    scenarios: [
      {
        id: 'drift-reconcile',
        title: 'Simulate Manual Configuration Drift in Spoke Cluster',
        description: 'An operator manually scales down a mission-critical deployment in the prod-eu cluster via kubectl. ArgoCD detects the out-of-sync state and automatically self-heals.',
        actionName: 'Inject Cluster Drift',
        resultLogs: [
          '[INFO] 06:21:02 kubectl scale deployment/auth-service --replicas=1 -n prod-eu',
          '[WARN] 06:21:03 ArgoCD controller detected resource out-of-sync: spec.replicas expected=6 actual=1',
          '[ACTION] 06:21:04 Self-healing triggered via automated syncPolicy.applyOutOfSyncOnly',
          '[SUCCESS] 06:21:05 Desired replica count restored to 6. Audit event published to Slack #platform-alerts.',
        ],
        impactSummary: 'Zero unauthorized changes persist. Recovery time: 3 seconds.',
      },
      {
        id: 'policy-block',
        title: 'Block Unsigned Container Image Admission',
        description: 'A developer attempts to deploy an unverified container image without Sigstore Cosign cryptographic signatures.',
        actionName: 'Attempt Unsigned Image Deploy',
        resultLogs: [
          '[INFO] 06:21:10 Submitting Pod creation request: image=docker.io/unverified/test-backend:v1.0.0',
          '[AUDIT] 06:21:11 Kyverno webhook intercepting admission request for Pod/test-backend-pod',
          '[DENIED] 06:21:11 Admission denied: image does not match cosign public key signature.',
          '[BLOCK] 06:21:11 HTTP 403 Forbidden: cluster policy "check-image-cosign-signature" failed.',
        ],
        impactSummary: 'Supply chain attack surface fully mitigated at admission.',
      },
    ],
    keyBenefits: [
      'Declarative single source of truth for 50+ clusters in Git.',
      'vCluster virtual multi-tenancy reduces control-plane cloud infrastructure spend by 62%.',
      'Automated secret propagation via External Secrets without storing sensitive secrets in Git.',
      'Zero manual kubectl access needed by product engineering teams.',
    ],
    tradeoffs: [
      'Higher initial platform team ramp-up curve on Crossplane XRD compositions.',
      'Requires strict Git review discipline; bad Git PRs can impact fleet simultaneously without staging wave controls.',
    ],
  },
  {
    id: 'kubemesh-cilium',
    title: 'KubeMesh: Cilium eBPF Zero-Trust Service Mesh & Ingress Fabric',
    tagline: 'Kernel-level eBPF packet routing, sidecarless mTLS, and Hubble real-time L7 traffic observability.',
    category: 'Networking & Security',
    maturity: 'High Performance',
    starsOrScale: '280,000 req/sec · Sub-millisecond P99 overhead',
    primaryStack: ['Cilium CNI', 'Cilium Service Mesh', 'eBPF', 'Envoy Gateway', 'Hubble UI', 'SPIRE'],
    businessImpact: 'Eliminated 100% of sidecar memory overhead (saved 45GB RAM per node); 3.8x faster pod-to-pod throughput over legacy iptables.',
    architectureSummary: 'Replaces kube-proxy with eBPF socket-level programs attaching directly to sockops and tc (traffic control) hooks. Enforces L7 mutual TLS encryption and transparent policy enforcement at the kernel layer without injecting resource-hungry Envoy proxy sidecars into every application pod.',
    topology: {
      nodes: [
        { id: 'wan-traffic', label: 'External Clients & API Consumers', type: 'cloud', description: 'Public HTTPS traffic hitting ingress gateway', status: 'Ready' },
        { id: 'cilium-ingress', label: 'Envoy Gateway (Cilium Ingress Controller)', type: 'ingress', namespace: 'cilium-system', description: 'BGP Anycast routing with Let\'s Encrypt automated TLS', status: 'Healthy' },
        { id: 'ebpf-datapath', label: 'Linux Kernel eBPF Socket Filter Program', type: 'service', namespace: 'kernel', description: 'Bypasses standard TCP/IP stack via sockops eBPF map', status: 'Active' },
        { id: 'app-frontend', label: 'Frontend Pods (Multi-AZ Deployment)', type: 'pod', namespace: 'production', description: 'Zero sidecars injected; kernel handles mTLS and routing', status: 'Active' },
        { id: 'app-backend', label: 'Payment Core Pods (Restricted Zone)', type: 'pod', namespace: 'payments', description: 'Locked down by CiliumNetworkPolicy L7 rules', status: 'Active' },
        { id: 'hubble-relay', label: 'Hubble Telemetry & Flow Observer', type: 'daemonset', namespace: 'kube-system', description: 'Extracts kernel network traces with zero packet-drop overhead', status: 'Healthy' },
      ],
      edges: [
        { from: 'wan-traffic', to: 'cilium-ingress', protocol: 'HTTPS/TLSv1.3', label: 'Public Ingress' },
        { from: 'cilium-ingress', to: 'ebpf-datapath', protocol: 'Direct Socket Write', label: 'eBPF Host Routing' },
        { from: 'ebpf-datapath', to: 'app-frontend', protocol: 'mTLS (SPIFFE)', label: 'Pod-to-Pod Bypass' },
        { from: 'app-frontend', to: 'app-backend', protocol: 'L7 HTTP (POST /charge)', label: 'CiliumNetworkPolicy validated' },
        { from: 'ebpf-datapath', to: 'hubble-relay', protocol: 'eBPF RingBuffer', label: 'Real-time Flow Stream' },
      ],
    },
    manifests: [
      {
        title: 'CiliumNetworkPolicy (L7 HTTP Path & DNS Lockdown)',
        type: 'Kubernetes YAML',
        filename: 'cilium-l7-policy.yaml',
        content: `apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: secure-payment-api
  namespace: payments
spec:
  endpointSelector:
    matchLabels:
      app: payment-processor
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: checkout-service
            io.kubernetes.pod.namespace: production
      toPorts:
        - ports:
            - port: "8443"
              protocol: TCP
          rules:
            http:
              - method: "POST"
                path: "/v1/charges"
  egress:
    - toFQDNs:
        - matchName: "api.stripe.com"
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP`,
      },
      {
        title: 'Cilium Helm Values (Kube-Proxy Replacement & Host Routing)',
        type: 'Helm Values',
        filename: 'cilium-values.yaml',
        content: `kubeProxyReplacement: "true"
k8sServiceHost: "10.0.0.1"
k8sServicePort: "6443"
bpf:
  masquerade: true
  tproxy: true
tunnelProtocol: ""
routingMode: native
autoDirectNodeRoutes: true
encryption:
  enabled: true
  type: wireguard
hubble:
  enabled: true
  relay:
    enabled: true
  ui:
    enabled: true
  metrics:
    enabled:
      - dns
      - drop
      - tcp
      - flow
      - port-distribution
      - icmp
      - http`,
      },
    ],
    scenarios: [
      {
        id: 'simulate-ddos',
        title: 'Simulate SYN Flood & XDP Kernel Drop',
        description: 'Attack traffic hits worker node network interface. Cilium XDP eBPF program drops unauthenticated packets in the network card driver before allocating sk_buff buffers.',
        actionName: 'Trigger XDP Packet Drop Test',
        resultLogs: [
          '[ATTACK] 06:21:40 Influx of 150,000 invalid SYN packets/sec detected on eth0',
          '[XDP] 06:21:40 Cilium XDP program hook activated at network driver layer',
          '[ACTION] 06:21:40 XDP_DROP decision applied in 12 nanoseconds per packet',
          '[METRIC] 06:21:41 Host CPU load remains flat at 4.2%; zero kernel socket exhaustion',
        ],
        impactSummary: 'Zero worker node CPU saturation during intense malicious packet floods.',
      },
    ],
    keyBenefits: [
      'Eliminates iptables O(N) evaluation degradation for clusters with >10,000 services.',
      'Sidecarless service mesh reduces memory footprints and cold-start connection latency.',
      'Deep network layer 3 to layer 7 visibility with Hubble eBPF tracing.',
      'Automated WireGuard or IPsec pod-to-pod transparent encryption.',
    ],
    tradeoffs: [
      'Requires modern Linux kernel (v5.4+ or v5.10+ recommended for complete BPF feature set).',
      'Advanced eBPF debugging requires specialized tools (bpftool, cilium-dbg) beyond basic ping/traceroute.',
    ],
  },
  {
    id: 'kubetelemetry-lgtm',
    title: 'KubeTelemetry: LGTM Cloud-Native Observability & SRE Platform',
    tagline: 'Correlated Metrics, Logs, Traces, and Profiling across 100% of production workloads with OpenTelemetry.',
    category: 'Observability & SRE',
    maturity: 'Production-Hardened',
    starsOrScale: '1.2M active metrics · 40k traces/sec · 300GB logs/day',
    primaryStack: ['Prometheus', 'Grafana Mimir', 'Grafana Loki', 'Grafana Tempo', 'OpenTelemetry Collector'],
    businessImpact: 'Reduced Mean Time to Resolution (MTTR) from 45 minutes to 3.2 minutes using unified Trace-to-Log correlation.',
    architectureSummary: 'An enterprise LGTM architecture. OpenTelemetry Collector runs as a DaemonSet to ingest traces, metrics, and logs from application runtimes without lock-in. Metrics flow into Grafana Mimir, logs into Grafana Loki with structured metadata, and traces into Grafana Tempo with S3 storage.',
    topology: {
      nodes: [
        { id: 'apps-otel', label: 'Microservice Pods (OTel Auto-Instrumentation)', type: 'pod', namespace: 'workloads', description: 'Injects TraceID and Span context into all outgoing headers', status: 'Active' },
        { id: 'otel-daemonset', label: 'OpenTelemetry Collector (DaemonSet)', type: 'daemonset', namespace: 'monitoring', description: 'Batching, resource attribute enrichment, and PII filtering', status: 'Healthy' },
        { id: 'mimir-cluster', label: 'Grafana Mimir (Scalable Metrics TSDB)', type: 'service', namespace: 'monitoring', description: 'Horizontally scalable PromQL engine backed by object storage', status: 'Healthy' },
        { id: 'loki-cluster', label: 'Grafana Loki (Log Aggregation Engine)', type: 'service', namespace: 'monitoring', description: 'Indexes label metadata only; full raw logs saved in S3', status: 'Healthy' },
        { id: 'tempo-cluster', label: 'Grafana Tempo (Distributed Trace Storage)', type: 'service', namespace: 'monitoring', description: 'Massive scale trace ingestion without expensive search indices', status: 'Healthy' },
        { id: 'grafana-ui', label: 'Unified Grafana Dashboard & SLO Alerting', type: 'ingress', namespace: 'monitoring', description: 'Presents correlated trace-to-log jumps and Sloth burn-rate alerts', status: 'Ready' },
      ],
      edges: [
        { from: 'apps-otel', to: 'otel-daemonset', protocol: 'OTLP/gRPC', label: 'Export Telemetry' },
        { from: 'otel-daemonset', to: 'mimir-cluster', protocol: 'Remote Write', label: 'Prometheus Metrics' },
        { from: 'otel-daemonset', to: 'loki-cluster', protocol: 'HTTP Push', label: 'Structured Logs' },
        { from: 'otel-daemonset', to: 'tempo-cluster', protocol: 'OTLP/gRPC', label: 'Spans & Traces' },
        { from: 'grafana-ui', to: 'mimir-cluster', protocol: 'PromQL', label: 'Query Series' },
        { from: 'grafana-ui', to: 'loki-cluster', protocol: 'LogQL', label: 'TraceID Jump' },
      ],
    },
    manifests: [
      {
        title: 'OpenTelemetry Collector Configuration (DaemonSet)',
        type: 'Kubernetes YAML',
        filename: 'otel-collector-config.yaml',
        content: `apiVersion: opentelemetry.io/v1alpha1
kind: OpenTelemetryCollector
metadata:
  name: cluster-telemetry-collector
  namespace: monitoring
spec:
  mode: daemonset
  config: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318
    processors:
      memory_limiter:
        check_interval: 1s
        limit_percentage: 80
        spike_limit_percentage: 20
      batch:
        send_batch_size: 10000
        timeout: 5s
      k8sattributes:
        auth_type: "serviceAccount"
        passthrough: false
        extract:
          metadata:
            - k8s.pod.name
            - k8s.namespace.name
            - k8s.node.name
    exporters:
      prometheusremotewrite:
        endpoint: "http://mimir-distributor.monitoring.svc:8080/api/v1/push"
      otlp/tempo:
        endpoint: "tempo-distributor.monitoring.svc:4317"
        tls:
          insecure: true
      loki:
        endpoint: "http://loki-gateway.monitoring.svc/loki/api/v1/push"
    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [memory_limiter, k8sattributes, batch]
          exporters: [otlp/tempo]
        metrics:
          receivers: [otlp]
          processors: [memory_limiter, k8sattributes, batch]
          exporters: [prometheusremotewrite]
        logs:
          receivers: [otlp]
          processors: [memory_limiter, k8sattributes, batch]
          exporters: [loki]`,
      },
    ],
    scenarios: [
      {
        id: 'slo-burn-alert',
        title: 'Simulate Database Latency Spike & SLO Burn Alert',
        description: 'Simulates slow SQL queries exceeding 2,000ms latency. The Prometheus rule detects a 14.4x multi-window burn rate and deep-links to the exact Tempo trace ID.',
        actionName: 'Inject P99 Latency Anomaly',
        resultLogs: [
          '[WARN] 06:22:15 Payment gateway P99 latency exceeded 2,140ms (SLA threshold: 350ms)',
          '[ALERT] 06:22:16 PrometheusRule "HighErrorBudgetBurn" fired for 5m window',
          '[CORRELATION] 06:22:16 Trace ID extracted: 7f8a912b3c4d5e6f from slow endpoint span',
          '[LOGQL] 06:22:17 Loki query {namespace="payments"} |= "7f8a912b3c4d5e6f" returns deadlock error on connection pool',
        ],
        impactSummary: 'Root cause identified in under 2 seconds without guessing through raw log files.',
      },
    ],
    keyBenefits: [
      'Single OTel instrumentation standard prevents vendor lock-in.',
      'S3/GCS-backed long-term retention slashes storage bill by 75% versus legacy Elasticsearch clusters.',
      'Immediate 1-click jump from a Grafana graph spike to the exact distributed trace span and log lines.',
    ],
    tradeoffs: [
      'DaemonSet collector memory limits must be carefully tuned to prevent OOMKills under sudden telemetry spikes.',
    ],
  },
  {
    id: 'kubescale-finops',
    title: 'KubeScale: Karpenter Intelligent Autoscaling & FinOps Engine',
    tagline: 'Sub-second node autoprovisioning, Spot instance diversification, and automated workload consolidation.',
    category: 'FinOps & Autoscaling',
    maturity: 'Enterprise Scale',
    starsOrScale: '48% Cloud Compute Savings · 15-second Node Ready Time',
    primaryStack: ['Karpenter', 'KEDA', 'OpenCost', 'AWS Node Termination Handler', 'Kyverno FinOps Rules'],
    businessImpact: 'Saved $410,000 annually by replacing static node groups with diversified spot instances and automated pod consolidation.',
    architectureSummary: 'Replaces the slow Kubernetes Cluster Autoscaler with Karpenter, which talks directly to cloud APIs (AWS EC2 Fleet, GCP) to spin up optimal VM shapes (Graviton ARM64, AMD64, High-Memory) in seconds. KEDA scales pods based on real queue backlogs (Kafka, RabbitMQ, SQS) rather than lagging CPU metrics.',
    topology: {
      nodes: [
        { id: 'event-queue', label: 'Message Queue (Apache Kafka / AWS SQS)', type: 'cloud', description: 'Accumulates sudden bursts of async processing events', status: 'Active' },
        { id: 'keda-controller', label: 'KEDA Event-Driven Autoscaler', type: 'control-plane', namespace: 'keda', description: 'Monitors consumer lag and dynamically controls HPA targets', status: 'Healthy' },
        { id: 'hpa-target', label: 'Queue Consumer Deployment Pods', type: 'pod', namespace: 'workers', description: 'Scales from 2 to 180 replicas in under 45 seconds', status: 'Active' },
        { id: 'karpenter-controller', label: 'Karpenter Node Provisioner', type: 'control-plane', namespace: 'karpenter', description: 'Computes optimal node shapes and provisions spot instances', status: 'Healthy' },
        { id: 'spot-pool', label: 'Spot Instance Fleet (c6g, m6i, r6g)', type: 'service', namespace: 'aws-infrastructure', description: 'Diversified across 15 instance types to prevent capacity drought', status: 'Active' },
        { id: 'opencost-ui', label: 'OpenCost Real-Time FinOps Allocator', type: 'ingress', namespace: 'opencost', description: 'Attributes CPU/Memory cost per namespace and label team', status: 'Ready' },
      ],
      edges: [
        { from: 'event-queue', to: 'keda-controller', protocol: 'Metrics API', label: 'Queries Queue Depth' },
        { from: 'keda-controller', to: 'hpa-target', protocol: 'Kube HPA', label: 'Scales Replica Count' },
        { from: 'hpa-target', to: 'karpenter-controller', protocol: 'Pending Pods', label: 'Unschedulable Pod Watch' },
        { from: 'karpenter-controller', to: 'spot-pool', protocol: 'EC2 Fleet API', label: 'Launches Exact Spot Node' },
        { from: 'spot-pool', to: 'opencost-ui', protocol: 'Billing Metric', label: 'Calculates Cost per Pod' },
      ],
    },
    manifests: [
      {
        title: 'Karpenter NodePool (Spot-Preferred & Graviton ARM64)',
        type: 'Kubernetes YAML',
        filename: 'karpenter-nodepool.yaml',
        content: `apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: general-compute-spot
spec:
  template:
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:
        - key: "karpenter.sh/capacity-type"
          operator: In
          values: ["spot", "on-demand"]
        - key: "kubernetes.io/arch"
          operator: In
          values: ["arm64", "amd64"]
        - key: "karpenter.k8s.aws/instance-category"
          operator: In
          values: ["c", "m", "r"]
        - key: "karpenter.k8s.aws/instance-generation"
          operator: Gt
          values: ["5"]
      expireAfter: 720h
      terminationGracePeriod: 48h
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m`,
      },
      {
        title: 'KEDA ScaledObject (Kafka Queue-Lag Scaling)',
        type: 'Kubernetes YAML',
        filename: 'keda-kafka-scaler.yaml',
        content: `apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: kafka-order-consumer-scaler
  namespace: workers
spec:
  scaleTargetRef:
    name: order-processor
  minReplicaCount: 2
  maxReplicaCount: 150
  cooldownPeriod: 30
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka.platform.svc:9092
        consumerGroup: order-workers
        topic: incoming-orders
        lagThreshold: "50"
        offsetResetPolicy: latest`,
      },
    ],
    scenarios: [
      {
        id: 'spot-interruption',
        title: 'Handle 2-Minute AWS Spot Termination Warning',
        description: 'Simulates receiving an AWS Spot Instance Interruption Notice. Karpenter gracefully cordons the node, provisions a replacement instance, and drains pods within 90 seconds.',
        actionName: 'Simulate Spot Interruption Event',
        resultLogs: [
          '[AWS EVENT] 06:22:30 EC2 Spot Instance Rebalance Recommendation received for i-09a8bc76d',
          '[KARPENTER] 06:22:31 Cordoned node ip-10-0-45-122.ec2.internal; scheduling replacement',
          '[PROVISION] 06:22:33 Provisioning replacement spot node (c6g.2xlarge in us-east-1a)',
          '[DRAIN] 06:22:48 Replacement ready in 15 seconds. Pods drained gracefully with zero dropped requests.',
        ],
        impactSummary: '100% uptime maintained during spot node preemption.',
      },
    ],
    keyBenefits: [
      'Node launch time cut from 5–8 minutes (Cluster Autoscaler) to 15–20 seconds.',
      'Automated consolidation dynamically bin-packs pods and shuts down underutilized nodes.',
      'KEDA enables scaling down to 0 replicas when message queues are idle.',
    ],
    tradeoffs: [
      'Spot instances require applications to handle SIGTERM signals gracefully (graceful termination).',
    ],
  },
  {
    id: 'kuberay-llm',
    title: 'KubeRay: High-Throughput Distributed AI/LLM GPU Platform',
    tagline: 'Multi-GPU cluster orchestration, vLLM inference serving, MIG slicing, and Kueue priority scheduling.',
    category: 'AI/ML Infrastructure',
    maturity: 'High Performance',
    starsOrScale: '96x NVIDIA H100 GPUs · 12,000 tokens/sec continuous serving',
    primaryStack: ['NVIDIA GPU Operator', 'KubeRay', 'vLLM', 'Kueue', 'PyTorch DDP', 'Shared NVMe PVCs'],
    businessImpact: 'Doubled GPU utilization from 38% to 84% via dynamic multi-instance GPU (MIG) slicing and fair-share queueing.',
    architectureSummary: 'An enterprise cloud-native AI platform for hosting deep learning models (Llama-3, DeepSeek, Mistral) and distributed training jobs. The NVIDIA GPU Operator manages GPU drivers and MIG partitions. KubeRay handles dynamic RayCluster lifecycles, and Kueue guarantees quota enforcement across research teams.',
    topology: {
      nodes: [
        { id: 'ai-api-gateway', label: 'AI Gateway (OpenAI Compatible API)', type: 'ingress', namespace: 'vllm-serving', description: 'Handles token streaming, rate-limiting, and prompt caching', status: 'Ready' },
        { id: 'kueue-scheduler', label: 'Kueue Multi-Tenant Job Queuer', type: 'control-plane', namespace: 'kueue-system', description: 'Allocates fair-share GPU quotas between Research and Production', status: 'Healthy' },
        { id: 'ray-head', label: 'Ray Cluster Head Node', type: 'control-plane', namespace: 'ml-platform', description: 'Coordinates distributed worker actor placement and tensor parallelism', status: 'Healthy' },
        { id: 'gpu-worker-pool', label: 'NVIDIA H100 80GB Worker Nodes', type: 'pod', namespace: 'ml-platform', description: 'High-speed NVLink interconnect for 8-way Tensor Parallelism', status: 'Active' },
        { id: 'model-cache-pvc', label: 'High-Throughput NVMe Shared Storage', type: 'storage', namespace: 'ml-platform', description: 'Pre-cached Safetensors model weights for instant pod warm-up', status: 'Active' },
      ],
      edges: [
        { from: 'ai-api-gateway', to: 'ray-head', protocol: 'HTTP/SSE Streaming', label: 'Inference Request' },
        { from: 'kueue-scheduler', to: 'ray-head', protocol: 'ClusterQueue', label: 'Admits Batch Job' },
        { from: 'ray-head', to: 'gpu-worker-pool', protocol: 'Ray GCS / gRPC', label: 'Distributes Tensors' },
        { from: 'gpu-worker-pool', to: 'model-cache-pvc', protocol: 'Direct NVMe Read', label: 'Memory-Mapped Weights' },
      ],
    },
    manifests: [
      {
        title: 'RayCluster Spec (vLLM Serving with 4x H100 GPUs)',
        type: 'Kubernetes YAML',
        filename: 'raycluster-vllm.yaml',
        content: `apiVersion: ray.io/v1
kind: RayCluster
metadata:
  name: llama-3-70b-serving
  namespace: ml-platform
spec:
  rayVersion: '2.35.0'
  headGroupSpec:
    rayStartParams:
      dashboard-host: '0.0.0.0'
    template:
      spec:
        containers:
          - name: ray-head
            image: rayproject/ray-ml:2.35.0-py310-gpu
            resources:
              limits:
                cpu: "8"
                memory: "32Gi"
  workerGroupSpecs:
    - groupName: gpu-group
      replicas: 2
      minReplicas: 1
      maxReplicas: 8
      rayStartParams: {}
      template:
        spec:
          containers:
            - name: ray-worker
              image: vllm/vllm-openai:latest
              command: ["vllm", "serve", "meta-llama/Meta-Llama-3-70B-Instruct"]
              args: ["--tensor-parallel-size", "4", "--gpu-memory-utilization", "0.92"]
              resources:
                limits:
                  nvidia.com/gpu: "4"
                  memory: "160Gi"`,
      },
    ],
    scenarios: [
      {
        id: 'scale-llm-surge',
        title: 'Simulate Prompt Surge & Dynamic GPU Worker Scale-Out',
        description: 'Inference request concurrency jumps from 200 to 1,500 active token streams. KubeRay dynamically provisions additional Ray workers while pre-warmed PVC weights avoid 15-minute download delays.',
        actionName: 'Trigger Token Traffic Surge',
        resultLogs: [
          '[GATEWAY] 06:23:01 Inbound streaming concurrency jumped: 240 -> 1,520 reqs',
          '[RAY] 06:23:02 Ray Autoscaler triggers workerGroup "gpu-group" replica scale: 2 -> 4 nodes',
          '[STORAGE] 06:23:04 Mounting pre-cached 70B Safetensors via shared read-only NVMe PVC (12 GB/s read)',
          '[READY] 06:23:09 New vLLM tensor parallel worker ready in 7 seconds. P95 Time-To-First-Token stays <120ms.',
        ],
        impactSummary: 'Avoided cold-start weight downloads, preserving sub-second interactive chat response.',
      },
    ],
    keyBenefits: [
      'Eliminates model weight download delays via shared distributed storage volumes.',
      'Native support for Tensor Parallelism and Pipeline Parallelism across multi-node GPUs.',
      'Kueue provides fair queuing so long training jobs do not starve interactive serving workloads.',
    ],
    tradeoffs: [
      'High GPU cloud infrastructure costs require aggressive scale-to-zero when idle.',
    ],
  },
  {
    id: 'kubestate-storage',
    title: 'KubeState: Cloud-Native Resilient Database & Storage Mesh',
    tagline: 'High-availability PostgreSQL, automated WAL streaming to S3, and Rook-Ceph distributed block storage.',
    category: 'Storage & Stateful',
    maturity: 'Enterprise Scale',
    starsOrScale: '99.999% SLA · RPO = 0 (Zero Data Loss) · RTO < 8s',
    primaryStack: ['CloudNativePG', 'Rook-Ceph', 'MinIO', 'VolSync', 'CSI Snapshotter'],
    businessImpact: 'Eliminated managed cloud database vendor lock-in; achieved zero-data-loss failover under total node power cut.',
    architectureSummary: 'A fully declarative stateful storage and database tier running on bare-metal or cloud infrastructure. Uses Rook-Ceph for distributed NVMe block storage with triple replication across failure domains. CloudNativePG orchestrates PostgreSQL clusters with automated streaming replication, continuous WAL archiving, and sub-10-second failover.',
    topology: {
      nodes: [
        { id: 'app-service', label: 'Application Pods (Read/Write Split)', type: 'pod', namespace: 'core-banking', description: 'Routes writes to primary and reads to read-only replicas', status: 'Active' },
        { id: 'cnpg-primary', label: 'CloudNativePG Primary Pod (Zone A)', type: 'service', namespace: 'databases', description: 'Leader database handling all write transactions and WAL stream', status: 'Ready' },
        { id: 'cnpg-standby-1', label: 'CloudNativePG Standby Replica (Zone B)', type: 'pod', namespace: 'databases', description: 'Synchronous streaming replication with automatic election', status: 'Healthy' },
        { id: 'cnpg-standby-2', label: 'CloudNativePG Standby Replica (Zone C)', type: 'pod', namespace: 'databases', description: 'Read-scaling standby in third availability zone', status: 'Healthy' },
        { id: 'wal-s3-archive', label: 'Object Storage WAL Archive (S3 / MinIO)', type: 'storage', namespace: 'storage', description: 'Continuous transaction logs for Point-In-Time Recovery', status: 'Ready' },
        { id: 'rook-ceph', label: 'Rook-Ceph Distributed Block Storage (CSI)', type: 'daemonset', namespace: 'rook-ceph', description: 'Local NVMe drive clustering with self-healing 3x replication', status: 'Healthy' },
      ],
      edges: [
        { from: 'app-service', to: 'cnpg-primary', protocol: 'PostgreSQL TCP:5432', label: 'Transactional Writes' },
        { from: 'cnpg-primary', to: 'cnpg-standby-1', protocol: 'Sync WAL Stream', label: 'Zero-Lag Replication' },
        { from: 'cnpg-primary', to: 'cnpg-standby-2', protocol: 'Async WAL Stream', label: 'Read-Replica Stream' },
        { from: 'cnpg-primary', to: 'wal-s3-archive', protocol: 'Barman Cloud S3', label: 'Continuous WAL Archival' },
        { from: 'cnpg-primary', to: 'rook-ceph', protocol: 'Ceph RBD CSI', label: 'Persistent NVMe Volumes' },
      ],
    },
    manifests: [
      {
        title: 'CloudNativePG Cluster Spec (HA Postgres with S3 Archival)',
        type: 'Kubernetes YAML',
        filename: 'cloudnative-pg-cluster.yaml',
        content: `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: banking-postgres-cluster
  namespace: databases
spec:
  instances: 3
  primaryUpdateStrategy: unsupervised
  storage:
    size: 250Gi
    storageClass: rook-ceph-block
  postgresql:
    parameters:
      shared_buffers: "8GB"
      max_connections: "1000"
      work_mem: "32MB"
  backup:
    barmanObjectStore:
      destinationPath: "s3://kubeforge-wal-backups/postgres-banking/"
      endpointURL: "https://s3.us-east-1.amazonaws.com"
      s3Credentials:
        inheritFromIAMRole: true
      wal:
        compression: gzip
        maxParallel: 4`,
      },
    ],
    scenarios: [
      {
        id: 'primary-node-crash',
        title: 'Simulate Primary Node Hardware Failure',
        description: 'Simulates a sudden kernel panic on the node hosting the PostgreSQL primary. The operator detects the lease loss, elects Standby-1 as the new Primary within 6 seconds, and re-points client traffic.',
        actionName: 'Kill Primary Node Host',
        resultLogs: [
          '[PANIC] 06:23:20 Hardware kernel crash on node host-01 (Zone A hosting Primary)',
          '[CNPG] 06:23:22 Leader lease expired; election initiated among standby replicas',
          '[FAILOVER] 06:23:24 Standby-1 (Zone B) has lowest replication lag (0 bytes); promoted to Primary',
          '[TRAFFIC] 06:23:25 Service endpoints updated. Banking API resumed writes in 5.8 seconds.',
        ],
        impactSummary: 'Zero transactions lost; recovery completed automatically in under 6 seconds.',
      },
    ],
    keyBenefits: [
      'Eliminates exorbitant cloud provider managed DB costs.',
      'Point-in-Time Recovery allows rolling back state to any exact millisecond timestamp.',
      'Rook-Ceph provides true enterprise distributed storage directly on Kubernetes nodes.',
    ],
    tradeoffs: [
      'Requires platform team understanding of storage I/O profiles, IOPS, and network partitioning.',
    ],
  },
  {
    id: 'kubeedge-hybrid',
    title: 'KubeEdge: Hybrid Edge Orchestration & Offline Cluster Mesh',
    tagline: 'Lightweight K3s clusters, encrypted WireGuard mesh, and offline-first edge device synchronization.',
    category: 'Edge & Hybrid',
    maturity: 'Production-Hardened',
    starsOrScale: '120 Edge Gateways · Operates during 72-hour network blackouts',
    primaryStack: ['K3s', 'WireGuard', 'MetalLB', 'KubeEdge', 'SQLite / BadgerDB'],
    businessImpact: 'Enabled manufacturing plants and retail branches to process telemetry and checkouts locally with 0 downtime during internet outages.',
    architectureSummary: 'Decentralized Kubernetes architecture designed for remote sites, retail locations, and industrial IoT. Central cloud clusters push declarative workloads across an encrypted WireGuard mesh to lightweight K3s edge nodes equipped with local caching so transactions continue even if cloud connectivity is completely severed.',
    topology: {
      nodes: [
        { id: 'cloud-hub', label: 'Central Cloud K8s Cluster', type: 'control-plane', namespace: 'edge-control', description: 'Orchestrates desired edge software state and updates', status: 'Ready' },
        { id: 'wireguard-mesh', label: 'WireGuard Encrypted Network Mesh', type: 'service', namespace: 'networking', description: 'Zero-trust tunnel connecting edge nodes behind NAT/firewalls', status: 'Healthy' },
        { id: 'edge-node-1', label: 'Store Edge Node #01 (K3s ARM64)', type: 'pod', namespace: 'store-01', description: 'Runs in-store POS, camera analytics, and inventory', status: 'Active' },
        { id: 'edge-node-2', label: 'Store Edge Node #02 (K3s ARM64)', type: 'pod', namespace: 'store-02', description: 'Redundant local failover node with NVMe cache', status: 'Active' },
        { id: 'local-storage', label: 'Offline SQLite Local Transaction Store', type: 'storage', namespace: 'local-db', description: 'Stores local data when internet uplink drops', status: 'Ready' },
      ],
      edges: [
        { from: 'cloud-hub', to: 'wireguard-mesh', protocol: 'Encrypted UDP', label: 'Workload Sync' },
        { from: 'wireguard-mesh', to: 'edge-node-1', protocol: 'WireGuard Tunnel', label: 'App Push' },
        { from: 'edge-node-1', to: 'local-storage', protocol: 'Local Disk I/O', label: 'Offline Sync' },
      ],
    },
    manifests: [
      {
        title: 'Edge Deployment Spec (NodeAffinity & Local Offline Tolerations)',
        type: 'Kubernetes YAML',
        filename: 'edge-store-deployment.yaml',
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: store-checkout-engine
  namespace: retail-edge
spec:
  replicas: 1
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: store-checkout
    spec:
      tolerations:
        - key: "node.kubernetes.io/unreachable"
          operator: "Exists"
          effect: "NoExecute"
          tolerationSeconds: 86400
        - key: "node.kubernetes.io/not-ready"
          operator: "Exists"
          effect: "NoExecute"
          tolerationSeconds: 86400
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: node-role.kubernetes.io/edge
                    operator: In
                    values: ["true"]
      containers:
        - name: checkout-app
          image: ghcr.io/kubeforge/retail-edge:v2.4.1
          resources:
            limits:
              cpu: "1"
              memory: "1Gi"`,
      },
    ],
    scenarios: [
      {
        id: 'wan-disconnect',
        title: 'Simulate WAN Cable Cut (Edge Disconnect)',
        description: 'Simulates a 24-hour fiber outage at a retail store. The edge node tolerations prevent pod eviction; local checkout and barcode scanning continue unhindered.',
        actionName: 'Cut Cloud WAN Uplink',
        resultLogs: [
          '[UPLINK] 06:23:45 Cloud health check ping failed; edge node transitioned to NotReady in central control plane',
          '[EDGE] 06:23:46 Local K3s node detects disconnect; activates local SQLite buffer mode',
          '[TOLERATION] 06:23:46 Pod "store-checkout-engine" not evicted due to 86,400s unreachable toleration',
          '[LOCAL] 06:23:47 In-store customer checkouts proceed with 4ms latency.',
        ],
        impactSummary: 'Zero store downtime or lost revenue during internet provider blackouts.',
      },
    ],
    keyBenefits: [
      'Operates seamlessly with or without continuous cloud connectivity.',
      'Small footprint (under 512MB RAM for K3s agent) allows running on inexpensive edge boxes.',
      'WireGuard mesh traverses complex corporate NATs and dynamic retail IPs automatically.',
    ],
    tradeoffs: [
      'Edge hardware lacks remote IPMI hands-on access if physical power supply burns out.',
    ],
  },
];
