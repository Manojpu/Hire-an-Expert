# Database Migration Management Script
# Use this script to handle database schema changes properly

Write-Host "=== Gig Service Database Migration Helper ===" -ForegroundColor Green
Write-Host ""

# Function to check if alembic is installed
function Test-AlembicInstalled {
    try {
        python -c "import alembic" 2>$null
        return $true
    }
    catch {
        return $false
    }
}

# Function to install alembic if not present
function Install-Alembic {
    Write-Host "Installing Alembic for database migrations..." -ForegroundColor Yellow
    pip install alembic
}

# Check and install alembic if needed
if (-not (Test-AlembicInstalled)) {
    Install-Alembic
}

# Available commands
$command = $args[0]

switch ($command) {
    "init" {
        Write-Host "Initializing database with current schema..." -ForegroundColor Yellow
        
        # Create initial migration
        alembic revision --autogenerate -m "Initial migration"
        
        # Apply the migration
        alembic upgrade head
        
        Write-Host "✓ Database initialized successfully!" -ForegroundColor Green
    }
    
    "migrate" {
        $message = if ($args[1]) { $args[1] } else { "Auto-generated migration" }
        
        Write-Host "Creating new migration: $message" -ForegroundColor Yellow
        
        # Generate migration file
        alembic revision --autogenerate -m $message
        
        Write-Host "✓ Migration file created!" -ForegroundColor Green
        Write-Host "Run 'migrate.ps1 upgrade' to apply the migration" -ForegroundColor Cyan
    }
    
    "upgrade" {
        Write-Host "Applying pending migrations..." -ForegroundColor Yellow
        
        # Apply migrations
        alembic upgrade head
        
        Write-Host "✓ Database updated successfully!" -ForegroundColor Green
    }
    
    "downgrade" {
        $revision = if ($args[1]) { $args[1] } else { "-1" }
        
        Write-Host "Downgrading database to revision: $revision" -ForegroundColor Yellow
        
        # Downgrade database
        alembic downgrade $revision
        
        Write-Host "✓ Database downgraded successfully!" -ForegroundColor Green
    }
    
    "status" {
        Write-Host "Current database migration status:" -ForegroundColor Cyan
        alembic current
        alembic history
    }
    
    "reset" {
        Write-Host "⚠️  WARNING: This will drop all tables and recreate them!" -ForegroundColor Red
        $confirmation = Read-Host "Are you sure? (yes/no)"
        
        if ($confirmation -eq "yes") {
            Write-Host "Resetting database..." -ForegroundColor Yellow
            
            # Drop all tables and recreate
            python -c "
from app.db import models, session
models.Base.metadata.drop_all(bind=session.engine)
models.Base.metadata.create_all(bind=session.engine)
print('Database reset complete!')
"
            
            # Mark database as up to date
            alembic stamp head
            
            Write-Host "✓ Database reset and marked as current!" -ForegroundColor Green
        }
        else {
            Write-Host "Reset cancelled." -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host "Usage: migrate.ps1 <command> [args]" -ForegroundColor White
        Write-Host ""
        Write-Host "Available commands:" -ForegroundColor Cyan
        Write-Host "  init              - Initialize database with current schema" -ForegroundColor White
        Write-Host "  migrate [message] - Create new migration file" -ForegroundColor White
        Write-Host "  upgrade           - Apply pending migrations" -ForegroundColor White
        Write-Host "  downgrade [rev]   - Downgrade to previous revision" -ForegroundColor White
        Write-Host "  status            - Show current migration status" -ForegroundColor White
        Write-Host "  reset             - Reset database (DANGEROUS - drops all data)" -ForegroundColor White
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Yellow
        Write-Host "  .\migrate.ps1 init" -ForegroundColor Gray
        Write-Host "  .\migrate.ps1 migrate 'Add user table'" -ForegroundColor Gray
        Write-Host "  .\migrate.ps1 upgrade" -ForegroundColor Gray
        Write-Host "  .\migrate.ps1 status" -ForegroundColor Gray
    }
}
