import {
  ComplianceCheck,
  ComplianceScorecard,
  BenchmarkStandard,
  ComplianceCheckCategory,
} from '../types';

export interface AuditScanPhase {
  phase: number;
  name: string;
  target: string;
  durationMs: number;
  log: string;
}

export const AUDIT_SCAN_PHASES: AuditScanPhase[] = [
  {
    phase: 1,
    name: 'Control Plane & API Server Inspection',
    target: 'kube-apiserver, etcd, kube-controller-manager',
    durationMs: 400,
    log: '[CIS-1.x] Probing kube-apiserver arguments: --anonymous-auth, --authorization-mode=RBAC,Node, and --profiling...',
  },
  {
    phase: 2,
    name: 'Worker Nodes & Kubelet Configuration',
    target: 'kubelet.conf, /var/lib/kubelet/config.yaml',
    durationMs: 450,
    log: '[CIS-4.x] Auditing Kubelet client CA, streaming server TLS, and readOnlyPort=0 configuration on active nodes...',
  },
  {
    phase: 3,
    name: 'Pod Security Standards & Workload Admission',
    target: 'Namespace labels: pod-security.kubernetes.io/enforce',
    durationMs: 500,
    log: '[NSA-PSS] Evaluating Pod Security Admission enforcement across namespaces: privileged escalation, root uid, and seccomp...',
  },
  {
    phase: 4,
    name: 'Network Policies & Dataplane Segmentation',
    target: 'CiliumNetworkPolicy, Calico GlobalNetworkPolicy, K8s NetworkPolicy',
    durationMs: 400,
    log: '[PCI-DSS-1.x] Verifying default-deny ingress/egress policies and mutual TLS cryptographic tunnels...',
  },
  {
    phase: 5,
    name: 'RBAC, Service Accounts & Identity Posture',
    target: 'ClusterRoles, RoleBindings, automountServiceAccountToken',
    durationMs: 350,
    log: '[CIS-5.x] Inspecting wildcard verbs ("*") in ClusterRoles and default ServiceAccount token automount flags...',
  },
  {
    phase: 6,
    name: 'Secrets Management & Volume Encryption-at-Rest',
    target: 'KMS Plugin, SealedSecrets, CSI StorageClasses',
    durationMs: 400,
    log: '[SOC2-CC6.1] Checking envelope encryption with cloud KMS (AWS KMS / Azure Key Vault / HashiCorp Vault)...',
  },
];

