export interface TerminalCommandResponse {
  output: string;
  isError?: boolean;
}

export const TERMINAL_COMMANDS: Record<string, TerminalCommandResponse> = {
  'kubectl get pods -A': {
    output: `NAMESPACE          NAME                                             READY   STATUS    RESTARTS   AGE    IP             NODE
argocd             argocd-application-controller-0                  1/1     Running   0          42d    10.244.1.12    control-plane-01
argocd             argocd-server-794c979cf7-4kx2p                   1/1     Running   0          42d    10.244.1.13    control-plane-01
cilium-system      cilium-k8j4m                                     1/1     Running   0          18d    10.0.12.44     worker-zone-a-01
cilium-system      cilium-operator-6d87f58c77-nbwqq                 1/1     Running   0          18d    10.244.2.8     worker-zone-b-02
cilium-system      hubble-relay-557dc85f4-8d9qm                     1/1     Running   0          18d    10.244.1.45    worker-zone-a-01
monitoring         cluster-telemetry-collector-49xf2                1/1     Running   0          31d    10.244.1.80    worker-zone-a-01
monitoring         grafana-7cf87f95d5-9m6t2                         1/1     Running   0          31d    10.244.2.19    worker-zone-b-02
monitoring         mimir-distributor-5d8f685-z89lx                  1/1     Running   0          31d    10.244.3.41    worker-zone-c-03
monitoring         tempo-ingester-0                                 1/1     Running   0          31d    10.244.3.88    worker-zone-c-03
karpenter          karpenter-77df9dc896-v4lsq                       1/1     Running   0          14d    10.244.1.5     control-plane-01
kueue-system       kueue-controller-manager-6c5b46d795-s84jx        1/1     Running   0          9d     10.244.2.4     worker-zone-b-02
ml-platform        llama-3-70b-serving-head-49xf                    1/1     Running   0          4d     10.244.4.10    gpu-h100-node-01
ml-platform        llama-3-70b-serving-worker-gpu-group-0           1/1     Running   0          4d     10.244.4.11    gpu-h100-node-02
databases          banking-postgres-cluster-1                       1/1     Running   0          60d    10.244.2.55    worker-zone-b-02
databases          banking-postgres-cluster-2                       1/1     Running   0          60d    10.244.3.60    worker-zone-c-03`,
  },
  'kubectl get nodes -o wide': {
    output: `NAME               STATUS   ROLES           AGE   VERSION   INTERNAL-IP    EXTERNAL-IP      OS-IMAGE             KERNEL-VERSION
control-plane-01   Ready    control-plane   64d   v1.31.1   10.0.10.10     <none>           Ubuntu 24.04 LTS     6.8.0-45-generic
worker-zone-a-01   Ready    <none>          42d   v1.31.1   10.0.12.44     54.192.12.10     Amazon Linux 2023    6.1.92-99.174.amzn2023
worker-zone-b-02   Ready    <none>          42d   v1.31.1   10.0.12.89     54.192.14.88     Amazon Linux 2023    6.1.92-99.174.amzn2023
worker-zone-c-03   Ready    <none>          42d   v1.31.1   10.0.12.130    54.192.16.204    Amazon Linux 2023    6.1.92-99.174.amzn2023
gpu-h100-node-01   Ready    gpu,ray         14d   v1.31.1   10.0.14.12     <none>           Ubuntu 22.04 LTS     5.15.0-1053-nvidia
gpu-h100-node-02   Ready    gpu,ray         14d   v1.31.1   10.0.14.13     <none>           Ubuntu 22.04 LTS     5.15.0-1053-nvidia`,
  },
  'cilium status': {
    output: `    /¯¯\\
 /¯¯\\__/¯¯\\    Cilium:             OK
 \\__/¯¯\\__/    Operator:           OK
 /¯¯\\__/¯¯\\    Envoy DaemonSet:    OK (3/3 nodes)
 \\__/¯¯\\__/    Hubble Relay:       OK
    \\__/       ClusterMesh:        2 clusters connected

DaemonSet         cilium                   Desired: 3, Ready: 3/3, Available: 3/3
Deployment        cilium-operator          Desired: 2, Ready: 2/2, Available: 2/2
Deployment        hubble-relay             Desired: 1, Ready: 1/1, Available: 1/1
Deployment        hubble-ui                Desired: 1, Ready: 1/1, Available: 1/1
Containers:       cilium                   Running: 3
                  cilium-operator          Running: 2
Cluster Pods:     184/184 allocated (100% managed by eBPF)
eBPF Maps:        Total: 34, Memory: 42.1MB
KubeProxyReplacement:   Strict [SockOps: Enabled, TC: Enabled, XDP: Enabled]
Encryption:             WireGuard [Node-to-Node: Active, Pod-to-Pod: Active]`,
  },
  'argocd app list': {
    output: `NAME                              CLUSTER                         NAMESPACE        STATUS  HEALTH   SYNCPOLICY  CONDITIONS  REPO
platform-fleet-workloads          https://10.0.0.1:6443           argocd           Synced  Healthy  Auto-Prune  <none>      https://github.com/kubeforge-infra/fleet.git
cilium-mesh-infrastructure        https://10.0.0.1:6443           kube-system      Synced  Healthy  Auto-Prune  <none>      https://github.com/kubeforge-infra/mesh.git
telemetry-lgtm-stack              https://10.0.0.1:6443           monitoring       Synced  Healthy  Auto-Prune  <none>      https://github.com/kubeforge-infra/telemetry.git
karpenter-autoscaling             https://10.0.0.1:6443           karpenter        Synced  Healthy  Auto-Prune  <none>      https://github.com/kubeforge-infra/finops.git
vllm-ray-serving-cluster          https://10.0.0.1:6443           ml-platform      Synced  Healthy  Manual      <none>      https://github.com/kubeforge-infra/ai-ops.git
banking-postgres-ha               https://10.0.0.1:6443           databases        Synced  Healthy  Auto-Prune  <none>      https://github.com/kubeforge-infra/stateful.git`,
  },
  'kubectl get nodepool -n karpenter': {
    output: `NAME                   NODECLASS   NODES   READY   AGE   LIMITS (CPU/MEM)    CONSOLIDATION
general-compute-spot   default     14      True    28d   cpu: 500, mem: 2Ti  WhenEmptyOrUnderutilized
gpu-workloads-ondemand gpu-class   2       True    12d   gpu: 8, mem: 500Gi  WhenEmpty`,
  },
  'cnpg status banking-postgres-cluster -n databases': {
    output: `Cluster Summary
Name:                banking-postgres-cluster
Namespace:           databases
PostgreSQL Image:    ghcr.io/cloudnative-pg/postgresql:16.2
Primary instance:    banking-postgres-cluster-1
Status:              Cluster in healthy state
Instances:           3
Ready instances:     3
Current Write LSN:   0/34A9F218 (Wal Storage: S3 Continuous)

Instances status
Name                         Database Status  Replication Role  Lag from Primary
----                         ---------------  ----------------  ----------------
banking-postgres-cluster-1   OK               Primary           0 bytes
banking-postgres-cluster-2   OK               Standby (sync)    0 bytes
banking-postgres-cluster-3   OK               Standby (async)   128 bytes`,
  },
  'helm list -A': {
    output: `NAME                 NAMESPACE    REVISION  UPDATED                               STATUS    CHART                         APP VERSION
cilium               kube-system  4         2026-10-01 14:22:10.129481 UTC        deployed  cilium-1.16.2                 1.16.2
kube-prometheus      monitoring   12        2026-09-18 09:12:44.891244 UTC        deployed  kube-prometheus-stack-62.7.0  v0.76.2
karpenter            karpenter    3         2026-10-05 11:04:12.902341 UTC        deployed  karpenter-1.0.6               1.0.6
kuberay-operator     ml-platform  2         2026-09-24 16:30:00.120938 UTC        deployed  kuberay-operator-1.2.2        1.2.2
cloudnative-pg       cnpg-system  8         2026-08-30 20:10:14.992834 UTC        deployed  cloudnative-pg-1.24.0         1.24.0`,
  },
  'help': {
    output: `Available Interactive Commands:
  - kubectl get pods -A
  - kubectl get nodes -o wide
  - cilium status
  - argocd app list
  - kubectl get nodepool -n karpenter
  - cnpg status banking-postgres-cluster -n databases
  - helm list -A
  - clear

Type any command or click the preset chips above!`,
  },
};
