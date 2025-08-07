# 🤖 Smart Virtual Assistant Reach Out System

A full-stack MERN application featuring an AI-powered chatbot for collecting user requests, scheduling tasks, and providing support through intelligent conversation.

## 🌟 Features

### 💬 AI-Powered Chat Interface

- **Intelligent Conversation Flow**: Uses OpenAI GPT-4 API with fallback rule-based logic
- **Dynamic Information Collection**: Gathers user details through natural conversation
- **Real-time Chat Interface**: Responsive React-based chat UI with typing indicators
- **Smart Validation**: Validates user input and guides conversation completion

### 🛠 Backend API

- **RESTful API**: Express.js server with comprehensive endpoints
- **MongoDB Integration**: Mongoose ODM for data persistence
- **Input Validation**: Server-side validation with express-validator
- **Security Features**: Helmet, CORS, and rate limiting
- **Email Notifications**: Optional Nodemailer integration

### 📱 Responsive Frontend

- **Modern React with TypeScript**: Type-safe component architecture
- **Tailwind CSS Styling**: Beautiful, responsive design
- **Real-time Updates**: Live chat interface with smooth animations
- **Admin Dashboard**: Optional admin panel for managing requests

### 🗄 Database Management

- **MongoDB Schema**: Structured data models for task requests
- **Indexing**: Optimized queries for better performance
- **Data Validation**: Schema-level validation and sanitization

## 🔧 Tech Stack

| Layer              | Technologies                              |
| ------------------ | ----------------------------------------- |
| **Frontend**       | React, TypeScript, Tailwind CSS, Axios    |
| **Backend**        | Node.js, Express.js, MongoDB, Mongoose    |
| **AI Integration** | OpenAI GPT-4 API with rule-based fallback |
| **Security**       | Helmet, CORS, Express Validator, BCrypt   |
| **Development**    | Nodemon, Concurrently, ESLint             |

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- OpenAI API Key (optional, has fallback)

### Installation

1. **Clone and Setup**

   ```bash
   git clone <repository-url>
   cd smart-virtual-assistant
   npm run install:all
   ```

2. **Configure Environment Variables**

   **Backend (.env)**:

   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/smart-va
   OPENAI_API_KEY=your_openai_api_key_here  # Optional
   ```

   **Frontend (.env)**:

   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. **Start Development Servers**

   ```bash
   npm run dev
   ```

   This runs both frontend (port 3000) and backend (port 5000) simultaneously.

## 📝 API Documentation

### Chat Endpoint

```http
POST /api/ai/chat
Content-Type: application/json

{
  "message": "Hello, I need help scheduling a meeting",
  "conversationHistory": [...]
}
```

### Task Submission

```http
POST /api/tasks
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "taskType": "meeting",
  "message": "Need to schedule team sync",
  "schedule": "Tomorrow 2 PM"
}
```

### Admin Endpoints

```http
GET /api/tasks                    # Get all tasks
GET /api/tasks/:id               # Get specific task
PATCH /api/tasks/:id/status      # Update task status
```

## 🎯 Usage Examples

### User Conversation Flow

1. **Greeting**: AI initiates conversation
2. **Information Gathering**: Collects name, email, task type, details
3. **Confirmation**: Summarizes collected information
4. **Submission**: Stores request in database
5. **Follow-up**: Optional email confirmation

### Supported Task Types

- **Meetings**: Schedule meetings with participants and timing
- **Reminders**: Set up personal or team reminders
- **Support**: Technical support or general inquiries
- **Scheduling**: Appointment and event scheduling
- **Other**: Custom request types

## 🔐 Security Features

- **Input Validation**: Server-side validation for all endpoints
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Additional HTTP security headers
- **Data Sanitization**: MongoDB injection prevention

## 🌐 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy to Vercel
```

### Backend (Railway/Render)

```bash
cd backend
# Set environment variables
# Deploy to your platform of choice
```

### Database (MongoDB Atlas)

Update `MONGODB_URI` in your environment variables to point to Atlas cluster.

## 📊 Project Structure

```
smart-virtual-assistant/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ChatInterface.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── App.tsx
│   │   └── index.css        # Tailwind CSS
│   └── package.json
├── backend/                 # Express.js API server
│   ├── models/             # Mongoose schemas
│   │   └── TaskRequest.js
│   ├── routes/             # API routes
│   │   ├── taskRoutes.js
│   │   └── aiRoutes.js
│   ├── server.js           # Main server file
│   └── package.json
├── .github/
│   └── copilot-instructions.md
└── README.md
```

## 🧪 Testing

### Manual Testing

1. Start the development servers: `npm run dev`
2. Open http://localhost:3000
3. Test the chat flow from greeting to submission
4. Verify database storage
5. Test admin dashboard at /admin

### API Testing with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Chat test
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi, I need help"}'
```

## 🔄 Development Workflow

1. **Start Development**: `npm run dev`
2. **Backend Only**: `npm run backend:dev`
3. **Frontend Only**: `npm run frontend:dev`
4. **Build for Production**: `npm run frontend:build`

## 🎨 Customization

### AI Prompts

Modify the `SYSTEM_PROMPT` in `backend/routes/aiRoutes.js` to customize AI behavior.

### UI Styling

Update Tailwind configuration in `frontend/tailwind.config.js` for custom themes.

### Database Schema

Extend `backend/models/TaskRequest.js` for additional fields.

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Change ports in environment files
2. **MongoDB Connection**: Ensure MongoDB is running or Atlas connection string is correct
3. **OpenAI API**: System works with rule-based fallback if API key is missing
4. **CORS Errors**: Verify FRONTEND_URL in backend .env file

### Debug Mode

Set `NODE_ENV=development` for detailed error messages.

## 📈 Future Enhancements

- [ ] JWT Authentication for admin panel
- [ ] Google Calendar integration
- [ ] Webhook notifications
- [ ] Multi-language support
- [ ] Voice input capability
- [ ] Analytics dashboard
- [ ] Slack/Teams integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For questions or issues:

- Create a GitHub issue
- Check the troubleshooting section
- Review API documentation

---

**Built with ❤️ using the MERN stack and OpenAI**
