import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Terminal,
  Play,
  Pause,
  Trash2,
  Download,
  Search,
  Filter,
  Copy,
  Check,
  Flame,
  AlertTriangle,
  Send,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Sliders,
  Layers,
  Activity,
  ArrowDownCircle,
  ExternalLink,
} from 'lucide-react';
import { K8sProject, LogEntry, LogLevel } from '../types';
import {
  generateInitialLogs,
  generateSimulatedLog,
  generateErrorSpikeLogs,
  LOGQL_PRESETS,
  LogQLPreset,
} from '../data/logExplorerData';

interface AggregatedLogExplorerProps {
  project: K8sProject;
  onOpenAnomalyReport?: (findingId?: string) => void;
  onExecuteInTerminal?: (cmd: string) => void;
}

export const AggregatedLogExplorer: React.FC<AggregatedLogExplorerProps> = ({
  project,
  onOpenAnomalyReport,
  onExecuteInTerminal,
}) => {
  // Logs buffer
  const [logs, setLogs] = useState<LogEntry[]>(() => generateInitialLogs(project, 40));
  
  // Streaming state
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [streamingSpeed, setStreamingSpeed] = useState<number>(2000); // 2 seconds
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Filters & Search
  const [selectedComponent, setSelectedComponent] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLogQL, setActiveLogQL] = useState<string>('{app=~".*"}');
  
  // Detail expansion & copy
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive if enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Live streaming timer
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLog = generateSimulatedLog(project, undefined, selectedComponent);
        // Keep max 150 entries in rolling memory buffer
        const updated = [...prev, newLog];
        if (updated.length > 150) {
          return updated.slice(updated.length - 150);
        }
        return updated;
      });
    }, streamingSpeed);

    return () => clearInterval(interval);
  }, [isLiveStreaming, streamingSpeed, project, selectedComponent]);

  // Reset or regenerate when project changes
  useEffect(() => {
    setLogs(generateInitialLogs(project, 40));
    setExpandedLogId(null);
  }, [project.id]);

  // Extract component options
  const componentOptions = useMemo(() => {
    const fromTopology = project.topology.nodes.map((n) => n.id);
    const fromLogs = logs.map((l) => l.component);
    const set = new Set([...fromTopology, ...fromLogs]);
    return ['All', ...Array.from(set)];
  }, [project, logs]);

  // Handle Injecting Error Spike
  const handleTriggerErrorSpike = () => {
    const burst = generateErrorSpikeLogs(project, selectedComponent);
    setLogs((prev) => [...prev, ...burst]);
  };

  // Copy helper
  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export logs to download
  const handleExportLogs = (format: 'txt' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let ext = 'log';

    if (format === 'json') {
      content = JSON.stringify(logs, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      content = logs
        .map(
          (l) =>
            `${l.timestamp} [${l.level}] [${l.namespace}/${l.podName}] (${l.caller || 'main'}): ${l.message}`
        )
        .join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k8s-aggregated-logs-${project.id}-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply LogQL Preset
  const handleApplyPreset = (preset: LogQLPreset) => {
    setActiveLogQL(preset.query);
    if (preset.name === 'All Errors & Panics') {
      setSelectedLevel('ERROR_FATAL');
      setSearchQuery('');
    } else if (preset.name === 'Connection Refused & 5xx') {
      setSelectedLevel('ALL');
      setSearchQuery('connection refused');
    } else if (preset.name === 'Timeouts & Deadlines') {
      setSelectedLevel('ALL');
      setSearchQuery('timeout');
    } else if (preset.name === 'OOM & Memory Pressure') {
      setSelectedLevel('ALL');
      setSearchQuery('OOM');
    } else if (preset.name === 'Certificates & mTLS') {
      setSelectedLevel('ALL');
      setSearchQuery('TLS');
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Component filter
      if (selectedComponent !== 'All' && log.component !== selectedComponent) {
        return false;
      }

      // Level filter
      if (selectedLevel === 'ERROR_FATAL') {
        if (log.level !== 'ERROR' && log.level !== 'FATAL') return false;
      } else if (selectedLevel !== 'ALL' && log.level !== selectedLevel) {
        return false;
      }

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          log.message.toLowerCase().includes(q) ||
          log.podName.toLowerCase().includes(q) ||
          log.namespace.toLowerCase().includes(q) ||
          (log.caller && log.caller.toLowerCase().includes(q)) ||
          (log.traceId && log.traceId.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [logs, selectedComponent, selectedLevel, searchQuery]);

  // Calculate volume breakdown for sparkline histogram
  const { totalCount, errorCount, warnCount, infoCount } = useMemo(() => {
    let err = 0;
    let warn = 0;
    let info = 0;
    logs.forEach((l) => {
      if (l.level === 'ERROR' || l.level === 'FATAL') err++;
      else if (l.level === 'WARN') warn++;
      else info++;
    });
    return {
      totalCount: logs.length,
      errorCount: err,
      warnCount: warn,
      infoCount: info,
    };
  }, [logs]);

  // Compute 12 bucket histogram
  const histogramBuckets = useMemo(() => {
    const bucketsCount = 12;
    const initialBuckets = Array.from({ length: bucketsCount }, () => ({
      total: 0,
      errors: 0,
      warns: 0,
      info: 0,
      heightPercent: 0,
      errorPercent: 0,
      warnPercent: 0,
      infoPercent: 0,
    }));

    if (logs.length === 0) return initialBuckets;

    const rawBuckets = Array.from({ length: bucketsCount }, () => ({
      total: 0,
      errors: 0,
      warns: 0,
      info: 0,
    }));

    const sliceSize = Math.max(1, Math.ceil(logs.length / bucketsCount));
    logs.forEach((log, idx) => {
      const bIdx = Math.min(bucketsCount - 1, Math.floor(idx / sliceSize));
      rawBuckets[bIdx].total += 1;
      if (log.level === 'ERROR' || log.level === 'FATAL') rawBuckets[bIdx].errors += 1;
      else if (log.level === 'WARN') rawBuckets[bIdx].warns += 1;
      else rawBuckets[bIdx].info += 1;
    });

    const maxBucketTotal = Math.max(...rawBuckets.map((b) => b.total), 1);
    return rawBuckets.map((b) => ({
      ...b,
      heightPercent: Math.round((b.total / maxBucketTotal) * 100),
      errorPercent: b.total > 0 ? (b.errors / b.total) * 100 : 0,
      warnPercent: b.total > 0 ? (b.warns / b.total) * 100 : 0,
      infoPercent: b.total > 0 ? (b.info / b.total) * 100 : 0,
    }));
  }, [logs]);

  return (
    <div className="space-y-4 flex flex-col h-full font-sans">
      
      {/* Top Loki / Kibana Explore Header */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3.5">
        
        {/* Title, Live Tail Status & Streaming Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Aggregated Log Explorer (Grafana Loki & Kibana Engine)
                </h3>
                {isLiveStreaming ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    LIVE TAILING
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Streaming distributed logs across pods, daemonsets, and control-plane controllers for{' '}
                <span className="text-slate-200 font-semibold">{project.title.split(':')[0]}</span>.
              </p>
            </div>
          </div>

          {/* Live Stream Play / Pause & Spike Injector */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                isLiveStreaming
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400'
              }`}
            >
              {isLiveStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume Live Tail</span>
                </>
              )}
            </button>

            {/* Simulate Error Spike Button */}
            <button
              onClick={handleTriggerErrorSpike}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 rounded transition-colors cursor-pointer"
              title="Inject realistic cluster error surge (OOM, Connection Refused, Timeout)"
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Error Spike</span>
            </button>

            {/* Clear stream */}
            <button
              onClick={() => setLogs([])}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
              title="Clear log buffer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Export format dropdown */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded text-xs font-mono">
              <button
                onClick={() => handleExportLogs('txt')}
                className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download .log text file"
              >
                .log
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={() => handleExportLogs('json')}
                className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download JSON structured logs"
              >
                .json
              </button>
            </div>
          </div>
        </div>

        {/* LogQL Query Bar (Grafana Loki Style) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              LogQL Query:
            </span>
            <div className="relative flex-1">
              <input
                type="text"
                value={activeLogQL}
                onChange={(e) => setActiveLogQL(e.target.value)}
                placeholder='{app="cilium-agent"} |= "error"'
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={() => {
                // Apply logql text filter to search query
                const match = activeLogQL.match(/\|=\s*"([^"]+)"/);
                if (match) setSearchQuery(match[1]);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
            >
              Run Query
            </button>
          </div>

          {/* Quick Filter Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] text-slate-500 font-mono shrink-0">Presets:</span>
            {LOGQL_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleApplyPreset(p)}
                className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 whitespace-nowrap transition-colors cursor-pointer"
                title={p.description}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Toolbar: Component Selector, Level Pills & Search Text */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          
          {/* Component Dropdown */}
          <div className="sm:col-span-4 flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 font-mono shrink-0">Target:</span>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            >
              {componentOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-slate-900 text-slate-200">
                  {opt === 'All' ? 'All Infrastructure Components' : opt}
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter Pills */}
          <div className="sm:col-span-5 flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'ERROR_FATAL', label: 'ERR & FATAL', count: errorCount, isAlert: errorCount > 0 },
              { id: 'WARN', label: 'WARN', count: warnCount },
              { id: 'INFO', label: 'INFO', count: infoCount },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  selectedLevel === lvl.id
                    ? lvl.id === 'ERROR_FATAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold'
                      : lvl.id === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{lvl.label}</span>
                {lvl.count !== undefined && (
                  <span
                    className={`text-[10px] px-1 rounded ${
                      lvl.isAlert ? 'bg-rose-500/30 text-rose-300 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {lvl.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="sm:col-span-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter text, trace ID..."
              className="w-full pl-7 pr-2.5 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>

        {/* Time-Series Log Volume Sparkline Bar Chart (Loki/Kibana Top Panel) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Log Volume Timeline Distribution</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-semibold">{totalCount} buffered logs</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-xs bg-emerald-400" /> Info
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-xs bg-amber-400" /> Warn
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-xs bg-rose-400" /> Error/Fatal ({errorCount})
              </span>
            </div>
          </div>

          {/* Mini Stacked Histogram Bars */}
          <div className="h-9 bg-slate-900/60 border border-slate-850 rounded p-1 flex items-end gap-1">
            {histogramBuckets.map((bucket, i) => (
              <div
                key={i}
                className="flex-1 h-full flex flex-col justify-end gap-0.5 group relative"
              >
                {/* Error segment */}
                {bucket.errors > 0 && (
                  <div
                    className="w-full bg-rose-500 rounded-t-xs"
                    style={{ height: `${Math.max(4, (bucket.errors / (bucket.total || 1)) * bucket.heightPercent)}%` }}
                  />
                )}
                {/* Warn segment */}
                {bucket.warns > 0 && (
                  <div
                    className="w-full bg-amber-400"
                    style={{ height: `${Math.max(3, (bucket.warns / (bucket.total || 1)) * bucket.heightPercent)}%` }}
                  />
                )}
                {/* Info segment */}
                {bucket.info > 0 && (
                  <div
                    className="w-full bg-cyan-500/70 rounded-b-xs"
                    style={{ height: `${Math.max(3, (bucket.info / (bucket.total || 1)) * bucket.heightPercent)}%` }}
                  />
                )}

                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20 px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] font-mono rounded text-slate-200 whitespace-nowrap shadow-lg">
                  {bucket.total} logs (Errors: {bucket.errors})
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Streaming Console Options Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
        <div className="flex items-center gap-3">
          <span>Showing {filteredLogs.length} matching events</span>
          {errorCount > 0 && (
            <span className="text-rose-400 font-semibold">
              ● {errorCount} errors detected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Stream cadence selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Tail Rate:</span>
            {[1000, 2000, 4000].map((rate) => (
              <button
                key={rate}
                onClick={() => setStreamingSpeed(rate)}
                className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer ${
                  streamingSpeed === rate
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {rate / 1000}s
              </button>
            ))}
          </div>

          {/* Autoscroll toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-400 focus:ring-0 w-3 h-3 cursor-pointer"
            />
            <span className="text-[11px]">Pin to Bottom (tail -f)</span>
          </label>
        </div>
      </div>

      {/* Real-Time Log Stream Viewer (Monospace Dark Console) */}
      <div
        ref={logContainerRef}
        className="flex-1 min-h-[380px] max-h-[520px] bg-slate-950 border border-slate-800 rounded-lg overflow-y-auto p-2 font-mono text-xs leading-relaxed space-y-1 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No log entries match the current filter criteria or search query.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const isError = log.level === 'ERROR' || log.level === 'FATAL';
            const isWarn = log.level === 'WARN';

            return (
              <div
                key={log.id}
                className={`group rounded border transition-colors ${
                  isExpanded
                    ? 'border-cyan-500/40 bg-slate-900/60'
                    : isError
                    ? 'border-rose-950/60 bg-rose-950/10 hover:bg-rose-950/20'
                    : isWarn
                    ? 'border-amber-950/50 bg-amber-950/5 hover:bg-amber-950/15'
                    : 'border-transparent hover:border-slate-800 hover:bg-slate-900/40'
                }`}
              >
                {/* Single Log Line Row */}
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="px-2.5 py-1.5 flex items-start gap-2 cursor-pointer"
                >
                  {/* Expand Chevron */}
                  <span className="text-slate-600 group-hover:text-slate-400 shrink-0 mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>

                  {/* Timestamp */}
                  <span className="text-slate-500 shrink-0 select-none text-[11px] tabular-nums">
                    {log.timestamp.substring(11, 23)}
                  </span>

                  {/* Log Level Badge */}
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 uppercase tracking-wide ${
                      log.level === 'FATAL'
                        ? 'bg-red-950/90 text-red-300 border border-red-500/60'
                        : log.level === 'ERROR'
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                        : log.level === 'WARN'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : log.level === 'INFO'
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {log.level}
                  </span>

                  {/* Component / Pod Label */}
                  <span className="text-cyan-400 shrink-0 text-[11px]">
                    [{log.namespace}/{log.component}]
                  </span>

                  {/* Log Message */}
                  <span
                    className={`break-all flex-1 ${
                      isError
                        ? 'text-rose-200 font-medium'
                        : isWarn
                        ? 'text-amber-200'
                        : 'text-slate-300'
                    }`}
                  >
                    {log.message}
                  </span>

                  {/* HTTP Status or duration if present */}
                  {log.httpStatus && (
                    <span
                      className={`text-[10px] px-1 rounded shrink-0 font-bold ${
                        log.httpStatus >= 500
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {log.httpStatus}
                    </span>
                  )}
                </div>

                {/* Expanded Structured JSON Drawer */}
                {isExpanded && (
                  <div className="px-8 pb-3 pt-1 border-t border-slate-900 bg-slate-950/90 space-y-2 text-xs">
                    
                    {/* Metadata Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-3">
                        <span>
                          Pod: <span className="text-slate-200">{log.podName}</span>
                        </span>
                        {log.caller && (
                          <span>
                            Caller: <span className="text-cyan-300">{log.caller}</span>
                          </span>
                        )}
                        {log.durationMs && (
                          <span>
                            Duration: <span className="text-amber-300">{log.durationMs}ms</span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {log.traceId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(`trace-${log.id}`, log.traceId!);
                            }}
                            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 cursor-pointer"
                          >
                            {copiedKey === `trace-${log.id}` ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                            <span>Trace: {log.traceId.substring(0, 8)}...</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(`raw-${log.id}`, JSON.stringify(log.rawJson || log, null, 2));
                          }}
                          className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                        >
                          {copiedKey === `raw-${log.id}` ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                          <span>Copy JSON</span>
                        </button>

                        {/* Escalate button for errors */}
                        {isError && onOpenAnomalyReport && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAnomalyReport(log.id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 px-2.5 py-0.5 rounded cursor-pointer"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Dispatch Log to IT Admin</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formatted JSON Payload */}
                    <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 text-[11px] overflow-x-auto max-h-48 text-slate-300">
                      <pre>{JSON.stringify(log.rawJson || log, null, 2)}</pre>
                    </div>

                    {/* Stack Trace if available */}
                    {log.rawJson?.stack_trace && (
                      <div className="p-2 bg-rose-950/30 border border-rose-900/40 rounded text-[11px] text-rose-300">
                        <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">
                          Stack Trace
                        </div>
                        <pre className="overflow-x-auto whitespace-pre leading-tight">
                          {log.rawJson.stack_trace}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span>Engine: Grafana Loki v3.0 Promtail Ingestion</span>
          <span>·</span>
          <span>Buffer: Rolling 150 In-Memory Spans</span>
        </div>
        <div className="text-slate-400">
          Tip: Click any log line to inspect structured JSON, caller traces, and stacktraces.
        </div>
      </div>

    </div>
  );
};
