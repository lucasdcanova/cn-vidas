#!/bin/bash

# Script to run doctor photo upload tests
# Usage: ./run-doctor-upload-tests.sh

echo "=================================================="
echo "🏥 CNVidas - Doctor Photo Upload Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;36m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to run tests with nice output
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${BLUE}Running: ${test_name}${NC}"
    echo "Command: ${test_command}"
    echo "---"
    
    if eval "${test_command}"; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
        exit 1
    fi
    echo ""
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Run unit tests
echo -e "${BLUE}🧪 Unit Tests${NC}"
echo "=================================================="
run_test "Doctor Upload Integration Tests" "npm test -- server/tests/routes/doctor-upload-integration.test.ts --forceExit --silent"
run_test "Doctor Profile Upload API Tests" "npm test -- server/tests/routes/doctor-profile-upload.test.ts --forceExit --silent"

# Summary
echo "=================================================="
echo -e "${GREEN}✅ All tests passed successfully!${NC}"
echo ""
echo "To run manual API tests against a live server:"
echo "  node server/tests/test-doctor-upload.js"
echo ""
echo "To run tests with coverage:"
echo "  npm test -- --coverage server/tests/routes/"
echo "=================================================="