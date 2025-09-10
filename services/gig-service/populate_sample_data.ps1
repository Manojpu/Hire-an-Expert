# PowerShell script to populate sample gig data
$baseUrl = "http://localhost:8002"

# Sample gig data
$sampleGigs = @(
    @{
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
    },
    @{
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
    },
    @{
        name = "Michael Fernando"
        title = "Home Appliance Specialist"
        bio = "Certified technician with expertise in all major home appliances. From washing machines to refrigerators, I'll help you maintain and troubleshoot your appliances."
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
    },
    @{
        name = "Dr. Priya Jayawardena"
        title = "Education & Career Development Coach"
        bio = "PhD in Education with 20+ years experience in academic counseling and career guidance. Helping students and professionals achieve their educational and career goals."
        profile_image_url = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"
        banner_image_url = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop"
        languages = @("English", "Sinhala")
        category = "education-career-guidance"
        service_description = "Personalized education planning, career counseling, university selection advice, and professional development strategies."
        hourly_rate = 3500
        currency = "LKR"
        availability_preferences = "Weekdays 2 PM to 8 PM, Weekends by appointment"
        education = "PhD in Educational Psychology, University of Colombo"
        experience = "20+ years in education sector, former university lecturer"
        certifications = @()
        government_id_url = ""
        professional_license_url = ""
        references = "Former students now in leading positions worldwide"
        background_check_consent = $true
    },
    @{
        name = "David Kumar"
        title = "Automotive Electronics Specialist"
        bio = "Specialized in modern vehicle electronics, ECU programming, and automotive diagnostics. Expert in hybrid and electric vehicle systems."
        profile_image_url = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face"
        banner_image_url = "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=200&fit=crop"
        languages = @("English", "Tamil")
        category = "automobile-advice"
        service_description = "Advanced automotive electronics troubleshooting, ECU diagnostics, and electric vehicle consultation."
        hourly_rate = 4000
        currency = "LKR"
        availability_preferences = "Tuesday to Saturday, 10 AM to 6 PM"
        education = "BSc Electrical Engineering, specialized automotive course from Germany"
        experience = "10 years in automotive electronics and EV systems"
        certifications = @()
        government_id_url = ""
        professional_license_url = ""
        references = "Certified by BMW and Tesla for EV diagnostics"
        background_check_consent = $true
    },
    @{
        name = "Lisa Perera"
        title = "Smart Home & IoT Consultant"
        bio = "IoT engineer helping homeowners create intelligent living spaces. Expert in home automation, security systems, and energy management."
        profile_image_url = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
        banner_image_url = "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=200&fit=crop"
        languages = @("English", "Sinhala")
        category = "electronic-device-advice"
        service_description = "Complete smart home setup, IoT device integration, home security systems, and automated energy management solutions."
        hourly_rate = 3200
        currency = "LKR"
        availability_preferences = "Flexible schedule, including evening consultations"
        education = "MSc Computer Engineering with IoT specialization"
        experience = "6 years in IoT and smart home solutions"
        certifications = @()
        government_id_url = ""
        professional_license_url = ""
        references = "Successfully automated 200+ homes in Colombo area"
        background_check_consent = $true
    }
)

Write-Host "Starting to populate sample gig data..." -ForegroundColor Green

foreach ($gig in $sampleGigs) {
    try {
        $json = $gig | ConvertTo-Json -Depth 10
        Write-Host "Creating gig for: $($gig.name)" -ForegroundColor Yellow
        
        $response = Invoke-RestMethod -Uri "$baseUrl/gigs/" -Method POST -Body $json -ContentType "application/json"
        Write-Host "✓ Created gig ID: $($response.id)" -ForegroundColor Green
        
        Start-Sleep -Milliseconds 500  # Small delay between requests
    }
    catch {
        Write-Host "✗ Error creating gig for $($gig.name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nSample data population completed!" -ForegroundColor Green
Write-Host "Checking total gigs..." -ForegroundColor Yellow

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/gigs/public" -Method GET
    Write-Host "Total gigs in database: $($result.total)" -ForegroundColor Cyan
}
catch {
    Write-Host "Error checking gigs: $($_.Exception.Message)" -ForegroundColor Red
}
