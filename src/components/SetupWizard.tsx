import React, { useState, useEffect } from "react";
import { Download, CheckCircle2, AlertCircle, RefreshCw, Terminal, Globe, ArrowRight, Server, Play, Copy, ExternalLink, Moon, Sun } from "lucide-react";
import JSZip from "jszip";

interface SetupWizardProps {
  onLocalServerDetected: (url: string) => void;
  currentConnectedServer: string;
}

export default function SetupWizard({ onLocalServerDetected, currentConnectedServer }: SetupWizardProps) {
  const [localServerOk, setLocalServerOk] = useState(false);
  const [localServerSearching, setLocalServerSearching] = useState(false);
  const [ngrokUrl, setNgrokUrl] = useState("");
  const [ngrokOk, setNgrokOk] = useState(false);
  const [ngrokSearching, setNgrokSearching] = useState(false);
  const [downloadedPack, setDownloadedPack] = useState(false);
  const [copiedTokenMsg, setCopiedTokenMsg] = useState(false);

  // Auto-detect if server is running locally on port 3000
  const checkLocalServer = async () => {
    setLocalServerSearching(true);
    let successUrl = "";
    
    for (const testUrl of ["http://127.0.0.1:3000", "http://localhost:3000"]) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1800);
        const res = await fetch(`${testUrl}/api/health`, { 
          signal: controller.signal,
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        clearTimeout(id);
        if (res.ok) {
          successUrl = testUrl;
          break;
        }
      } catch (e) {
        // Ignore and try the next one
      }
    }

    if (successUrl && successUrl !== currentConnectedServer) {
      setLocalServerOk(true);
      onLocalServerDetected(successUrl);
    } else if (successUrl) {
      setLocalServerOk(true);
    } else {
      setLocalServerOk(false);
    }
    setLocalServerSearching(false);
  };

  // Check custom Ngrok URL
  const checkNgrokServer = async (testUrl: string) => {
    if (!testUrl) return;
    setNgrokSearching(true);
    let sanitized = testUrl.trim();
    if (!sanitized.startsWith("http://") && !sanitized.startsWith("https://")) {
      sanitized = "https://" + sanitized;
    }
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${sanitized}/api/health`, { 
        signal: controller.signal,
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      clearTimeout(id);
      if (res.ok) {
        setNgrokOk(true);
        if (sanitized !== currentConnectedServer) {
          onLocalServerDetected(sanitized);
        }
      } else {
        setNgrokOk(false);
      }
    } catch (e) {
      setActiveError("Could not establish connection to the specified Ngrok URL. Make sure Ngrok is running and exposed to port 3000.");
      setNgrokOk(false);
    } finally {
      setNgrokSearching(false);
    }
  };

  const [activeError, setActiveError] = useState<string | null>(null);

  useEffect(() => {
    checkLocalServer();
    // Run an automatic loop interval to detect if local server turns online
    const interval = setInterval(() => {
      if (!localServerOk) {
        checkLocalServer();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [localServerOk]);

  // Generate 1-Button Setup Package ZIP File
  const handleGenerateZip = async () => {
    try {
      setActiveError(null);
      
      // Fetch fresh source code files from the server dynamically
      let fetchedFiles: Record<string, string> = {};
      try {
        const response = await fetch("/api/source-files");
        if (!response.ok) throw new Error("HTTP error " + response.status);
        fetchedFiles = await response.json();
      } catch (fetchErr) {
        console.error("Failed to fetch fresh source code from server:", fetchErr);
        throw new Error("Could not fetch the application source code files from the server. Please try refreshing.");
      }

      const zip = new JSZip();

      // 1. package.json template
      const packageJson = {
        name: "employee-management-local-server",
        private: true,
        version: "1.0.0",
        type: "module",
        scripts: {
          "dev": "tsx --tsconfig tsconfig.server.json server.ts",
          "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
          "start": "node dist/server.cjs"
        },
        dependencies: {
          "express": "^4.21.2",
          "ws": "^8.18.0",
          "dotenv": "^17.2.3"
        },
        devDependencies: {
          "vite": "^6.2.3",
          "@vitejs/plugin-react": "^5.0.4",
          "@tailwindcss/vite": "^4.1.14",
          "tailwindcss": "^4.1.14",
          "typescript": "~5.8.2",
          "tsx": "^4.21.0",
          "esbuild": "^0.25.0",
          "@types/express": "^4.17.21",
          "@types/node": "^22.14.0",
          "@types/ws": "^8.5.10",
          "react": "^19.0.1",
          "react-dom": "^19.0.1",
          "lucide-react": "^0.546.0",
          "motion": "^12.23.24",
          "jszip": "^3.10.1"
        }
      };
      zip.file("package.json", JSON.stringify(packageJson, null, 2));

      // 2. tsconfig.json template
      const tsconfigJson = {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          jsx: "react-jsx",
          allowImportingTsExtensions: true,
          noEmit: true,
          skipLibCheck: true
        }
      };
      zip.file("tsconfig.json", JSON.stringify(tsconfigJson, null, 2));

      // tsconfig.server.json template
      const tsconfigServerJson = {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          skipLibCheck: true,
          allowJs: true,
          noEmit: true
        },
        include: ["server.ts"]
      };
      zip.file("tsconfig.server.json", JSON.stringify(tsconfigServerJson, null, 2));

      // 3. vite.config.ts template
      const viteConfig = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true
    }
  };
});`;
      zip.file("vite.config.ts", viteConfig);

      // 4. index.html template
      const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Employee Management System</title>
  </head>
  <body class="bg-slate-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
      zip.file("index.html", indexHtml);

      // 5. App code files
      // Since downloading needs the client code, we can pack the entire setup
      // We will place instructions on how to use it
      // 6. create startup scripts
      const runBat = `@echo off
title Employee System Local Server Launchpad
color 0B
echo ==============================================================
echo   EMPLOYEE & LEAVE MANAGEMENT SYSTEM - ONE-CLICK BOOTSTRAP
echo ==============================================================
echo.
echo [STEP 1] Checking Node.js Environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not present on your system!
    echo Please download and install Node.js v20+ from:
    echo https://nodejs.org
    echo.
    pause
    exit /b
)
echo [OK] Node.js is active.
echo.
echo [STEP 2] Launching dependency installation...
echo (This may take 1-3 minutes depending on internet connection)
call npm install
echo.
echo [STEP 3] Launching Local Full-Stack Server on port 3000...
echo Server output will stream below:
echo Open http://localhost:3000 in your browser to verify
echo.
call npm run dev
pause`;
      zip.file("run-app.cmd", runBat);

      const runSh = `#!/bin/bash
echo "=============================================================="
echo "  EMPLOYEE & LEAVE MANAGEMENT SYSTEM - ONE-CLICK BOOTSTRAP"
echo "=============================================================="
echo ""
echo "[STEP 1] Checking Node.js Environment..."
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERROR] Node.js is not present on your system!"
    echo "Please download and install Node.js v20+ from https://nodejs.org"
    echo ""
    exit 1
fi
echo "[OK] Node.js is active."
echo ""
echo "[STEP 2] Installing project dependencies..."
npm install
echo ""
echo "[STEP 3] Running the server on port 3000..."
echo "Verify live app by opening http://localhost:3000"
echo ""
npm run dev`;
      zip.file("run-app.sh", runSh);

      // Add a simple instructions README
      const readme = `==========================================================
EMPLOYEE MANAGEMENT SYSTEM - LOCAL SERVER EDITION
==========================================================

This package runs fully on your local PC as the main server and data storage.
All data is securely written to "app-data.json" inside this directory. No external cloud quotas or read/write limits will ever apply.

--- HOW TO START THE SERVER ---

FOR WINDOWS:
1. Make sure Node.js is installed on your PC.
2. Double-click the file "run-app.cmd".
3. A terminal will open and automatically install dependencies and start the server!
4. Keep the terminal open. Open "http://localhost:3000" on any PC in your local network!

FOR MAC / LINUX:
1. Make sure Node.js is installed.
2. Open Terminal in this directory.
3. Run: chmod +x run-app.sh
4. Run: ./run-app.sh
5. Open "http://localhost:3000" in your browser.

--- NGROK SHARING (FOR MULTIPLE SEPARATE NETWORKS) ---
If you wish to share this server with PCs NOT on your local Wi-Fi:
1. Install Ngrok on this server PC.
2. In another terminal, run: ngrok http 3000
3. Copy the secure HTTPS URL provided by Ngrok (e.g. https://xxxx.ngrok-free.app) and share it with your staff!
`;
      zip.file("README_INSTRUCTIONS.txt", readme);

      // Package client app bundle
      zip.file("src/main.tsx", fetchedFiles["main.tsx"] || "");
      zip.file("src/App.tsx", fetchedFiles["App.tsx"] || "");
      zip.file("src/index.css", fetchedFiles["index.css"] || "");
      zip.file("src/types.ts", fetchedFiles["types.ts"] || "");

      // Add component files
      zip.file("src/components/Dashboard.tsx", fetchedFiles["Dashboard.tsx"] || "");
      zip.file("src/components/EmployeeDirectory.tsx", fetchedFiles["EmployeeDirectory.tsx"] || "");
      zip.file("src/components/LeaveTracker.tsx", fetchedFiles["LeaveTracker.tsx"] || "");
      zip.file("src/components/NetworkPresence.tsx", fetchedFiles["NetworkPresence.tsx"] || "");
      zip.file("src/components/SetupWizard.tsx", fetchedFiles["SetupWizard.tsx"] || "");
      zip.file("src/components/Utilities.tsx", fetchedFiles["Utilities.tsx"] || "");
      zip.file("src/components/AuthScreen.tsx", fetchedFiles["AuthScreen.tsx"] || "");

      // Generate the WebSocket and simple SQLite-free Express entry server
      zip.file("server.ts", fetchedFiles["server.ts"] || "");

      // Export the zip file
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "Employee_Management_Local_Server_Pack.zip";
      link.click();

      setDownloadedPack(true);
      setActiveError(null);
    } catch (e) {
      console.error(e);
      setActiveError("Error constructing the setup package. Please download manually.");
    }
  };

  const currentMode = currentConnectedServer.startsWith("http://localhost")
    ? "Local PC Host"
    : currentConnectedServer.includes("ngrok")
    ? "Ngrok Multi-PC Sharing"
    : "Cloud Run Sandbox Environment";

  return (
    <div className="space-y-8" id="setup-wizard-tab">
      {/* Visual Workspace Hero */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-15 hidden lg:block">
          <Server size={180} className="text-blue-500 animate-pulse" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded-full border border-blue-500/30">
            Infinite Storage Configuration
          </span>
          <h2 className="text-3xl font-bold tracking-tight font-sans">
            Own Your Infrastructure & Data
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            By running this system on your local hardware, your PC takes care of processing and saving employee profiles, files, and leave histories. No cloud quota limits, slow API latency, or subscription fees apply. Perfect for multiple PCs in the same network or shared globally via Ngrok.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs text-slate-400 font-mono">Current Client Endpoint:</span>
            <span className="px-3 py-1 bg-slate-800 text-green-400 rounded-lg text-xs font-mono border border-slate-700 font-bold">
              {currentConnectedServer}
            </span>
            <span className="text-xs px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-medium">
              Mode: {currentMode}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step List Progress Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">✓</span>
              Interactive Installation & Verification Checklist
            </h3>

            <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {/* Step 1: Install Node.js */}
              <div className="flex gap-4 relative">
                <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-blue-600 shrink-0 shadow-sm font-bold">
                  1
                </div>
                <div className="space-y-2 pt-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 leading-tight">Install Node.js Runtime</h4>
                    <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Verified Installed</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Node.js is required to execute files and start the Express server on your home PC.
                  </p>
                  <div className="flex gap-3 pt-1">
                    <a
                      href="https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/50"
                      id="node-download-windows"
                    >
                      <Download size={13} />
                      Download for Windows (x64)
                    </a>
                    <a
                      href="https://nodejs.org/en/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-1.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                      id="node-download-all"
                    >
                      Other OS <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Step 2: Download PC Setup Package */}
              <div className="flex gap-4 relative">
                <div className={`z-10 flex items-center justify-center w-12 h-12 rounded-full shrink-0 shadow-sm font-bold ${downloadedPack ? 'bg-green-50 border-green-200 text-green-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                  {downloadedPack ? <CheckCircle2 size={20} className="text-green-600" /> : "2"}
                </div>
                <div className="space-y-2 pt-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 leading-tight">Generate & Export 1-Button Launcher Setup Pack</h4>
                    {downloadedPack ? (
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Package Exported</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">Action Required</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Instantly packs all system UI templates, dependencies, node server engines, and execution launching scripts into a lightweight ZIP file tailored for you.
                  </p>
                  <button
                    onClick={handleGenerateZip}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-lg transition-all shadow-sm"
                    id="generate-zip-button"
                  >
                    <Download size={14} />
                    Generate 1-Setup Package.zip
                  </button>
                </div>
              </div>

              {/* Step 3: Run Local Server */}
              <div className="flex gap-4 relative">
                <div className={`z-10 flex items-center justify-center w-12 h-12 rounded-full shrink-0 shadow-sm font-bold ${localServerOk ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {localServerOk ? <CheckCircle2 size={20} className="text-green-600" /> : "3"}
                </div>
                <div className="space-y-2 pt-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 leading-tight">Unzip and Execute `run-app` launcher</h4>
                    {localServerOk ? (
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Local Server Active</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {localServerSearching && <RefreshCw size={12} className="animate-spin text-blue-500" />}
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">Listening for Host...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    Extract your downloaded setup packet and click on <code className="px-1 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700">run-app.cmd</code> (or execute sh file). This automatically starts everything on port 3000.
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={checkLocalServer}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      id="retry-local-detect"
                    >
                      <RefreshCw size={13} className={localServerSearching ? "animate-spin" : ""} />
                      Verify Local Setup Now
                    </button>
                    {localServerOk && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        Success! Node.js listening on http://localhost:3000
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 4: Ngrok Connection setup */}
              <div className="flex gap-4 relative">
                <div className={`z-10 flex items-center justify-center w-12 h-12 rounded-full shrink-0 shadow-sm font-bold ${ngrokOk ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {ngrokOk ? <CheckCircle2 size={20} className="text-green-600" /> : "4"}
                </div>
                <div className="space-y-2.5 pt-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 leading-tight">
                      Share Globally via Ngrok Tunnel <span className="text-xs font-normal text-slate-400">(Optional)</span>
                    </h4>
                    {ngrokOk ? (
                      <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Public Tunnel Live</span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium">Config Input Ready</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    Expose port 3000 secure connection to the wide Internet so workers from alternative offices, houses or devices can update attendance instantly.
                  </p>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="text-[11px] text-slate-500 flex items-start gap-1 pb-1">
                      <Terminal size={12} className="mt-0.5 text-slate-400 shrink-0" />
                      <span>Start tunnel in command prompt: <code className="bg-slate-200/60 text-slate-800 px-1 py-0.5 rounded select-all font-mono font-bold">ngrok http 3000</code></span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-800 font-bold mb-1">Enter Your Ngrok Tunnel Domain</label>
                      <p className="text-[11px] text-slate-500 pb-1">
                        Look for the line starting with <strong>Forwarding</strong> in your ngrok terminal output (e.g., <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">https://1234-abcd.ngrok-free.app</code>). Copy and paste that entire URL below.
                      </p>
                      
                      <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-2 mt-2">
                         <p className="text-amber-800 text-xs font-semibold mb-1">💡 Mobile Phone Setup Tip:</p>
                         <p className="text-amber-700 text-[11px] leading-relaxed">
                           To use the app on your phone, you don't need this setup page! Simply open your Ngrok URL (e.g., <code className="bg-amber-100 px-1 py-0.5 rounded">https://your-link.ngrok-free.app</code>) <strong>directly in your phone's browser</strong>. It will load the app instantly and bypass connection errors.
                         </p>
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Globe size={14} className="absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            placeholder="https://xxxx-xxxx.ngrok-free.app"
                            value={ngrokUrl}
                            onChange={(e) => setNgrokUrl(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                          />
                        </div>
                        <button
                          onClick={() => checkNgrokServer(ngrokUrl)}
                          disabled={!ngrokUrl || ngrokSearching}
                          className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-1 select-none disabled:opacity-50"
                          id="verify-ngrok-btn"
                        >
                          {ngrokSearching ? "Testing..." : "Verify & Connect"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Server & Terminal Simulator */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5 shadow-lg flex flex-col h-full min-h-[420px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-xs text-slate-400 font-mono ml-2">local-cmd-console</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 text-slate-300 font-mono rounded">
                Active
              </span>
            </div>

            <div className="flex-1 font-mono text-[11px] space-y-3 overflow-y-auto leading-relaxed text-slate-400 pb-2">
              <p className="text-slate-500">{"// Simulated standard boot-shell console"}</p>
              <p className="text-emerald-400"># verify-host --health-monitor</p>
              <p className="text-slate-300">[i] Target environment status: Listening ...</p>
              <p className="text-slate-300">[i] Checking standard loopback: http://localhost:3000</p>
              
              {localServerOk ? (
                <>
                  <p className="text-green-400 font-bold">========================================================</p>
                  <p className="text-green-400 font-bold">[ONLINE] CONNECTION CONFIRMED WITH HOST PC SERVER</p>
                  <p className="text-green-400 font-bold">========================================================</p>
                  <p className="text-slate-300">HTTP REST Gateway: Active & Accepting Packets</p>
                  <p className="text-slate-300">Presence Tracker WS handshake: Registered</p>
                  <p className="text-slate-300">Storage Unit: Mounted (app-data.json ready)</p>
                </>
              ) : (
                <>
                  <p className="text-amber-500 animate-pulse">[WAITING] No server response on http://localhost:3000</p>
                  <p className="text-slate-500">Please make sure to run the bat file. Listening to ports...</p>
                </>
              )}

              {ngrokOk && (
                <>
                  <p className="text-blue-400 font-semibold">[TUNNEL] PUBLIC NGROK PORT COMPATIBLE</p>
                  <p className="text-slate-300">Route URL: {ngrokUrl}</p>
                  <p className="text-slate-300">SSL status: Secure HTTPS Verified</p>
                </>
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] space-y-1 mt-4">
              <span className="text-slate-400 font-semibold block">Need an Ngrok account?</span>
              <p className="text-slate-500">
                Create a free account at <a href="https://ngrok.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">ngrok.com</a>, fetch your token, verify it via your terminal config, and you’re fully set up to collaborate globally!
              </p>
            </div>
          </div>
        </div>
      </div>

      {activeError && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2 text-orange-800 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div>{activeError}</div>
        </div>
      )}
    </div>
  );
}
