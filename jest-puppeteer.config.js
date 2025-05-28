module.exports = {
  launch: {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: {
      width: 1280,
      height: 720
    }
  },
  server: {
    command: 'npm run dev',
    port: 3000,
    launchTimeout: 60000, // 60 seconds timeout for server launch
    usedPortAction: 'kill' // kill process if port is already in use
  }
};