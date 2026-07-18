import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { getLocalFallbackResponse } from "./src/behavioral-logic";

dotenv.config();

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ---------------------------------------------------------
  // API ROUTES FIRST
  // ---------------------------------------------------------

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Using getLocalFallbackResponse from behavioral-logic.ts helper module

  // Chat & Coached Habits Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, isEmergency, currentDashboardState } = req.body;

      const ai = getAiClient();

      // Format chat contents for Gemini API
      const systemInstruction = `You are "MindShift AI", a highly empathetic, senior-level behavior coach and addiction specialist.
Your goal is to help the user break bad habits (e.g., screen time, smoking, procrastination, gaming, sugar, etc.) through emotionally intelligent conversation.

CONVERSATION STYLE RULES:
1. Never write long paragraphs of text. Be punchy, supportive, and human.
2. Ask exactly ONE question at a time to keep the conversation flowing.
3. Be friendly, deeply respectful, and professional.
4. Active Listening: Mirror what they say to show deep understanding before pivoting to a therapeutic response.

IF THIS IS AN EMERGENCY (user clicked the "I'm about to relapse" button):
- Set 'widget.type' to 'EmergencyHelpCard'.
- In 'widget', outline a comforting, structured, physical 3-to-4 step grounding intervention (e.g., 'Take three slow deep breaths', 'Drink a cold glass of water', 'Do a 2-minute stretch', 'Text a trusted contact').
- Your conversational 'reply' must be immediately calming, grounding, and non-judgmental. Remind them of their "Why" and assure them this urge will pass.

WIDGET TRIGGER CRITERIA:
Trigger beautifully styled widgets in your response when appropriate:
- 'ProgressCard': Use this to visualize their habit metrics, streak, or reduction (e.g., 'Cigarettes cut down from 20 to 5', 'Days screen-free: 4/7').
- 'GoalCard': Trigger when they define or commit to a specific goal.
- 'ChallengeCard': Offer a small daily challenge (e.g., 'No social media before noon tomorrow').
- 'MoodCard': Present this to check in on their emotional state (usually early in conversation or when they express struggle).
- 'HabitScore': Offer a dynamic score check-in (e.g., score 75/100, level 3, +50 XP).
- 'RiskMeter': Use to visually flag high-risk environments or times.
- 'MissionCard': Create a 'Today's Mission' (e.g., 'Replace your 10 PM gaming slot with 15 mins of reading').
- 'AchievementCard': Celebrate milestones (e.g., 'Urge Defeated', 'First 24 Hours Completed').
- 'MotivationCard': Deliver a powerful, bespoke quote and micro-reflection.
- 'None': Use when only conversational text is needed.

DASHBOARD EXTRACTION RULES:
As the conversation proceeds, continuously extract or update metrics in the 'extractedData' object:
- Name the 'habit' they are addressing.
- Update their 'riskScore' (1 to 10 scale).
- Extract their 'biggestTrigger' (e.g., 'Stress after work', 'Boredom at night').
- Extract 'mostDangerousTime' (e.g., '10 PM', 'After lunch').
- Determine 'recoveryDifficulty' ('Easy', 'Moderate', 'Hard', 'Extreme').
- Calculate 'estimatedSuccessRate' (%).
- Curate a daily action plan consisting of 3 clear tasks (e.g., 'Put phone in drawer at 9 PM', 'Drink herbal tea when craving strikes', 'Complete daily breathing exercise'). Return it as a list of strings.
- Formulate a tailored 'weeklyGoal'.
- Select a bespoke, deeply inspiring 'motivationalQuote'.
- IMPORTANT: Set 'hasEnoughInfoForDashboard' to true only when you have collected enough specific information (at least the habit name, primary trigger, and a target schedule or plan) to build a credible dashboard.

BEHAVIOR TRIGGERS:
- If user says they succeeded, did well, or beat an urge: Set 'celebration' to true (this triggers confetti on frontend) and set 'streakIncrement' to 'increment'.
- If user says they relapsed, failed, or slipped up: Respond with profound warmth, safety, and encouragement (never shame!). Set 'streakIncrement' to 'reset'.
- Else: Set 'celebration' to false and 'streakIncrement' to 'none'.`;

      const modelInputContents: any[] = [];

      // Append history, ensuring we alternate roles between "user" and "model" and do not have consecutive entries of the same role
      if (history && Array.isArray(history)) {
        let lastRole: string | null = null;
        history.forEach((h: any) => {
          let textContent = "";
          if (h.text) {
            textContent = h.text;
          } else if (typeof h.parts === "string") {
            textContent = h.parts;
          } else if (h.parts && h.parts[0] && typeof h.parts[0].text === "string") {
            textContent = h.parts[0].text;
          }

          if (!textContent || !textContent.trim()) return;

          const role = h.role === "assistant" ? "model" : "user";
          if (role === lastRole) {
            // Merge consecutive same-role messages
            if (modelInputContents.length > 0) {
              modelInputContents[modelInputContents.length - 1].parts[0].text += "\n" + textContent;
            }
          } else {
            modelInputContents.push({
              role,
              parts: [{ text: textContent }]
            });
            lastRole = role;
          }
        });
      }

      // Append current state or user prompt
      let promptText = message || "";
      if (isEmergency) {
        promptText = "[CRITICAL EMERGENCY]: I am feeling an intense urge and am about to relapse. Give me an immediate calming emergency intervention!";
      }

      // Add current dashboard context to prompt so model knows what it has extracted so far
      if (currentDashboardState) {
        promptText += `\n\n[CONTEXT] Current Dashboard State: ${JSON.stringify(currentDashboardState)}`;
      }

      // If the last message in history is a "user" message, we can merge or replace it with our rich promptText
      if (modelInputContents.length > 0 && modelInputContents[modelInputContents.length - 1].role === "user") {
        modelInputContents[modelInputContents.length - 1].parts[0].text = promptText;
      } else {
        modelInputContents.push({
          role: "user",
          parts: [{ text: promptText }]
        });
      }

      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro"
      ];

      let response: any = null;
      let lastModelError: any = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Attempting Gemini API request with model: ${modelName}...`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: modelInputContents,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: {
                    type: Type.STRING,
                    description: "The empathetic response. Keep it concise (1-3 sentences). Ask one question if continuing conversation."
                  },
                  widget: {
                    type: Type.OBJECT,
                    properties: {
                      type: {
                        type: Type.STRING,
                        description: "Must be: 'ProgressCard', 'GoalCard', 'ChallengeCard', 'MoodCard', 'HabitScore', 'RiskMeter', 'MissionCard', 'AchievementCard', 'EmergencyHelpCard', 'MotivationCard', or 'None'."
                      },
                      title: { type: Type.STRING },
                      subtitle: { type: Type.STRING },
                      value: { type: Type.NUMBER },
                      max: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      status: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      meta: { type: Type.STRING }
                    },
                    required: ["type"]
                  },
                  extractedData: {
                    type: Type.OBJECT,
                    properties: {
                      habit: { type: Type.STRING },
                      riskScore: { type: Type.INTEGER },
                      biggestTrigger: { type: Type.STRING },
                      mostDangerousTime: { type: Type.STRING },
                      recoveryDifficulty: { type: Type.STRING },
                      estimatedSuccessRate: { type: Type.INTEGER },
                      dailyActionPlan: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      },
                      weeklyGoal: { type: Type.STRING },
                      motivationalQuote: { type: Type.STRING },
                      hasEnoughInfoForDashboard: { type: Type.BOOLEAN }
                    },
                    required: ["hasEnoughInfoForDashboard"]
                  },
                  celebration: { type: Type.BOOLEAN },
                  streakIncrement: { type: Type.STRING }
                },
                required: ["reply", "widget", "extractedData", "celebration", "streakIncrement"]
              }
            }
          });
          console.log(`Successfully generated content using model: ${modelName}`);
          break; // Stop trying other models if successful
        } catch (err: any) {
          console.warn(`Model ${modelName} failed or quota exceeded:`, err.message || err);
          lastModelError = err;
        }
      }

      if (!response) {
        throw lastModelError || new Error("All Gemini models failed.");
      }

      const rawText = response.text || "{}";
      
      // Extract valid JSON block between the first { and the last }
      let cleanText = rawText.trim();
      const firstBrace = cleanText.indexOf("{");
      const lastBrace = cleanText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = cleanText.substring(firstBrace, lastBrace + 1);
      }
      
      const parsedData = JSON.parse(cleanText);
      res.json(parsedData);
    } catch (error: any) {
      console.warn("Gemini API Error (Triggering local fallback response):", error);
      const fallbackResult = getLocalFallbackResponse(
        req.body.message,
        req.body.isEmergency,
        req.body.currentDashboardState,
        req.body.history
      );
      res.json(fallbackResult);
    }
  });

  // ---------------------------------------------------------
  // VITE OR STATIC SERVING
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindShift AI Coach Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
