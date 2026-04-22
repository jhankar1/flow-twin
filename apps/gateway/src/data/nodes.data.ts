// Auto-extracted from apps/frontend — single source of truth for node definitions

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const NODE_DEFINITIONS: any[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: FLOW CONTROL
  // Universal nodes — every flow type uses these
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "flow-start",
    type: "customNode",
    category: "FlowControl",
    categoryLabel: "FLOW CONTROL",
    label: "Start",
    inputs: [],
    outputs: [{ id: "out-1", label: "Next" }],
    info: "Entry point of any flow. Captures the trigger context — who started it, when, and with what initial data.",
    configValues: {
      flowName: "",
      triggerType: "manual",
      lotIdPrefix: "BATCH",
      description: "",
    },
    _schema: {
      flowName: {
        component: "Text",
        label: "Flow Name",
        placeholder: "e.g. Ginger Syrup Extraction v1",
      },
      triggerType: {
        component: "Select",
        label: "Trigger Type",
        options: ["manual", "scheduled", "webhook", "event"],
      },
      lotIdPrefix: {
        component: "Text",
        label: "Lot ID Prefix",
        placeholder: "e.g. GIN → GIN-2026-0041",
      },
      description: {
        component: "Textarea",
        label: "Description",
        placeholder: "What does this flow do?",
      },
    },
  },

  {
    Nodeid: "flow-end",
    type: "customNode",
    category: "FlowControl",
    categoryLabel: "FLOW CONTROL",
    label: "End",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [],
    info: "Terminal node. Marks the flow as complete, triggers final actions like report generation and notifications.",
    configValues: {
      generateReport: true,
      notifyOwner: true,
      completionMessage: "Flow completed successfully.",
    },
    _schema: {
      generateReport: {
        component: "Toggle",
        label: "Generate Batch Report",
      },
      notifyOwner: {
        component: "Toggle",
        label: "Notify Flow Designer",
      },
      completionMessage: {
        component: "Text",
        label: "Completion Message",
        placeholder: "Message shown to the worker on completion",
      },
    },
  },

  {
    Nodeid: "flow-condition",
    type: "customNode",
    category: "FlowControl",
    categoryLabel: "FLOW CONTROL",
    label: "Condition",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-true", label: "True" },
      { id: "out-false", label: "False" },
    ],
    info: "Evaluates a logical expression and routes the flow to True or False branch. Supports field references using {{node_id.field_name}} syntax.",
    configValues: {
      expression: "",
      trueLabel: "Yes",
      falseLabel: "No",
    },
    _schema: {
      expression: {
        component: "Textarea",
        label: "Condition Expression",
        placeholder: "e.g. {{form_intake.weight_kg}} > 100",
      },
      trueLabel: {
        component: "Text",
        label: "True Branch Label",
        placeholder: "Yes / Pass / Approved",
      },
      falseLabel: {
        component: "Text",
        label: "False Branch Label",
        placeholder: "No / Fail / Rejected",
      },
    },
  },

  {
    Nodeid: "flow-parallel",
    type: "customNode",
    category: "FlowControl",
    categoryLabel: "FLOW CONTROL",
    label: "Parallel Split",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-1", label: "Branch A" },
      { id: "out-2", label: "Branch B" },
      { id: "out-3", label: "Branch C" },
    ],
    info: "Splits the flow into multiple parallel branches that execute simultaneously. All branches must complete before flow continues.",
    configValues: {
      branchCount: 2,
      waitForAll: true,
    },
    _schema: {
      branchCount: {
        component: "Select",
        label: "Number of Branches",
        options: ["2", "3", "4"],
      },
      waitForAll: {
        component: "Toggle",
        label: "Wait for All Branches",
      },
    },
  },

  {
    Nodeid: "flow-wait",
    type: "customNode",
    category: "FlowControl",
    categoryLabel: "FLOW CONTROL",
    label: "Wait / Timer",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "After Wait" }],
    info: "Pauses the flow for a specified duration. Temporal handles this durably — the server can restart and the wait continues correctly.",
    configValues: {
      duration: 24,
      unit: "hours",
      reason: "",
    },
    _schema: {
      duration: {
        component: "Text",
        label: "Duration",
        placeholder: "e.g. 24",
      },
      unit: {
        component: "Select",
        label: "Unit",
        options: ["minutes", "hours", "days"],
      },
      reason: {
        component: "Text",
        label: "Reason (shown to worker)",
        placeholder: "e.g. Waiting for lab results",
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: COMMUNICATION
  // Notification, email, SMS, in-app — Notif Worker + SMS Worker
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "comm-message",
    type: "customNode",
    category: "Communication",
    categoryLabel: "COMMUNICATION",
    label: "Message Composer",
    inputs: [{ id: "in-1", label: "Data" }],
    outputs: [{ id: "out-1", label: "Sent" }],
    info: "Compose omnichannel messages (email, SMS, push) with personalization tokens.",
    configValues: {
      channel: "email",
      subject: "Welcome to BotaniFlow",
      body: "Hi {{firstName}}, thanks for trying the builder!",
      footer: "BotaniFlow Team",
    },
    _schema: {
      channel: {
        component: "Select",
        label: "Channel",
        options: ["email", "sms", "push", "whatsapp"],
      },
      subject: {
        component: "Text",
        label: "Subject or Title",
        placeholder: "What the user sees first",
      },
      body: {
        component: "Textarea",
        label: "Message Body",
        placeholder: "Supports handlebars variables e.g. {{firstName}}",
      },
      footer: {
        component: "Text",
        label: "Signature / Footer",
        placeholder: "Who is sending this?",
      },
    },
  },

  {
    Nodeid: "comm-notification",
    type: "customNode",
    category: "Communication",
    categoryLabel: "COMMUNICATION",
    label: "In-App Notification",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Sent" }],
    info: "Pushes a real-time in-app notification to a specific user or role via WebSocket. Appears as a bell alert.",
    configValues: {
      toRole: "manager",
      toUserId: "",
      title: "",
      message: "",
      level: "info",
      actionLabel: "",
      actionUrl: "",
    },
    _schema: {
      toRole: {
        component: "Select",
        label: "Notify Role",
        options: ["designer", "worker", "qa_supervisor", "manager", "iiot_admin", "org_admin"],
      },
      toUserId: {
        component: "Text",
        label: "Or Specific User ID",
        placeholder: "Leave blank to notify all in role",
      },
      title: {
        component: "Text",
        label: "Notification Title",
        placeholder: "e.g. Batch GIN-0041 needs review",
      },
      message: {
        component: "Textarea",
        label: "Message",
        placeholder: "Supports {{batch.id}}, {{worker.name}} tokens",
      },
      level: {
        component: "Select",
        label: "Level",
        options: ["info", "warn", "error", "success"],
      },
      actionLabel: {
        component: "Text",
        label: "Action Button Label",
        placeholder: "e.g. View Batch",
      },
      actionUrl: {
        component: "Text",
        label: "Action URL",
        placeholder: "e.g. /batches/{{batch.id}}",
      },
    },
  },

  {
    Nodeid: "comm-webhook",
    type: "customNode",
    category: "Communication",
    categoryLabel: "COMMUNICATION",
    label: "Webhook",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-success", label: "Success" },
      { id: "out-failure", label: "Failure" },
    ],
    info: "Posts the current flow context to an external URL. Used for integrating with third-party systems that support webhooks.",
    configValues: {
      url: "",
      method: "POST",
      headers: "{}",
      includeContext: true,
      retryCount: 2,
      timeoutSec: 10,
    },
    _schema: {
      url: {
        component: "Text",
        label: "Webhook URL",
        placeholder: "https://your-system.com/webhook",
      },
      method: {
        component: "Select",
        label: "HTTP Method",
        options: ["POST", "PUT"],
      },
      headers: {
        component: "Textarea",
        label: "Headers (JSON)",
        placeholder: '{"Authorization": "Bearer token"}',
      },
      includeContext: {
        component: "Toggle",
        label: "Include Full Batch Context",
      },
      retryCount: {
        component: "Text",
        label: "Retry Attempts",
        placeholder: "2",
      },
      timeoutSec: {
        component: "Text",
        label: "Timeout (seconds)",
        placeholder: "10",
      },
    },
  },

  {
    Nodeid: "comm-rest-api",
    type: "customNode",
    category: "Communication",
    categoryLabel: "COMMUNICATION",
    label: "REST API Call",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-success", label: "Success" },
      { id: "out-failure", label: "Failure" },
    ],
    info: "Calls any external REST API and maps the response to a flow variable for use in downstream nodes.",
    configValues: {
      url: "",
      method: "GET",
      headers: "{}",
      body: "{}",
      responseMapping: "",
    },
    _schema: {
      url: {
        component: "Text",
        label: "API URL",
        placeholder: "https://api.example.com/endpoint",
      },
      method: {
        component: "Select",
        label: "Method",
        options: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      },
      headers: {
        component: "Textarea",
        label: "Headers (JSON)",
        placeholder: '{"Content-Type": "application/json"}',
      },
      body: {
        component: "Textarea",
        label: "Request Body (JSON)",
        placeholder: '{"key": "{{flow.value}}"}',
      },
      responseMapping: {
        component: "Text",
        label: "Map Response to Variable",
        placeholder: "e.g. api_response",
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: FORMS & INPUT
  // Human data entry — Form Worker
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "form-step",
    type: "customNode",
    category: "Forms",
    categoryLabel: "FORMS & INPUT",
    label: "Form Step",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Submitted" }],
    info: "Renders a multi-field form to the worker in ENB execution mode. Temporal waits indefinitely for submission. Supports text, number, select, and file fields.",
    configValues: {
      title: "",
      fields: [],
      submitLabel: "Submit & Continue",
      allowSaveDraft: false,
    },
    _schema: {
      title: {
        component: "Text",
        label: "Step Title",
        placeholder: "e.g. Raw Material Intake",
      },
      fields: {
        component: "FieldBuilder",
        label: "Form Fields",
        placeholder: "Add fields using the field builder",
      },
      submitLabel: {
        component: "Text",
        label: "Submit Button Label",
        placeholder: "Submit & Continue",
      },
      allowSaveDraft: {
        component: "Toggle",
        label: "Allow Save as Draft",
      },
    },
  },

  {
    Nodeid: "form-approval",
    type: "customNode",
    category: "Forms",
    categoryLabel: "FORMS & INPUT",
    label: "Approval Gate",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-approved", label: "Approved" },
      { id: "out-rejected", label: "Rejected" },
    ],
    info: "Pauses the flow and waits for a human to approve or reject. Sends notification to approver(s). Supports multi-approver and SLA escalation.",
    configValues: {
      approverRole: "qa_supervisor",
      approverUserId: "",
      multiApprove: false,
      requiredCount: 1,
      message: "Please review and approve this step.",
      slaHours: 24,
      escalateToRole: "manager",
    },
    _schema: {
      approverRole: {
        component: "Select",
        label: "Approver Role",
        options: ["qa_supervisor", "manager", "org_admin"],
      },
      approverUserId: {
        component: "Text",
        label: "Or Specific Approver User ID",
        placeholder: "Leave blank to notify all in role",
      },
      multiApprove: {
        component: "Toggle",
        label: "Require Multiple Approvers",
      },
      requiredCount: {
        component: "Text",
        label: "Required Approvals",
        placeholder: "e.g. 2",
      },
      message: {
        component: "Textarea",
        label: "Approval Request Message",
        placeholder: "What should the approver see?",
      },
      slaHours: {
        component: "Text",
        label: "SLA — Auto-escalate After (hours)",
        placeholder: "24",
      },
      escalateToRole: {
        component: "Select",
        label: "Escalate To",
        options: ["manager", "org_admin"],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: DATA
  // Database read/write — DB Worker
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "data-db-write",
    type: "customNode",
    category: "Data",
    categoryLabel: "DATA",
    label: "DB Write",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Saved" }],
    info: "Inserts or updates a record in the PostgreSQL database. Supports INSERT, UPDATE, and UPSERT operations.",
    configValues: {
      table: "",
      operation: "upsert",
      data: "{}",
      conflictKey: "id",
    },
    _schema: {
      table: {
        component: "Text",
        label: "Table Name",
        placeholder: "e.g. batch_entries",
      },
      operation: {
        component: "Select",
        label: "Operation",
        options: ["insert", "update", "upsert"],
      },
      data: {
        component: "Textarea",
        label: "Data (JSON)",
        placeholder: '{"batchId": "{{batch.id}}", "value": "{{form.value}}"}',
      },
      conflictKey: {
        component: "Text",
        label: "Conflict Key (for upsert)",
        placeholder: "id",
      },
    },
  },

  {
    Nodeid: "data-db-read",
    type: "customNode",
    category: "Data",
    categoryLabel: "DATA",
    label: "DB Read",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Result" }],
    info: "Queries the database and maps the result to a flow variable for downstream use.",
    configValues: {
      query: "",
      params: "[]",
      mapTo: "db_result",
    },
    _schema: {
      query: {
        component: "Textarea",
        label: "SQL Query",
        placeholder: "SELECT * FROM master_materials WHERE id = $1",
      },
      params: {
        component: "Textarea",
        label: "Parameters (JSON Array)",
        placeholder: '["{{form.material_id}}"]',
      },
      mapTo: {
        component: "Text",
        label: "Map Result to Variable",
        placeholder: "db_result",
      },
    },
  },

  {
    Nodeid: "data-script",
    type: "customNode",
    category: "Data",
    categoryLabel: "DATA",
    label: "Script / Formula",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Computed" }],
    info: "Runs a Python script for calculations, statistical analysis, or data transformations. Powered by the Python Worker.",
    configValues: {
      language: "python",
      code: "# Access inputs via context dict\nyield_pct = (context['output_weight'] / context['input_weight']) * 100\nreturn {'yield_pct': round(yield_pct, 2)}",
      inputs: "[]",
      outputs: "[]",
    },
    _schema: {
      language: {
        component: "Select",
        label: "Language",
        options: ["python", "javascript"],
      },
      code: {
        component: "CodeEditor",
        label: "Script",
        placeholder: "Write your computation here",
      },
      inputs: {
        component: "Textarea",
        label: "Input Variables (JSON Array)",
        placeholder: '["batch_intake.input_weight", "batch_drying.output_weight"]',
      },
      outputs: {
        component: "Textarea",
        label: "Output Variables (JSON Array)",
        placeholder: '["yield_pct"]',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: AI
  // Intelligence layer — AI Worker (Claude API)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "ai-decision",
    type: "customNode",
    category: "AI",
    categoryLabel: "AI",
    label: "AI Decision",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-true", label: "Approved" },
      { id: "out-false", label: "Escalate" },
    ],
    info: "Sends context to Claude AI for a structured decision. Returns a boolean decision, confidence score, and reasoning. Auto-approves if confidence exceeds the threshold.",
    configValues: {
      prompt: "",
      contextFields: "[]",
      autoApproveThreshold: 0.9,
      outputVariable: "ai_decision",
    },
    _schema: {
      prompt: {
        component: "Textarea",
        label: "Decision Prompt",
        placeholder: "e.g. Is the pH level {{sensor_ph.value}} within safe range for food processing?",
      },
      contextFields: {
        component: "Textarea",
        label: "Context Fields to Include (JSON Array)",
        placeholder: '["sensor_temp.value", "form_intake.material_type"]',
      },
      autoApproveThreshold: {
        component: "Text",
        label: "Auto-Approve Confidence Threshold (0–1)",
        placeholder: "0.9",
      },
      outputVariable: {
        component: "Text",
        label: "Output Variable Name",
        placeholder: "ai_decision",
      },
    },
  },

  {
    Nodeid: "ai-anomaly",
    type: "customNode",
    category: "AI",
    categoryLabel: "AI",
    label: "Anomaly Detector",
    inputs: [{ id: "in-1", label: "Sensor Stream" }],
    outputs: [
      { id: "out-normal", label: "Normal" },
      { id: "out-anomaly", label: "Anomaly Detected" },
    ],
    info: "Analyses a stream of sensor readings using AI to detect unusual patterns. Fires the anomaly branch if a problem is detected, with explanation and suggested action.",
    configValues: {
      sensorVariable: "",
      windowSize: 10,
      sensitivity: "medium",
      outputVariable: "anomaly_result",
    },
    _schema: {
      sensorVariable: {
        component: "Text",
        label: "Sensor Variable to Watch",
        placeholder: "e.g. mqtt_temp.temperature_c",
      },
      windowSize: {
        component: "Text",
        label: "Reading Window Size",
        placeholder: "10 (last N readings)",
      },
      sensitivity: {
        component: "Select",
        label: "Sensitivity",
        options: ["low", "medium", "high"],
      },
      outputVariable: {
        component: "Text",
        label: "Output Variable",
        placeholder: "anomaly_result",
      },
    },
  },

  {
    Nodeid: "ai-quality-predict",
    type: "customNode",
    category: "AI",
    categoryLabel: "AI",
    label: "Quality Predictor",
    inputs: [{ id: "in-1", label: "Batch Data" }],
    outputs: [{ id: "out-1", label: "Prediction Ready" }],
    info: "Uses AI to predict the final quality grade of a batch mid-process, based on current readings. Returns predicted grade, score, and recommendations to improve output.",
    configValues: {
      contextFields: "[]",
      outputVariable: "quality_prediction",
      showToWorker: true,
    },
    _schema: {
      contextFields: {
        component: "Textarea",
        label: "Input Fields for Prediction (JSON Array)",
        placeholder: '["sensor_temp.value", "form_sugar.weight_kg", "sensor_ph.value"]',
      },
      outputVariable: {
        component: "Text",
        label: "Output Variable",
        placeholder: "quality_prediction",
      },
      showToWorker: {
        component: "Toggle",
        label: "Show Prediction to Worker",
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: CUSTOMER PROCESS
  // Bus booking, applications, registrations — Payment/OTP/Storage Workers
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "customer-payment",
    type: "customNode",
    category: "CustomerProcess",
    categoryLabel: "CUSTOMER PROCESS",
    label: "Payment",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-success", label: "Paid" },
      { id: "out-failure", label: "Failed" },
    ],
    info: "Collects payment via Razorpay / Stripe / UPI. Locks the session during payment and releases on success or timeout.",
    configValues: {
      gateway: "razorpay",
      amount: "",
      currency: "INR",
      description: "",
      lockTimeoutMins: 10,
      retryCount: 2,
      receiptTo: "{{form_details.email}}",
    },
    _schema: {
      gateway: {
        component: "Select",
        label: "Payment Gateway",
        options: ["razorpay", "stripe", "upi"],
      },
      amount: {
        component: "Text",
        label: "Amount",
        placeholder: "{{pricing.total}} or fixed value e.g. 499",
      },
      currency: {
        component: "Select",
        label: "Currency",
        options: ["INR", "USD", "EUR"],
      },
      description: {
        component: "Text",
        label: "Payment Description",
        placeholder: "e.g. Bus ticket — {{seat_select.route}}",
      },
      lockTimeoutMins: {
        component: "Text",
        label: "Session Lock Timeout (mins)",
        placeholder: "10",
      },
      retryCount: {
        component: "Text",
        label: "Retry Attempts on Failure",
        placeholder: "2",
      },
      receiptTo: {
        component: "Text",
        label: "Send Receipt To",
        placeholder: "{{form_details.email}}",
      },
    },
  },

  {
    Nodeid: "customer-otp",
    type: "customNode",
    category: "CustomerProcess",
    categoryLabel: "CUSTOMER PROCESS",
    label: "OTP Verify",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-verified", label: "Verified" },
      { id: "out-failed", label: "Failed" },
    ],
    info: "Sends an OTP via SMS or email and waits for the user to enter it. Supports resend and maximum attempt limits.",
    configValues: {
      channel: "sms",
      to: "{{form_details.phone}}",
      length: 6,
      expiryMins: 5,
      maxAttempts: 3,
    },
    _schema: {
      channel: {
        component: "Select",
        label: "Channel",
        options: ["sms", "email", "whatsapp"],
      },
      to: {
        component: "Text",
        label: "Send To",
        placeholder: "{{form_details.phone}} or {{form_details.email}}",
      },
      length: {
        component: "Select",
        label: "OTP Length",
        options: ["4", "6"],
      },
      expiryMins: {
        component: "Text",
        label: "Expires After (minutes)",
        placeholder: "5",
      },
      maxAttempts: {
        component: "Text",
        label: "Max Attempts",
        placeholder: "3",
      },
    },
  },

  {
    Nodeid: "customer-doc-upload",
    type: "customNode",
    category: "CustomerProcess",
    categoryLabel: "CUSTOMER PROCESS",
    label: "Document Upload",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-uploaded", label: "Uploaded" },
      { id: "out-skipped", label: "Skipped" },
    ],
    info: "Accepts file uploads from the user. Stores securely in SeaweedFS (S3-compatible). Optionally triggers AI validation of the uploaded document.",
    configValues: {
      label: "Upload Document",
      accept: "image/jpeg,image/png,application/pdf",
      maxSizeMB: 5,
      required: true,
      aiValidate: false,
      aiValidationPrompt: "",
      mapTo: "uploaded_doc",
    },
    _schema: {
      label: {
        component: "Text",
        label: "Upload Label",
        placeholder: "e.g. Upload Government ID",
      },
      accept: {
        component: "Text",
        label: "Accepted File Types",
        placeholder: "image/jpeg,image/png,application/pdf",
      },
      maxSizeMB: {
        component: "Text",
        label: "Max File Size (MB)",
        placeholder: "5",
      },
      required: {
        component: "Toggle",
        label: "Required",
      },
      aiValidate: {
        component: "Toggle",
        label: "AI Validate Document",
      },
      aiValidationPrompt: {
        component: "Textarea",
        label: "AI Validation Prompt",
        placeholder: "e.g. Is this a valid government-issued photo ID?",
      },
      mapTo: {
        component: "Text",
        label: "Map File URL to Variable",
        placeholder: "uploaded_doc",
      },
    },
  },

  {
    Nodeid: "customer-slot-booking",
    type: "customNode",
    category: "CustomerProcess",
    categoryLabel: "CUSTOMER PROCESS",
    label: "Slot Booking",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-booked", label: "Booked" }],
    info: "Shows available time slots from a calendar and lets the user book one. Handles slot locking to prevent double-booking.",
    configValues: {
      calendarId: "",
      durationMins: 30,
      bufferMins: 10,
      advanceDays: 7,
      timezone: "Asia/Kolkata",
      mapTo: "booked_slot",
    },
    _schema: {
      calendarId: {
        component: "Text",
        label: "Calendar / Resource ID",
        placeholder: "e.g. doctor_001 or machine_press_3",
      },
      durationMins: {
        component: "Text",
        label: "Slot Duration (minutes)",
        placeholder: "30",
      },
      bufferMins: {
        component: "Text",
        label: "Buffer Between Slots (minutes)",
        placeholder: "10",
      },
      advanceDays: {
        component: "Text",
        label: "Book Up To N Days in Advance",
        placeholder: "7",
      },
      timezone: {
        component: "Text",
        label: "Timezone",
        placeholder: "Asia/Kolkata",
      },
      mapTo: {
        component: "Text",
        label: "Map Booking to Variable",
        placeholder: "booked_slot",
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: BUSINESS PROCESS
  // Onboarding, approvals, HR, ops — Signature/Auth/Integration Workers
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "business-e-signature",
    type: "customNode",
    category: "BusinessProcess",
    categoryLabel: "BUSINESS PROCESS",
    label: "E-Signature",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-signed", label: "Signed" },
      { id: "out-declined", label: "Declined" },
    ],
    info: "Generates a document from a template, fills it with flow data, and requests a legally-binding e-signature. Powered by OpenSign (MIT).",
    configValues: {
      documentTemplate: "",
      fillVars: "{}",
      signerField: "{{trigger.userId}}",
      storeTo: "s3://hr-docs/{{trigger.userId}}/",
      reminderHours: 48,
    },
    _schema: {
      documentTemplate: {
        component: "Text",
        label: "Document Template ID",
        placeholder: "e.g. offer_letter_v3",
      },
      fillVars: {
        component: "Textarea",
        label: "Template Variables (JSON)",
        placeholder: '{"employee_name": "{{form_details.full_name}}", "joining_date": "{{form_details.date}}"}',
      },
      signerField: {
        component: "Text",
        label: "Signer User ID",
        placeholder: "{{trigger.userId}}",
      },
      storeTo: {
        component: "Text",
        label: "Store Signed Doc To",
        placeholder: "s3://hr-docs/{{trigger.userId}}/signed.pdf",
      },
      reminderHours: {
        component: "Text",
        label: "Send Reminder After (hours)",
        placeholder: "48",
      },
    },
  },

  {
    Nodeid: "business-account-create",
    type: "customNode",
    category: "BusinessProcess",
    categoryLabel: "BUSINESS PROCESS",
    label: "Account Create",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-created", label: "Created" },
      { id: "out-failed", label: "Failed" },
    ],
    info: "Creates user accounts in one or more external systems — Google Workspace, Slack, Jira, and more. Sends credentials automatically.",
    configValues: {
      systems: "google_workspace,slack",
      email: "{{form_details.work_email}}",
      role: "{{form_details.designation}}",
      team: "{{form_details.department}}",
      sendCredentialsTo: "{{form_details.personal_email}}",
    },
    _schema: {
      systems: {
        component: "MultiSelect",
        label: "Systems to Create Account In",
        options: ["google_workspace", "slack", "jira", "github", "notion", "hubspot"],
      },
      email: {
        component: "Text",
        label: "Work Email",
        placeholder: "{{form_details.work_email}}",
      },
      role: {
        component: "Text",
        label: "Role / Designation",
        placeholder: "{{form_details.designation}}",
      },
      team: {
        component: "Text",
        label: "Team / Department",
        placeholder: "{{form_details.department}}",
      },
      sendCredentialsTo: {
        component: "Text",
        label: "Send Login Credentials To",
        placeholder: "{{form_details.personal_email}}",
      },
    },
  },

  {
    Nodeid: "business-sla-timer",
    type: "customNode",
    category: "BusinessProcess",
    categoryLabel: "BUSINESS PROCESS",
    label: "SLA Timer",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-within-sla", label: "Within SLA" },
      { id: "out-breached", label: "SLA Breached" },
    ],
    info: "Waits for an event within a defined SLA window. If the window expires before the event occurs, escalates automatically to the defined role.",
    configValues: {
      waitHours: 24,
      escalateToRole: "manager",
      escalationMessage: "",
      breachAction: "escalate",
    },
    _schema: {
      waitHours: {
        component: "Text",
        label: "SLA Window (hours)",
        placeholder: "24",
      },
      escalateToRole: {
        component: "Select",
        label: "Escalate To",
        options: ["manager", "org_admin", "qa_supervisor"],
      },
      escalationMessage: {
        component: "Textarea",
        label: "Escalation Message",
        placeholder: "Approval for {{form_details.name}} pending for {{sla.hours}} hours",
      },
      breachAction: {
        component: "Select",
        label: "On SLA Breach",
        options: ["escalate", "auto_approve", "cancel_flow"],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: INDUSTRIAL / IIOT
  // Factory floor, sensors, machines, quality — MQTT Worker + Python Worker
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "iiot-sensor-read",
    type: "customNode",
    category: "Industrial",
    categoryLabel: "INDUSTRIAL / IIOT",
    label: "Sensor Read",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-normal", label: "Normal" },
      { id: "out-flagged", label: "Out of Range" },
    ],
    info: "Reads live data from a physical sensor via MQTT or Modbus. Auto-fills the field in ENB mode. Fires the Out of Range output if value breaches configured limits.",
    configValues: {
      sensorId: "",
      mqttTopic: "",
      parameter: "",
      unit: "",
      min: "",
      max: "",
      readMode: "continuous",
      windowSec: 30,
      onOutOfRange: "flag",
      mapTo: "",
    },
    _schema: {
      sensorId: {
        component: "Text",
        label: "Sensor Device ID",
        placeholder: "e.g. thermocouple_tank3",
      },
      mqttTopic: {
        component: "Text",
        label: "MQTT Topic",
        placeholder: "factory/tank3/temperature",
      },
      parameter: {
        component: "Text",
        label: "Parameter Name",
        placeholder: "e.g. temperature_c",
      },
      unit: {
        component: "Text",
        label: "Unit",
        placeholder: "°C / kg / pH / %",
      },
      min: {
        component: "Text",
        label: "Min Acceptable Value",
        placeholder: "e.g. 60",
      },
      max: {
        component: "Text",
        label: "Max Acceptable Value",
        placeholder: "e.g. 95",
      },
      readMode: {
        component: "Select",
        label: "Read Mode",
        options: ["continuous", "on_demand", "average_window"],
      },
      windowSec: {
        component: "Text",
        label: "Averaging Window (seconds)",
        placeholder: "30",
      },
      onOutOfRange: {
        component: "Select",
        label: "On Out of Range",
        options: ["flag", "block", "auto_correct"],
      },
      mapTo: {
        component: "Text",
        label: "Map Reading to Variable",
        placeholder: "e.g. sensor_temp",
      },
    },
  },

  {
    Nodeid: "iiot-actuator-cmd",
    type: "customNode",
    category: "Industrial",
    categoryLabel: "INDUSTRIAL / IIOT",
    label: "Actuator Command",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-ack", label: "Acknowledged" },
      { id: "out-timeout", label: "Timeout" },
    ],
    info: "Publishes a command to a physical actuator via MQTT. Used for closed-loop control — e.g. adjust boiler temperature, open a valve, set conveyor speed.",
    configValues: {
      deviceId: "",
      mqttTopic: "",
      command: "",
      value: "",
      confirmationTopic: "",
      timeoutSec: 10,
    },
    _schema: {
      deviceId: {
        component: "Text",
        label: "Device ID",
        placeholder: "e.g. boiler_controller_01",
      },
      mqttTopic: {
        component: "Text",
        label: "MQTT Command Topic",
        placeholder: "factory/boiler/setpoint",
      },
      command: {
        component: "Text",
        label: "Command",
        placeholder: "e.g. SET_TEMPERATURE",
      },
      value: {
        component: "Text",
        label: "Command Value",
        placeholder: "{{ai_decision.recommended_temp}} or fixed value",
      },
      confirmationTopic: {
        component: "Text",
        label: "Confirmation Topic (optional)",
        placeholder: "factory/boiler/ack",
      },
      timeoutSec: {
        component: "Text",
        label: "Timeout (seconds)",
        placeholder: "10",
      },
    },
  },

  {
    Nodeid: "iiot-qa-check",
    type: "customNode",
    category: "Industrial",
    categoryLabel: "INDUSTRIAL / IIOT",
    label: "QA Check",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [
      { id: "out-pass", label: "Pass" },
      { id: "out-fail", label: "Fail" },
    ],
    info: "Quality gate node. Evaluates multiple parameters (sensor + manual + formula) against spec limits. AI assists with borderline cases. Requires supervisor approval on fail.",
    configValues: {
      parameters: "[]",
      aiAssist: true,
      approverRole: "qa_supervisor",
      allowOverride: true,
    },
    _schema: {
      parameters: {
        component: "QAParameterBuilder",
        label: "QA Parameters",
        placeholder: "Add parameters with min/max/source",
      },
      aiAssist: {
        component: "Toggle",
        label: "AI Assists on Borderline Cases",
      },
      approverRole: {
        component: "Select",
        label: "Approver on Fail",
        options: ["qa_supervisor", "manager"],
      },
      allowOverride: {
        component: "Toggle",
        label: "Allow Supervisor Override",
      },
    },
  },

  {
    Nodeid: "iiot-monitor-start",
    type: "customNode",
    category: "Industrial",
    categoryLabel: "INDUSTRIAL / IIOT",
    label: "Monitor Start",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Monitoring" }],
    info: "Starts a long-running Temporal Monitor Workflow that watches a sensor parameter continuously. Fires alerts and notifies users when thresholds are crossed.",
    configValues: {
      sensorId: "",
      parameter: "",
      warnMin: "",
      warnMax: "",
      alertMin: "",
      alertMax: "",
      monitorType: "threshold",
      notifyRole: "manager",
      duration: "shift_8h",
    },
    _schema: {
      sensorId: {
        component: "Text",
        label: "Sensor Device ID",
        placeholder: "e.g. thermocouple_tank3",
      },
      parameter: {
        component: "Text",
        label: "Parameter to Monitor",
        placeholder: "e.g. temperature_c",
      },
      warnMin: {
        component: "Text",
        label: "Warn Below",
        placeholder: "e.g. 60",
      },
      warnMax: {
        component: "Text",
        label: "Warn Above",
        placeholder: "e.g. 95",
      },
      alertMin: {
        component: "Text",
        label: "Alert Below",
        placeholder: "e.g. 50",
      },
      alertMax: {
        component: "Text",
        label: "Alert Above",
        placeholder: "e.g. 105",
      },
      monitorType: {
        component: "Select",
        label: "Monitor Type",
        options: ["threshold", "pattern", "correlation"],
      },
      notifyRole: {
        component: "Select",
        label: "Notify Role on Alert",
        options: ["manager", "qa_supervisor", "iiot_admin", "org_admin"],
      },
      duration: {
        component: "Select",
        label: "Monitor Duration",
        options: ["shift_8h", "shift_12h", "24h", "indefinite"],
      },
    },
  },

  {
    Nodeid: "iiot-compliance",
    type: "customNode",
    category: "Industrial",
    categoryLabel: "INDUSTRIAL / IIOT",
    label: "Compliance Record",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Recorded" }],
    info: "Generates a compliance record (FSSAI, GMP, ISO) from the current batch data. Stores signed PDF with full audit trail.",
    configValues: {
      standard: "fssai",
      templateId: "",
      includeFields: "[]",
      signedBy: "{{approver.name}}",
      storeTo: "s3://compliance/{{batch.id}}/",
    },
    _schema: {
      standard: {
        component: "Select",
        label: "Compliance Standard",
        options: ["fssai", "gmp", "iso_9001", "haccp", "custom"],
      },
      templateId: {
        component: "Text",
        label: "Report Template ID",
        placeholder: "e.g. fssai_batch_record_v2",
      },
      includeFields: {
        component: "Textarea",
        label: "Fields to Include (JSON Array)",
        placeholder: '["batch.id", "sensor_temp.value", "qa_check.result"]',
      },
      signedBy: {
        component: "Text",
        label: "Signed By",
        placeholder: "{{approver.name}}",
      },
      storeTo: {
        component: "Text",
        label: "Store Report To",
        placeholder: "s3://compliance/{{batch.id}}/record.pdf",
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: REPORTS
  // PDF generation, exports — Report Worker
  // ═══════════════════════════════════════════════════════════════════════════

  {
    Nodeid: "report-generate",
    type: "customNode",
    category: "Reports",
    categoryLabel: "REPORTS",
    label: "Generate Report",
    inputs: [{ id: "in-1", label: "In" }],
    outputs: [{ id: "out-1", label: "Generated" }],
    info: "Generates a PDF or Excel report from batch data, sensor readings, and form submissions. Uses a pre-built template or custom layout.",
    configValues: {
      format: "pdf",
      template: "batch_summary",
      includeCharts: true,
      storeTo: "s3://reports/{{batch.id}}/",
      emailTo: "",
    },
    _schema: {
      format: {
        component: "Select",
        label: "Report Format",
        options: ["pdf", "excel", "csv"],
      },
      template: {
        component: "Select",
        label: "Report Template",
        options: ["batch_summary", "quality_report", "compliance_record", "custom"],
      },
      includeCharts: {
        component: "Toggle",
        label: "Include Charts / Graphs",
      },
      storeTo: {
        component: "Text",
        label: "Store Report To",
        placeholder: "s3://reports/{{batch.id}}/report.pdf",
      },
      emailTo: {
        component: "Text",
        label: "Email Report To (optional)",
        placeholder: "{{org.managerEmail}}",
      },
    },
  },

];
