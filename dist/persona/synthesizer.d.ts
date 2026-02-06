/**
 * Synthesizer Persona - Combines outputs from multiple sources
 */
import { AbstractPersona } from './abstract-persona.js';
import { PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';
export declare class SynthesizerPersona extends AbstractPersona {
    protected formulateInstructions(): string;
    performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome>;
}
//# sourceMappingURL=synthesizer.d.ts.map