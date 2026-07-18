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

  function getLocalFallbackResponse(
    message: string | null | undefined, 
    isEmergency: boolean,
    currentDashboardState?: any,
    history?: any[]
  ) {
    const msg = (message || "").toLowerCase();
    const dbState = currentDashboardState || {};
    
    // 1. Initial Defaults from current dashboard state if available
    let habit = dbState.habit || "General Resilience";
    let biggestTrigger = dbState.biggestTrigger || "Emotional stress or fatigue";
    let mostDangerousTime = dbState.mostDangerousTime || "Evening hours (8 PM - 11 PM)";
    let recoveryDifficulty = dbState.recoveryDifficulty || "Moderate";
    let riskScore = dbState.riskScore !== undefined ? dbState.riskScore : 5;
    let estimatedSuccessRate = dbState.estimatedSuccessRate !== undefined ? dbState.estimatedSuccessRate : 75;
    let weeklyGoal = dbState.weeklyGoal || "Build a consistent alternative evening routine.";
    let dailyActionPlan = dbState.dailyActionPlan && dbState.dailyActionPlan.length > 0 
      ? dbState.dailyActionPlan 
      : [
          "Take three slow, deep diaphragmatic breaths when cravings strike",
          "Drink a cool glass of water to clear cognitive fog and reset",
          "Engage with Coach MindShift to reflect on your daily triggers"
        ];
    let motivationalQuote = dbState.motivationalQuote || "Our greatest glory is not in never falling, but in rising every time we fall.";
    let reply = "I am listening closely. Breaking habits is a journey of incremental adjustments. Tell me more about your routine.";
    let widgetType = "None";
    let widgetTitle = "";
    let widgetSubtitle = "";

    // 2. Identify active habit from keywords in the current message
    let detectedHabitKey = "";
    if (msg.includes("screen") || msg.includes("instagram") || msg.includes("phone") || msg.includes("social") || msg.includes("scroll") || msg.includes("media") || msg.includes("tiktok") || msg.includes("app")) {
      detectedHabitKey = "screen";
    } else if (msg.includes("smoke") || msg.includes("cigarette") || msg.includes("vape") || msg.includes("nicotine") || msg.includes("craving") || msg.includes("tobacco")) {
      detectedHabitKey = "smoke";
    } else if (msg.includes("sugar") || msg.includes("sweet") || msg.includes("eat") || msg.includes("food") || msg.includes("cookie") || msg.includes("candy") || msg.includes("soda") || msg.includes("chocolate") || msg.includes("snack")) {
      detectedHabitKey = "sugar";
    } else if (msg.includes("procrastinate") || msg.includes("delay") || msg.includes("lazy") || msg.includes("study") || msg.includes("work") || msg.includes("focus") || msg.includes("homework") || msg.includes("assignment")) {
      detectedHabitKey = "procrastination";
    } else if (msg.includes("game") || msg.includes("gaming") || msg.includes("xbox") || msg.includes("playstation") || msg.includes("pc") || msg.includes("switch") || msg.includes("play")) {
      detectedHabitKey = "game";
    }

    // If no keyword in message, fall back to what's already saved in dashboard state
    if (!detectedHabitKey && dbState.habit) {
      const hNorm = dbState.habit.toLowerCase();
      if (hNorm.includes("screen") || hNorm.includes("digital")) detectedHabitKey = "screen";
      else if (hNorm.includes("smoke") || hNorm.includes("nicotine") || hNorm.includes("cessation")) detectedHabitKey = "smoke";
      else if (hNorm.includes("sugar") || hNorm.includes("food")) detectedHabitKey = "sugar";
      else if (hNorm.includes("procrastinate") || hNorm.includes("work") || hNorm.includes("study") || hNorm.includes("delay")) detectedHabitKey = "procrastination";
      else if (hNorm.includes("game") || hNorm.includes("gaming")) detectedHabitKey = "game";
    }

    // 3. User sentiment / intent analysis
    const isAffirmation = msg.includes("yes") || msg.includes("sure") || msg.includes("ok") || msg.includes("definitely") || msg.includes("absolutely") || msg.includes("agree") || msg.includes("will do") || msg.includes("did it") || msg.includes("done") || msg.includes("good") || msg.includes("perfect");
    const isStruggle = msg.includes("hard") || msg.includes("difficult") || msg.includes("struggle") || msg.includes("relapse") || msg.includes("fail") || msg.includes("slipped") || msg.includes("cheat") || msg.includes("broke") || msg.includes("reset") || msg.includes("cannot") || msg.includes("can't") || msg.includes("unable") || msg.includes("bad");
    const isInquiry = msg.includes("how") || msg.includes("why") || msg.includes("what") || msg.includes("question") || msg.includes("help") || msg.includes("advice") || msg.includes("tips") || msg.includes("tricks") || msg.includes("explain");

    // 4. Populate structured responses
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
    } else if (detectedHabitKey === "screen") {
      habit = "Digital Screen Reduction";
      biggestTrigger = dbState.biggestTrigger && dbState.biggestTrigger !== "Emotional stress or fatigue" ? dbState.biggestTrigger : "Boredom or procrastination cues";
      mostDangerousTime = dbState.mostDangerousTime && dbState.mostDangerousTime !== "Evening hours (8 PM - 11 PM)" ? dbState.mostDangerousTime : "Late night in bed (10 PM - 12 AM)";
      recoveryDifficulty = "Moderate";
      riskScore = dbState.riskScore || 6;
      estimatedSuccessRate = dbState.estimatedSuccessRate || 80;
      weeklyGoal = dbState.weeklyGoal && dbState.weeklyGoal !== "Build a consistent alternative evening routine." ? dbState.weeklyGoal : "Keep phone out of the bedroom after 9:30 PM.";
      dailyActionPlan = [
        "Place your phone in a desk drawer during focused work hours",
        "Substitute 15 minutes of scrolling with a physical paperback book",
        "Set an app timer limit of 45 minutes on social media platforms"
      ];
      
      if (isAffirmation) {
        reply = "That's a massive win! Putting physical distance between you and your screen resets your dopamine triggers. What offline activity are you planning next?";
      } else if (isStruggle) {
        reply = "Screen limits are incredibly tough because these apps are designed to hook us. Be kind to yourself. Let's restart: can you put your phone in another room for just 30 minutes right now?";
      } else if (isInquiry) {
        reply = "The best tip is the 'Out of Sight' rule. If your phone is in another room or inside a drawer, the visual cue is gone, reducing your urges by up to 80%. Have you tried that yet?";
      } else {
        reply = "Reducing screen time is a powerful way to reclaim your cognitive bandwidth. It starts with creating physical distance from your devices. Let's work on screen boundaries.";
      }
      widgetType = "ProgressCard";
      widgetTitle = "Screen Time Target";
      widgetSubtitle = "Tracking your target digital boundaries today.";
    } else if (detectedHabitKey === "smoke") {
      habit = "Smoking Cessation";
      biggestTrigger = dbState.biggestTrigger && dbState.biggestTrigger !== "Emotional stress or fatigue" ? dbState.biggestTrigger : "Stress, coffee pairings, or work transitions";
      mostDangerousTime = dbState.mostDangerousTime && dbState.mostDangerousTime !== "Evening hours (8 PM - 11 PM)" ? dbState.mostDangerousTime : "Directly after work (5:30 PM - 7:00 PM)";
      recoveryDifficulty = "Extreme";
      riskScore = dbState.riskScore || 7;
      estimatedSuccessRate = dbState.estimatedSuccessRate || 65;
      weeklyGoal = dbState.weeklyGoal && dbState.weeklyGoal !== "Build a consistent alternative evening routine." ? dbState.weeklyGoal : "Substitute the post-work cigarette with deep breathing.";
      dailyActionPlan = [
        "Keep a clean stress ball or object in hand when transition urges rise",
        "Engage in 2 minutes of brisk walking or stretching during breaks",
        "Sip herbal or black tea slowly as a sensorimotor replacement"
      ];

      if (isAffirmation) {
        reply = "Fantastic job! Resisting a nicotine craving is a powerful step towards rewiring your brain. Your lungs are thanking you. What's helping you stay strong today?";
      } else if (isStruggle) {
        reply = "Nicotine is highly addictive, and slips happen. Don't let a single moment define your progress. Let's reset: take three deep breaths right now. You are still on your journey.";
      } else if (isInquiry) {
        reply = "To handle the physical and sensorimotor habit, try replacing the cigarette with a cup of herbal tea, chewing sugar-free gum, or using a stress ball. Which of these sounds easiest?";
      } else {
        reply = "Nicotine cravings are intense but highly predictable. By pairing transition periods with deep breathing, we rewire the physical cue. You've got this.";
      }
      widgetType = "RiskMeter";
      widgetTitle = "Craving Vulnerability Peak";
      widgetSubtitle = "Vulnerability spikes around transition times.";
    } else if (detectedHabitKey === "sugar") {
      habit = "Sugar Reduction";
      biggestTrigger = dbState.biggestTrigger && dbState.biggestTrigger !== "Emotional stress or fatigue" ? dbState.biggestTrigger : "Afternoon energy dips or emotional reward seeking";
      mostDangerousTime = dbState.mostDangerousTime && dbState.mostDangerousTime !== "Evening hours (8 PM - 11 PM)" ? dbState.mostDangerousTime : "Mid-afternoon slump (3:00 PM - 4:30 PM)";
      recoveryDifficulty = "Moderate";
      riskScore = dbState.riskScore || 5;
      estimatedSuccessRate = dbState.estimatedSuccessRate || 78;
      weeklyGoal = dbState.weeklyGoal && dbState.weeklyGoal !== "Build a consistent alternative evening routine." ? dbState.weeklyGoal : "Replace refined afternoon snacks with fruit or nuts.";
      dailyActionPlan = [
        "Keep a water bottle with freshly sliced lemon at your desk",
        "Wait 10 minutes when a sweet urge strikes to let it dissipate",
        "Ensure a high-protein breakfast to stabilize insulin levels"
      ];

      if (isAffirmation) {
        reply = "Awesome work! Choosing a healthy alternative over refined sugar keeps your blood sugar stable and prevents that afternoon slump. How are you feeling physically?";
      } else if (isStruggle) {
        reply = "Sugar cravings are a physiological response to fatigue or stress. Don't feel guilty. Try drinking a cold glass of water and eating some protein to stabilize. Let's keep going!";
      } else if (isInquiry) {
        reply = "When a sweet urge strikes, try waiting 10 minutes, drinking lemon water, or having a handful of almonds or fruit. This satisfies the sensorimotor cue without the sugar crash.";
      } else {
        reply = "Sugar triggers immediate dopamine release, which makes the craving loop highly persistent. Stabilizing your morning nutrition is a great foundation.";
      }
      widgetType = "GoalCard";
      widgetTitle = "Sugar Reduction Target";
      widgetSubtitle = "Transitioning to unrefined, whole foods snacking.";
    } else if (detectedHabitKey === "procrastination") {
      habit = "Procrastination Mastery";
      biggestTrigger = dbState.biggestTrigger && dbState.biggestTrigger !== "Emotional stress or fatigue" ? dbState.biggestTrigger : "Task aversion and fear of imperfection";
      mostDangerousTime = dbState.mostDangerousTime && dbState.mostDangerousTime !== "Evening hours (8 PM - 11 PM)" ? dbState.mostDangerousTime : "Starting the first task (9:00 AM - 11:00 AM)";
      recoveryDifficulty = "Moderate";
      riskScore = dbState.riskScore || 5;
      estimatedSuccessRate = dbState.estimatedSuccessRate || 85;
      weeklyGoal = dbState.weeklyGoal && dbState.weeklyGoal !== "Build a consistent alternative evening routine." ? dbState.weeklyGoal : "Implement the 5-Minute Rule: just start for 5 minutes.";
      dailyActionPlan = [
        "Break high-priority tasks into three tiny micro-steps",
        "Close all unrelated browser tabs before starting a work session",
        "Work in focused 25-minute sprints followed by short physical breaks"
      ];

      if (isAffirmation) {
        reply = "Superb! Taking action, even on a tiny step, breaks the cycle of procrastination. You're building momentum. What is the next small task you want to tackle?";
      } else if (isStruggle) {
        reply = "Procrastination is an emotional response to feeling overwhelmed or fearing failure. It is completely normal. Try the 5-Minute Rule: just open the document and work for 5 minutes.";
      } else if (isInquiry) {
        reply = "The '5-Minute Rule' and 'Pomodoro Technique' (25 mins focus, 5 mins break) are highly effective. Breaking tasks into 3 micro-steps also removes the feeling of being overwhelmed.";
      } else {
        reply = "Procrastination is an emotional regulation problem, not a time management one. We avoid tasks because they make us feel anxious or overwhelmed. Let's break it down.";
      }
      widgetType = "ChallengeCard";
      widgetTitle = "25-Min Focus Sprint";
      widgetSubtitle = "Work continuously on one single task for just 25 minutes.";
    } else if (detectedHabitKey === "game") {
      habit = "Video Game Balance";
      biggestTrigger = dbState.biggestTrigger && dbState.biggestTrigger !== "Emotional stress or fatigue" ? dbState.biggestTrigger : "Desire for high-octane escape or social connection";
      mostDangerousTime = dbState.mostDangerousTime && dbState.mostDangerousTime !== "Evening hours (8 PM - 11 PM)" ? dbState.mostDangerousTime : "Late evening hours (9:00 PM - 12:00 AM)";
      recoveryDifficulty = "Moderate";
      riskScore = dbState.riskScore || 6;
      estimatedSuccessRate = dbState.estimatedSuccessRate || 72;
      weeklyGoal = dbState.weeklyGoal && dbState.weeklyGoal !== "Build a consistent alternative evening routine." ? dbState.weeklyGoal : "Power down gaming setups completely by 10:00 PM.";
      dailyActionPlan = [
        "Establish a relaxing sleep hygiene ritual starting at 10 PM",
        "Limit high-stimulation multiplayer games to weekend afternoons",
        "Engage in a physical exercise or workout earlier in the day"
      ];

      if (isAffirmation) {
        reply = "Brilliant! Powering down early or limiting gaming slots gives your nervous system time to settle before bed. Your sleep quality will improve immensely tonight.";
      } else if (isStruggle) {
        reply = "Games are engineered for high stimulation and social connection, making them extremely hard to leave. Let's set a physical cue, like a loud alarm across the room, for next time.";
      } else if (isInquiry) {
        reply = "To balance gaming, try establishing a hard 'unplug' time at 10 PM and replace it with a relaxing offline activity like reading or listening to music. What sounds good to you?";
      } else {
        reply = "Gaming is designed to reward us with continuous micro-achievements. Creating alternative, offline reward loops can bring back natural balance.";
      }
      widgetType = "MissionCard";
      widgetTitle = "Unplug Protocol";
      widgetSubtitle = "Shutting down high-stimulation environments early.";
    } else {
      // General Resilience / Unspecified habit
      if (isAffirmation) {
        reply = "Excellent! Reaching a mindful decision is the first step. Let's make it concrete: what bad habit or routine are we working to transform today?";
      } else if (isStruggle) {
        reply = "Change is never a straight line. Every slip is simply a data point on what triggers you. Be proud that you are here talking about it. What habit are we tackling?";
      } else if (isInquiry) {
        reply = "MindShift AI is here to help you build better routines. We specialize in screen reduction, smoking cessation, sugar reduction, procrastination, and video game balance. Which one can I help you with?";
      } else {
        reply = "I am listening closely. Transforming daily routines is a journey of small, deliberate adjustments. What specific habit would you like us to focus on today?";
      }
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
        hasEnoughInfoForDashboard: detectedHabitKey !== ""
      },
      celebration: msg.includes("succeed") || msg.includes("win") || msg.includes("better") || msg.includes("yes") || msg.includes("done"),
      streakIncrement: (msg.includes("succeed") || msg.includes("win") || msg.includes("better") || msg.includes("done")) ? "increment" : "none"
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