const COMMON_CHECKS_KUBEFLEET: ComplianceCheck[] = [
  {
    id: 'CIS-1.2.1',
    standard: 'CIS Kubernetes Benchmark',
    section: '1.2 API Server',
    category: 'Control Plane & API',
    title: 'Ensure --anonymous-auth argument is set to false',
    description: 'Disables unauthenticated requests to the Kubernetes API server, preventing reconnaissance and unauthorized enumeration.',
    auditCommand: 'ps -ef | grep kube-apiserver | grep -- --anonymous-auth=false',
    rationale: 'Allowing anonymous requests provides an attacker with a low-barrier path to query the API server if RBAC is improperly scoped.',
    severity: 'Critical',
    status: 'PASS',
    remediation: {
      title: 'Update kube-apiserver manifest',
      type: 'yaml',
      snippet: 'spec:\n  containers:\n  - command:\n    - kube-apiserver\n    - --anonymous-auth=false',
    },
    affectedResource: 'kube-system / kube-apiserver-hub-controlplane',
  },
  {
    id: 'CIS-1.2.19',
    standard: 'CIS Kubernetes Benchmark',
    section: '1.2 API Server',
    category: 'Control Plane & API',
    title: 'Ensure --insecure-port is set to 0',
    description: 'Verifies the unauthenticated insecure HTTP serving port (8080) is completely disabled in kube-apiserver.',
    auditCommand: 'ps -ef | grep kube-apiserver | grep -- --insecure-port=0',
    rationale: 'Insecure ports bypass TLS encryption and authentication headers completely.',
    severity: 'Critical',
    status: 'PASS',
    remediation: {
      title: 'Disable insecure port',
      type: 'yaml',
      snippet: 'spec:\n  containers:\n  - command:\n    - kube-apiserver\n    - --insecure-port=0',
    },
    affectedResource: 'kube-system / kube-apiserver',
  },
  {
    id: 'CIS-2.1',
    standard: 'CIS Kubernetes Benchmark',
    section: '2.1 etcd Key-Value Store',
    category: 'Secrets & Data Protection',
    title: 'Ensure etcd peer and client communication is encrypted with TLS',
    description: 'Verifies etcd uses dedicated TLS certificates for inter-peer consensus and API server client transactions.',
    auditCommand: 'ps -ef | grep etcd | grep -- --cert-file && grep -- --key-file',
    rationale: 'Plaintext etcd communication permits sniffing of all cluster tokens, secrets, and raw manifest specs.',
    severity: 'High',
    status: 'PASS',
    remediation: {
      title: 'Enable etcd client/peer TLS certificates',
      type: 'yaml',
      snippet: 'spec:\n  containers:\n  - command:\n    - etcd\n    - --cert-file=/etc/kubernetes/pki/etcd/server.crt\n    - --key-file=/etc/kubernetes/pki/etcd/server.key\n    - --peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt',
    },
    affectedResource: 'kube-system / etcd-cluster-0',
  },
  {
    id: 'CIS-4.2.1',
    standard: 'CIS Kubernetes Benchmark',
    section: '4.2 Kubelet Worker Node',
    category: 'Worker Nodes & Kubelet',
    title: 'Ensure --anonymous-auth argument is set to false on Kubelet',
    description: 'Prevents unauthorized calls directly to the Kubelet port 10250 which allows remote command execution in containers.',
    auditCommand: 'grep "authentication.anonymous.enabled" /var/lib/kubelet/config.yaml',
    rationale: 'If Kubelet anonymous auth is enabled, an attacker with node network access can execute arbitrary code inside pods.',
    severity: 'Critical',
    status: 'PASS',
    remediation: {
      title: 'Set anonymous.enabled: false in KubeletConfiguration',
      type: 'yaml',
      snippet: 'apiVersion: kubelet.config.k8s.io/v1beta1\nkind: KubeletConfiguration\nauthentication:\n  anonymous:\n    enabled: false\n  webhook:\n    enabled: true',
    },
    affectedResource: 'worker-node-pool-primary (all nodes)',
  },
  {
    id: 'CIS-4.2.6',
    standard: 'CIS Kubernetes Benchmark',
    section: '4.2 Kubelet Worker Node',
    category: 'Worker Nodes & Kubelet',
    title: 'Ensure --protect-kernel-defaults is set to true',
    description: 'Ensures Kubelet does not modify kernel tunables (sysctl) if they conflict with systemd defaults.',
    auditCommand: 'grep "protectKernelDefaults: true" /var/lib/kubelet/config.yaml',
    rationale: 'Prevents Kubelet from overriding hardened host kernel tunables without explicit administrator action.',
    severity: 'Medium',
    status: 'WARN',
    remediation: {
      title: 'Enable protectKernelDefaults in Kubelet config',
      type: 'kubectl',
      snippet: 'kubectl set env daemonset/kubelet-config PROTECT_KERNEL_DEFAULTS=true -n kube-system',
    },
    affectedResource: 'systemd / kubelet.service (worker-pool-edge-03)',
  },
  {
    id: 'NSA-PSS-01',
    standard: 'NSA & CISA Hardening Guide',
    section: '1.0 Pod Security Standards',
    category: 'Pod Security & Admission',
    title: 'Enforce Pod Security Admission "Restricted" baseline',
    description: 'Requires workloads to run as non-root, drop ALL capabilities, disallow privilege escalation, and enforce read-only root filesystems.',
    auditCommand: 'kubectl get ns -o custom-columns=NAME:.metadata.name,PSA:.metadata.labels."pod-security\\.kubernetes\\.io/enforce"',
    rationale: 'Unrestricted pods can exploit kernel vulnerabilities to escape containers and compromise the host node.',
    severity: 'High',
    status: 'PASS',
    remediation: {
      title: 'Label namespaces with Restricted PSA',
      type: 'kubectl',
      snippet: 'kubectl label --overwrite ns production \\\n  pod-security.kubernetes.io/enforce=restricted \\\n  pod-security.kubernetes.io/enforce-version=latest',
    },
    affectedResource: 'namespaces: default, production, gitops-workloads',
  },
  {
    id: 'NSA-NET-02',
    standard: 'NSA & CISA Hardening Guide',
    section: '2.0 Network Segmentation',
    category: 'Network Policies & Mesh',
    title: 'Implement Default-Deny Ingress and Egress Network Policies',
    description: 'Isolates every workload namespace with explicit ingress and egress allow-lists, preventing lateral attacker movement.',
    auditCommand: 'kubectl get netpol -A --field-selector spec.podSelector={}',
    rationale: 'Kubernetes flat networking allows any pod to communicate with any other pod across namespaces unless denied by policy.',
    severity: 'High',
    status: 'PASS',
    remediation: {
      title: 'Apply default deny-all NetworkPolicy',
      type: 'yaml',
      snippet: 'apiVersion: networking.k8s.io/v1\nkind: NetworkPolicy\nmetadata:\n  name: default-deny-all\n  namespace: production\nspec:\n  podSelector: {}\n  policyTypes:\n  - Ingress\n  - Egress',
    },
    affectedResource: 'namespace / production, gitops-system',
  },
  {
    id: 'CIS-5.1.3',
    standard: 'CIS Kubernetes Benchmark',
    section: '5.1 RBAC Configuration',
    category: 'RBAC & Identity',
    title: 'Minimize wildcard ("*") permissions in ClusterRoles',
    description: 'Restricts ClusterRole definitions to explicit API groups, resources, and verbs rather than open-ended wildcards.',
    auditCommand: 'kubectl get clusterroles -o json | jq -r \'.items[] | select(.rules[].verbs[]? == "*") | .metadata.name\'',
    rationale: 'Wildcard privileges allow attackers who compromise a token to perform unexpected administrative or destructive actions.',
    severity: 'Critical',
    status: 'WARN',
    remediation: {
      title: 'Replace wildcard ClusterRoles with granular verbs',
      type: 'yaml',
      snippet: 'rules:\n- apiGroups: ["apps"]\n  resources: ["deployments", "replicasets"]\n  verbs: ["get", "list", "watch", "update"]\n# Removed: verbs: ["*"]',
    },
    affectedResource: 'ClusterRole / argocd-application-controller (reviewing sync scope)',
  },
  {
    id: 'CIS-5.1.5',
    standard: 'CIS Kubernetes Benchmark',
    section: '5.1 RBAC Configuration',
    category: 'RBAC & Identity',
    title: 'Ensure automountServiceAccountToken is set to false by default',
    description: 'Disables automatic injection of JWT service account credentials into pods that do not interact with the Kubernetes API.',
    auditCommand: 'kubectl get sa default -A -o jsonpath="{.items[*].automountServiceAccountToken}"',
    rationale: 'Mounting tokens by default gives any compromised application pod an immediate vector to authenticate against the control plane.',
    severity: 'Medium',
    status: 'PASS',
    remediation: {
      title: 'Disable automount on default service accounts',
      type: 'kubectl',
      snippet: 'kubectl patch serviceaccount default -p \'{"automountServiceAccountToken": false}\'',
    },
    affectedResource: 'ServiceAccount / default across all 12 namespaces',
  },
  {
    id: 'PCI-DSS-10.2',
    standard: 'PCI-DSS v4.0',
    section: 'Req 10: Audit Logs',
    category: 'Control Plane & API',
    title: 'Enable Kubernetes API Server Audit Logging to tamper-resistant storage',
    description: 'Streams all API server request headers, metadata, and mutating bodies to external object storage with write-once retention.',
    auditCommand: 'ps -ef | grep kube-apiserver | grep -- --audit-log-path && grep -- --audit-policy-file',
    rationale: 'Audit logging is mandatory for forensic investigation following security events and compliance certifications.',
    severity: 'High',
    status: 'PASS',
    remediation: {
      title: 'Configure audit policy file in kube-apiserver',
      type: 'yaml',
      snippet: 'spec:\n  containers:\n  - command:\n    - kube-apiserver\n    - --audit-log-path=/var/log/k8s-audit.log\n    - --audit-policy-file=/etc/kubernetes/audit-policy.yaml\n    - --audit-log-maxbackup=10',
    },
    affectedResource: 'kube-apiserver / audit pipeline',
  },
  {
    id: 'PCI-DSS-3.4',
    standard: 'PCI-DSS v4.0',
    section: 'Req 3: Protect Cardholder Data',
    category: 'Secrets & Data Protection',
    title: 'Encrypt Kubernetes Secrets at rest using Cloud KMS Provider',
    description: 'Ensures raw Secret resources stored in etcd are enveloped with AES-CBC or AES-GCM via external hardware security modules.',
    auditCommand: 'ps -ef | grep kube-apiserver | grep -- --encryption-provider-config',
    rationale: 'Without encryption-at-rest, anyone with raw disk or backup snapshot access can read plain secret values.',
    severity: 'Critical',
    status: 'PASS',
    remediation: {
      title: 'Deploy KMS EncryptionConfiguration',
      type: 'yaml',
      snippet: 'apiVersion: apiserver.config.k8s.io/v1\nkind: EncryptionConfiguration\nresources:\n  - resources:\n      - secrets\n    providers:\n      - kms:\n          name: cloudkms\n          endpoint: unix:///var/run/kmsplugin/socket.sock',
    },
    affectedResource: 'etcd / secrets-encryption-provider',
  },
  {
    id: 'SOC2-CC6.6',
    standard: 'SOC 2 Type II',
    section: 'CC6.6 Network Boundary',
    category: 'Network Policies & Mesh',
    title: 'Enforce Mutual TLS (mTLS) for all East-West microservice traffic',
    description: 'Requires all inter-pod traffic to undergo mutual cryptographic verification with automatic ephemeral SPIFFE/x509 rotation.',
    auditCommand: 'cilium status --verbose | grep "Encryption: WireGuard"',
    rationale: 'Zero-trust network architecture requires that compromise of any single container or node does not permit wire sniffing.',
    severity: 'High',
    status: 'PASS',
    remediation: {
      title: 'Enable WireGuard or Envoy strict mTLS',
      type: 'helm',
      snippet: 'helm upgrade cilium cilium/cilium --namespace kube-system \\\n  --set encryption.enabled=true \\\n  --set encryption.type=wireguard',
    },
    affectedResource: 'Cilium eBPF mesh dataplane',
  },
  {
    id: 'NIST-800-190-2.1',
    standard: 'NIST SP 800-190',
    section: '2.1 Image Vulnerability',
    category: 'Pod Security & Admission',
    title: 'Block container images with unpatched Critical CVEs using Kyverno/OPA',
    description: 'Validates cryptographic Cosign image signatures and verifies vulnerability scan reports prior to admission.',
    auditCommand: 'kubectl get clusterpolicies -o jsonpath="{.items[*].metadata.name}" | grep -E "verify-image|block-critical-cve"',
    rationale: 'Untrusted or vulnerable images introduce known exploit paths directly into the running cluster perimeter.',
    severity: 'High',
    status: 'PASS',
    remediation: {
      title: 'Apply Kyverno image verification policy',
      type: 'yaml',
      snippet: 'apiVersion: kyverno.io/v1\nkind: ClusterPolicy\nmetadata:\n  name: verify-image-signatures\nspec:\n  validationFailureAction: Enforce\n  rules:\n  - name: verify-sigstore-cosign\n    match:\n      resources:\n        kinds: ["Pod"]',
    },
    affectedResource: 'Admission Controller / Kyverno Engine',
  },
  {
    id: 'CIS-1.3.2',
    standard: 'CIS Kubernetes Benchmark',
    section: '1.3 Controller Manager',
    category: 'Control Plane & API',
    title: 'Ensure --profiling argument is set to false on Controller Manager',
    description: 'Disables the /debug/pprof profiling HTTP endpoint on the kube-controller-manager to prevent denial of service and memory dumps.',
    auditCommand: 'ps -ef | grep kube-controller-manager | grep -- --profiling=false',
    rationale: 'Profiling endpoints expose memory layouts and allow adversaries to consume significant CPU generating heap profiles.',
    severity: 'Low',
    status: 'PASS',
    remediation: {
      title: 'Set profiling=false in kube-controller-manager',
      type: 'yaml',
      snippet: 'spec:\n  containers:\n  - command:\n    - kube-controller-manager\n    - --profiling=false',
    },
    affectedResource: 'kube-system / kube-controller-manager',
  },
  {
    id: 'NSA-AUTH-03',
    standard: 'NSA & CISA Hardening Guide',
    section: '3.0 Authentication & Access',
    category: 'RBAC & Identity',
    title: 'Disable legacy ABAC authorization mode',
    description: 'Ensures only Node and RBAC authorization modules are active, forbidding Attribute-Based Access Control.',
    auditCommand: 'ps -ef | grep kube-apiserver | grep -- --authorization-mode',
    rationale: 'ABAC uses static files without dynamic auditability and cannot be scoped to namespaces or specific roles.',
    severity: 'Critical',
    status: 'PASS',
    remediation: {
      title: 'Configure authorization-mode=Node,RBAC',
      type: 'yaml',
      snippet: 'spec:\n  containers:\n  - command:\n    - kube-apiserver\n    - --authorization-mode=Node,RBAC',
    },
    affectedResource: 'kube-apiserver authorization engine',
  },
  {
    id: 'CIS-5.4.1',
    standard: 'CIS Kubernetes Benchmark',
    section: '5.4 Secrets Management',
    category: 'Secrets & Data Protection',
    title: 'Prefer external Secret Store CSI Driver over native Secret manifests in Git',
    description: 'Fetches runtime secrets dynamically from Vault, AWS Secrets Manager, or Azure Key Vault without checking sensitive data into git repositories.',
    auditCommand: 'kubectl get secretproviderclasses.secrets-store.csi.x-k8s.io -A',
    rationale: 'GitOps repositories should never contain plaintext or weakly encoded base64 secrets.',
    severity: 'High',
    status: 'PASS',
    remediation: {
      title: 'Install SecretStoreProviderClass',
      type: 'yaml',
      snippet: 'apiVersion: secrets-store.csi.x-k8s.io/v1\nkind: SecretProviderClass\nmetadata:\n  name: vault-app-secrets\nspec:\n  provider: vault\n  parameters:\n    roleName: "k8s-platform-role"',
    },
    affectedResource: 'Secrets CSI Driver / argocd, production',
  },
];

