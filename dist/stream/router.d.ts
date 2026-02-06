/**
 * Stream Router - Unidirectional data channel management
 */
import { WorkPacket, StreamConnection } from '../blueprint/schemas.js';
export declare class StreamRouter {
    private channelRoot;
    private routingTable;
    constructor(channelRoot?: string, routingTable?: StreamConnection[]);
    private prepareChannel;
    publishPacket(channelPath: string, packet: WorkPacket): Promise<void>;
    consumePacket(channelPath: string, packetId: string): Promise<WorkPacket | null>;
    consumeAllPackets(channelPath: string): Promise<WorkPacket[]>;
    findDownstreamChannel(upstreamPersona: string): string | null;
    findUpstreamPersonas(channelPath: string): string[];
    detectCycles(): {
        hasCycles: boolean;
        cycleChains?: string[];
    };
    clearChannel(channelPath: string): Promise<void>;
    generateGraphviz(): string;
}
//# sourceMappingURL=router.d.ts.map