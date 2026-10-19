import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Terminal,
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  K8sProject,
  BenchmarkStandard,
  ComplianceCheckCategory,
  ComplianceStatus,
  ComplianceSeverity,
  ComplianceCheck,
} from '../types';
import {
  getProjectComplianceScorecard,
  AUDIT_SCAN_PHASES,
  AuditScanPhase,
} from '../data/complianceData';

interface ComplianceAuditViewProps {
  project: K8sProject;
  onExecuteInTerminal?: (cmd: string) => void;
  onOpenAnomalyReport?: (findingId?: string) => void;
}

export const ComplianceAuditView: React.FC<ComplianceAuditViewProps> = ({
  project,
  onExecuteInTerminal,
  onOpenAnomalyReport,
}) => {
  const initialScorecard = useMemo(() => getProjectComplianceScorecard(project.id), [project.id]);

  // Filters
  const [selectedStandard, setSelectedStandard] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Live Audit Scanner state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(-1);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditComplete, setAuditComplete] = useState<boolean>(false);
  const [scorecard, setScorecard] = useState(initialScorecard);

  // Run mock audit scan simulation
  const handleStartScan = () => {
    setIsScanning(true);
    setAuditComplete(false);
    setCurrentPhaseIndex(0);
    setScanProgress(5);
    setAuditLogs([
      `[${new Date().toISOString().substring(11, 19)}] INITIALIZING KUBE-BENCH & TRIVY COMPLIANCE AUDIT ENGINE`,
      `[TARGET BLUEPRINT] ${project.title}`,
      `[STANDARDS LOADED] CIS v1.8.0, NSA/CISA v1.2, PCI-DSS v4.0, SOC2 Type II, NIST SP 800-190`,
    ]);

    let phase = 0;
    const interval = setInterval(() => {
      phase += 1;
      if (phase < AUDIT_SCAN_PHASES.length) {
        setCurrentPhaseIndex(phase);
        const curr = AUDIT_SCAN_PHASES[phase];
        setScanProgress(Math.round(((phase + 1) / AUDIT_SCAN_PHASES.length) * 100));
        setAuditLogs((prev) => [
          ...prev,
          `[PHASE ${curr.phase}/6] ${curr.name} -> Target: ${curr.target}`,
          curr.log,
        ]);
      } else {
        clearInterval(interval);
        setCurrentPhaseIndex(-1);
        setScanProgress(100);
        setIsScanning(false);
        setAuditComplete(true);
        setAuditLogs((prev) => [
          ...prev,
          `[COMPLETE] All 6 benchmark phases evaluated. Generated updated compliance scorecard.`,
          `[VERDICT] Score: ${initialScorecard.overallScore}% · Grade: ${initialScorecard.grade} · Passed: ${initialScorecard.passedCount} · Warns: ${initialScorecard.warningCount} · Fails: ${initialScorecard.failedCount}`,
        ]);
        // Refresh scorecard
        setScorecard(getProjectComplianceScorecard(project.id));
      }
    }, 450);
  };

  const handleResetScan = () => {
    setIsScanning(false);
    setCurrentPhaseIndex(-1);
    setScanProgress(0);
    setAuditLogs([]);
    setAuditComplete(false);
    setScorecard(initialScorecard);
  };

  const handleCopySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleExportScorecard = () => {
    const reportContent = `# Kubernetes Infrastructure Compliance Audit Report
**Project Blueprint:** ${project.title} (${project.id})
**Audit Date:** ${new Date().toUTCString()}
**Audit Tools:** ${scorecard.auditTool}
**Overall Compliance Score:** ${scorecard.overallScore}% (Grade: ${scorecard.grade})

---

## Executive Summary
- **Total Checks Evaluated:** ${scorecard.totalChecks}
- **Passed Checks:** ${scorecard.passedCount} (PASS)
- **Warnings / Recommendations:** ${scorecard.warningCount} (WARN)
- **Failed Checks (Action Required):** ${scorecard.failedCount} (FAIL)

---

## Benchmark Standards Breakdown
${scorecard.benchmarkBreakdown
  .map(
    (b) =>
      `- **${b.standard}:** ${b.score}% (${b.passed}/${b.total} checks passed)`
  )
  .join('\n')}

---

## Category Posture Score
${scorecard.categoryScores
  .map(
    (c) =>
      `- **${c.category}:** ${c.score}% (${c.passed}/${c.total} checks passed)`
  )
  .join('\n')}

---

## Detailed Check Findings

${scorecard.checks
  .map(
    (c) => `### [${c.status}] ${c.id}: ${c.title}
- **Standard:** ${c.standard} (${c.section})
- **Category:** ${c.category}
- **Severity:** ${c.severity}
- **Affected Resource:** ${c.affectedResource || 'Cluster-wide'}
- **Rationale:** ${c.rationale}
${c.auditCommand ? `- **Audit Command:** \`${c.auditCommand}\`` : ''}
- **Remediation:**
  \`\`\`${c.remediation.type}
${c.remediation.snippet}
  \`\`\`
`
  )
  .join('\n\n')}

