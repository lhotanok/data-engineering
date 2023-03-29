import * as $rdf from 'rdflib';
import { unraw } from 'unraw';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import * as csv from 'csvtojson';
import removeAccents from 'remove-accents';
import { CareProvider, CareProvidersGroup } from './types.js';
import { loadRdfIntoStore } from './rdf-store.js';
import { RDF, QB, NS, XSD, __dirname, UNKNOWN_TEXT, DBO } from './constants.js';

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

const textToIriPart = (text: string) => removeAccents(text)
    .replace(/ /g, '_')
    .toLowerCase();

const addObservations = (store: $rdf.Store, careProviderGroups: CareProvidersGroup[]) => {
    console.log(`Inserting ${careProviderGroups.length} observations into care providers data cube`);

    careProviderGroups.forEach((group, i) => {
        const observationId = String(i + 1).padStart(6, '0');
        const observation = store.sym(`http://example.org/resources/health-care/observation-${observationId}`);

        const regionResourceName = group.regionCode ? group.regionCode : textToIriPart(group.region);

        const region = store.sym(`http://example.org/resources/${regionResourceName}`);
        store.add(region, RDF('type'), NS('Region'));
        if (group.regionCode) store.add(region, DBO('nutsCode'), group.regionCode);
        if (group.region) store.add(region, DBO('originalName'), $rdf.literal(group.region, 'cs'));

        const countyResourceName = group.countyCode ? group.countyCode : textToIriPart(group.county);

        const county = store.sym(`http://example.org/resources/${countyResourceName}`);
        store.add(county, RDF('type'), NS('County'));
        if (group.countyCode) store.add(county, DBO('nutsCode'), group.countyCode);
        if (group.county) store.add(county, DBO('originalName'), $rdf.literal(group.county, 'cs'));

        store.add(observation, RDF('type'), QB('Observation'));
        store.add(observation, QB('dataSet'), NS('careProvidersDataset'));
        store.add(observation, NS('region'), region);
        store.add(observation, NS('county'), county);
        store.add(observation, NS('fieldOfCare'), $rdf.literal(group.fieldOfCare, 'cs'));
        store.add(observation, NS('careProvidersCount'), $rdf.literal(group.count.toString(), XSD('integer')));
    });
};

const initializeDirectories = () => {
    const outputDir = `${__dirname}/../output`;
    const tempDir = `${__dirname}/../temp`;

    if (!existsSync(outputDir)){
        mkdirSync(outputDir);
    }

    if (!existsSync(tempDir)){
        mkdirSync(tempDir);
    }
}

const main = async () => {
    initializeDirectories();

    const store  = $rdf.graph();

    loadRdfIntoStore(store, `${__dirname}/../input/shared-schema.ttl`);
    loadRdfIntoStore(store, `${__dirname}/../input/care-providers-schema.ttl`);

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