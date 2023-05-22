import { readdirSync, readFileSync, writeFileSync } from 'fs';
import * as $rdf from 'rdflib';
import * as rdfstore from 'rdfstore';
import { __dirname } from './constants.js';
import { loadRdfIntoStore } from './rdf-store.js';
import { stringifyStore } from './dataset-utils.js';

const mergeDatasets = () => {
    const store  = $rdf.graph();

    loadRdfIntoStore(store, `${__dirname}/../output/care-providers.ttl`);
    loadRdfIntoStore(store, `${__dirname}/../output/population.ttl`);
    loadRdfIntoStore(store, `${__dirname}/../output/care-providers-metadata.ttl`);
    loadRdfIntoStore(store, `${__dirname}/../output/population-metadata.ttl`);

    writeFileSync(
        `${__dirname}/../output/data-catalog.ttl`,
        stringifyStore(store),
    );

    console.log(`Merged 'care-providers.ttl', 'population.ttl' and their metadata to 'data-catalog.ttl'`);
};

const getValidationQueryFilenames = () => {
    const sparqlQueryFilenames = readdirSync(`${__dirname}/integrity-constraints`)
        .filter((filename) => filename.match(/\.sparql/));

    console.log(`Found ${sparqlQueryFilenames.length} sparql queries for integrity constraints validation`);

    return sparqlQueryFilenames;
};

const printStatistics = (constraintsPassed: Record<string, boolean>) => {
    const passed = Object.entries(constraintsPassed)
        .filter((entry) => entry[1])
        .map((entry) => entry[0]);

    const passedNot = Object.entries(constraintsPassed)
        .filter((entry) => !entry[1])
        .map((entry) => entry[0]);

    if (passed.length === Object.keys(constraintsPassed).length) {
        console.log('All constraints passed');
        return;
    }

    console.log(`The following constraints passed:\n${JSON.stringify(passed, null, 2)}`);
    console.log(`The following constraints failed:\n${JSON.stringify(passedNot, null, 2)}`);
};

const main = async () => {
    mergeDatasets();

    const sparqlQueryFilenames = getValidationQueryFilenames();

    const constraintsPassed: Record<string, boolean> = {};

    new rdfstore.Store((_err, store) => {
        const datasets = readFileSync(
            `${__dirname}/../output/data-catalog.ttl`,
            { encoding: 'utf-8' },
        );

        store.load('text/turtle', datasets, (_err, _results) => {
            for (const filename of sparqlQueryFilenames) {
                const sparqlQuery = readFileSync(
                    `${__dirname}/integrity-constraints/${filename}`,
                    { encoding: 'utf-8' },
                );

                store.execute(sparqlQuery, (err, constraintPassedNot) => {
                    if(!err) {
                        constraintsPassed[filename] = !constraintPassedNot;

                        const lastQueryProcessed = Object.keys(constraintsPassed).length === sparqlQueryFilenames.length;
                        if (lastQueryProcessed) {
                            console.log('Tested all integrity constraints');
                            printStatistics(constraintsPassed);
                        }
                    }
                });
            }
        });
    });
};

await main();