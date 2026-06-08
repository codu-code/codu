import { test, expect } from "playwright/test";
import { loggedInAsUserOne, articleContent } from "./utils";

// Test constants
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const CREATE_URL = `${BASE_URL}/create`;

// Modifier key for keyboard shortcuts (Meta on Mac, Control on Windows/Linux)
const MOD_KEY = process.platform === "darwin" ? "Meta" : "Control";

// Selectors
//
// NOTE (post-relaunch): the editor no longer has Write/Link tabs. It opens
// straight into the article editor (title + TipTap body + tags + canonical +
// publish). Links are created from the compose modal, not here.
const SELECTORS = {
  // Article editor
  titleInput: 'input[placeholder="Article title"]',
  editorContent: ".ProseMirror",

  // Tags
  tagInput: 'input[placeholder*="Add tags"], input[placeholder*="Add more"]',

  // More Options
  moreOptionsButton: 'button:has-text("More Options")',
  excerptTextarea: "#excerpt",
  canonicalUrlInput: "#canonicalUrl",
  scheduleSwitch: "#schedule-switch",
  datetimeInput: 'input[type="datetime-local"]',

  // Actions
  saveDraftButton: 'button:has-text("Save Draft")',
  savedButton: 'button:has-text("Saved")',
  publishButton: 'button:has-text("Publish")',
  shareDraftButton: 'button:has-text("Share Draft")',
  previewButton: 'button:has-text("Preview")',
  editButton: 'button:has-text("Edit")',

  // Modal buttons
  letsDoThisButton: 'button:has-text("Let\'s do this!")',
  maybeLaterButton: 'button:has-text("Maybe later")',

  // Toolbar buttons
  boldButton: 'button[title*="Bold"]',
  italicButton: 'button[title*="Italic"]',
  markdownModeButton: 'button:has-text("Switch to Markdown")',
  switchToRichTextButton: 'button:has-text("Switch to Rich Text")',
};

// ============================================
// UNAUTHENTICATED ACCESS TESTS
// ============================================
test.describe("Unauthenticated Editor Access", () => {
  test("Should redirect to /get-started when accessing /create without auth", async ({
    page,
  }) => {
    await page.goto(CREATE_URL);
    await page.waitForURL(/.*get-started.*/);
    expect(page.url()).toContain("get-started");
  });

  test("Should redirect from /create?tab=write without auth", async ({
    page,
  }) => {
    await page.goto(`${CREATE_URL}?tab=write`);
    await page.waitForURL(/.*get-started.*/);
    expect(page.url()).toContain("get-started");
  });

  test("Should redirect from /create?tab=link without auth", async ({
    page,
  }) => {
    await page.goto(`${CREATE_URL}?tab=link`);
    await page.waitForURL(/.*get-started.*/);
    expect(page.url()).toContain("get-started");
  });
});

