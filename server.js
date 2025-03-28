const httpsLocalhost = require("https-localhost")
const next = require("next")
const os = require("os")
const { parse } = require("url")

// Get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces()
  const addresses = []

  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push(iface.address)
      }
    }
  }

  return addresses
}

const localIPs = getLocalIPs()
console.log("Local IP addresses:", localIPs)

// Create an HTTPS app with express
const httpsApp = httpsLocalhost()

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

// Define port - use process.env.PORT if available, otherwise default to 3001
const port = process.env.PORT || 3001

app.prepare().then(() => {
  // Let Next.js handle all requests
  httpsApp.all("*", (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Start the server on the specified port
  httpsApp.listen(port, () => {
    console.log("\x1b[32m%s\x1b[0m", "> Server started!")
    console.log("> Mode:", dev ? "DEVELOPMENT" : "PRODUCTION")
    console.log("> Ready on:")
    console.log(`  \x1b[36mhttps://localhost:${port}\x1b[0m`)
    localIPs.forEach((ip) => {
      console.log(`  \x1b[36mhttps://${ip}:${port}\x1b[0m`)
    })
    console.log("> File System Access API should now work properly")
  })
})

