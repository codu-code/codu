export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="prose mx-auto max-w-3xl dark:prose-invert lg:prose-lg">
      {children}
    </div>
  );
}
