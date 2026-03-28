// Metaplex Agent Registry types and mock data for demo
// In production, these would come from on-chain data via Umi SDK

export interface AgentService {
  name: 'web' | 'A2A' | 'MCP' | string;
  endpoint: string;
  version?: string;
  skills?: string[];
  domains?: string[];
}

export interface AgentRegistration {
  agentId: string;
  agentRegistry: string;
}

export interface AgentMetadata {
  type: string;
  name: string;
  description: string;
  image: string;
  services: AgentService[];
  active: boolean;
  registrations: AgentRegistration[];
  supportedTrust: string[];
}

export interface OnChainAgent {
  assetPublicKey: string;
  owner: string;
  identityPda: string;
  walletPda: string;
  registrationUri: string;
  metadata: AgentMetadata;
  walletBalance: number; // in SOL
  delegatedTo?: string;
  createdAt: string;
}

export interface TaskRequest {
  id: string;
  fromAgent: string;
  toAgent: string;
  taskType: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'running' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  reward: number; // in SOL
  createdAt: string;
  completedAt?: string;
}

export interface A2AMessage {
  id: string;
  from: string;
  to: string;
  type: 'task_request' | 'task_response' | 'discovery' | 'heartbeat';
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface OrchestrationFlow {
  id: string;
  name: string;
  agents: string[];
  steps: FlowStep[];
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface FlowStep {
  id: string;
  agentId: string;
  action: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}
