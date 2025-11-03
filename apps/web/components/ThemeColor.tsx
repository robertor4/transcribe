export function ThemeColor() {
  return (
    <>
      {/* Light mode theme color */}
      <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      {/* Dark mode theme color */}
      <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
    </>
  );
}
