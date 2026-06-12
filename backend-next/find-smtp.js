const dns = require('dns').promises;

async function findSMTPServers() {
  console.log('Searching for SMTP servers for allinbangla.com...\n');
  
  const hosts = [
    'mail.allinbangla.com',
    'smtp.allinbangla.com',
    'allinbangla.com',
    'mx1.allinbangla.com'
  ];
  
  const ports = [587, 465, 25, 2525];
  
  for (const host of hosts) {
    console.log(`\nTrying ${host}...`);
    try {
      const addresses = await dns.resolve4(host);
      console.log(`  ✅ DNS resolves to: ${addresses.join(', ')}`);
      console.log(`  Try these combinations:`);
      ports.forEach(port => {
        const secure = port === 465 ? 'true' : 'false';
        console.log(`    - Port ${port}, SMTP_SECURE=${secure}`);
      });
    } catch (err) {
      console.log(`  ❌ DNS lookup failed: ${err.message}`);
    }
  }
  
  console.log('\n\nAlternative: Check your hosting control panel (cPanel/Plesk) for:');
  console.log('  - Mail Settings → SMTP Server');
  console.log('  - Email Accounts → Configure Mail Client');
}

findSMTPServers();
