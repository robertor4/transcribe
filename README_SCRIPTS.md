# Deployment Scripts

## Production Deployment

### `./deploy.sh` (Primary)
Main production deployment script. Handles:
- Git commits and pushes
- Server code updates via Git
- Docker image building
- Container orchestration
- Health checks

**Usage:**
```bash
./deploy.sh
```

## Local Development

### `./deploy-local.sh`
For testing Docker builds locally before production deployment.
- Builds Docker images locally
- Tests docker-compose configuration
- Verifies services start correctly

**Usage:**
```bash
./deploy-local.sh
```

## CI/CD

### `.github/workflows/deploy.yml`
Automated deployment via GitHub Actions
- Triggers on push to main branch
- Handles complete deployment pipeline
- No manual intervention required

## Quick Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `deploy.sh` | Production deployment | Deploying to neuralsummary.com |
| `deploy-local.sh` | Local Docker testing | Testing Docker builds before prod |
| GitHub Actions | Automated CI/CD | Automatic on git push |

## Server Details

- **Server IP**: 94.130.27.115
- **Code Location**: /opt/transcribe
- **Domain**: neuralsummary.com

## Important Notes

1. Always ensure `.env` files are properly configured on the server
2. Never commit `.env` files to Git
3. Use `deploy.sh` for all production deployments
4. Test with `deploy-local.sh` if unsure about Docker changes