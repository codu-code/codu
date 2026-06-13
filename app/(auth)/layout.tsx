// Bare, distraction-free auth shell. The get-started page renders its own
// full-bleed split screen (brand panel + form), so the layout stays minimal.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-canvas text-fg">{children}</div>;
}
