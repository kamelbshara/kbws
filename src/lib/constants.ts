export const TEACHING_STRATEGIES = [
  "Cooperative Learning",
  "Problem-Based Learning",
  "Inquiry-Based Learning",
  "Project-Based Learning",
  "Critical Thinking",
  "Discussion and Dialogue",
  "Active Learning",
] as const;

/** Maps each stored (English) strategy value to its message key under lessonPlan.strategies_options. */
export const TEACHING_STRATEGY_KEYS: Record<(typeof TEACHING_STRATEGIES)[number], string> = {
  "Cooperative Learning": "cooperativeLearning",
  "Problem-Based Learning": "problemBasedLearning",
  "Inquiry-Based Learning": "inquiryBasedLearning",
  "Project-Based Learning": "projectBasedLearning",
  "Critical Thinking": "criticalThinking",
  "Discussion and Dialogue": "discussionAndDialogue",
  "Active Learning": "activeLearning",
};

export const TEACHING_TOOLS = [
  "Smart Board",
  "Video",
  "Simulation",
  "Digital Applications",
  "Lab Equipment",
  "Worksheets",
  "Physical Models",
] as const;

/** Maps each stored (English) tool value to its message key under lessonPlan.tools_options. */
export const TEACHING_TOOL_KEYS: Record<(typeof TEACHING_TOOLS)[number], string> = {
  "Smart Board": "smartBoard",
  Video: "video",
  Simulation: "simulation",
  "Digital Applications": "digitalApplications",
  "Lab Equipment": "labEquipment",
  Worksheets: "worksheets",
  "Physical Models": "physicalModels",
};
