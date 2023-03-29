import { existsSync, mkdirSync } from 'fs';
import { __dirname } from './constants.js';

export const initializeDirectories = () => {
    const outputDir = `${__dirname}/../output`;
    const tempDir = `${__dirname}/../temp`;

    if (!existsSync(outputDir)){
        mkdirSync(outputDir);
    }

    if (!existsSync(tempDir)){
        mkdirSync(tempDir);
    }
};
