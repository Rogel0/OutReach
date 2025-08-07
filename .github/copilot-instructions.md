# Copilot Instructions for Smart Virtual Assistant Reach Out System

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a MERN stack Smart Virtual Assistant application with the following structure:

- **Frontend**: React.js with Tailwind CSS for the chatbot interface
- **Backend**: Node.js with Express.js for API endpoints
- **Database**: MongoDB with Mongoose for storing task requests
- **AI Integration**: OpenAI GPT-4 API for intelligent conversation handling

## Key Technologies

- React hooks for state management
- Axios for HTTP requests
- Express.js for RESTful API
- Mongoose for MongoDB ODM
- OpenAI API for AI conversations
- Tailwind CSS for responsive styling

## Code Style Preferences

- Use functional components with React hooks
- Implement async/await for asynchronous operations
- Follow RESTful API conventions
- Use proper error handling and validation
- Implement responsive design patterns
- Follow MERN best practices for folder structure

## AI Assistant Features

- Chat-based interface for user interaction
- Dynamic conversation flow based on user input
- Information collection for task requests (name, email, task type, schedule)
- Integration with OpenAI API for intelligent responses
- Fallback rule-based logic when API is unavailable

## Database Schema

- User requests with fields: name, email, taskType, message, schedule, timestamp
- Proper validation and sanitization
- MongoDB Atlas cloud integration ready
