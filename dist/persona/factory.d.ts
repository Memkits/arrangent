/**
 * Persona Factory - Creates persona instances based on blueprints
 */
import { PersonaBlueprint } from '../blueprint/schemas.js';
import { GeminiConnector } from '../runtime/gemini-connector.js';
import { ArchiveManager } from '../storage/archive-manager.js';
import { AbstractPersona } from './abstract-persona.js';
export declare class PersonaFactory {
    private connector;
    private archiver;
    constructor(connector: GeminiConnector, archiver: ArchiveManager);
    instantiate(blueprint: PersonaBlueprint): AbstractPersona;
    instantiateMultiple(blueprint: PersonaBlueprint, quantity?: number): AbstractPersona[];
}
//# sourceMappingURL=factory.d.ts.map