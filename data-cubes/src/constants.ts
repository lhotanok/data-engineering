import * as $rdf from 'rdflib';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export const BASE_URI = 'http://example.org/ontology#';

export const NS = $rdf.Namespace(BASE_URI);
export const QB = $rdf.Namespace('http://purl.org/linked-data/cube#');
export const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
export const XSD = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
export const DBO = $rdf.Namespace('http://dbpedia.org/ontology/');

export const UNKNOWN_TEXT = 'neznámé';
export const MEAN_POPULATION_VUK = 'DEM0004';

export const COUNTY_VUZEMI_CIS = '101';
