/**
 * Arrangement Coordinator - Orchestrates persona execution and data flow
 */
import { ArrangementManifest } from '../blueprint/schemas.js';
export interface CoordinationMetrics {
    totalExecutions: number;
    elapsedMillis: number;
    personaExecutionCounts: Record<string, number>;
}
export interface CoordinationResult {
    completedSuccessfully: boolean;
    finalData?: any;
    errorMessage?: string;
    metrics: CoordinationMetrics;
}
export declare class ArrangementCoordinator {
    private manifest;
    private connector;
    private archiver;
    private router;
    private factory;
    constructor(manifest: ArrangementManifest, credentials: string, archiveDirectory?: string, channelDirectory?: string);
    coordinate(initialData: any): Promise<CoordinationResult>;
    inspectStatus(): Promise<{
        arrangement: string;
        objective: string;
        personas: {
            identifier: string;
            kind: import("../index.js").PersonaKindString;
            statistics: {
                totalRecords: number;
                latestRecording?: Date;
            };
        }[];
        dataFlow: import("../index.js").StreamConnection[];
    }>;
}
//# sourceMappingURL=coordinator.d.ts.map