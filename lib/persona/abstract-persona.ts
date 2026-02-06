/**
 * Persona Implementation - Different behavioral patterns for LLM personas
 */

import { PersonaBlueprint, PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';
import { GeminiConnector } from '../runtime/gemini-connector.js';
import { ArchiveManager } from '../storage/archive-manager.js';

export abstract class AbstractPersona {
  protected blueprint: PersonaBlueprint;
  protected connector: GeminiConnector;
  protected archiver: ArchiveManager;

  constructor(blueprint: PersonaBlueprint, connector: GeminiConnector, archiver: ArchiveManager) {
    this.blueprint = blueprint;
    this.connector = connector;
    this.archiver = archiver;
  }

  abstract performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome>;

  protected abstract formulateInstructions(): string;

  protected async archiveExecution(
    environment: PersonaEnvironment,
    inputData: any,
    outputData: any,
    extraInfo: Record<string, any> = {}
  ): Promise<void> {
    await this.archiver.recordChronicle({
      timestamp: environment.startedAt,
      personaId: environment.personaId,
      runId: environment.runId,
      inputData,
      outputData,
      additionalInfo: extraInfo,
    });
  }

  protected assemblePrompt(instructions: string, workData: string): string {
    return `${instructions}

Work Data:
${workData}

Provide your response according to your designated role.`;
  }
}
