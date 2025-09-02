# 🧠 Just Everything - Complete Productivity Platform

A comprehensive platform that allows you to create an account and activate various micro apps for personal and business productivity. PIMS (Personal Ideas Management System) is the first micro app built on this platform.

## 🚀 Features

### **Platform Features:**
- **Unified Authentication** - Single login for all apps
- **Micro App Management** - Activate/deactivate apps as needed
- **Subscription System** - Free, Personal, Business, Enterprise plans
- **Role-Based Access** - User, Admin, Super Admin roles
- **Cross-App Integration** - Apps can share data seamlessly

### **Available Micro Apps:**

#### **Personal Apps (Free)**
- **💡 PIMS** - Personal Ideas Management System
  - Organize ideas by categories and priorities
  - Convert ideas to actionable tasks
  - Project organization and team collaboration
  - Progress tracking and analytics

- **✅ Task Manager** - Advanced task management
  - Time tracking and priority management
  - Team collaboration features

- **📝 Note Taking** - Rich text note management
  - Rich text editor with formatting
  - Note organization with tags and folders
  - Search functionality

#### **Business Apps (Requires Business Plan)**
- **👥 CRM** - Customer Relationship Manager
  - Contact management and lead tracking
  - Sales pipeline monitoring

- **📊 Project Management** - Advanced project management
  - Gantt charts and resource allocation
  - Team collaboration tools

## 🏗️ Architecture

```
Just Everything Platform
├── Platform Authentication & User Management
├── Micro App Management System
├── All Tab (Cross-app features)
├── Personal Tab
│   ├── PIMS (Personal Ideas Management) ✅
│   ├── Task Manager
│   └── Note Taking
├── Business Tab
│   ├── CRM
│   └── Project Management
└── Shared Services
    ├── File Storage
    ├── Notifications
    └── Data Analytics
```

## 🛠️ Technology Stack

### **Frontend:**
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Router** for navigation

### **Backend:**
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing

## 🚀 Getting Started

### **Prerequisites:**
- Node.js (v16 or higher)
- MongoDB (running locally or cloud instance)
- npm or yarn

### **Installation:**

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd PIMS
   ```

2. **Install dependencies:**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Set up environment variables:**
   ```bash
   # Create server/config.env
   cd server
   cp config.env.example config.env
   ```
   
   Edit `server/config.env`:
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/just-everything
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. **Set up the platform:**
   ```bash
   cd server
   node scripts/setupPlatform.js
   ```

5. **Start the servers:**
   ```bash
   # Terminal 1: Start backend
   cd server
   node index.js
   
   # Terminal 2: Start frontend
   npm start
   ```

6. **Access the platform:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 👤 Demo Credentials

**Platform Admin:**
- Email: `admin@justeverything.com`
- Password: `admin123456`

## 📱 Using the Platform

### **1. Platform Login**
- Visit http://localhost:3000
- Login with the demo credentials above
- You'll see the main platform dashboard

### **2. Activate Apps**
- Browse available apps in All/Personal/Business tabs
- Click "Activate App" to enable an app
- PIMS is pre-activated for the admin user

### **3. Use PIMS**
- Click "Open App" on the PIMS card
- You'll be taken to the PIMS interface
- Use the "Back to Platform" button to return

### **4. App Management**
- Activate/deactivate apps as needed
- Apps show subscription requirements
- Business apps require Business plan

## 🔧 Development

### **Adding New Micro Apps:**

1. **Create the app model:**
   ```javascript
   // server/models/MicroApp.js
   const newApp = new MicroApp({
     appId: 'your-app',
     name: 'your-app',
     displayName: 'Your App',
     description: 'Description of your app',
     category: 'personal', // or 'business'
     icon: '🎯',
     color: '#3B82F6',
     route: '/apps/your-app',
     // ... other properties
   });
   ```

2. **Add to platform setup:**
   ```javascript
   // server/scripts/setupPlatform.js
   // Add your app to the sampleApps array
   ```

3. **Create frontend component:**
   ```typescript
   // src/components/YourApp.tsx
   // Create your app component similar to PimsApp.tsx
   ```

4. **Integrate with platform:**
   ```typescript
   // src/App.tsx
   // Add routing for your app
   ```

### **API Endpoints:**

#### **Platform Authentication:**
- `POST /api/platform/auth/login` - Platform login
- `POST /api/platform/auth/register` - Platform registration
- `GET /api/platform/auth/me` - Get current user

#### **Micro App Management:**
- `GET /api/platform/apps` - Get all available apps
- `POST /api/platform/apps/:appId/activate` - Activate app
- `POST /api/platform/apps/:appId/deactivate` - Deactivate app

#### **PIMS API (Legacy):**
- `GET /api/ideas` - Get all ideas
- `POST /api/ideas` - Create idea
- `PUT /api/ideas/:id` - Update idea
- `DELETE /api/ideas/:id` - Delete idea
- Similar endpoints for projects and tasks

## 🎯 Key Benefits

1. **Scalable Architecture** - Easy to add new micro apps
2. **Unified Experience** - Single login, consistent UI
3. **Monetization Ready** - Subscription-based model
4. **Data Integration** - Apps can share data seamlessly
5. **User Choice** - Users activate only the apps they need

## 🔮 Future Enhancements

- **More Micro Apps** - Calendar, Email, Analytics, etc.
- **Subscription Management** - Stripe integration
- **File Storage** - Shared file management
- **Notifications** - Cross-app notifications
- **Mobile App** - React Native version
- **API Documentation** - Swagger/OpenAPI
- **Analytics Dashboard** - Usage analytics
- **Team Management** - Multi-user organizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for productivity enthusiasts everywhere!**

