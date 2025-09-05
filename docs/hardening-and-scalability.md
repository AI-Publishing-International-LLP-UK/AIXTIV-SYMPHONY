# Hardening and Scalability Testing for 20M+ Pilots

This document outlines the procedures for hardening the security, API, and scalability of the voice and artifact management systems to support over 20 million pilots. It also details the self-healing and failover routines designed to ensure high availability under live load.

## 1. Running the Load Test

### Prerequisites

1.  **Install k6**: Follow the instructions at [https://k6.io/docs/getting-started/installation/](https://k6.io/docs/getting-started/installation/) to install k6 on your local machine.
2.  **MongoDB Connection**: Ensure you have a valid MongoDB connection string for the `aixtiv_symphony` database.
3.  **Authentication Token**: Obtain a valid SallyPort session token for authentication.

### Running the Test

Execute the following command from the `integration-gateway` directory to run the load test:

```bash
# Set environment variables
export MONGODB_CONNECTION_STRING="your_mongodb_connection_string"
export AUTH_TOKEN="your_sallyport_session_token"

# Run the k6 load test
k6 run load-testing/voice-assignment-load-test.js
```

### Monitoring

The load test will output real-time metrics to the console. For more detailed monitoring, you can stream the metrics to a time-series database like InfluxDB or Prometheus and visualize them with Grafana.

## 2. Self-Healing and Failover Routines

The system is designed with the following self-healing and failover mechanisms to ensure high availability and resilience:

### Circuit Breaker

*   **Provider**: `opossum`
*   **Functionality**: The circuit breaker monitors the health of external services (GoDaddy, LinkedIn, Blockchain). If a service becomes unavailable or starts returning a high rate of errors, the circuit breaker will open, preventing further requests to that service and allowing it to recover.
*   **Fallback**: When the circuit breaker is open, the system will automatically fall back to a secondary provider or a cached response, if available.

### Rate Limiting

*   **Provider**: `express-rate-limit`
*   **Functionality**: The system implements rate limiting on all API endpoints to prevent abuse and ensure fair usage. If a client exceeds the rate limit, they will receive a `429 Too Many Requests` error and will be temporarily blocked.

### Exponential Backoff and Retries

*   **Provider**: `async-retry`
*   **Functionality**: The system uses an exponential backoff and retry strategy for failed requests. This helps to prevent cascading failures and allows the system to recover gracefully from transient errors.

### Health Checks

*   **Endpoint**: `/health`
*   **Functionality**: The health check endpoint provides a real-time status of the API, including the version, timestamp, and the health of all integrated services. This endpoint can be used by monitoring systems to automatically detect and respond to service disruptions.

### Horizontal Scaling

*   **Provider**: Google Cloud Run
*   **Functionality**: The system is deployed on Google Cloud Run, which automatically scales the number of instances up or down based on the incoming traffic. This ensures that the system can handle large fluctuations in load without manual intervention.

### Data Backups and Recovery

*   **Provider**: MongoDB Atlas / Google Cloud Storage
*   **Functionality**: The system performs regular backups of the MongoDB database and all user data to Google Cloud Storage. In the event of a critical failure, the system can be restored from a recent backup with minimal data loss.

