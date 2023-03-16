import * as $rdf from 'rdflib';
import { readFileSync } from 'fs';
import { BASE_URI } from './constants.js';

export const loadSchemaIntoStore = (store: $rdf.Store, schemaPath: string) => {
    const careProvidersSchema = readFileSync(
        schemaPath,
        { encoding: 'utf-8' },
    );

    $rdf.parse(careProvidersSchema, store, BASE_URI, 'text/turtle');

    const schemaFilenameSplits = schemaPath.split('/');
    const schemaFilename = schemaFilenameSplits[schemaFilenameSplits.length - 1];
    console.log(`Loaded RDF schema for data cube from '${schemaFilename}'`);
};
