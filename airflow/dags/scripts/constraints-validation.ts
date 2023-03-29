import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as $rdf from 'rdflib';
import * as rdfstore from 'rdfstore';
import { unraw } from 'unraw';
import { OUTPUT_DIR, __dirname } from './constants.js';
import { loadRdfIntoStore } from './rdf-store.js';

const mergeDatasets = () => {
    const store  = $rdf.graph();

    console.log(`Merging 'health_care.ttl' with 'population.ttl' and saving to: ${OUTPUT_DIR}`);

    loadRdfIntoStore(store, path.join(OUTPUT_DIR, 'health_care.ttl'));
    loadRdfIntoStore(store, path.join(OUTPUT_DIR, 'population.ttl'));

    writeFileSync(
        path.join(OUTPUT_DIR, 'datasets.ttl'),
        unraw(
            $rdf.serialize(null, store, '', 'text/turtle'),
        ),
    );

    console.log(`Merged 'health_care.ttl' and 'population.ttl' to 'datasets.ttl'`);
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
            path.join(OUTPUT_DIR, 'datasets.ttl'),
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