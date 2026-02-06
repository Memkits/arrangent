/**
 * Archive Manager - Persistent storage using markdown chronicles
 */
export interface ChronicleRecord {
    timestamp: Date;
    personaId: string;
    runId: string;
    inputData: any;
    outputData: any;
    additionalInfo: Record<string, any>;
}
export declare class ArchiveManager {
    private rootDirectory;
    constructor(rootDirectory?: string);
    private preparePersonaArchive;
    recordChronicle(record: ChronicleRecord): Promise<string>;
    private convertToMarkdown;
    retrieveChronicles(personaId: string, maxRecords?: number): Promise<string[]>;
    getRecentChronicle(personaId: string): Promise<string | null>;
    purgeArchive(personaId: string): Promise<void>;
    gatherStatistics(personaId: string): Promise<{
        totalRecords: number;
        latestRecording?: Date;
    }>;
}
//# sourceMappingURL=archive-manager.d.ts.map