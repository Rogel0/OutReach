const mongoose = require("mongoose");

const taskRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    company: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    taskCategory: {
      type: String,
      enum: [
        "meeting_management",
        "email_management",
        "research_data_collection",
        "travel_planning",
        "project_management",
        "client_relationship_management",
        "administrative_tasks",
        "social_media_management",
        "content_creation",
        "technical_support",
        "general_support",
        // Legacy support
        "meeting",
        "reminder",
        "support",
        "scheduling",
        "other",
      ],
      default: "general_support",
    },
    taskSubtype: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    deadline: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    budget: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    communicationMethod: {
      type: String,
      enum: ["email", "phone", "video_call", "slack", "teams", "other"],
      default: "email",
    },
    additionalDetails: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Legacy fields for backward compatibility
    taskType: {
      type: String,
      enum: ["meeting", "reminder", "support", "scheduling", "other"],
      default: "other",
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    schedule: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled", "on-hold"],
      default: "pending",
    },
    conversationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
taskRequestSchema.index({ email: 1, createdAt: -1 });
taskRequestSchema.index({ taskType: 1, status: 1 });
taskRequestSchema.index({ createdAt: -1 });

// Virtual for formatting creation date
taskRequestSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Ensure virtual fields are serialized
taskRequestSchema.set("toJSON", {
  virtuals: true,
});

module.exports = mongoose.model("TaskRequest", taskRequestSchema);
