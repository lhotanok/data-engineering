import * as $rdf from 'rdflib';
import { unraw } from 'unraw';
import { writeFileSync } from 'fs';
import * as csv from 'csvtojson';
import { CareProvider, CareProvidersGroup } from './types.js';
import { loadSchemaIntoStore } from './schema.js';
import { RDF, QB, NS, XSD, __dirname, UNKNOWN_TEXT } from './constants.js';

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
            fieldOfCare: provider.OborPece || UNKNOWN_TEXT,
            count: 1,
        };
    });

    return Object.values(careProviderGroups);
};

const addObservations = (store: $rdf.Store, careProviderGroups: CareProvidersGroup[]) => {
    console.log(`Inserting ${careProviderGroups.length} observations into care providers data cube`);

    careProviderGroups.forEach((group, i) => {
        const observationId = String(i + 1).padStart(6, '0');
        const observation = store.sym(`http://example.org/resources/health-care/observation-${observationId}`);

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

    const careProviders : CareProvider[] = await csv.default()
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