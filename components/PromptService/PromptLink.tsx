import { useRouter } from "next/navigation";
import { usePrompt } from "@/components/PromptService/PromptContext";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
    router.push(to);
  };

  const cancelNavigation = () => {
    setShowModal(false);
    return false;
  };

  useEffect(() => {
    if (hasPrompt === true) {
      setHasPrompt(false);
    }
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
          confirmText="Continue without saving"
          cancelText="Keep editing"
        />
      )}
    </>
  );
};
