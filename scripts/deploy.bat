@echo off
REM Rolling update deployment script for FurinaKit (Windows)
REM Usage: scripts\deploy.bat [image_tag]

setlocal

set IMAGE=%1
if "%IMAGE%"=="" set IMAGE=ghcr.io/jvwangyi/furinakit:latest

echo Starting rolling update...
echo    Image: %IMAGE%

REM Step 1: Pull new image
echo Pulling new image...
docker pull %IMAGE%
if errorlevel 1 (
    echo Failed to pull image
    exit /b 1
)

REM Step 2: Scale up to 2 instances
echo Starting new container alongside old one...
docker compose up -d --no-deps --scale furinakit=2 furinakit
if errorlevel 1 (
    echo Failed to scale up
    exit /b 1
)

REM Step 3: Get new container ID (last one)
for /f "tokens=*" %%i in ('docker compose ps -q furinakit') do set CONTAINERS=%%i
REM The last line is the new container
for /f "tokens=*" %%j in ("%CONTAINERS%") do set NEW_CONTAINER=%%j

echo New container: %NEW_CONTAINER%

REM Step 4: Wait for health check
echo Waiting for health check (max 60s)...
set WAITED=0
:health_loop
if %WAITED% GEQ 60 (
    echo Health check timeout! Rolling back...
    docker compose up -d --no-deps --scale furinakit=1 furinakit
    exit /b 1
)

for /f "tokens=*" %%s in ('docker inspect --format="{{.State.Health.Status}}" %NEW_CONTAINER% 2^>nul') do set STATUS=%%s
if "%STATUS%"=="healthy" (
    echo New container is healthy!
    goto :deploy_done
)

echo    Status: %STATUS% (%WAITED%s/60s)
timeout /t 5 /nobreak >nul
set /a WAITED=%WAITED%+5
goto :health_loop

:deploy_done

REM Step 5: Scale back to 1 (removes old container)
echo Scaling back to 1 instance...
docker compose up -d --no-deps --scale furinakit=1 furinakit

REM Step 6: Reload nginx
echo Reloading nginx...
docker compose exec -T nginx nginx -s reload 2>nul

echo.
echo Rolling update complete!
echo    Version: %IMAGE%

endlocal
