/**
 * Manifest Parser - Reads and validates arrangement blueprints
 */
import { ArrangementManifest } from '../blueprint/schemas.js';
export declare class ManifestParser {
    static loadManifest(filepath: string): Promise<ArrangementManifest>;
    static verifyManifest(data: unknown): ArrangementManifest;
    static verifyStreamIntegrity(manifest: ArrangementManifest): {
        isValid: boolean;
        problems: string[];
    };
    static generateTemplate(): ArrangementManifest;
}
//# sourceMappingURL=manifest-parser.d.ts.map