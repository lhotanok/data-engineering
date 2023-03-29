import { existsSync, mkdirSync } from 'fs';
import { OUTPUT_DIR, __dirname } from './constants.js';

export const initializeDirectories = () => {
    const tempDir = `${__dirname}/../temp`;

    if (!existsSync(OUTPUT_DIR)){
        mkdirSync(OUTPUT_DIR);
    }

    if (!existsSync(tempDir)){
        mkdirSync(tempDir);
    }
};
