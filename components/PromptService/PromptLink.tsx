import { useRouter } from "next/navigation";
import { start, done } from "nprogress";
import { usePrompt } from "@/components/PromptService/PromptContext";
import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { PromptDialog } from "./PromptDialog";

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

export const PromptLink = ({ to, children, className }: LinkProps) => {
  const router = useRouter();
  const { unsavedChanges } = usePrompt();
  const [hasPrompt, setHasPrompt] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleNavigation = (event) => {
    event.preventDefault();

    if (unsavedChanges) {
      setHasPrompt(true);
      setShowModal(true);
      return false;
    } else {
      router.push(to);
    }
  };

  const confirmNavigation = () => {
    setShowModal(false);
    setHasPrompt(false);
    start();
    router.push(to);
  };

  const cancelNavigation = () => {
    setShowModal(false);
    done(true);
    return false;
  };

  useEffect(() => {
    if (hasPrompt === true) {
      setHasPrompt(false);
    }

    done(true);
  }, [hasPrompt]);

  return (
    <>
      <Link href={to} onClick={handleNavigation} className={className}>
        {children}
      </Link>
      {showModal && (
        <PromptDialog
          title="Unsaved Changes"
          subTitle="You have unsaved changes. Are you sure you want to leave?"
          confirm={confirmNavigation}
          cancel={cancelNavigation}
        />
      )}
    </>
  );
};
