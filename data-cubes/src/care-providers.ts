import * as $rdf from 'rdflib';
import { unraw } from 'unraw';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as csv from 'csvtojson';
import { CareProvider, CareProvidersGroup } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URI = 'http://example.org/ontology#';

const NS = $rdf.Namespace(BASE_URI);
const QB = $rdf.Namespace('http://purl.org/linked-data/cube#');
const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
const XSD = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');

const loadSchemaIntoStore = (store: $rdf.Store, schemaPath: string) => {
    const careProvidersSchema = readFileSync(
        schemaPath,
        { encoding: 'utf-8' },
    );

    $rdf.parse(careProvidersSchema, store, BASE_URI, 'text/turtle');

    const schemaFilenameSplits = schemaPath.split('/');
    const schemaFilename = schemaFilenameSplits[schemaFilenameSplits.length - 1];
    console.log(`Loaded RDF schema for care providers data cube from '${schemaFilename}'`);
};

const countCareProviders = (careProviders: CareProvider[]) : CareProvidersGroup[] => {
    const careProviderGroups:  Record<string, CareProvidersGroup> = {};

    console.log(`Loaded ${careProviders.length} care provider records from CSV file 'care-providers-registry.csv'`);

    careProviders.forEach((provider) => {
        const key = `${provider.KrajCode}-${provider.OkresCode}-${provider.OborPece}`.toLowerCase();

        if (careProviderGroups[key]) {
            careProviderGroups[key].count++;
            return;
        }

        careProviderGroups[key] = {
            region: provider.KrajCode,
            county: provider.OkresCode,
            // use explicit term 'unknown' for empty field of care
            fieldOfCare: provider.OborPece || "neznámé",
            count: 1,
        };
    });

    return Object.values(careProviderGroups);
};

const addObservations = (store: $rdf.Store, careProviderGroups: CareProvidersGroup[]) => {
    console.log(`Inserting ${careProviderGroups.length} observations into care providers data cube`);

    careProviderGroups.forEach((group, i) => {
        const observationId = String(i + 1).padStart(6, '0');
        const observation = store.sym(`http://example.org/resources/observation-${observationId}`);

        store.add(observation, RDF('type'), QB('Observation'));
        store.add(observation, QB('dataSet'), NS('careProvidersDataset'));
        store.add(observation, NS('region'), group.region);
        store.add(observation, NS('county'), group.county);
        store.add(observation, NS('fieldOfCare'), $rdf.literal(group.fieldOfCare, 'cs'));
        store.add(observation, NS('careProvidersCount'), $rdf.literal(group.count.toString(), XSD('integer')));
    });
};

const main = async () => {
    const store  = $rdf.graph();

    loadSchemaIntoStore(store, `${__dirname}/../input/shared-schema.ttl`);
    loadSchemaIntoStore(store, `${__dirname}/../input/care-providers-schema.ttl`);

    const careProviders = await csv.default()
        .fromFile(`${__dirname}/../input/care-providers-registry.csv`);

    const careProviderGroups = countCareProviders(careProviders);
    writeFileSync(
        `${__dirname}/../temp/care-provider-groups.json`,
        JSON.stringify(careProviderGroups, null, 2),
    );

    addObservations(store, careProviderGroups);

    writeFileSync(
        `${__dirname}/../output/care-providers.ttl`,
        unraw(
            $rdf.serialize(null, store, '', 'text/turtle')
        ),
    );
};

await main();