import React, { useState } from "react";
import { Search, Plus, Filter, Mail, Phone, Calendar, Clipboard, UserMinus, UserCheck, X, Edit2, ShieldAlert, Printer, Eye } from "lucide-react";
import { Employee } from "../types";

interface EmployeeDirectoryProps {
  employees: Employee[];
  onAddEmployee: (employeeData: Omit<Employee, "id">) => void;
  onUpdateEmployee: (id: string, employeeData: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function EmployeeDirectory({
  employees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}: EmployeeDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [joinedDate, setJoinedDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"Active" | "Inactive" | "On Leave">("Active");
  const [baseLeavesAllowed, setBaseLeavesAllowed] = useState(20);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setRole("");
    setDepartment("Engineering");
    setJoinedDate(new Date().toISOString().split("T")[0]);
    setStatus("Active");
    setBaseLeavesAllowed(20);
    setShowAddForm(false);
    setEditEmployeeId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !role) return;
    onAddEmployee({
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      joinedDate,
      status,
      baseLeavesAllowed,
    });
    resetForm();
  };

  const handleStartEdit = (emp: Employee) => {
    setEditEmployeeId(emp.id);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone);
    setRole(emp.role);
    setDepartment(emp.department);
    setJoinedDate(emp.joinedDate);
    setStatus(emp.status);
    setBaseLeavesAllowed(emp.baseLeavesAllowed);
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployeeId) return;
    onUpdateEmployee(editEmployeeId, {
      firstName,
      lastName,
      email,
      phone,
      role,
      department,
      joinedDate,
      status,
      baseLeavesAllowed,
    });
    resetForm();
  };

  const departments = ["All", ...Array.from(new Set(employees.map((e) => e.department)))];

  const filteredEmployees = employees.filter((e) => {
    const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === "All" || e.department === selectedDepartment;
    const matchesStatus = selectedStatus === "All" || e.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6" id="employee-directory-tab">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
          <p className="text-xs text-slate-400">Manage digital active cards, roles, and leave capacities.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all shadow-sm active:scale-95 select-none"
            id="print-preview-button"
          >
            <Eye size={14} />
            Print Preview
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm active:scale-95 select-none"
            id="toggle-add-employee-form"
          >
            <Plus size={14} />
            Register New Employee
          </button>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Preview Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Print Preview</h3>
                <p className="text-xs text-slate-400">Review employee directory before printing.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm flex items-center gap-2"
                >
                  <Printer size={14} />
                  Print Document
                </button>
              </div>
            </div>

            {/* Preview Content (Targeted by print CSS) */}
            <div className="flex-1 overflow-y-auto p-12 bg-slate-100/50 print:bg-white print:p-0" id="print-area">
              <div className="bg-white p-8 shadow-sm border border-slate-100 min-h-full print:shadow-none print:border-0 mx-auto max-w-[800px] print:max-w-none">
                <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-slate-800">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Employee Directory</h1>
                    <p className="text-xs text-slate-500 font-mono">Generated: {new Date().toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status Filter: {selectedStatus}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Department Filter: {selectedDepartment}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total: {filteredEmployees.length} Records</p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Full Name</th>
                      <th className="py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Role & Dept</th>
                      <th className="py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</th>
                      <th className="py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Joined</th>
                      <th className="py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="text-xs">
                        <td className="py-3 font-bold text-slate-800">
                          {emp.firstName} {emp.lastName}
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-slate-700">{emp.role}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-mono">{emp.department}</p>
                        </td>
                        <td className="py-3 text-slate-500">{emp.email}</td>
                        <td className="py-3 text-slate-500">
                          {new Date(emp.joinedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${
                            emp.status === "Active" ? "bg-green-50 text-green-700 border-green-200" :
                            emp.status === "On Leave" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-12 pt-8 border-t border-slate-100 text-[10px] text-slate-400 text-center uppercase tracking-widest font-mono">
                  &copy; {new Date().getFullYear()} Enterprise Management Systems - Confidential Document
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal (Collapsible pane) */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md transition-all animate-fadeIn relative">
          <button
            onClick={resetForm}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            id="close-employee-form"
          >
            <X size={16} />
          </button>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
            <Clipboard size={16} className="text-blue-500" />
            {editEmployeeId ? "Update Employee Profile Data" : "Register New Employee Profile"}
          </h3>

          <form onSubmit={editEmployeeId ? handleUpdate : handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">First Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Richmond"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Last Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Tanglao"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Work Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. richmond@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Mobile Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +63 912 345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Official Designation / Role</label>
              <input
                type="text"
                required
                placeholder="e.g. Technical Product Coordinator"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Assigned Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="IT Operations">IT Operations</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Design">Design</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Joined Employment Date</label>
              <input
                type="date"
                value={joinedDate}
                onChange={(e) => setJoinedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Annual Base Vacation Limit (Days)</label>
              <input
                type="number"
                min="0"
                max="365"
                value={baseLeavesAllowed}
                onChange={(e) => setBaseLeavesAllowed(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Registry Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive" | "On Leave")}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm cursor-pointer"
                id="submit-profile-button"
              >
                {editEmployeeId ? "Save Profile Update" : "Approve & Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row gap-3.5 items-center">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            id="employee-search-input"
          />
        </div>

        <div className="flex gap-2.5 w-full md:w-auto shrink-0 justify-end">
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-0 rounded-lg focus:outline-none font-medium"
              id="department-filter"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  Dept: {dept}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-0 rounded-lg focus:outline-none font-medium"
            id="status-filter"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Grid of Results */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <Search size={36} className="text-slate-200" />
          <div>
            <h4 className="text-sm font-semibold text-slate-700">No matching employee records</h4>
            <p className="text-xs text-slate-400">Adjust filters or create a new profile card above.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => {
            const joinedDateFormatted = new Date(emp.joinedDate).toLocaleDateString([], {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base leading-tight">
                        {emp.firstName} {emp.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{emp.role}</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.status === "Active"
                          ? "bg-green-50 text-green-700 border border-green-200/60"
                          : emp.status === "On Leave"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                          : "bg-slate-50 text-slate-600 border border-slate-200/60"
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-50 pt-3.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      <a href={`mailto:${emp.email}`} className="hover:underline hover:text-blue-600 truncate">
                        {emp.email}
                      </a>
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Joined: {joinedDateFormatted}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                    Dept: <span className="font-bold text-slate-600">{emp.department}</span>
                  </span>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleStartEdit(emp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded transition-colors"
                      title="Edit Profile"
                      id={`edit-emp-${emp.id}`}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition-colors"
                      title="Purge Profile"
                      id={`delete-emp-${emp.id}`}
                    >
                      <UserMinus size={13} />
                    </button>
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
