<#
Runs init_db.sql against the local Postgres service.
Usage:
  PowerShell -ExecutionPolicy Bypass -File .\setup_local_db.ps1
Or provide full psql path:
  PowerShell -ExecutionPolicy Bypass -File .\setup_local_db.ps1 -PsqlPath "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe"
#>

param(
  [string]$PsqlPath = "psql",
  [string]$DbUser = "postgres",
  [string]$SqlFile = "init_db.sql"
)

function Check-Psql {
  try {
    & $PsqlPath --version > $null 2>&1
    return $true
  } catch {
    return $false
  }
}

if (-not (Check-Psql)) {
  Write-Error "psql was not found at '$PsqlPath'. Install PostgreSQL or pass the full path via -PsqlPath."
  exit 1
}

Write-Output "Running $SqlFile as user '$DbUser'..."

# Execute the SQL file; will prompt for the postgres password if required
& $PsqlPath -U $DbUser -f $SqlFile

if ($LASTEXITCODE -ne 0) {
  Write-Error "Command failed with exit code $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Output "Done. The role/database should now exist (if run as a superuser)."
