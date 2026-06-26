import React, { useState, useEffect } from "react";
import { Plus, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, ShieldCheck, HeartPulse, User } from "lucide-react";
import { Employee, LeaveRequest } from "../types";

interface LeaveTrackerProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  onCreateLeave: (leaveData: Omit<LeaveRequest, "id" | "employeeName" | "requestedDate" | "status">) => void;
  onApproveLeave: (id: string, status: "Approved" | "Rejected") => void;
  onDeleteLeave: (id: string) => void;
}

export default function LeaveTracker({
  employees,
  leaves,
  onCreateLeave,
  onApproveLeave,
  onDeleteLeave,
}: LeaveTrackerProps) {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  // Form State
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState<"Vacation" | "Sick Leave" | "Parental" | "Unpaid" | "Other">("Vacation");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [calculatedDays, setCalculatedDays] = useState(1);

  // Recalculate duration days
  useEffect(() => {
    if (!startDate || !endDate) return;
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (e < s) {
      setCalculatedDays(0);
      return;
    }
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    setCalculatedDays(diffDays);
  }, [startDate, endDate]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || calculatedDays <= 0) return;

    onCreateLeave({
      employeeId,
      leaveType,
      startDate,
      endDate,
      totalDays: calculatedDays,
      reason,
    });

    // Reset Form
    setEmployeeId("");
    setLeaveType("Vacation");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setReason("");
    setShowApplyForm(false);
  };

  const filteredLeaves = leaves.filter((l) => {
    if (statusFilter === "All") return true;
    return l.status === statusFilter;
  });

  return (
    <div className="space-y-6" id="leave-tracker-tab">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Leave Tracking Engine</h2>
          <p className="text-xs text-slate-400">File leave requests, track approvals, and manage attendance timelines.</p>
        </div>

        <button
          onClick={() => setShowApplyForm(!showApplyForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm active:scale-95 select-none"
          id="toggle-leave-form"
        >
          {showApplyForm ? "Close Requester" : "Apply for Leave"}
        </button>
      </div>

      {showApplyForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md transition-all animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Calendar size={15} className="text-blue-500" />
            File New Leave Application
          </h3>

          <form onSubmit={handleApply} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pick Employee */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-755 text-slate-705">Select Employee Name</label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans text-slate-700"
              >
                <option value="">-- Choose registered employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Leave Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Leave Schedule Classification</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Vacation">Vacation / VL</option>
                <option value="Sick Leave">Sick Leave / SL</option>
                <option value="Parental">Maternity or Paternity</option>
                <option value="Unpaid">Unpaid Career Break</option>
                <option value="Other">Other Duty Release</option>
              </select>
            </div>

            {/* Display Days Block */}
            <div className="flex items-center justify-center bg-slate-50 rounded-xl p-3 border border-slate-200/40 text-center space-y-1 select-none">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">CALCULATED LENGTH</span>
                <span className="text-xl font-black text-blue-600 block">
                  {calculatedDays > 0 ? `${calculatedDays} Days` : "Invalid Timeline"}
                </span>
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Detailed justification/reason</label>
              <textarea
                rows={2}
                placeholder="Brief description of the request (e.g. Travel, Family occasion, Medical operation)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Close Form
              </button>
              <button
                type="submit"
                disabled={!employeeId || calculatedDays <= 0}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 select-none"
                id="submit-leave-application"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Leave Logs Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-800">Leave Application History</h3>

        <div className="flex gap-2">
          {["All", "Pending", "Approved", "Rejected"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all select-none ${
                statusFilter === filter
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
              id={`filter-leave-${filter}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* History Grid of Applicants */}
      {filteredLeaves.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <Calendar size={36} className="text-slate-200" />
          <div>
            <h4 className="text-sm font-semibold text-slate-700">No leave requests found</h4>
            <p className="text-xs text-slate-400">Apply for a leave or adjust filter parameters above.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredLeaves.map((lv) => {
            const startFormatted = new Date(lv.startDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
            const endFormatted = new Date(lv.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

            return (
              <div
                key={lv.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-slate-200 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                        <User size={14} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{lv.employeeName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Requested: {lv.requestedDate}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        lv.status === "Approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : lv.status === "Rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {lv.status}
                    </span>
                  </div>

                  <div className="bg-slate-50/70 rounded-xl p-3 text-xs space-y-2 border border-slate-200/40">
                    <div className="flex justify-between font-medium text-slate-600 text-[11px]">
                      <span>Leave Classification</span>
                      <span className="font-bold text-indigo-600">{lv.leaveType}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-mono text-[11px] border-t border-slate-200/50 pt-1.5">
                      <span>Timeline</span>
                      <span>
                        {startFormatted} - {endFormatted} ({lv.totalDays} days)
                      </span>
                    </div>
                  </div>

                  {lv.reason && (
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">Employee Comment:</span>
                      <p className="text-slate-600 text-xs italic bg-slate-50 p-2.5 rounded-lg border-l-2 border-slate-300">
                        &ldquo;{lv.reason}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onDeleteLeave(lv.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors text-xs flex items-center gap-1.5"
                    id={`delete-leave-${lv.id}`}
                  >
                    <Trash2 size={13} />
                    <span className="font-semibold text-[11px]">Wipe Request</span>
                  </button>

                  <div className="flex gap-1.5">
                    {lv.status !== "Approved" && (
                      <button
                        onClick={() => onApproveLeave(lv.id, "Approved")}
                        className="px-3 py-1 border border-green-200 text-green-700 hover:bg-green-50 rounded-lg text-xs font-bold transition-all"
                        id={`action-approve-${lv.id}`}
                      >
                        Approve
                      </button>
                    )}
                    {lv.status !== "Rejected" && (
                      <button
                        onClick={() => onApproveLeave(lv.id, "Rejected")}
                        className="px-3 py-1 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-xs font-bold transition-all"
                        id={`action-reject-${lv.id}`}
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
