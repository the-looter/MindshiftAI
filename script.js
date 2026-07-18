// MindShift AI — Frontend Logic & Interactions

// Global State
let isFetching = false;
let state = {
  history: [],
  dashboard: {
    habit: "General Habit Mapping",
    riskScore: 5,
    biggestTrigger: "Describe it to the coach...",
    mostDangerousTime: "Describe it to the coach...",
    recoveryDifficulty: "Moderate",
    estimatedSuccessRate: 50,
    dailyActionPlan: [
      { text: "Breathe: complete a 3-minute diaphragmatic breathing set", done: false },
      { text: "Water: drink a cool glass of water to clear cognitive fog", done: false },
      { text: "Log mood: check-in with Coach MindShift and state your status", done: false }
    ],
    weeklyGoal: "Discuss your concerns with Coach MindShift to construct a bespoke target.",
    motivationalQuote: "Commitment is doing what you said you would do, long after the mood you said it in has left you.",
    hasEnoughInfoForDashboard: true
  },
  userStats: {
    streak: 0,
    xp: 0,
    level: 1,
    challengesMet: 0,
    unlockedAchievements: []
  },
  lastCheckInDate: ""
};

// Default daily action plan items in case none are generated yet
const DEFAULT_ACTION_PLAN = [
  { text: "Breathe: complete a 3-minute diaphragmatic breathing set", done: false },
  { text: "Water: drink a cool glass of water to clear cognitive fog", done: false },
  { text: "Log mood: check-in with Coach MindShift and state your status", done: false }
];

// Initialize on Document Load
function init() {
  loadStateFromLocalStorage();
  initializeUI();
  setupEventListeners();
  
  // Render achievements and dynamic stats
  renderUserStats();
  
  // AI Reflection (Welcome back) trigger
  triggerAIReflection();
  
  // Draw Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Load state from local storage
function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem("mindshift_state");
  if (savedState) {
    try {
      state = JSON.parse(savedState);
      
      // Upgrade safety check for missing keys
      if (!state.userStats) {
        state.userStats = { streak: 0, xp: 0, level: 1, challengesMet: 0, unlockedAchievements: [] };
      }
      if (!state.dashboard) {
        state.dashboard = {};
      }
      
      // Force dashboard to be visible and have fallback data
      state.dashboard.hasEnoughInfoForDashboard = true;
      
      if (!state.dashboard.habit) state.dashboard.habit = "General Habit Mapping";
      if (!state.dashboard.riskScore) state.dashboard.riskScore = 5;
      if (!state.dashboard.biggestTrigger) state.dashboard.biggestTrigger = "Describe it to the coach...";
      if (!state.dashboard.mostDangerousTime) state.dashboard.mostDangerousTime = "Describe it to the coach...";
      if (!state.dashboard.recoveryDifficulty) state.dashboard.recoveryDifficulty = "Moderate";
      if (!state.dashboard.estimatedSuccessRate) state.dashboard.estimatedSuccessRate = 50;
      if (!state.dashboard.weeklyGoal) state.dashboard.weeklyGoal = "Discuss your concerns with Coach MindShift to construct a bespoke target.";
      if (!state.dashboard.motivationalQuote) state.dashboard.motivationalQuote = "Commitment is doing what you said you would do, long after the mood you said it in has left you.";
      
      if (!state.dashboard.dailyActionPlan || state.dashboard.dailyActionPlan.length === 0) {
        state.dashboard.dailyActionPlan = [
          { text: "Breathe: complete a 3-minute diaphragmatic breathing set", done: false },
          { text: "Water: drink a cool glass of water to clear cognitive fog", done: false },
          { text: "Log mood: check-in with Coach MindShift and state your status", done: false }
        ];
      }
      
      if (!state.history) {
        state.history = [];
      }
    } catch (e) {
      console.error("Error parsing saved state:", e);
    }
  } else {
    // Fresh state defaults
    state.dashboard.dailyActionPlan = [
      { text: "Breathe: complete a 3-minute diaphragmatic breathing set", done: false },
      { text: "Water: drink a cool glass of water to clear cognitive fog", done: false },
      { text: "Log mood: check-in with Coach MindShift and state your status", done: false }
    ];
    state.dashboard.hasEnoughInfoForDashboard = true;
  }
}

// Save state to local storage
function saveStateToLocalStorage() {
  localStorage.setItem("mindshift_state", JSON.stringify(state));
}

