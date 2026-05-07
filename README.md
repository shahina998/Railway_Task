# Team Task Manager

A full-stack web application for team project and task management with role-based access control.

## 🚀 Features

- **Authentication**: User signup and login system
- **Role-Based Access**: Admin and Member roles with different permissions
- **Project Management**: Create, view, and manage projects
- **Task Management**: Create, assign, and track tasks with status updates
- **Dashboard**: Real-time statistics and overdue task tracking
- **Team Collaboration**: Assign tasks to team members

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: HTML, CSS, JavaScript with Tailwind CSS
- **Security**: Helmet, CORS, Rate Limiting, bcryptjs

## 📋 API Endpoints

### Authentication
- `POST /signup` - Register a new user
- `POST /login` - User login
- `GET /profile` - Get current user profile

### Projects (Admin only for create/update/delete)
- `GET /projects` - Get all projects
- `POST /projects` - Create a new project
- `GET /projects/:id` - Get specific project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks
- `GET /tasks` - Get all tasks (with filters)
- `POST /tasks` - Create a new task
- `GET /tasks/:id` - Get specific task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task (Admin only)

### Dashboard
- `GET /dashboard` - Get dashboard statistics

### Users (Admin only)
- `GET /users` - Get all users

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd team-task-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file with the following variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/team-task-manager
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   PORT=5000
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## 🌐 Deployment

### Railway Deployment

1. **Push to GitHub**
   - Create a new repository on GitHub
   - Push your code to the repository

2. **Deploy on Railway**
   - Sign up/login to Railway
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the Node.js application

3. **Environment Variables on Railway**
   Add these environment variables in Railway settings:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure secret key
   - `NODE_ENV`: `production`

4. **Get Live URL**
   - Railway will provide a live URL once deployment is complete

## 📊 Database Schema

### Users
- name, email, password, role (Admin/Member), isActive

### Projects
- name, description, members, createdBy, status, dates

### Tasks
- title, description, status, priority, assignedTo, projectId, createdBy, dueDate

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Rate limiting to prevent abuse
- CORS configuration
- Input validation and sanitization
- Role-based access control

## 📱 Usage

1. **Sign up** as an Admin or Member
2. **Login** with your credentials
3. **Admins can**:
   - Create and manage projects
   - Create and assign tasks
   - View all users
   - Delete projects and tasks
4. **Members can**:
   - View projects and tasks
   - Update task status
   - View dashboard statistics

## 🎯 Dashboard Features

- Total tasks count
- Active projects
- Completed tasks
- Overdue tasks
- Recent activity
- Task priority breakdown

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For any issues or questions, please create an issue in the GitHub repository.
