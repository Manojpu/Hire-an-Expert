# Gig Service Tests

This directory contains unit tests and integration tests for the Gig Service.

## Test Structure

- `unit/`: Unit tests for individual components (CRUD operations, models, etc.)
- `integration/`: Integration tests for API endpoints and inter-service communication

## Setting Up for Testing

1. Install test dependencies:

```bash
pip install -r tests/requirements-test.txt
```

2. Make sure your environment variables are configured properly. You can create a `.env.test` file with test-specific configurations.

## Running Tests

### Run All Tests

```bash
python -m pytest
```

### Run Unit Tests Only

```bash
python -m pytest tests/unit
```

### Run Integration Tests Only

```bash
python -m pytest tests/integration
```

### Run with Coverage Report

```bash
python -m pytest --cov=app tests/
```

To generate an HTML coverage report:

```bash
python -m pytest --cov=app --cov-report=html tests/
```

### Skip External Service Integration Tests

If you want to skip tests that require external services:

```bash
SKIP_EXTERNAL_TESTS=true python -m pytest
```

## Test Fixtures

Test fixtures are defined in `conftest.py` and include:

- `test_engine`: SQLAlchemy engine for in-memory SQLite database
- `db_session`: Database session for tests
- `client`: TestClient for testing FastAPI endpoints
- `test_category`: Sample category for tests
- `test_gig`: Sample gig for tests

## Continuous Integration

These tests are designed to be run in CI/CD pipelines. Make sure to include them in your CI configuration.
