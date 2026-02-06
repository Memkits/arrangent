/**
 * Decomposer Persona - Breaks down complex objectives into smaller work units
 */
import { AbstractPersona } from './abstract-persona.js';
import { PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';
export declare class DecomposerPersona extends AbstractPersona {
    protected formulateInstructions(): string;
    performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome>;
}
//# sourceMappingURL=decomposer.d.ts.map