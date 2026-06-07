// Bare, full-screen onboarding shell — sits outside the 3-column app shell so
// the welcome wizard takes over the whole viewport.
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-canvas text-fg">{children}</div>;
}
