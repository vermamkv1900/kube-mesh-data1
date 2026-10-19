import { K8sProject, LogEntry, LogLevel } from '../types';

export interface LogQLPreset {
  name: string;
  query: string;
  description: string;
}

export const LOGQL_PRESETS: LogQLPreset[] = [
  {
    name: 'All Errors & Panics',
    query: '{level=~"ERROR|FATAL"}',
    description: 'Filter critical panics, cluster exceptions, and operational errors',
  },
  {
    name: 'Connection Refused & 5xx',
    query: '|= "connection refused" or |= "502" or |= "504"',
    description: 'Downstream networking and proxy gateway connection failures',
  },
  {
    name: 'Timeouts & Deadlines',
    query: '|= "context deadline exceeded" or |= "timeout"',
    description: 'Slow upstream RPCs, etcd lease timeouts, and database lock contention',
  },
  {
    name: 'OOM & Memory Pressure',
    query: '|= "OOM" or |= "out of memory" or |= "evicted"',
    description: 'Cgroup memory exhaustion, CUDA OOM, and container kills',
  },
  {
    name: 'Certificates & mTLS',
    query: '|= "TLS" or |= "x509" or |= "handshake"',
    description: 'Expired certificates, SPIFFE mTLS failures, and handshake rejections',
  },
];

interface LogTemplate {
  level: LogLevel;
  component: string;
  namespace: string;
  message: string;
  caller: string;
  httpStatus?: number;
  durationMs?: number;
  errorType?: string;
  stackTrace?: string;
}

