/**
 * Persona Implementation - Different behavioral patterns for LLM personas
 */
import { PersonaBlueprint, PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';
import { GeminiConnector } from '../runtime/gemini-connector.js';
import { ArchiveManager } from '../storage/archive-manager.js';
export declare abstract class AbstractPersona {
    protected blueprint: PersonaBlueprint;
    protected connector: GeminiConnector;
    protected archiver: ArchiveManager;
    constructor(blueprint: PersonaBlueprint, connector: GeminiConnector, archiver: ArchiveManager);
    abstract performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome>;
    protected abstract formulateInstructions(): string;
    protected archiveExecution(environment: PersonaEnvironment, inputData: any, outputData: any, extraInfo?: Record<string, any>): Promise<void>;
    protected assemblePrompt(instructions: string, workData: string): string;
}
//# sourceMappingURL=abstract-persona.d.ts.map