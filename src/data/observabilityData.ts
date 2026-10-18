import { ObservabilityTool } from '../types';

export const OBSERVABILITY_TOOLS: ObservabilityTool[] = [
  // Monitoring
  {
    id: 'prometheus',
    name: 'Prometheus & Prometheus Operator',
    pillar: 'Monitoring',
    primaryFunction: 'Time-series metric collection, PromQL evaluation, and rule-based alerting engine.',
    architecture: 'Pull-based metric scraper that queries `/metrics` HTTP endpoints on pods, nodes, and ingress controllers at regular scrape intervals (e.g. 15s). Uses local on-disk TSDB (Time Series Database).',
    storageBackend: 'Local node disk TSDB (Write-Ahead-Log + 2-hour chunk blocks). Federated long-term storage via Thanos or Mimir.',
    keyFeatures: [
      'Kubernetes-native service discovery via ServiceMonitor and PodMonitor custom resources.',
      'PromQL (Prometheus Query Language) for vector math, quantiles (P90/P99), rates, and SLO calculations.',
      'Alertmanager handles alert grouping, deduplication, silences, and routing to PagerDuty/Slack.',
      'Self-contained architecture with zero external database dependencies for basic deployments.',
    ],
    tradeoffsAndLimitations: [
      'Single instance TSDB does not scale horizontally out of the box (requires federated tools like Thanos, Cortex, or Mimir for multi-year retention).',
      'High cardinality metrics (e.g. user_id or IP in labels) can cause severe memory bloat and OOMKills.',
      'Pull model requires network routability from Prometheus server to all target pods.',
    ],
    k8sIntegrationPattern: 'Deployed via kube-prometheus-stack Helm chart or Prometheus-Operator with automated CRDs.',
    exampleQueryOrConfig: {
      language: 'PromQL',
      sample: `# 99th percentile request latency over last 5 minutes by service
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))`,
    },
  },
  {
    id: 'grafana',
    name: 'Grafana Unified Visualization & Alerting',
    pillar: 'Monitoring',
    primaryFunction: 'Composable observability dashboards, multi-source telemetry correlation, and unified alerting interface.',
    architecture: 'Stateless web application and query proxy that connects to Prometheus, Loki, Tempo, CloudWatch, and SQL engines to render interactive dashboards and alerts.',
    storageBackend: 'Relational database for dashboard definitions and users (Postgres/MySQL/SQLite).',
    keyFeatures: [
      'Single pane of glass uniting Metrics (Prometheus), Logs (Loki), and Traces (Tempo/Jaeger).',
      'Data Links enabling 1-click jumps from a metric graph point directly into matching logs or traces.',
      'Canvas, Geomap, Heatmap, Node Graph, and Flamegraph visual panels.',
      'Unified Alerting engine capable of evaluating multi-source rules and managing on-call schedules.',
    ],
    tradeoffsAndLimitations: [
      'Does not store telemetry data itself; depends entirely on backend data sources for performance.',
      'Complex dashboard JSON schemas require GitOps automation (Grafana Operator) to avoid manual drift.',
    ],
    k8sIntegrationPattern: 'Deployed alongside Prometheus; dashboards provisioned declaratively via ConfigMaps.',
    exampleQueryOrConfig: {
      language: 'Grafana Dashboard Spec',
      sample: `fieldConfig:
  defaults:
    unit: "s"
    custom:
      drawStyle: "line"
      lineInterpolation: "smooth"
      fillOpacity: 15`,
    },
  },
  {
    id: 'mimir',
    name: 'Grafana Mimir / Thanos',
    pillar: 'Monitoring',
    primaryFunction: 'Horizontally scalable, long-term multi-tenant time series database for Prometheus metrics.',
    architecture: 'Microservices architecture (Distributor, Ingester, Querier, Store-Gateway, Compactor) providing high availability and global PromQL query aggregation across dozens of Kubernetes clusters.',
    storageBackend: 'Cloud Object Storage (AWS S3, Google Cloud Storage, Azure Blob Storage, or MinIO).',
    keyFeatures: [
      'Massive horizontal scalability capable of handling 100M+ active metric time-series.',
      'Cost efficiency: 90% cheaper storage costs by storing compacted historical blocks in S3 rather than expensive EBS/NVMe.',
      'Built-in multi-tenancy with isolated metric namespaces and strict tenant limits.',
      'Full drop-in PromQL compatibility with zero modification to Grafana dashboards.',
    ],
    tradeoffsAndLimitations: [
      'Complex distributed system with 6+ microservices requiring dedicated Kubernetes platform expertise to operate.',
      'Higher baseline infrastructure resource requirement than standalone Prometheus for small clusters.',
    ],
    k8sIntegrationPattern: 'Prometheus clusters use `remote_write` to push metrics into Mimir Distributors in real-time.',
    exampleQueryOrConfig: {
      language: 'Prometheus Config',
      sample: `remote_write:
  - url: "http://mimir-distributor.monitoring.svc:8080/api/v1/push"
    queue_config:
      max_samples_per_send: 10000
      max_shards: 50`,
    },
  },

  // Logging
  {
    id: 'loki',
    name: 'Grafana Loki',
    pillar: 'Logging',
    primaryFunction: 'Cost-effective, horizontally scalable log aggregation system inspired by Prometheus design principles.',
    architecture: 'Indexes only metadata labels (namespace, pod, container, app) rather than full-text indexing the log contents. The log streams are compressed into chunks and stored directly in object storage.',
    storageBackend: 'Cloud Object Storage (S3 / GCS) + small index table (boltdb-shipper / TSDB).',
    keyFeatures: [
      'Label consistency: Uses the exact same label schema as Prometheus (`app`, `namespace`, `node`), enabling instant correlation.',
      'Dramatically lower cost: 5x to 10x cheaper to run than Elasticsearch due to zero inverted index overhead.',
      'LogQL allows parsing JSON/logfmt on-the-fly, extracting metrics from logs, and computing rates.',
      'No complex shard management or index lifecycle management (ILM) nightmares.',
    ],
    tradeoffsAndLimitations: [
      'Full-text scans over massive multi-terabyte datasets without label filters can be slower than Elasticsearch.',
      'High cardinality in labels (e.g. putting IP address or UUID in labels) must be strictly avoided; parsed at query time instead.',
    ],
    k8sIntegrationPattern: 'DaemonSet log shipper (Fluent Bit, Promtail, or OTel Collector) streams container logs to Loki.',
    exampleQueryOrConfig: {
      language: 'LogQL',
      sample: `# Filter logs by namespace, parse json, and extract rate of 500 errors
sum(rate({namespace="production", app="auth"} | json | status >= 500 [5m])) by (endpoint)`,
    },
  },
  {
    id: 'efk-stack',
    name: 'EFK Stack (Elasticsearch / OpenSearch + Fluent Bit + Kibana)',
    pillar: 'Logging',
    primaryFunction: 'Enterprise distributed full-text search engine and log analysis platform with rich unstructured searching.',
    architecture: 'Fluent Bit forwards container stdout to an Elasticsearch/OpenSearch distributed cluster, which creates an inverted Lucene index on every log field. Kibana provides query visualization and analytics.',
    storageBackend: 'Distributed Lucene index stored across stateful local SSD/NVMe data nodes.',
    keyFeatures: [
      'Instant arbitrary full-text keyword searches across petabytes of historical logs.',
      'Rich aggregation framework for statistical analytics, anomaly detection, and complex boolean queries.',
      'Kibana Discover interface is familiar to security analysts and operations teams worldwide.',
      'Extensive ecosystem of plugins, alerting tools, and machine learning anomaly detectors.',
    ],
    tradeoffsAndLimitations: [
      'Heavy resource footprint: requires large JVM heaps (32GB per data node) and high memory allocation.',
      'Storage overhead: Lucene inverted index can be 1.5x to 2x larger than the original raw log volume.',
      'Operational toil: shard rebalancing, split-brain mitigation, and index lifecycle rollover require ongoing maintenance.',
    ],
    k8sIntegrationPattern: 'Elasticsearch Operator (ECK) or OpenSearch Operator provisions StatefulSets with NVMe PVCs.',
    exampleQueryOrConfig: {
      language: 'Elasticsearch Query DSL',
      sample: `{
  "query": {
    "bool": {
      "must": [
        { "match": { "kubernetes.container_name": "payment-api" } },
        { "range": { "http.response.status_code": { "gte": 500 } } }
      ]
    }
  }
}`,
    },
  },

  // Tracing
  {
    id: 'tempo',
    name: 'Grafana Tempo',
    pillar: 'Tracing',
    primaryFunction: 'Massively scalable, cost-efficient distributed tracing backend requiring no index for spans.',
    architecture: 'Ingests traces via OpenTelemetry, Jaeger, or Zipkin protocols. Groups spans by TraceID, batches them into compressed Apache Parquet blocks, and flushes them directly to object storage.',
    storageBackend: '100% Cloud Object Storage (S3, GCS, Azure Blob, MinIO). Zero database dependencies.',
    keyFeatures: [
      'Unmatched cost efficiency: stores traces orders of magnitude cheaper than Elasticsearch-backed tracing systems.',
      'Seamless deep-linking: jump directly from a Grafana Loki log line containing a `traceID` to the full Tempo flamegraph.',
      'Tempo Search and TraceQL allow querying spans by duration, status code, and HTTP route without external indices.',
      'Generates service dependency graphs and metric rates (RED metrics: Rate, Errors, Duration) directly from trace data.',
    ],
    tradeoffsAndLimitations: [
      'Searching for arbitrary tags across billions of historical spans is slower without TraceQL search indexes.',
      'Best suited when paired with structured logs (Loki) that provide the entrypoint TraceID.',
    ],
    k8sIntegrationPattern: 'Receives OTLP traces directly from an OpenTelemetry Collector Gateway pool.',
    exampleQueryOrConfig: {
      language: 'TraceQL',
      sample: `# Find traces where database call took longer than 1 second in checkout flow
{ span.service.name = "checkout-service" && span.db.statement =~ ".*SELECT.*" && duration > 1s }`,
    },
  },
  {
    id: 'jaeger',
    name: 'Jaeger Tracing (CNCF Graduated)',
    pillar: 'Tracing',
    primaryFunction: 'End-to-end distributed tracing system for microservices monitoring, root-cause analysis, and latency profiling.',
    architecture: 'Applications push spans to Jaeger Agent/Collector via OpenTelemetry SDK. Jaeger Collector parses spans, applies adaptive sampling, and writes to a storage backend.',
    storageBackend: 'Elasticsearch, OpenSearch, Apache Cassandra, or in-memory (testing).',
    keyFeatures: [
      'Native interactive web UI with detailed span waterfall flamegraphs and timeline views.',
      'Adaptive sampling dynamically adjusts sampling rates per endpoint to prevent collector overload during traffic spikes.',
      'Comprehensive service dependency graph generation illustrating service topology.',
      'Native OpenTelemetry format support and backward compatibility with Zipkin.',
    ],
    tradeoffsAndLimitations: [
      'Requires managing and maintaining a separate Elasticsearch or Cassandra cluster for production storage.',
      'Higher infrastructure storage and compute costs compared to object-storage-native Tempo.',
    ],
    k8sIntegrationPattern: 'Jaeger Operator manages Collector deployments, Ingress, and Elasticsearch index cleaner cronjobs.',
    exampleQueryOrConfig: {
      language: 'Jaeger Config',
      sample: `collector:
  options:
    kafka:
      producer:
        topic: jaeger-spans
    es:
      server-urls: "http://elasticsearch:9200"`,
    },
  },
];