// Blueprints templates
const LOG_TEMPLATES_BY_PROJECT: Record<string, LogTemplate[]> = {
  'kubefleet-gitops': [
    {
      level: 'ERROR',
      component: 'argocd-hub',
      namespace: 'argocd',
      message: 'failed to reconcile ApplicationSet target "spoke-prod-payment": git repo clone timed out after 30s: context deadline exceeded',
      caller: 'applicationset/controller.go:341',
      httpStatus: 504,
      durationMs: 30042,
      errorType: 'GitTimeoutError',
      stackTrace: 'github.com/argoproj/argo-cd/v2/util/git.(*Client).Fetch\n\t/go/src/github.com/argoproj/argo-cd/util/git/client.go:182\ngithub.com/argoproj/argo-cd/v2/applicationset/controllers.(*ApplicationSetReconciler).Reconcile\n\t/go/src/github.com/argoproj/argo-cd/applicationset/controllers/applicationset_controller.go:341',
    },
    {
      level: 'WARN',
      component: 'argocd-hub',
      namespace: 'argocd',
      message: 'detected cluster drift on spoke-prod: 4 resources modified out-of-band by user "admin@internal.corp"',
      caller: 'reconciler/drift.go:94',
    },
    {
      level: 'FATAL',
      component: 'kyverno',
      namespace: 'kyverno',
      message: 'admission webhook certificate validation failed: x509: certificate has expired (CN=kyverno-svc.kyverno.svc)',
      caller: 'webhook/server.go:129',
      errorType: 'x509CertificateExpired',
      stackTrace: 'crypto/tls.(*Conn).serverHandshake\n\t/usr/local/go/src/crypto/tls/handshake_server.go:88\nkyverno/pkg/webhook.ServeHTTP\n\t/app/pkg/webhook/server.go:129',
    },
    {
      level: 'ERROR',
      component: 'crossplane',
      namespace: 'crossplane-system',
      message: 'cannot compose CompositeResource "XPostgresDatabase": AWS API error: RequestLimitExceeded (AWS RDS rate limit throttled)',
      caller: 'managed/rds_reconciler.go:214',
      httpStatus: 429,
      errorType: 'AWSClientThrottling',
    },
    {
      level: 'ERROR',
      component: 'spoke-prod',
      namespace: 'external-secrets',
      message: 'failed to fetch SecretStore "vault-backend": connection refused to https://vault.internal.corp:8200',
      caller: 'provider/vault/client.go:88',
      httpStatus: 502,
      errorType: 'ConnectionRefused',
    },
    {
      level: 'WARN',
      component: 'vcluster-pool',
      namespace: 'tenant-workspaces',
      message: 'tenant "team-analytics" virtual syncer throttled: k8s apiserver rate limit reached (qps=40, burst=80)',
      caller: 'syncer/rate_limiter.go:45',
    },
    {
      level: 'INFO',
      component: 'argocd-hub',
      namespace: 'argocd',
      message: 'successfully synchronized 42 resources across 8 spoke targets with commit sha 7a9f142',
      caller: 'sync/manager.go:412',
      durationMs: 1240,
    },
    {
      level: 'INFO',
      component: 'kyverno',
      namespace: 'kyverno',
      message: 'verified Sigstore Cosign cryptographic signature for image "registry.internal/api:v2.4.1"',
      caller: 'policy/cosign_verifier.go:82',
      durationMs: 180,
    },
    {
      level: 'DEBUG',
      component: 'crossplane',
      namespace: 'crossplane-system',
      message: 'evaluated XRD schema validation on xnetwork.aws.platform.io/v1alpha1: OK',
      caller: 'xrd/validator.go:55',
    },
  ],

  'kubemesh-ebpf': [
    {
      level: 'FATAL',
      component: 'cilium-agent',
      namespace: 'kube-system',
      message: 'failed to load eBPF bytecode program "bpf_lxc.o" into kernel: BPF_PROG_LOAD error -12 (ENOMEM: out of memory in vmalloc space)',
      caller: 'pkg/bpf/loader.go:230',
      errorType: 'KernelENOMEM',
      stackTrace: 'github.com/cilium/cilium/pkg/bpf.LoadProgram\n\t/go/src/github.com/cilium/cilium/pkg/bpf/loader.go:230\ngithub.com/cilium/cilium/daemon/cmd.runDaemon\n\t/go/src/github.com/cilium/cilium/daemon/cmd/daemon_main.go:812',
    },
    {
      level: 'ERROR',
      component: 'cilium-agent',
      namespace: 'kube-system',
      message: 'WireGuard cryptographic tunnel handshake stalled for node "worker-node-04" (10.244.3.14): 18 packets dropped',
      caller: 'pkg/wireguard/peer.go:174',
      errorType: 'WireguardHandshakeTimeout',
    },
    {
      level: 'ERROR',
      component: 'envoy-gateway',
      namespace: 'cilium-ingress',
      message: 'upstream connect error or disconnect/reset before headers. reset reason: connection failure, transport failure reason: TLS error: SSL routines:WRONG_VERSION_NUMBER',
      caller: 'envoy/source/common/upstream/upstream_impl.cc:320',
      httpStatus: 503,
      errorType: 'EnvoyUpstreamTLSFailure',
    },
    {
      level: 'WARN',
      component: 'cilium-operator',
      namespace: 'kube-system',
      message: 'CiliumNetworkPolicy "default-deny-egress" dropped 812 packets directed to unauthorized external CIDR 198.51.100.22:443',
      caller: 'operator/policy_audit.go:61',
    },
    {
      level: 'INFO',
      component: 'cilium-agent',
      namespace: 'kube-system',
      message: 'eBPF Map "cilium_lb4_services_v2" resized to 65536 entries; host routing bypassing iptables active',
      caller: 'pkg/maps/lbmap/lbmap.go:118',
    },
    {
      level: 'INFO',
      component: 'hubble-relay',
      namespace: 'kube-system',
      message: 'streaming 12,400 eBPF network flows/sec to Hubble UI and Prometheus metrics exporter',
      caller: 'relay/observer.go:195',
    },
    {
      level: 'DEBUG',
      component: 'cilium-agent',
      namespace: 'kube-system',
      message: 'tail call jump index 17 -> program cilium_policy_ingress executed in 1.4 microseconds',
      caller: 'pkg/bpf/tailcall.go:42',
    },
  ],

  'kubellm-gpu': [
    {
      level: 'FATAL',
      component: 'gpu-operator',
      namespace: 'gpu-operator',
      message: 'NVML initialization error: Driver/library version mismatch (NVIDIA host kernel module 535.129.03 vs container libnvidia-ml 535.154.05)',
      caller: 'nvidia/nvml_init.c:140',
      errorType: 'NVMLDriverVersionMismatch',
      stackTrace: 'nvmlInitWithFlags\n\t/usr/src/nvidia-container-toolkit/src/nvml.c:140\nmain\n\t/app/cmd/gpu-feature-discovery/main.go:88',
    },
    {
      level: 'ERROR',
      component: 'vllm-worker',
      namespace: 'ai-inference',
      message: 'CUDA out of memory error: Tried to allocate 24.00 GiB (GPU 0; 80.00 GiB total capacity; 78.42 GiB already allocated; 1.58 GiB free)',
      caller: 'vllm/model_executor/layers/sampler.py:210',
      errorType: 'CUDAOutOfMemory',
      stackTrace: 'torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 24.00 GiB\n  File "vllm/engine/async_llm_engine.py", line 421, in step\n  File "vllm/worker/model_runner.py", line 890, in execute_model',
    },
    {
      level: 'ERROR',
      component: 'vllm-worker',
      namespace: 'ai-inference',
      message: 'KV-cache paging block allocation timed out for prompt sequence length 16,384 tokens: HTTP 504 Gateway Timeout',
      caller: 'vllm/core/block_manager.py:312',
      httpStatus: 504,
      durationMs: 45000,
      errorType: 'KVCacheBlockStarvation',
    },
    {
      level: 'WARN',
      component: 'ray-head',
      namespace: 'ray-cluster',
      message: 'node "gpu-worker-h100-02" heartbeats missed (2 consecutive). Actor scheduling paused on GPU pool',
      caller: 'ray/gcs/node_manager.cc:582',
    },
    {
      level: 'INFO',
      component: 'vllm-worker',
      namespace: 'ai-inference',
      message: 'pre-warmed flash-attention v2 kernels for LLaMA-3-70B model weights; continuous batching throughput: 840 tokens/sec',
      caller: 'vllm/engine/llm_engine.py:180',
    },
    {
      level: 'INFO',
      component: 'triton-router',
      namespace: 'ai-inference',
      message: 'P99 request latency: 242ms over 4,800 prompts across 8 H100 SXM5 GPUs',
      caller: 'router/metrics.go:90',
    },
  ],

  'cnpg-ha-db': [
    {
      level: 'FATAL',
      component: 'postgres-primary',
      namespace: 'cnpg-system',
      message: 'FATAL: remaining connection slots are reserved for non-replication superuser connections (max_connections=500 reached)',
      caller: 'src/backend/utils/init/postinit.c:488',
      errorType: 'PostgresMaxConnectionsExhausted',
    },
    {
      level: 'ERROR',
      component: 'barman-backup',
      namespace: 'cnpg-system',
      message: 'WAL archival to S3 bucket "k8s-database-backups" failed: SlowDown 503 Please reduce your request rate',
      caller: 'barman/cloud_wal_archive.py:192',
      httpStatus: 503,
      errorType: 'S3RateLimitSlowDown',
    },
    {
      level: 'WARN',
      component: 'postgres-replica',
      namespace: 'cnpg-system',
      message: 'streaming replication lag exceeded warning threshold: 24.8 MB behind primary lsn 0/14B2C890',
      caller: 'src/backend/replication/walreceiver.c:910',
    },
    {
      level: 'INFO',
      component: 'cnpg-operator',
      namespace: 'cnpg-system',
      message: 'automated checkpoint completed in 1.84s with 482 MB written to NVMe persistent volume',
      caller: 'operator/controller.go:420',
    },
  ],

  'kubecost-greenops': [
    {
      level: 'ERROR',
      component: 'kubecost-analyzer',
      namespace: 'kubecost',
      message: 'AWS Cost Explorer API request failed: 429 Too Many Requests (Rate limit exceeded for GetCostAndUsage)',
      caller: 'cloud/aws/costmodel.go:214',
      httpStatus: 429,
      errorType: 'RateLimitExceeded',
    },
    {
      level: 'WARN',
      component: 'karpenter-controller',
      namespace: 'karpenter',
      message: 'spot instance interruption notice received for node "ip-10-0-4-88.ec2.internal" (2-minute warning)',
      caller: 'controllers/interruption/spot.go:94',
    },
    {
      level: 'INFO',
      component: 'karpenter-controller',
      namespace: 'karpenter',
      message: 'consolidated 4 underutilized c6i.xlarge nodes into 1 single c6i.4xlarge, saving $480/month',
      caller: 'controllers/consolidation/cluster.go:178',
    },
  ],

  'zerotrust-edge': [
    {
      level: 'FATAL',
      component: 'k3s-edge-agent',
      namespace: 'kube-system',
      message: 'TPM 2.0 PCR-7 measured boot validation mismatch: system state has changed, refusing to unseal LUKS encryption key',
      caller: 'edge/tpm/validator.go:112',
      errorType: 'TPMValidationMismatch',
    },
    {
      level: 'ERROR',
      component: 'wireguard-gateway',
      namespace: 'wireguard-system',
      message: 'WAN link down on interface "wg-cloud0": handshake timeout after 5 retry attempts',
      caller: 'gateway/tunnel.go:88',
      errorType: 'WANLinkFailure',
    },
    {
      level: 'INFO',
      component: 'k3s-edge-agent',
      namespace: 'kube-system',
      message: 'offline autonomous mode activated: local SQLite kine store serving edge pods without cloud control plane',
      caller: 'agent/offline_mode.go:42',
    },
  ],

  'kube-telemetry-fabric': [
    {
      level: 'ERROR',
      component: 'otel-collector',
      namespace: 'observability',
      message: 'failed to export batch of 1,200 traces to Tempo backend: dial tcp 10.96.14.2:4318: connect: connection refused',
      caller: 'exporter/otlpexporter/otlp.go:189',
      httpStatus: 502,
      errorType: 'ConnectionRefused',
    },
    {
      level: 'WARN',
      component: 'loki-distributor',
      namespace: 'observability',
      message: 'entry too far behind: timestamp 2026-10-19T05:00:12Z is older than max_chunk_age (rejecting log line)',
      caller: 'distributor/validator.go:78',
    },
    {
      level: 'INFO',
      component: 'otel-collector',
      namespace: 'observability',
      message: 'redacted 48 PII fields (bearer tokens, credit cards, passwords) before shipping to S3',
      caller: 'processor/redactionprocessor/processor.go:134',
    },
  ],
};

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomHex(length: number): string {
  let result = '';
  const characters = '0123456789abcdef';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export function generateInitialLogs(project: K8sProject, count: number = 35): LogEntry[] {
  const templates = LOG_TEMPLATES_BY_PROJECT[project.id] || LOG_TEMPLATES_BY_PROJECT['kubefleet-gitops'];
  const logs: LogEntry[] = [];
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const template = templates[i % templates.length];
    const timestampOffsetMs = i * getRandomInt(1200, 3400) + getRandomInt(50, 800);
    const logDate = new Date(now - timestampOffsetMs);

    const podSuffix = getRandomHex(6);
    const traceId = getRandomHex(32);
    const spanId = getRandomHex(16);

    logs.push({
      id: `log-${now - timestampOffsetMs}-${getRandomHex(4)}`,
      timestamp: logDate.toISOString(),
      level: template.level,
      component: template.component,
      podName: `${template.component}-${podSuffix}`,
      namespace: template.namespace,
      message: template.message,
      traceId,
      spanId,
      caller: template.caller,
      httpStatus: template.httpStatus,
      durationMs: template.durationMs,
      rawJson: {
        ts: logDate.toISOString(),
        level: template.level.toLowerCase(),
        component: template.component,
        pod: `${template.component}-${podSuffix}`,
        namespace: template.namespace,
        msg: template.message,
        trace_id: traceId,
        span_id: spanId,
        caller: template.caller,
        ...(template.httpStatus ? { http_status: template.httpStatus } : {}),
        ...(template.errorType ? { error: template.errorType } : {}),
        ...(template.stackTrace ? { stack_trace: template.stackTrace } : {}),
      },
    });
  }

  // Sort chronologically ascending
  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function generateSimulatedLog(
  project: K8sProject,
  forcedLevel?: LogLevel,
  targetComponent?: string
): LogEntry {
  const templates = LOG_TEMPLATES_BY_PROJECT[project.id] || LOG_TEMPLATES_BY_PROJECT['kubefleet-gitops'];
  
  let candidates = templates;
  if (forcedLevel) {
    const matched = templates.filter((t) => t.level === forcedLevel);
    if (matched.length > 0) candidates = matched;
  }
  if (targetComponent && targetComponent !== 'All') {
    const matched = candidates.filter((t) => t.component.toLowerCase().includes(targetComponent.toLowerCase()));
    if (matched.length > 0) candidates = matched;
  }

  const template = candidates[Math.floor(Math.random() * candidates.length)];
  const now = new Date();
  const podSuffix = getRandomHex(6);
  const traceId = getRandomHex(32);
  const spanId = getRandomHex(16);

  return {
    id: `log-${now.getTime()}-${getRandomHex(4)}`,
    timestamp: now.toISOString(),
    level: forcedLevel || template.level,
    component: template.component,
    podName: `${template.component}-${podSuffix}`,
    namespace: template.namespace,
    message: template.message,
    traceId,
    spanId,
    caller: template.caller,
    httpStatus: template.httpStatus,
    durationMs: template.durationMs,
    rawJson: {
      ts: now.toISOString(),
      level: (forcedLevel || template.level).toLowerCase(),
      component: template.component,
      pod: `${template.component}-${podSuffix}`,
      namespace: template.namespace,
      msg: template.message,
      trace_id: traceId,
      span_id: spanId,
      caller: template.caller,
      ...(template.httpStatus ? { http_status: template.httpStatus } : {}),
      ...(template.errorType ? { error: template.errorType } : {}),
      ...(template.stackTrace ? { stack_trace: template.stackTrace } : {}),
    },
  };
}

export function generateErrorSpikeLogs(project: K8sProject, targetComponent?: string): LogEntry[] {
  const templates = LOG_TEMPLATES_BY_PROJECT[project.id] || LOG_TEMPLATES_BY_PROJECT['kubefleet-gitops'];
  const errorTemplates = templates.filter((t) => t.level === 'ERROR' || t.level === 'FATAL');
  const now = Date.now();
  const burst: LogEntry[] = [];

  for (let i = 0; i < 4; i++) {
    const template = errorTemplates[i % errorTemplates.length] || templates[0];
    const logDate = new Date(now - (3 - i) * 300);
    const podSuffix = getRandomHex(6);
    const traceId = getRandomHex(32);
    const spanId = getRandomHex(16);

    burst.push({
      id: `burst-${now}-${i}-${getRandomHex(4)}`,
      timestamp: logDate.toISOString(),
      level: template.level,
      component: targetComponent && targetComponent !== 'All' ? targetComponent : template.component,
      podName: `${template.component}-${podSuffix}`,
      namespace: template.namespace,
      message: `[INCIDENT SPIKE] ${template.message}`,
      traceId,
      spanId,
      caller: template.caller,
      httpStatus: template.httpStatus || 500,
      durationMs: template.durationMs || 4200,
      rawJson: {
        ts: logDate.toISOString(),
        level: template.level.toLowerCase(),
        component: template.component,
        pod: `${template.component}-${podSuffix}`,
        namespace: template.namespace,
        msg: `[INCIDENT SPIKE] ${template.message}`,
        trace_id: traceId,
        span_id: spanId,
        caller: template.caller,
        incident_burst: true,
      },
    });
  }

  return burst;
}
