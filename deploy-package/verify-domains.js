#!/usr/bin/env node

const { execSync } = require('child_process');
const dns = require('dns');

// Check DNS records for subdomains
async function checkDnsRecords() {
  console.log('Verifying DNS records for asoos.2100.cool subdomains...');
  
  // Check if a domain resolves to the correct IP
  function checkDomain(domain) {
    return new Promise((resolve) => {
      dns.lookup(domain, (err, address) => {
        if (err) {
          console.log(`${domain}: Not found in DNS`);
          resolve(false);
        } else {
          const isFirebaseIP = address === '199.36.158.100';
          console.log(`${domain}: ${address} ${isFirebaseIP ? '(Firebase IP)' : '(Not Firebase IP)'}`);
          resolve(isFirebaseIP);
        }
      });
    });
  }
  
  // Check main domain and subdomains
  const mainDomain = await checkDomain('asoos.2100.cool');
  const symphonyDomain = await checkDomain('symphony.asoos.2100.cool');
  const anthologyDomain = await checkDomain('anthology.asoos.2100.cool');
  
  // Check if all domains resolve correctly
  if (mainDomain && symphonyDomain && anthologyDomain) {
    console.log('✅ All domains are correctly configured with Firebase IP.');
    return true;
  } else {
    console.log('⚠️ Some domains are not correctly configured with Firebase IP.');
    return false;
  }
}

// Run the check
checkDnsRecords()
  .then(allCorrect => {
    process.exit(allCorrect ? 0 : 1);
  })
  .catch(error => {
    console.error('Error checking DNS records:', error);
    process.exit(1);
  });
