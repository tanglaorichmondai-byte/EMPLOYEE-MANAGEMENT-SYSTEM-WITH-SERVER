export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joinedDate: string;
  status: "Active" | "Inactive" | "On Leave";
  baseLeavesAllowed: number;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  position: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected";
  password?: string;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "Vacation" | "Sick Leave" | "Parental" | "Unpaid" | "Other";
  startDate: string;
  endDate: string;
  totalDays: number;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  requestedDate: string;
}

export interface ClientConnection {
  id: string;
  username: string;
  computerName: string;
  ip: string;
  connectedAt: string;
}

export interface InstalledStep {
  id: number;
  title: string;
  description: string;
  status: "pending" | "current" | "done";
  optional?: boolean;
}
