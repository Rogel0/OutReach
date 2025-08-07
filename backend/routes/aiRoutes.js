const express = require("express");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Initialize OpenAI client
let openai = null;

console.log("🔑 Checking OpenAI configuration...");

// Initialize OpenAI
if (process.env.OPENAI_API_KEY) {
  console.log("✅ OpenAI API key found, initializing client...");
  try {
    const OpenAI = require("openai");
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("✅ OpenAI client initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing OpenAI client:", error);
    openai = null;
  }
} else {
  console.log("⚠️ No OpenAI API key found");
}

// System prompt for the virtual assistant
const SYSTEM_PROMPT = `You are ARIA (Advanced Responsive Intelligence Assistant), a highly sophisticated Virtual Assistant specializing in comprehensive business support and task management. You excel at understanding nuanced requests and providing precise, actionable assistance.

ENHANCED UNDERSTANDING CAPABILITIES:
- Natural Language Processing: Interpret context, implied needs, and business jargon
- Intent Recognition: Identify primary goals even when communicated indirectly
- Multi-turn Conversation Memory: Remember and reference previous conversation details
- Business Context Awareness: Understand industry standards, common practices, and professional expectations
- Clarification Intelligence: Ask the RIGHT questions to eliminate ambiguity

CORE SERVICE EXPERTISE:
1. Executive & Administrative Support (correspondence, scheduling, document management)
2. Meeting & Calendar Coordination (complex scheduling, conflict resolution, agenda preparation)
3. Email Management & Professional Communication (inbox organization, response drafting, campaign management)
4. Research & Business Intelligence (market research, competitor analysis, data compilation)
5. Travel & Event Planning (comprehensive trip coordination, venue booking, logistics)
6. Project Management Support (timeline creation, resource coordination, progress tracking)
7. Client Relationship Management (follow-ups, database management, communication tracking)
8. Content Creation & Marketing Support (social media, blogs, presentations, materials)
9. Technical Setup & Integration (software configuration, workflow automation, tool training)
10. Financial Task Support (expense tracking, invoice management, budget analysis)

INTELLIGENT INFORMATION EXTRACTION:
CRITICAL DATA (Always Required):
- Full Name & Professional Title
- Primary Email & Phone (if provided)
- Company/Organization Details
- Specific Task Category & Subcategory
- Comprehensive Task Description
- Timeline & Deadline Requirements
- Priority Level & Urgency Factors
- Budget Parameters & Constraints

CONTEXTUAL INTELLIGENCE (Adapt Based on Task):
For Administrative: Document types, approval processes, stakeholders, confidentiality levels
For Meetings: Attendee roles, decision-making authority, follow-up requirements, recording needs
For Research: Competitive landscape, target audience, deliverable formats, citation requirements
For Travel: Travel policies, accommodation preferences, expense limitations, visa requirements
For Communications: Brand voice, approval workflows, compliance requirements, audience segments
For Projects: Success metrics, resource availability, dependency mapping, risk factors

ADVANCED CONVERSATION STRATEGIES:
1. CONTEXT MAPPING: Build comprehensive understanding from fragmented information
2. PROACTIVE QUESTIONING: Anticipate needs and ask relevant follow-up questions
3. EXPERTISE DEMONSTRATION: Show deep knowledge of business processes and best practices
4. SOLUTION ORIENTATION: Provide immediate value while gathering requirements
5. EXPECTATION MANAGEMENT: Set realistic timelines and communicate potential challenges
6. PROFESSIONAL RAPPORT: Match communication style to client's business level and preferences
7. SERVICE PRE-SELECTION: When a service is pre-selected (servicePreSelected=true), skip general category questions and immediately focus on specific service requirements

SERVICE-SPECIFIC INTELLIGENT QUESTIONING:
When taskCategory is already known (especially if servicePreSelected=true), immediately ask specific, targeted questions:

Administrative Support: "What type of administrative tasks? (document management, correspondence, data entry, filing, scheduling) What's the volume and frequency? Any specific software or systems involved?"

Calendar Management: "What type of scheduling needs? (personal calendar, team coordination, client meetings, recurring events) Which calendar systems do you use? Any specific time zones or constraints?"

Email Management: "What email assistance do you need? (inbox organization, response drafting, campaign management, newsletter creation) What's your email volume and current pain points?"

Research & Analysis: "What research topic and scope? What type of deliverable do you need? (report, presentation, data compilation) What sources should be included? What's your target timeline?"

Travel Planning: "Where and when do you need to travel? What's your budget range? Any preferences for airlines, hotels, or specific requirements? Business or leisure travel?"

Data Processing: "What type of data work? (entry, analysis, spreadsheet creation, database management) What's the data source and desired output format? Any specific tools required?"

Customer Support: "What support channels need coverage? (email, phone, chat, social media) What's your customer base size? Any existing scripts or knowledge base? Response time expectations?"

Financial Tasks: "What financial assistance do you need? (expense tracking, invoice management, budget analysis, bookkeeping) Which software do you use? What's the scope and frequency?"

INTELLIGENT RESPONSE PATTERNS:
- When unclear: "To ensure I deliver exactly what you need, could you help me understand..."
- When expertise shows: "Based on my experience with similar projects, I recommend..."
- When timeline matters: "Given the complexity and timeline, here's what I suggest..."
- When budget is factor: "To maximize value within your budget, we could..."
- When alternatives exist: "I see a few approaches that could work well for your situation..."

ACCURACY ENHANCEMENT RULES:
1. Never assume details not explicitly stated or strongly implied
2. Always confirm critical requirements before marking ready=true
3. Provide specific, actionable next steps rather than generic responses
4. Reference previous conversation elements to show continuity
5. Ask for clarification when multiple interpretations are possible
6. Suggest relevant additional services that align with stated goals
7. Demonstrate understanding through detailed, contextual responses
8. NEVER repeat questions that have already been answered in the conversation history
9. Always check conversation history and collected data before asking for information
10. Extract timeline/deadline information from any mention of dates, times, or urgency

CONVERSATION MEMORY RULES:
- Before asking ANY question, check if the information was already provided in conversation history
- Look for timeline information in phrases like "by tomorrow", "next week", "ASAP", "urgent", specific dates
- Extract deadlines from natural language: "need it done by Friday" = deadline is Friday
- If user mentions urgency words (urgent, ASAP, immediately, critical), set priority to urgent
- Parse relative dates: "tomorrow" = next day, "next week" = 7 days from now, "end of month" = last day of current month
- Don't ask for deadline if any time-related information was mentioned in conversation

RESPONSE INTELLIGENCE:
- Tailor complexity to match client's communication style
- Include relevant industry insights when applicable
- Offer immediate actionable advice alongside information gathering
- Reference specific tools, platforms, or methodologies when relevant
- Provide realistic time estimates based on task complexity
- Suggest process improvements or efficiency gains when appropriate

Response format: Always respond with JSON containing:
{
  "message": "Intelligent, contextual response demonstrating deep understanding and providing immediate value while gathering needed information",
  "needsMoreInfo": true/false,
  "collectedData": {
    "name": "full professional name",
    "email": "primary contact email", 
    "company": "organization/company details",
    "taskCategory": "specific primary category",
    "taskSubtype": "detailed subcategory or specialization",
    "description": "comprehensive task description with context",
    "priority": "urgent/high/medium/low with reasoning",
    "deadline": "specific timeline with flexibility indicators",
    "budget": "budget range with value expectations",
    "communicationMethod": "preferred contact and update frequency",
    "additionalDetails": "stakeholders, tools, constraints, special requirements"
  },
  "missingFields": ["specific", "information", "still", "needed"],
  "ready": true/false,
  "suggestedNextSteps": ["immediate", "actionable", "steps", "with", "timelines"],
  "estimatedTimeline": "realistic professional timeline with milestone breakdown"
}`;

