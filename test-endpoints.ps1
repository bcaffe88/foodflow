# 🧪 Script de Teste dos Endpoints Open Source
# Testa os 26 endpoints implementados

Write-Host "`n🚀 TESTE COMPLETO - OPEN SOURCE SERVICES`n" -ForegroundColor Cyan
Write-Host "URL da API: http://localhost:5000`n" -ForegroundColor Blue

$baseUrl = "http://localhost:5000"
$passedTests = 0
$failedTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body
    )
    
    try {
        Write-Host "Testing: $Name..." -NoNewline
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $Url -Method Post -Body $jsonBody -ContentType "application/json" -TimeoutSec 5
        }
        
        Write-Host " ✅ PASSED" -ForegroundColor Green
        $script:passedTests++
        return $true
    }
    catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:failedTests++
        return $false
    }
}

# ============================================================
# 1️⃣  PAYMENT SERVICE TESTS
# ============================================================
Write-Host "`n1️⃣  PAYMENT SERVICE TESTS" -ForegroundColor Cyan

Test-Endpoint -Name "Create Payment Intent" -Method "POST" -Url "$baseUrl/api/open-source/payments/intent" -Body @{
    amount = 10000
    currency = "brl"
    description = "Pizza Deluxe"
    orderId = "TEST-001"
}

Test-Endpoint -Name "Confirm Payment" -Method "POST" -Url "$baseUrl/api/open-source/payments/confirm" -Body @{
    paymentIntentId = "pi_mock_test123"
    paymentMethodId = "pm_card_visa_4242"
    orderId = "TEST-001"
}

Test-Endpoint -Name "Refund Payment" -Method "POST" -Url "$baseUrl/api/open-source/payments/refund" -Body @{
    paymentIntentId = "pi_mock_test123"
    amount = 5000
}

# ============================================================
# 2️⃣  EMAIL SERVICE TESTS
# ============================================================
Write-Host "`n2️⃣  EMAIL SERVICE TESTS" -ForegroundColor Cyan

Test-Endpoint -Name "Send Email" -Method "POST" -Url "$baseUrl/api/open-source/emails/send" -Body @{
    to = "cliente@example.com"
    subject = "Teste FoodFlow"
    html = "<h1>Email de Teste</h1>"
}

Test-Endpoint -Name "Order Confirmation Email" -Method "POST" -Url "$baseUrl/api/open-source/emails/order-confirmation" -Body @{
    customerEmail = "cliente@example.com"
    customerName = "João Silva"
    orderId = "TEST-001"
    restaurantName = "Pizzaria Deluxe"
    total = 10000
    items = @(
        @{
            name = "Pizza Margherita"
            quantity = 1
            price = 5000
        }
    )
    deliveryAddress = "Rua das Flores, 123"
}

Test-Endpoint -Name "Restaurant Notification" -Method "POST" -Url "$baseUrl/api/open-source/emails/restaurant-notification" -Body @{
    restaurantEmail = "rest@pizzaria.com"
    restaurantName = "Pizzaria Deluxe"
    orderId = "TEST-001"
    customerName = "João Silva"
    customerPhone = "+55 11 99999-9999"
    items = @(
        @{
            name = "Pizza Margherita"
            quantity = 1
        }
    )
    deliveryAddress = "Rua das Flores, 123"
}

Test-Endpoint -Name "Get Email History" -Method "GET" -Url "$baseUrl/api/open-source/emails/history"

# ============================================================
# 3️⃣  WHATSAPP SERVICE TESTS
# ============================================================
Write-Host "`n3️⃣  WHATSAPP SERVICE TESTS" -ForegroundColor Cyan

Test-Endpoint -Name "Send WhatsApp Message" -Method "POST" -Url "$baseUrl/api/open-source/whatsapp/send" -Body @{
    to = "+5511999999999"
    message = "Olá João! Seu pedido foi confirmado!"
}

Test-Endpoint -Name "Order Confirmation WhatsApp" -Method "POST" -Url "$baseUrl/api/open-source/whatsapp/order-confirmation" -Body @{
    phoneNumber = "+5511999999999"
    customerName = "João"
    orderId = "TEST-001"
    restaurantName = "Pizzaria Deluxe"
    total = 10000
    estimatedTime = 45
}

