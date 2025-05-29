module.exports = {
  launch: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    defaultViewport: {
      width: 1280,
      height: 720
    },
    timeout: 30000, // 30 seconds timeout for browser launch
  },
  server: {
    command: process.env.CI ? 'echo "Using external server in CI"' : 'npm run dev',
    port: 3000,
    launchTimeout: 120000, // 120 seconds timeout for server launch
    usedPortAction: 'kill', // kill process if port is already in use
    debug: true
  },
  browserContext: 'default'
};