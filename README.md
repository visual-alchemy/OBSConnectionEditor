# OBS Connections Editor

A web-based editor for managing OBS connection configurations with direct file saving support.

## Features

- Edit OBS connection settings through a user-friendly interface
- Secure HTTPS support for File System Access API compatibility
- Direct file editing without downloading (when using HTTPS)
- Add, edit, and delete connections
- Filter connections by category
- Search connections by name or address

## Requirements

- Node.js (v16 or higher recommended)
- npm or pnpm package manager

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/obs-connections-editor.git
cd obs-connections-editor
```

2. Install dependencies (using npm):
```bash
npm install
```

If you encounter dependency errors, try:
```bash
npm install --legacy-peer-deps
```

Or using pnpm:
```bash
pnpm install
```

## Running the Application

### Development Mode

#### Standard Development Server (HTTP)

```bash
npm run dev
```

#### HTTPS Development Server (Recommended)

For full File System Access API support (direct file editing):

```bash
npm run dev:https
```

### Production Mode

#### Build the Application

```bash
npm run build
```

#### Run Standard Production Server (HTTP)

```bash
npm start
```

#### Run HTTPS Production Server (Recommended)

For full File System Access API support in production:

```bash
npm run start:https
```

This will start a secure HTTPS server on port 3001 (or the port specified in the PORT environment variable). You can access the application at:
- https://localhost:3001
- https://your-local-ip:3001 (for access from other devices on your network)

#### Changing the Port

You can change the port by setting the PORT environment variable:

```bash
PORT=4443 npm run start:https
```

#### Notes for HTTPS Setup

- For MacOS users: You may need to install NSS tools with `brew install nss`
- For Linux users: Install NSS tools with your package manager (e.g., `sudo apt install libnss3-tools`)
- The first time you access the HTTPS server, you might need to accept the security certificate

## Usage

1. Open the application in your browser
2. Click "Load Svelte File" to open your OBS connections file
3. Edit connections as needed
4. Click "Save File" to save changes directly to the original file (when using HTTPS) or download the updated file

## Project Structure

- `app/` - Next.js application files
  - `page.tsx` - Main editor interface
- `components/` - UI components 
- `public/` - Static assets
- `server.js` - HTTPS server configuration

## Technologies Used

- Next.js
- React
- Tailwind CSS
- File System Access API
- https-localhost package for secure development

## Troubleshooting

- **404 Error or Redirect Loop**: Make sure you're accessing the site via https://localhost:3001 not http://localhost:3001
- **File System API Not Working**: Ensure you're using an HTTPS connection and a compatible browser (Chrome, Edge or other Chromium-based browsers)
- **Cannot Install Dependencies**: Try using the `--legacy-peer-deps` flag with npm install

## License

MIT 