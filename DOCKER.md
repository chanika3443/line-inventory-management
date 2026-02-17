# Docker Deployment Guide

## Quick Start

### Build and Run with Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The app will be available at `http://localhost:8080/line-inventory-management/`

### Build and Run with Docker

```bash
# Build the image
docker build -t line-inventory-management .

# Run the container
docker run -d -p 8080:80 --name line-inventory-management line-inventory-management

# View logs
docker logs -f line-inventory-management

# Stop the container
docker stop line-inventory-management

# Remove the container
docker rm line-inventory-management
```

## Configuration

### Change Port

Edit `docker-compose.yml`:

```yaml
ports:
  - "3000:80"  # Change 8080 to your desired port
```

Or with Docker command:

```bash
docker run -d -p 3000:80 --name line-inventory-management line-inventory-management
```

### Environment Variables

Create `.env` file before building:

```env
VITE_LIFF_ID=your-liff-id
VITE_APPS_SCRIPT_URL=your-apps-script-url
```

## Production Deployment

### Build for Production

```bash
# Build the image
docker build -t line-inventory-management:latest .

# Tag for registry
docker tag line-inventory-management:latest your-registry/line-inventory-management:latest

# Push to registry
docker push your-registry/line-inventory-management:latest
```

### Deploy to Server

```bash
# Pull the image
docker pull your-registry/line-inventory-management:latest

# Run the container
docker run -d \
  -p 80:80 \
  --name line-inventory-management \
  --restart unless-stopped \
  your-registry/line-inventory-management:latest
```

## Troubleshooting

### Check container status
```bash
docker ps -a
```

### View logs
```bash
docker logs line-inventory-management
```

### Access container shell
```bash
docker exec -it line-inventory-management sh
```

### Rebuild after changes
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Notes

- The app uses multi-stage build for smaller image size
- Nginx serves the static files with gzip compression
- Static assets are cached for 1 year
- React Router is configured for SPA routing
