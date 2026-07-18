import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      apiKey = "AIzaSyAUiqm2iAuL6ftYkNpj9z_6DBEH3CqkToM";
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

  function getLocalFallbackResponse(message: string, isEmergency: boolean) {
    const msg = (message || "").toLowerCase();
    
    let habit = "General Resilience";
    let biggestTrigger = "Emotional stress or fatigue";
    let mostDangerousTime = "Evening hours (8 PM - 11 PM)";
    let recoveryDifficulty = "Moderate";
    let riskScore = 5;
    let estimatedSuccessRate = 75;
    let weeklyGoal = "Build a consistent alternative evening routine.";
    let dailyActionPlan = [
      "Take three slow, deep diaphragmatic breaths when cravings strike",
      "Drink a cool glass of water to clear cognitive fog and reset",
      "Engage with Coach MindShift to reflect on your daily triggers"
    ];
    let motivationalQuote = "Our greatest glory is not in never falling, but in rising every time we fall.";
    let reply = "I am listening closely. Breaking habits is a journey of incremental adjustments. Tell me more about your routine.";
    let widgetType = "None";
    let widgetTitle = "";
    let widgetSubtitle = "";
    
    if (isEmergency) {
      reply = "I hear you, and I am right here with you. This intense urge is a temporary neural event. It will peak and pass. Let's breathe through it together.";
      widgetType = "EmergencyHelpCard";
      widgetTitle = "Emergency Urge Rescue Protocol";
      widgetSubtitle = "Follow these immediate physical steps to ground your nervous system:";
      dailyActionPlan = [
        "Inhale slowly for 4 seconds, hold for 4, exhale for 4, hold for 4.",
        "Stand up and drink a large glass of very cold water.",
        "Walk away from the current environment or device immediately.",
        "Tell yourself: 'This urge is a wave. I am the shore. It will pass.'"
      ];
    } else if (msg.includes("screen") || msg.includes("instagram") || msg.includes("phone") || msg.includes("social")) {
      habit = "Digital Screen Reduction";
      biggestTrigger = "Boredom or procrastination cues";
      mostDangerousTime = "Late night in bed (10 PM - 12 AM)";
      recoveryDifficulty = "Moderate";
      riskScore = 6;
      estimatedSuccessRate = 80;
      weeklyGoal = "Keep phone out of the bedroom after 9:30 PM.";
      dailyActionPlan = [
        "Place your phone in a desk drawer during focused work hours",
        "Substitute 15 minutes of scrolling with a physical paperback book",
        "Set an app timer limit of 45 minutes on social media platforms"
      ];
      reply = "Reducing screen time is a powerful way to reclaim your cognitive bandwidth. It starts with creating physical distance from your devices. Let's work on screen boundaries.";
      widgetType = "ProgressCard";
      widgetTitle = "Screen Time Target";
      widgetSubtitle = "Tracking your target digital boundaries today.";
    } else if (msg.includes("smoke") || msg.includes("cigarette") || msg.includes("vape") || msg.includes("nicotine") || msg.includes("craving")) {
      habit = "Smoking Cessation";
      biggestTrigger = "Stress, coffee pairings, or work transitions";
      mostDangerousTime = "Directly after work (5:30 PM - 7:00 PM)";
      recoveryDifficulty = "Extreme";
      riskScore = 7;
      estimatedSuccessRate = 65;
      weeklyGoal = "Substitute the post-work cigarette with deep breathing.";
      dailyActionPlan = [
        "Keep a clean stress ball or object in hand when transition urges rise",
        "Engage in 2 minutes of brisk walking or stretching during breaks",
        "Sip herbal or black tea slowly as a sensorimotor replacement"
      ];
      reply = "Nicotine cravings are intense but highly predictable. By pairing transition periods with deep breathing, we rewire the physical cue. You've got this.";
      widgetType = "RiskMeter";
      widgetTitle = "Craving Vulnerability Peak";
      widgetSubtitle = "Vulnerability spikes around transition times.";
    } else if (msg.includes("sugar") || msg.includes("sweet") || msg.includes("eat") || msg.includes("food") || msg.includes("cookie") || msg.includes("candy")) {
      habit = "Sugar Reduction";
      biggestTrigger = "Afternoon energy dips or emotional reward seeking";
      mostDangerousTime = "Mid-afternoon slump (3:00 PM - 4:30 PM)";
      recoveryDifficulty = "Moderate";
      riskScore = 5;
      estimatedSuccessRate = 78;
      weeklyGoal = "Replace refined afternoon snacks with fruit or nuts.";
      dailyActionPlan = [
        "Keep a water bottle with freshly sliced lemon at your desk",
        "Wait 10 minutes when a sweet urge strikes to let it dissipate",
        "Ensure a high-protein breakfast to stabilize insulin levels"
      ];
      reply = "Sugar triggers immediate dopamine release, which makes the craving loop highly persistent. Stabilizing your morning nutrition is a great foundation.";
      widgetType = "GoalCard";
      widgetTitle = "Sugar Reduction Target";
      widgetSubtitle = "Transitioning to unrefined, whole foods Snacking.";
    } else if (msg.includes("procrastinate") || msg.includes("delay") || msg.includes("lazy") || msg.includes("study") || msg.includes("work")) {
      habit = "Procrastination Mastery";
      biggestTrigger = "Task aversion and fear of imperfection";
      mostDangerousTime = "Starting the first task (9:00 AM - 11:00 AM)";
      recoveryDifficulty = "Moderate";
      riskScore = 5;
      estimatedSuccessRate = 85;
      weeklyGoal = "Implement the 5-Minute Rule: just start for 5 minutes.";
      dailyActionPlan = [
        "Break high-priority tasks into three tiny micro-steps",
        "Close all unrelated browser tabs before starting a work session",
        "Work in focused 25-minute sprints followed by short physical breaks"
      ];
      reply = "Procrastination is an emotional regulation problem, not a time management one. We avoid tasks because they make us feel anxious or overwhelmed. Let's break it down.";
      widgetType = "ChallengeCard";
      widgetTitle = "25-Min Focus Sprint";
      widgetSubtitle = "Work continuously on one single task for just 25 minutes.";
    } else if (msg.includes("game") || msg.includes("gaming") || msg.includes("xbox") || msg.includes("playstation") || msg.includes("pc")) {
      habit = "Video Game Balance";
      biggestTrigger = "Desire for high-octane escape or social connection";
      mostDangerousTime = "Late evening hours (9:00 PM - 12:00 AM)";
      recoveryDifficulty = "Moderate";
      riskScore = 6;
      estimatedSuccessRate = 72;
      weeklyGoal = "Power down gaming setups completely by 10:00 PM.";
      dailyActionPlan = [
        "Establish a relaxing sleep hygiene ritual starting at 10 PM",
        "Limit high-stimulation multiplayer games to weekend afternoons",
        "Engage in a physical exercise or workout earlier in the day"
      ];
      reply = "Gaming is designed to reward us with continuous micro-achievements. Creating alternative, offline reward loops can bring back natural balance.";
      widgetType = "MissionCard";
      widgetTitle = "Unplug Protocol";
      widgetSubtitle = "Shutting down high-stimulation environments early.";
    }

    return {
      reply,
      widget: {
        type: widgetType,
        title: widgetTitle || "Action Tool",
        subtitle: widgetSubtitle || "Empathetic intervention step.",
        value: 6,
        max: 10,
        unit: "cues",
        status: "Active",
        items: dailyActionPlan,
        meta: "Cognitive feedback"
      },
      extractedData: {
        habit,
        riskScore,
        biggestTrigger,
        mostDangerousTime,
        recoveryDifficulty,
        estimatedSuccessRate,
        dailyActionPlan,
        weeklyGoal,
        motivationalQuote,
        hasEnoughInfoForDashboard: true
      },
      celebration: msg.includes("succeed") || msg.includes("win") || msg.includes("better") || msg.includes("yes"),
      streakIncrement: msg.includes("succeed") || msg.includes("win") || msg.includes("better") ? "increment" : "none"
    };
  }

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

      // Append history
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          let textContent = "";
          if (h.text) {
            textContent = h.text;
          } else if (typeof h.parts === "string") {
            textContent = h.parts;
          } else if (h.parts && h.parts[0] && typeof h.parts[0].text === "string") {
            textContent = h.parts[0].text;
          }
          modelInputContents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: textContent }]
          });
        });
      }

      // Append current state or user prompt
      let promptText = message;
      if (isEmergency) {
        promptText = "[CRITICAL EMERGENCY]: I am feeling an intense urge and am about to relapse. Give me an immediate calming emergency intervention!";
      }

      // Add current dashboard context to prompt so model knows what it has extracted so far
      if (currentDashboardState) {
        promptText += `\n\n[CONTEXT] Current Dashboard State: ${JSON.stringify(currentDashboardState)}`;
      }

      modelInputContents.push({
        role: "user",
        parts: [{ text: promptText }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
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
      const fallbackResult = getLocalFallbackResponse(req.body.message, req.body.isEmergency);
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
