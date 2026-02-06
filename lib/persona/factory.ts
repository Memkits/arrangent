/**
 * Persona Factory - Creates persona instances based on blueprints
 */

import { PersonaBlueprint, PersonaKind } from '../blueprint/schemas.js';
import { GeminiConnector } from '../runtime/gemini-connector.js';
import { ArchiveManager } from '../storage/archive-manager.js';
import { AbstractPersona } from './abstract-persona.js';
import { DecomposerPersona } from './decomposer.js';
import { ExecutorPersona } from './executor.js';
import { ValidatorPersona } from './validator.js';
import { SynthesizerPersona } from './synthesizer.js';

export class PersonaFactory {
  private connector: GeminiConnector;
  private archiver: ArchiveManager;

  constructor(connector: GeminiConnector, archiver: ArchiveManager) {
    this.connector = connector;
    this.archiver = archiver;
  }

  instantiate(blueprint: PersonaBlueprint): AbstractPersona {
    switch (blueprint.kind) {
      case PersonaKind.DECOMPOSER:
        return new DecomposerPersona(blueprint, this.connector, this.archiver);
      
      case PersonaKind.EXECUTOR:
        return new ExecutorPersona(blueprint, this.connector, this.archiver);
      
      case PersonaKind.VALIDATOR:
        return new ValidatorPersona(blueprint, this.connector, this.archiver);
      
      case PersonaKind.SYNTHESIZER:
        return new SynthesizerPersona(blueprint, this.connector, this.archiver);
      
      case PersonaKind.FEEDBACK:
        throw new Error('Feedback persona not yet implemented');
      
      default:
        throw new Error(`Unknown persona kind: ${blueprint.kind}`);
    }
  }

  instantiateMultiple(blueprint: PersonaBlueprint, quantity: number = 1): AbstractPersona[] {
    const personas: AbstractPersona[] = [];
    for (let i = 0; i < quantity; i++) {
      personas.push(this.instantiate(blueprint));
    }
    return personas;
  }
}
