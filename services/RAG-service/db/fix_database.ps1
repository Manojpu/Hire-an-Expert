# Simple PowerShell script to fix the database file
Copy-Item "database.py" "database_backup.py"
Remove-Item "database.py" 
Rename-Item "database_new.py" "database.py"
Write-Host "Database file fixed successfully!"