// Every real route lives under app/[locale]/, whose own layout renders the
// actual <html>/<body> (with the correct lang). This fallback only fires for
// routes outside that segment (e.g. a root-level error boundary), so it
// still ships a valid document shell instead of a bare <html> with no lang.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
