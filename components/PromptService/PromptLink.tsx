import { useRouter } from "next/navigation";
import { usePrompt } from "@/components/PromptService/PromptContext";
import type { MutableRefObject, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { PromptDialog } from "./PromptDialog";
import React from "react";

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  close?: (
    focusableElement?:
      | HTMLElement
      | MutableRefObject<HTMLElement | null>
      | undefined,
  ) => void;
}

const PromptLink = React.forwardRef(
  (
    { to, children, className, close }: LinkProps,
    ref: React.Ref<HTMLAnchorElement>,
  ) => {
    const router = useRouter();
    const { unsavedChanges } = usePrompt();
    const [showModal, setShowModal] = useState(false);

    const handleNavigation = (
      event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    ) => {
      event.preventDefault();

      if (unsavedChanges) {
        setShowModal(true);
        return false;
      } else {
        if (close !== undefined) close();
        router.push(to);
      }
    };

    const confirmNavigation = () => {
      setShowModal(false);
      if (close !== undefined) close();
      router.push(to);
    };

    const cancelNavigation = () => {
      setShowModal(false);
      return false;
    };

    return (
      <>
        <Link
          href={to}
          onClick={handleNavigation}
          className={className}
          ref={ref}
        >
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
  },
);

PromptLink.displayName = "PromptLink";
export { PromptLink };
