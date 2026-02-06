/**
 * Validator Persona - Ensures output quality and alignment
 */
import { AbstractPersona } from './abstract-persona.js';
import { PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';
export declare class ValidatorPersona extends AbstractPersona {
    protected formulateInstructions(): string;
    performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome>;
}
//# sourceMappingURL=validator.d.ts.map