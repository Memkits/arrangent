/**
 * Persona Blueprint - Defines behavioral characteristics for LLM personas
 */

export enum PersonaKind {
  DECOMPOSER = 'decomposer',
  EXECUTOR = 'executor',
  VALIDATOR = 'validator',
  SYNTHESIZER = 'synthesizer',
  FEEDBACK = 'feedback',
}

export type PersonaKindString = 'decomposer' | 'executor' | 'validator' | 'synthesizer' | 'feedback';

export interface ThinkingStyle {
  creativity: number; // 0-1 range
  outputLimit: number;
  focusNarrowness: number;
  samplingDiversity: number;
}

export interface PersonaBlueprint {
  identifier: string;
  kind: PersonaKindString;
  thinkingStyle: ThinkingStyle;
  concurrentInstances?: number;
  responsibilityScope?: string[];
  qualityRules?: {
    minimumScore: number;
    retryAttempts: number;
  };
}

export interface StreamConnection {
  upstream: string;
  downstream: string;
  channelPath: string;
}

export interface ArrangementManifest {
  schemaVersion: string;
  arrangementKind: string;
  identity: {
    label: string;
    notes?: string;
  };
  objective: {
    description: string;
    personas: PersonaBlueprint[];
    dataStreams: StreamConnection[];
  };
}

export interface WorkPacket {
  packetId: string;
  payload: any;
  provenance: {
    origin: string;
    createdAt: Date;
    generation?: number;
  };
}

export interface ExecutionOutcome {
  succeeded: boolean;
  resultData?: any;
  failureReason?: string;
  qualityScore?: number;
  suggestedActions?: string[];
}

export interface PersonaEnvironment {
  personaId: string;
  runId: string;
  startedAt: Date;
  sourceChannel: string;
  destinationChannel: string;
  archivePath: string;
}
