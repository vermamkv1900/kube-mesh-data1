import React, { useState } from 'react';
import { X, Send, AlertTriangle, CheckCircle, ShieldAlert, Terminal, Mail, Users, FileText, Check, Copy } from 'lucide-react';
import { DETECTED_ANOMALIES, AnomalyFinding } from '../data/heatMapData';

interface AnomalyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnomalyId?: string;
}

export const AnomalyReportModal: React.FC<AnomalyReportModalProps> = ({
  isOpen,
  onClose,
  initialAnomalyId,
}) => {
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string>(
    initialAnomalyId || DETECTED_ANOMALIES[0].id
  );
  const [itAdminEmail, setItAdminEmail] = useState<string>('protonchip@gmail.com');
  const [distributionList, setDistributionList] = useState<string>(
    'sre-oncall-dl@company.internal, k8s-platform-admins@company.internal'
  );
  const [pagerDutyIntegration, setPagerDutyIntegration] = useState<boolean>(true);
  const [slackWebhookIntegration, setSlackWebhookIntegration] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sentReport, setSentReport] = useState<{ ticketId: string; timestamp: string } | null>(null);

  if (!isOpen) return null;

  const currentAnomaly: AnomalyFinding =
    DETECTED_ANOMALIES.find((a) => a.id === selectedAnomalyId) || DETECTED_ANOMALIES[0];

  const handleSendReport = () => {
    setIsSending(true);
    setTimeout(() => {
      const ticketId = `INC-${Math.floor(100000 + Math.random() * 900000)}`;
      const timestamp = new Date().toISOString();
      setSentReport({ ticketId, timestamp });
      setIsSending(false);
    }, 1200);
  };

  const handleReset = () => {
    setSentReport(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Infrastructure Anomaly Dispatcher & SRE Report
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Notify IT Admin and SRE Distribution Lists with telemetry diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {sentReport ? (
            /* Successful Delivery Receipt */
            <div className="p-8 text-center space-y-4 bg-slate-950 border border-emerald-500/40 rounded-xl">
              <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-white">
                Detailed Incident Report Dispatched Successfully
              </h4>
              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                Incident ticket <span className="font-mono text-cyan-300 font-bold">{sentReport.ticketId}</span> has been dispatched to IT Admin (<span className="text-white font-mono">{itAdminEmail}</span>) and the Distribution List (<span className="text-white font-mono">{distributionList}</span>).
              </p>

              <div className="p-4 bg-slate-900 border border-slate-850 rounded-lg text-left text-xs font-mono text-slate-300 max-w-xl mx-auto space-y-2">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-500">Dispatch Status:</span>
                  <span className="text-emerald-400 font-bold">DELIVERED (200 OK)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="tabular-nums">{sentReport.timestamp}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-500">PagerDuty P1 Alert:</span>
                  <span className="text-cyan-400">{pagerDutyIntegration ? 'Triggered' : 'Skipped'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Slack Webhook (#k8s-platform-incidents):</span>
                  <span className="text-cyan-400">{slackWebhookIntegration ? 'Dispatched' : 'Skipped'}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                >
                  Report Another Finding
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Select Active Anomaly */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                  1. Select Infrastructure Anomaly Finding ({DETECTED_ANOMALIES.length} Active)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {DETECTED_ANOMALIES.map((anomaly) => {
                    const isSelected = selectedAnomalyId === anomaly.id;
                    const isCrit = anomaly.severity === 'Critical';

                    return (
                      <button
                        key={anomaly.id}
                        onClick={() => setSelectedAnomalyId(anomaly.id)}
                        className={`p-3 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/40 border-rose-500/70 ring-1 ring-rose-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                          <span className={isCrit ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                            [{anomaly.severity}]
                          </span>
                          <span className="text-slate-500">{anomaly.resourceKind}</span>
                        </div>
                        <div className="text-xs font-bold text-white line-clamp-1 mb-1">
                          {anomaly.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {anomaly.affectedResource}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notification Targets (IT Admin & Distribution List) */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono pb-2 border-b border-slate-850">
                  2. Recipient Targets (IT Admin & Distribution List)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {/* IT Admin Email */}
                  <div>
                    <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>IT Administrator Direct Email</span>
                    </label>
                    <input
                      type="email"
                      value={itAdminEmail}
                      onChange={(e) => setItAdminEmail(e.target.value)}
                      placeholder="it-admin@enterprise.internal"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Distribution List (DL) */}
                  <div>
                    <label className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>Distribution List (DL) Recipients</span>
                    </label>
                    <input
                      type="text"
                      value={distributionList}
                      onChange={(e) => setDistributionList(e.target.value)}
                      placeholder="sre-alerts@company.internal, ops-leads-dl@company.internal"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Integration Checkboxes */}
                <div className="flex flex-wrap items-center gap-5 pt-2 text-xs font-mono text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pagerDutyIntegration}
                      onChange={(e) => setPagerDutyIntegration(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Trigger PagerDuty High-Priority Incident</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={slackWebhookIntegration}
                      onChange={(e) => setSlackWebhookIntegration(e.target.checked)}
                      className="accent-cyan-400 rounded"
                    />
                    <span>Broadcast to #k8s-platform-incidents Slack Channel</span>
                  </label>
                </div>
              </div>

              {/* Detailed Findings & Diagnostic Report Preview */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-slate-400 uppercase font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Report Preview: SRE Detailed Findings & Diagnostics</span>
                  </span>
                  <span className="text-rose-400 font-bold uppercase">
                    [{currentAnomaly.severity} ANOMALY REPORT]
                  </span>
                </div>

                {/* Summary & Affected Resource */}
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white font-sans">{currentAnomaly.title}</div>
                  <div className="text-slate-400">
                    Target: <span className="text-cyan-300">{currentAnomaly.affectedResource}</span> ({currentAnomaly.resourceKind}) on cluster <span className="text-slate-200">{currentAnomaly.cluster}</span> ({currentAnomaly.region})
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans mt-1">
                    {currentAnomaly.summary}
                  </p>
                </div>

                {/* Root Cause Analysis (RCA) */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                  <span className="text-amber-400 font-semibold block mb-1">Root Cause Analysis (RCA):</span>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    {currentAnomaly.rootCauseAnalysis}
                  </p>
                </div>

                {/* Telemetry Evidence Proof */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1.5">
                  <span className="text-cyan-400 font-semibold block">Diagnostic Telemetry Evidence:</span>
                  <div className="text-[11px] text-slate-300 overflow-x-auto">
                    <span className="text-slate-500">PromQL:</span> {currentAnomaly.telemetryEvidence.promql}
                  </div>
                  <div className="text-[11px] text-rose-300 overflow-x-auto bg-slate-950 p-2 rounded">
                    {currentAnomaly.telemetryEvidence.logSnippet}
                  </div>
                </div>

                {/* Recommended Remediation Runbook */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                  <span className="text-emerald-400 font-semibold block mb-1">Actionable SRE Remediation Runbook:</span>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    {currentAnomaly.recommendedRemediation}
                  </p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Action Footer */}
        {!sentReport && (
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">
              Recipients: 1 IT Admin + DL Group
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSending || !itAdminEmail}
                onClick={handleSendReport}
                className="flex items-center gap-2 px-4 py-1.5 font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 disabled:opacity-50 rounded transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Dispatching...' : 'Send Detailed Anomaly Report'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
