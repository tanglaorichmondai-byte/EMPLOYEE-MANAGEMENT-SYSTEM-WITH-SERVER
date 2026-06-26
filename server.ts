import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createHttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "app-data.json");

// Define basic interface properties
interface Employee {
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

interface LeaveRequest {
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

interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  position: string;
  role: "admin" | "user";
  status: "pending" | "approved" | "rejected";
  password?: string;
  createdAt: string;
}

interface DbData {
  employees: Employee[];
  leaves: LeaveRequest[];
  users: UserAccount[];
}

// Initial default seed data
const DEFAULT_DATA: DbData = {
  users: [
    {
      id: "usr-admin-1",
      fullName: "System Admin",
      email: "admin@system.local",
      position: "System Administrator",
      role: "admin",
      status: "approved",
      password: "admin", // simple password for testing
      createdAt: "2024-01-01T00:00:00Z"
    }
  ],
  employees: [
    {
      id: "emp-1",
      firstName: "Richmond",
      lastName: "Tanglao",
      email: "tanglaorichmond.ai@gmail.com",
      phone: "+63 912 345 6789",
      role: "Lead Systems Administrator",
      department: "IT Operations",
      joinedDate: "2024-01-15",
      status: "Active",
      baseLeavesAllowed: 24,
    },
    {
      id: "emp-2",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "s.jenkins@company.com",
      phone: "+1 555-0199",
      role: "Senior HR Specialist",
      department: "Human Resources",
      joinedDate: "2023-05-10",
      status: "Active",
      baseLeavesAllowed: 20,
    },
    {
      id: "emp-3",
      firstName: "Michael",
      lastName: "Chen",
      email: "m.chen@company.com",
      phone: "+1 555-0143",
      role: "Frontend Architect",
      department: "Engineering",
      joinedDate: "2022-11-01",
      status: "On Leave",
      baseLeavesAllowed: 22,
    },
    {
      id: "emp-4",
      firstName: "Aria",
      lastName: "Ferreira",
      email: "a.ferreira@company.com",
      phone: "+1 555-0182",
      role: "Product Designer",
      department: "Design",
      joinedDate: "2024-03-20",
      status: "Active",
      baseLeavesAllowed: 18,
    },
    {
      id: "emp-5",
      firstName: "David",
      lastName: "Kim",
      email: "d.kim@company.com",
      phone: "+1 555-0165",
      role: "DevOps Engineer",
      department: "Engineering",
      joinedDate: "2023-08-14",
      status: "Active",
      baseLeavesAllowed: 22,
    }
  ],
  leaves: [
    {
      id: "lv-1",
      employeeId: "emp-3",
      employeeName: "Michael Chen",
      leaveType: "Vacation",
      startDate: "2026-06-05",
      endDate: "2026-06-12",
      totalDays: 6,
      status: "Approved",
      reason: "Annual family trip to Hawaii",
      requestedDate: "2026-05-20",
    },
    {
      id: "lv-2",
      employeeId: "emp-2",
      employeeName: "Sarah Jenkins",
      leaveType: "Sick Leave",
      startDate: "2026-06-15",
      endDate: "2026-06-16",
      totalDays: 2,
      status: "Pending",
      reason: "Dental operation backup",
      requestedDate: "2026-06-02",
    },
    {
      id: "lv-3",
      employeeId: "emp-4",
      employeeName: "Aria Ferreira",
      leaveType: "Vacation",
      startDate: "2026-07-01",
      endDate: "2026-07-05",
      totalDays: 5,
      status: "Pending",
      reason: "Summer music festival",
      requestedDate: "2026-06-04",
    }
  ],
};

// Database helper functions with locking/errors handling
function readDatabase(): DbData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), "utf8");
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    
    // Migration for older databases that don't have the users array
    if (!data.users) {
      data.users = DEFAULT_DATA.users;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    }
    
    return data as DbData;
  } catch (err) {
    console.error("Error reading database schema; utilizing default seed.", err);
    return DEFAULT_DATA;
  }
}

