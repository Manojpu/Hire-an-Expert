# Seeding Utility

This package seeds the core service databases with consistent sample data built from the fixture files in `data/`.

## Prerequisites

- All microservice databases must be running and accessible from your machine.
- The `.env` files for:
  - `services/user-service-v2`
  - `services/gig-service`
  - `services/booking-service`
  - `services/payment-service`
    should contain valid connection strings. The script will respect any overrides provided via `USER_SERVICE_DATABASE_URL`, `GIG_SERVICE_DATABASE_URL`, `BOOKING_SERVICE_DATABASE_URL`, or `PAYMENT_SERVICE_DATABASE_URL` environment variables.

## Running the Seeder

From the repository root:

```bash
python -m services.seeding.seed
```

Use `--dry-run` to preview what would be inserted without committing changes, and `--verbose` to enable detailed logging output.

## Data Sources

- `data/users.csv` — list of Firebase users with roles and login metadata.
- `data/gigs.json` — category definitions and optional gig overrides.
- `data/bookings.json` / `data/payments.json` / `data/reviews.json` — additional fixtures used when generating inter-service records.

> Note: Review seeding runs only if the review database is reachable and exposes the expected schema.
