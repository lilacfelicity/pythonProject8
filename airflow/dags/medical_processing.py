from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
import pandas as pd
import numpy as np
import json

default_args = {
    'owner': 'medical_team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

dag = DAG(
    'medical_data_processing',
    default_args=default_args,
    description='Process and aggregate medical IoT data',
    schedule_interval=timedelta(minutes=15),
    catchup=False
)


def extract_vitals_data(**context):
    """Extract vital signs data from last 15 minutes"""
    pg_hook = PostgresHook(postgres_conn_id='medical_postgres')

    query = """
    SELECT 
        hd.id,
        hd.device_id,
        d.user_id,
        hd.heart_rate,
        hd.spo2,
        hd.blood_pressure_systolic,
        hd.blood_pressure_diastolic,
        hd.temperature,
        hd.timestamp
    FROM heart_data hd
    JOIN devices d ON hd.device_id = d.id
    WHERE hd.timestamp >= NOW() - INTERVAL '15 minutes'
    ORDER BY hd.timestamp DESC
    """

    df = pg_hook.get_pandas_df(query)

    # Store in XCom
    context['task_instance'].xcom_push(key='vitals_data', value=df.to_json())

    return f"Extracted {len(df)} records"


def analyze_vitals(**context):
    """Analyze vitals for anomalies and trends"""
    # Get data from XCom
    vitals_json = context['task_instance'].xcom_pull(key='vitals_data')
    df = pd.read_json(vitals_json)

    if df.empty:
        return "No data to analyze"

    # Group by user
    user_stats = []

    for user_id, user_data in df.groupby('user_id'):
        stats = {
            'user_id': int(user_id),
            'period_start': user_data['timestamp'].min(),
            'period_end': user_data['timestamp'].max(),
            'readings_count': len(user_data)
        }

        # Calculate statistics for each vital
        if user_data['heart_rate'].notna().any():
            hr_data = user_data['heart_rate'].dropna()
            stats['heart_rate'] = {
                'avg': float(hr_data.mean()),
                'min': float(hr_data.min()),
                'max': float(hr_data.max()),
                'std': float(hr_data.std())
            }

        if user_data['spo2'].notna().any():
            spo2_data = user_data['spo2'].dropna()
            stats['spo2'] = {
                'avg': float(spo2_data.mean()),
                'min': float(spo2_data.min()),
                'max': float(spo2_data.max())
            }

        if user_data['temperature'].notna().any():
            temp_data = user_data['temperature'].dropna()
            stats['temperature'] = {
                'avg': float(temp_data.mean()),
                'min': float(temp_data.min()),
                'max': float(temp_data.max())
            }

        # Detect anomalies
        anomalies = []

        if 'heart_rate' in stats:
            hr_avg = stats['heart_rate']['avg']
            if hr_avg > 100:
                anomalies.append({'type': 'high_hr', 'value': hr_avg})
            elif hr_avg < 60:
                anomalies.append({'type': 'low_hr', 'value': hr_avg})

        if 'spo2' in stats:
            spo2_min = stats['spo2']['min']
            if spo2_min < 95:
                anomalies.append({'type': 'low_spo2', 'value': spo2_min})

        stats['anomalies'] = anomalies
        user_stats.append(stats)

    # Store results
    context['task_instance'].xcom_push(key='user_stats', value=json.dumps(user_stats))

    return f"Analyzed data for {len(user_stats)} users"


def aggregate_hourly_data(**context):
    """Aggregate data into hourly summaries"""
    pg_hook = PostgresHook(postgres_conn_id='medical_postgres')

    # Create aggregation table if not exists
    create_table = """
    CREATE TABLE IF NOT EXISTS hourly_vitals_summary (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        hour_timestamp TIMESTAMP NOT NULL,
        readings_count INTEGER,
        heart_rate_avg FLOAT,
        heart_rate_min FLOAT,
        heart_rate_max FLOAT,
        spo2_avg FLOAT,
        spo2_min FLOAT,
        temperature_avg FLOAT,
        temperature_max FLOAT,
        bp_systolic_avg FLOAT,
        bp_systolic_max FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, hour_timestamp)
    );
    """

    pg_hook.run(create_table)

    # Aggregate last hour's data
    aggregate_query = """
    INSERT INTO hourly_vitals_summary (
        user_id, hour_timestamp, readings_count,
        heart_rate_avg, heart_rate_min, heart_rate_max,
        spo2_avg, spo2_min,
        temperature_avg, temperature_max,
        bp_systolic_avg, bp_systolic_max
    )
    SELECT 
        d.user_id,
        date_trunc('hour', hd.timestamp) as hour_timestamp,
        COUNT(*) as readings_count,
        AVG(hd.heart_rate) as heart_rate_avg,
        MIN(hd.heart_rate) as heart_rate_min,
        MAX(hd.heart_rate) as heart_rate_max,
        AVG(hd.spo2) as spo2_avg,
        MIN(hd.spo2) as spo2_min,
        AVG(hd.temperature) as temperature_avg,
        MAX(hd.temperature) as temperature_max,
        AVG(hd.blood_pressure_systolic) as bp_systolic_avg,
        MAX(hd.blood_pressure_systolic) as bp_systolic_max
    FROM heart_data hd
    JOIN devices d ON hd.device_id = d.id
    WHERE hd.timestamp >= date_trunc('hour', NOW() - INTERVAL '1 hour')
      AND hd.timestamp < date_trunc('hour', NOW())
    GROUP BY d.user_id, date_trunc('hour', hd.timestamp)
    ON CONFLICT (user_id, hour_timestamp) 
    DO UPDATE SET
        readings_count = EXCLUDED.readings_count,
        heart_rate_avg = EXCLUDED.heart_rate_avg,
        heart_rate_min = EXCLUDED.heart_rate_min,
        heart_rate_max = EXCLUDED.heart_rate_max,
        spo2_avg = EXCLUDED.spo2_avg,
        spo2_min = EXCLUDED.spo2_min,
        temperature_avg = EXCLUDED.temperature_avg,
        temperature_max = EXCLUDED.temperature_max,
        bp_systolic_avg = EXCLUDED.bp_systolic_avg,
        bp_systolic_max = EXCLUDED.bp_systolic_max,
        created_at = CURRENT_TIMESTAMP;
    """

    result = pg_hook.run(aggregate_query)

    return "Hourly aggregation completed"


def generate_alerts(**context):
    """Generate alerts based on analysis"""
    user_stats_json = context['task_instance'].xcom_pull(key='user_stats')
    if not user_stats_json:
        return "No stats to process"

    user_stats = json.loads(user_stats_json)
    pg_hook = PostgresHook(postgres_conn_id='medical_postgres')

    # Create alerts table if not exists
    create_table = """
    CREATE TABLE IF NOT EXISTS generated_alerts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        alert_type VARCHAR(50),
        severity VARCHAR(20),
        metric_name VARCHAR(50),
        metric_value FLOAT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """

    pg_hook.run(create_table)

    # Generate alerts for anomalies
    alerts_generated = 0

    for user_stat in user_stats:
        user_id = user_stat['user_id']

        for anomaly in user_stat.get('anomalies', []):
            severity = 'warning'
            message = ""

            if anomaly['type'] == 'high_hr':
                message = f"Average heart rate is elevated: {anomaly['value']:.1f} bpm"
                if anomaly['value'] > 120:
                    severity = 'critical'
            elif anomaly['type'] == 'low_hr':
                message = f"Average heart rate is low: {anomaly['value']:.1f} bpm"
            elif anomaly['type'] == 'low_spo2':
                message = f"Oxygen saturation dropped to: {anomaly['value']:.1f}%"
                if anomaly['value'] < 90:
                    severity = 'critical'

            insert_alert = f"""
            INSERT INTO generated_alerts (user_id, alert_type, severity, metric_name, metric_value, message)
            VALUES ({user_id}, '{anomaly['type']}', '{severity}', 
                    '{anomaly['type'].replace('_', ' ')}', {anomaly['value']}, '{message}');
            """

            pg_hook.run(insert_alert)
            alerts_generated += 1

    return f"Generated {alerts_generated} alerts"


def cleanup_old_data(**context):
    """Clean up old raw data (keep aggregated)"""
    pg_hook = PostgresHook(postgres_conn_id='medical_postgres')

    # Delete raw data older than 7 days
    cleanup_query = """
    DELETE FROM heart_data
    WHERE timestamp < NOW() - INTERVAL '7 days';
    """

    result = pg_hook.run(cleanup_query, autocommit=True)

    return "Cleanup completed"


# Define tasks
task_extract = PythonOperator(
    task_id='extract_vitals_data',
    python_callable=extract_vitals_data,
    dag=dag
)

task_analyze = PythonOperator(
    task_id='analyze_vitals',
    python_callable=analyze_vitals,
    dag=dag
)

task_aggregate = PythonOperator(
    task_id='aggregate_hourly_data',
    python_callable=aggregate_hourly_data,
    dag=dag
)

task_alerts = PythonOperator(
    task_id='generate_alerts',
    python_callable=generate_alerts,
    dag=dag
)

task_cleanup = PythonOperator(
    task_id='cleanup_old_data',
    python_callable=cleanup_old_data,
    dag=dag
)

# Define dependencies
task_extract >> task_analyze >> [task_aggregate, task_alerts]
task_aggregate >> task_cleanup