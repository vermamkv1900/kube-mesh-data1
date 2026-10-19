export interface CloudRegion {
  id: string;
  name: string;
  location: string;
  status: 'Available' | 'Degraded';
  discoveredClusters: string[];
}

export interface AwsAccountConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  roleArn?: string;
  allRegionsEnabled: boolean;
  selectedRegions: string[];
  connected: boolean;
  connectedAt?: string;
}

export interface AzureAccountConfig {
  subscriptionId: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  resourceGroup: string;
  allRegionsEnabled: boolean;
  selectedRegions: string[];
  connected: boolean;
  connectedAt?: string;
}

export const AWS_REGIONS: CloudRegion[] = [
  { id: 'us-east-1', name: 'US East (N. Virginia)', location: 'North America', status: 'Available', discoveredClusters: ['production-us-east-1', 'staging-us-east-1', 'ml-platform-us-east-1'] },
  { id: 'us-east-2', name: 'US East (Ohio)', location: 'North America', status: 'Available', discoveredClusters: ['dr-us-east-2'] },
  { id: 'us-west-1', name: 'US West (N. California)', location: 'North America', status: 'Available', discoveredClusters: [] },
  { id: 'us-west-2', name: 'US West (Oregon)', location: 'North America', status: 'Available', discoveredClusters: ['analytics-us-west-2', 'finops-karpenter-west-2'] },
  { id: 'ca-central-1', name: 'Canada (Central)', location: 'North America', status: 'Available', discoveredClusters: [] },
  { id: 'eu-west-1', name: 'Europe (Ireland)', location: 'Europe', status: 'Available', discoveredClusters: ['eu-production-mesh-01'] },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)', location: 'Europe', status: 'Available', discoveredClusters: ['eu-banking-pg-ha'] },
  { id: 'eu-west-2', name: 'Europe (London)', location: 'Europe', status: 'Available', discoveredClusters: [] },
  { id: 'eu-west-3', name: 'Europe (Paris)', location: 'Europe', status: 'Available', discoveredClusters: [] },
  { id: 'eu-north-1', name: 'Europe (Stockholm)', location: 'Europe', status: 'Available', discoveredClusters: [] },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)', location: 'Asia Pacific', status: 'Available', discoveredClusters: ['apac-spoke-cluster-01'] },
  { id: 'ap-southeast-2', name: 'Asia Pacific (Sydney)', location: 'Asia Pacific', status: 'Available', discoveredClusters: [] },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)', location: 'Asia Pacific', status: 'Available', discoveredClusters: ['tokyo-vcluster-hub'] },
  { id: 'ap-northeast-2', name: 'Asia Pacific (Seoul)', location: 'Asia Pacific', status: 'Available', discoveredClusters: [] },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)', location: 'Asia Pacific', status: 'Available', discoveredClusters: [] },
  { id: 'sa-east-1', name: 'South America (São Paulo)', location: 'South America', status: 'Available', discoveredClusters: [] },
  { id: 'me-central-1', name: 'Middle East (UAE)', location: 'Middle East', status: 'Available', discoveredClusters: [] },
  { id: 'af-south-1', name: 'Africa (Cape Town)', location: 'Africa', status: 'Available', discoveredClusters: [] },
];

export const AZURE_REGIONS: CloudRegion[] = [
  { id: 'eastus', name: 'East US (Virginia)', location: 'North America', status: 'Available', discoveredClusters: ['aks-prod-eastus-01'] },
  { id: 'eastus2', name: 'East US 2 (Virginia)', location: 'North America', status: 'Available', discoveredClusters: [] },
  { id: 'westus2', name: 'West US 2 (Washington)', location: 'North America', status: 'Available', discoveredClusters: ['aks-keda-westus2'] },
  { id: 'centralus', name: 'Central US (Iowa)', location: 'North America', status: 'Available', discoveredClusters: [] },
  { id: 'canadacentral', name: 'Canada Central (Toronto)', location: 'North America', status: 'Available', discoveredClusters: [] },
  { id: 'westeurope', name: 'West Europe (Netherlands)', location: 'Europe', status: 'Available', discoveredClusters: ['aks-eu-telemetry-01'] },
  { id: 'northeurope', name: 'North Europe (Ireland)', location: 'Europe', status: 'Available', discoveredClusters: [] },
  { id: 'uksouth', name: 'UK South (London)', location: 'Europe', status: 'Available', discoveredClusters: [] },
  { id: 'francecentral', name: 'France Central (Paris)', location: 'Europe', status: 'Available', discoveredClusters: [] },
  { id: 'germanywestcentral', name: 'Germany West Central (Frankfurt)', location: 'Europe', status: 'Available', discoveredClusters: ['aks-finops-frankfurt'] },
  { id: 'southeastasia', name: 'Southeast Asia (Singapore)', location: 'Asia Pacific', status: 'Available', discoveredClusters: ['aks-singapore-edge'] },
  { id: 'australiaeast', name: 'Australia East (Sydney)', location: 'Asia Pacific', status: 'Available', discoveredClusters: [] },
  { id: 'japaneast', name: 'Japan East (Tokyo)', location: 'Asia Pacific', status: 'Available', discoveredClusters: [] },
  { id: 'koreacentral', name: 'Korea Central (Seoul)', location: 'Asia Pacific', status: 'Available', discoveredClusters: [] },
  { id: 'centralindia', name: 'Central India (Pune)', location: 'Asia Pacific', status: 'Available', discoveredClusters: [] },
  { id: 'brazilsouth', name: 'Brazil South (São Paulo)', location: 'South America', status: 'Available', discoveredClusters: [] },
  { id: 'uaenorth', name: 'UAE North (Dubai)', location: 'Middle East', status: 'Available', discoveredClusters: [] },
  { id: 'southafricanorth', name: 'South Africa North (Johannesburg)', location: 'Africa', status: 'Available', discoveredClusters: [] },
];
