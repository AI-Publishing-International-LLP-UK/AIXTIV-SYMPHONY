# ASOOS Integration Gateway

A secure authentication system for the ASOOS platform.

## Deployed Service

The service is live at: https://asoos-integration-gateway-859242575175.us-west1.run.app

## Available Endpoints

- `/` - Service information
- `/health` - Health check
- `/token` - Generate test token
- `/protected` - Protected endpoint (requires auth)

## Testing Authentication

```bash
# Get a token
TOKEN=$(curl -s https://asoos-integration-gateway-859242575175.us-west1.run.app/token | jq -r .token)

# Access protected endpoint
curl -H "Authorization: Bearer $TOKEN" https://asoos-integration-gateway-859242575175.us-west1.run.app/protected
```

## Deployment Options

### Cloud Run (current)
```bash
./deploy.sh
```

### Kubernetes
```bash
./deploy-k8s.sh
```

## CI/CD
GitHub Actions workflow provided in `.github/workflows/main.yml`
