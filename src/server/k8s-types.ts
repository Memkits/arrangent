// Kubernetes-style type definitions for Arrangent API

export interface K8sMetadata {
  name: string;
  namespace?: string;
  uid: string;
  createdAt: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface K8sObjectMeta {
  apiVersion: string;
  kind: string;
  metadata: K8sMetadata;
}

export interface K8sTopologySpec {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    geminiSettings: {
      temp: number;
      tokens: number;
    };
    parallel?: number;
    dependencies: string[];
  }>;
  connections: Array<{
    from: string;
    to: string;
    channel: string;
  }>;
}

export interface K8sTopologyStatus {
  phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed';
  conditions: Array<{
    type: string;
    status: 'True' | 'False' | 'Unknown';
    lastTransitionTime: string;
    reason?: string;
    message?: string;
  }>;
  nodeStatuses?: Record<string, {
    instanceCount: number;
    readyInstances: number;
  }>;
}

export interface K8sTopology extends K8sObjectMeta {
  spec: K8sTopologySpec;
  status?: K8sTopologyStatus;
}

export interface K8sInstanceSpec {
  nodeId: string;
  config: {
    type: string;
    geminiSettings: {
      temp: number;
      tokens: number;
    };
  };
}

export interface K8sInstanceStatus {
  state: 'idle' | 'running' | 'waiting' | 'paused' | 'error' | 'completed';
  progress: number;
  startTime?: string;
  completionTime?: string;
  message?: string;
  currentPrompt?: string;
  lastOutput?: string;
}

export interface K8sInstance extends K8sObjectMeta {
  spec: K8sInstanceSpec;
  status: K8sInstanceStatus;
}

export interface K8sNodeSpec {
  id: string;
  name: string;
  type: string;
  geminiSettings: {
    temp: number;
    tokens: number;
  };
  parallel?: number;
  dependencies: string[];
}

export interface K8sNodeStatus {
  instanceCount: number;
  instances: string[]; // Instance IDs
  conditions: Array<{
    type: string;
    status: 'True' | 'False' | 'Unknown';
    lastTransitionTime: string;
  }>;
}

export interface K8sNode extends K8sObjectMeta {
  spec: K8sNodeSpec;
  status: K8sNodeStatus;
}

export interface K8sList<T> {
  apiVersion: string;
  kind: string;
  metadata: {
    resourceVersion?: string;
    continue?: string;
  };
  items: T[];
}

export interface K8sWatchEvent<T> {
  type: 'ADDED' | 'MODIFIED' | 'DELETED' | 'ERROR';
  object: T;
}

export interface K8sStatus {
  apiVersion: string;
  kind: 'Status';
  status: 'Success' | 'Failure';
  message?: string;
  reason?: string;
  code: number;
}
