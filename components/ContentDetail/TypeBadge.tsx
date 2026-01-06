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
    bg: "bg-gradient-to-r from-orange-400 to-pink-600",
    text: "text-white",
    label: "Article",
  },
  link: {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-700 dark:text-blue-300",
    label: "Link",
  },
  community: {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-700 dark:text-green-300",
    label: "Community",
  },
};

const ContentTypeBadge = ({ type, className = "" }: ContentTypeBadgeProps) => {
  const styles = badgeStyles[type];

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${styles.bg} ${styles.text} ${className}`}
    >
      {styles.label}
    </span>
  );
};

export default ContentTypeBadge;
