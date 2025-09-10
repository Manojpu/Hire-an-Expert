# PowerShell script to approve pending gigs
$baseUrl = "http://localhost:8002"

Write-Host "Getting pending gigs..." -ForegroundColor Yellow

try {
    # Get pending gigs
    $pendingGigs = Invoke-RestMethod -Uri "$baseUrl/gigs/admin/pending" -Method GET
    
    Write-Host "Found $($pendingGigs.Count) pending gigs" -ForegroundColor Cyan
    
    foreach ($gig in $pendingGigs) {
        Write-Host "Approving gig: $($gig.name) (ID: $($gig.id))" -ForegroundColor Yellow
        
        # Approve the gig
        $approvalData = @{
            status = "active"
            admin_notes = "Auto-approved for demo purposes"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$baseUrl/gigs/admin/$($gig.id)/status" -Method PATCH -Body $approvalData -ContentType "application/json"
        Write-Host "✓ Approved: $($response.name)" -ForegroundColor Green
        
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host "`nAll gigs approved! Checking public gigs..." -ForegroundColor Green
    
    # Check public gigs now
    $publicResult = Invoke-RestMethod -Uri "$baseUrl/gigs/public" -Method GET
    Write-Host "Public gigs now available: $($publicResult.total)" -ForegroundColor Cyan
    
    foreach ($gig in $publicResult.gigs) {
        Write-Host "- $($gig.name): $($gig.title) ($($gig.category))" -ForegroundColor White
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
