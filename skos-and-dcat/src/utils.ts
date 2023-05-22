import { existsSync, mkdirSync } from 'fs';
import { __dirname } from './constants.js';

export const initializeDataDirs = () => {
    const outputDirNames = ['temp', 'output'];

    outputDirNames.forEach((dir) => {
        const fullDirPath = `${__dirname}/../${dir}`;

        if (!existsSync(fullDirPath)){
            mkdirSync(
                fullDirPath,
                { recursive: true },
            );
        }
    });
};
