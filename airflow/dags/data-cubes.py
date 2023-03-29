from datetime import datetime, timedelta
from airflow.settings import DAGS_FOLDER

from airflow import DAG, dag_processing
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator

def say_hello_world():
    print("Hello world!")

scripts_folder = f"{DAGS_FOLDER}/scripts"

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

    task01 = PythonOperator(
        task_id="hello_world",
        python_callable=say_hello_world,
    )
    task01.doc_md = """This task prints a message."""

    task02 = BashOperator(
        task_id="care_providers",
        bash_command="ts-node --esm care-providers.ts",
        cwd=scripts_folder
    )

    task03 = BashOperator(
        task_id="print_date",
        bash_command="date",
    )

    task01 >> task02 >> task03