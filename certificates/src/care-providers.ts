import * as $rdf from 'rdflib';
import { unraw } from 'unraw';
import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import * as csv from 'csvtojson';
import { CareProvider, CareProvidersGroup } from './types.js';
import { loadRdfIntoStore } from './rdf-store.js';
import { RDF, QB, NS, XSD, __dirname, UNKNOWN_TEXT, SPDX, META } from './constants.js';
import {
    createNamedNode,
    defineSkosHierarchy,
    addNonEmptyCode,
    addNonEmptyLabel,
} from './dataset-utils.js';

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
            region: provider.Kraj,
            regionCode: provider.KrajCode,
            county: provider.Okres,
            countyCode: provider.OkresCode,
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

        const region = createNamedNode(store, group.region, group.regionCode, 'Region');
        const county = createNamedNode(store, group.county, group.countyCode, 'County');

        defineSkosHierarchy(store, region, county);

        addNonEmptyCode(store, region, group.regionCode);
        addNonEmptyLabel(store, region, group.region);

        addNonEmptyCode(store, county, group.countyCode);
        addNonEmptyLabel(store, county, group.county);

        store.add(observation, RDF('type'), QB('Observation'));
        store.add(observation, QB('dataSet'), NS('careProvidersDataset'));
        store.add(observation, NS('region'), region);
        store.add(observation, NS('county'), county);
        store.add(observation, NS('fieldOfCare'), $rdf.literal(group.fieldOfCare, 'cs'));
        store.add(observation, NS('careProvidersCount'), $rdf.literal(group.count.toString(), XSD('integer')));
    });
};

const addChecksum = (metadataStore: $rdf.Store, datasetContent: string) => {
    const checksumValue = createHash('sha256')
        .update(datasetContent)
        .digest('hex');

    metadataStore.add(
        META('checksum'),
        SPDX('checksumValue'),
        $rdf.literal(checksumValue, XSD('hexBinar')),
    );
};

const stringifyStore = (store: $rdf.Store) => {
    return unraw(
        $rdf.serialize(null, store, '', 'text/turtle'),
    );
};

const main = async () => {
    const store  = $rdf.graph();
    const metadataStore = $rdf.graph();

    loadRdfIntoStore(store, `${__dirname}/../input/shared-schema.ttl`);
    loadRdfIntoStore(store, `${__dirname}/../input/care-providers-schema.ttl`);
    loadRdfIntoStore(metadataStore, `${__dirname}/../input/care-providers-metadata.ttl`);

    const careProviders : CareProvider[] = await csv.default()
        .fromFile(`${__dirname}/../input/care-providers-registry.csv`);

    const careProviderGroups = countCareProviders(careProviders);
    writeFileSync(
        `${__dirname}/../temp/care-provider-groups.json`,
        JSON.stringify(careProviderGroups, null, 2),
    );

    addObservations(store, careProviderGroups);

    const datasetContent = stringifyStore(store);

    addChecksum(metadataStore, datasetContent);

    writeFileSync(
        `${__dirname}/../output/care-providers.ttl`,
        datasetContent,
    );

    writeFileSync(
        `${__dirname}/../output/care-providers-metadata.ttl`,
        stringifyStore(metadataStore),
    );
};

await main();