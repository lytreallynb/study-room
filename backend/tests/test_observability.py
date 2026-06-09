"""Prometheus /metrics endpoint exposes HTTP + custom business metrics."""

from httpx import AsyncClient


async def test_metrics_endpoint_exposes_custom_and_http_metrics(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    # Generate some traffic + a domain event.
    await client.post("/sessions", json={}, headers=auth_headers)

    resp = await client.get("/metrics")
    assert resp.status_code == 200
    body = resp.text
    # Custom business metric is registered...
    assert "studysync_sessions_started_total" in body
    # ...and instrumentator's automatic HTTP metrics are present.
    assert "http_request" in body