// Render User Stats in Header and Sidebar
function renderUserStats() {
  // Update header badges
  const headerStreak = document.getElementById("header-streak");
  if (headerStreak) {
    headerStreak.textContent = `${state.userStats.streak} Day${state.userStats.streak === 1 ? "" : "s"}`;
  }
  document.getElementById("header-level").textContent = `Lvl ${state.userStats.level}`;
  
  const xpBar = document.getElementById("header-xp-bar");
  const xpText = document.getElementById("header-xp");
  const levelPercent = Math.min(100, Math.max(0, state.userStats.xp));
  
  xpBar.style.width = `${levelPercent}%`;
  xpText.textContent = `${state.userStats.xp}/100 XP`;

  // Update gamification panel elements
  document.getElementById("gamify-level-display").textContent = `Lvl ${state.userStats.level}`;
  document.getElementById("gamify-xp-display").textContent = `${state.userStats.xp} / 100 XP`;
  
  const gamifyChallenges = document.getElementById("gamify-challenges-met");
  if (gamifyChallenges) {
    gamifyChallenges.innerHTML = `<i data-lucide="award" class="w-5.5 h-5.5 text-purple-400"></i> ${state.userStats.challengesMet} Completed`;
  }

  // Update radial circle offset
  const progressRing = document.getElementById("dash-ring-progress");
  if (progressRing) {
    const radius = progressRing.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (levelPercent / 100) * circumference;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRing.style.strokeDashoffset = offset;
  }

  // Handle achievements unlock opacity
  const achList = ["ach-1", "ach-2", "ach-3", "ach-4"];
  achList.forEach((id, idx) => {
    const achEl = document.getElementById(id);
    const achIcon = document.getElementById(`${id}-icon`);
    if (achEl) {
      if (state.userStats.unlockedAchievements && state.userStats.unlockedAchievements.includes(id)) {
        achEl.classList.remove("opacity-40");
        achEl.classList.add("opacity-100", "border-purple-500/30", "bg-purple-950/10");
        if (achIcon) {
          achIcon.classList.remove("text-zinc-300");
          achIcon.classList.add("text-purple-400", "animate-pulse");
        }
      } else {
        achEl.classList.add("opacity-40");
        achEl.classList.remove("opacity-100", "border-purple-500/30", "bg-purple-950/10");
        if (achIcon) {
          achIcon.classList.add("text-zinc-300");
          achIcon.classList.remove("text-purple-400", "animate-pulse");
        }
      }
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Award XP points
function awardXP(amount) {
  state.userStats.xp += amount;
  let leveledUp = false;
  
  while (state.userStats.xp >= 100) {
    state.userStats.xp -= 100;
    state.userStats.level += 1;
    leveledUp = true;
  }
  
  if (leveledUp) {
    triggerConfetti(3); // Triggers soft calm toast now
    appendCoachSystemMessage(`✨ <strong>Level Up:</strong> You have advanced to <strong>Level ${state.userStats.level}</strong>. Your mental focus and neural pathways are strengthening.`);
  }
  
  saveStateToLocalStorage();
  renderUserStats();
}

// Show a gentle, elegant toast notification
function showCalmToast(message, type = "info") {
  // Remove any existing active calm toasts first
  const existingToasts = document.querySelectorAll(".calm-toast");
  existingToasts.forEach(t => t.remove());

  const toast = document.createElement("div");
  toast.className = "calm-toast fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-zinc-950/95 border border-purple-500/20 text-xs font-medium text-purple-300 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-message-in transition-all duration-500 pointer-events-none max-w-[90%] text-center";
  
  const icon = type === "success" 
    ? `<i data-lucide="sparkles" class="w-4.5 h-4.5 text-emerald-400"></i>`
    : `<i data-lucide="shield-check" class="w-4.5 h-4.5 text-purple-400"></i>`;

  toast.innerHTML = `
    ${icon}
    <span class="text-zinc-200 leading-normal font-sans">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Fade out
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 8px)";
    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 3500);
}

// Trigger Calm Notification Toast (replaced startled confetti explosions)
function triggerConfetti(intensity = 1) {
  if (intensity === 3) {
    showCalmToast("Level Up! Your mental resilience is building beautifully. 🌱", "success");
  } else {
    showCalmToast("Milestone recorded. Your progress is saved securely. ✨", "info");
  }
}

// Initialize UI elements based on loaded state
function initializeUI() {
  const chatMessages = document.getElementById("chat-messages");
  
  // Render previous history if any exists
  if (state.history && state.history.length > 0) {
    // Hide onboarding prompts and welcome screen
    const onboardingEl = document.getElementById("onboarding-prompts");
    if (onboardingEl) onboardingEl.style.display = "none";
    
    const welcomeScreen = document.getElementById("welcome-screen");
    if (welcomeScreen) welcomeScreen.style.display = "none";

    // Loop and append
    state.history.forEach(msg => {
      appendMessageToUI(msg.role, msg.text, msg.timestamp, msg.widget, false);
    });
    
    scrollToBottom();
  }

  // Update Dashboard view
  updateDashboardUI();
}

// Setup Event Listeners
function setupEventListeners() {
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const emergencyBtn = document.getElementById("emergency-btn");
  const resetBtn = document.getElementById("reset-profile-btn");
  const clearChatBtn = document.getElementById("btn-clear-chat");
  
  // Input auto-resize and counter
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = `${Math.min(144, chatInput.scrollHeight)}px`;
    
    // Character limit counter
    const length = chatInput.value.length;
    document.getElementById("char-counter").textContent = `${length}/400`;
    if (length > 400) {
      chatInput.value = chatInput.value.substring(0, 400);
    }
  });

  // Enter to send, Shift+Enter for newline
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserSubmit();
    }
  });

  // Click Send
  sendBtn.addEventListener("click", () => {
    handleUserSubmit();
  });

  // Emergency Intervention Button click
  if (emergencyBtn) {
    emergencyBtn.addEventListener("click", () => {
      handleEmergencyIntervention();
    });
  }

  // Reset Profile history
  resetBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset your MindShift profile? This will clear all level progression, streak counters, and habit analysis maps.")) {
      localStorage.removeItem("mindshift_state");
      state = {
        history: [],
        dashboard: {
          habit: "",
          riskScore: 0,
          biggestTrigger: "",
          mostDangerousTime: "",
          recoveryDifficulty: "",
          estimatedSuccessRate: 0,
          dailyActionPlan: [...DEFAULT_ACTION_PLAN],
          weeklyGoal: "",
          motivationalQuote: "",
          hasEnoughInfoForDashboard: false
        },
        userStats: { streak: 0, xp: 0, level: 1, challengesMet: 0, unlockedAchievements: [] },
        lastCheckInDate: ""
      };
      saveStateToLocalStorage();
      
      // Reload UI
      location.reload();
    }
  });

  // Clear Chat Only
  clearChatBtn.addEventListener("click", () => {
    if (confirm("Clear your current conversation history? This keeps your level, streak, and dashboard intact.")) {
      state.history = [];
      saveStateToLocalStorage();
      location.reload();
    }
  });

  // Navigation Tabs for Dashboard vs Gamification
  const tabDash = document.getElementById("tab-dashboard");
  const tabGamify = document.getElementById("tab-gamification");
  const panelDash = document.getElementById("panel-dashboard-content");
  const panelGamify = document.getElementById("panel-gamification-content");

  tabDash.addEventListener("click", () => {
    tabDash.classList.add("bg-purple-600", "text-white");
    tabDash.classList.remove("hover:bg-white/5", "text-zinc-300");
    tabGamify.classList.remove("bg-purple-600", "text-white");
    tabGamify.classList.add("hover:bg-white/5", "text-zinc-300");
    
    panelDash.classList.remove("hidden");
    panelGamify.classList.add("hidden");
  });

  tabGamify.addEventListener("click", () => {
    tabGamify.classList.add("bg-purple-600", "text-white");
    tabGamify.classList.remove("hover:bg-white/5", "text-zinc-300");
    tabDash.classList.remove("bg-purple-600", "text-white");
    tabDash.classList.add("hover:bg-white/5", "text-zinc-300");
    
    panelGamify.classList.remove("hidden");
    panelDash.classList.add("hidden");
    
    // Redraw Lucide and recalibrate ring
    renderUserStats();
  });

  // Prompt Chips
  const onboardingChips = document.querySelectorAll(".onboarding-chip");
  onboardingChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      chatInput.value = prompt;
      chatInput.focus();
      chatInput.style.height = `${chatInput.scrollHeight}px`;
      document.getElementById("char-counter").textContent = `${prompt.length}/400`;
    });
  });

  // Hide Suggestions Button
  const hideSuggestionsBtn = document.getElementById("hide-suggestions-btn");
  if (hideSuggestionsBtn) {
    hideSuggestionsBtn.addEventListener("click", () => {
      const onboardingEl = document.getElementById("onboarding-prompts");
      if (onboardingEl) {
        onboardingEl.style.display = "none";
      }
    });
  }
}

// AI Reflection welcome on load
function triggerAIReflection() {
  if (state.history && state.history.length > 3) {
    const lastCheck = state.lastCheckInDate;
    const today = new Date().toDateString();
    
    // Check if they are returning on a fresh day (or reload for demo purposes)
    if (lastCheck !== today) {
      state.lastCheckInDate = today;
      saveStateToLocalStorage();
      
      const dangerousTime = state.dashboard.mostDangerousTime || "10 PM";
      const habit = state.dashboard.habit || "habit";
      
      appendMessageToUI(
        "assistant",
        `Welcome back. I am reflecting on your progress. Previously, you noted experiencing intense urges for your **${habit}** around **${dangerousTime}**.\n\nHow are you feeling today? Have you encountered any triggers since we last spoke?`,
        getFormattedTimestamp(),
        null,
        true // save to history
      );
    }
  } else {
    // Save visit date anyway
    state.lastCheckInDate = new Date().toDateString();
    saveStateToLocalStorage();
  }
}

// Handle User Submit Message
async function handleUserSubmit() {
  if (isFetching) return;
  const chatInput = document.getElementById("chat-input");
  const text = chatInput.value.trim();
  if (!text) return;

  // Clear Input
  chatInput.value = "";
  chatInput.style.height = "auto";
  document.getElementById("char-counter").textContent = "0/400";

  // Hide onboarding chips and welcome screen
  const onboardingEl = document.getElementById("onboarding-prompts");
  if (onboardingEl) onboardingEl.style.display = "none";
  const welcomeScreen = document.getElementById("welcome-screen");
  if (welcomeScreen) welcomeScreen.style.display = "none";

  // Add Message to history and UI
  const timestamp = getFormattedTimestamp();
  appendMessageToUI("user", text, timestamp, null, true);
  scrollToBottom();

  // Send request to server
  await fetchCoachResponse(text, false);
}

// Handle emergency relapse mitigation
async function handleEmergencyIntervention() {
  const onboardingEl = document.getElementById("onboarding-prompts");
  if (onboardingEl) onboardingEl.style.display = "none";
  const welcomeScreen = document.getElementById("welcome-screen");
  if (welcomeScreen) welcomeScreen.style.display = "none";

  // Alert UI
  appendMessageToUI("user", "⚠️ I need help, I am about to relapse!", getFormattedTimestamp(), null, true);
  scrollToBottom();

  await fetchCoachResponse(null, true);
}

// Call backend API
async function fetchCoachResponse(userMessage, isEmergency) {
  if (isFetching) return;
  isFetching = true;
  showTypingIndicator(true);

  const sendBtn = document.getElementById("send-btn");
  const chatInput = document.getElementById("chat-input");

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
  if (chatInput) {
    chatInput.placeholder = "Coach MindShift is thinking...";
    chatInput.disabled = true;
  }

  try {
    let data = null;
    let lastError = null;
    const attempts = 3;
    let retryDelay = 1000;

    for (let i = 0; i < attempts; i++) {
      const controller = new AbortController();
      // If the tab is shifted to background, browsers throttle timers and suspend requests.
      // We adjust the timeout up to 120s if backgrounded, avoiding pre-mature aborts.
      const activeTimeout = document.hidden ? 120000 : 60000;
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, activeTimeout);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: userMessage,
            history: state.history.slice(-14), // Last 14 turns for tight context
            isEmergency,
            currentDashboardState: state.dashboard
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();
        break; // Succeeded, break out of loop
      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        console.warn(`Connection attempt ${i + 1} failed. IsAbort=${err.name === 'AbortError'}. Retrying...`, err);
        if (i < attempts - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 1.5; // Exponential backoff
        }
      }
    }

    if (!data) {
      throw lastError || new Error("Failed to contact coaching endpoint after multiple attempts");
    }

    // Ensure the user's message is kept in state.history now that the fetch succeeded
    const userTextToSave = isEmergency ? "⚠️ I need help, I am about to relapse!" : userMessage;
    if (userTextToSave) {
      const exists = state.history.some(h => h.role === "user" && h.text === userTextToSave);
      if (!exists) {
        state.history.push({
          role: "user",
          text: userTextToSave,
          timestamp: getFormattedTimestamp(),
          widget: null
        });
      }
    }

    // 1. Render response text
    const coachText = data.reply || "I am connected and ready. Tell me more.";
    const widget = data.widget && data.widget.type !== "None" ? data.widget : null;
    
    appendMessageToUI("assistant", coachText, getFormattedTimestamp(), widget, true);
    scrollToBottom();

    // 2. Handle Celebrations
    if (data.celebration) {
      triggerConfetti(1);
    }

    // 3. Handle Streak Increment/Reset
    if (data.streakIncrement === "increment") {
      state.userStats.streak += 1;
      awardXP(30); // Bonus XP for success streaks!
      triggerConfetti(1);
      
      // Unlock achievement if consistent engagement
      if (state.history.length >= 6 && !state.userStats.unlockedAchievements.includes("ach-3")) {
        unlockAchievement("ach-3");
      }
    } else if (data.streakIncrement === "reset" && state.userStats.streak > 0) {
      state.userStats.streak = 0;
    }

    // 4. Update Dashboard State from model analysis
    if (data.extractedData) {
      // Habit name defined
      if (data.extractedData.habit) {
        state.dashboard.habit = data.extractedData.habit;
        unlockAchievement("ach-1");
      }

      // Check for daily checklist mapping
      if (data.extractedData.dailyActionPlan && data.extractedData.dailyActionPlan.length > 0) {
        // Map elements into action checklist
        const currentPlan = state.dashboard.dailyActionPlan || [];
        state.dashboard.dailyActionPlan = data.extractedData.dailyActionPlan.map(itemText => {
          // See if there's an existing checked item matching this to keep checks persistent
          const existing = currentPlan.find(d => d && d.text === itemText);
          return { text: itemText, done: existing ? existing.done : false };
        });
        unlockAchievement("ach-2");
      }

      // Sync general fields
      if (data.extractedData.riskScore !== undefined) state.dashboard.riskScore = data.extractedData.riskScore;
      if (data.extractedData.biggestTrigger) state.dashboard.biggestTrigger = data.extractedData.biggestTrigger;
      if (data.extractedData.mostDangerousTime) state.dashboard.mostDangerousTime = data.extractedData.mostDangerousTime;
      if (data.extractedData.recoveryDifficulty) state.dashboard.recoveryDifficulty = data.extractedData.recoveryDifficulty;
      if (data.extractedData.estimatedSuccessRate !== undefined) state.dashboard.estimatedSuccessRate = data.extractedData.estimatedSuccessRate;
      if (data.extractedData.weeklyGoal) state.dashboard.weeklyGoal = data.extractedData.weeklyGoal;
      if (data.extractedData.motivationalQuote) state.dashboard.motivationalQuote = data.extractedData.motivationalQuote;
      
      // Toggle Dashboard status
      if (data.extractedData.hasEnoughInfoForDashboard) {
        state.dashboard.hasEnoughInfoForDashboard = true;
      }
    }

    // Handle emergency unlocked achievement
    if (isEmergency) {
      unlockAchievement("ach-4");
      awardXP(50); // Massive XP for overcoming crisis!
    }

    // 5. Award general XP for completing a conversation turn
    awardXP(15);

    // Save and repaint
    saveStateToLocalStorage();
    updateDashboardUI();

  } catch (error) {
    console.error("Coaching endpoint error:", error);

    // Clean up failed user message from state history so it is not saved as a broken state
    const userTextToSave = isEmergency ? "⚠️ I need help, I am about to relapse!" : userMessage;
    if (userTextToSave && state.history.length > 0) {
      const lastMsg = state.history[state.history.length - 1];
      if (lastMsg.role === "user" && lastMsg.text === userTextToSave) {
        state.history.pop();
        saveStateToLocalStorage();
      }
    }

    // Render beautiful inline connection alert with clear Retry option instead of static assistant reply
    const chatMessages = document.getElementById("chat-messages");
    const errorDiv = document.createElement("div");
    errorDiv.className = "flex flex-col gap-3 max-w-[85%] self-center my-3 text-center animate-message-in p-5 rounded-2xl bg-red-950/20 border border-red-500/15";
    errorDiv.id = "connection-error-alert";
    
    errorDiv.innerHTML = `
      <div class="text-xs text-red-300 flex items-center justify-center gap-2">
        <i data-lucide="wifi-off" class="w-4 h-4 text-red-400"></i>
        <span class="font-sans font-medium">Temporary connection drop detected. MindShift AI is unable to reach the host.</span>
      </div>
      <button class="mt-2 py-1.5 px-4 bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all self-center flex items-center gap-1.5" id="retry-btn">
        <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i> Retry Sending Message
      </button>
    `;
    
    chatMessages.appendChild(errorDiv);
    scrollToBottom();
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    // Bind retry
    const retryBtn = document.getElementById("retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", async () => {
        errorDiv.remove();
        await fetchCoachResponse(userMessage, isEmergency);
      });
    }
  } finally {
    showTypingIndicator(false);
    isFetching = false;
    
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.placeholder = "Tell me what's bothering you today...";
      chatInput.focus();
    }
    
    renderUserStats();
  }
}

// Unlock local achievements
function unlockAchievement(id) {
  if (!state.userStats.unlockedAchievements) {
    state.userStats.unlockedAchievements = [];
  }
  if (!state.userStats.unlockedAchievements.includes(id)) {
    state.userStats.unlockedAchievements.push(id);
    state.userStats.challengesMet += 1;
    saveStateToLocalStorage();
    
    // Add toast or notification inside chat
    setTimeout(() => {
      triggerConfetti(1);
      appendCoachSystemMessage(`🏆 <strong>Achievement Unlocked:</strong> ${getAchievementTitle(id)} (+50 XP)`);
      awardXP(50);
    }, 1200);
  }
}

function getAchievementTitle(id) {
  const titles = {
    "ach-1": "Habit Defined",
    "ach-2": "Action Protocol Formulated",
    "ach-3": "Resilience Pioneer",
    "ach-4": "Resilience Champion"
  };
  return titles[id] || "Recovery Milestone";
}

// Update the dynamic dashboard UI elements
function updateDashboardUI() {
  const lockedDash = document.getElementById("dashboard-locked");
  const unlockedDash = document.getElementById("dashboard-unlocked");

  if (state.dashboard.hasEnoughInfoForDashboard) {
    lockedDash.classList.add("hidden");
    unlockedDash.classList.remove("hidden");

    // Populate values
    document.getElementById("dash-habit-name").textContent = state.dashboard.habit || "My Recovery Profile";
    
    // Risk Score
    const rScore = state.dashboard.riskScore || 0;
    document.getElementById("dash-risk-score").textContent = `${rScore}/10`;
    
    // Risk label text & color
    let rLabel = "Low";
    let rColor = "bg-green-500";
    if (rScore >= 8) {
      rLabel = "Extreme";
      rColor = "bg-red-600 animate-pulse";
    } else if (rScore >= 5) {
      rLabel = "Medium";
      rColor = "bg-orange-500";
    }
    
    const riskLabelEl = document.getElementById("dash-risk-level-label");
    riskLabelEl.textContent = rLabel;
    riskLabelEl.className = `text-[10px] uppercase font-bold ${rScore >= 8 ? 'text-red-400' : rScore >= 5 ? 'text-orange-400' : 'text-green-400'}`;
    
    const rBar = document.getElementById("dash-risk-bar");
    rBar.style.width = `${rScore * 10}%`;
    rBar.className = `h-full rounded-full transition-all duration-700 ${rColor}`;

    // Success Rate & difficulty
    document.getElementById("dash-success-rate").textContent = `${state.dashboard.estimatedSuccessRate || 50}%`;
    document.getElementById("dash-difficulty").textContent = state.dashboard.recoveryDifficulty || "Moderate";

    // Triggers and Times
    document.getElementById("dash-biggest-trigger").textContent = state.dashboard.biggestTrigger || "Not mapped yet";
    document.getElementById("dash-dangerous-time").textContent = state.dashboard.mostDangerousTime || "Not mapped yet";

    // Weekly Goal
    document.getElementById("dash-weekly-goal").textContent = state.dashboard.weeklyGoal || "Formulating next weekly target...";

    // Quote
    document.getElementById("dash-motivational-quote").textContent = `"${state.dashboard.motivationalQuote || 'Align your actions with your deepest commitments.'}"`;

    // Render Checklist
    renderChecklist();
  } else {
    lockedDash.classList.remove("hidden");
    unlockedDash.classList.add("hidden");
  }
}

// Render the checklist plan
function renderChecklist() {
  const listEl = document.getElementById("dash-action-list");
  listEl.innerHTML = "";
  
  const plan = state.dashboard.dailyActionPlan || [];
  
  if (plan.length === 0) {
    listEl.innerHTML = `<li class="text-xs text-zinc-300 italic">No action items generated yet. Chat with the coach to compile protocol steps.</li>`;
    return;
  }

  // Count done
  const doneCount = plan.filter(item => item.done).length;
  document.getElementById("action-plan-count").textContent = `${doneCount}/${plan.length} Done`;

  plan.forEach((item, idx) => {
    const li = document.createElement("li");
    li.className = "flex gap-3 items-center bg-white/2 hover:bg-white/4 p-3.5 rounded-xl border border-white/5 transition-all group cursor-pointer";
    li.setAttribute("role", "checkbox");
    li.setAttribute("aria-checked", item.done ? "true" : "false");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-label", `Mark item: ${item.text}`);
    
    li.innerHTML = `
      <div class="w-5 h-5 rounded-md border ${item.done ? 'bg-purple-600 border-purple-500 text-white' : 'border-white/20 text-transparent'} flex items-center justify-center transition-all flex-shrink-0 group-hover:border-purple-500/40">
        <i data-lucide="check" class="w-3.5 h-3.5"></i>
      </div>
      <span class="text-xs ${item.done ? 'line-through text-zinc-400' : 'text-zinc-200'} transition-all select-none leading-relaxed">${item.text}</span>
    `;

    // Toggle click
    const toggleHandler = () => {
      state.dashboard.dailyActionPlan[idx].done = !state.dashboard.dailyActionPlan[idx].done;
      
      // If completed, award XP!
      if (state.dashboard.dailyActionPlan[idx].done) {
        awardXP(15);
        triggerConfetti(1);
      }
      
      saveStateToLocalStorage();
      updateDashboardUI();
    };

    li.addEventListener("click", toggleHandler);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleHandler();
      }
    });

    listEl.appendChild(li);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Toggle Typing Indicator visibility
function showTypingIndicator(show) {
  const typing = document.getElementById("typing-indicator");
  const coachStatus = document.getElementById("coach-typing-status");
  if (show) {
    typing.classList.remove("hidden");
    coachStatus.textContent = "Synthesizing...";
    coachStatus.className = "text-xs text-purple-400 font-medium ml-1.5";
  } else {
    typing.classList.add("hidden");
    coachStatus.textContent = "Online & listening";
    coachStatus.className = "text-xs text-zinc-300 font-normal ml-1.5";
  }
}

// Append customized coaching alert messages
function appendCoachSystemMessage(htmlText) {
  const chatMessages = document.getElementById("chat-messages");
  const msgDiv = document.createElement("div");
  msgDiv.className = "flex gap-3 max-w-[85%] animate-message-in self-center my-2 text-center";
  
  msgDiv.innerHTML = `
    <div class="bg-purple-950/20 border border-purple-500/10 px-5 py-3 rounded-2xl text-xs text-purple-300 leading-normal">
      ${htmlText}
    </div>
  `;
  
  chatMessages.appendChild(msgDiv);
  scrollToBottom();
}

// Append messages to DOM
function appendMessageToUI(role, rawText, timestamp, widget, shouldSave = true) {
  const chatMessages = document.getElementById("chat-messages");
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  // 1. Build msg HTML structure
  const msgContainer = document.createElement("div");
  const isUser = role === "user";
  
  msgContainer.className = `flex gap-4 max-w-[85%] animate-message-in ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`;
  msgContainer.id = messageId;

  // Icon / Avatar
  let avatarHtml = "";
  if (isUser) {
    avatarHtml = `
      <div class="w-9 h-9 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 self-start shadow-inner">
        <i data-lucide="user" class="w-4.5 h-4.5 text-indigo-400"></i>
      </div>
    `;
  } else {
    avatarHtml = `
      <div class="w-9 h-9 rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center flex-shrink-0 self-start shadow-inner">
        <i data-lucide="brain" class="w-4.5 h-4.5 text-purple-400"></i>
      </div>
    `;
  }

  // Parse Text Markdown
  const parsedHTML = parseMarkdown(rawText);

  // Quick Action Buttons for messages (Copy only)
  let actionButtonsHtml = "";
  if (!isUser) {
    actionButtonsHtml = `
      <div class="flex gap-2 items-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button class="msg-action-btn flex items-center gap-1 text-[10px] text-zinc-300 hover:text-purple-300 transition-colors bg-white/2 px-2 py-0.5 rounded-md border border-white/5 cursor-pointer" data-action="copy" data-target="${messageId}">
          <i data-lucide="copy" class="w-3 h-3"></i> Copy
        </button>
      </div>
    `;
  }

  msgContainer.innerHTML = `
    ${avatarHtml}
    <div class="space-y-1.5 group">
      <div class="text-[10px] font-mono ${isUser ? 'text-indigo-400 text-right' : 'text-purple-400'}">
        ${isUser ? 'You' : 'Coach MindShift'} • ${timestamp}
      </div>
      <div class="${isUser ? 'bg-gradient-to-br from-purple-700 to-indigo-700 text-white border-purple-500/10' : 'bg-white/4 backdrop-blur-md text-zinc-200 border-white/5'} rounded-2xl ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} p-4 text-sm leading-relaxed border shadow-md">
        <div class="markdown-body">${parsedHTML}</div>
        
        <!-- Render widgets if available inside message -->
        <div class="widget-mount mt-3" id="${messageId}-widget"></div>
      </div>
      ${actionButtonsHtml}
    </div>
  `;

  chatMessages.appendChild(msgContainer);

  // 2. Render Widget if present
  if (widget) {
    renderWidgetIntoPlaceholder(`${messageId}-widget`, widget);
  }

  // 3. Setup message quick action triggers (Copy only)
  if (!isUser) {
    const copyBtn = msgContainer.querySelector('[data-action="copy"]');
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(rawText);
        copyBtn.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = `<i data-lucide="copy" class="w-3 h-3"></i> Copy`;
          if (window.lucide) window.lucide.createIcons();
        }, 1500);
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  // 4. Save to History
  if (shouldSave) {
    state.history.push({
      id: messageId,
      role,
      text: rawText,
      timestamp,
      widget
    });
    saveStateToLocalStorage();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Render dynamic interactive cards
function renderWidgetIntoPlaceholder(placeholderId, widget) {
  const mountEl = document.getElementById(placeholderId);
  if (!mountEl) return;

  const card = document.createElement("div");
  card.className = "rounded-xl p-4 glass-card border border-white/10 space-y-3 animate-message-in text-zinc-200 shadow-md";

  const { type, title, subtitle, value, max, unit, status, items, meta } = widget;

  switch (type) {
    case "ProgressCard":
      const percent = Math.round(((value || 0) / (max || 1)) * 100);
      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <div class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <i data-lucide="trending-up" class="w-3.5 h-3.5 text-purple-400"></i> ${title || 'Reduction Progress'}
          </div>
          <span class="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">${percent}% Done</span>
        </div>
        <p class="text-xs text-zinc-300">${subtitle || ''}</p>
        <div class="space-y-1.5">
          <div class="flex justify-between text-[10px] font-mono text-zinc-300">
            <span>Current: ${value || 0} ${unit || ''}</span>
            <span>Target: ${max || 10} ${unit || ''}</span>
          </div>
          <div class="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
      break;

    case "GoalCard":
      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <div class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <i data-lucide="target" class="w-3.5 h-3.5 text-purple-400"></i> ${title || 'My Commitment Goal'}
          </div>
        </div>
        <p class="text-xs text-zinc-200 font-medium">${subtitle || 'No goal formulated.'}</p>
        <div class="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-300">
          <div class="bg-white/2 p-2 rounded border border-white/5">
            <div>Target Level:</div>
            <div class="text-zinc-200 font-semibold mt-0.5">${status || 'Healthy Reduction'}</div>
          </div>
          <div class="bg-white/2 p-2 rounded border border-white/5">
            <div>Reward Target:</div>
            <div class="text-purple-300 font-semibold mt-0.5">+100 XP Level-up</div>
          </div>
        </div>
      `;
      break;

    case "ChallengeCard":
      const challengeId = `chal-${Date.now()}`;
      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <div class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <i data-lucide="sword" class="w-3.5 h-3.5 text-purple-400 animate-pulse"></i> ${title || 'Recommended Challenge'}
          </div>
          <span class="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">+50 XP</span>
        </div>
        <p class="text-xs text-zinc-200">${subtitle || 'Complete this custom mental resilience sprint.'}</p>
        <button id="${challengeId}" class="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow shadow-purple-500/20">
          Accept Daily Challenge
        </button>
      `;
      
      // Delay bind click
      setTimeout(() => {
        const btn = document.getElementById(challengeId);
        if (btn) {
          btn.addEventListener("click", () => {
            awardXP(50);
            triggerConfetti(1);
            btn.textContent = "✓ Accepted & Enrolled (+50 XP)";
            btn.className = "w-full py-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-purple-400 text-xs font-medium cursor-default";
            btn.disabled = true;
          });
        }
      }, 100);
      break;

    case "MoodCard":
      const mId1 = `m1-${Date.now()}`;
      const mId2 = `m2-${Date.now()}`;
      const mId3 = `m3-${Date.now()}`;
      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/5 pb-1">
          <div class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <i data-lucide="heart-pulse" class="w-3.5 h-3.5 text-purple-400"></i> Cognitive Mood State
          </div>
        </div>
        <p class="text-xs text-zinc-300">${title || 'What describes your current state best?'}</p>
        <div class="grid grid-cols-3 gap-2 pt-1">
          <button id="${mId1}" class="py-2 px-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-[10px] font-medium cursor-pointer transition-all">
            😩 Struggling
          </button>
          <button id="${mId2}" class="py-2 px-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 text-[10px] font-medium cursor-pointer transition-all">
            😐 Neutral
          </button>
          <button id="${mId3}" class="py-2 px-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium cursor-pointer transition-all">
            💪 Determined
          </button>
        </div>
      `;
      
      setTimeout(() => {
        const setMoodMessage = (msg) => {
          const chatInput = document.getElementById("chat-input");
          chatInput.value = msg;
          handleUserSubmit();
        };

        const btn1 = document.getElementById(mId1);
        const btn2 = document.getElementById(mId2);
        const btn3 = document.getElementById(mId3);

        if (btn1) btn1.addEventListener("click", () => setMoodMessage("I am feeling struggling right now, help me process."));
        if (btn2) btn2.addEventListener("click", () => setMoodMessage("I am in a neutral state, let's keep working."));
        if (btn3) btn3.addEventListener("click", () => setMoodMessage("I am feeling highly determined right now, I succeeded!"));
      }, 100);
      break;

    case "HabitScore":
      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <div class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <i data-lucide="award" class="w-3.5 h-3.5 text-purple-400"></i> Habit Resistance Score
          </div>
        </div>
        <div class="flex items-center gap-4 py-2">
          <div class="w-14 h-14 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center text-lg font-bold text-white font-mono">
            ${value || 75}
          </div>
          <div>
            <h5 class="text-xs font-bold text-zinc-200">${title || 'Resilience Ranking'}</h5>
            <p class="text-[10px] text-zinc-300 leading-normal">${subtitle || 'Your resistance against bad habits is outstanding.'}</p>
          </div>
        </div>
      `;
      break;

    case "RiskMeter":
      let riskLvl = status || "Medium";
      let riskCol = "text-orange-400";
      if (riskLvl.toLowerCase().includes("high") || riskLvl.toLowerCase().includes("extreme")) {
        riskCol = "text-red-400 animate-pulse";
      } else if (riskLvl.toLowerCase().includes("low")) {
        riskCol = "text-green-400";
      }

      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <div class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-yellow-400"></i> Relapse Risk Indicator
          </div>
          <span class="text-[10px] uppercase font-extrabold ${riskCol}">${riskLvl} Risk</span>
        </div>
        <p class="text-xs text-zinc-300">${subtitle || 'Risk increases during specific trigger periods.'}</p>
        <div class="p-2.5 rounded-lg bg-white/2 border border-white/5 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-300">
          <div>Peak Target Trigger:</div>
          <div class="text-zinc-200 font-semibold mt-0.5">${title || 'Not Mapped'}</div>
        </div>
      `;
      break;

    case "MissionCard":
      const missionId = `mis-${Date.now()}`;
      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-white/5 pb-2">
          <div class="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-purple-400"></i> Today's Mission Protocol
          </div>
          <span class="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">+30 XP</span>
        </div>
        <h5 class="text-xs font-bold text-zinc-100 mt-1">${title || 'Avoid Target Trigger Slot'}</h5>
        <p class="text-xs text-zinc-300 pb-1">${subtitle || 'Implement alternative response strategies.'}</p>
        <button id="${missionId}" class="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow shadow-emerald-500/20">
          Mark Mission as Accomplished!
        </button>
      `;

      setTimeout(() => {
        const btn = document.getElementById(missionId);
        if (btn) {
          btn.addEventListener("click", () => {
            awardXP(30);
            triggerConfetti(3); // Double confetti victory!
            btn.textContent = "✓ Mission Accomplished (+30 XP)";
            btn.className = "w-full py-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs font-medium cursor-default";
            btn.disabled = true;
          });
        }
      }, 100);
      break;

    case "AchievementCard":
      card.innerHTML = `
        <div class="flex flex-col items-center text-center p-4 space-y-2 border border-purple-500/30 bg-purple-950/15">
          <div class="w-12 h-12 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center text-purple-400">
            <i data-lucide="trophy" class="w-6 h-6 animate-bounce"></i>
          </div>
          <h4 class="text-sm font-extrabold text-white">Milestone Unlocked!</h4>
          <h5 class="text-xs font-bold text-purple-300">${title || 'Resilience Mastery'}</h5>
          <p class="text-[10px] text-zinc-300 leading-normal">${subtitle || 'Unlocked for committing to positive change.'}</p>
        </div>
      `;
      break;

    case "EmergencyHelpCard":
      card.className = "rounded-xl p-5 border border-red-500/30 bg-red-950/10 space-y-3 animate-message-in text-zinc-200 shadow-xl shadow-red-500/5";
      
      const stepsHtml = (items || [
        "Take three slow deep breaths immediately",
        "Drink one tall glass of cold water to ground yourself",
        "Walk around your space or change rooms for 2 minutes",
        "Recall exactly why you decided to start this recovery protocol"
      ]).map((step, idx) => `
        <div class="flex gap-2.5 items-start text-xs">
          <span class="w-4.5 h-4.5 rounded-full bg-red-500/20 border border-red-500/30 text-[10px] font-mono font-bold text-red-300 flex items-center justify-center flex-shrink-0 mt-0.5">${idx+1}</span>
          <span class="text-zinc-200 leading-relaxed">${step}</span>
        </div>
      `).join("");

      card.innerHTML = `
        <div class="flex justify-between items-center border-b border-red-500/20 pb-2">
          <div class="text-xs font-bold text-red-400 flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4.5 h-4.5 text-red-500 animate-pulse"></i> Relapse Rescue Response Protocol
          </div>
          <span class="text-[9px] uppercase font-bold text-red-400 px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10">Active Rescue</span>
        </div>
        <p class="text-xs text-red-200 italic font-light">${subtitle || 'An urge is simply a neural event. It rises, peaks, and inevitably passes. Ground yourself with these actions:'}</p>
        <div class="space-y-2 pt-1 border-t border-red-500/10">
          ${stepsHtml}
        </div>
      `;
      break;

    case "MotivationCard":
      card.innerHTML = `
        <div class="flex flex-col items-center text-center p-3 space-y-2 border border-indigo-500/20">
          <i data-lucide="quote" class="w-5 h-5 text-indigo-400"></i>
          <p class="text-xs italic text-zinc-200 leading-relaxed font-light">"${subtitle || 'Positive change takes time.'}"</p>
          <span class="text-[10px] font-mono text-purple-400">— ${title || 'Catalyst Reflection'}</span>
        </div>
      `;
      break;

    default:
      card.innerHTML = `
        <p class="text-xs text-zinc-300 italic">${subtitle || 'Dynamic coach widget loaded'}</p>
      `;
      break;
  }

  mountEl.appendChild(card);
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Simple Markdown Parser (Regex)
function parseMarkdown(text) {
  if (!text) return "";
  
  let html = text;
  
  // Clean potential dangerous tags (sanitizer)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text** -> <strong>text</strong>)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic (*text* or _text_ -> <em>text</em>)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Inline code (`code` -> <code>code</code>)
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Lists
  // 1. Bullet list items (* or - followed by space)
  html = html.replace(/^[\s]*[\*-][\s]+(.*)$/gm, '<li>$1</li>');
  // Wrap list items in <ul>
  // We look for consecutive <li> and wrap them
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Convert double newlines into paragraph tags
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs.map(p => {
    // If it's already list elements, don't wrap in p
    if (p.trim().startsWith("<ul>") || p.trim().startsWith("<li>")) {
      return p;
    }
    return `<p class="mb-2.5 last:mb-0">${p.replace(/\n/g, "<br>")}</p>`;
  }).join("");

  return html;
}

// Scroll chat panel to bottom
function scrollToBottom() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate HH:MM timestamp
function getFormattedTimestamp() {
  const now = new Date();
  let hours = now.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes} ${ampm}`;
}