// ============================================
// ARTICLE EDITOR TESTS
// ============================================
test.describe("Article Editor", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test.describe("Basic Functionality", () => {
    test("Should load the article editor by default", async ({ page }) => {
      await page.goto(CREATE_URL);
      // No tabs anymore — the editor opens straight into the article.
      await expect(page.locator(SELECTORS.titleInput)).toBeVisible();
      await expect(page.locator(SELECTORS.editorContent)).toBeVisible();
    });

    test("Should allow entering title text", async ({ page }) => {
      await page.goto(CREATE_URL);
      const title = "Test Article Title";
      await page.locator(SELECTORS.titleInput).fill(title);
      await expect(page.locator(SELECTORS.titleInput)).toHaveValue(title);
    });

    test("Should allow entering content in TipTap editor", async ({ page }) => {
      await page.goto(CREATE_URL);

      // Click into the editor and type
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type("This is test content for the article.");

      await expect(page.locator(SELECTORS.editorContent)).toContainText(
        "This is test content",
      );
    });
  });

  test.describe("Toolbar Functionality", () => {
    test("Should show toolbar with formatting buttons", async ({ page }) => {
      await page.goto(CREATE_URL);

      // Wait for toolbar to load
      await page.waitForSelector(SELECTORS.editorContent);

      // Check for common toolbar buttons - use more flexible selectors
      await expect(
        page
          .locator('button[title*="Bold"], button[aria-label*="bold"]')
          .first(),
      ).toBeVisible();
      await expect(
        page
          .locator('button[title*="Italic"], button[aria-label*="italic"]')
          .first(),
      ).toBeVisible();
    });

    test("Should apply bold formatting via keyboard shortcut", async ({
      page,
    }) => {
      await page.goto(CREATE_URL);

      // Type some text
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type("bold text");

      // Select all text using keyboard
      await page.keyboard.press(`${MOD_KEY}+a`);

      // Apply bold via keyboard shortcut
      await page.keyboard.press(`${MOD_KEY}+b`);

      // Check for bold formatting - TipTap uses <strong> tag
      await expect(
        page.locator(`${SELECTORS.editorContent} strong`),
      ).toBeVisible({
        timeout: 5000,
      });
    });

    test("Should apply italic formatting via keyboard shortcut", async ({
      page,
    }) => {
      await page.goto(CREATE_URL);

      // Type some text
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type("italic text");

      // Select all text using keyboard
      await page.keyboard.press(`${MOD_KEY}+a`);

      // Apply italic via keyboard shortcut
      await page.keyboard.press(`${MOD_KEY}+i`);

      // Check for italic formatting - TipTap uses <em> tag
      await expect(page.locator(`${SELECTORS.editorContent} em`)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe("Markdown Mode", () => {
    test("Should switch to markdown mode", async ({ page }) => {
      await page.goto(CREATE_URL);

      // Enter some content first
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type("Some content");

      // Click markdown mode button
      await page.locator(SELECTORS.markdownModeButton).click();

      // Should show switch to rich text button
      await expect(
        page.locator(SELECTORS.switchToRichTextButton),
      ).toBeVisible();
    });

    test("Should switch back to rich text mode", async ({ page }) => {
      await page.goto(CREATE_URL);

      // Enter content and switch to markdown
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type("Test content");
      await page.locator(SELECTORS.markdownModeButton).click();

      // Switch back to rich text
      await page.locator(SELECTORS.switchToRichTextButton).click();

      // Should show the editor again
      await expect(page.locator(SELECTORS.editorContent)).toBeVisible();
    });
  });

  test.describe("Preview Mode", () => {
    test("Should toggle to preview mode", async ({ page }) => {
      await page.goto(CREATE_URL);

      // Enter title and content
      await page.locator(SELECTORS.titleInput).fill("Preview Test Title");
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type("Preview content here");

      // Click preview button
      await page.locator(SELECTORS.previewButton).click();

      // Should show Edit button instead of Preview
      await expect(page.locator(SELECTORS.editButton)).toBeVisible();

      // Should display the title in preview
      await expect(page.locator("h1")).toContainText("Preview Test Title");
    });

    test("Should return to edit mode from preview", async ({ page }) => {
      await page.goto(CREATE_URL);

      // Enter content and go to preview
      await page.locator(SELECTORS.titleInput).fill("Test Title");
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type("Content");
      await page.locator(SELECTORS.previewButton).click();

      // Click Edit to return
      await page.locator(SELECTORS.editButton).click();

      // Should show the editor again
      await expect(page.locator(SELECTORS.editorContent)).toBeVisible();
    });
  });
});

// ============================================
// TAGS INPUT TESTS
// ============================================
test.describe("Tags Input", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should show tags input section", async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page.locator('text="Tags"')).toBeVisible();
    await expect(page.locator(SELECTORS.tagInput)).toBeVisible();
  });

  test("Should add tag on Enter key", async ({ page }) => {
    await page.goto(CREATE_URL);

    // First click on the tag input area to focus it
    await page.locator(SELECTORS.tagInput).first().fill("javascript");
    await page.keyboard.press("Enter");

    // Tag should be visible as a badge (lowercase)
    await expect(page.locator('text="javascript"')).toBeVisible();
  });

  test("Should add tag on comma", async ({ page }) => {
    await page.goto(CREATE_URL);

    await page.locator(SELECTORS.tagInput).first().fill("react,");

    // Tag should be visible (lowercase)
    await expect(page.locator('text="react"')).toBeVisible();
  });

  test("Should remove tag with X button", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Add a tag
    await page.locator(SELECTORS.tagInput).first().fill("typescript");
    await page.keyboard.press("Enter");

    // Verify tag exists (lowercase)
    await expect(page.locator('text="typescript"')).toBeVisible();

    // Click the remove button on the tag (lowercase in aria-label)
    await page.locator('button[aria-label="Remove typescript tag"]').click();

    // Tag should be gone
    await expect(page.locator('text="typescript"')).toBeHidden();
  });

  test("Should enforce max 5 tags limit", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Add 5 tags
    const tags = ["tag1", "tag2", "tag3", "tag4", "tag5"];
    for (const tag of tags) {
      await page.locator(SELECTORS.tagInput).first().fill(tag);
      await page.keyboard.press("Enter");
      // Wait for tag to be added
      await expect(page.locator(`text="${tag}"`)).toBeVisible();
    }

    // Try to add a 6th tag - input should be hidden
    await expect(page.locator('input[placeholder*="Add tags"]')).toBeHidden();
    await expect(page.locator('input[placeholder*="Add more"]')).toBeHidden();
  });

  test("Should prevent duplicate tags", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Add a tag twice
    await page.locator(SELECTORS.tagInput).first().fill("duplicate");
    await page.keyboard.press("Enter");
    await expect(page.locator('text="duplicate"')).toBeVisible();

    await page.locator(SELECTORS.tagInput).first().fill("duplicate");
    await page.keyboard.press("Enter");

    // Should only have one instance of the tag (lowercase)
    const tagCount = await page.locator('span:has-text("duplicate")').count();
    expect(tagCount).toBe(1);
  });
});

