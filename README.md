# Introduction to Data Engineering

## Data Cubes

We're generating the following data cubes:

- **Care providers** (Poskytovatelé zdravotních služeb)
- **Population 2021** (Obyvatelé okresy 2021)

### System requirements

- Windows 10 or higher / Linux

- Nodejs `v19.8.1` or higher

### Installation instructions

#### Prerequisities

- [Nodejs](https://nodejs.org/en)
- [TypeScript execution engine](https://www.npmjs.com/package/ts-node) (`ts-node`)

#### Configuration

To install required project dependencies, run the following commands:

```bash
cd data-cubes
npm ci
```

#### Run

All scripts can be launched from `data-cubes` directory using a command:

```bash
npm start
```

### Files

#### Input

Input files are stored in the `data-cubes/input` directory. There're 3 source CSV files:

- `care-providers-registry.csv` (data sources for care providers data cube)
- `population-cs-2021.csv `(data sources for mean population data cube)
- `county-codes.csv` (mapping for translation of county codes from `population-cs-2021.csv` into standardized NUTS codes)

The remaining files contain RDF schemas for the generated data cubes.

#### Output

Output files are stored in the `data-cubes/output` directory. The following files will be generated into the `output` directory:

- `care-providers.ttl` (Care providers data cube with metadata)
- `population.ttl`  (Mean population data cube with metadata)
- `datasets.ttl` (merged data cubes from `care-providers.ttl` and `population.ttl`)

#### Scripts

The following scripts need to be run to generate both data cubes and to validate their integrity constraints:

- `care-providers.ts`
- `population.ts`
- `constraints-validation.ts`
