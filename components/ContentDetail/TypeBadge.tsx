type ContentType = "article" | "link" | "community";

interface ContentTypeBadgeProps {
  type: ContentType;
  className?: string;
}

const badgeStyles: Record<ContentType, { tone: string; label: string }> = {
  article: { tone: "border-accent/40 text-accent-soft", label: "Article" },
  link: { tone: "border-hairline text-muted", label: "Link" },
  community: { tone: "border-success/40 text-success", label: "Community" },
};

const ContentTypeBadge = ({ type, className = "" }: ContentTypeBadgeProps) => {
  const styles = badgeStyles[type];

  return (
    <span
      className={`inline-flex items-center rounded-sm border bg-elevated px-2 py-0.5 font-mono text-xs ${styles.tone} ${className}`}
    >
      {styles.label}
    </span>
  );
};

export default ContentTypeBadge;
