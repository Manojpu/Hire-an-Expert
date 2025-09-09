# PowerShell script to populate sample gig data
$baseUrl = "http://localhost:8002"

# Sample gig 1
$gig1 = @{
    name = "John Silva"
    title = "Senior Automobile Mechanic & Advisor"
    bio = "With over 15 years of experience in automobile maintenance and repair, I provide expert advice on vehicle issues, maintenance schedules, and buying decisions."
    profile_image_url = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    banner_image_url = "https://images.unsplash.com/photo-1486754735734-325b5831c3ad?w=400&h=200&fit=crop"
    languages = @("English", "Sinhala")
    category = "automobile-advice"
    service_description = "I offer comprehensive automobile consultation including engine diagnostics, maintenance planning, vehicle purchase advice, and troubleshooting common car problems."
    hourly_rate = 2500
    currency = "LKR"
    availability_preferences = "Monday to Friday, 9 AM to 6 PM"
    education = "Diploma in Automotive Technology from SLIATE"
    experience = "15+ years in automobile industry, worked with major service centers"
    certifications = @()
    government_id_url = ""
    professional_license_url = ""
    references = "Available upon request"
    background_check_consent = $true
} | ConvertTo-Json -Depth 10

# Sample gig 2
$gig2 = @{
    name = "Sarah Chen"
    title = "Electronics & Technology Consultant"
    bio = "Electronics engineer specializing in consumer electronics, smart home systems, and mobile device troubleshooting. Helping you make informed tech decisions."
    profile_image_url = "https://images.unsplash.com/photo-1494790108755-2616b2ca6e44?w=150&h=150&fit=crop&crop=face"
    banner_image_url = "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop"
    languages = @("English", "Mandarin")
    category = "electronic-device-advice"
    service_description = "Expert guidance on smartphone issues, laptop performance optimization, smart home setup, and electronics purchasing decisions."
    hourly_rate = 3000
    currency = "LKR"
    availability_preferences = "Flexible hours, including weekends"
    education = "BSc Electronics Engineering from University of Moratuwa"
    experience = "8 years in consumer electronics and tech consulting"
    certifications = @()
    government_id_url = ""
    professional_license_url = ""
    references = "Former clients include tech startups and individual consumers"
    background_check_consent = $true
} | ConvertTo-Json -Depth 10

# Sample gig 3
$gig3 = @{
    name = "Michael Fernando"
    title = "Home Appliance Specialist"
    bio = "Certified technician with expertise in all major home appliances. From washing machines to refrigerators, I will help you maintain and troubleshoot your appliances."
    profile_image_url = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    banner_image_url = "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=200&fit=crop"
    languages = @("English", "Sinhala", "Tamil")
    category = "home-appliance-guidance"
    service_description = "Comprehensive home appliance consultation including maintenance tips, energy efficiency advice, and repair vs replace decisions."
    hourly_rate = 2200
    currency = "LKR"
    availability_preferences = "Monday to Saturday, 8 AM to 8 PM"
    education = "Certificate in Electrical Technology"
    experience = "12 years servicing home appliances for leading brands"
    certifications = @()
    government_id_url = ""
    professional_license_url = ""
    references = "Certified by major appliance manufacturers"
    background_check_consent = $true
} | ConvertTo-Json -Depth 10

Write-Host "Creating sample gigs..." -ForegroundColor Green

try {
    Write-Host "Creating gig 1..." -ForegroundColor Yellow
    $response1 = Invoke-RestMethod -Uri "$baseUrl/gigs/" -Method POST -Body $gig1 -ContentType "application/json"
    Write-Host "Created gig ID: $($response1.id)" -ForegroundColor Green
    
    Start-Sleep -Seconds 1
    
    Write-Host "Creating gig 2..." -ForegroundColor Yellow
    $response2 = Invoke-RestMethod -Uri "$baseUrl/gigs/" -Method POST -Body $gig2 -ContentType "application/json"
    Write-Host "Created gig ID: $($response2.id)" -ForegroundColor Green
    
    Start-Sleep -Seconds 1
    
    Write-Host "Creating gig 3..." -ForegroundColor Yellow
    $response3 = Invoke-RestMethod -Uri "$baseUrl/gigs/" -Method POST -Body $gig3 -ContentType "application/json"
    Write-Host "Created gig ID: $($response3.id)" -ForegroundColor Green
    
    Write-Host "`nSample data created successfully!" -ForegroundColor Green
    
    # Check total
    $result = Invoke-RestMethod -Uri "$baseUrl/gigs/public" -Method GET
    Write-Host "Total gigs in database: $($result.total)" -ForegroundColor Cyan
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
