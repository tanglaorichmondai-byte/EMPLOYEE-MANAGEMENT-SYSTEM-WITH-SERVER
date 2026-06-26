import React, { useState } from "react";
import { Lock, User, Briefcase, Mail, ArrowRight, ShieldCheck, CheckCircle } from "lucide-react";

interface AuthScreenProps {
  apiPrefix: string;
  onLoginSuccess: (user: any) => void;
}

export default function AuthScreen({ apiPrefix, onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Registration fields
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiPrefix}/api/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${apiPrefix}/api/auth/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ email, fullName, position })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      
      setSuccessMsg(data.message);
      setMode("login");
      setFullName("");
      setPosition("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {mode === "login" ? "Sign in to your account" : "Request System Access"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{" "}
          <button 
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setSuccessMsg(null);
            }} 
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            {mode === "login" ? "request registration" : "sign in to your existing account"}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-md flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">{successMsg}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={mode === "login" ? handleLogin : handleRegister}>
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Position</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 transition-colors"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 transition-colors"
                  placeholder="admin@system.local"
                />
              </div>
            </div>

            {mode === "login" && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70"
              >
                {loading ? (
                  "Processing..."
                ) : mode === "login" ? (
                  <>Sign in <ArrowRight size={16} /></>
                ) : (
                  <>Submit Registration Request <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {mode === "login" && (
           <div className="mt-6 text-center text-xs text-slate-500 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <p className="font-bold mb-1">Demo Credentials:</p>
             <p>Admin Email: admin@system.local</p>
             <p>Password: admin</p>
           </div>
        )}
      </div>
    </div>
  );
}