// Validation middleware
const validateChatRequest = [
  body("message")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1 and 1000 characters"),
  body("conversationHistory")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Conversation history must be an array with max 20 messages"),
  body("conversationData")
    .optional()
    .isObject()
    .withMessage("Conversation data must be an object"),
];

// Chat endpoint for AI conversation
router.post("/chat", validateChatRequest, async (req, res) => {
  console.log("🤖 AI Chat endpoint called");
  console.log("Request body:", req.body);
  console.log("🔍 OpenAI Status Check:");
  console.log("- OpenAI client:", !!openai);
  console.log("- OpenAI Key:", !!process.env.OPENAI_API_KEY);

  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const {
      message,
      conversationHistory = [],
      conversationData = {},
    } = req.body;

    console.log("📝 Processing message:", message);
    console.log("📊 Conversation data:", conversationData);

    let aiResponse;

    // Try OpenAI with timeout
    if (openai && process.env.OPENAI_API_KEY) {
      console.log("🤖 Attempting OpenAI API call...");
      console.log("API Key length:", process.env.OPENAI_API_KEY?.length);
      console.log(
        "API Key starts with:",
        process.env.OPENAI_API_KEY?.substring(0, 20)
      );

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("OpenAI API call timeout")), 10000)
        );

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `CONVERSATION CONTEXT: Current collected data: ${JSON.stringify(
              conversationData
            )}. Always check this data before asking questions. Never ask for information that's already been provided.`,
          },
          ...conversationHistory,
          { role: "user", content: message },
        ];

        const completionPromise = openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: messages,
          max_tokens: 500,
          temperature: 0.7,
          response_format: { type: "json_object" },
        });

        const completion = await Promise.race([
          completionPromise,
          timeoutPromise,
        ]);

        console.log("✅ OpenAI API call successful");
        console.log("OpenAI Response:", completion.choices[0].message.content);

        aiResponse = JSON.parse(completion.choices[0].message.content);
        console.log("✅ Parsed OpenAI response:", aiResponse);
      } catch (openaiError) {
        console.error("❌ OpenAI API error:", openaiError.message);
        console.error("❌ OpenAI Error details:", {
          status: openaiError.status,
          type: openaiError.type,
          code: openaiError.code,
        });

        // Fall back to rule-based response
        console.log("🔄 Falling back to rule-based response...");
        aiResponse = generateRuleBasedResponse(message, conversationData);
      }
    } else {
      console.log("⚠️ OpenAI not configured, using rule-based response");
      aiResponse = generateRuleBasedResponse(message, conversationData);
    }

    console.log("✅ Sending AI response:", aiResponse);

    res.json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error("❌ Error in AI chat:", error);

    // Emergency fallback
    const emergencyResponse = generateRuleBasedResponse(
      req.body.message || "Hello",
      req.body.conversationData || {}
    );

    res.json({
      success: true,
      data: emergencyResponse,
    });
  }
});

