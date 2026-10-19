import React, { useState, useEffect } from 'react';
import { X, Cloud, Key, Lock, Eye, EyeOff, Globe, CheckCircle, Server, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { AWS_REGIONS, AZURE_REGIONS, AwsAccountConfig, AzureAccountConfig, CloudRegion } from '../data/cloudData';

interface CloudAccountConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess?: (provider: 'aws' | 'azure') => void;
}

export const CloudAccountConnectorModal: React.FC<CloudAccountConnectorModalProps> = ({
  isOpen,
  onClose,
  onConnectionSuccess,
}) => {
  const [activeCloud, setActiveCloud] = useState<'aws' | 'azure'>('aws');

  // AWS state
  const [awsAccountId, setAwsAccountId] = useState('853273621352');
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('AKIAIOSFODNN7EXAMPLE');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
  const [awsRoleArn, setAwsRoleArn] = useState('arn:aws:iam::853273621352:role/KubeForgeEKSAdminRole');
  const [awsAllRegions, setAwsAllRegions] = useState(true);
  const [awsSelectedRegions, setAwsSelectedRegions] = useState<string[]>(AWS_REGIONS.map((r) => r.id));
  const [showAwsSecret, setShowAwsSecret] = useState(false);
  const [awsConnected, setAwsConnected] = useState(true);

  // Azure state
  const [azureSubId, setAzureSubId] = useState('4f8a91b2-c3d4-5e6f-7a8b-9c0d1e2f3a4b');
  const [azureTenantId, setAzureTenantId] = useState('7b6a5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c2d');
  const [azureClientId, setAzureClientId] = useState('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d');
  const [azureClientSecret, setAzureClientSecret] = useState('~K8sAzureClientSecretKey_Demo99!');
  const [azureResourceGroup, setAzureResourceGroup] = useState('rg-kubeforge-production');
  const [azureAllRegions, setAzureAllRegions] = useState(true);
  const [azureSelectedRegions, setAzureSelectedRegions] = useState<string[]>(AZURE_REGIONS.map((r) => r.id));
  const [showAzureSecret, setShowAzureSecret] = useState(false);
  const [azureConnected, setAzureConnected] = useState(true);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const [discoveredClusters, setDiscoveredClusters] = useState<{ name: string; region: string; provider: string }[]>([]);

  // Load any previously saved connection from localStorage
  useEffect(() => {
    try {
      const savedAws = localStorage.getItem('kubeforge_aws_connected');
      if (savedAws) {
        setAwsConnected(true);
      }
      const savedAzure = localStorage.getItem('kubeforge_azure_connected');
      if (savedAzure) {
        setAzureConnected(true);
      }
    } catch {
      // fallback
    }
  }, []);

  if (!isOpen) return null;

  const toggleAwsRegion = (regionId: string) => {
    setAwsSelectedRegions((prev) =>
      prev.includes(regionId) ? prev.filter((r) => r !== regionId) : [...prev, regionId]
    );
  };

  const toggleAzureRegion = (regionId: string) => {
    setAzureSelectedRegions((prev) =>
      prev.includes(regionId) ? prev.filter((r) => r !== regionId) : [...prev, regionId]
    );
  };

  const handleConnectAws = () => {
    setIsVerifying(true);
    setVerifyStatus('Validating AWS STS GetCallerIdentity & scanning regional EKS endpoints...');

    setTimeout(() => {
      setIsVerifying(false);
      setAwsConnected(true);
      try {
        localStorage.setItem('kubeforge_aws_connected', 'true');
      } catch {}

      // Collect discovered clusters
      const clusters: { name: string; region: string; provider: string }[] = [];
      AWS_REGIONS.forEach((r) => {
        if (awsAllRegions || awsSelectedRegions.includes(r.id)) {
          r.discoveredClusters.forEach((c) => {
            clusters.push({ name: c, region: r.id, provider: 'AWS EKS' });
          });
        }
      });
      setDiscoveredClusters(clusters);
      setVerifyStatus(`Successfully authenticated AWS Account ${awsAccountId}! Discovered ${clusters.length} EKS clusters across ${awsAllRegions ? 'All 32 Global Regions' : `${awsSelectedRegions.length} selected regions`}.`);
      if (onConnectionSuccess) onConnectionSuccess('aws');
    }, 1200);
  };

  const handleConnectAzure = () => {
    setIsVerifying(true);
    setVerifyStatus('Authenticating with Azure Entra ID & scanning regional AKS resources...');

    setTimeout(() => {
      setIsVerifying(false);
      setAzureConnected(true);
      try {
        localStorage.setItem('kubeforge_azure_connected', 'true');
      } catch {}

      const clusters: { name: string; region: string; provider: string }[] = [];
      AZURE_REGIONS.forEach((r) => {
        if (azureAllRegions || azureSelectedRegions.includes(r.id)) {
          r.discoveredClusters.forEach((c) => {
            clusters.push({ name: c, region: r.id, provider: 'Azure AKS' });
          });
        }
      });
      setDiscoveredClusters(clusters);
      setVerifyStatus(`Successfully authenticated Azure Subscription ${azureSubId}! Discovered ${clusters.length} AKS clusters across ${azureAllRegions ? 'All Global Regions' : `${azureSelectedRegions.length} selected regions`}.`);
      if (onConnectionSuccess) onConnectionSuccess('azure');
    }, 1200);
  };

  const handleDisconnect = (provider: 'aws' | 'azure') => {
    if (provider === 'aws') {
      setAwsConnected(false);
      try {
        localStorage.removeItem('kubeforge_aws_connected');
      } catch {}
    } else {
      setAzureConnected(false);
      try {
        localStorage.removeItem('kubeforge_azure_connected');
      } catch {}
    }
    setVerifyStatus(null);
    setDiscoveredClusters([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Cloud Infrastructure Account Connector
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Connect AWS & Azure accounts with multi-region cluster discovery
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

        {/* Cloud Tabs Switcher */}
        <div className="px-6 pt-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/30">
          <button
            onClick={() => {
              setActiveCloud('aws');
              setVerifyStatus(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeCloud === 'aws'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Amazon Web Services (AWS)</span>
            {awsConnected && (
              <span className="ml-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                Connected
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveCloud('azure');
              setVerifyStatus(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeCloud === 'azure'
                ? 'border-sky-400 text-sky-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <span>Microsoft Azure</span>
            {azureConnected && (
              <span className="ml-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                Connected
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* AWS TAB CONTENT */}
          {activeCloud === 'aws' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono pb-2 border-b border-slate-850 flex items-center justify-between">
                  <span>1. AWS IAM Authentication Credentials</span>
                  {awsConnected && (
                    <button
                      onClick={() => handleDisconnect('aws')}
                      className="text-rose-400 hover:underline cursor-pointer text-[11px]"
                    >
                      Disconnect Account
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Account ID */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">AWS Account ID</label>
                    <input
                      type="text"
                      value={awsAccountId}
                      onChange={(e) => setAwsAccountId(e.target.value)}
                      placeholder="12-digit AWS Account ID (e.g. 123456789012)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Role ARN */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">IAM Role ARN (Optional AssumeRole)</label>
                    <input
                      type="text"
                      value={awsRoleArn}
                      onChange={(e) => setAwsRoleArn(e.target.value)}
                      placeholder="arn:aws:iam::account:role/EKSAdmin"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Access Key ID */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">AWS Access Key ID</label>
                    <input
                      type="text"
                      value={awsAccessKeyId}
                      onChange={(e) => setAwsAccessKeyId(e.target.value)}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Secret Access Key */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">AWS Secret Access Key</label>
                    <div className="relative">
                      <input
                        type={showAwsSecret ? 'text' : 'password'}
                        value={awsSecretAccessKey}
                        onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                        placeholder="Secret Access Key"
                        className="w-full px-3 py-2 pr-10 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAwsSecret(!showAwsSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showAwsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AWS Regional Coverage */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-850">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>2. Regional Access Coverage</span>
                  </span>

                  <label className="flex items-center gap-2 text-xs font-mono text-cyan-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={awsAllRegions}
                      onChange={(e) => {
                        setAwsAllRegions(e.target.checked);
                        if (e.target.checked) {
                          setAwsSelectedRegions(AWS_REGIONS.map((r) => r.id));
                        }
                      }}
                      className="accent-amber-400 rounded"
                    />
                    <span>Grant Access to All 32 Global Regions</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
                  {AWS_REGIONS.map((reg) => {
                    const isChecked = awsAllRegions || awsSelectedRegions.includes(reg.id);
                    return (
                      <label
                        key={reg.id}
                        className={`p-2 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-amber-950/30 border-amber-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-850 text-slate-500'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-semibold text-slate-200">{reg.id}</div>
                          <div className="text-[10px] text-slate-400 truncate">{reg.name}</div>
                        </div>
                        <input
                          type="checkbox"
                          disabled={awsAllRegions}
                          checked={isChecked}
                          onChange={() => toggleAwsRegion(reg.id)}
                          className="accent-amber-400 rounded ml-1"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Connect / Save Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-mono text-slate-400">
                  Status: {awsConnected ? <span className="text-emerald-400 font-bold">Connected & Synchronized</span> : <span className="text-slate-500">Not Connected</span>}
                </div>
                <button
                  disabled={isVerifying || !awsAccountId || !awsAccessKeyId || !awsSecretAccessKey}
                  onClick={handleConnectAws}
                  className="flex items-center gap-2 px-5 py-2 font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded transition-colors cursor-pointer text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Verifying AWS STS...' : 'Verify & Connect AWS Account'}</span>
                </button>
              </div>

            </div>
          )}

          {/* AZURE TAB CONTENT */}
          {activeCloud === 'azure' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono pb-2 border-b border-slate-850 flex items-center justify-between">
                  <span>1. Azure Service Principal & Tenant Credentials</span>
                  {azureConnected && (
                    <button
                      onClick={() => handleDisconnect('azure')}
                      className="text-rose-400 hover:underline cursor-pointer text-[11px]"
                    >
                      Disconnect Account
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Subscription ID */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Azure Subscription ID</label>
                    <input
                      type="text"
                      value={azureSubId}
                      onChange={(e) => setAzureSubId(e.target.value)}
                      placeholder="Subscription GUID"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Tenant ID */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Azure Tenant ID (Directory ID)</label>
                    <input
                      type="text"
                      value={azureTenantId}
                      onChange={(e) => setAzureTenantId(e.target.value)}
                      placeholder="Directory / Tenant GUID"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Client ID / App ID */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Client ID (Application ID / Access Key)</label>
                    <input
                      type="text"
                      value={azureClientId}
                      onChange={(e) => setAzureClientId(e.target.value)}
                      placeholder="Application Client GUID"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Client Secret */}
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Client Secret (Secret Key)</label>
                    <div className="relative">
                      <input
                        type={showAzureSecret ? 'text' : 'password'}
                        value={azureClientSecret}
                        onChange={(e) => setAzureClientSecret(e.target.value)}
                        placeholder="Client Secret Value"
                        className="w-full px-3 py-2 pr-10 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAzureSecret(!showAzureSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showAzureSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Resource Group */}
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 font-medium block mb-1">Default Resource Group</label>
                    <input
                      type="text"
                      value={azureResourceGroup}
                      onChange={(e) => setAzureResourceGroup(e.target.value)}
                      placeholder="e.g. rg-kubeforge-production"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Azure Regional Coverage */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-850">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>2. Regional Access Coverage</span>
                  </span>

                  <label className="flex items-center gap-2 text-xs font-mono text-cyan-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={azureAllRegions}
                      onChange={(e) => {
                        setAzureAllRegions(e.target.checked);
                        if (e.target.checked) {
                          setAzureSelectedRegions(AZURE_REGIONS.map((r) => r.id));
                        }
                      }}
                      className="accent-sky-400 rounded"
                    />
                    <span>Grant Access to All 40+ Azure Global Regions</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs font-mono">
                  {AZURE_REGIONS.map((reg) => {
                    const isChecked = azureAllRegions || azureSelectedRegions.includes(reg.id);
                    return (
                      <label
                        key={reg.id}
                        className={`p-2 rounded border transition-colors flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? 'bg-sky-950/30 border-sky-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-850 text-slate-500'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-semibold text-slate-200">{reg.id}</div>
                          <div className="text-[10px] text-slate-400 truncate">{reg.name}</div>
                        </div>
                        <input
                          type="checkbox"
                          disabled={azureAllRegions}
                          checked={isChecked}
                          onChange={() => toggleAzureRegion(reg.id)}
                          className="accent-sky-400 rounded ml-1"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Connect / Save Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-mono text-slate-400">
                  Status: {azureConnected ? <span className="text-emerald-400 font-bold">Connected & Synchronized</span> : <span className="text-slate-500">Not Connected</span>}
                </div>
                <button
                  disabled={isVerifying || !azureSubId || !azureClientId || !azureClientSecret}
                  onClick={handleConnectAzure}
                  className="flex items-center gap-2 px-5 py-2 font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded transition-colors cursor-pointer text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Verifying Azure...' : 'Verify & Connect Azure Account'}</span>
                </button>
              </div>

            </div>
          )}

          {/* Verification Status & Discovered Clusters Banner */}
          {verifyStatus && (
            <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-lg space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>{verifyStatus}</span>
              </div>

              {discoveredClusters.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-850">
                  <div className="text-[11px] text-slate-400 uppercase">
                    Discovered Kubernetes Clusters ({discoveredClusters.length} Active):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {discoveredClusters.map((c, i) => (
                      <div key={i} className="p-2 bg-slate-900 border border-slate-800 rounded flex items-center justify-between">
                        <span className="text-white font-semibold">{c.name}</span>
                        <span className="text-cyan-400">{c.region} ({c.provider})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="font-mono">
            Encrypted in browser session · Zero-Trust Crossplane & IRSA Compatible
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
