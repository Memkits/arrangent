/**
 * Validator Persona - Ensures output quality and alignment
 */

import { AbstractPersona } from './abstract-persona.js';
import { PersonaEnvironment, ExecutionOutcome, WorkPacket } from '../blueprint/schemas.js';

export class ValidatorPersona extends AbstractPersona {
  protected formulateInstructions(): string {
    const rules = this.blueprint.qualityRules || {
      minimumScore: 0.9,
      retryAttempts: 3,
    };

    return `You are a Validator Persona within a multi-persona arrangement system.

Your responsibilities:
1. Verify output quality from executor personas
2. Check alignment with original objectives
3. Detect discrepancies, errors, or low-quality work
4. Assign corrective actions when needed
5. Calculate quality score (0.0 to 1.0)

Quality criteria:
- Minimum acceptable score: ${rules.minimumScore}
- Maximum correction cycles: ${rules.retryAttempts}

Assessment guidelines:
- Apply strict but fair evaluation
- Verify logical consistency and completeness
- Compare against original requirements
- Check consistency across multiple executor outputs
- Provide specific corrective feedback

Expected output structure:
{
  "qualityScore": 0.0-1.0,
  "meetsStandards": true/false,
  "identifiedIssues": [
    {
      "severity": "critical|warning|info",
      "explanation": "what's wrong",
      "affectedSection": "which part has the issue"
    }
  ],
  "correctiveSteps": [
    "specific actions to resolve issues"
  ],
  "assessment": "explanation of evaluation"
}`;
  }

  async performWork(environment: PersonaEnvironment, workPacket: WorkPacket): Promise<ExecutionOutcome> {
    try {
      const prompt = this.assemblePrompt(
        this.formulateInstructions(),
        JSON.stringify(workPacket.payload, null, 2)
      );

      const response = await this.connector.generateResponse(prompt, this.blueprint.thinkingStyle);
      
      let assessment;
      try {
        const jsonExtract = response.match(/```json\n([\s\S]*?)\n```/) || 
                           response.match(/```\n([\s\S]*?)\n```/);
        const jsonContent = jsonExtract ? jsonExtract[1] : response;
        assessment = JSON.parse(jsonContent);
      } catch (e) {
        return {
          succeeded: false,
          failureReason: 'Could not parse assessment from response',
        };
      }

      await this.archiveExecution(environment, workPacket, assessment, {
        qualityScore: assessment.qualityScore,
        meetsStandards: assessment.meetsStandards,
      });

      return {
        succeeded: true,
        resultData: assessment,
        qualityScore: assessment.qualityScore,
        suggestedActions: assessment.correctiveSteps,
      };
    } catch (err) {
      return {
        succeeded: false,
        failureReason: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