// ============================================
// MORE OPTIONS ACCORDION TESTS
// ============================================
test.describe("More Options Accordion", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should show More Options button", async ({ page }) => {
    await page.goto(CREATE_URL);
    await expect(page.locator(SELECTORS.moreOptionsButton)).toBeVisible();
  });

  test("Should expand accordion on click", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Click to expand
    await page.locator(SELECTORS.moreOptionsButton).click();

    // Excerpt field should be visible
    await expect(page.locator(SELECTORS.excerptTextarea)).toBeVisible();
  });

  test("Should allow entering excerpt text", async ({ page }) => {
    await page.goto(CREATE_URL);
    await page.locator(SELECTORS.moreOptionsButton).click();

    const excerptText = "This is a custom excerpt for the article.";
    await page.locator(SELECTORS.excerptTextarea).fill(excerptText);

    await expect(page.locator(SELECTORS.excerptTextarea)).toHaveValue(
      excerptText,
    );
  });

  test("Should allow entering canonical URL", async ({ page }) => {
    await page.goto(CREATE_URL);
    await page.locator(SELECTORS.moreOptionsButton).click();

    const canonicalUrl = "https://mysite.com/original-post";
    await page.locator(SELECTORS.canonicalUrlInput).fill(canonicalUrl);

    await expect(page.locator(SELECTORS.canonicalUrlInput)).toHaveValue(
      canonicalUrl,
    );
  });

  test("Should show schedule toggle", async ({ page }) => {
    await page.goto(CREATE_URL);
    await page.locator(SELECTORS.moreOptionsButton).click();

    await expect(page.locator(SELECTORS.scheduleSwitch)).toBeVisible();
  });

  test("Should show date picker when scheduling enabled", async ({ page }) => {
    await page.goto(CREATE_URL);
    await page.locator(SELECTORS.moreOptionsButton).click();

    // Enable scheduling
    await page.locator(SELECTORS.scheduleSwitch).click();

    // Date picker should appear
    await expect(page.locator(SELECTORS.datetimeInput)).toBeVisible();
  });
});

// ============================================
// PUBLISH BUTTON VALIDATION TESTS
// ============================================
test.describe("Publish Button Validation", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test.describe("Article Validation", () => {
    test("Publish button should be disabled when title is empty", async ({
      page,
    }) => {
      await page.goto(CREATE_URL);

      // Add only body content (more than 10 chars)
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type(
        "This is some body content that is long enough for testing",
      );

      // Wait a moment for state to update
      await page.waitForTimeout(500);

      // Both nav and action bar Publish buttons should be disabled
      const navPublishButton = page.locator('nav button:has-text("Publish")');
      await expect(navPublishButton).toBeDisabled();
    });

    test("Publish button should be disabled when body is empty", async ({
      page,
    }) => {
      await page.goto(CREATE_URL);

      // Add only title (more than 5 chars)
      await page.locator(SELECTORS.titleInput).fill("My Article Title Here");

      // Wait a moment for state to update
      await page.waitForTimeout(500);

      // Nav Publish button should be disabled
      const navPublishButton = page.locator('nav button:has-text("Publish")');
      await expect(navPublishButton).toBeDisabled();
    });

    test("Publish button should be disabled when title is too short", async ({
      page,
    }) => {
      await page.goto(CREATE_URL);

      // Title less than 5 chars
      await page.locator(SELECTORS.titleInput).fill("Hi");
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type(
        "This is enough body content here for testing purposes",
      );

      // Wait a moment for state to update
      await page.waitForTimeout(500);

      // Nav Publish button should be disabled
      const navPublishButton = page.locator('nav button:has-text("Publish")');
      await expect(navPublishButton).toBeDisabled();
    });

    test("Publish button should be enabled when title and body are valid", async ({
      page,
    }) => {
      await page.goto(CREATE_URL);

      // Valid title (5+ chars)
      await page.locator(SELECTORS.titleInput).fill("Valid Title Here");

      // Valid body (10+ chars)
      await page.locator(SELECTORS.editorContent).click();
      await page.keyboard.type(
        "This is valid body content with more text for testing",
      );

      // Wait a moment for state to update
      await page.waitForTimeout(500);

      // Nav Publish button should be enabled
      const navPublishButton = page.locator('nav button:has-text("Publish")');
      await expect(navPublishButton).toBeEnabled();
    });
  });
});

