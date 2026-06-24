import { describe, it, expect } from "vitest";
import { cn, formatDistance, formatDuration, timeAgo, clamp, truncate } from "../utils";

describe("cn", () => {
  it("should merge classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("should merge tailwind conflicts", () => {
    expect(cn("px-4 py-2", "px-6")).toBe("py-2 px-6");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(null as unknown as string)).toBe("");
  });
});

describe("formatDistance", () => {
  it("should format meters", () => {
    expect(formatDistance(500)).toBe("500m");
    expect(formatDistance(0)).toBe("0m");
  });

  it("should format kilometers", () => {
    expect(formatDistance(1500)).toBe("1.5km");
    expect(formatDistance(10000)).toBe("10.0km");
  });

  it("should round correctly", () => {
    expect(formatDistance(1234)).toBe("1.2km");
    expect(formatDistance(999)).toBe("999m");
  });
});

describe("formatDuration", () => {
  it("should format minutes only", () => {
    expect(formatDuration(30)).toBe("30分钟");
    expect(formatDuration(1)).toBe("1分钟");
  });

  it("should format hours and minutes", () => {
    expect(formatDuration(90)).toBe("1小时30分钟");
    expect(formatDuration(60)).toBe("1小时");
  });

  it("should format hours only", () => {
    expect(formatDuration(120)).toBe("2小时");
  });
});

describe("timeAgo", () => {
  it('should return "刚刚" for recent times', () => {
    expect(timeAgo(new Date())).toBe("刚刚");
  });

  it("should return minutes ago", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(d)).toBe("5分钟前");
  });

  it("should return days ago", () => {
    const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(timeAgo(d)).toBe("3天前");
  });
});

describe("clamp", () => {
  it("should clamp to min", () => {
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("should clamp to max", () => {
    expect(clamp(200, 0, 100)).toBe(100);
  });

  it("should pass through values in range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe("truncate", () => {
  it("should not truncate short strings", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("should truncate long strings", () => {
    expect(truncate("hello world this is long", 10)).toBe("hello w...");
  });

  it("should handle exact length", () => {
    expect(truncate("12345", 5)).toBe("12345");
  });
});
