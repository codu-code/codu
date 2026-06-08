type ContentType = "article" | "link" | "community";

interface ContentTypeBadgeProps {
  type: ContentType;
  className?: string;
}

const badgeStyles: Record<
  ContentType,
  { bg: string; text: string; label: string }
> = {
  article: {
    bg: "bg-accent",
    text: "text-on-accent",
    label: "Article",
  },
  link: {
    bg: "bg-accent/12",
    text: "text-accent-soft",
    label: "Link",
  },
  community: {
    bg: "bg-success/12",
    text: "text-success",
    label: "Community",
  },
};

const ContentTypeBadge = ({ type, className = "" }: ContentTypeBadgeProps) => {
  const styles = badgeStyles[type];

  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-xs ${styles.bg} ${styles.text} ${className}`}
    >
      {styles.label}
    </span>
  );
};

export default ContentTypeBadge;
