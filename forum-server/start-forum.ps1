# Start the Forum System
# Author: ZhiHuClone Forum System
# Date: 2025-05-20

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Load Docker images if needed
# First check if the complete image package exists
if (Test-Path -Path ".\docker-images\forum-complete.tar") {
    # Check if images are already loaded
    $needsLoading = $false
    $requiredImages = @(
        "forum-server-api:latest",
        "postgres:14-alpine",
        "redis:7-alpine",
        "dpage/pgadmin4:latest",
        "nginx:alpine"
    )

    foreach ($image in $requiredImages) {
        if (-Not (docker image inspect $image 2>&1 | Select-String -Pattern "No such image")) {
            Write-Host "Image $image already exists" -ForegroundColor Green
        } else {
            $needsLoading = $true
            break
        }
    }

    if ($needsLoading) {
        Write-Host "Loading Docker images, please wait..." -ForegroundColor Yellow
        docker load -i .\docker-images\forum-complete.tar
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to load Docker images. Trying to build using docker-compose..." -ForegroundColor Red
            docker-compose -f docker-compose.prod.yml build
        } else {
            Write-Host "Images loaded successfully!" -ForegroundColor Green
        }
    }
} else {
    # Check for individual image file
    if (Test-Path -Path ".\forum-server.tar") {
        Write-Host "Found individual server image, loading..." -ForegroundColor Yellow
        docker load -i .\forum-server.tar
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to load server image." -ForegroundColor Red
        }
    }
}

# Start the forum system
Write-Host "Starting the forum system, please wait..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

# Check service status
Start-Sleep -Seconds 5
$services = docker-compose -f docker-compose.prod.yml ps
Write-Host "Service status:" -ForegroundColor Cyan
Write-Host $services

# Output access information
Write-Host "`nForum system started!" -ForegroundColor Green
Write-Host "`nAccess information:" -ForegroundColor Cyan
Write-Host "Forum API: http://localhost:3000" -ForegroundColor White
Write-Host "Web Interface: http://localhost:80" -ForegroundColor White
Write-Host "Database Management: http://localhost:5050" -ForegroundColor White
Write-Host "  - Email: admin@example.com" -ForegroundColor White
Write-Host "  - Password: admin" -ForegroundColor White

# Add health check
try {
    Write-Host "`nChecking API service health status..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "API service is running normally!" -ForegroundColor Green
    } else {
        Write-Host "API service returned unusual status code: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "Unable to connect to API service. Please check container logs:" -ForegroundColor Red
    Write-Host "docker logs forum-server" -ForegroundColor Yellow
}

# Error handling
if (-Not (docker ps | Select-String -Pattern "forum-server")) {
    Write-Host "`nWARNING: The forum server container is not running properly." -ForegroundColor Red
    Write-Host "Try the following troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check logs: docker logs forum-server" -ForegroundColor White
    Write-Host "2. Check if ports are already in use" -ForegroundColor White
    Write-Host "3. Restart the containers: docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
}
