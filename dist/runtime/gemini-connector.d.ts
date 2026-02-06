/**
 * GeminiConnector - Interface with Google's Gemini AI platform
 */
import { ThinkingStyle } from '../blueprint/schemas.js';
export declare class GeminiConnector {
    private platform;
    private activeModels;
    constructor(credentials: string);
    private selectModel;
    private retrieveModel;
    generateResponse(instruction: string, style: ThinkingStyle): Promise<string>;
    streamResponse(instruction: string, style: ThinkingStyle): AsyncGenerator<string, void, unknown>;
    initiateConversation(style: ThinkingStyle, priorMessages?: Array<{
        role: string;
        content: string;
    }>): import("@google/generative-ai").ChatSession;
}
//# sourceMappingURL=gemini-connector.d.ts.map