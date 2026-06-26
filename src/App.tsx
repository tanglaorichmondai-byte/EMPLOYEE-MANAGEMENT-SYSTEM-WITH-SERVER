import React, { useState, useEffect, useRef } from "react";
import { Users, Calendar, Laptop, Server, Cpu, CheckSquare, ShieldCheck, RefreshCw, AlertCircle, Sparkles, Terminal, CheckCircle2 } from "lucide-react";
import Dashboard from "./components/Dashboard";
import EmployeeDirectory from "./components/EmployeeDirectory";
import LeaveTracker from "./components/LeaveTracker";
import NetworkPresence from "./components/NetworkPresence";
import SetupWizard from "./components/SetupWizard";
import Utilities from "./components/Utilities";
import AuthScreen from "./components/AuthScreen";
import { Employee, LeaveRequest, ClientConnection, UserAccount } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem("current_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentTab, setCurrentTab] = useState<"dashboard" | "employees" | "leaves" | "presence" | "setup" | "utilities">(
    () => {
      // Default to employees if not admin
      const savedUser = localStorage.getItem("current_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return user.role === "admin" ? "setup" : "employees";
      }
      return "setup";
    }
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<ClientConnection[]>([]);
  
  // Storage for custom host PC connection string
  const [activeServerUrl, setActiveServerUrl] = useState<string>(() => {
    return localStorage.getItem("preferred_server_url") || "";
  });
  
  // Local identity storage
  const [registeredUser, setRegisteredUser] = useState<string>(() => {
    return localStorage.getItem("reg_user") || "";
  });
  const [registeredDevice, setRegisteredDevice] = useState<string>(() => {
    return localStorage.getItem("reg_device") || "";
  });
  const [clientId] = useState(() => {
    let id = localStorage.getItem("client_uuid");
    if (!id) {
      id = "uuid-" + Math.floor(Math.random() * 10000000);
      localStorage.setItem("client_uuid", id);
    }
    return id;
  });

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem("current_user", JSON.stringify(user));
    if (user.role !== "admin") {
      setCurrentTab("employees");
    } else {
      setCurrentTab("setup");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("current_user");
  };

  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Formulate target HTTP prefix
  const getApiPrefix = () => {
    if (!activeServerUrl) return ""; // relative routing
    return activeServerUrl.trim().replace(/\/$/, "");
  };

  // 1. Fetch functions
  const loadData = async (silent = false) => {
    if (!silent && employees.length === 0) setLoading(true);
    const prefix = getApiPrefix();
    try {
      // Use a timestamp to bypass any potential browser/ngrok caching
      const ts = Date.now();
      const empRes = await fetch(`${prefix}/api/employees?t=${ts}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
      }
      
      const leaveRes = await fetch(`${prefix}/api/leaves?t=${ts}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (leaveRes.ok) {
        const data = await leaveRes.json();
        setLeaves(data);
      }
    } catch (err) {
      // Quiet fail if silent
      if (!silent) console.error("Failed to fetch full telemetry.", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 2. Setup WS listeners
  useEffect(() => {
    let reconnectTimeoutId: number | null = null;
    const prefix = getApiPrefix();
    let wsUrl = "";

    if (prefix) {
      const isNgrok = prefix.includes("ngrok-free.app") || prefix.includes("ngrok.io");
      const wsProtocol = prefix.startsWith("https:") ? "wss:" : "ws:";
      const hostOnly = prefix.replace(/^https?:\/\//, "").replace(/\/$/, "");
      wsUrl = `${wsProtocol}//${hostOnly}/ws${isNgrok ? "?ngrok-skip-browser-warning=true" : ""}`;
    } else {
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // No ngrok param needed for the cloud server itself
      wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    }

    setConnectionStatus("connecting");
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnectionStatus("connected");
      // If identifying credentials already saved, immediately register presence on connect
      if (registeredUser && registeredDevice) {
        socket.send(
          JSON.stringify({
            type: "identify",
            clientId,
            userName: registeredUser,
            computerName: registeredDevice,
          })
        );
      }
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "online-list") {
          setOnlineUsers(payload.users || []);
        } else if (payload.type === "db-updated") {
          // Live db update triggers swift fetch refresh
          loadData(true);
        }
      } catch (err) {
        console.error("Unresolvable socket structure", err);
      }
    };

    socket.onclose = () => {
      setConnectionStatus("disconnected");
      // Attempt reconnection after 10 seconds
      reconnectTimeoutId = window.setTimeout(() => {
        setReconnectCount(prev => prev + 1);
      }, 10000);
    };

    socket.onerror = (e) => {
      // Don't log as full error to metadata unless it's not a connection failure
      // Using warn instead of error to avoid polluting the 'Errors' section of the UI if it's expected during boot or setup
      console.warn(`Host PC server socket connection issue (${wsUrl}). This is normal if the server is starting or if you haven't set up the local PC yet.`);
      setConnectionStatus("disconnected");
    };

    // Load initial data
    loadData(true);

    // Start a heartbeat interval and fallback poll
    const heartbeatInterval = setInterval(async () => {
      const fetchPrefix = getApiPrefix() || window.location.origin;
      try {
        const res = await fetch(`${fetchPrefix}/api/health`, { 
          method: "GET",
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        
        if (res.ok) {
          // If we were disconnected, refresh data when we see the server is back
          if (connectionStatus !== "connected") {
            loadData(true);
          }
          
          if (socket.readyState === WebSocket.OPEN) {
             setConnectionStatus("connected");
          }
        } else {
          throw new Error("Unhealthy");
        }
      } catch (e) {
        // Only set disconnected if the socket is also not open
        if (socket.readyState !== WebSocket.OPEN) {
          setConnectionStatus("disconnected");
        }
      }
    }, 10000);

    // Background poll fallback (every 30 seconds) to ensure data is fresh even if WS fails
    const pollInterval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      socket.onopen = null;
      socket.onclose = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.close();
    };
  }, [activeServerUrl, registeredUser, registeredDevice, reconnectCount, clientId]);

  useEffect(() => {
    // Only fetch if we have an active server url, otherwise it's handled by the socket init
    if (activeServerUrl) {
      loadData(true);
    }
  }, [activeServerUrl]);

  // Support changing PC target
  const handleLocalServerDetected = (detectedUrl: string) => {
    setActiveServerUrl(detectedUrl);
    localStorage.setItem("preferred_server_url", detectedUrl);
  };

  const handleClearServerOverride = () => {
    setActiveServerUrl("");
    localStorage.removeItem("preferred_server_url");
  };

  // Handle identity registrations
  const handleIdentifyClient = (username: string, computerName: string) => {
    setRegisteredUser(username);
    setRegisteredDevice(computerName);
    localStorage.setItem("reg_user", username);
    localStorage.setItem("reg_device", computerName);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "identify",
          clientId,
          userName: username,
          computerName: computerName,
        })
      );
    }
  };

  // Data Actions
  const handleAddEmployee = async (empData: Omit<Employee, "id">) => {
    const prefix = getApiPrefix();
    try {
      const res = await fetch(`${prefix}/api/employees`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(empData),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      alert("Error saving employee to main server. Please inspect connectivity.");
    }
  };

  const handleUpdateEmployee = async (id: string, empData: Partial<Employee>) => {
    const prefix = getApiPrefix();
    try {
      const res = await fetch(`${prefix}/api/employees/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(empData),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      alert("Error saving employee edits.");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this employee? This will also wipe their leave records.")) return;
    const prefix = getApiPrefix();
    try {
      const res = await fetch(`${prefix}/api/employees/${id}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      alert("Error deleting record.");
    }
  };

  const handleCreateLeave = async (leaveData: any) => {
    const prefix = getApiPrefix();
    try {
      const res = await fetch(`${prefix}/api/leaves`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(leaveData),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      alert("Error transmitting leave application.");
    }
  };

  const handleApproveLeave = async (id: string, status: "Approved" | "Rejected") => {
    const prefix = getApiPrefix();
    try {
      const res = await fetch(`${prefix}/api/leaves/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      alert("Error processing leave decision.");
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (!confirm("Remove this leave application tracking entry?")) return;
    const prefix = getApiPrefix();
    try {
      const res = await fetch(`${prefix}/api/leaves/${id}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      alert("Error removing leave application.");
    }
  };

  if (!currentUser) {
    return (
      <AuthScreen 
        apiPrefix={getApiPrefix()} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  const availableTabs = [
    ...(currentUser.role === "admin" ? [{ id: "setup", label: "PC Server Setup Wizard", icon: Server }] : []),
    { id: "dashboard", label: "Admin Dashboard", icon: Server },
    { id: "employees", label: "Employee Directory", icon: Users },
    { id: "leaves", label: "Leave Tracking Engine", icon: Calendar },
    ...(currentUser.role === "admin" ? [
      { id: "presence", label: "Connected PCs/Users", icon: Laptop },
      { id: "utilities", label: "System Utilities", icon: ShieldCheck }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800" id="application-container">
      {/* Visual Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md bg-white/95 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                Employee Management System
              </h1>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold uppercase mt-1 block">
                Local host storage &bull; presence tracking
              </span>
            </div>
          </div>

          {/* Connected host metadata badge */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 mr-2">
               <span className="text-xs font-semibold text-slate-600">
                 Hi, {currentUser.fullName} ({currentUser.role})
               </span>
               <button 
                 onClick={handleLogout}
                 className="text-xs text-blue-600 font-bold hover:text-blue-800"
               >
                 Logout
               </button>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200 text-xs font-semibold">
              <span className={`w-1.5 h-1.5 rounded-full ${activeServerUrl ? "bg-green-500" : "bg-blue-500"}`}></span>
              <span>Target: {activeServerUrl ? `PC (${activeServerUrl})` : "Cloud (Default)"}</span>
              {activeServerUrl && (
                <button
                  onClick={handleClearServerOverride}
                  className="ml-1 text-slate-400 hover:text-red-500 font-bold hover:bg-slate-200 rounded px-1 transition-colors"
                  title="Disconnect & run on sandbox"
                  id="disconnect-override-server"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === "connected" ? "bg-green-500" : connectionStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"}`}></span>
              <span className="text-xs font-bold text-slate-600 uppercase font-mono">
                {connectionStatus === "connected" ? "Sync Connected" : connectionStatus === "connecting" ? "Sync Connecting..." : "Sync Offline"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Connection Status Notification Banner */}
        <div className={`border-t px-4 py-2 text-xs font-medium text-center transition-colors ${connectionStatus === 'connected' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
          {connectionStatus === 'connected' ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Server is successfully connected and online
              </span>
              {(window.location.hostname.includes('ngrok') || activeServerUrl.includes('ngrok')) && (
                <span className="bg-green-100 border border-green-200 text-green-800 px-2 rounded-full py-0.5 font-bold">
                   Ngrok Tunnel Active — Share this URL with other PCs/phones
                </span>
              )}
            </div>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <AlertCircle size={14} /> {connectionStatus === 'connecting' ? 'Connecting to local server...' : 'Extract your downloaded setup packet and click on run-app.cmd (or execute sh file). This automatically starts everything on port 3000.'}
            </span>
          )}
        </div>
      </header>

      {/* Primary Sub-grid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Quick tab navigator rail */}
          <div className="lg:col-span-3 space-y-4 no-print">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-1">
              <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2 font-mono">
                Workspace Controls
              </span>

              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id as any)}
                    className={`w-full py-2.5 px-3.5 text-xs font-bold rounded-xl transition-all text-left flex items-center gap-3 cursor-pointer select-none ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                    id={`nav-link-${tab.id}`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-800">
                <Sparkles size={14} className="text-blue-600 shrink-0" />
                <span className="text-xs font-bold">1-Click Local Infrastructure</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Connect your PC as the storage unit of this web application to unlock zero cloud quota overheads and total employee records confidentiality.
              </p>
            </div>
          </div>

          {/* Active View Container Area */}
          <div className="lg:col-span-9">
            {loading && employees.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-24 shadow-sm flex flex-col items-center justify-center space-y-4">
                <RefreshCw size={32} className="animate-spin text-blue-600" />
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Synchronizing telemetry data...</p>
              </div>
            ) : (
              <>
                {currentTab === "setup" && (
                  <SetupWizard
                    onLocalServerDetected={handleLocalServerDetected}
                    currentConnectedServer={activeServerUrl || `${window.location.protocol}//${window.location.host}`}
                  />
                )}
                {currentTab === "dashboard" && (
                  <Dashboard
                    employees={employees}
                    leaves={leaves}
                    onApproveLeave={handleApproveLeave}
                    onNavigateToLeaves={() => setCurrentTab("leaves")}
                    onNavigateToEmployees={() => setCurrentTab("employees")}
                  />
                )}
                {currentTab === "employees" && (
                  <EmployeeDirectory
                    employees={employees}
                    onAddEmployee={handleAddEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                  />
                )}
                {currentTab === "leaves" && (
                  <LeaveTracker
                    employees={employees}
                    leaves={leaves}
                    onCreateLeave={handleCreateLeave}
                    onApproveLeave={handleApproveLeave}
                    onDeleteLeave={handleDeleteLeave}
                  />
                )}
                {currentTab === "presence" && (
                  <NetworkPresence
                    socketConnected={connectionStatus === "connected"}
                    onlineUsers={onlineUsers}
                    onIdentify={handleIdentifyClient}
                    registeredUser={registeredUser}
                    registeredDevice={registeredDevice}
                  />
                )}
                {currentTab === "utilities" && (
                  <Utilities apiPrefix={getApiPrefix()} />
                )}
              </>
            )}
          </div>

        </div>
      </main>

      {/* Quick Footnote Info */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-[10px] text-slate-400 font-mono">
            EMPLOYEE DATABASE PORT PORTAL &bull; BUILD 1.4.0
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            SECURED ON LOCAL CLIENT COMPUTER &bull; STORAGE ENFORCED VIA APP-DATA.JSON
          </span>
        </div>
      </footer>
    </div>
  );
}