// ============================================
// DRAFT MANAGEMENT TESTS
// ============================================
test.describe("Draft Management", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should show Save Draft button when content exists", async ({
    page,
  }) => {
    await page.goto(CREATE_URL);

    // Enter valid content
    await page.locator(SELECTORS.titleInput).fill("Draft Article Title");
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type("This is draft body content here for testing");

    // Wait for state to update
    await page.waitForTimeout(500);

    // Save Draft button should be visible in action bar
    await expect(page.locator(SELECTORS.saveDraftButton)).toBeVisible();
  });

  test("Should show saved time indicator after auto-save", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Enter valid content - title first
    await page.locator(SELECTORS.titleInput).fill("Draft Article Title");

    // Then body content - this triggers auto-save after debounce
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type(
      "This is draft body content for testing auto save indicator feature",
    );

    // Wait for auto-save to trigger and URL to update (debounce is 1500ms + save time)
    await page.waitForURL(/.*create\/[a-z0-9]+/, { timeout: 20000 });

    // Saved time should appear in nav after auto-save completes (look for timestamp format)
    await expect(page.locator("nav").locator("text=/Saved .+\\d/")).toBeVisible(
      { timeout: 10000 },
    );
  });

  test("Should show Share Draft button after auto-save", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Enter valid content - title first
    await page.locator(SELECTORS.titleInput).fill("Test Draft for Sharing");

    // Then body content - this triggers auto-save after debounce
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type(
      "Content for testing share draft feature auto save test",
    );

    // Wait for auto-save to trigger and URL to update (debounce is 1500ms + save time)
    await page.waitForURL(/.*create\/[a-z0-9]+/, { timeout: 20000 });

    // Share Draft button should appear after save
    await expect(page.locator(SELECTORS.shareDraftButton)).toBeVisible({
      timeout: 10000,
    });
  });

  test("Auto-save should update URL with post ID", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Enter valid content that meets auto-save requirements
    await page.locator(SELECTORS.titleInput).fill("Auto Save Test Title");
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type(
      "Auto save content that is long enough to trigger save functionality",
    );

    // Wait for auto-save to trigger and URL to update (debounce is 1500ms)
    await page.waitForURL(/.*create\/[a-z0-9]+/, { timeout: 20000 });

    expect(page.url()).toMatch(/create\/[a-z0-9]+/);
  });
});

