"""
Test runner for the Gig Service.

This file allows running all tests or specific test categories.
Usage:
    - Run all tests: python -m pytest
    - Run unit tests only: python -m pytest tests/unit
    - Run integration tests only: python -m pytest tests/integration
    - Run with coverage: python -m pytest --cov=app tests/
"""

import pytest
import sys
import os

if __name__ == "__main__":
    # Add the parent directory to the path so we can import the app modules
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    
    # Default arguments to run all tests
    pytest_args = ["tests/"]
    
    # Add any command-line arguments passed to this script
    if len(sys.argv) > 1:
        pytest_args.extend(sys.argv[1:])
    
    # Run pytest with the constructed arguments
    sys.exit(pytest.main(pytest_args))
