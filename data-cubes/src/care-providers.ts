import * as $rdf from 'rdflib';
import { readFileSync } from 'fs';

const BASE_URI = 'http://example.org/vocabulary#';

const NS = $rdf.Namespace(BASE_URI);

const main = () => {
    console.log("Hello");
    const store  = $rdf.graph();

    const careProvidersSchema = readFileSync(
        `${__dirname}/../input/care-providers-schema.ttl`,
        { encoding: 'utf-8' },
    );

    $rdf.parse(careProvidersSchema, store, BASE_URI, 'text/turtle');

    // console.log(store.toNQ());
};

main();