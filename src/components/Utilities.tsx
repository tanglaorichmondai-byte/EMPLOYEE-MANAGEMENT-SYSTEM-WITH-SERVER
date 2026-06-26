import React, { useState, useEffect } from "react";
import { Download, Database, ShieldCheck, HardDrive, RefreshCw, AlertTriangle, FileJson, CheckCircle2, Terminal, Users, Check, X } from "lucide-react";
import { UserAccount } from "../types";

interface UtilitiesProps {
  apiPrefix: string;
}

export default function Utilities({ apiPrefix }: UtilitiesProps) {
  const [backingUp, setBackingUp] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "users">("general");

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const ts = Date.now();
      const res = await fetch(`${apiPrefix}/api/users?t=${ts}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`${apiPrefix}/api/users/${userId}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error("Failed to update user status.");
    }
  };

  const handleUpdateUserRole = async (userId: string, role: "admin" | "user") => {
    try {
      const res = await fetch(`${apiPrefix}/api/users/${userId}/role`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error("Failed to update user role.");
    }
  };

  const handleApprovePasswordReset = async (userId: string) => {
    try {
      const res = await fetch(`${apiPrefix}/api/users/${userId}/approve-reset-password`, {
        method: "PUT",
        headers: { 
          "ngrok-skip-browser-warning": "true"
        }
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        console.error(data.error || "Failed to reset password.");
      }
    } catch (e) {
      console.error("Failed to reset password.");
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    setSuccess(false);
    
    try {
      // Trigger browser download by redirecting to the backup endpoint
      const backupUrl = `${apiPrefix}/api/backup`;
      
      // We use a temporary anchor to force download while keeping the user on the same page
      const link = document.createElement('a');
      link.href = backupUrl;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error("Backup trigger failed", error);
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-6" id="utilities-container">
      <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">System Utilities</h2>
              <p className="text-sm text-slate-500">Maintenance, database management, and access control.</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "general" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              General Settings
            </button>
            <button 
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === "users" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Users size={16} /> User Management
            </button>
          </div>
        </div>

        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Backup Database Card */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6 hover:border-indigo-200 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:shadow-indigo-100 transition-shadow">
                  <Database size={20} className="text-indigo-600" />
                </div>
                {success && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-1 rounded-lg animate-fadeIn">
                    <CheckCircle2 size={12} /> Backup Ready
                  </span>
                )}
              </div>
              
              <h3 className="font-bold text-slate-800 mb-2">Full Database Backup</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Downloads a complete JSON snapshot of your <strong>app-data.json</strong>. 
                This includes all employees, departments, and leave history. Useful for migrations or off-site storage.
              </p>

              <button
                onClick={handleBackup}
                disabled={backingUp}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  backingUp 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-[0.98]"
                }`}
              >
                {backingUp ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Generating Snapshot...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download Backup (.json)
                  </>
                )}
              </button>
            </div>

            {/* Data Integrity Info */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm">
                  <HardDrive size={20} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Storage Information</h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 uppercase tracking-tighter">Persistence Mode: Single File JSON</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 text-xs">
                  <FileJson size={14} className="text-amber-500" />
                  <span className="text-slate-600 font-medium">Local Data Path:</span>
                  <code className="bg-slate-50 px-1.5 py-0.5 rounded text-indigo-600 font-bold ml-auto text-[10px]">app-data.json</code>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed italic">
                    <strong>Warning:</strong> Always ensure the host PC is running during backup. Interrupted downloads might result in corrupted JSON files.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="animate-fadeIn">
            {loadingUsers ? (
              <div className="flex justify-center p-12">
                <RefreshCw size={24} className="animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Name / Email</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Position</th>
                      <th className="px-4 py-3 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{user.fullName}</div>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{user.position}</td>
                        <td className="px-4 py-3">
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value as "admin" | "user")}
                            className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.status === "approved" ? "bg-green-100 text-green-700" :
                            user.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {user.status === "pending" && (
                              <>
                                <button 
                                  onClick={() => handleUpdateUserStatus(user.id, "approved")}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Approve Request"
                                >
                                  <Check size={16} />
                                </button>
                                <button 
                                  onClick={() => handleUpdateUserStatus(user.id, "rejected")}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject Request"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            {user.status !== "pending" && !user.resetPasswordRequested && (
                              <span className="text-xs text-slate-400 italic px-2 py-1">Actioned</span>
                            )}
                            {user.resetPasswordRequested && (
                              <button 
                                onClick={() => handleApprovePasswordReset(user.id)}
                                className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg hover:bg-amber-200 transition-colors uppercase"
                                title="Approve Password Reset"
                              >
                                Reset Pass
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Terminal size={18} className="text-indigo-400" />
            Infrastructure Status
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md">
            Your connection to the host PC is currently active. All administrative actions are synced across your local area network in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              API Online
            </div>
            <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              WS Peer Sync Active
            </div>
          </div>
        </div>
        <Database size={120} className="absolute -right-4 -bottom-4 text-slate-800 opacity-50 rotate-12" />
      </div>
    </div>
  );
}
