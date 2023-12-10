import { useRouter } from "next/navigation";
import { start, done } from "nprogress";
import { usePrompt } from "@/context/PromptContext";
import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

export const PromptLink = ({ to, children, className }: LinkProps) => {
  const router = useRouter();
  const { unsavedChanges } = usePrompt();
  const [hasPrompt, setHasPrompt] = useState(false);

  const handleNavigation = (event) => {
    event.preventDefault();

    if (unsavedChanges) {
      setHasPrompt(true);
      const userConfirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?",
      );
      if (userConfirmed) {
        setHasPrompt(false);
        start();
        router.push(to);
      } else {
        return false;
      }
    }

    router.push(to);
  };

  useEffect(() => {
    if (hasPrompt === true) {
      setHasPrompt(false);
    }

    done(true);
  }, [hasPrompt]);

  return (
    <Link href={to} onClick={handleNavigation} className={className}>
      {children}
    </Link>
  );
};
