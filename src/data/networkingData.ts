import { NetworkSolution } from '../types';

export const NETWORKING_SOLUTIONS: NetworkSolution[] = [
  // CNIs
  {
    id: 'calico',
    name: 'Calico (Project Calico by Tigera)',
    category: 'CNI',
    underlyingTech: 'BGP (Border Gateway Protocol) routing, IP-in-IP / VXLAN overlay, eBPF or iptables dataplane',
    dataplane: 'Linux iptables/ipset OR native eBPF dataplane',
    networkPolicySupport: 'Industry-standard Tier 1 (L3/L4 Kubernetes NetworkPolicies + GlobalNetworkPolicies + DNS egress rules)',
    encryptionMethod: 'Native WireGuard pod-to-pod encryption or IPsec',
    primaryPurpose: 'High-performance scalable container networking with granular, defense-in-depth network policy enforcement and enterprise compliance.',
    howItWorks: 'Assigns routed IP addresses to every pod and distributes IP routing information directly across cluster nodes via BGP peers (using BIRD). In bare-metal or L2 environments, it avoids overlay encapsulation entirely (flat network). In clouds like AWS/GCP, it can use VXLAN or IP-in-IP overlays.',
    pros: [
      'Unsurpassed network policy engine (GlobalNetworkPolicy, policy tiers, flow logs).',
      'True unencapsulated BGP routing delivers wire-speed bare-metal throughput.',
      'Flexible data plane: toggle between standard Linux iptables or high-performance eBPF.',
      'One-command WireGuard encryption with minimal CPU overhead.',
    ],
    cons: [
      'BGP mode is difficult to configure in public clouds that disallow custom MAC/IP advertisements without encapsulation.',
      'Large clusters using iptables mode suffer from slow iptables rule regeneration times upon pod churn.',
      'Higher initial learning curve than basic overlay solutions like Flannel.',
    ],
    idealUseCases: [
      'Enterprises with strict compliance and security audit mandates (PCI-DSS, SOC2, HIPAA).',
      'Bare-metal on-premise Kubernetes clusters where direct BGP peering to top-of-rack switches is available.',
      'Clusters requiring advanced egress gateway IP pinning for external firewalls.',
    ],
    resourceOverhead: 'Moderate (50-100MB/node)',
    complexity: 'Medium',
  },
  {
    id: 'flannel',
    name: 'Flannel (CoreOS / Flannel-IO)',
    category: 'CNI',
    underlyingTech: 'Overlay networking via VXLAN (default), host-gw, or UDP encapsulation',
    dataplane: 'Linux kernel VXLAN / bridge devices',
    networkPolicySupport: 'None (Requires paired policy engine like Calico in "Canal" mode)',
    encryptionMethod: 'None built-in (relies on underlying node-to-node network encryption)',
    primaryPurpose: 'The simplest, most lightweight way to give every Kubernetes node an IP subnet and provide basic pod-to-pod cross-node routability.',
    howItWorks: 'Runs a single small agent daemon (flanneld) on each node that allocates a subnet lease from a pre-configured cluster CIDR. It encapsulates cross-host pod traffic into standard UDP VXLAN packets (port 8472) and de-encapsulates them at the destination node.',
    pros: [
      'Dead simple installation: often just a single manifest with near-zero configuration.',
      'Extremely low memory and CPU footprint on worker nodes.',
      'Highly portable across virtually all Linux distributions and cloud/bare-metal environments.',
      'Ideal for learning, homelabs, and edge/IoT deployments where security policies are handled externally.',
    ],
    cons: [
      'Zero NetworkPolicy support: any pod can talk to any other pod by default without restriction.',
      'VXLAN encapsulation introduces MTU overhead (50 bytes per packet) and slight CPU penalty.',
      'No advanced traffic engineering, L7 filtering, or integrated observability.',
    ],
    idealUseCases: [
      'Homelabs, edge clusters (e.g. k3s defaults), and lightweight developer testing clusters.',
      'Workloads where network security is fully handled at the application layer (e.g. software API keys/tokens).',
    ],
    resourceOverhead: 'Ultra-Low (<10MB/pod)',
    complexity: 'Low',
  },
  {
    id: 'cilium-cni',
    name: 'Cilium eBPF CNI',
    category: 'CNI',
    underlyingTech: 'Linux kernel eBPF (Extended Berkeley Packet Filter), sockops, XDP, TC',
    dataplane: 'Kernel eBPF byte-code programs (bypasses Linux netfilter and iptables)',
    networkPolicySupport: 'L3, L4, and L7 (HTTP method/path, Kafka topic, DNS/FQDN filtering) policies',
    encryptionMethod: 'Transparent WireGuard or IPsec node-to-node & pod-to-pod encryption',
    primaryPurpose: 'Next-generation cloud-native networking, full kube-proxy replacement, high-speed load balancing, and deep observability with Hubble.',
    howItWorks: 'Injects compiled eBPF bytecode programs directly into kernel hooks (XDP, tc, socket layer). Bypasses the entire legacy Linux TCP/IP stack for local socket communication via sockops. Replaces kube-proxy using constant-time eBPF hash tables instead of linear iptables chains.',
    pros: [
      'Massive scale performance: O(1) hash map lookup vs O(N) linear iptables degradation.',
      'Sidecarless service mesh features (L7 routing, mTLS, traffic management) built into the CNI.',
      'Hubble observability provides deep visibility into packet drops, DNS resolution, and HTTP status codes.',
      'Transparent encryption without modifying any application pods or services.',
    ],
    cons: [
      'Requires modern Linux kernels (v5.4+ minimum, v5.10+ strongly recommended).',
      'Debugging requires familiarity with eBPF tools (`bpftool`, `cilium-dbg`, Hubble CLI).',
      'Upgrading can be complex if custom kernel flags or non-standard Linux distros are in use.',
    ],
    idealUseCases: [
      'Large-scale enterprise clusters (>500 nodes or >5,000 services).',
      'High-throughput, low-latency microservices (fintech, streaming, real-time gaming).',
      'Environments requiring L7-aware network policies and automatic DNS egress auditing.',
    ],
    resourceOverhead: 'Low (15-30MB/node)',
    complexity: 'Medium',
  },
  {
    id: 'aws-vpc-cni',
    name: 'AWS VPC CNI (amazon-vpc-cni-k8s)',
    category: 'CNI',
    underlyingTech: 'AWS Elastic Network Interfaces (ENI) and secondary private IPv4/IPv6 addresses',
    dataplane: 'Linux kernel routing + AWS VPC Fabric',
    networkPolicySupport: 'Native Amazon EKS Network Policies or Calico policy engine integration',
    encryptionMethod: 'AWS Nitro instance-level wire encryption or external mesh',
    primaryPurpose: 'Direct integration of Kubernetes pods with native AWS VPC networking, giving each pod a real VPC IP address.',
    howItWorks: 'Attaches secondary Elastic Network Interfaces (ENIs) to EC2 worker nodes and allocates secondary private IP addresses directly to pods. Pods can communicate with AWS resources (RDS, S3, on-prem via DirectConnect) with zero NAT/overlay overhead.',
    pros: [
      'Zero encapsulation overhead: native line-rate AWS VPC network speed.',
      'Pods are first-class VPC citizens: inspectable in AWS VPC Flow Logs, accessible directly from VPC.',
      'Allows applying AWS Security Groups directly to individual Kubernetes pods.',
    ],
    cons: [
      'Exhausts VPC subnet IP addresses rapidly without secondary CIDRs or IPv6.',
      'Pod density per node is strictly limited by the maximum number of ENIs supported by the EC2 instance type.',
      'Only runs on AWS EKS or EC2-based self-managed clusters.',
    ],
    idealUseCases: [
      'AWS-native workloads needing direct integration with RDS, ElastiCache, or legacy corporate VPCs.',
      'Applications where security teams mandate AWS Security Groups per pod.',
    ],
    resourceOverhead: 'Low (15-30MB/node)',
    complexity: 'Medium',
  },

  // Service Meshes
  {
    id: 'istio',
    name: 'Istio Service Mesh',
    category: 'Service Mesh',
    underlyingTech: 'Envoy proxy data plane + istiod control plane (supports Classic Sidecars & Ambient Mesh)',
    dataplane: 'Envoy Proxy (per-pod sidecar container or node-level Ambient ztunnel / waypoint)',
    networkPolicySupport: 'AuthorizationPolicies (L7 JWT verification, claims, mTLS enforcement, SPIFFE IDs)',
    encryptionMethod: 'Mutual TLS (mTLS) with automated X.509 certificate issuance and rotation via SPIFFE',
    primaryPurpose: 'Comprehensive traffic management, zero-trust security, distributed tracing, and canary traffic shifting for complex enterprise topologies.',
    howItWorks: 'In classic mode, an init-container configures iptables to intercept all pod ingress and egress traffic, redirecting it through a local Envoy sidecar proxy. In the newer "Ambient Mesh" mode, an L4 node proxy (ztunnel) provides mTLS and telemetry without sidecars, while an optional L7 Waypoint proxy handles complex L7 routing.',
    pros: [
      'Most mature and feature-rich service mesh with the largest ecosystem and production pedigree.',
      'Sophisticated traffic management: canary weighting, circuit breaking, fault injection, retry budgets.',
      'Built-in cryptographic workload identity (SPIRE/SPIFFE) and end-user JWT validation.',
      'Ambient mode eliminates pod-level sidecar injection and rolling restart friction.',
    ],
    cons: [
      'Classic sidecar mode adds substantial CPU and memory overhead (e.g. 50–150MB RAM + 0.1–0.5 vCPU per pod).',
      'Substantial operational and configuration surface area (VirtualServices, DestinationRules, EnvoyFilters).',
      'Debugging failed connection handshakes requires reading verbose Envoy access logs.',
    ],
    idealUseCases: [
      'Large enterprises requiring granular canary rollouts, multi-cloud traffic routing, and strict zero-trust mTLS.',
      'Microservices requiring end-to-end request-level JWT authentication and rate limiting.',
    ],
    resourceOverhead: 'High (Sidecar + Daemon)',
    complexity: 'Advanced',
  },
  {
    id: 'linkerd',
    name: 'Linkerd 2 (Buoyant / CNCF Graduated)',
    category: 'Service Mesh',
    underlyingTech: 'Custom ultralight Rust micro-proxy (linkerd2-proxy) + Go control plane',
    dataplane: 'linkerd2-proxy (sidecar container written in memory-safe Rust)',
    networkPolicySupport: 'Server and ServerAuthorization CRDs (strict mTLS policy & route authentication)',
    encryptionMethod: 'Automatic, zero-configuration mutual TLS (mTLS) out of the box',
    primaryPurpose: 'Ultralight, secure, and operationally simple service mesh focusing on fast zero-config mTLS, golden metrics, and reliability.',
    howItWorks: 'Injects a purpose-built, high-performance Rust proxy (`linkerd2-proxy`) alongside application containers. Unlike Envoy, which is a general-purpose proxy with millions of lines of C++, linkerd2-proxy is designed strictly for service mesh duties, guaranteeing safety and minimal footprint.',
    pros: [
      'Remarkably fast and lightweight: consumes ~15–30MB RAM and sub-millisecond latency.',
      'Zero-configuration default: mTLS and golden signal telemetry (success rate, latency, RPS) work immediately.',
      'Written in memory-safe Rust: immune to whole classes of memory corruption and buffer overflow exploits.',
      'Intuitive CLI (`linkerd check`, `linkerd viz`) makes troubleshooting transparent.',
    ],
    cons: [
      'Fewer advanced L7 request manipulation options compared to Istio\'s vast EnvoyFilter ecosystem.',
      'No native ingress gateway included (relies on third-party ingress controllers like Traefik or Emissary).',
      'Historically strictly sidecar-based (though Ambient-like developments are emerging).',
    ],
    idealUseCases: [
      'Organizations wanting zero-trust mTLS and golden metrics without the administrative overhead of Istio.',
      'Latency-sensitive environments where every millisecond of sidecar proxy overhead matters.',
    ],
    resourceOverhead: 'Low (15-30MB/node)',
    complexity: 'Medium',
  },
  {
    id: 'cilium-mesh',
    name: 'Cilium Service Mesh',
    category: 'Service Mesh',
    underlyingTech: 'eBPF kernel acceleration + per-node Envoy daemon (Sidecarless architecture)',
    dataplane: 'Linux kernel eBPF for L4 routing + shared host Envoy proxy for L7',
    networkPolicySupport: 'CiliumNetworkPolicy (L3/L4/L7), Ingress and Gateway API compliant',
    encryptionMethod: 'WireGuard/IPsec kernel encryption + SPIFFE-based mTLS authentication',
    primaryPurpose: 'Sidecarless service mesh unifying CNI networking, security, and L7 traffic management in a single kernel-driven framework.',
    howItWorks: 'Performs L4 traffic routing, load balancing, and encryption directly in the Linux kernel using eBPF. When L7 features (HTTP path routing, header matching, tracing) are needed, eBPF redirects only those specific streams to a shared per-node Envoy instance instead of injecting a sidecar in every pod.',
    pros: [
      'Zero sidecars in application pods: application developers do not have to modify pod manifests.',
      'Massive memory savings across the cluster (saves tens of gigabytes of RAM in dense node pools).',
      'Unified single control plane for both CNI container networking and Service Mesh.',
    ],
    cons: [
      'Ties the service mesh directly to Cilium CNI (cannot run Cilium Mesh on top of Calico or Flannel).',
      'Shared per-node Envoy proxy requires robust noisy-neighbor isolation for high-traffic tenants.',
    ],
    idealUseCases: [
      'Clusters already using Cilium CNI that want service mesh capabilities without sidecar bloat.',
      'Large-scale environments with thousands of microservices where sidecars consume excessive memory.',
    ],
    resourceOverhead: 'Low (15-30MB/node)',
    complexity: 'Medium',
  },
];

