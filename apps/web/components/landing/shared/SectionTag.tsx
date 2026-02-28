interface SectionTagProps {
  children: React.ReactNode;
}

export function SectionTag({ children }: SectionTagProps) {
  return <div className="landing-tag">{children}</div>;
}
