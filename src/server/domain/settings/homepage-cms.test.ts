import { describe, expect, it } from "vitest";
import { DEFAULT_HOMEPAGE_CMS, mergeHomepageCms } from "./homepage-cms";
import { HomepageCmsSchema } from "./settings-schemas";

describe("mergeHomepageCms visuals", () => {
  it("supplies default homepage photos for existing settings without visual fields", () => {
    const cms = mergeHomepageCms({});

    expect(cms.visuals).toEqual(DEFAULT_HOMEPAGE_CMS.visuals);
  });

  it("keeps changed and removed photo URLs", () => {
    const cms = mergeHomepageCms({
      visuals: {
        heroImageUrl: "https://i.ibb.co/example/hero.webp",
        dataStoryImageUrl: "",
      },
    });

    expect(cms.visuals.heroImageUrl).toBe("https://i.ibb.co/example/hero.webp");
    expect(cms.visuals.dataStoryImageUrl).toBe("");
    expect(cms.visuals.buildImageUrl).toBe(DEFAULT_HOMEPAGE_CMS.visuals.buildImageUrl);
  });

  it("adds editable homepage sections and default preferences to older settings", () => {
    const cms = mergeHomepageCms({ hero: { heading: "Edited hero" } });

    expect(cms.hero.heading).toBe("Edited hero");
    expect(cms.skills.items).toEqual(DEFAULT_HOMEPAGE_CMS.skills.items);
    expect(cms.dataStory.enabled).toBe(true);
    expect(cms.build.steps).toEqual(DEFAULT_HOMEPAGE_CMS.build.steps);
    expect(cms.preferences).toEqual({ theme: "light", locale: "ar" });
    expect(HomepageCmsSchema.safeParse(cms).success).toBe(true);
  });

  it("preserves valid global appearance preferences", () => {
    const cms = mergeHomepageCms({
      preferences: { theme: "dark", locale: "en" },
    });

    expect(cms.preferences).toEqual({ theme: "dark", locale: "en" });
  });
});
