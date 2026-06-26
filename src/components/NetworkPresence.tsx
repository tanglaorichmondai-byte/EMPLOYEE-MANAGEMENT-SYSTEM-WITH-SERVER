import React, { useState, useEffect } from "react";
import { Users, Laptop, Shield, Wifi, WifiOff, RefreshCw, Key, HelpCircle } from "lucide-react";
import { ClientConnection } from "../types";

interface NetworkPresenceProps {
  socketConnected: boolean;
  onlineUsers: ClientConnection[];
  onIdentify: (username: string, computerName: string) => void;
  registeredUser: string;
  registeredDevice: string;
}

export default function NetworkPresence({
  socketConnected,
  onlineUsers,
  onIdentify,
  registeredUser,
  registeredDevice,
}: NetworkPresenceProps) {
  const [userName, setUserName] = useState(registeredUser || "");
  const [computerName, setComputerName] = useState(registeredDevice || "");
  const [isSaved, setIsSaved] = useState(!!registeredUser);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !computerName.trim()) return;
    onIdentify(userName, computerName);
    setIsSaved(true);
  };

  const handleReset = () => {
    setIsSaved(false);
  };

  return (
    <div className="space-y-6" id="network-presence-tab">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Register Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Laptop size={18} className="text-blue-500" />
              Register This Client PC/User
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Identify your computer and workspace name so other staff members on the system can see who is online right now.
            </p>

            {isSaved ? (
              <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Client Registered Successfully</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"}`}></span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">USER NAME</span>
                    <span className="font-semibold text-slate-800 text-sm">{userName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">DEVICE IDENTIFIER</span>
                    <span className="font-semibold text-slate-800 text-sm">{computerName}</span>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full mt-2 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-all"
                  id="reset-identify"
                >
                  Change Registration
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">Username or Initials</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Richmond T., Sarah HR"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700">Computer/Location Friendly Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Lobby PC, HR Desktop, MacBook Pro"
                    value={computerName}
                    onChange={(e) => setComputerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer select-none"
                  id="submit-identify"
                >
                  Register Connection
                </button>
              </form>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Shield size={14} className="text-blue-600" />
              Infrastructure Handshake
            </h4>
            <div className="space-y-2 text-[11px] text-slate-500">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>WebSocket Status</span>
                <span className={`font-semibold flex items-center gap-1 ${socketConnected ? "text-green-600" : "text-red-500"}`}>
                  {socketConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {socketConnected ? "CONNECTED" : "DISCONNECTED"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span>Active Channels</span>
                <span className="font-semibold text-slate-700 font-mono">#presence-tracker-ws</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span>Total Online Peers</span>
                <span className="font-semibold text-slate-700 font-mono">{onlineUsers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Online Status Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[360px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users size={18} className="text-green-500" />
                    Currently Connected Users & PCs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time presence monitoring of staff connected globally or in the office.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>{onlineUsers.length} Online</span>
                </div>
              </div>

              {onlineUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <Laptop size={44} className="text-slate-200 p-1 bg-slate-50 rounded-full" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-700">No other connected workstations</h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Connect other computers in your office or provide the Ngrok link so colleagues can access the employee database in real-time.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {onlineUsers.map((client) => {
                    const localTimeStr = new Date(client.connectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={client.id}
                        className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-3.5 relative overflow-hidden group hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 border border-green-200/50 text-green-600 grow-0 shrink-0">
                          <Laptop size={18} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-slate-800 text-sm truncate">{client.username}</h4>
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <p className="truncate">Device: {client.computerName}</p>
                            <p className="font-mono text-[10px]">Client IP: {client.ip}</p>
                          </div>
                        </div>
                        <span className="absolute top-3 right-3 text-[10px] font-mono text-slate-400">
                          Since {localTimeStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed max-w-2xl">
              * Active clients update every split-second. The server is authorized to automatically drop connections and recycle memory as soon as a workstation tab closes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
