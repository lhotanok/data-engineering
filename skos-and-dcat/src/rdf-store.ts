import * as $rdf from 'rdflib';
import { readFileSync } from 'fs';
import { BASE_URI } from './constants.js';

export const loadRdfIntoStore = (store: $rdf.Store, rdfPath: string) => {
    const careProvidersSchema = readFileSync(
        rdfPath,
        { encoding: 'utf-8' },
    );

    $rdf.parse(careProvidersSchema, store, BASE_URI, 'text/turtle');

    const schemaFilenameSplits = rdfPath.split('/');
    const schemaFilename = schemaFilenameSplits[schemaFilenameSplits.length - 1];
    console.log(`Loaded RDF schema for data cube from '${schemaFilename}'`);
};
