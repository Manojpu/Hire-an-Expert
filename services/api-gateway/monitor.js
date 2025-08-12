const axios = require('axios');
const colors = require('colors');

// Service configuration
const services = [
  { name: 'API Gateway', url: 'http://localhost:8000/health', port: 8000 },
  { name: 'Auth Service', url: 'http://localhost:8001/', port: 8001 },
  { name: 'Gig Service', url: 'http://localhost:8002/', port: 8002 },
  { name: 'Booking Service', url: 'http://localhost:8003/', port: 8003 },
  { name: 'Payment Service', url: 'http://localhost:8004/', port: 8004 },
  { name: 'Message Service', url: 'http://localhost:8005/', port: 8005 },
  { name: 'Frontend', url: 'http://localhost:3000/', port: 3000 }
];

// Check service health
async function checkService(service) {
  try {
    const startTime = Date.now();
    const response = await axios.get(service.url, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    return {
      name: service.name,
      port: service.port,
      status: 'online',
      responseTime,
      statusCode: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      name: service.name,
      port: service.port,
      status: 'offline',
      error: error.code || error.message,
      responseTime: null
    };
  }
}

// Display service status
function displayStatus(results) {
  console.clear();
  console.log('🚀 Hire an Expert - Service Status Monitor'.cyan.bold);
  console.log('='.repeat(50));
  console.log();
  
  const timestamp = new Date().toLocaleString();
  console.log(`Last check: ${timestamp}`.gray);
  console.log();
  
  let onlineCount = 0;
  let totalCount = results.length;
  
  results.forEach(result => {
    const statusIcon = result.status === 'online' ? '✅' : '❌';
    const statusColor = result.status === 'online' ? 'green' : 'red';
    const responseTime = result.responseTime ? `(${result.responseTime}ms)` : '';
    
    console.log(`${statusIcon} ${result.name.padEnd(15)} :${result.port} ${responseTime}`[statusColor]);
    
    if (result.status === 'online') {
      onlineCount++;
      if (result.data && typeof result.data === 'object') {
        const dataStr = JSON.stringify(result.data).substring(0, 60);
        const ellipsis = dataStr.length >= 60 ? '...' : '';
        console.log(`    Response: ${dataStr}${ellipsis}`.gray);
      }
    } else {
      console.log((`    Error: ${result.error}`).red);
    }
    console.log();
  });
  
  // Summary
  const healthPercentage = Math.round((onlineCount / totalCount) * 100);
  const summaryColor = healthPercentage === 100 ? 'green' : healthPercentage >= 70 ? 'yellow' : 'red';
  
  console.log('='.repeat(50));
  console.log((`System Health: ${onlineCount}/${totalCount} services online (${healthPercentage}%)`)[summaryColor]);
  
  if (healthPercentage < 100) {
    console.log();
    console.log('💡 Troubleshooting Tips:'.yellow.bold);
    
    results.forEach(result => {
      if (result.status === 'offline') {
        console.log(`   • ${result.name}: Check if service is running on port ${result.port}`.yellow);
        
        switch (result.name) {
          case 'API Gateway':
            console.log('     Command: cd services/api-gateway && npm run dev'.gray);
            break;
          case 'Message Service':
            console.log('     Command: cd services/msg-service && npm run dev'.gray);
            break;
          case 'Frontend':
            console.log('     Command: cd frontend && npm run dev'.gray);
            break;
          case 'Auth Service':
            console.log('     Command: cd services/auth-service && pipenv run python main.py'.gray);
            break;
          case 'Gig Service':
            console.log('     Command: cd services/gig-service && python main.py'.gray);
            break;
          case 'Booking Service':
            console.log('     Command: cd services/booking-service && python main.py'.gray);
            break;
          case 'Payment Service':
            console.log('     Command: cd services/payment-service && python -m app.main'.gray);
            break;
        }
        console.log();
      }
    });
  }
  
  console.log();
  console.log('Press Ctrl+C to exit monitor'.gray);
}

// Main monitoring function
async function monitorServices() {
  console.log('🔍 Starting service health monitor...'.cyan);
  console.log('Checking services every 10 seconds...'.gray);
  
  setInterval(async () => {
    try {
      const promises = services.map(service => checkService(service));
      const results = await Promise.all(promises);
      displayStatus(results);
    } catch (error) {
      console.error('Monitor error:', error.message);
    }
  }, 10000);
  
  // Initial check
  try {
    const promises = services.map(service => checkService(service));
    const results = await Promise.all(promises);
    displayStatus(results);
  } catch (error) {
    console.error('Initial check error:', error.message);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Service monitor stopped'.cyan);
  process.exit(0);
});

// Start monitoring
if (require.main === module) {
  monitorServices();
}

module.exports = { checkService, services };
