# Pack all Docker images
# Author: ZhiHuClone Forum System
# Date: 2025-05-20

# Create output directory if not exists
if (-Not (Test-Path -Path ".\docker-images")) {
    New-Item -ItemType Directory -Path ".\docker-images" -Force | Out-Null
}

# List of images to pack
$images = @(
    "forum-server-api:latest",
    "postgres:14-alpine",
    "redis:7-alpine",
    "dpage/pgadmin4:latest",
    "nginx:alpine"
)

# Show progress
Write-Host "Starting to pack all Docker images..." -ForegroundColor Yellow
Write-Host "This process may take a few minutes depending on image size..." -ForegroundColor Yellow

# Ensure all images are downloaded
foreach ($image in $images) {
    if (-Not (docker image inspect $image 2>&1 | Select-String -Pattern "No such image")) {
        Write-Host "Image $image exists, will be packed" -ForegroundColor Green
    } else {
        Write-Host "Image $image does not exist, trying to pull..." -ForegroundColor Yellow
        docker pull $image
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Cannot pull image $image, may need to build locally" -ForegroundColor Red
            
            # If it's API image, try to build
            if ($image -eq "forum-server-api:latest") {
                Write-Host "Trying to build forum API image..." -ForegroundColor Yellow
                docker-compose -f docker-compose.prod.yml build api
            }
        }
    }
}

# Create a single tar file containing all images
Write-Host "Creating complete Docker image package..." -ForegroundColor Yellow
docker save $images -o .\docker-images\forum-complete.tar

if ($LASTEXITCODE -eq 0) {
    # Calculate file size
    $fileSize = (Get-Item .\docker-images\forum-complete.tar).Length / 1MB
    $fileSizeRounded = [math]::Round($fileSize, 2)
    
    Write-Host "All Docker images successfully packed!" -ForegroundColor Green
    Write-Host "Output file: .\docker-images\forum-complete.tar" -ForegroundColor Cyan
    Write-Host "File size: $fileSizeRounded MB" -ForegroundColor Cyan
    Write-Host "`nUsage:" -ForegroundColor Yellow
    Write-Host "On the target machine, run the following command to load all images:" -ForegroundColor White
    Write-Host "docker load -i forum-complete.tar" -ForegroundColor White
    Write-Host "`nThen run start-forum.ps1 or start-forum.sh to start the system" -ForegroundColor White
} else {
    Write-Host "Error packing Docker images!" -ForegroundColor Red
}