// Enhanced Rule-based response generator for fallback
function generateRuleBasedResponse(message, conversationData) {
  const lowerMessage = message.toLowerCase();
  const isServicePreSelected = conversationData.servicePreSelected === true;

  // Enhanced name extraction with multiple patterns
  let extractedName = "";
  const namePatterns = [
    /(?:my name is|i'm|i am|call me|this is)\s+([a-zA-Z\s\-'\.]+?)(?:\s|$|\.|,)/i,
    /^([a-zA-Z\s\-'\.]+?)(?:\s+here|,|\s+from|\s+at|\s+with)/i,
    /(?:hi|hello|hey),?\s*(?:i'm|i am|this is)\s+([a-zA-Z\s\-'\.]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) {
      extractedName = match[1].trim().replace(/\b\w+@\w+\.\w+/g, ""); // Remove emails
      if (extractedName.length > 2 && extractedName.length < 50) break;
    }
  }

  // Enhanced email extraction
  let extractedEmail = "";
  const emailMatch = message.match(
    /\b[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9][A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  );
  if (emailMatch) {
    extractedEmail = emailMatch[0];
  }

  // Enhanced company extraction
  let extractedCompany = "";
  const companyPatterns = [
    /(?:work at|working at|employed at|from|company is|at)\s+([a-zA-Z\s&.,\-'Inc]+?)(?:\s|$|\.|,|and|for)/i,
    /([a-zA-Z\s&.,\-'Inc]+?)\s+(?:company|corporation|corp|inc|llc|ltd|solutions|services|technologies|tech)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = message.match(pattern);
    if (match) {
      extractedCompany = match[1].trim();
      if (extractedCompany.length > 2 && extractedCompany.length < 100) break;
    }
  }

  // Enhanced deadline/timeline extraction
  let extractedDeadline = conversationData.deadline || "";
  const timelinePatterns = [
    /(?:by|before|until|deadline|due)\s+([a-zA-Z0-9\s,]+?)(?:\s|$|\.|,)/i,
    /(?:need it|want it|completed|finished|done)\s+(?:by|before|until)\s+([a-zA-Z0-9\s,]+?)(?:\s|$|\.|,)/i,
    /([a-zA-Z]+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i, // Date patterns like "August 6, 2025" or "August 6th"
    /(tomorrow|next week|next month|end of week|end of month|asap|immediately)/i,
    /(\d{1,2}\/\d{1,2}\/?\d{0,4})/i, // Date patterns like 8/6/2025 or 8/6
    /(\d{1,2}-\d{1,2}-?\d{0,4})/i, // Date patterns like 8-6-2025
  ];

  for (const pattern of timelinePatterns) {
    const match = message.match(pattern);
    if (match && !extractedDeadline) {
      extractedDeadline = match[1].trim();
      break;
    }
  }

  // Enhanced task category detection with better pattern matching
  let taskCategory = conversationData.taskCategory || "";
  let taskPriority = conversationData.priority || "medium";

  // Priority detection with timeline urgency
  if (
    lowerMessage.includes("urgent") ||
    lowerMessage.includes("asap") ||
    lowerMessage.includes("immediately") ||
    lowerMessage.includes("critical") ||
    lowerMessage.includes("emergency")
  ) {
    taskPriority = "urgent";
    if (!extractedDeadline) extractedDeadline = "ASAP";
  } else if (
    lowerMessage.includes("high priority") ||
    lowerMessage.includes("important") ||
    lowerMessage.includes("soon") ||
    lowerMessage.includes("quickly")
  ) {
    taskPriority = "high";
  } else if (
    lowerMessage.includes("low priority") ||
    lowerMessage.includes("when possible") ||
    lowerMessage.includes("no rush") ||
    lowerMessage.includes("whenever")
  ) {
    taskPriority = "low";
  }

  // Enhanced task categorization (only if not pre-selected)
  if (!taskCategory) {
    if (
      lowerMessage.match(
        /(?:meeting|schedule|calendar|appointment|call|conference|zoom|teams)/
      )
    ) {
      taskCategory = "Calendar Management";
    } else if (
      lowerMessage.match(
        /(?:email|communication|newsletter|campaign|outreach|correspondence)/
      )
    ) {
      taskCategory = "Email Management";
    } else if (
      lowerMessage.match(
        /(?:research|find|search|analyze|investigation|study|report)/
      )
    ) {
      taskCategory = "Research & Analysis";
    } else if (
      lowerMessage.match(
        /(?:travel|trip|booking|hotel|flight|accommodation|itinerary)/
      )
    ) {
      taskCategory = "Travel Planning";
    } else if (
      lowerMessage.match(
        /(?:social media|facebook|twitter|instagram|linkedin|social|content|post)/
      )
    ) {
      taskCategory = "Social Media Management";
    } else if (
      lowerMessage.match(
        /(?:data entry|spreadsheet|excel|database|input|organize|filing)/
      )
    ) {
      taskCategory = "Data Processing";
    } else if (
      lowerMessage.match(
        /(?:project|manage|coordinate|timeline|milestone|deliverable)/
      )
    ) {
      taskCategory = "Project Management";
    } else if (
      lowerMessage.match(
        /(?:customer|client|support|service|help|assistance|inquiry)/
      )
    ) {
      taskCategory = "Customer Support";
    } else if (
      lowerMessage.match(
        /(?:admin|administrative|document|file|organize|paperwork)/
      )
    ) {
      taskCategory = "Administrative Support";
    } else if (
      lowerMessage.match(
        /(?:content|writing|blog|article|copy|marketing|website)/
      )
    ) {
      taskCategory = "Content Creation";
    }
  }

  // Merge new data with existing conversation data
  const currentName = extractedName || conversationData.name || "";
  const currentEmail = extractedEmail || conversationData.email || "";
  const currentCompany = extractedCompany || conversationData.company || "";
  const currentTaskCategory =
    taskCategory || conversationData.taskCategory || "";
  const currentPriority = taskPriority || conversationData.priority || "medium";
  const currentDeadline = extractedDeadline || conversationData.deadline || "";

  // Generate appropriate response based on conversation state
  let responseMessage = "";
  let needsMoreInfo = true;
  let ready = false;
  let missingFields = [];
  let currentDescription = conversationData.description || "";

  // Enhanced description handling
  if (
    currentTaskCategory &&
    !extractedName &&
    !extractedEmail &&
    !extractedCompany
  ) {
    // This message is likely task details, not personal info
    if (!currentDescription || currentDescription === conversationData.name) {
      currentDescription = message;
    } else if (!currentDescription.includes(message.substring(0, 20))) {
      currentDescription += " " + message;
    }
  }

  // Enhanced response generation with better context awareness
  if (!currentName) {
    responseMessage =
      "Hello! I'm ARIA, your Virtual Assistant. To get started, could you please tell me your name?";
    missingFields = ["name"];
  } else if (!currentEmail) {
    responseMessage = `Hi ${currentName}! It's great to meet you. Could you please provide your email address so I can keep you updated on our progress?`;
    missingFields = ["email"];
  } else if (!currentTaskCategory) {
    responseMessage = `Perfect! I have your contact details, ${currentName}. What can I help you with today? I specialize in meeting management, email support, research, travel planning, project coordination, content creation, and administrative tasks. What type of assistance do you need?`;
    missingFields = ["taskCategory"];
  } else {
    // We have name, email, and task category - ask for specific details
    if (
      !currentDescription ||
      currentDescription.length < 15 ||
      currentDescription === currentName
    ) {
      const taskSpecificQuestions = {
        "Administrative Support":
          "What type of administrative tasks do you need help with? (document management, correspondence, data entry, filing, scheduling) What's the volume and frequency? Any specific software or systems involved?",
        "Calendar Management":
          "What type of scheduling assistance do you need? (personal calendar, team coordination, client meetings, recurring events) Which calendar systems do you use? Any specific time zones or scheduling constraints?",
        "Email Management":
          "What email assistance do you need? (inbox organization, response drafting, campaign management, newsletter creation) What's your current email volume and main pain points?",
        "Research & Analysis":
          "What research topic and scope are you looking for? What type of deliverable do you need? (report, presentation, data compilation) What sources should be included and what's your target timeline?",
        "Travel Planning":
          "Where and when do you need to travel? What's your budget range? Any preferences for airlines, hotels, or special requirements? Is this business or leisure travel?",
        "Data Processing":
          "What type of data work do you need? (entry, analysis, spreadsheet creation, database management) What's the data source and desired output format? Any specific tools required?",
        "Customer Support":
          "What support channels need coverage? (email, phone, chat, social media) What's your customer base size? Any existing scripts or knowledge base? What are your response time expectations?",
        "Financial Tasks":
          "What financial assistance do you need? (expense tracking, invoice management, budget analysis, bookkeeping) Which software do you use? What's the scope and frequency of work needed?",
      };

      const specificQuestion =
        taskSpecificQuestions[currentTaskCategory] ||
        "specific requirements, timeline, and expected outcomes?";

      if (isServicePreSelected) {
        responseMessage = `Perfect! I see you need help with ${currentTaskCategory}. Let me gather the specific details to provide you with the best assistance. ${specificQuestion}`;
      } else {
        responseMessage = `Excellent! For ${currentTaskCategory}, I'll need some more details to ensure I deliver exactly what you need. Could you tell me about: ${specificQuestion}`;
      }
      missingFields = ["description"];
    } else if (!currentDeadline) {
      // Only ask for deadline if not already provided
      responseMessage = `Thank you for those details! To prioritize this properly, when do you need this completed? Is there a specific deadline or timeline I should be aware of?`;
      missingFields = ["deadline"];
    } else {
      // We have all required information
      ready = true;
      needsMoreInfo = false;
      const timelineText = currentDeadline
        ? ` with a ${currentDeadline} deadline`
        : "";
      responseMessage = `Perfect! I have all the information needed to get started on your ${currentTaskCategory.toLowerCase()} request${timelineText}. Based on what you've shared, I'll begin working on this and provide regular updates via email at ${currentEmail}. You can expect an initial progress report within 24 hours.`;
      missingFields = [];
    }
  }

  return {
    message: responseMessage,
    needsMoreInfo,
    collectedData: {
      name: currentName,
      email: currentEmail,
      company: currentCompany,
      taskCategory: currentTaskCategory,
      description: currentDescription,
      priority: currentPriority,
      deadline: currentDeadline,
      budget: conversationData.budget || "",
      communicationMethod: conversationData.communicationMethod || "email",
      additionalDetails: conversationData.additionalDetails || "",
    },
    missingFields,
    ready,
    suggestedNextSteps: ready
      ? [
          "Review and confirm project requirements",
          "Set up communication schedule",
          "Begin initial task execution",
          "Provide progress updates",
        ]
      : [
          "Provide missing information",
          "Clarify any requirements",
          "Confirm details and timeline",
        ],
    estimatedTimeline: ready
      ? `Initial progress within 24 hours${
          currentDeadline
            ? `, completion by ${currentDeadline}`
            : ", full completion timeline to be confirmed based on project scope"
        }`
      : "Timeline will be provided once all requirements are gathered",
  };
}

module.exports = router;