export interface PacketFlowStep {
  step: number;
  location: string;
  action: string;
  latencyMicroseconds: number;
  detail: string;
}

export const PACKET_FLOW_SCENARIOS: {
  id: string;
  title: string;
  solutionType: string;
  description: string;
  steps: PacketFlowStep[];
}[] = [
  {
    id: 'flannel-flow',
    title: 'Standard Flannel VXLAN Encapsulation',
    solutionType: 'Flannel CNI',
    description: 'Packet path across nodes using standard Linux bridge, iptables kube-proxy, and UDP VXLAN tunnel.',
    steps: [
      { step: 1, location: 'Pod A (Namespace)', action: 'Application creates TCP socket and calls write()', latencyMicroseconds: 15, detail: 'Packets exit pod veth interface into node root namespace.' },
      { step: 2, location: 'Node Root Netns', action: 'Linear iptables / kube-proxy chain evaluation', latencyMicroseconds: 65, detail: 'Iterates through KUBE-SERVICES and KUBE-SVC chains to resolve ClusterIP to Pod IP.' },
      { step: 3, location: 'flannel.1 Interface', action: 'VXLAN packet encapsulation (UDP Port 8472)', latencyMicroseconds: 40, detail: 'Wraps inner IP packet with outer UDP header; sets 50-byte MTU overhead.' },
      { step: 4, location: 'Physical NIC eth0', action: 'Transmits UDP frame across physical data center switch', latencyMicroseconds: 180, detail: 'Traverses underlay network between node hosts.' },
      { step: 5, location: 'Node B flannel.1', action: 'VXLAN de-encapsulation in Linux kernel', latencyMicroseconds: 35, detail: 'Strips outer UDP header and forwards inner packet to cbr0/bridge.' },
      { step: 6, location: 'Pod B (Namespace)', action: 'Packet arrives at target Pod socket receive queue', latencyMicroseconds: 20, detail: 'Kernel delivers payload to listening container process.' },
    ],
  },
  {
    id: 'ebpf-cilium-flow',
    title: 'Cilium eBPF Socket-Layer Bypass',
    solutionType: 'Cilium eBPF',
    description: 'High-speed packet path using kernel sockops BPF maps, bypassing netfilter and physical encapsulation where possible.',
    steps: [
      { step: 1, location: 'Pod A (Socket)', action: 'Application calls write() on TCP socket', latencyMicroseconds: 8, detail: 'eBPF sockops program hook intercepts write at the socket layer directly.' },
      { step: 2, location: 'eBPF Hash Map', action: 'Constant-time O(1) BPF map service resolution', latencyMicroseconds: 12, detail: 'ClusterIP resolved to endpoint in 12 nanoseconds without iptables.' },
      { step: 3, location: 'Linux Kernel tc Hook', action: 'Direct host routing / WireGuard kernel crypto', latencyMicroseconds: 18, detail: 'Routes packet straight to physical interface; optional kernel WireGuard.' },
      { step: 4, location: 'Physical Wire', action: 'Direct unencapsulated IP packet transmission', latencyMicroseconds: 110, detail: 'Reaches destination node without VXLAN MTU penalties.' },
      { step: 5, location: 'Node B eBPF Ingress', action: 'eBPF tc ingress hook inspects packet & updates Hubble telemetry', latencyMicroseconds: 14, detail: 'Extracts L4 flow metrics into BPF perf ring buffer without copying.' },
      { step: 6, location: 'Pod B (Socket)', action: 'Direct sock_hash redirect into destination pod socket', latencyMicroseconds: 10, detail: 'Bypasses standard TCP receive queue logic for local delivery.' },
    ],
  },
  {
    id: 'istio-sidecar-flow',
    title: 'Istio Envoy Sidecar Proxy Interception',
    solutionType: 'Istio (Classic Sidecar)',
    description: 'Packet path with iptables redirection through user-space Envoy proxy for mTLS encryption and telemetry.',
    steps: [
      { step: 1, location: 'App Container', action: 'Sends HTTP request to http://backend-service:8080', latencyMicroseconds: 20, detail: 'Intends to connect directly to upstream service.' },
      { step: 2, location: 'Pod iptables PREROUTING', action: 'Redirects packet to port 15001 (Envoy listener)', latencyMicroseconds: 45, detail: 'Configured by istio-init container during pod startup.' },
      { step: 3, location: 'Client Envoy Proxy', action: 'L7 inspection, mTLS handshake, SPIFFE certificate injection', latencyMicroseconds: 850, detail: 'User-space context switch; establishes TLSv1.3 tunnel and starts tracing span.' },
      { step: 4, location: 'Host Network & Wire', action: 'Encrypted TLS TCP stream travels across cluster nodes', latencyMicroseconds: 220, detail: 'Wire-encrypted payload arrives at target node.' },
      { step: 5, location: 'Server Envoy Proxy', action: 'Ingress intercept on port 15006, decrypts TLS, evaluates AuthorizationPolicy', latencyMicroseconds: 780, detail: 'Validates client SPIFFE identity against JWT and RBAC policies.' },
      { step: 6, location: 'Backend Container', action: 'Decrypted plain HTTP request delivered to localhost', latencyMicroseconds: 30, detail: 'Backend processes request and begins generating response.' },
    ],
  },
];
