/**
 * Persona Implementation - Different behavioral patterns for LLM personas
 */
export class AbstractPersona {
    blueprint;
    connector;
    archiver;
    constructor(blueprint, connector, archiver) {
        this.blueprint = blueprint;
        this.connector = connector;
        this.archiver = archiver;
    }
    async archiveExecution(environment, inputData, outputData, extraInfo = {}) {
        await this.archiver.recordChronicle({
            timestamp: environment.startedAt,
            personaId: environment.personaId,
            runId: environment.runId,
            inputData,
            outputData,
            additionalInfo: extraInfo,
        });
    }
    assemblePrompt(instructions, workData) {
        return `${instructions}

Work Data:
${workData}

Provide your response according to your designated role.`;
    }
}
//# sourceMappingURL=abstract-persona.js.map