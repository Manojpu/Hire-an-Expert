"""
Script to run tests for the Payment Service.
"""
import pytest
import os
import sys

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    # Run tests with coverage
    pytest.main(["-v", "--cov=app", "--cov-report=term-missing"])