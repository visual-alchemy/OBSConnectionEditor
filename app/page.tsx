"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Save, Plus, Trash2, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Connection {
  id?: string
  category: string
  address: string
  show: boolean
  name: string
  additionalContent?: string
}

// Add interface type definitions for File System Access API
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write: (data: string | ArrayBuffer | ArrayBufferView | Blob) => Promise<void>;
  close: () => Promise<void>;
}

export default function Home() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([])
  const [filter, setFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [originalContent, setOriginalContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [fsApiSupported, setFsApiSupported] = useState<boolean | null>(null)
  const [isSecureContext, setIsSecureContext] = useState(false)

  useEffect(() => {
    // Filter connections based on category and search term
    let filtered = [...connections]

    if (filter !== "all") {
      filtered = filtered.filter((conn) => conn.category === filter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (conn) =>
          conn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conn.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredConnections(filtered)
  }, [connections, filter, searchTerm])

  // Add this useEffect hook after the other useEffect hooks
  useEffect(() => {
    // Check if File System Access API is supported
    const isSupported = typeof window !== 'undefined' && 
      'showSaveFilePicker' in window && 
      'showOpenFilePicker' in window;
    
    setFsApiSupported(isSupported);

    // Check if we're in a secure context (HTTPS or localhost)
    setIsSecureContext(typeof window !== 'undefined' && (window as any).isSecureContext);

    console.log(
      isSupported
        ? "File System Access API is supported in this browser!"
        : "File System Access API is not supported in this browser.",
    );

    console.log(
      typeof window !== 'undefined' && (window as any).isSecureContext
        ? "Running in a secure context (HTTPS or localhost)!"
        : "Not running in a secure context. File System Access API requires HTTPS!",
    );
  }, []);

  // Replace the loadFile function with this updated version
  const loadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true)
    console.log("Starting file load process");

    try {
      // Try to use File System Access API
      if (typeof window !== 'undefined' && 
          'showOpenFilePicker' in window && 
          (window as any).isSecureContext) {
        try {
          console.log("Using File System Access API to open file");
          // Using type assertion because TypeScript doesn't know about the File System Access API
          const showOpenFilePicker = (window as any).showOpenFilePicker;
          const [handle] = await showOpenFilePicker({
            types: [
              {
                description: "Svelte Files",
                accept: {
                  "text/javascript": [".js", ".svelte"],
                },
              },
            ],
            multiple: false,
          });

          console.log("Got file handle:", handle);
          setFileHandle(handle);
          const file = await handle.getFile();
          console.log("File obtained:", file.name);
          const text = await file.text();

          setOriginalFile(file);
          setOriginalContent(text);

          // Extract the connections array from the Svelte file
          const connectionsMatch = text.match(/let connections = \[([\s\S]*?)\];/)

          if (connectionsMatch && connectionsMatch[1]) {
            const connectionsText = connectionsMatch[1]

            // Parse the connections array
            const connectionItems: Connection[] = []
            // Updated regex to capture comments at the end of lines
            const regex = /{category:\s*['"]([^'"]*)['"]\s*,\s*address:\s*['"]([^'"]*)['"]\s*,\s*show:\s*([^,]*)\s*,\s*name:\s*['"]([^'"]*)['"]\s*([^}]*)}/g

            let match
            let id = 1
            while ((match = regex.exec(connectionsText)) !== null) {
              connectionItems.push({
                id: `conn_${id}`,
                category: match[1],
                address: match[2],
                show: match[3] === "true",
                name: match[4],
                // Store any additional content like comments
                additionalContent: match[5] || ''
              })
              id++
            }

            setConnections(connectionItems)
            setMessage({ type: "success", text: `Loaded ${connectionItems.length} connections from ${file.name}` })
          } else {
            setMessage({ type: "error", text: "Could not find connections array in the file" })
          }

          // Clear the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }

          return
        } catch (err) {
          // User cancelled or API failed, fall back to traditional method
          console.error("File System Access API failed, falling back to traditional method", err)
          if ((err as any).name !== 'AbortError') {
            setMessage({ type: "error", text: "Error using File System API: " + (err as Error).message })
          }
        }
      } else {
        console.log("File System Access API not available", { 
          apiAvailable: "showOpenFilePicker" in window, 
          secureContext: window.isSecureContext 
        });
      }

      // Traditional file loading as fallback
      const file = event.target.files?.[0]
      if (!file) return

      const text = await file.text()
      setOriginalFile(file)
      setOriginalContent(text)
      setFileHandle(null) // Reset file handle when using traditional method

      // Extract the connections array from the Svelte file
      const connectionsMatch = text.match(/let connections = \[([\s\S]*?)\];/)

      if (connectionsMatch && connectionsMatch[1]) {
        const connectionsText = connectionsMatch[1]

        // Parse the connections array
        const connectionItems: Connection[] = []
        // Updated regex to capture comments at the end of lines
        const regex = /{category:\s*['"]([^'"]*)['"]\s*,\s*address:\s*['"]([^'"]*)['"]\s*,\s*show:\s*([^,]*)\s*,\s*name:\s*['"]([^'"]*)['"]\s*([^}]*)}/g

        let match
        let id = 1
        while ((match = regex.exec(connectionsText)) !== null) {
          connectionItems.push({
            id: `conn_${id}`,
            category: match[1],
            address: match[2],
            show: match[3] === "true",
            name: match[4],
            // Store any additional content like comments
            additionalContent: match[5] || ''
          })
          id++
        }

        setConnections(connectionItems)
        setMessage({ type: "success", text: `Loaded ${connectionItems.length} connections from ${file.name}` })
      } else {
        setMessage({ type: "error", text: "Could not find connections array in the file" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error parsing file: " + (error as Error).message })
    } finally {
      setIsLoading(false)
    }
  }

  // Replace the saveToFile function with this updated version
  const saveToFile = async () => {
    setIsLoading(true)
    console.log("Starting file save process");

    try {
      // Build the new connections array by preserving structure and only updating changed properties
      // Instead of manipulating the entire content, let's work with individual lines
      const contentLines = originalContent.split('\n');
      const connectionsStartIndex = contentLines.findIndex(line => line.includes('let connections = ['));
      const connectionsEndIndex = contentLines.findIndex((line, idx) => idx > connectionsStartIndex && line.includes('];'));
      
      if (connectionsStartIndex === -1 || connectionsEndIndex === -1) {
        throw new Error("Could not find the connections array boundaries in the file");
      }
      
      // Create a map of connection lines by address and name for lookup
      const connectionLineMap = new Map();
      
      // Process each line in the connections array
      for (let i = connectionsStartIndex + 1; i < connectionsEndIndex; i++) {
        const line = contentLines[i];
        // Skip empty lines or lines that don't contain a connection object
        if (!line.includes('category:') || !line.includes('address:')) continue;
        
        // Use regex to extract connection details from the line
        const addrMatch = line.match(/address:\s*['"]([^'"]*)['"]/);
        const nameMatch = line.match(/name:\s*['"]([^'"]*)['"]/);
        
        if (addrMatch && nameMatch) {
          const addr = addrMatch[1];
          const name = nameMatch[1];
          
          // Store the line index by both address and name for flexible lookup
          connectionLineMap.set(`addr_${addr}`, i);
          connectionLineMap.set(`name_${name}`, i);
          connectionLineMap.set(`addr_name_${addr}_${name}`, i);
        }
      }
      
      console.log("Found connection lines:", connectionLineMap);
      
      // Update existing connections in place
      connections.forEach(conn => {
        // Try various ways to find the line index
        const lineIdx = connectionLineMap.get(`addr_${conn.address}`) || 
                       connectionLineMap.get(`name_${conn.name}`) || 
                       connectionLineMap.get(`addr_name_${conn.address}_${conn.name}`);
        
        if (lineIdx !== undefined) {
          const originalLine = contentLines[lineIdx];
          console.log("Found line to update:", originalLine);
          
          // Create a copy of the line for editing
          let updatedLine = originalLine;
          
          // Update category if needed, preserving spacing
          if (originalLine.includes(`category:`) && conn.category) {
            updatedLine = updatedLine.replace(/category:\s*['"]([^'"]*)['"]/g, `category: '${conn.category}'`);
          }
          
          // Update address if needed, preserving spacing
          if (originalLine.includes(`address:`) && conn.address) {
            updatedLine = updatedLine.replace(/address:\s*['"]([^'"]*)['"]/g, `address: '${conn.address}'`);
          }
          
          // Update show/visibility status, preserving spacing
          if (originalLine.includes(`show:`)) {
            updatedLine = updatedLine.replace(/show:\s*(true|false)/g, `show: ${conn.show}`);
          }
          
          // Update name if needed, preserving spacing
          if (originalLine.includes(`name:`) && conn.name) {
            updatedLine = updatedLine.replace(/name:\s*['"]([^'"]*)['"]/g, `name: '${conn.name}'`);
          }
          
          // Replace the line in the array only if changes were made
          if (updatedLine !== originalLine) {
            console.log("Updating line:", { 
              original: originalLine, 
              updated: updatedLine 
            });
            contentLines[lineIdx] = updatedLine;
          }
        } else {
          // This is a new connection that will be added
          console.log("Connection not found, will add:", conn.name);
        }
      });
      
      // Add new connections
      const newConnections = connections.filter(conn => {
        return !connectionLineMap.has(`addr_${conn.address}`) && 
               !connectionLineMap.has(`name_${conn.name}`);
      });
      
      if (newConnections.length > 0) {
        const newConnectionLines = newConnections.map(conn => 
          `    {category: '${conn.category}',   address: '${conn.address}',  show: ${conn.show},  name: '${conn.name}'}`
        );
        
        // Insert new connections before the closing bracket
        contentLines.splice(connectionsEndIndex, 0, ...newConnectionLines);
      }
      
      // Remove deleted connections
      const currentAddresses = connections.map(conn => conn.address);
      const currentNames = connections.map(conn => conn.name);
      
      // Find all lines that need to be removed (connections not in our current list)
      const linesToRemove = [];
      for (const [key, lineIdx] of connectionLineMap.entries()) {
        if (key.startsWith('addr_') && !key.includes('addr_name_')) {
          const addr = key.substring(5); // remove 'addr_' prefix
          if (!currentAddresses.includes(addr)) {
            linesToRemove.push(lineIdx);
          }
        }
      }
      
      // Remove lines from highest index to lowest to avoid shifting issues
      linesToRemove.sort((a, b) => b - a).forEach(idx => {
        contentLines.splice(idx, 1);
      });
      
      // Rebuild the file content
      const updatedText = contentLines.join('\n');
      
      // Try to use File System Access API if available and in secure context
      if (typeof window !== 'undefined' && 
          'showSaveFilePicker' in window && 
          (window as any).isSecureContext) {
        try {
          console.log("Attempting to use File System Access API to save", { 
            haveFileHandle: !!fileHandle, 
            originalFileName: originalFile?.name 
          });
          
          let handle = fileHandle;

          // If we don't have a file handle or need a new location, show the save picker
          if (!handle) {
            console.log("No file handle available, showing save picker");
            const suggestedName = originalFile ? originalFile.name : "connections.js"
            // Using type assertion because TypeScript doesn't know about the File System Access API
            const showSaveFilePicker = (window as any).showSaveFilePicker;
            handle = await showSaveFilePicker({
              suggestedName,
              types: [
                {
                  description: "JavaScript Files",
                  accept: {
                    "text/javascript": [".js", ".svelte"],
                  },
                },
              ],
            });
            
            // Add a null check after the save picker
            if (!handle) {
              console.log("Failed to get a file handle from save picker");
              throw new Error("Could not get a file handle");
            }
            
            console.log("Got new file handle from save picker");
            setFileHandle(handle);
          }

          console.log("Creating writable stream");
          // Create a writable stream and write to it
          const writable = await handle.createWritable()
          console.log("Writing content to file");
          await writable.write(updatedText)
          console.log("Closing writable stream");
          await writable.close()

          setMessage({ type: "success", text: `File saved successfully` })
          return
        } catch (err) {
          // User cancelled or API failed, fall back to traditional method
          console.error("File System Access API failed for saving, falling back to traditional method", err)

          // Only show error if it's not a user abort
          if (!(err instanceof DOMException && err.name === "AbortError")) {
            setMessage({ type: "error", text: "Error saving with File System API, falling back to download" })
          }
        }
      } else {
        console.log("File System Access API not available for saving", { 
          apiAvailable: "showSaveFilePicker" in window, 
          secureContext: window.isSecureContext 
        });
      }

      // Traditional download as fallback
      if (originalFile) {
        // Create a new file with the same name
        const newFile = new File([updatedText], originalFile.name, { type: originalFile.type })

        // Create a download link that will replace the original file
        const url = URL.createObjectURL(newFile)
        const a = document.createElement("a")
        a.href = url
        a.download = originalFile.name
        a.click()
        URL.revokeObjectURL(url)

        setMessage({ type: "success", text: `File saved successfully as ${originalFile.name}` })
      } else {
        // If no original file, just download a new one
        downloadFile()
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error saving file: " + (error as Error).message })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadFile = () => {
    // Generate the connections array as a string
    // We only use this when there's no original file, so no structure to preserve
    const connectionsText = connections
      .map(
        (conn) => {
          const additionalContent = conn.additionalContent || '';
          return `    {category: '${conn.category}',   address: '${conn.address}',  show: ${conn.show},  name: '${conn.name}'${additionalContent}}`;
        }
      )
      .join(",\n")

    // Create a blob with the content
    const blob = new Blob([`let connections = [\n${connectionsText}\n];`], { type: "text/plain" })

    // Create a download link and trigger it
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "connections.js"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setMessage({ type: "success", text: "File downloaded successfully" })
  }

  const addNewConnection = () => {
    const newConnection: Connection = {
      id: `conn_${connections.length + 1}`,
      category: "primary",
      address: "ws://192.168.0.1:4444",
      show: true,
      name: "New Connection",
    }

    setConnections([...connections, newConnection])
    setSelectedConnection(newConnection)
  }

  const updateConnection = (updatedConnection: Connection) => {
    setConnections(connections.map((conn) => (conn.id === updatedConnection.id ? updatedConnection : conn)))
    setSelectedConnection(updatedConnection)
    setMessage({ type: "success", text: "Connection updated" })
  }

  const deleteConnection = (id: string | undefined) => {
    if (!id) return

    setConnections(connections.filter((conn) => conn.id !== id))
    if (selectedConnection?.id === id) {
      setSelectedConnection(null)
    }
    setMessage({ type: "success", text: "Connection deleted" })
  }

  const toggleVisibility = (id: string | undefined) => {
    if (!id) return

    setConnections(
      connections.map((conn) => {
        if (conn.id === id) {
          const updatedConn = { ...conn, show: !conn.show }
          if (selectedConnection?.id === id) {
            setSelectedConnection(updatedConn)
          }
          return updatedConn
        }
        return conn
      }),
    )
  }

  // Add keyboard shortcut for saving (Ctrl+S or Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (!isLoading && connections.length > 0) {
          saveToFile()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [connections, isLoading, originalFile, originalContent]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">OBS Connections Editor</h1>

      {fsApiSupported !== null && (
        <div
          className={`mb-4 px-4 py-3 rounded-md text-sm ${fsApiSupported ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}
        >
          <p className="flex items-center">
            {fsApiSupported ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                <span className="font-medium">File System Access API is supported</span>
                <span className="ml-1">- You can edit files directly without downloading.</span>
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                <span className="font-medium">File System Access API is not supported</span>
                <span className="ml-1">- Files will be downloaded instead of edited in place.</span>
              </>
            )}
          </p>

          {!isSecureContext && (
            <div className="mt-2 flex items-start gap-2 text-red-700 bg-red-50 p-2 rounded border border-red-200">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                <span className="font-medium">Not running in a secure context!</span> The File System Access API
                requires HTTPS. Please access this page via HTTPS or localhost for full functionality.
              </p>
            </div>
          )}
        </div>
      )}

      {message.text && (
        <Alert
          className={`mb-4 ${message.type === "error" ? "bg-red-100 border-red-400" : "bg-green-100 border-green-400"}`}
        >
          <AlertCircle className={message.type === "error" ? "h-5 w-5 text-red-600" : "h-5 w-5 text-green-600"} />
          <AlertTitle
            className={
              message.type === "error" ? "text-red-800 font-semibold text-lg" : "text-green-800 font-semibold text-lg"
            }
          >
            {message.type === "error" ? "Error" : "Success"}
          </AlertTitle>
          <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>File Operations</CardTitle>
              <CardDescription>Load and save your connections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Load Svelte File</Label>
                <div className="flex mt-1">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".svelte,.js"
                    onChange={loadFile}
                    disabled={isLoading}
                    ref={fileInputRef}
                  />
                </div>
                {originalFile && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>Editing: {originalFile.name}</p>
                    <p className="text-xs">
                      {fileHandle
                        ? "Using File System Access API (direct edit)"
                        : "Using traditional download (will create a new file)"}
                    </p>
                  </div>
                )}
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={saveToFile}
                disabled={connections.length === 0 || isLoading}
              >
                <Save className="mr-2 h-4 w-4" /> Save File
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {originalFile ? "Saves directly to the loaded file" : "Downloads as a new file"}
              </p>

              <Button className="w-full" onClick={addNewConnection} disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" /> Add New Connection
              </Button>
            </CardContent>
          </Card>

          {selectedConnection && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Edit Connection</CardTitle>
                <CardDescription>Modify the selected connection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={selectedConnection.name}
                      onChange={(e) => setSelectedConnection({ ...selectedConnection, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={selectedConnection.address}
                      onChange={(e) => setSelectedConnection({ ...selectedConnection, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={selectedConnection.category}
                      onValueChange={(value) => setSelectedConnection({ ...selectedConnection, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                        <SelectItem value="tv">TV</SelectItem>
                        <SelectItem value="tv-backup">TV Backup</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="show">Show</Label>
                    <input
                      id="show"
                      type="checkbox"
                      checked={selectedConnection.show}
                      onChange={(e) => setSelectedConnection({ ...selectedConnection, show: e.target.checked })}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="destructive" onClick={() => deleteConnection(selectedConnection.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
                <Button onClick={() => updateConnection(selectedConnection)}>
                  <Save className="mr-2 h-4 w-4" /> Update
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Connections ({filteredConnections.length})</CardTitle>
              <CardDescription>Manage your OBS connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by name or address"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="filter">Filter by Category</Label>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                      <SelectItem value="tv">TV</SelectItem>
                      <SelectItem value="tv-backup">TV Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Show</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConnections.length > 0 ? (
                      filteredConnections.map((conn) => (
                        <TableRow key={conn.id} className={selectedConnection?.id === conn.id ? "bg-muted" : ""}>
                          <TableCell className="font-medium">{conn.name}</TableCell>
                          <TableCell>{conn.category}</TableCell>
                          <TableCell className="font-mono text-sm">{conn.address}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => toggleVisibility(conn.id)}>
                              {conn.show ? "true" : "false"}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedConnection(conn)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          {connections.length === 0
                            ? "No connections loaded. Please load a file."
                            : "No connections match your filter criteria."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Add a TypeScript declaration for the File System Access API
declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: Array<{
        description: string
        accept: Record<string, string[]>
      }>
      multiple?: boolean
    }) => Promise<FileSystemFileHandle[]>

    showSaveFilePicker?: (options?: {
      suggestedName?: string
      types?: Array<{
        description: string
        accept: Record<string, string[]>
      }>
    }) => Promise<FileSystemFileHandle>

    isSecureContext: boolean
  }

  interface FileSystemFileHandle {
    getFile: () => Promise<File>
    createWritable: () => Promise<FileSystemWritableFileStream>
  }

  interface FileSystemWritableFileStream {
    write: (data: string | BufferSource | Blob) => Promise<void>
    close: () => Promise<void>
  }
}

