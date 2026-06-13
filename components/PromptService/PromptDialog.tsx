import React from "react";
import { Modal } from "../Modal/Modal";
import { ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { DialogTitle } from "@headlessui/react";

export interface serviceProps {
  confirm: () => void;
  cancel: () => void;
  title: string;
  subTitle?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
}

export const PromptDialog = ({
  confirm,
  cancel,
  title,
  subTitle,
  content,
  confirmText,
  cancelText,
}: serviceProps): React.ReactElement<serviceProps> => {
  return (
    <Modal open={true} onClose={cancel}>
      <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
        <button
          type="button"
          className="bg-elevated text-faint hover:text-muted focus:outline-none"
          onClick={cancel}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent sm:mx-0 sm:h-10 sm:w-10">
          <ExclamationCircleIcon
            className="h-6 w-6 text-on-accent"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <DialogTitle
            as="h3"
            className="font-display text-lg font-medium leading-6 text-fg"
          >
            {title}
          </DialogTitle>
          <div className="mt-2">
            <p className="text-sm text-muted">{subTitle}</p>
            {content && <p className="mt-2 text-sm text-muted">{content}</p>}
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          className="primary-button ml-4"
          type="button"
          disabled={false}
          onClick={confirm}
        >
          {confirmText}
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md border border-hairline bg-surface px-4 py-2 text-base font-medium text-fg shadow-sm hover:bg-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={cancel}
        >
          {cancelText}
        </button>
      </div>
    </Modal>
  );
};
