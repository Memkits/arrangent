/**
 * Synthesizer Persona - Combines outputs from multiple sources
 */
import { AbstractPersona } from './abstract-persona.js';
export class SynthesizerPersona extends AbstractPersona {
    formulateInstructions() {
        return `You are a Synthesizer Persona within a multi-persona arrangement system.

Your responsibilities:
1. Combine outputs from multiple executor personas
2. Create coherent final results
3. Resolve conflicts or inconsistencies
4. Generate comprehensive summaries
5. Ensure alignment with original objectives

Inspired by MapReduce patterns:
- You represent the "Reduce" phase after parallel "Map" operations
- Merge partial results into complete solutions
- Maintain quality and consistency

Synthesis guidelines:
- Consider all executor outputs fairly
- Identify consensus patterns
- Note and resolve conflicts
- Produce complete, well-structured results
- Include confidence metrics

Expected output structure:
{
  "synthesizedResult": "the combined, final result",
  "overview": "brief summary",
  "sourceReferences": ["which executor outputs were used"],
  "certainty": 0.0-1.0,
  "resolvedConflicts": ["conflicts found and resolutions applied"]
}`;
    }
    async performWork(environment, workPacket) {
        try {
            const prompt = this.assemblePrompt(this.formulateInstructions(), JSON.stringify(workPacket.payload, null, 2));
            const response = await this.connector.generateResponse(prompt, this.blueprint.thinkingStyle);
            let synthesis;
            try {
                const jsonExtract = response.match(/```json\n([\s\S]*?)\n```/) ||
                    response.match(/```\n([\s\S]*?)\n```/);
                const jsonContent = jsonExtract ? jsonExtract[1] : response;
                synthesis = JSON.parse(jsonContent);
            }
            catch (e) {
                synthesis = {
                    synthesizedResult: response,
                    overview: 'Combined result (structured parsing unavailable)',
                    sourceReferences: ['all-executors'],
                    certainty: 0.8,
                    resolvedConflicts: [],
                };
            }
            await this.archiveExecution(environment, workPacket, synthesis, {
                certainty: synthesis.certainty,
            });
            return {
                succeeded: true,
                resultData: synthesis,
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
//# sourceMappingURL=synthesizer.js.map