import { describe, it, expect } from "vitest";
import { isAllowedCorsOrigin } from "./corsOrigins";

describe("isAllowedCorsOrigin", () => {
  const production = "https://budgt-hero.netlify.app";

  it("allows exact CLIENT_URL match", () => {
    expect(isAllowedCorsOrigin(production, production)).toBe(true);
  });

  it("allows localhost dev origins", () => {
    expect(isAllowedCorsOrigin("http://localhost:5173", production)).toBe(true);
  });

  it("allows Netlify deploy preview origins for the same site", () => {
    expect(
      isAllowedCorsOrigin(
        "https://deploy-preview-12--budgt-hero.netlify.app",
        production
      )
    ).toBe(true);
  });

  it("allows Netlify branch deploy origins for the same site", () => {
    expect(
      isAllowedCorsOrigin(
        "https://feature-auth--budgt-hero.netlify.app",
        production
      )
    ).toBe(true);
  });

  it("rejects unrelated Netlify sites", () => {
    expect(
      isAllowedCorsOrigin(
        "https://deploy-preview-1--other-site.netlify.app",
        production
      )
    ).toBe(false);
  });

  it("rejects arbitrary origins when CLIENT_URL is a custom domain", () => {
    expect(
      isAllowedCorsOrigin(
        "https://deploy-preview-1--budgt-hero.netlify.app",
        "https://app.example.com"
      )
    ).toBe(false);
  });

  it("rejects http Netlify preview origins", () => {
    expect(
      isAllowedCorsOrigin(
        "http://deploy-preview-1--budgt-hero.netlify.app",
        production
      )
    ).toBe(false);
  });
});
