import { useRouter } from "next/router";
import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "../Modal/Modal";
import { ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Dialog } from "@headlessui/react";

export interface serviceProps {
  confirm: () => void;
  cancel: () => void;
  title: string;
  subTitle?: string;
  content?: string;
}

export const PromptDialog = ({
  confirm,
  cancel,
  title,
  subTitle,
  content,
}: serviceProps): React.ReactElement<serviceProps> => {
  return (
    <Modal open={true} onClose={cancel}>
      <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
        <button
          type="button"
          className="bg-neutral-900 text-neutral-400 hover:text-neutral-500 focus:outline-none"
          onClick={cancel}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-600 sm:mx-0 sm:h-10 sm:w-10">
          <ExclamationCircleIcon
            className="text-white-600 h-6 w-6 "
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-white"
          >
            {title}
          </Dialog.Title>
          <div className="mt-2">
            <p className="text-sm text-neutral-500">{subTitle}</p>
            {content && (
              <p className="mt-2 text-sm text-neutral-500">{content}</p>
            )}
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
          Continue without saving
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-base font-medium text-neutral-700 shadow-sm hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          onClick={cancel}
        >
          Keep editing
        </button>
      </div>
    </Modal>
  );
};
