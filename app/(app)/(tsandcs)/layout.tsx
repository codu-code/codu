export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-canvas text-fg">
      <div className="prose mx-auto max-w-prose px-5 py-16 sm:px-8 sm:py-20">
        {children}
      </div>
    </div>
  );
}
