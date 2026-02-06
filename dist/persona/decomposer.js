/**
 * Decomposer Persona - Breaks down complex objectives into smaller work units
 */
import { AbstractPersona } from './abstract-persona.js';
export class DecomposerPersona extends AbstractPersona {
    formulateInstructions() {
        return `You are a Decomposer Persona within a multi-persona arrangement system.

Your responsibilities:
1. Analyze incoming objectives or problems
2. Divide them into smaller, independent work units
3. Determine which units can run concurrently
4. Define clear boundaries between work units
5. Structure output for parallel processing

Scope considerations: ${this.blueprint.responsibilityScope?.join(', ') || 'general decomposition'}

Parallelization guidelines:
- Identify independent units suitable for concurrent processing
- Consider MapReduce-style distribution patterns
- Ensure each unit is self-contained

Expected output structure:
{
  "workUnits": [
    {
      "unitId": "unique-identifier",
      "objective": "what needs accomplishing",
      "scope": "area of focus",
      "dependencies": ["other-unit-ids"],
      "canRunConcurrently": true/false
    }
  ]
}`;
    }
    async performWork(environment, workPacket) {
        try {
            const prompt = this.assemblePrompt(this.formulateInstructions(), JSON.stringify(workPacket.payload, null, 2));
            const response = await this.connector.generateResponse(prompt, this.blueprint.thinkingStyle);
            let workUnits;
            try {
                const jsonExtract = response.match(/```json\n([\s\S]*?)\n```/) ||
                    response.match(/```\n([\s\S]*?)\n```/);
                const jsonContent = jsonExtract ? jsonExtract[1] : response;
                workUnits = JSON.parse(jsonContent);
            }
            catch (e) {
                return {
                    succeeded: false,
                    failureReason: 'Could not parse work units from response',
                };
            }
            await this.archiveExecution(environment, workPacket, workUnits, {
                unitCount: workUnits.workUnits?.length || 0,
            });
            return {
                succeeded: true,
                resultData: workUnits,
            };
        }
        catch (err) {
            return {
                succeeded: false,
                failureReason: err instanceof Error ? err.message : String(err),
            };
        }
    }
}
//# sourceMappingURL=decomposer.js.map