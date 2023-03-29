import * as $rdf from 'rdflib';
import { unraw } from 'unraw';
import { writeFileSync } from 'fs';
import * as csv from 'csvtojson';
import { loadRdfIntoStore } from './rdf-store.js';
import { RDF, QB, NS, XSD, __dirname, MEAN_POPULATION_VUK, COUNTY_VUZEMI_CIS, DBO, OUTPUT_DIR } from './constants.js';
import { CountyCodeRecord, PopulationRecord } from './types.js';
import { initializeDirectories } from './utils.js';
import path from 'path';

const countyCodesToNUTS = async () : Promise<Record<string, string>> => {
    const countyRecords: CountyCodeRecord[] = await csv.default()
        .fromFile(`${__dirname}/../input/county-codes.csv`);

    writeFileSync(
        `${__dirname}/../temp/county-codes.json`,
        JSON.stringify(countyRecords, null, 2),
    );

    const countyCodeMap: Record<string, string> = {};

    countyRecords.forEach((record) => {
        countyCodeMap[record.CHODNOTA2] = record.CHODNOTA1;
    });

    return countyCodeMap;
};

const addObservations = (store: $rdf.Store, populationRecords: PopulationRecord[]) => {
    console.log(`Inserting ${populationRecords.length} observations into population data cube`);

    populationRecords.forEach((record, i) => {
        const observationId = String(i + 1).padStart(4, '0');
        const observation = store.sym(`http://example.org/resources/population/observation-${observationId}`);

        const countyCode = record.vuzemi_kod;
        const regionCode = countyCode.substring(0, record.vuzemi_kod.length - 1);

        const region = store.sym(`http://example.org/resources/${regionCode}`);
        store.add(region, RDF('type'), NS('Region'));
        store.add(region, DBO('nutsCode'), regionCode);

        const county = store.sym(`http://example.org/resources/${countyCode}`);
        store.add(county, RDF('type'), NS('County'));
        store.add(county, DBO('nutsCode'), countyCode);
        if (record.vuzemi_txt) store.add(county, DBO('originalName'), $rdf.literal(record.vuzemi_txt, 'cs'));

        store.add(observation, RDF('type'), QB('Observation'));
        store.add(observation, QB('dataSet'), NS('populationDataset'));
        store.add(observation, NS('region'), region);
        store.add(observation, NS('county'), county);
        store.add(observation, NS('meanPopulation'), $rdf.literal(record.hodnota, XSD('integer')));
    });
};

const main = async () => {
    initializeDirectories();

    const store  = $rdf.graph();

    loadRdfIntoStore(store, `${__dirname}/../input/shared-schema.ttl`);
    loadRdfIntoStore(store, `${__dirname}/../input/population-schema.ttl`);

    const populationRecords: PopulationRecord[] = await csv.default()
        .fromFile(`${__dirname}/../input/population-cs-2021.csv`);

    const meanPopulationRecords = populationRecords.filter(
        ({ vuk }) => vuk === MEAN_POPULATION_VUK,
    );
    const countyMeanPopulation = meanPopulationRecords.filter(
        ({ vuzemi_cis }) => vuzemi_cis === COUNTY_VUZEMI_CIS,
    );

    console.log(`Loaded ${meanPopulationRecords.length} mean population records`);
    console.log(`Loaded ${countyMeanPopulation.length} counties with mean population info`);

    console.log('Replacing original county codes with NUTS county codes');
    const countyCodeMap : Record<string, string> = await countyCodesToNUTS();

    const normalizedMeanPopulation = countyMeanPopulation.map((record) => ({
        ...record,
        vuzemi_kod: countyCodeMap[record.vuzemi_kod]
    }));

    addObservations(store, normalizedMeanPopulation);

    writeFileSync(
        `${__dirname}/../temp/population-records.json`,
        JSON.stringify(normalizedMeanPopulation, null, 2),
    );

    const outputPath = path.join(OUTPUT_DIR, 'population.ttl');
    console.log(`Saving results to: ${outputPath}`);

    writeFileSync(
        outputPath,
        unraw(
            $rdf.serialize(null, store, '', 'text/turtle')
        ),
    );
};

await main();