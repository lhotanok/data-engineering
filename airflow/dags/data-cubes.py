from datetime import datetime, timedelta
from airflow.settings import DAGS_FOLDER

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

scripts_folder = f"{DAGS_FOLDER}/scripts"
input_folder = f"{DAGS_FOLDER}/input"

care_providers_dataset_url = "https://data.mzcr.cz/distribuce/63/narodni-registr-poskytovatelu-zdravotnich-sluzeb.csv"
population_dataset_url = "https://www.czso.cz/documents/10180/184344914/130141-22data2021.csv"
county_codes_dataset_url = "https://skoda.projekty.ms.mff.cuni.cz/ndbi046/seminars/02/%C4%8D%C3%ADseln%C3%ADk-okres%C5%AF-vazba-101-nad%C5%99%C3%ADzen%C3%BD.csv"

dag_args = {
    "email": ["kristyna.lhotanova@gmail.com"],
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 3,
    'retry_delay': timedelta(minutes=5),
    'output_path': '../output'
}

with DAG(
    dag_id="data-cubes",
    default_args=dag_args,
    start_date=datetime(2023, 3, 29),
    schedule=None,
    catchup=False,
    tags=["NDBI046"],
) as dag:

    task01 = BashOperator(
        task_id="health_care_providers_download",
        bash_command=f"wget {care_providers_dataset_url} -O care-providers-registry.csv",
        cwd=input_folder
    )
    task01.doc_md = """This task downloads 'Health care providers' CSV dataset and stores it into {DAGS_FOLDER}/input."""

    task02 = BashOperator(
        task_id="population_2021_download",
        bash_command=f"wget {population_dataset_url} -O population-cs-2021.csv",
        cwd=input_folder
    )
    task02.doc_md = """This task downloads 'Population in 2021' CSV dataset and stores it into {DAGS_FOLDER}/input."""

    task03 = BashOperator(
        task_id="county_codes_download",
        bash_command=f"wget --no-check-certificate {county_codes_dataset_url} -O county-codes.csv",
        cwd=input_folder
    )
    task03.doc_md = """This task downloads 'County codes' CSV dataset and stores it into {DAGS_FOLDER}/input."""

    task04 = BashOperator(
        task_id="care_providers_data_cube",
        bash_command="ts-node --esm care-providers.ts",
        cwd=scripts_folder
    )

    task04.doc_md = """This task generates 'Care providers' data cube and stores it into the output directory."""

    task05 = BashOperator(
        task_id="population_data_cube",
        bash_command="ts-node --esm population.ts",
        cwd=scripts_folder
    )

    task05.doc_md = """This task generates 'Population' data cube and stores it into the output directory."""

    task04.set_upstream([task01, task02, task03])
    task05.set_upstream([task01, task02, task03])
