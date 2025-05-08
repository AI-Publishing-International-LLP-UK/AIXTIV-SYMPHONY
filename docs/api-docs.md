# ASOOS Integration Gateway API

**Base URL**: https://asoos-integration-gateway-859242575175.us-west1.run.app

## Endpoints

### Root (/)
- Method: GET
- Returns service information

### Health Check (/health)
- Method: GET
- Returns service health status

### Token Generation (/token)
- Method: GET
- Returns a test JWT token

### Protected Endpoint (/protected)
- Method: GET
- Headers: Authorization: Bearer TOKEN
- Returns authenticated user details
