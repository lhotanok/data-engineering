import * as $rdf from 'rdflib';
import { unraw } from 'unraw';
import removeAccents from 'remove-accents';
import { RDF, NS, __dirname, DBO, SKOS, META, SPDX, XSD } from './constants.js';
import { createHash } from 'crypto';

export const createNamedNode = (
    store: $rdf.Store, name: string, code: string, nodeType: 'Region' | 'County',
): $rdf.NamedNode => {
    const resourceName = code || textToIriPart(name);

    const node = store.sym(`http://example.org/resources/${resourceName}`);

    store.add(node, RDF('type'), NS(nodeType));

    return node;
};

export const defineSkosHierarchy = (store: $rdf.Store, region: $rdf.NamedNode, county: $rdf.NamedNode) => {
    store.add(region, RDF('type'), SKOS('Concept'));
    store.add(county, RDF('type'), SKOS('Concept'));

    store.add(region, SKOS('narrower'), county);
    store.add(county, SKOS('broader'), region);
};

export const addNonEmptyLabel = (store: $rdf.Store, node: $rdf.NamedNode, label: string, lang = 'cs') => {
    if (label) {
        store.add(node, DBO('originalName'), $rdf.literal(label, lang));
        store.add(node, SKOS('prefLabel'), $rdf.literal(label, lang));
    }
};

export const addNonEmptyCode = (store: $rdf.Store, node: $rdf.NamedNode, code: string) => {
    if (code) {
        store.add(node, DBO('nutsCode'), code);
    }
};

export const addChecksum = (metadataStore: $rdf.Store, checksumName: string, datasetContent: string) => {
    const checksumValue = createHash('sha256')
        .update(datasetContent)
        .digest('hex');

    metadataStore.add(
        META(checksumName),
        SPDX('checksumValue'),
        $rdf.literal(checksumValue, XSD('hexBinar')),
    );
};

export const stringifyStore = (store: $rdf.Store) => {
    return unraw(
        $rdf.serialize(null, store, '', 'text/turtle'),
    );
};

const textToIriPart = (text: string) => removeAccents(text)
    .replace(/ /g, '_')
    .toLowerCase();