export interface CorrelationDemoItem {
  timestamp: string;
  service: string;
  traceId: string;
  httpStatus: number;
  durationMs: number;
  logMessage: string;
  sqlQuery: string;
  promMetric: string;
}

export const CORRELATION_DEMO_ITEMS: CorrelationDemoItem[] = [
  {
    timestamp: '2026-10-18T06:21:44.120Z',
    service: 'checkout-api',
    traceId: '8f7a1b9c4d2e5a6f',
    httpStatus: 504,
    durationMs: 2450,
    logMessage: 'Timeout waiting for database connection from pool after 2000ms. Active connections=100/100.',
    sqlQuery: 'SELECT * FROM orders WHERE user_id = $1 FOR UPDATE',
    promMetric: 'rate(http_requests_total{status="504", service="checkout-api"}[1m]) = 14.8 req/s',
  },
  {
    timestamp: '2026-10-18T06:21:45.310Z',
    service: 'payment-service',
    traceId: '3c1d9e7f8a2b4c6e',
    httpStatus: 502,
    durationMs: 1820,
    logMessage: 'Payment processor upstream connection reset: gateway.stripe.internal TCP EOF.',
    sqlQuery: 'INSERT INTO payment_audit (order_id, status) VALUES ($1, $2)',
    promMetric: 'rate(http_requests_total{status="502", service="payment-service"}[1m]) = 8.2 req/s',
  },
  {
    timestamp: '2026-10-18T06:21:48.880Z',
    service: 'inventory-svc',
    traceId: '5b8e2f1a9c3d4e7a',
    httpStatus: 500,
    durationMs: 1210,
    logMessage: 'Redis read timeout on replica cluster redis-sentinel.storage.svc:6379.',
    sqlQuery: 'HGETALL warehouse_stock:item_9921',
    promMetric: 'rate(http_requests_total{status="500", service="inventory-svc"}[1m]) = 4.1 req/s',
  },
];
