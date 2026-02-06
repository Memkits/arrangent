/**
 * Executor Persona - Performs specific work units
 */
import { AbstractPersona } from './abstract-persona.js';
import { PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';
export declare class ExecutorPersona extends AbstractPersona {
    protected formulateInstructions(): string;
    performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome>;
}
//# sourceMappingURL=executor.d.ts.map