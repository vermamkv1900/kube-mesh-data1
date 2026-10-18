import { SecurityProfile } from '../types';

export const SECURITY_PROFILES: Record<string, SecurityProfile> = {
  'kubefleet-gitops': {
    psaLevel: 'Restricted (Highest)',
    overview: 'Multi-tenant GitOps hub architecture hardened with Pod Security Admission Restricted profile, GPG-verified commit signatures, Kyverno admission gates, and isolated tenant ServiceAccount tokens.',
    practices: [
      {
        id: 'psa-restricted',
        category: 'Pod Security Standards',
        title: 'Enforce Pod Security Standards (Restricted Profile)',
        severity: 'Critical',
        description: 'Applies pod-security.kubernetes.io/enforce: restricted at namespace level, preventing root execution, privilege escalation, and host network sharing across all tenant workloads.',
        threatMitigated: 'Container breakout, host kernel exploitation, and privilege escalation by malicious tenant containers.',
        implementationSnippet: {
          language: 'YAML Namespace Label',
          code: `apiVersion: v1
kind: Namespace
metadata:
  name: tenant-workspaces
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted
    pod-security.kubernetes.io/audit: restricted`,
        },
      },
      {
        id: 'disable-automount-sa',
        category: 'RBAC & Least Privilege',
        title: 'Disable Automatic ServiceAccount Token Mounts',
        severity: 'Critical',
        description: 'Sets automountServiceAccountToken: false on all default ServiceAccounts. Microservices that do not interact with the Kubernetes API server receive zero bearer tokens in /var/run/secrets.',
        threatMitigated: 'Stolen ServiceAccount token abuse from inside compromised application pods.',
        implementationSnippet: {
          language: 'Kubernetes YAML',
          code: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: default
  namespace: tenant-production
automountServiceAccountToken: false`,
        },
      },
      {
        id: 'kyverno-supply-chain',
        category: 'Supply Chain & Image',
        title: 'Cryptographic Container Image Verification via Sigstore Cosign',
        severity: 'High',
        description: 'Kyverno admission controller intercepts Pod creation and verifies ECDSA signatures against the company PKI key before admitting container images into production clusters.',
        threatMitigated: 'Software supply-chain poisoning, unauthorized image injection, and tampered container binaries.',
        implementationSnippet: {
          language: 'Kyverno ClusterPolicy',
          code: `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-image-signatures
spec:
  validationFailureAction: Enforce
  rules:
    - name: verify-cosign
      match:
        any:
          - resources:
              kinds: ["Pod"]
      verifyImages:
        - imageReferences: ["ghcr.io/kubeforge/*"]
          key: |-
            -----BEGIN PUBLIC KEY-----
            MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
            -----END PUBLIC KEY-----`,
        },
      },
      {
        id: 'eso-vault-secrets',
        category: 'Secrets & Identity',
        title: 'External Secrets Operator with Vault / Cloud KMS',
        severity: 'High',
        description: 'Enforces external secret syncing from HashiCorp Vault or AWS Secrets Manager into ephemeral k8s secrets, avoiding plain text secret commits in Git repositories.',
        threatMitigated: 'Leaked credentials in Git history and unauthorized access to cloud database passwords.',
        implementationSnippet: {
          language: 'ExternalSecrets Spec',
          code: `apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: tenant-db-credentials
  namespace: tenant-production
spec:
  refreshInterval: "1h"
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: app-db-secret
    creationPolicy: Owner
  data:
    - secretKey: password
      remoteRef:
        key: production/database
        property: password`,
        },
      },
    ],
  },

  'kubemesh-cilium': {
    psaLevel: 'Restricted (Highest)',
    overview: 'Kernel-level zero-trust networking architecture enforcing default-deny ingress/egress, FQDN egress whitelisting, host-level BPF socket isolation, and transparent WireGuard pod-to-pod encryption.',
    practices: [
      {
        id: 'cilium-default-deny',
        category: 'Network Isolation',
        title: 'Cluster-Wide Default-Deny Ingress and Egress Policy',
        severity: 'Critical',
        description: 'Locks down all namespaces with a default-deny rule. Pods cannot transmit or receive a single network packet until an explicit CiliumNetworkPolicy allows the specific port and L7 method.',
        threatMitigated: 'Lateral movement across microservices during container compromises and unauthorized command-and-control beacons.',
        implementationSnippet: {
          language: 'CiliumNetworkPolicy',
          code: `apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  endpointSelector:
    matchLabels: {}
  ingress: []
  egress:
    # Allow DNS resolution only
    - toEndpoints:
        - matchLabels:
            "k8s:io.kubernetes.pod.namespace": kube-system
            k8s-app: kube-dns
      toPorts:
        - ports:
            - port: "53"
              protocol: ANY
          rules:
            dns:
              - matchPattern: "*"`,
        },
      },
      {
        id: 'fqdn-egress-lockdown',
        category: 'Network Isolation',
        title: 'Strict FQDN Egress Whitelisting (No Arbitrary Internet Traffic)',
        severity: 'Critical',
        description: 'Uses Cilium DNS-aware network policies to restrict outbound HTTPS traffic solely to trusted API providers (e.g., api.stripe.com, auth0.com), intercepting unauthorized IPs.',
        threatMitigated: 'Data exfiltration to attacker-controlled VPS servers and crypto-mining reverse shells.',
        implementationSnippet: {
          language: 'Cilium FQDN Policy',
          code: `apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: allow-stripe-egress-only
  namespace: payments
spec:
  endpointSelector:
    matchLabels:
      app: payment-processor
  egress:
    - toFQDNs:
        - matchName: "api.stripe.com"
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP`,
        },
      },
      {
        id: 'kernel-unprivileged-bpf',
        category: 'Pod Security Standards',
        title: 'Kernel Unprivileged eBPF Hardening',
        severity: 'High',
        description: 'Configures worker node sysctl kernel.unprivileged_bpf_disabled=1, preventing unprivileged user accounts from compiling and loading arbitrary eBPF bytecode programs.',
        threatMitigated: 'Spectre/Meltdown side-channel attacks and local privilege escalation via eBPF verifier bugs.',
        implementationSnippet: {
          language: 'Sysctl Config',
          code: `# /etc/sysctl.d/99-ebpf-security.conf
kernel.unprivileged_bpf_disabled = 1
net.core.bpf_jit_harden = 2`,
        },
      },
      {
        id: 'wireguard-mesh-crypto',
        category: 'Secrets & Identity',
        title: 'Transparent WireGuard Node-to-Node & Pod Encryption',
        severity: 'High',
        description: 'Enables kernel-level WireGuard encryption for all cross-node and cross-pod packet traversal with automated ChaCha20-Poly1305 key rotation.',
        threatMitigated: 'Network packet eavesdropping and man-in-the-middle sniffing on cloud VPC fabrics.',
        implementationSnippet: {
          language: 'Cilium Helm Setting',
          code: `encryption:
  enabled: true
  type: wireguard
  nodeEncryption: true`,
        },
      },
    ],
  },

  'kubetelemetry-lgtm': {
    psaLevel: 'Baseline',
    overview: 'Hardened observability pipeline ensuring zero exposure of application PII in logs, strict multi-tenant authorization headers on Mimir/Loki distributors, and non-root OTel Collector daemonsets.',
    practices: [
      {
        id: 'otel-pii-redaction',
        category: 'Pod Security Standards',
        title: 'Automated PII Redaction in OpenTelemetry Collector',
        severity: 'Critical',
        description: 'Uses the OpenTelemetry transform processor to scrub social security numbers, credit cards, JWT tokens, and passwords from logs and spans before persisting to S3.',
        threatMitigated: 'Sensitive customer PII leakage and regulatory compliance violations (GDPR, HIPAA, PCI-DSS).',
        implementationSnippet: {
          language: 'OTel Processor Spec',
          code: `processors:
  transform:
    log_statements:
      - context: log
        statements:
          - replace_pattern(body, "(Bearer\\\\s+)[a-zA-Z0-9\\\\-_\\\\.]+", "$$1[REDACTED]")
          - replace_pattern(body, "\\\\b(?:\\\\d[ -]*?){13,16}\\\\b", "[CARD_REDACTED]")`,
        },
      },
      {
        id: 'mimir-tenant-auth',
        category: 'RBAC & Least Privilege',
        title: 'Multi-Tenant Header Authentication & Scoped Namespaces',
        severity: 'High',
        description: 'Requires all remote_write and LogQL queries to authenticate with an X-Scope-OrgID header, guaranteeing that tenant A can never inspect tenant B metrics or log streams.',
        threatMitigated: 'Cross-tenant data leakage and unauthorized telemetry inspection in multi-tenant clusters.',
        implementationSnippet: {
          language: 'Mimir Ingress Route',
          code: `apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: require-tenant-header
  namespace: monitoring
spec:
  headers:
    customRequestHeaders:
      X-Scope-OrgID: "production-core"`,
        },
      },
      {
        id: 'read-only-rootfs',
        category: 'Pod Security Standards',
        title: 'Enforce Read-Only Root Filesystem on Collectors',
        severity: 'High',
        description: 'Configures securityContext.readOnlyRootFilesystem: true on OpenTelemetry Collector daemonsets with dedicated emptyDir mounts for scratch buffers.',
        threatMitigated: 'Malicious payload downloads or binary tampering inside monitoring agents.',
        implementationSnippet: {
          language: 'Collector Security Context',
          code: `securityContext:
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 10001
  capabilities:
    drop:
      - ALL`,
        },
      },
    ],
  },

  'kubescale-finops': {
    psaLevel: 'Restricted (Highest)',
    overview: 'Autoscaling security framework enforcing AWS IMDSv2 metadata lockdown, least-privilege Karpenter IAM role boundaries, and PodDisruptionBudgets.',
    practices: [
      {
        id: 'imdsv2-hop-limit',
        category: 'Network Isolation',
        title: 'Enforce AWS IMDSv2 Metadata Protection (Hop Limit = 1)',
        severity: 'Critical',
        description: 'Sets httpTokens: required and httpPutResponseHopLimit: 1 on Karpenter EC2NodeClass. Prevents application pods running on worker nodes from querying the EC2 instance metadata service.',
        threatMitigated: 'Server-Side Request Forgery (SSRF) exploitation leading to node IAM role hijacking.',
        implementationSnippet: {
          language: 'EC2NodeClass Spec',
          code: `apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  metadataOptions:
    httpEndpoint: enabled
    httpProtocolIPv6: disabled
    httpPutResponseHopLimit: 1
    httpTokens: required`,
        },
      },
      {
        id: 'karpenter-scoped-iam',
        category: 'RBAC & Least Privilege',
        title: 'Scoped Karpenter Controller IAM Permissions',
        severity: 'High',
        description: 'Restricts the controller IAM policy strictly to RunInstances and TerminateInstances scoped to tags karpenter.sh/managed-by, blocking broad ec2:* administrative grants.',
        threatMitigated: 'Privilege escalation to AWS cloud account administrator via compromised controller pods.',
        implementationSnippet: {
          language: 'IAM Policy JSON',
          code: `{
  "Effect": "Allow",
  "Action": ["ec2:TerminateInstances"],
  "Resource": "arn:aws:ec2:*:*:instance/*",
  "Condition": {
    "StringEquals": {
      "aws:ResourceTag/karpenter.sh/managed-by": "production-cluster"
    }
  }
}`,
        },
      },
      {
        id: 'pdb-consolidation-guard',
        category: 'Pod Security Standards',
        title: 'PodDisruptionBudgets to Prevent Availability Denial',
        severity: 'High',
        description: 'Defines minAvailable or maxUnavailable PDBs for all workloads, preventing Karpenter spot consolidation from draining too many replicas concurrently.',
        threatMitigated: 'Self-inflicted denial of service during aggressive automated node consolidation.',
        implementationSnippet: {
          language: 'PodDisruptionBudget',
          code: `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: order-workers-pdb
  namespace: workers
spec:
  minAvailable: 80%
  selector:
    matchLabels:
      app: order-processor`,
        },
      },
    ],
  },

  'kuberay-llm': {
    psaLevel: 'Baseline',
    overview: 'High-performance AI/GPU inference cluster security enforcing read-only model weight volumes, non-root Ray worker execution, and Kueue multi-tenant compute isolation.',
    practices: [
      {
        id: 'readonly-safetensors-pvc',
        category: 'Pod Security Standards',
        title: 'Mount Pre-Cached Model Weights as Read-Only PVCs',
        severity: 'Critical',
        description: 'Mounts Safetensors model weight directories with readOnly: true. GPU inference pods cannot overwrite or inject backdoor weights into shared storage.',
        threatMitigated: 'Model tampering, backdoor weight injection, and inference output poisoning.',
        implementationSnippet: {
          language: 'VolumeMount Spec',
          code: `volumeMounts:
  - name: model-cache
    mountPath: /models/llama-3-70b
    readOnly: true`,
        },
      },
      {
        id: 'non-root-ray-actors',
        category: 'Pod Security Standards',
        title: 'Non-Root Execution in PyTorch & Ray Containers',
        severity: 'High',
        description: 'Forces Ray head and worker containers to run with UID 1000 (ray user) with allowPrivilegeEscalation: false, dropping all Linux capabilities.',
        threatMitigated: 'GPU driver container escapes and host filesystem overwrites via malicious training job scripts.',
        implementationSnippet: {
          language: 'SecurityContext',
          code: `securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]`,
        },
      },
      {
        id: 'kueue-quota-fencing',
        category: 'RBAC & Least Privilege',
        title: 'Kueue Strict GPU Quota Fencing per Namespace',
        severity: 'High',
        description: 'Enforces hard GPU limits per team ClusterQueue. Research teams cannot starve production inference services by requesting 100% of H100 GPU nodes.',
        threatMitigated: 'Resource starvation and denial-of-service across internal research and serving teams.',
        implementationSnippet: {
          language: 'Kueue ClusterQueue',
          code: `apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: research-team-queue
spec:
  resourceGroups:
    - coveredResources: ["nvidia.com/gpu"]
      flavors:
        - name: "h100-gpu"
          resources:
            - name: "nvidia.com/gpu"
              nominalQuota: 16`,
        },
      },
    ],
  },

  'kubestate-storage': {
    psaLevel: 'Restricted (Highest)',
    overview: 'Stateful database and Ceph storage security enforcing automated password rotation, encrypted S3 backup storage with CMK, and strict client pg_hba.conf network isolation.',
    practices: [
      {
        id: 'encrypted-s3-wal',
        category: 'Secrets & Identity',
        title: 'AWS KMS CMK Envelope Encryption for WAL Backups',
        severity: 'Critical',
        description: 'Enforces server-side encryption with customer managed keys (aws:kms) on S3 buckets receiving continuous PostgreSQL WAL archives via Barman.',
        threatMitigated: 'Unauthorized database transaction recovery and cold storage data theft.',
        implementationSnippet: {
          language: 'Barman S3 Encryption',
          code: `backup:
  barmanObjectStore:
    destinationPath: "s3://kubeforge-wal-backups/postgres-banking/"
    serverName: "banking-postgres"
    s3Credentials:
      inheritFromIAMRole: true
    wal:
      encryption: "aws:kms"
      kmsKeyId: "arn:aws:kms:us-east-1:123456789:key/prod-db-key"`,
        },
      },
      {
        id: 'strict-pg-hba',
        category: 'Network Isolation',
        title: 'Strict pg_hba.conf Network Authentication Rules',
        severity: 'Critical',
        description: 'Configures PostgreSQL host-based authentication (pg_hba) to reject cleartext passwords, requiring scram-sha-256 and client TLS certificates for all connection streams.',
        threatMitigated: 'Credential interception on the internal Kubernetes network and brute-force attacks.',
        implementationSnippet: {
          language: 'Postgres HBA Spec',
          code: `postgresql:
  pg_hba:
    - "hostssl all all 10.244.0.0/16 scram-sha-256"
    - "hostnossl all all all reject"`,
        },
      },
      {
        id: 'ceph-dmcrypt-at-rest',
        category: 'Pod Security Standards',
        title: 'Ceph OSD dm-crypt Encryption at Rest',
        severity: 'High',
        description: 'Enforces encrypted: true in Rook-Ceph Cluster specs, encrypting every underlying NVMe block drive with Linux LUKS/dm-crypt with keys stored in Kubernetes Secrets.',
        threatMitigated: 'Data exposure from physically decommissioned or stolen server hard drives.',
        implementationSnippet: {
          language: 'CephCluster Spec',
          code: `spec:
  storage:
    useAllNodes: true
    useAllDevices: true
    config:
      encryptedDevice: "true"`,
        },
      },
    ],
  },

  'kubeedge-hybrid': {
    psaLevel: 'Restricted (Highest)',
    overview: 'Distributed edge architecture hardened with WireGuard mutual public-key authentication, encrypted local SQLite storage, and Node-Restriction admission controls.',
    practices: [
      {
        id: 'node-restriction-admission',
        category: 'RBAC & Least Privilege',
        title: 'Enable NodeRestriction Admission Controller',
        severity: 'Critical',
        description: 'Restricts kubelet modification privileges so compromised edge nodes cannot modify labels, taints, or secrets belonging to central cloud or other retail store nodes.',
        threatMitigated: 'Blast radius expansion from a physically stolen retail edge device to the wider cloud control plane.',
        implementationSnippet: {
          language: 'K3s Server Flag',
          code: `--kube-apiserver-arg=enable-admission-plugins=NodeRestriction,ServiceAccount`,
        },
      },
      {
        id: 'wireguard-mtls-tunnel',
        category: 'Network Isolation',
        title: 'WireGuard Kernel Overlay with Dynamic Public-Key Auth',
        severity: 'Critical',
        description: 'All control plane and edge sync traffic is encapsulated in kernel WireGuard tunnels over port 51820 with strictly matched public keys.',
        threatMitigated: 'Public Internet man-in-the-middle packet tampering between retail stores and the central cloud.',
        implementationSnippet: {
          language: 'WireGuard Config',
          code: `[Peer]
PublicKey = a8b7c6d5e4f3a2b1c0...
AllowedIPs = 10.42.0.0/16
Endpoint = cloud-vpn.kubeforge.net:51820
PersistentKeepalive = 25`,
        },
      },
      {
        id: 'encrypted-offline-sqlite',
        category: 'Secrets & Identity',
        title: 'SQLCipher AES-256 Encryption for Offline Buffers',
        severity: 'High',
        description: 'Local retail transactions stored during internet blackouts are encrypted on-disk using SQLCipher AES-256 before being queued for cloud sync.',
        threatMitigated: 'Physical drive extraction from unattended retail or warehouse equipment.',
        implementationSnippet: {
          language: 'App Env Config',
          code: `SQLITE_ENCRYPTION_CIPHER="aes-256-cbc"
SQLITE_KEY_ENV="LOCAL_STORE_KEY_AES"`,
        },
      },
    ],
  },
};
