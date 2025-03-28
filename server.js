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

app.prepare().then(() => {
  // Let Next.js handle all requests
  httpsApp.all("*", (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // Start the server on port 3000
  httpsApp.listen(3000, () => {
    console.log("\x1b[32m%s\x1b[0m", "> Server started!")
    console.log("> Ready on:")
    console.log("  \x1b[36mhttps://localhost:3000\x1b[0m")
    localIPs.forEach((ip) => {
      console.log(`  \x1b[36mhttps://${ip}:3000\x1b[0m`)
    })
    console.log("> File System Access API should now work properly")
  })
})

