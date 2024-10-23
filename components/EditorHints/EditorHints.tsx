import React, { Fragment, useState } from "react";

const EditorHints = () => {
  const [visible, setVisible] = useState<boolean>(true);

  return (
    <Fragment>
      {visible && (
        <div className="fixed bottom-0 left-0 flex w-screen flex-col items-center bg-gray-700">
          <div className="flex w-full justify-end px-8 py-4 text-neutral-400">
            <button
              onClick={() => {
                setVisible(false);
              }}
            >
              X
            </button>
          </div>

          <div className="max-w-3xl px-24 pb-8 pt-4 text-neutral-400">
            <h3 className="">How to use the editor</h3>
            <p className="my-2 text-sm">
              Your post remains private until you “publish” the article.
            </p>
            <p className="my-2 text-sm">
              You can edit and format the main content of your article using
              Markdown. If you have never used Markdown, you can check out{" "}
              <a
                href="https://www.markdownguide.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text tracking-wide text-transparent hover:from-orange-300 hover:to-pink-500"
              >
                this
              </a>{" "}
              free guide on{" "}
              <a
                href="https://www.markdownguide.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer bg-gradient-to-r from-orange-400 to-pink-600 bg-clip-text tracking-wide text-transparent hover:from-orange-300 hover:to-pink-500"
              >
                markdownguide
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </Fragment>
  );
};

export default EditorHints;
