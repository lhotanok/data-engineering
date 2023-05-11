# Data engineering course

1. [System requirements](#requirements)
2. [Prerequisities](#prerequisities)
3. [Projects](#projects)
   - [Data Cubes](#data_cubes)
     - [Installation instructions](#data_cubes_installation)
     - [Files](#data_cubes_files)
   - [Apache Airflow](#apache_airflow)
     - [Installation instructions](#apache_airflow_installation)
     - [Files](#apache_airflow_files)
   - [Provenance](#provenance)
   - [SKOS & DCAT-AP](#skos-and-dcat)

## System requirements <a name="requirements"></a>

- Linux / Windows 10 or higher with WSL installed
- Nodejs `v19.8.1` or higher
- NPM `v9.6.2` or higher
- Python `v3.8`
- PyPI `v20.0.2` or higher

## Prerequisities<a name="prerequisities"></a>

- [Nodejs](https://nodejs.org/en)
- [NPM](https://www.npmjs.com/)
- [TypeScript execution engine](https://www.npmjs.com/package/ts-node) (`ts-node`)
- [Python](https://www.python.org/)
- [PyPI](https://pypi.org/)

## Projects<a name="projects"></a>

### Data Cubes<a name="data_cubes"></a> 

We're generating the following data cubes:

- **Care providers** (Poskytovatelé zdravotních služeb)
- **Population 2021** (Obyvatelé okresy 2021)

#### Installation instructions<a name="data_cubes_installation"></a>

##### Configuration

To install required project dependencies, run the following commands:

```bash
cd data-cubes
npm ci
```

##### Run

Scripts for data cubes generation can be launched from `data-cubes` directory using a command:

```bash
npm start
```

To generate both data cubes and test their integrity constraints, run the following:

```bash
npm test
```

#### Files<a name="data_cubes_files"></a>

##### Input

Input files are stored in the `data-cubes/input` directory. There're 3 source CSV files:

- `care-providers-registry.csv` (data sources for care providers data cube)
- `population-cs-2021.csv `(data sources for mean population data cube)
- `county-codes.csv` (mapping for translation of county codes from `population-cs-2021.csv` into standardized NUTS codes)

The remaining files contain RDF schemas for the generated data cubes.

##### Output

Output files are stored in the `data-cubes/output` directory. The following files will be generated into the `output` directory:

- `care-providers.ttl` (Care providers data cube with metadata)
- `population.ttl`  (Mean population data cube with metadata)
- `datasets.ttl` (merged data cubes from `care-providers.ttl` and `population.ttl`)

##### Scripts

The following scripts need to be run to generate both data cubes and to validate their integrity constraints:

- `care-providers.ts`
- `population.ts`
- `constraints-validation.ts`

### Apache Airflow<a name="apache_airflow"></a> 

We're generating the same data cubes as in the previous section:

- **Care providers** (Poskytovatelé zdravotních služeb)
- **Population 2021** (Obyvatelé okresy 2021)

#### Installation instructions<a name="apache_airflow_installation"></a> 

This project needs to be run on a Linux machine or in the WSL environment.

##### Configuration

First, open project's directory:

```bash
cd airflow
```

Then proceed with installing dependencies for Nodejs scripts from `package.json`:

```bash
npm ci
```

Next step will be configuration of a virtual environment for Python. You can install Apache Airflow from the exported dependencies in `requirements.txt` file or follow the official [installation guide](https://airflow.apache.org/docs/apache-airflow/stable/start.html).

To set up Python virtual environment called `venv` with all required dependencies, run the following commands:

```bash
# Create Python venv
python3 -m venv venv

# Activate venv
. venv/bin/activate

# Install Python dependencies from requirements.txt
pip install -r requirements.txt
```

You'll also need to define a home directory for Apache Airflow:

```bash
export AIRFLOW_HOME=~/airflow
```

To finish Airflow setup, run the following:

```bash
# Initialize a database
airflow db init

# Create an administrator
airflow users create --username "admin" --firstname "Harry" --lastname "Potter" --role "Admin" --email "harry.potter@gmail.com"

# Check the existing users
airflow users list
```

You should also update the generated `airflow.cfg` file:

1. `dags_folder` needs to point to the `dags` directory, e.g. `/home/kristyna/data-engineering/airflow/dags`
2. `load_examples` should better be set to `False` if you want to avoid seeing tons of example DAGs

##### Run

You'll need 2 commands to launch Airflow. Each command needs to be triggered in its own terminal.

1. ```bash
   airflow scheduler
   ```

2. ```bash
   airflow webserver --port 8080
   ```

Now you can visit `http://localhost:8080/home` in your web browser. If you set `load_examples = False` in `airflow.cfg`,
you should only see one DAG - `data-cubes`.

DAGs can be easily triggered using the web interface. You need to provide a JSON configuration with `output_path` field.
An example of the right configuration can be seen at `dag-configuration.json`. The generated data cubes will be stored into the directory specified by `output_path` parameter. If you forget to pass this parameter, `{dags_folder}/output` will be used as a default location for output files.

#### Files<a name="apache_airflow_files"></a>

##### Input

Input files are gathered in `airflow/dags/input` directory. Three CSV files will be downloaded (same as in [Data Cubes](#data_cubes) project):

- `care-providers-registry.csv` (data sources for care providers data cube)
- `population-cs-2021.csv `(data sources for mean population data cube)
- `county-codes.csv` (mapping for translation of county codes from `population-cs-2021.csv` into standardized NUTS codes)

The remaining files contain RDF schemas for the generated data cubes.

##### Output

Output files will be stored into the `output_path` directory or `{dags_folder}/output` by default.
The following files will be generated:

- `health_care.ttl` (Care providers data cube with metadata)
- `population.ttl`  (Mean population data cube with metadata)
- `datasets.ttl` (merged data cubes from `health_care.ttl` and `population.ttl`)

##### Airflow pipeline

There's exactly one DAG defined in `data-cubes.py`. It specifies 6 tasks for the Airflow pipeline:

1. `health_care_providers_download`
2. `population_2021_download`
3. `county_codes_download`
4. `care_providers_data_cube`
5. `population_data_cube`
6. `integrity_constraints_validation`

Tasks 1-3 take care of downloading the source CSV files into the `input` directory.
Tasks 4 and 5 are responsible of generating the target data cubes `health_care.ttl` and `population.ttl`.
The last task merges the output datasets and validates them against a set of integrity constraints.

For a better idea of how the tasks are connected, see the DAG's graph visualization:

![Graph of `data-cubes` DAG](https://i.imgur.com/OFMuTsi.png)

##### Scripts

Scripts operating with CSV and RDF files were adapted from the [Data Cubes](#data_cubes) project. They're stored in `airflow/dags/scripts` and they're triggered by `data-cubes.py`. The most important (entry) scripts are again the following:

- `care-providers.ts`
- `population.ts`
- `constraints-validation.ts`

### Provenance<a name="provenance"></a> 

A provenance document describing a process of generating datasets from [Data Cubes](#data_cubes) project can be found in `provenance` directory. It is stored as `provenance.trig` file in RDF TriG format. It follows [PROV-O](https://www.w3.org/TR/prov-o/) specification and its attached examples.

### SKOS & DCAT-AP <a name="skos-and-dcat"></a>

The `care-providers` dataset from [Data Cubes](#data_cubes) project is extended by DCAT-AP metadata in the `skos-and-dcat` project. Project structure is the same as in `data-cubes` project, except for metadata. Those were removed from `population` dataset completely and moved from `care-providers` dataset into a separate dataset: `care-providers-metadata`. Metadata are described with a file `skos-and-dcat/input/care-providers-metadata.ttl`. File's content is loaded into an RDF store, normalized and dumped into `skos-and-dcat/output/care-providers-metadata.ttl`.

For project installation & usage instructions, refer to the original [Data Cubes](#data_cubes) section.