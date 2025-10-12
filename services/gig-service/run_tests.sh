#!/bin/bash

# Script to run the gig service tests

# Change to the script's directory
cd "$(dirname "$0")"
cd ..

# Check if we need to install test dependencies
if [ "$1" == "--install" ] || [ "$1" == "-i" ]; then
    echo "Installing test dependencies..."
    pip install -r tests/requirements-test.txt
    shift
fi

# Default to running all tests if no arguments are provided
test_path="tests/"
if [ $# -gt 0 ]; then
    test_path="$@"
fi

# Run the tests with coverage
echo "Running tests: $test_path"
python3 -m pytest --cov=app $test_path -v

# Return the exit code from pytest
exit $?
