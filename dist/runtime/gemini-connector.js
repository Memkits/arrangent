/**
 * GeminiConnector - Interface with Google's Gemini AI platform
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
export class GeminiConnector {
    platform;
    activeModels;
    constructor(credentials) {
        if (!credentials) {
            throw new Error('Gemini credentials required');
        }
        this.platform = new GoogleGenerativeAI(credentials);
        this.activeModels = new Map();
    }
    selectModel(style) {
        // Choose model based on thinking style characteristics
        if (style.focusNarrowness > 0.8) {
            return 'gemini-1.5-pro';
        }
        return 'gemini-1.5-flash';
    }
    retrieveModel(style) {
        const modelName = this.selectModel(style);
        const configKey = `${modelName}_${style.creativity}_${style.outputLimit}`;
        if (this.activeModels.has(configKey)) {
            return this.activeModels.get(configKey);
        }
        const modelInstance = this.platform.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: style.creativity,
                maxOutputTokens: style.outputLimit,
                topP: style.samplingDiversity,
                topK: Math.floor(40 * style.samplingDiversity),
            },
        });
        this.activeModels.set(configKey, modelInstance);
        return modelInstance;
    }
    async generateResponse(instruction, style) {
        try {
            const modelInstance = this.retrieveModel(style);
            const outcome = await modelInstance.generateContent(instruction);
            const reply = await outcome.response;
            return reply.text();
        }
        catch (err) {
            throw new Error(`Gemini interaction failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async *streamResponse(instruction, style) {
        try {
            const modelInstance = this.retrieveModel(style);
            const outcome = await modelInstance.generateContentStream(instruction);
            for await (const fragment of outcome.stream) {
                const textPart = fragment.text();
                if (textPart) {
                    yield textPart;
                }
            }
        }
        catch (err) {
            throw new Error(`Gemini streaming failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    initiateConversation(style, priorMessages = []) {
        const modelInstance = this.retrieveModel(style);
        return modelInstance.startChat({
            history: priorMessages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })),
        });
    }
}
//# sourceMappingURL=gemini-connector.js.map