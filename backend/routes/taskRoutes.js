const express = require("express");
const { body, validationResult } = require("express-validator");
const nodemailer = require("nodemailer");

const router = express.Router();

// In-memory storage for when MongoDB is not available
let inMemoryTasks = [];
let taskIdCounter = 1;

// Try to import TaskRequest model, fallback to null if MongoDB not available
let TaskRequest = null;
try {
  TaskRequest = require("../models/TaskRequest");
} catch (error) {
  console.log("TaskRequest model not available - using in-memory storage");
}

// Check if MongoDB is available
const isMongoAvailable = () => {
  return TaskRequest && TaskRequest.db && TaskRequest.db.readyState === 1;
};

// Validation middleware
const validateTaskRequest = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("company")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Company name must be less than 200 characters"),
  body("taskCategory")
    .optional()
    .isIn([
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
    ])
    .withMessage("Invalid task category"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  body("deadline")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Deadline information must be less than 200 characters"),
  body("budget")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Budget information must be less than 100 characters"),
  // Legacy field validation for backward compatibility
  body("taskType")
    .optional()
    .isIn(["meeting", "reminder", "support", "scheduling", "other"])
    .withMessage("Invalid task type"),
  body("message")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Message must be between 10 and 1000 characters"),
  body("schedule")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Schedule information must be less than 200 characters"),
];

// Create a new task request
router.post("/", validateTaskRequest, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      name,
      email,
      company,
      taskCategory,
      taskSubtype,
      description,
      priority,
      deadline,
      budget,
      communicationMethod,
      additionalDetails,
      // Legacy fields
      taskType,
      message,
      schedule,
      conversationData,
    } = req.body;

    let savedTask;

    if (TaskRequest && isMongoAvailable()) {
      // Use MongoDB
      const taskRequest = new TaskRequest({
        name,
        email,
        company,
        taskCategory: taskCategory || taskType || "general_support",
        taskSubtype,
        description: description || message,
        priority: priority || "medium",
        deadline: deadline || schedule,
        budget,
        communicationMethod: communicationMethod || "email",
        additionalDetails,
        // Legacy fields for backward compatibility
        taskType: taskCategory || taskType || "other",
        message: description || message,
        schedule: deadline || schedule,
        conversationData: conversationData || {},
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
      });

      savedTask = await taskRequest.save();
    } else {
      // Use in-memory storage
      console.log("Using in-memory storage for task request");

      savedTask = {
        _id: `task_${taskIdCounter++}`,
        name,
        email,
        company: company || "Not specified",
        taskCategory: taskCategory || taskType || "general_support",
        taskSubtype: taskSubtype || "Not specified",
        description: description || message,
        priority: priority || "medium",
        deadline: deadline || schedule,
        budget: budget || "Not specified",
        communicationMethod: communicationMethod || "email",
        additionalDetails: additionalDetails || "",
        // Legacy fields
        taskType: taskCategory || taskType || "other",
        message: description || message,
        schedule: deadline || schedule,
        conversationData: conversationData || {},
        status: "pending",
        createdAt: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
      };

      inMemoryTasks.push(savedTask);
    }

    // Send confirmation email (optional)
    if (process.env.EMAIL_ENABLED === "true") {
      await sendConfirmationEmail(savedTask);
    }

    res.status(201).json({
      success: true,
      message: "Task request submitted successfully",
      data: {
        id: savedTask._id,
        name: savedTask.name,
        email: savedTask.email,
        taskType: savedTask.taskType,
        status: savedTask.status,
        createdAt: savedTask.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating task request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit task request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get all task requests (admin endpoint)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const taskType = req.query.taskType;

    let tasks, total;

    if (TaskRequest && isMongoAvailable()) {
      // Use MongoDB
      const query = {};
      if (status) query.status = status;
      if (taskType) query.taskType = taskType;

      tasks = await TaskRequest.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select("-conversationData -ipAddress -userAgent");

      total = await TaskRequest.countDocuments(query);
    } else {
      // Use in-memory storage
      console.log("Using in-memory storage for task retrieval");

      let filteredTasks = inMemoryTasks;

      if (status) {
        filteredTasks = filteredTasks.filter((task) => task.status === status);
      }
      if (taskType) {
        filteredTasks = filteredTasks.filter(
          (task) => task.taskType === taskType
        );
      }

      // Sort by creation date (newest first)
      filteredTasks.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      total = filteredTasks.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      tasks = filteredTasks.slice(startIndex, endIndex).map((task) => ({
        _id: task._id,
        name: task.name,
        email: task.email,
        taskType: task.taskType,
        message: task.message,
        schedule: task.schedule,
        priority: task.priority,
        status: task.status,
        createdAt: task.createdAt,
      }));
    }

    res.json({
      success: true,
      data: tasks,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching task requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task requests",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get a specific task request
router.get("/:id", async (req, res) => {
  try {
    const task = await TaskRequest.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task request not found",
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error fetching task request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Update task status (admin endpoint)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (
      !["pending", "in-progress", "completed", "cancelled"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const task = await TaskRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task request not found",
      });
    }

    res.json({
      success: true,
      message: "Task status updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Email notification function
async function sendConfirmationEmail(taskRequest) {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: taskRequest.email,
      subject: "Task Request Confirmation - Smart Virtual Assistant",
      html: `
                <h2>Thank you for your request!</h2>
                <p>Dear ${taskRequest.name},</p>
                <p>We have received your ${
                  taskRequest.taskType
                } request and will get back to you soon.</p>
                <p><strong>Request Details:</strong></p>
                <ul>
                    <li>Task Type: ${taskRequest.taskType}</li>
                    <li>Message: ${taskRequest.message}</li>
                    ${
                      taskRequest.schedule
                        ? `<li>Schedule: ${taskRequest.schedule}</li>`
                        : ""
                    }
                    <li>Request ID: ${taskRequest._id}</li>
                </ul>
                <p>Best regards,<br>Smart Virtual Assistant Team</p>
            `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Confirmation email sent to:", taskRequest.email);
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

module.exports = router;
