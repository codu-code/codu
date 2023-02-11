import { useRouter } from 'next/router';
import React, {useState, useEffect, useCallback} from 'react';
import { Modal } from '../Modal/Modal';
import { ExclamationIcon, XIcon } from "@heroicons/react/outline";
import { Dialog } from '@headlessui/react';

export interface serviceProps {
  shouldConfirmLeave: boolean;
  updateParent: (...args: any[]) => any;
}


export const PromptDialog = ({
  updateParent,
  shouldConfirmLeave,
}: serviceProps): React.ReactElement<serviceProps> => {
  const [showPromptDialog, setshowPromptDialog] = useState(false);
  const [nextRouterPath, setNextRouterPath] = useState<string>();

  const router = useRouter();

  const routeChangeStart = useCallback(
    (nextPath: string) => {
      if (!shouldConfirmLeave) {
        return;
      }
      updateParent('initial')
      setshowPromptDialog(true);
      setNextRouterPath(nextPath);
      // need to throw error to trick router
      // look for better solution in the future
      router.events.emit('routeChangeError');
      throw 'Aborting route change. Please ignore this error.';
    },
    [shouldConfirmLeave]
  );

  const cancelRouteChange = () => {
    updateParent('cancel')
    setNextRouterPath(null);
    setshowPromptDialog(false);
  };

  const confirmRouteChange = () => {
    updateParent('confirm')
    setshowPromptDialog(false);
    removeListener();
    router.push(nextRouterPath);
  };

  const removeListener = () => {
    router.events.off('routeChangeStart', routeChangeStart);
  };

  useEffect(() => {
    router.events.on('routeChangeStart', routeChangeStart);
    return removeListener;
  }, [routeChangeStart]);

  return (
    <Modal
      open={showPromptDialog}
      onClose={cancelRouteChange}
    >
        <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={cancelRouteChange}
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationIcon
                className="h-6 w-6 text-red-600"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <Dialog.Title
                as="h3"
                className="text-lg leading-6 font-medium text-smoke"
              >
                Unsaved Changes
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  You have unsaved changes.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Changes that you have made will be lost. 
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              disabled={false}
              className="w-full inline-flex justify-center border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={confirmRouteChange}
            >
              Continue without saving
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={cancelRouteChange}
            >
              keep editing
            </button>
          </div>
    </Modal>
  );
};