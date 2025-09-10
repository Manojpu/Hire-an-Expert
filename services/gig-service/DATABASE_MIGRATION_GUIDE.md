# Database Management Guide for Gig Service

## Overview

This guide explains how to properly handle database schema changes in your gig service.

## Current Issues

- Your current `main.py` drops and recreates tables on every restart
- This causes data loss every time you restart the service
- PostgreSQL ARRAY fields won't work with SQLite

## Solutions

### 1. For Local Development (Quick Fix)

If you want to use SQLite for local development:

1. Update `.env`:

```
DATABASE_URL=sqlite:///./gig_service.db
```

2. Update `models.py` to replace ARRAY with JSON:

```python
# Replace this:
languages = Column(ARRAY(String))
certifications = Column(ARRAY(String))

# With this:
languages = Column(JSON)
certifications = Column(JSON)
```

### 2. For Production (Proper Migrations)

Use the migration system I've set up:

#### Initial Setup

```bash
# Initialize database with current schema
.\migrate.ps1 init
```

#### When You Change Models

```bash
# Create migration for your changes
.\migrate.ps1 migrate "Add new field to gig table"

# Apply the migration
.\migrate.ps1 upgrade
```

#### Check Status

```bash
# See current migration status
.\migrate.ps1 status
```

## Migration Commands

### `.\migrate.ps1 init`

- Creates initial migration from current models
- Sets up database for the first time
- Use this ONCE when setting up migrations

### `.\migrate.ps1 migrate "message"`

- Creates a new migration file
- Detects changes in your models automatically
- Always provide a descriptive message

### `.\migrate.ps1 upgrade`

- Applies all pending migrations
- Updates database to latest schema
- Safe to run multiple times

### `.\migrate.ps1 downgrade [revision]`

- Rolls back to previous version
- Use with caution in production
- Can specify exact revision or use -1 for previous

### `.\migrate.ps1 status`

- Shows current database version
- Lists all available migrations
- Helps debug migration issues

### `.\migrate.ps1 reset`

- **DANGEROUS**: Drops all data
- Only use in development
- Recreates tables from scratch

## Workflow Example

1. **Initial Setup:**

```bash
.\migrate.ps1 init
```

2. **Add new field to model:**

```python
# In models.py, add new field:
class Gig(Base):
    # ... existing fields ...
    new_field = Column(String)
```

3. **Create migration:**

```bash
.\migrate.ps1 migrate "Add new_field to gig table"
```

4. **Apply migration:**

```bash
.\migrate.ps1 upgrade
```

## Best Practices

1. **Always create migrations for schema changes**
2. **Test migrations on development data first**
3. **Backup production database before major migrations**
4. **Use descriptive migration messages**
5. **Don't edit migration files manually**
6. **Keep migration files in version control**

## Troubleshooting

### "Table already exists" error

- Your database was created without migrations
- Use `.\migrate.ps1 reset` to start fresh (development only)
- Or manually mark current state: `alembic stamp head`

### Changes not detected

- Make sure you imported the model in `models.py`
- Check that the model inherits from `Base`
- Verify the model is imported in `alembic/env.py`

### Migration fails

- Check database connection
- Verify PostgreSQL is running
- Check for syntax errors in models

## File Structure After Setup

```
services/gig-service/
├── alembic/
│   ├── versions/           # Migration files
│   ├── env.py             # Alembic environment
│   └── script.py.mako     # Migration template
├── alembic.ini            # Alembic configuration
├── migrate.ps1            # Migration helper script
├── main.py                # Current (drops tables)
└── main_with_migrations.py # Updated (uses migrations)
```

## Switching from Current System

1. **Backup your data** (if any)
2. **Switch to migration-based main.py:**
   - Rename `main.py` to `main_old.py`
   - Rename `main_with_migrations.py` to `main.py`
3. **Initialize migrations:**
   ```bash
   .\migrate.ps1 init
   ```
4. **Start service normally**

## PostgreSQL vs SQLite

### PostgreSQL (Production)

- Supports ARRAY fields
- Better performance
- Network-based
- Requires connection

### SQLite (Development)

- Local file-based
- No network required
- Use JSON instead of ARRAY
- Good for testing

Choose based on your environment and needs.