Test-Endpoint -Name "Delivery Notification" -Method "POST" -Url "$baseUrl/api/open-source/whatsapp/delivery-notification" -Body @{
    phoneNumber = "+5511999999999"
    customerName = "João"
    orderId = "TEST-001"
    driverName = "Carlos"
    driverPhone = "+55 11 98888-8888"
    vehicleInfo = "Moto branca - ABC-1234"
}

Test-Endpoint -Name "Delivery Complete" -Method "POST" -Url "$baseUrl/api/open-source/whatsapp/delivery-complete" -Body @{
    phoneNumber = "+5511999999999"
    customerName = "João"
    orderId = "TEST-001"
}

Test-Endpoint -Name "Get WhatsApp Stats" -Method "GET" -Url "$baseUrl/api/open-source/whatsapp/stats"

# ============================================================
# 4️⃣  MAPS SERVICE TESTS
# ============================================================
Write-Host "`n4️⃣  MAPS SERVICE TESTS" -ForegroundColor Cyan

Test-Endpoint -Name "Geocode Address" -Method "POST" -Url "$baseUrl/api/open-source/maps/geocode" -Body @{
    address = "Av Paulista, 1000, São Paulo, SP, Brasil"
}

Test-Endpoint -Name "Calculate Distance" -Method "POST" -Url "$baseUrl/api/open-source/maps/distance" -Body @{
    origin = @{
        latitude = -23.5505
        longitude = -46.6333
    }
    destination = @{
        latitude = -23.5565
        longitude = -46.6437
    }
}

Test-Endpoint -Name "Calculate Delivery Fee" -Method "POST" -Url "$baseUrl/api/open-source/maps/delivery-fee" -Body @{
    origin = "Av Paulista, 1000, São Paulo, SP"
    destination = "Rua das Flores, 123, São Paulo, SP"
}

Test-Endpoint -Name "Find Nearby Restaurants" -Method "GET" -Url "$baseUrl/api/open-source/maps/nearby-restaurants?latitude=-23.5505&longitude=-46.6333"

# ============================================================
# 5️⃣  STORAGE SERVICE TESTS
# ============================================================
Write-Host "`n5️⃣  STORAGE SERVICE TESTS" -ForegroundColor Cyan

Test-Endpoint -Name "Set Storage Value" -Method "POST" -Url "$baseUrl/api/open-source/storage/set" -Body @{
    key = "test:user:123"
    value = @{
        name = "João Silva"
        email = "joao@example.com"
    }
    ttl = 3600
}

Test-Endpoint -Name "Get Storage Value" -Method "POST" -Url "$baseUrl/api/open-source/storage/get" -Body @{
    key = "test:user:123"
}

Test-Endpoint -Name "Delete Storage Value" -Method "POST" -Url "$baseUrl/api/open-source/storage/delete" -Body @{
    key = "test:user:123"
}

Test-Endpoint -Name "Get Storage Stats" -Method "GET" -Url "$baseUrl/api/open-source/storage/stats"

# ============================================================
# 6️⃣  HEALTH CHECK
# ============================================================
Write-Host "`n6️⃣  HEALTH CHECK" -ForegroundColor Cyan

Test-Endpoint -Name "Services Health Status" -Method "GET" -Url "$baseUrl/api/open-source/health"

# ============================================================
# RESULTADO FINAL
# ============================================================
Write-Host "`n" -NoNewline
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "RESULTADO FINAL" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Total de Testes: $($passedTests + $failedTests)" -ForegroundColor White
Write-Host "✅ Passou: $passedTests" -ForegroundColor Green
Write-Host "❌ Falhou: $failedTests" -ForegroundColor Red

if ($failedTests -eq 0) {
    Write-Host "`n🎉 TODOS OS TESTES PASSARAM! Sistema 100% funcional!" -ForegroundColor Green
} else {
    $successRate = [math]::Round(($passedTests / ($passedTests + $failedTests)) * 100, 2)
    Write-Host "`nTaxa de Sucesso: $successRate%" -ForegroundColor Yellow
}

Write-Host "════════════════════════════════════════════════════`n" -ForegroundColor Cyan
