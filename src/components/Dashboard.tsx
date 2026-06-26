import React from "react";
import { Users, Calendar, AlertCircle, Sparkles, Plus, Clock, Terminal, CheckCircle2, XCircle } from "lucide-react";
import { Employee, LeaveRequest } from "../types";

interface DashboardProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  onApproveLeave: (id: string, status: "Approved" | "Rejected") => void;
  onNavigateToLeaves: () => void;
  onNavigateToEmployees: () => void;
}

export default function Dashboard({
  employees,
  leaves,
  onApproveLeave,
  onNavigateToLeaves,
  onNavigateToEmployees,
}: DashboardProps) {
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const leaveCount = employees.filter((e) => e.status === "On Leave").length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const approvedLeavesThisMonth = leaves.filter((l) => {
    if (l.status !== "Approved") return false;
    const today = new Date();
    const leaveStart = new Date(l.startDate);
    return leaveStart.getMonth() === today.getMonth() && leaveStart.getFullYear() === today.getFullYear();
  });

  const getDepartmentStats = () => {
    const stats: Record<string, number> = {};
    employees.forEach((e) => {
      stats[e.department] = (stats[e.department] || 0) + 1;
    });
    return Object.entries(stats).map(([name, count]) => ({ name, count }));
  };

  const departmentStats = getDepartmentStats();

  return (
    <div className="space-y-8" id="dashboard-tab">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div
          onClick={onNavigateToEmployees}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm select-none cursor-pointer hover:shadow-md transition-all group"
          id="stat-card-total-employees"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Workforce</span>
              <h3 className="text-3xl font-extrabold text-slate-800">{employees.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users size={18} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            {activeCount} active in system registry
          </p>
        </div>

        {/* Current Leave */}
        <div
          onClick={onNavigateToLeaves}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm select-none cursor-pointer hover:shadow-md transition-all group"
          id="stat-card-on-leave"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">On Leave Today</span>
              <h3 className="text-3xl font-extrabold text-slate-800">{leaveCount}</h3>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Calendar size={18} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4">
            {approvedLeavesThisMonth.length} approved leaves scheduled this month
          </p>
        </div>

        {/* Pending Requests */}
        <div
          onClick={onNavigateToLeaves}
          className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm select-none cursor-pointer hover:shadow-md transition-all group"
          id="stat-card-pending"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
              <h3 className="text-3xl font-extrabold text-slate-800">{pendingLeaves.length}</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Clock size={18} />
            </div>
          </div>
          <p className="text-[11px] text-indigo-600 font-bold mt-4 flex items-center gap-1 animate-pulse">
            <AlertCircle size={12} />
            Requires active manager review
          </p>
        </div>

        {/* Department Count */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Departments</span>
              <h3 className="text-3xl font-extrabold text-slate-800">{departmentStats.length}</h3>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
              <Sparkles size={18} />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-4 truncate">
            Primary: {departmentStats.sort((a,b)=>b.count-a.count)[0]?.name || "None"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Leave Requests Approver Container */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex-1 min-h-[400px]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pending Leave Approvals</h3>
                <p className="text-xs text-slate-400">Review, approve, or reject employee leave requests in 1-Click.</p>
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg font-bold">
                {pendingLeaves.length} Urgent
              </span>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <CheckCircle2 size={44} className="text-green-500 p-1 bg-green-50 rounded-full" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-700">All leave requests processed!</h4>
                  <p className="text-xs text-slate-400 max-w-sm">No employee is currently waiting for a leave decision.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingLeaves.map((leave) => {
                  return (
                    <div
                      key={leave.id}
                      className="p-4 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 rounded-xl transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{leave.employeeName}</span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                            {leave.leaveType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>
                            Duration: <span className="font-semibold text-slate-700">{leave.startDate}</span> to{" "}
                            <span className="font-semibold text-slate-700">{leave.endDate}</span> ({leave.totalDays} Total Days)
                          </p>
                          <p className="italic text-slate-400 text-[11px]">Reason: &ldquo;{leave.reason || "Not specified"}&rdquo;</p>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => onApproveLeave(leave.id, "Rejected")}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                          id={`reject-btn-${leave.id}`}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => onApproveLeave(leave.id, "Approved")}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm"
                          id={`approve-btn-${leave.id}`}
                        >
                          Approve Leave
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Department Breakdown & Connected Server Indicators */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">Department Distribution</h3>
            {departmentStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No employees registered yet.</p>
            ) : (
              <div className="space-y-3">
                {departmentStats.map((stat) => {
                  const percentage = Math.round((stat.count / employees.length) * 100);
                  return (
                    <div key={stat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700">{stat.name}</span>
                        <span className="text-slate-500">
                          {stat.count} {stat.count === 1 ? "Staff" : "Staffs"} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800">Quick Tools</h3>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={onNavigateToEmployees}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl transition-all text-left flex justify-between items-center group"
                id="quick-add-staff"
              >
                <span>Add Employee Profile</span>
                <Plus size={14} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>
              <button
                onClick={onNavigateToLeaves}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl transition-all text-left flex justify-between items-center group"
                id="quick-request-leave"
              >
                <span>File Leave Request</span>
                <Plus size={14} className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
