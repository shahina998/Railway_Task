const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ===== SECURITY MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const JWT_SECRET = "simple-secret-key";
const PORT = process.env.PORT || 5000;

// ===== IN-MEMORY STORAGE =====
const users = [];
const projects = [];
const tasks = [];

console.log("Team Task Manager - Ready for testing!");

// ===== AUTH MIDDLEWARE =====
const auth = (req,res,next)=>{
  const token = req.headers.authorization;
  if(!token) return res.sendStatus(401);
  try{
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  }catch{
    res.sendStatus(403);
  }
};

// ===== AUTH ENDPOINTS =====
app.post("/signup", async(req,res)=>{
  try {
    const {name,email,password,role} = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = {
      _id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase(),
      password: hash,
      role: role || 'Member',
      createdAt: new Date()
    };
    
    users.push(user);

    const token = jwt.sign({id: user._id, role: user.role}, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/login", async(req,res)=>{
  try {
    const {email,password} = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = users.find(u => u.email === email.toLowerCase());
    if(!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if(!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({id: user._id, role: user.role}, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PROJECT ENDPOINTS =====
app.post("/projects", auth, async(req,res)=>{
  try {
    if(req.user.role !== "Admin") {
      return res.status(403).json({ error: 'Only Admin can create projects' });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = {
      _id: Date.now().toString(),
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user.id,
      members: [],
      status: 'Active',
      createdAt: new Date()
    };
    
    projects.push(project);
    res.json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/projects", auth, async(req,res)=>{
  try {
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/projects/:id", auth, async(req,res)=>{
  try {
    if(req.user.role !== "Admin") {
      return res.status(403).json({ error: 'Only Admin can delete projects' });
    }

    const index = projects.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    projects.splice(index, 1);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== TASK ENDPOINTS =====
app.post("/tasks", auth, async(req,res)=>{
  try {
    const { title, description, projectId, priority, dueDate } = req.body;
    if (!title || !projectId) {
      return res.status(400).json({ error: 'Task title and project ID are required' });
    }

    const task = {
      _id: Date.now().toString(),
      title: title.trim(),
      description: description?.trim() || '',
      projectId: projectId,
      priority: priority || 'Medium',
      status: 'Pending',
      createdBy: req.user.id,
      assignedTo: req.user.id,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date()
    };
    
    tasks.push(task);
    res.json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/tasks", auth, async(req,res)=>{
  try {
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put("/tasks/:id", auth, async(req,res)=>{
  try {
    const task = tasks.find(t => t._id === req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { status } = req.body;
    if (status) {
      task.status = status;
      if (status === 'Completed') {
        task.completedAt = new Date();
      }
    }
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete("/tasks/:id", auth, async(req,res)=>{
  try {
    if(req.user.role !== "Admin") {
      return res.status(403).json({ error: 'Only Admin can delete tasks' });
    }

    const index = tasks.findIndex(t => t._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks.splice(index, 1);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== DASHBOARD ENDPOINT =====
app.get("/dashboard", auth, async(req,res)=>{
  try {
    const now = new Date();
    const stats = {
      totalTasks: tasks.length,
      totalProjects: projects.length,
      totalUsers: users.length,
      pendingTasks: tasks.filter(t=>t.status==="Pending").length,
      inProgressTasks: tasks.filter(t=>t.status==="In Progress").length,
      completedTasks: tasks.filter(t=>t.status==="Completed").length,
      overdueTasks: tasks.filter(t=> new Date(t.dueDate) < now && t.status !== "Completed").length,
      tasksByPriority: {
        low: tasks.filter(t=>t.priority==="Low").length,
        medium: tasks.filter(t=>t.priority==="Medium").length,
        high: tasks.filter(t=>t.priority==="High").length,
        urgent: tasks.filter(t=>t.priority==="Urgent").length
      },
      activeProjects: projects.filter(p=>p.status==="Active").length,
      completedProjects: projects.filter(p=>p.status==="Completed").length
    };

    const recentTasks = tasks.slice(-10).reverse();
    const overdueTasks = tasks.filter(t => new Date(t.dueDate) < now && t.status !== "Completed");

    res.json({
      stats,
      recentTasks,
      overdueTasks
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== USERS ENDPOINT =====
app.get("/users", auth, async(req,res)=>{
  try {
    if(req.user.role !== "Admin") {
      return res.status(403).json({ error: 'Only Admin can view users' });
    }

    const usersWithoutPassword = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
    
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== FRONTEND =====
app.get("/", (req,res)=>{
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Task Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .btn { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s; }
        .btn-primary { background: #007bff; color: white; }
        .btn-primary:hover { background: #0056b3; }
        .btn-success { background: #28a745; color: white; }
        .btn-success:hover { background: #1e7e34; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-danger:hover { background: #c82333; }
        .input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 15px; font-size: 14px; }
        .input:focus { outline: none; border-color: #007bff; }
        .text-center { text-align: center; }
        .mb-3 { margin-bottom: 20px; }
        .mb-4 { margin-bottom: 25px; }
        .grid { display: grid; gap: 20px; }
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .hidden { display: none; }
        .text-sm { font-size: 14px; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 20px; }
        .text-2xl { font-size: 24px; }
        .text-3xl { font-size: 30px; }
        .font-bold { font-weight: bold; }
        .text-gray { color: #666; }
        .text-success { color: #28a745; }
        .text-danger { color: #dc3545; }
        .text-primary { color: #007bff; }
        .bg-white { background: white; }
        .p-3 { padding: 15px; }
        .p-4 { padding: 20px; }
        .mt-2 { margin-top: 10px; }
        .mt-3 { margin-top: 15px; }
        .mt-4 { margin-top: 20px; }
        .space-x-2 > * + * { margin-left: 10px; }
        .rounded { border-radius: 6px; }
        .shadow { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .border-bottom { border-bottom: 2px solid #eee; }
        .border-bottom-active { border-bottom: 2px solid #007bff; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .max-w-md { max-width: 500px; margin: 0 auto; }
        .max-w-6xl { max-width: 1200px; margin: 0 auto; }
        @media (min-width: 768px) {
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        }
        .stats-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .stats-card h3 { font-size: 16px; margin-bottom: 8px; }
        .stats-card .number { font-size: 32px; font-weight: bold; }
    </style>
</head>
<body>
    <div id="app">
        <!-- Login/Signup Section -->
        <div id="auth-section" class="container">
            <div class="card max-w-md">
                <h1 class="text-2xl font-bold text-center mb-4">Team Task Manager</h1>
                
                <!-- Signup Form -->
                <div id="signup-form">
                    <h2 class="text-xl font-bold mb-3">Sign Up</h2>
                    <input id="signup-name" type="text" placeholder="Name" class="input">
                    <input id="signup-email" type="email" placeholder="Email" class="input">
                    <input id="signup-password" type="password" placeholder="Password" class="input">
                    <select id="signup-role" class="input">
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                    </select>
                    <button onclick="signup()" class="btn btn-primary" style="width: 100%;">Sign Up</button>
                    <p class="text-center mt-3 text-gray">Already have an account? <a href="#" onclick="showLogin()">Login</a></p>
                </div>
                
                <!-- Login Form -->
                <div id="login-form" class="hidden">
                    <h2 class="text-xl font-bold mb-3">Login</h2>
                    <input id="login-email" type="email" placeholder="Email" class="input">
                    <input id="login-password" type="password" placeholder="Password" class="input">
                    <button onclick="login()" class="btn btn-success" style="width: 100%;">Login</button>
                    <p class="text-center mt-3 text-gray">Don't have an account? <a href="#" onclick="showSignup()">Sign Up</a></p>
                </div>
            </div>
        </div>
        
        <!-- Dashboard Section -->
        <div id="dashboard-section" class="container hidden">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-3xl font-bold">Dashboard</h1>
                    <button onclick="logout()" class="btn btn-danger">Logout</button>
                </div>
                
                <!-- Stats Cards -->
                <div id="stats" class="grid grid-cols-4 mb-4"></div>
                
                <!-- Navigation Tabs -->
                <div class="border-bottom mb-4">
                    <div class="flex space-x-4">
                        <a href="#" onclick="showSection('projects')" class="tab-link pb-2 border-bottom-active">Projects</a>
                        <a href="#" onclick="showSection('tasks')" class="tab-link pb-2">Tasks</a>
                        <a href="#" onclick="showSection('users')" class="tab-link pb-2">Users</a>
                    </div>
                </div>
                
                <!-- Projects Section -->
                <div id="projects-section" class="section">
                    <div class="flex justify-between mb-3">
                        <h2 class="text-2xl font-bold">Projects</h2>
                        <button onclick="showCreateProject()" class="btn btn-primary">Create Project</button>
                    </div>
                    <div id="projects-list" class="grid grid-cols-3"></div>
                </div>
                
                <!-- Tasks Section -->
                <div id="tasks-section" class="section hidden">
                    <div class="flex justify-between mb-3">
                        <h2 class="text-2xl font-bold">Tasks</h2>
                        <button onclick="showCreateTask()" class="btn btn-primary">Create Task</button>
                    </div>
                    <div id="tasks-list"></div>
                </div>
                
                <!-- Users Section (Admin only) -->
                <div id="users-section" class="section hidden">
                    <div class="flex justify-between mb-3">
                        <h2 class="text-2xl font-bold">Users</h2>
                    </div>
                    <div id="users-list" class="grid grid-cols-3"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let token = "";
        let currentUser = null;
        
        // Auth Functions
        function showSignup() {
            document.getElementById('signup-form').classList.remove('hidden');
            document.getElementById('login-form').classList.add('hidden');
        }
        
        function showLogin() {
            document.getElementById('signup-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        }
        
        async function signup() {
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const role = document.getElementById('signup-role').value;
            
            if (!name || !email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                const res = await fetch("/signup", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({name, email, password, role})
                });
                
                const data = await res.json();
                if (res.ok) {
                    token = data.token;
                    currentUser = data.user;
                    showDashboard();
                } else {
                    alert(data.error || 'Signup failed');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function login() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                const res = await fetch("/login", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({email, password})
                });
                
                const data = await res.json();
                if (res.ok) {
                    token = data.token;
                    currentUser = data.user;
                    showDashboard();
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        function logout() {
            token = "";
            currentUser = null;
            document.getElementById('auth-section').classList.remove('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
        }
        
        function showDashboard() {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            loadDashboard();
        }
        
        // Dashboard Functions
        async function loadDashboard() {
            try {
                const res = await fetch("/dashboard", {
                    headers: {"Authorization": token}
                });
                const data = await res.json();
                
                if (res.ok) {
                    displayStats(data.stats);
                    loadProjects();
                    loadTasks();
                    if (currentUser.role === 'Admin') {
                        loadUsers();
                    }
                }
            } catch (error) {
                alert('Error loading dashboard: ' + error.message);
            }
        }
        
        function displayStats(stats) {
            const statsHtml = \`
                <div class="card stats-card">
                    <h3>Total Tasks</h3>
                    <div class="number">\${stats.totalTasks}</div>
                </div>
                <div class="card stats-card">
                    <h3>Projects</h3>
                    <div class="number">\${stats.totalProjects}</div>
                </div>
                <div class="card stats-card">
                    <h3>Completed</h3>
                    <div class="number">\${stats.completedTasks}</div>
                </div>
                <div class="card stats-card">
                    <h3>Overdue</h3>
                    <div class="number">\${stats.overdueTasks}</div>
                </div>
            \`;
            document.getElementById('stats').innerHTML = statsHtml;
        }
        
        // Projects Functions
        async function loadProjects() {
            try {
                const res = await fetch("/projects", {
                    headers: {"Authorization": token}
                });
                const projects = await res.json();
                
                const projectsHtml = projects.map(project => \`
                    <div class="card">
                        <h3>\${project.name}</h3>
                        <p class="text-gray">\${project.description || 'No description'}</p>
                        <p class="text-sm text-gray">Status: \${project.status}</p>
                        \${currentUser.role === 'Admin' ? \`
                            <div class="mt-3">
                                <button onclick="deleteProject('\${project._id}')" class="btn btn-danger">Delete</button>
                            </div>
                        \` : ''}
                    </div>
                \`).join('');
                
                document.getElementById('projects-list').innerHTML = projectsHtml;
            } catch (error) {
                alert('Error loading projects: ' + error.message);
            }
        }
        
        function showCreateProject() {
            const name = prompt('Project name:');
            if (!name) return;
            
            const description = prompt('Description (optional):');
            createProject(name, description);
        }
        
        async function createProject(name, description) {
            try {
                const res = await fetch("/projects", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token
                    },
                    body: JSON.stringify({name, description})
                });
                
                if (res.ok) {
                    loadProjects();
                    loadDashboard();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to create project');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function deleteProject(projectId) {
            if (!confirm('Are you sure you want to delete this project?')) return;
            
            try {
                const res = await fetch(\`/projects/\${projectId}\`, {
                    method: "DELETE",
                    headers: {"Authorization": token}
                });
                
                if (res.ok) {
                    loadProjects();
                    loadDashboard();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to delete project');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        // Tasks Functions
        async function loadTasks() {
            try {
                const res = await fetch("/tasks", {
                    headers: {"Authorization": token}
                });
                const tasks = await res.json();
                
                const tasksHtml = tasks.map(task => \`
                    <div class="card">
                        <h3>\${task.title}</h3>
                        <p class="text-gray">\${task.description || 'No description'}</p>
                        <div class="flex justify-between mt-2">
                            <span class="text-sm">Priority: \${task.priority}</span>
                            <span class="text-sm">Status: \${task.status}</span>
                        </div>
                        \${currentUser.role === 'Admin' ? \`
                            <div class="mt-3 space-x-2">
                                <button onclick="updateTaskStatus('\${task._id}', 'Completed')" class="btn btn-success">Complete</button>
                                <button onclick="deleteTask('\${task._id}')" class="btn btn-danger">Delete</button>
                            </div>
                        \` : ''}
                    </div>
                \`).join('');
                
                document.getElementById('tasks-list').innerHTML = tasksHtml;
            } catch (error) {
                alert('Error loading tasks: ' + error.message);
            }
        }
        
        function showCreateTask() {
            const title = prompt('Task title:');
            if (!title) return;
            
            const description = prompt('Description (optional):');
            const projectId = prompt('Project ID (use any number):');
            const priority = prompt('Priority (Low/Medium/High):') || 'Medium';
            
            createTask(title, description, projectId, priority);
        }
        
        async function createTask(title, description, projectId, priority) {
            try {
                const res = await fetch("/tasks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        projectId,
                        priority
                    })
                });
                
                if (res.ok) {
                    loadTasks();
                    loadDashboard();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to create task');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function updateTaskStatus(taskId, status) {
            try {
                const res = await fetch(\`/tasks/\${taskId}\`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token
                    },
                    body: JSON.stringify({status})
                });
                
                if (res.ok) {
                    loadTasks();
                    loadDashboard();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to update task');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function deleteTask(taskId) {
            if (!confirm('Are you sure you want to delete this task?')) return;
            
            try {
                const res = await fetch(\`/tasks/\${taskId}\`, {
                    method: "DELETE",
                    headers: {"Authorization": token}
                });
                
                if (res.ok) {
                    loadTasks();
                    loadDashboard();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to delete task');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        // Users Functions (Admin only)
        async function loadUsers() {
            if (currentUser.role !== 'Admin') return;
            
            try {
                const res = await fetch("/users", {
                    headers: {"Authorization": token}
                });
                const users = await res.json();
                
                const usersHtml = users.map(user => \`
                    <div class="card">
                        <h3>\${user.name}</h3>
                        <p class="text-gray">\${user.email}</p>
                        <span class="text-sm" style="color: \${user.role === 'Admin' ? '#dc3545' : '#007bff'}">\${user.role}</span>
                    </div>
                \`).join('');
                
                document.getElementById('users-list').innerHTML = usersHtml;
            } catch (error) {
                alert('Error loading users: ' + error.message);
            }
        }
        
        // Navigation
        function showSection(section) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('border-bottom-active'));
            
            // Show selected section
            document.getElementById(section + '-section').classList.remove('hidden');
            event.target.classList.add('border-bottom-active');
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            showSignup();
        });
    </script>
</body>
</html>
  `);
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("🚀 Team Task Manager is running!");
  console.log("📍 Server: http://localhost:" + PORT);
  console.log("⏰ Ready for testing and deployment!");
});