export const PROJECT_CUSTOM_CHECKS: Record<string, ComplianceCheck[]> = {
  'kubefleet-gitops': [
    ...COMMON_CHECKS_KUBEFLEET,
    {
      id: 'CIS-GITOPS-01',
      standard: 'CIS Kubernetes Benchmark',
      section: '5.2 GitOps Control',
      category: 'RBAC & Identity',
      title: 'Enforce Read-Only K8s Cluster Access for Human Engineers',
      description: 'Enforces that all cluster state changes route exclusively through Git commits, forbidding manual kubectl edit or apply in production.',
      auditCommand: 'kubectl get rolebindings,clusterrolebindings -A -o json | jq -r \'.items[] | select(.subjects[]?.kind == "User" and .roleRef.name == "cluster-admin")\'',
      rationale: 'Direct kubectl write access introduces unrecorded configuration drift and bypasses CI/CD security scanning gates.',
      severity: 'Critical',
      status: 'PASS',
      remediation: {
        title: 'Revoke cluster-admin from individual IAM users',
        type: 'kubectl',
        snippet: 'kubectl delete clusterrolebinding human-cluster-admins-binding',
      },
      affectedResource: 'ClusterRoleBinding / human-direct-access',
    },
    {
      id: 'NSA-SUPPLY-04',
      standard: 'NSA & CISA Hardening Guide',
      section: '4.0 Supply Chain',
      category: 'Pod Security & Admission',
      title: 'Automate Git commit GPG / SSH signature verification in ArgoCD',
      description: 'Rejects ArgoCD application synchronizations if the target Git commit is not signed by an authorized developer key.',
      auditCommand: 'kubectl get configmap argocd-cm -n argocd -o yaml | grep "gpg.verification"',
      rationale: 'Prevents rogue repository contributors from injecting malicious manifests into production workloads.',
      severity: 'High',
      status: 'PASS',
      remediation: {
        title: 'Enable GPG verification in ArgoCD',
        type: 'yaml',
        snippet: 'data:\n  gpg.verification: "true"\n  gpg.signature.keys: "/etc/argocd/gpg-keys"',
      },
      affectedResource: 'ArgoCD / Application Controller repo server',
    },
  ],

  'kubemesh-ebpf': [
    ...COMMON_CHECKS_KUBEFLEET.map((c) => ({
      ...c,
      status: (c.id === 'CIS-4.2.6' ? 'PASS' : c.status) as any,
    })),
    {
      id: 'CIS-EBPF-01',
      standard: 'CIS Kubernetes Benchmark',
      section: '3.1 Kernel & eBPF',
      category: 'Network Policies & Mesh',
      title: 'Enforce BPF unprivileged_bpf_disabled in sysctl',
      description: 'Prevents non-root containerized processes from loading unverified eBPF bytecode programs into the kernel.',
      auditCommand: 'sysctl kernel.unprivileged_bpf_disabled',
      rationale: 'Unprivileged eBPF execution can facilitate Spectre-style speculative side-channel attacks.',
      severity: 'Critical',
      status: 'PASS',
      remediation: {
        title: 'Set sysctl kernel.unprivileged_bpf_disabled=1',
        type: 'kubectl',
        snippet: 'kubectl apply -f https://raw.githubusercontent.com/cilium/cilium/main/install/kubernetes/sysctl-daemonset.yaml',
      },
      affectedResource: 'Linux Kernel Host / sysctl on all nodes',
    },
    {
      id: 'PCI-DSS-4.1',
      standard: 'PCI-DSS v4.0',
      section: 'Req 4: Transmitted Data',
      category: 'Network Policies & Mesh',
      title: 'Ensure Node-to-Node Pod IPsec or WireGuard encryption is ACTIVE',
      description: 'Guarantees hardware-accelerated kernel WireGuard encryption for every packet traversing host network boundaries.',
      auditCommand: 'cilium status | grep "Encryption: WireGuard"',
      rationale: 'Unencrypted cross-node network transit allows cloud hypervisor sniffing or physical tap eavesdropping.',
      severity: 'Critical',
      status: 'PASS',
      remediation: {
        title: 'Enable Cilium WireGuard encryption',
        type: 'helm',
        snippet: 'helm upgrade cilium cilium/cilium -n kube-system --set encryption.enabled=true --set encryption.type=wireguard',
      },
      affectedResource: 'cilium-agent daemonset on 12 nodes',
    },
    {
      id: 'NSA-EBPF-02',
      standard: 'NSA & CISA Hardening Guide',
      section: '2.4 Service Mesh Security',
      category: 'Network Policies & Mesh',
      title: 'Implement L7 Layer 7 DNS & HTTP path-based egress filtering',
      description: 'Restricts egress from production pods to explicit FQDN domains (e.g. *.api.stripe.com) and blocks raw IP egress.',
      auditCommand: 'kubectl get ciliumnetworkpolicies -A',
      rationale: 'Restricting DNS prevents data exfiltration and Command-and-Control (C2) beaconing if a pod is compromised.',
      severity: 'High',
      status: 'PASS',
      remediation: {
        title: 'Apply CiliumNetworkPolicy with toFQDNs rules',
        type: 'yaml',
        snippet: 'apiVersion: cilium.io/v2\nkind: CiliumNetworkPolicy\nmetadata:\n  name: strict-egress-fqdn\nspec:\n  endpointSelector:\n    matchLabels:\n      app: api-service\n  egress:\n  - toFQDNs:\n    - matchName: "api.stripe.com"',
      },
      affectedResource: 'CiliumNetworkPolicy / strict-egress-fqdn',
    },
  ],

  'kubellm-gpu': [
    ...COMMON_CHECKS_KUBEFLEET,
    {
      id: 'NIST-GPU-01',
      standard: 'NIST SP 800-190',
      section: '3.4 Hardware Accelerators',
      category: 'Pod Security & Admission',
      title: 'Restrict NVIDIA Container Toolkit privileged capabilities',
      description: 'Ensures GPU inference containers run with unprivileged user permissions and isolated MIG (Multi-Instance GPU) instances.',
      auditCommand: 'kubectl get pods -n ai-inference -o json | jq \'.items[].spec.containers[].securityContext.privileged\'',
      rationale: 'Running GPU workloads with privileged=true grants attackers raw access to host PCI-e buses and kernel drivers.',
      severity: 'Critical',
      status: 'FAIL',
      remediation: {
        title: 'Drop privileged flag and mount only NVIDIA CDI devices',
        type: 'yaml',
        snippet: 'securityContext:\n  privileged: false\n  allowPrivilegeEscalation: false\n  capabilities:\n    drop: ["ALL"]\nresources:\n  limits:\n    nvidia.com/mig-3g.40gb: 1',
      },
      affectedResource: 'ai-inference / vllm-deepseek-worker-0',
    },
    {
      id: 'CIS-GPU-02',
      standard: 'CIS Kubernetes Benchmark',
      section: '5.3 Workload Storage',
      category: 'Secrets & Data Protection',
      title: 'Enforce TLS encryption and IAM role scoping for Model Weights S3 Mounts',
      description: 'Protects proprietary model weights and LLM checkpoints in transit between object storage (S3/GCS) and GPU node memory.',
      auditCommand: 'kubectl get pods -n ai-inference -o yaml | grep "AWS_ENFORCE_SSL"',
      rationale: 'Unencrypted S3 egress permits model weight tampering or unauthorized parameter extraction.',
      severity: 'High',
      status: 'PASS',
      remediation: {
        title: 'Enforce SSL for AWS S3 CSI Driver',
        type: 'yaml',
        snippet: 'env:\n- name: AWS_ENFORCE_SSL\n  value: "true"\n- name: S3_STORAGE_CLASS\n  value: "INTELLIGENT_TIERING"',
      },
      affectedResource: 'StorageClass / s3-models-bucket-csi',
    },
    {
      id: 'NSA-GPU-03',
      standard: 'NSA & CISA Hardening Guide',
      section: '1.4 Multi-Tenancy & Host Paths',
      category: 'Pod Security & Admission',
      title: 'Disallow HostPath mounts for GPU driver directories',
      description: 'Replaces direct hostPath mounts (/usr/local/nvidia) with the standardized NVIDIA GPU Operator CDI device injection.',
      auditCommand: 'kubectl get pods -n ai-inference -o json | jq \'.items[].spec.volumes[].hostPath\'',
      rationale: 'HostPath mounts allow containers to write directly to node filesystem binaries and compromise host integrity.',
      severity: 'High',
      status: 'WARN',
      remediation: {
        title: 'Migrate to NVIDIA Container Device Interface (CDI)',
        type: 'kubectl',
        snippet: 'kubectl patch daemonset nvidia-device-plugin-daemonset -n gpu-operator --type=json -p \'[{"op": "replace", "path": "/spec/template/spec/containers/0/env/0/value", "value": "cdi"}]\'',
      },
      affectedResource: 'vllm-deepseek-worker-0 (hostPath volume /dev/shm mounted)',
    },
  ],

  'cnpg-ha-db': [
    ...COMMON_CHECKS_KUBEFLEET,
    {
      id: 'PCI-DSS-8.2',
      standard: 'PCI-DSS v4.0',
      section: 'Req 8: User Identification',
      category: 'Secrets & Data Protection',
      title: 'Enforce SCRAM-SHA-256 for all PostgreSQL client connections',
      description: 'Replaces md5 password hashing with salted SCRAM-SHA-256 cryptographic handshakes.',
      auditCommand: 'kubectl exec -it cnpg-cluster-1 -c postgres -- psql -c "SHOW password_encryption;"',
      rationale: 'MD5 password hashing is vulnerable to offline rainbow table dictionary attacks.',
      severity: 'High',
      status: 'PASS',
      remediation: {
        title: 'Set password_encryption to scram-sha-256 in CNPG cluster spec',
        type: 'yaml',
        snippet: 'spec:\n  postgresql:\n    parameters:\n      password_encryption: \'scram-sha-256\'\n      ssl: \'on\'',
      },
      affectedResource: 'PostgresCluster / cnpg-production-main',
    },
    {
      id: 'SOC2-CC6.7',
      standard: 'SOC 2 Type II',
      section: 'CC6.7 Data Transmission',
      category: 'Secrets & Data Protection',
      title: 'Enforce SSL/TLS for PostgreSQL streaming replication and WAL archiving',
      description: 'Requires all inter-replica WAL streaming over port 5432 and Barman S3 archiving to use TLS v1.3.',
      auditCommand: 'kubectl exec -it cnpg-cluster-1 -c postgres -- psql -c "SELECT client_addr, ssl, version FROM pg_stat_ssl;"',
      rationale: 'Unencrypted database replication exposes sensitive customer records to network sniffing.',
      severity: 'Critical',
      status: 'PASS',
      remediation: {
        title: 'Enforce TLS in pg_hba.conf rules',
        type: 'yaml',
        snippet: 'spec:\n  postgresql:\n    pg_hba:\n      - hostssl all all all scram-sha-256\n      - hostssl replication all all scram-sha-256',
      },
      affectedResource: 'CNPG Cluster / streaming replication stream',
    },
  ],

  'kubecost-greenops': [
    ...COMMON_CHECKS_KUBEFLEET,
    {
      id: 'CIS-LIMITS-01',
      standard: 'CIS Kubernetes Benchmark',
      section: '5.5 Resource Quotas',
      category: 'Pod Security & Admission',
      title: 'Enforce CPU & Memory Resource Limits on all production namespaces',
      description: 'Requires explicit resource requests and limits to prevent noisy neighbor denial-of-service.',
      auditCommand: 'kubectl get limitranges -A',
      rationale: 'Pods without memory limits can trigger node out-of-memory kernel panics and evict critical system pods.',
      severity: 'High',
      status: 'PASS',
      remediation: {
        title: 'Create LimitRange in target namespace',
        type: 'yaml',
        snippet: 'apiVersion: v1\nkind: LimitRange\nmetadata:\n  name: default-resource-limits\n  namespace: production\nspec:\n  limits:\n  - default:\n      cpu: "1"\n      memory: "2Gi"\n    defaultRequest:\n      cpu: "100m"\n      memory: "256Mi"\n    type: Container',
      },
      affectedResource: 'Namespace / kubecost, workloads',
    },
  ],

  'zerotrust-edge': [
    ...COMMON_CHECKS_KUBEFLEET,
    {
      id: 'CIS-EDGE-01',
      standard: 'CIS Kubernetes Benchmark',
      section: '4.3 Edge Node Physical Hardening',
      category: 'Worker Nodes & Kubelet',
      title: 'Enforce TPM 2.0 Measured Boot & Full Disk Encryption on Edge Gateways',
      description: 'Protects edge cluster SQLite/Kine storage and secrets against physical tampering or hardware theft.',
      auditCommand: 'systemd-cryptenroll --tpm2-device=list',
      rationale: 'Edge gateways deployed outside secured datacenters are vulnerable to physical extraction of storage drives.',
      severity: 'Critical',
      status: 'PASS',
      remediation: {
        title: 'Enroll LUKS disk key into TPM 2.0',
        type: 'kubectl',
        snippet: 'systemd-cryptenroll --tpm2-device=auto /dev/nvme0n1p2',
      },
      affectedResource: 'Edge Gateways / factory-edge-node-01..04',
    },
  ],

  'kube-telemetry-fabric': [
    ...COMMON_CHECKS_KUBEFLEET,
    {
      id: 'NIST-LOG-01',
      standard: 'NIST SP 800-190',
      section: '2.5 Observability Pipeline Protection',
      category: 'Secrets & Data Protection',
      title: 'Sanitize PII, API tokens, and credentials from OpenTelemetry collector pipelines',
      description: 'Applies regex scrubbing filters in OTEL processors before shipping traces and logs to Grafana Tempo and Loki.',
      auditCommand: 'kubectl get configmap otel-collector-config -n observability -o yaml | grep "redaction"',
      rationale: 'Unsanitized traces leak customer passwords, tokens, and credit card numbers into log indices.',
      severity: 'High',
      status: 'PASS',
      remediation: {
        title: 'Enable redacting processor in OpenTelemetry Collector',
        type: 'yaml',
        snippet: 'processors:\n  redaction:\n    allow_all_keys: false\n    allowed_keys:\n      - http.status_code\n      - http.method\n    blocked_values:\n      - "(?i)bearer\\\\s+[a-z0-9_.-]+"\n      - "(?i)password"',
      },
      affectedResource: 'OpenTelemetry Collector / daemonset & gateway',
    },
  ],
};