function writeDatabase(data: DbData): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error committing database payload.", err);
    return false;
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true); // Trust Ngrok/Proxies
  const httpServer = createHttpServer(app);

  console.log("Starting server in mode:", process.env.NODE_ENV || "development");
  console.log("Working directory:", process.cwd());
  if (fs.existsSync(path.join(process.cwd(), "index.html"))) {
    console.log("Root index.html found.");
  } else {
    console.warn("Root index.html NOT found! Vite might fail to serve the app.");
  }

  // Initialize express middleware
  app.use(express.json());
  
  // CORS and Proxy Headers (MUST BE FIRST)
  app.use((req, res, next) => {
    res.setHeader("ngrok-skip-browser-warning", "true");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, ngrok-skip-browser-warning");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Private-Network", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // REST API Endpoints

  // 1. Health check for local installation checklist auto-detection
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      server: "Employee Management & Leave Tracker Local Server",
      time: new Date().toISOString(),
      employeeCount: readDatabase().employees.length,
      leaveCount: readDatabase().leaves.length,
    });
  });

  // User Authentication and Management
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const db = readDatabase();
    const user = db.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    if (user.status !== "approved") {
      return res.status(403).json({ error: `Account is ${user.status}. Please wait for admin approval.` });
    }
    
    // In a real app we'd use JWTs, but for local prototype we just return the user object
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      position: user.position,
      role: user.role
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const { fullName, email, position } = req.body;
    const db = readDatabase();
    
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: "User with this email already exists" });
    }
    
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      position,
      role: "user", // defaults to user, admin can't be registered this way usually
      status: "pending",
      password: "password123", // default password for new registrations for prototype
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    
    if (writeDatabase(db)) {
      res.status(201).json({ message: "Registration requested successfully. Please wait for approval.", user: newUser });
    } else {
      res.status(500).json({ error: "Failed to register" });
    }
  });

  app.get("/api/users", (req, res) => {
    const db = readDatabase();
    res.json(db.users);
  });

  app.put("/api/users/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // "approved" or "rejected"
    
    const db = readDatabase();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ error: "User not found" });
    
    db.users[index].status = status;
    
    if (writeDatabase(db)) {
      res.json(db.users[index]);
    } else {
      res.status(500).json({ error: "Database save failed" });
    }
  });

  app.put("/api/users/:id/role", (req, res) => {
    const { id } = req.params;
    const { role } = req.body; // "admin" or "user"
    
    const db = readDatabase();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ error: "User not found" });
    
    db.users[index].role = role;
    
    if (writeDatabase(db)) {
      res.json(db.users[index]);
    } else {
      res.status(500).json({ error: "Database save failed" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const db = readDatabase();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ error: "User not found" });
    
    db.users.splice(index, 1);
    if (writeDatabase(db)) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Database save failed" });
    }
  });

  // Source files endpoint to package and deliver source code dynamically without circular ?raw Vite imports
  app.get("/api/source-files", (req, res) => {
    try {
      const files = {
        "main.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/main.tsx"), "utf-8"),
        "App.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/App.tsx"), "utf-8"),
        "index.css": fs.readFileSync(path.resolve(process.cwd(), "src/index.css"), "utf-8"),
        "types.ts": fs.readFileSync(path.resolve(process.cwd(), "src/types.ts"), "utf-8"),
        "server.ts": fs.readFileSync(path.resolve(process.cwd(), "server.ts"), "utf-8"),
        "Dashboard.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/components/Dashboard.tsx"), "utf-8"),
        "EmployeeDirectory.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/components/EmployeeDirectory.tsx"), "utf-8"),
        "LeaveTracker.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/components/LeaveTracker.tsx"), "utf-8"),
        "NetworkPresence.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/components/NetworkPresence.tsx"), "utf-8"),
        "SetupWizard.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/components/SetupWizard.tsx"), "utf-8"),
        "Utilities.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/components/Utilities.tsx"), "utf-8"),
        "AuthScreen.tsx": fs.readFileSync(path.resolve(process.cwd(), "src/components/AuthScreen.tsx"), "utf-8"),
      };
      res.json(files);
    } catch (error) {
      console.error("Error reading source files:", error);
      res.status(500).json({ error: "Failed to read source files" });
    }
  });

  // 2. Fetch all employees
  app.get("/api/employees", (req, res) => {
    const db = readDatabase();
    res.json(db.employees);
  });

  // 3. Add employee
  app.post("/api/employees", (req, res) => {
    const db = readDatabase();
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      firstName: req.body.firstName || "",
      lastName: req.body.lastName || "",
      email: req.body.email || "",
      phone: req.body.phone || "",
      role: req.body.role || "",
      department: req.body.department || "Engineering",
      joinedDate: req.body.joinedDate || new Date().toISOString().split("T")[0],
      status: req.body.status || "Active",
      baseLeavesAllowed: Number(req.body.baseLeavesAllowed) || 20,
    };

    db.employees.push(newEmployee);
    writeDatabase(db);

    // Broadcast change via WebSocket
    broadcast({ type: "db-updated", table: "employees" });

    res.status(201).json(newEmployee);
  });

  // 4. Update employee
  app.put("/api/employees/:id", (req, res) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.employees.findIndex((e) => e.id === id);

    if (index === -1) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    db.employees[index] = {
      ...db.employees[index],
      firstName: req.body.firstName !== undefined ? req.body.firstName : db.employees[index].firstName,
      lastName: req.body.lastName !== undefined ? req.body.lastName : db.employees[index].lastName,
      email: req.body.email !== undefined ? req.body.email : db.employees[index].email,
      phone: req.body.phone !== undefined ? req.body.phone : db.employees[index].phone,
      role: req.body.role !== undefined ? req.body.role : db.employees[index].role,
      department: req.body.department !== undefined ? req.body.department : db.employees[index].department,
      joinedDate: req.body.joinedDate !== undefined ? req.body.joinedDate : db.employees[index].joinedDate,
      status: req.body.status !== undefined ? req.body.status : db.employees[index].status,
      baseLeavesAllowed: req.body.baseLeavesAllowed !== undefined ? Number(req.body.baseLeavesAllowed) : db.employees[index].baseLeavesAllowed,
    };

    writeDatabase(db);
    broadcast({ type: "db-updated", table: "employees" });

    res.json(db.employees[index]);
  });

  // 5. Delete employee
  app.delete("/api/employees/:id", (req, res) => {
    let db = readDatabase();
    const { id } = req.params;
    const initialLength = db.employees.length;

    db.employees = db.employees.filter((e) => e.id !== id);

    if (db.employees.length === initialLength) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    // Also purge corresponding leave requests
    db.leaves = db.leaves.filter((l) => l.employeeId !== id);

    writeDatabase(db);
    broadcast({ type: "db-updated", table: "employees" });

    res.json({ message: "Employee and associated records purged successfully" });
  });

  // 6. Fetch leave requests
  app.get("/api/leaves", (req, res) => {
    const db = readDatabase();
    res.json(db.leaves);
  });

  // 7. Add leave request
  app.post("/api/leaves", (req, res) => {
    const db = readDatabase();
    const employee = db.employees.find((e) => e.id === req.body.employeeId);

    if (!employee) {
      res.status(404).json({ error: "Employee reference not found" });
      return;
    }

    const { leaveType, startDate, endDate, totalDays, reason } = req.body;

    const newLeave: LeaveRequest = {
      id: `lv-${Date.now()}`,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      leaveType: leaveType || "Vacation",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || new Date().toISOString().split("T")[0],
      totalDays: Number(totalDays) || 1,
      status: "Pending",
      reason: reason || "",
      requestedDate: new Date().toISOString().split("T")[0],
    };

    db.leaves.push(newLeave);
    writeDatabase(db);
    broadcast({ type: "db-updated", table: "leaves" });

    res.status(201).json(newLeave);
  });

  // 8. Update leave status (Approve/Reject)
  app.put("/api/leaves/:id", (req, res) => {
    const db = readDatabase();
    const { id } = req.params;
    const index = db.leaves.findIndex((l) => l.id === id);

    if (index === -1) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    const currentLeave = db.leaves[index];
    const newStatus = req.body.status; // 'Pending' | 'Approved' | 'Rejected'
    currentLeave.status = newStatus;

    // Adjust employee status based on active leave approval
    if (newStatus === "Approved") {
      const today = new Date().toISOString().split("T")[0];
      if (today >= currentLeave.startDate && today <= currentLeave.endDate) {
        const empIndex = db.employees.findIndex((e) => e.id === currentLeave.employeeId);
        if (empIndex !== -1) {
          db.employees[empIndex].status = "On Leave";
        }
      }
    } else if (newStatus === "Rejected" || newStatus === "Pending") {
      // Revert status if back to pending or rejected
      const empIndex = db.employees.findIndex((e) => e.id === currentLeave.employeeId);
      if (empIndex !== -1) {
        db.employees[empIndex].status = "Active";
      }
    }

    db.leaves[index] = currentLeave;
    writeDatabase(db);

    broadcast({ type: "db-updated", table: "leaves" });

    res.json(currentLeave);
  });

  // 9. Delete leave request
  app.delete("/api/leaves/:id", (req, res) => {
    let db = readDatabase();
    const { id } = req.params;
    const initialLength = db.leaves.length;

    db.leaves = db.leaves.filter((l) => l.id !== id);

    if (db.leaves.length === initialLength) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    writeDatabase(db);
    broadcast({ type: "db-updated", table: "leaves" });

    res.json({ message: "Leave request removed successfully" });
  });

  // 10. Database Backup
  app.get("/api/backup", (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        res.setHeader("Content-Disposition", `attachment; filename=ems-database-backup-${timestamp}.json`);
        res.setHeader("Content-Type", "application/json");
        const fileStream = fs.createReadStream(DATA_FILE);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ error: "No database file found to backup" });
      }
    } catch (err) {
      console.error("Backup failed", err);
      res.status(500).json({ error: "Internal server error during backup" });
    }
  });

  // Set up WebSocket Server for real-time presence tracing of connected PCs/browsers
  const wss = new WebSocketServer({ noServer: true });

  interface ActiveClient {
    id: string;
    ws: WebSocket;
    username: string;
    computerName: string;
    ip: string;
    connectedAt: string;
  }

  const clientsMap = new Map<string, ActiveClient>();

  wss.on("connection", (ws, request) => {
    const ip = (request.headers["x-forwarded-for"] as string || request.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();
    const tempId = `client-${Date.now()}`;

    // Add immediate temporary client
    clientsMap.set(tempId, {
      id: tempId,
      ws,
      username: "Locating client...",
      computerName: "Connecting PC",
      ip,
      connectedAt: new Date().toISOString(),
    });

    ws.on("message", (messageStr: string) => {
      try {
        const payload = JSON.parse(messageStr);

        if (payload.type === "identify") {
          const { userName, computerName, clientId } = payload;
          const currentClient = clientsMap.get(tempId);
          if (currentClient) {
            // Remove previous placeholder
            clientsMap.delete(tempId);
            // Replace with standard registration under clientId
            clientsMap.set(clientId, {
              id: clientId,
              ws,
              username: userName || "Anonymous Staff",
              computerName: computerName || "Remote Workspace",
              ip,
              connectedAt: currentClient.connectedAt,
            });
          } else {
            clientsMap.set(clientId, {
              id: clientId,
              ws,
              username: userName || "Anonymous Staff",
              computerName: computerName || "Remote Workspace",
              ip,
              connectedAt: new Date().toISOString(),
            });
          }
          // Broadcast refreshed roster
          broadcastActiveClients();
        }
      } catch (err) {
        console.error("Failed to parse WebSocket packet.", err);
      }
    });

    ws.on("close", () => {
      // Evict reference from map
      let foundKey: string | null = null;
      for (const [key, client] of clientsMap.entries()) {
        if (client.ws === ws) {
          foundKey = key;
          break;
        }
      }
      if (foundKey) {
        clientsMap.delete(foundKey);
        broadcastActiveClients();
      }
    });

    ws.on("error", (err) => {
      console.error("WS client connection error:", err);
    });
  });

  // Helper code to broadcast payloads to all WebSocket clients
  function broadcast(data: any) {
    const text = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    });
  }

  // Refreshed clients list dissemination
  function broadcastActiveClients() {
    const list = Array.from(clientsMap.values()).map((c) => ({
      id: c.id,
      username: c.username,
      computerName: c.computerName,
      ip: c.ip,
      connectedAt: c.connectedAt,
    }));
    broadcast({ type: "online-list", users: list });
  }

  // Handle WebSocket upgrades gracefully
  httpServer.on("upgrade", (request, socket, head) => {
    const url = request.url || "";
    const pathname = url.split("?")[0];
    
    if (pathname === "/ws" || pathname === "/ws/") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // We don't call socket.destroy() here to allow Vite's own upgrade listener to handle its paths (/@vite, etc.)
  });

  // Dev server integrations with Vite
  if (process.env.NODE_ENV !== "production") {
    console.log(`Initializing Vite Dev Server... root=${process.cwd()}`);
    const vite = await createViteServer({
      root: process.cwd(),
      server: { 
        middlewareMode: true, 
        allowedHosts: true,
        cors: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Explicitly handle index.html transformation for better compatibility with proxies
    app.get("*", async (req, res, next) => {
      // If request has an extension, it's likely an asset that Vite middleware should have caught
      if (req.path.includes(".")) return next();
      
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), "index.html");
        let html = fs.readFileSync(indexPath, "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ "Content-Type": "text/html" }).send(html);
      } catch (e) {
        console.error("Vite transformation error:", e);
        next(e);
      }
    });
  }

  // Production asset serving (only if not in dev)
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server launched successfully at http://localhost:${PORT}`);
  });
}

startServer();
