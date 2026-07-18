import { describe, it, expect } from "vitest";
import { getLocalFallbackResponse } from "./behavioral-logic";

describe("Behavioral Coaching AI Fallback Engine", () => {
  it("should recognize digital screen habit from message keywords", () => {
    const response = getLocalFallbackResponse("I spend too much time on Instagram scrolling", false);
    expect(response.extractedData.habit).toBe("Digital Screen Reduction");
    expect(response.widget.type).toBe("ProgressCard");
    expect(response.widget.title).toBe("Screen Time Target");
    expect(response.celebration).toBe(false);
  });

  it("should recognize smoking habit and nicotine craving keywords", () => {
    const response = getLocalFallbackResponse("vape cravings are high after work", false);
    expect(response.extractedData.habit).toBe("Smoking Cessation");
    expect(response.widget.type).toBe("RiskMeter");
    expect(response.extractedData.riskScore).toBe(7);
  });

  it("should handle sugar reduction keywords and return GoalCard widget", () => {
    const response = getLocalFallbackResponse("want chocolate and sweet candy", false);
    expect(response.extractedData.habit).toBe("Sugar Reduction");
    expect(response.widget.type).toBe("GoalCard");
    expect(response.widget.title).toBe("Sugar Reduction Target");
  });

  it("should detect procrastination keywords and provide ChallengeCard", () => {
    const response = getLocalFallbackResponse("feeling lazy and procrastinating on my work", false);
    expect(response.extractedData.habit).toBe("Procrastination Mastery");
    expect(response.widget.type).toBe("ChallengeCard");
    expect(response.widget.title).toBe("25-Min Focus Sprint");
  });

  it("should detect gaming keywords and provide MissionCard", () => {
    const response = getLocalFallbackResponse("playing xbox late at night", false);
    expect(response.extractedData.habit).toBe("Video Game Balance");
    expect(response.widget.type).toBe("MissionCard");
    expect(response.widget.title).toBe("Unplug Protocol");
  });

  it("should trigger urgent emergency protocol when isEmergency is true", () => {
    const response = getLocalFallbackResponse("I want to smoke right now", true);
    expect(response.widget.type).toBe("EmergencyHelpCard");
    expect(response.widget.title).toBe("Emergency Urge Rescue Protocol");
    expect(response.reply).toContain("This intense urge is a temporary neural event");
  });

  it("should identify affirmation / success markers in messages", () => {
    const response = getLocalFallbackResponse("yes I have done it and succeeded", false);
    expect(response.celebration).toBe(true);
    expect(response.streakIncrement).toBe("increment");
  });

  it("should identify inquiry intents and reply with supportive tips", () => {
    const response = getLocalFallbackResponse("how can I stop procrastinating?", false);
    expect(response.reply).toContain("Pomodoro Technique");
  });

  it("should preserve existing dashboard state when no new keywords are provided", () => {
    const existingState = {
      habit: "Digital Screen Reduction",
      biggestTrigger: "Boredom",
      riskScore: 3
    };
    const response = getLocalFallbackResponse("hello coach", false, existingState);
    expect(response.extractedData.habit).toBe("Digital Screen Reduction");
    expect(response.extractedData.biggestTrigger).toBe("Boredom");
    expect(response.extractedData.riskScore).toBe(3);
  });

  it("should handle null or empty messages gracefully", () => {
    const response = getLocalFallbackResponse("", false);
    expect(response.extractedData.habit).toBe("General Resilience");
    expect(response.extractedData.riskScore).toBe(5);
    expect(response.extractedData.dailyActionPlan.length).toBe(3);
  });

  it("should return General Resilience for completely unrecognized topics", () => {
    const response = getLocalFallbackResponse("Just saying hello and checking in", false);
    expect(response.extractedData.habit).toBe("General Resilience");
    expect(response.widget.type).toBe("None");
  });

  it("should detect struggles and provide emotional support reply", () => {
    const response = getLocalFallbackResponse("it is so hard and I struggle a lot", false);
    const containsSupportMessage = response.reply.includes("Change is never a straight line") || response.reply.includes("slip") || response.reply.includes("proud");
    expect(containsSupportMessage).toBe(true);
    expect(response.celebration).toBe(false);
  });
});
