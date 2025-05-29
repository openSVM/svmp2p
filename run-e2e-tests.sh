#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}    SVM P2P Exchange E2E Test Runner    ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Default environment
ENV="local"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --env)
      ENV="$2"
      shift
      shift
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if Docker is available for Docker environment
if [ "$ENV" = "docker" ]; then
  if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker and docker-compose are required for Docker environment${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}Environment: ${ENV}${NC}"
if [ -n "$DEBUG" ]; then
  echo -e "${BLUE}Debug mode: enabled${NC}"
fi

# Create screenshots directory if it doesn't exist
mkdir -p screenshots

# Run tests based on environment
case $ENV in
  "local")
    echo -e "${BLUE}Starting local tests...${NC}"
    if [ -n "$DEBUG" ]; then
      npm run test:e2e:debug
    else
      npm run test:e2e
    fi
    ;;
  "docker")
    echo -e "${BLUE}Starting tests in Docker...${NC}"
    if [ -n "$DEBUG" ]; then
      DEBUG=true docker-compose -f docker-compose.test.yml up --build
    else
      docker-compose -f docker-compose.test.yml up --build
    fi
    ;;
  "ci")
    echo -e "${BLUE}Starting tests for CI environment...${NC}"
    # Start the Next.js dev server
    npm run dev &
    echo "Waiting for dev server to start..."
    sleep 20
    
    # Run tests with Xvfb
    if [ -n "$DEBUG" ]; then
      DEBUG=true xvfb-run --server-args="-screen 0 1280x720x24" npm run test:e2e
    else
      xvfb-run --server-args="-screen 0 1280x720x24" npm run test:e2e
    fi
    ;;
  *)
    echo -e "${RED}Unknown environment: ${ENV}${NC}"
    exit 1
    ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}Tests failed. Check the logs and screenshots for more details.${NC}"
  exit 1
fi