export function getProjectComplianceScorecard(projectId: string): ComplianceScorecard {
  const checks = PROJECT_CUSTOM_CHECKS[projectId] || COMMON_CHECKS_KUBEFLEET;
  
  const passedCount = checks.filter((c) => c.status === 'PASS').length;
  const warningCount = checks.filter((c) => c.status === 'WARN').length;
  const failedCount = checks.filter((c) => c.status === 'FAIL').length;
  const totalChecks = checks.length;

  // Calculation: PASS = 100%, WARN = 50%, FAIL = 0%
  const earnedPoints = passedCount * 1.0 + warningCount * 0.5;
  const rawScore = totalChecks > 0 ? Math.round((earnedPoints / totalChecks) * 100) : 100;

  let grade: ComplianceScorecard['grade'] = 'A';
  if (rawScore >= 95) grade = 'A+';
  else if (rawScore >= 90) grade = 'A';
  else if (rawScore >= 85) grade = 'A-';
  else if (rawScore >= 75) grade = 'B+';
  else if (rawScore >= 65) grade = 'B';
  else if (rawScore >= 50) grade = 'C';
  else grade = 'Non-Compliant';

  const categories: ComplianceCheckCategory[] = [
    'Control Plane & API',
    'Worker Nodes & Kubelet',
    'Pod Security & Admission',
    'Network Policies & Mesh',
    'RBAC & Identity',
    'Secrets & Data Protection',
  ];

  const categoryScores = categories.map((cat) => {
    const catChecks = checks.filter((c) => c.category === cat);
    if (catChecks.length === 0) {
      return { category: cat, score: 100, passed: 0, total: 0 };
    }
    const catPassed = catChecks.filter((c) => c.status === 'PASS').length;
    const catWarn = catChecks.filter((c) => c.status === 'WARN').length;
    const catScore = Math.round(((catPassed * 1.0 + catWarn * 0.5) / catChecks.length) * 100);
    return {
      category: cat,
      score: catScore,
      passed: catPassed,
      total: catChecks.length,
    };
  });

  const standards: BenchmarkStandard[] = [
    'CIS Kubernetes Benchmark',
    'NSA & CISA Hardening Guide',
    'PCI-DSS v4.0',
    'SOC 2 Type II',
    'NIST SP 800-190',
  ];

  const benchmarkBreakdown = standards.map((std) => {
    const stdChecks = checks.filter((c) => c.standard === std);
    if (stdChecks.length === 0) {
      return { standard: std, score: 100, passed: 0, total: 0 };
    }
    const stdPassed = stdChecks.filter((c) => c.status === 'PASS').length;
    const stdWarn = stdChecks.filter((c) => c.status === 'WARN').length;
    const stdScore = Math.round(((stdPassed * 1.0 + stdWarn * 0.5) / stdChecks.length) * 100);
    return {
      standard: std,
      score: stdScore,
      passed: stdPassed,
      total: stdChecks.length,
    };
  });

  return {
    overallScore: rawScore,
    grade,
    totalChecks,
    passedCount,
    warningCount,
    failedCount,
    categoryScores,
    benchmarkBreakdown,
    checks,
    lastAuditedAt: '2026-10-19 04:30:00 UTC',
    auditTool: 'kube-bench v0.7.3 & Trivy Operator v0.18.2 (Automated Mock Pipeline)',
  };
}
