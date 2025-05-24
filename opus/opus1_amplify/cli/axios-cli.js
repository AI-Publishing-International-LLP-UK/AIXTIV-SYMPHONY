#!/usr/bin/env node

const axios = require('axios');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('method', {
    alias: 'm',
    describe: 'HTTP method',
    default: 'get',
    choices: ['get', 'post', 'put', 'delete', 'patch', 'head'],
  })
  .option('url', {
    alias: 'u',
    describe: 'URL to request',
    demandOption: true,
    type: 'string',
  })
  .option('data', {
    alias: 'd',
    describe: 'Request body data (JSON string)',
    type: 'string',
  })
  .option('headers', {
    alias: 'h',
    describe: 'Request headers (JSON string)',
    type: 'string',
  })
  .option('timeout', {
    alias: 't',
    describe: 'Request timeout in milliseconds',
    type: 'number',
    default: 5000,
  })
  .help().argv;

async function makeRequest() {
  try {
    const config = {
      method: argv.method,
      url: argv.url,
      timeout: argv.timeout,
    };

    if (argv.data) {
      try {
        config.data = JSON.parse(argv.data);
      } catch (error) {
        config.data = argv.data;
      }
    }

    if (argv.headers) {
      try {
        config.headers = JSON.parse(argv.headers);
      } catch (error) {
        console.error('Error parsing headers JSON:', error.message);
        process.exit(1);
      }
    }

    const response = await axios(config);

    console.log('\nResponse Status:', response.status);
    console.log('\nResponse Headers:');
    console.log(JSON.stringify(response.headers, null, 2));
    console.log('\nResponse Data:');
    console.log(
      typeof response.data === 'object'
        ? JSON.stringify(response.data, null, 2)
        : response.data
    );
  } catch (error) {
    console.error('\nRequest Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error(
        'Headers:',
        JSON.stringify(error.response.headers, null, 2)
      );
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error setting up request:', error.message);
    }
    process.exit(1);
  }
}

makeRequest();
