"""Custom Prometheus business metrics.

HTTP request metrics (count, latency, in-progress) are added automatically by
prometheus-fastapi-instrumentator in app/main.py. These counters track domain
events worth alerting/graphing on.
"""

from prometheus_client import Counter

sessions_started_total = Counter(
    "studysync_sessions_started_total",
    "Number of study sessions started",
)

experiment_exposures_total = Counter(
    "studysync_experiment_exposures_total",
    "Experiment exposures logged",
    labelnames=("experiment", "variant"),
)
