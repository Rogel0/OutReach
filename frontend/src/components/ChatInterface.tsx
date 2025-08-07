import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface CollectedData {
  name?: string;
  email?: string;
  company?: string;
  taskCategory?: string;
  taskSubtype?: string;
  description?: string;
  priority?: string;
  deadline?: string;
  budget?: string;
  communicationMethod?: string;
  additionalDetails?: string;
  taskType?: string;
  message?: string;
  schedule?: string;
  servicePreSelected?: boolean;
}

interface APIResponse {
  success: boolean;
  data: AIResponse;
  errors?: unknown[];
}

interface AIResponse {
  message: string;
  needsMoreInfo: boolean;
  collectedData: CollectedData;
  missingFields: string[];
  ready: boolean;
  suggestedNextSteps?: string[];
  estimatedTimeline?: string;
}

const API_BASE_URL = "http://localhost:5000/api";

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: Date.now().toString(),
      text: "Hello! I'm your Professional Virtual Assistant. I'm here to help you with business tasks like administrative support, scheduling, email management, research, and much more. What can I assist you with today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationData, setConversationData] = useState<CollectedData>({});
  const [isTyping, setIsTyping] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (text: string, sender: "user" | "assistant") => {
    if (!text || !sender) {
      console.warn("Invalid message data:", { text, sender });
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      sender,
      timestamp: new Date(),
    };

    try {
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error("Error adding message:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    addMessage(userMessage, "user");
    setIsLoading(true);
    setIsTyping(true);

    try {
      console.log("Sending message to API:", userMessage);
      const response = await axios.post<APIResponse>(
        `${API_BASE_URL}/ai/chat`,
        {
          message: userMessage,
          conversationData,
          conversationHistory: messages.map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text,
          })),
        }
      );

      console.log("API Response:", response.data);

      // Extract data from the nested response structure
      const aiData = response.data.data;
      const { message, collectedData, ready } = aiData;

      setTimeout(() => {
        setIsTyping(false);
        if (message) {
          addMessage(message, "assistant");
        }
        if (collectedData) {
          setConversationData(collectedData);
        }
        if (typeof ready === "boolean") {
          setConversationComplete(ready);
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(
          "I apologize for the technical difficulty. Could you please try again? Our system is working to resolve this issue.",
          "assistant"
        );
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!conversationComplete) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/tasks`, conversationData);

      addMessage(
        "Perfect! Your business request has been successfully submitted. Our team will review your requirements and get back to you within 24 hours with a detailed proposal and next steps. Thank you for choosing our virtual assistant services!",
        "assistant"
      );
      setConversationComplete(false);

      // Reset conversation for new request
      setTimeout(() => {
        setConversationData({});
        addMessage(
          "Is there another business task I can help you with today? I'm here to support all your professional needs!",
          "assistant"
        );
      }, 3000);
    } catch (error) {
      console.error("Error submitting request:", error);
      addMessage(
        "I apologize, but there was an error submitting your request. Please try again, or contact our support team directly if the issue persists.",
        "assistant"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (conversationComplete) {
        handleSubmitRequest();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleServiceClick = async (serviceName: string) => {
    // Create a message indicating the user selected this service
    const serviceMessage = `I need help with ${serviceName}`;

    // Add user message
    addMessage(serviceMessage, "user");
    setIsLoading(true);
    setIsTyping(true);

    try {
      console.log("Service selected:", serviceName);
      const response = await axios.post<APIResponse>(
        `${API_BASE_URL}/ai/chat`,
        {
          message: serviceMessage,
          conversationData: {
            ...conversationData,
            taskCategory: serviceName,
            servicePreSelected: true,
          },
          conversationHistory: messages.map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.text,
          })),
        }
      );

      console.log("Service selection API Response:", response.data);

      // Extract data from the nested response structure
      const aiData = response.data.data;
      const { message, collectedData, ready } = aiData;

      setTimeout(() => {
        setIsTyping(false);
        if (message) {
          addMessage(message, "assistant");
        }
        if (collectedData) {
          setConversationData(collectedData);
        }
        if (typeof ready === "boolean") {
          setConversationComplete(ready);
        }
      }, 1000);
    } catch (error) {
      console.error("Error with service selection:", error);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(
          "I apologize for the technical difficulty. Could you please try again? Our system is working to resolve this issue.",
          "assistant"
        );
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden flex">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-blue-900/5 to-transparent pointer-events-none"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:flex w-80 flex-col bg-white/5 backdrop-blur-xl border-r border-white/10">
        {/* Session Stats */}
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            Session
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl transition-colors hover:bg-white/15">
              <span className="text-purple-200 text-sm font-medium">
                Messages
              </span>
              <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                {messages.length}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl transition-colors hover:bg-white/15">
              <span className="text-purple-200 text-sm font-medium">
                Data Collected
              </span>
              <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                {Object.keys(conversationData).length}/8
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl transition-colors hover:bg-white/15">
              <span className="text-purple-200 text-sm font-medium">
                Status
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  conversationComplete
                    ? "bg-green-500 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {conversationComplete ? "Ready" : "In Progress"}
              </span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-4">Our Services</h3>
          <div className="space-y-2">
            {[
              {
                icon: "💼",
                text: "Administrative Support",
                description: "Document management, correspondence, filing",
              },
              {
                icon: "📅",
                text: "Calendar Management",
                description: "Scheduling, appointments, meeting coordination",
              },
              {
                icon: "📧",
                text: "Email Management",
                description: "Inbox organization, campaigns, responses",
              },
              {
                icon: "🔍",
                text: "Research & Analysis",
                description: "Market research, data compilation, reports",
              },
              {
                icon: "✈️",
                text: "Travel Planning",
                description: "Trip coordination, bookings, itineraries",
              },
              {
                icon: "📊",
                text: "Data Processing",
                description: "Data entry, spreadsheets, organization",
              },
              {
                icon: "📞",
                text: "Customer Support",
                description: "Client communication, service inquiries",
              },
              {
                icon: "💰",
                text: "Financial Tasks",
                description: "Expense tracking, invoicing, budgets",
              },
            ].map((service, index) => (
              <div
                key={index}
                onClick={() => handleServiceClick(service.text)}
                className="group flex flex-col p-3 text-purple-100 hover:text-white hover:bg-white/15 rounded-lg transition-all duration-200 cursor-pointer transform hover:scale-102 border border-transparent hover:border-purple-400/30"
              >
                <div className="flex items-center mb-1">
                  <span className="text-lg mr-4">{service.icon}</span>
                  <span className="text-sm font-medium">{service.text}</span>
                </div>
                <p className="text-xs text-purple-200 group-hover:text-purple-100 ml-8 opacity-75 group-hover:opacity-100 transition-opacity">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-white/5 rounded-lg border border-purple-400/20">
            <p className="text-xs text-purple-200 text-center">
              💡 Click any service above to get started instantly!
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Virtual Assistant
                </h1>
                <p className="text-sm text-purple-200">
                  Business Support & Task Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-sm text-green-200 font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                  message.sender === "user"
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white ml-4"
                    : "bg-white/95 text-gray-800 mr-4 backdrop-blur-sm"
                }`}
              >
                <p className="text-sm leading-relaxed mb-2">{message.text}</p>
                <p
                  className={`text-xs ${
                    message.sender === "user"
                      ? "text-purple-100"
                      : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-white/95 text-gray-800 px-4 py-3 rounded-2xl mr-4 shadow-lg backdrop-blur-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Client Info Panel */}
        {Object.keys(conversationData).length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex-shrink-0">
            <div className="bg-white/10 rounded-xl p-4">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Client Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {conversationData.name && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 transition-colors hover:bg-white/20">
                    <span className="font-bold text-white">Name:</span>
                    <span className="ml-2 text-purple-100">
                      {conversationData.name}
                    </span>
                  </div>
                )}
                {conversationData.email && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 transition-colors hover:bg-white/20">
                    <span className="font-bold text-white">Email:</span>
                    <span className="ml-2 text-purple-100">
                      {conversationData.email}
                    </span>
                  </div>
                )}
                {conversationData.company && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 transition-colors hover:bg-white/20">
                    <span className="font-bold text-white">Company:</span>
                    <span className="ml-2 text-purple-100">
                      {conversationData.company}
                    </span>
                  </div>
                )}
                {(conversationData.taskCategory ||
                  conversationData.taskType) && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 transition-colors hover:bg-white/20">
                    <span className="font-bold text-white">Service:</span>
                    <span className="ml-2 text-purple-100">
                      {conversationData.taskCategory ||
                        conversationData.taskType}
                    </span>
                  </div>
                )}
                {conversationData.priority && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 transition-colors hover:bg-white/20">
                    <span className="font-bold text-white">Priority:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                        conversationData.priority === "urgent"
                          ? "bg-red-500 text-white"
                          : conversationData.priority === "high"
                          ? "bg-orange-500 text-white"
                          : conversationData.priority === "medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-green-500 text-white"
                      }`}
                    >
                      {conversationData.priority.toUpperCase()}
                    </span>
                  </div>
                )}
                {conversationData.deadline && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 transition-colors hover:bg-white/20">
                    <span className="font-bold text-white">Deadline:</span>
                    <span className="ml-2 text-purple-100">
                      {conversationData.deadline}
                    </span>
                  </div>
                )}
                {conversationData.budget && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 transition-colors hover:bg-white/20">
                    <span className="font-bold text-white">Budget:</span>
                    <span className="ml-2 text-purple-100">
                      {conversationData.budget}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white/10 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex-shrink-0">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  conversationComplete
                    ? "Press Enter to submit your request..."
                    : "Type your message..."
                }
                className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition-all duration-200 hover:bg-white/25"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={
                conversationComplete ? handleSubmitRequest : handleSendMessage
              }
              disabled={
                isLoading || (!inputValue.trim() && !conversationComplete)
              }
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 text-sm min-w-[100px] flex items-center justify-center ${
                conversationComplete
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-green-500/25"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-purple-500/25"
              } text-white disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105 active:scale-95`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : conversationComplete ? (
                "Submit ✨"
              ) : (
                "Send 🚀"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