// ============================================
// PUBLISH FLOW TESTS
// ============================================
test.describe("Publish Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should show confirmation modal for article", async ({ page }) => {
    await page.goto(CREATE_URL);
    await page.waitForLoadState("domcontentloaded");

    // Wait for title input to be visible
    await expect(page.locator(SELECTORS.titleInput)).toBeVisible({
      timeout: 15000,
    });

    // Enter valid content
    await page.locator(SELECTORS.titleInput).fill("Article to Publish");
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type(articleContent);

    // Wait for auto-save to complete before opening modal
    await expect(page.locator("nav >> text=/Saved .*/")).toBeVisible({
      timeout: 15000,
    });
    await page.waitForTimeout(300); // Allow state to settle

    // Wait for Publish button to be enabled
    const publishButton = page.locator('nav button:has-text("Publish")');
    await expect(publishButton).toBeEnabled({ timeout: 10000 });
    await publishButton.click();

    // Modal should appear with whimsical content
    await expect(page.locator('text="Ready to launch?"')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator(SELECTORS.letsDoThisButton)).toBeVisible();
    await expect(page.locator(SELECTORS.maybeLaterButton)).toBeVisible();
  });

  test("Should close modal on 'Maybe later'", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Enter valid content
    await page.locator(SELECTORS.titleInput).fill("Test Modal Close");
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type(
      "Content for modal close test with enough text for testing",
    );

    // Wait for auto-save to complete before opening modal
    await expect(page.locator("nav >> text=/Saved .*/")).toBeVisible({
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // Wait for Publish button to be enabled, then open modal
    const publishButton = page.locator('nav button:has-text("Publish")');
    await expect(publishButton).toBeEnabled({ timeout: 10000 });
    await publishButton.click();
    await expect(page.locator('text="Ready to launch?"')).toBeVisible({
      timeout: 5000,
    });

    // Wait for modal animation to settle, then click Maybe later
    const maybeLaterBtn = page.locator(SELECTORS.maybeLaterButton);
    await expect(maybeLaterBtn).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300); // Allow animation to settle
    await maybeLaterBtn.click();

    // Modal should close
    await expect(page.locator('text="Ready to launch?"')).toBeHidden();
  });

  test("Should publish and redirect to article page", async ({ page }) => {
    await page.goto(CREATE_URL);

    // Enter valid content
    const title = `E2E Publish Test ${Date.now()}`;
    await page.locator(SELECTORS.titleInput).fill(title);
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type(articleContent);

    // Wait for auto-save to complete before publishing (check nav "Saved" timestamp)
    await expect(page.locator("nav >> text=/Saved .*/")).toBeVisible({
      timeout: 15000,
    });
    await page.waitForTimeout(500);

    // Publish
    const publishButton = page.locator('nav button:has-text("Publish")');
    await expect(publishButton).toBeEnabled({ timeout: 10000 });
    await publishButton.click();
    await expect(page.locator(SELECTORS.letsDoThisButton)).toBeVisible({
      timeout: 5000,
    });
    await page.locator(SELECTORS.letsDoThisButton).click();

    // After confirming, the editor redirects. The e2e env runs with the
    // auto-moderation gate ON (MODERATION_ENABLED=true), so a freshly
    // published draft is routed to `in_review` and the author is sent to
    // their drafts ("Sent for review"). When the gate is OFF the post goes
    // live and redirects to the published article. Accept either terminal
    // state so the publish flow is exercised end-to-end regardless of env.
    await page.waitForURL(
      (url) =>
        /\/e2e-test-user-one-111\/e2e-publish-test/.test(url.pathname) ||
        url.pathname.startsWith("/my-posts"),
      { timeout: 20000 },
    );

    if (page.url().includes("/my-posts")) {
      // Moderation gate ON — post went to review.
      await expect(page).toHaveURL(/my-posts/);
    } else {
      // Moderation gate OFF — post is live, article heading is shown.
      await expect(page.getByRole("heading", { name: title })).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("Should show schedule-specific modal text when scheduling", async ({
    page,
  }) => {
    await page.goto(CREATE_URL);

    // Enter valid content - longer body for proper validation
    await page.locator(SELECTORS.titleInput).fill("Scheduled Article Title");
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type(
      "Content for scheduled article test here with enough text to pass validation",
    );

    // Wait for auto-save to complete
    await expect(page.locator("nav >> text=/Saved .*/")).toBeVisible({
      timeout: 15000,
    });

    // Expand More Options
    await page.locator(SELECTORS.moreOptionsButton).click();

    // Wait for accordion to expand
    await expect(page.locator(SELECTORS.scheduleSwitch)).toBeVisible();

    // Click the schedule switch using force to ensure it toggles
    await page.locator(SELECTORS.scheduleSwitch).click({ force: true });

    // Verify the switch is now checked
    await expect(page.locator(SELECTORS.scheduleSwitch)).toHaveAttribute(
      "data-state",
      "checked",
    );

    // Set a future date - wait for datetime input to appear
    await expect(page.locator(SELECTORS.datetimeInput)).toBeVisible();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const dateString = futureDate.toISOString().slice(0, 16);
    await page.locator(SELECTORS.datetimeInput).fill(dateString);

    // Wait for state to settle after date input
    await page.waitForTimeout(300);

    // Click Publish button in nav
    await page.locator('nav button:has-text("Publish")').click();

    // Should show scheduling-specific modal
    await expect(page.locator('text="Time travel activated!"')).toBeVisible({
      timeout: 5000,
    });
  });
});

// ============================================
// MOBILE RESPONSIVE TESTS
// ============================================
test.describe("Mobile Responsive Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Should show editor on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(CREATE_URL);

    // Editor should be visible
    await expect(page.locator(SELECTORS.titleInput)).toBeVisible();
    await expect(page.locator(SELECTORS.editorContent)).toBeVisible();
  });

  test("Publish button should be visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(CREATE_URL);

    // Enter content
    await page.locator(SELECTORS.titleInput).fill("Mobile Test Title");
    await page.locator(SELECTORS.editorContent).click();
    await page.keyboard.type("Mobile test content here for testing purposes");

    // Wait for state to update
    await page.waitForTimeout(500);

    // Publish button in nav should be visible
    await expect(page.locator('nav button:has-text("Publish")')).toBeVisible();
  });
});
