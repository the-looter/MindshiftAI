# MindShift AI — Behavioral Coach & Resilience Tracker

MindShift AI is a highly immersive, emotionally intelligent behavioral coach and resilience tracker designed to help users break persistent bad habits (such as screen addiction, smoking, sugar cravings, gaming, and procrastination). The app features an interactive conversational coach paired with a real-time behavioral diagnostics dashboard.

---

## 🚀 Key Deployed Updates & Enhancements

1. **High-Availability Resilience Engine (Fallback Mode)**:
   - Configured robust, immediate fallback handling on the server side (`server.ts`). If the external AI service experiences a connection drop or rate limit, the application seamlessly triggers a deterministic local heuristics engine. 
   - This fallback categorizes issues (e.g., nicotine cravings, digital distraction, sugar rushes, work anxiety) and delivers relevant intervention steps, custom-curated action items, and protective widgets, ensuring users are never left without immediate care.
   
2. **"I'm About to Relapse" Rescue Protocol**:
   - Added a critical, high-urgency de-escalation protocol. When clicked, the system grounds the user's nervous system with non-judgmental, immediate physical steps (diaphragmatic box breathing, cold-water resets, and cognitive anchors).

3. **Enhanced Diagnostics Dashboard**:
   - Integrated full visual indicators tracking: habit taxonomy, vulnerability risk levels, recovery difficulty estimations, personalized weekly targets, and a micro-task checklist.
   
4. **Streamlined Experience & Removed Redundant Elements**:
   - Removed the separate cognitive check-in daily cards and complex missions sections to keep the visual hierarchy focused strictly on the **Conversational Coach** and the **Diagnostics Dashboard**, removing clutter and friction.
   - Boosted standard request timeouts to 60 seconds to support robust and detailed response generation.

---

## 🤖 Gen AI Services & Integration

The core conversational intelligence is powered by **Google's Gemini 2.5 Flash** model using the modern `@google/genai` SDK on the backend:

- **Where it is utilized**: 
  - **Dynamic Conversation & Emotion Mirroring**: In `server.ts` under the `/api/chat` route, Gemini processes incoming messages alongside chat history. It operates as an empathetic behavior coach, using active listening techniques to match the user's vulnerability and respond with bite-sized, actionable guidance.
  - **Structured Feature and Widget Suggestion**: Gemini outputs structured JSON payloads to dictate the generation of dynamic UI elements on the fly. It decides when to trigger a `RiskMeter`, `ChallengeCard`, `GoalCard`, or `EmergencyHelpCard` in response to the user's immediate emotional state.
  - **Dashboard Extraction (JSON Schema)**: Through rigorous schema formatting, Gemini acts as a real-time behavioral data analyst. It continuously extracts variables from the natural language stream—including habit type, trigger categories, peak risk windows, and customizable 3-step physical action plans—and injects them directly into the interactive dashboard state.