---
*Generated by KubeForge Compliance Audit Engine.*
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-audit-${project.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter checks
  const filteredChecks = useMemo(() => {
    return scorecard.checks.filter((check) => {
      if (selectedStandard !== 'All' && check.standard !== selectedStandard) return false;
      if (selectedCategory !== 'All' && check.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && check.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          check.id.toLowerCase().includes(q) ||
          check.title.toLowerCase().includes(q) ||
          check.description.toLowerCase().includes(q) ||
          (check.affectedResource && check.affectedResource.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [scorecard.checks, selectedStandard, selectedCategory, selectedStatus, searchQuery]);

  // Unique standards & categories
  const standards: string[] = ['All', 'CIS Kubernetes Benchmark', 'NSA & CISA Hardening Guide', 'PCI-DSS v4.0', 'SOC 2 Type II', 'NIST SP 800-190'];
  const categories: string[] = [
    'All',
    'Control Plane & API',
    'Worker Nodes & Kubelet',
    'Pod Security & Admission',
    'Network Policies & Mesh',
    'RBAC & Identity',
    'Secrets & Data Protection',
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Scorecard Summary & Interactive Audit Trigger */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-850">
          
          {/* Title & Architecture Context */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Automated CIS & Regulatory Compliance Audit
                </h3>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {scorecard.grade}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated against CIS Kubernetes Benchmark v1.8.0, NSA/CISA Hardening Guide, and PCI-DSS v4.0.
              </p>
            </div>
          </div>

          {/* Action Buttons: Run Mock Audit & Export Report */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleExportScorecard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Download Compliance Scorecard as Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Scorecard</span>
            </button>

            {isScanning ? (
              <button
                disabled
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400/80 rounded transition-colors"
              >
                <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Auditing ({scanProgress}%)...</span>
              </button>
            ) : (
              <button
                onClick={handleStartScan}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Mock Audit</span>
              </button>
            )}

            {(auditComplete || auditLogs.length > 0) && (
              <button
                onClick={handleResetScan}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
                title="Reset Audit Logs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scorecard Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          {/* Overall Score with Radial Gauge Indicator */}
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-lg flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={scorecard.overallScore >= 90 ? 'text-emerald-400' : scorecard.overallScore >= 75 ? 'text-cyan-400' : 'text-amber-400'}
                  strokeDasharray={`${scorecard.overallScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute font-bold text-xs font-mono text-white">
                {scorecard.overallScore}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Compliance Score</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Grade {scorecard.grade}</span>
              </div>
            </div>
          </div>

          {/* Passed Checks */}
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-lg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Passed Checks</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {scorecard.passedCount} <span className="text-xs text-slate-500 font-normal">/ {scorecard.totalChecks}</span>
              </div>
            </div>
          </div>

          {/* Warnings */}
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-lg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Advisories / Warn</div>
              <div className="text-sm font-bold text-amber-400 font-mono">
                {scorecard.warningCount} <span className="text-xs text-slate-500 font-normal">to review</span>
              </div>
            </div>
          </div>

          {/* Failed Checks */}
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-lg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono uppercase">Violations / Fail</div>
              <div className="text-sm font-bold text-rose-400 font-mono">
                {scorecard.failedCount} <span className="text-xs text-slate-500 font-normal">critical</span>
              </div>
            </div>
          </div>

        </div>

        {/* Live Scan Status Terminal (Shown during/after audit run) */}
        {(isScanning || auditLogs.length > 0) && (
          <div className="mt-3 p-3.5 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-white font-semibold">Live Audit Scan Controller</span>
                {isScanning && (
                  <span className="text-cyan-400 animate-pulse">● Running Phase {currentPhaseIndex + 1}/6...</span>
                )}
                {auditComplete && (
                  <span className="text-emerald-400 font-semibold">✓ Scan Completed Successfully</span>
                )}
              </div>
              <span className="text-slate-500 tabular-nums">{scanProgress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  auditComplete ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            {/* Output log stream */}
            <div className="max-h-36 overflow-y-auto space-y-1 text-slate-300 text-[11px] leading-relaxed pt-1">
              {auditLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span
                    className={
                      log.includes('[COMPLETE]') || log.includes('[VERDICT]')
                        ? 'text-emerald-300 font-bold'
                        : log.includes('PHASE')
                        ? 'text-cyan-300 font-semibold'
                        : 'text-slate-300'
                    }
                  >
                    {log}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Category Breakdown Progress Strip */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
          Compliance Category Posture Breakdown
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scorecard.categoryScores.map((cat) => (
            <div
              key={cat.category}
              onClick={() => setSelectedCategory(selectedCategory === cat.category ? 'All' : cat.category)}
              className={`p-2.5 rounded border transition-colors cursor-pointer ${
                selectedCategory === cat.category
                  ? 'bg-cyan-950/30 border-cyan-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-200 truncate pr-2">{cat.category}</span>
                <span className="font-mono text-cyan-300 font-bold tabular-nums">{cat.score}%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    cat.score === 100
                      ? 'bg-emerald-400'
                      : cat.score >= 80
                      ? 'bg-cyan-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>{cat.passed} of {cat.total} passed</span>
                {cat.passed < cat.total && <span className="text-amber-400">Action items</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark Standard Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          <div className="flex items-center gap-1">
            {standards.map((std) => (
              <button
                key={std}
                onClick={() => setSelectedStandard(std)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  selectedStandard === std
                    ? 'border-cyan-400 text-cyan-300 bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {std === 'All' ? 'All Standards' : std}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Toolbar: Status filter, Category filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          {/* Status selector pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-500 font-mono mr-1">Status:</span>
            {['All', 'PASS', 'WARN', 'FAIL'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap ${
                  selectedStatus === status
                    ? status === 'FAIL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                      : status === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : status === 'PASS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {status === 'All' ? 'All Results' : status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by ID, resource, title..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>
      </div>

      {/* Findings List (Accordion / High-Density Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Displaying {filteredChecks.length} Benchmark Checks</span>
          {selectedCategory !== 'All' && (
            <span className="text-cyan-400">Category: {selectedCategory}</span>
          )}
        </div>

        {filteredChecks.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs">
            No compliance checks match the selected filters.
          </div>
        ) : (
          filteredChecks.map((check) => {
            const isExpanded = expandedCheckId === check.id;
            const isCopied = copiedSnippetId === check.id;

            return (
              <div
                key={check.id}
                className={`bg-slate-950 border rounded-lg transition-colors overflow-hidden ${
                  check.status === 'FAIL'
                    ? 'border-rose-900/60 bg-rose-950/10'
                    : check.status === 'WARN'
                    ? 'border-amber-900/50 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                  className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Status badge */}
                    <span
                      className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded shrink-0 mt-0.5 ${
                        check.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : check.status === 'WARN'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {check.status}
                    </span>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {check.id}
                        </span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {check.standard} ({check.section})
                        </span>
                        <span className="text-xs text-slate-500">·</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                            check.severity === 'Critical'
                              ? 'text-rose-400 bg-rose-950/60'
                              : check.severity === 'High'
                              ? 'text-amber-400 bg-amber-950/60'
                              : 'text-slate-400 bg-slate-900'
                          }`}
                        >
                          {check.severity} Severity
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1">
                        {check.title}
                      </h4>

                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {check.description}
                      </p>

                      {check.affectedResource && (
                        <div className="mt-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span className="text-slate-500">Resource:</span>
                          <span className="text-slate-300">{check.affectedResource}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {check.status === 'FAIL' && onOpenAnomalyReport && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAnomalyReport(check.id);
                        }}
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 rounded transition-colors"
                        title="Dispatch finding to IT Admin"
                      >
                        <Send className="w-3 h-3" />
                        <span>Escalate</span>
                      </button>
                    )}

                    <button
                      className="p-1 text-slate-400 hover:text-white rounded"
                      aria-label={isExpanded ? 'Collapse check' : 'Expand check'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-900 bg-slate-950/70 space-y-3.5">
                    
                    {/* Rationale & Threat Model */}
                    <div className="p-3 bg-slate-900/50 rounded border border-slate-850">
                      <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">
                        Audit Rationale & Threat Mitigated
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {check.rationale}
                      </p>
                    </div>

                    {/* Audit Command (how kube-bench checks this) */}
                    {check.auditCommand && (
                      <div className="p-3 bg-slate-900/50 rounded border border-slate-850">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                            <Terminal className="w-3 h-3 text-cyan-400" />
                            <span>Verification / Audit Command</span>
                          </div>
                          <button
                            onClick={() => handleCopySnippet(`${check.id}-audit`, check.auditCommand!)}
                            className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedSnippetId === `${check.id}-audit` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy</span>
                          </button>
                        </div>
                        <code className="text-xs font-mono text-cyan-300 bg-slate-950 px-2 py-1.5 rounded block overflow-x-auto">
                          {check.auditCommand}
                        </code>
                      </div>
                    )}

                    {/* Remediation Action Box */}
                    <div className="p-3 bg-slate-900/70 rounded border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-mono font-bold text-white uppercase flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Remediation Procedure: {check.remediation.title}</span>
                          <span className="text-slate-500 font-normal">[{check.remediation.type}]</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onExecuteInTerminal && check.remediation.type === 'kubectl' && (
                            <button
                              onClick={() => onExecuteInTerminal(check.remediation.snippet)}
                              className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Execute in Terminal</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleCopySnippet(check.id, check.remediation.snippet)}
                            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{isCopied ? 'Copied' : 'Copy Remediation'}</span>
                          </button>
                        </div>
                      </div>

                      <pre className="p-2.5 bg-slate-950 border border-slate-850 rounded text-xs font-mono text-slate-200 overflow-x-auto max-h-48 leading-relaxed">
                        {check.remediation.snippet}
                      </pre>
                    </div>

                    {/* Escalate button for failed/warning items */}
                    {(check.status === 'FAIL' || check.status === 'WARN') && onOpenAnomalyReport && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-amber-400">
                          Non-compliant item detected. Need immediate SRE triage?
                        </span>
                        <button
                          onClick={() => onOpenAnomalyReport(check.id)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Finding to IT Admin & DL</span>
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
