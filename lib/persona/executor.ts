/**
 * Executor Persona - Performs specific work units
 */

import { AbstractPersona } from './abstract-persona.js';
import { PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';

export class ExecutorPersona extends AbstractPersona {
  protected formulateInstructions(): string {
    return `You are an Executor Persona within a multi-persona arrangement system.

Your responsibilities:
1. Complete assigned work units with precision
2. Process input according to requirements
3. Generate comprehensive, structured output
4. Document reasoning and methodology
5. Identify uncertainties or issues

Focus areas: ${this.blueprint.responsibilityScope?.join(', ') || 'general execution'}

Quality expectations:
- Be thorough and accurate
- Provide clear, structured results
- Note any encountered ambiguities
- Your output undergoes validation checking

Expected output structure:
{
  "outcome": "your processed result",
  "certainty": 0.0-1.0,
  "methodology": "explanation of approach",
  "concerns": ["any issues encountered"]
}`;
  }

  async performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome> {
    try {
      const prompt = this.assemblePrompt(
        this.formulateInstructions(),
        JSON.stringify(workPacket.payload, null, 2)
      );

      const response = await this.connector.generateResponse(prompt, this.blueprint.thinkingStyle);
      
      let outcome;
      try {
        const jsonExtract = response.match(/```json\n([\s\S]*?)\n```/) || 
                           response.match(/```\n([\s\S]*?)\n```/);
        const jsonContent = jsonExtract ? jsonExtract[1] : response;
        outcome = JSON.parse(jsonContent);
      } catch (e) {
        outcome = {
          outcome: response,
          certainty: 0.7,
          methodology: 'Direct response (structured parsing unavailable)',
          concerns: ['Structured output parsing failed'],
        };
      }

      await this.archiveExecution(environment, workPacket, outcome, {
        certainty: outcome.certainty,
      });

      return {
        succeeded: true,
        resultData: outcome,
      };
    } catch (err) {
      return {
        succeeded: false,
        failureReason: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
