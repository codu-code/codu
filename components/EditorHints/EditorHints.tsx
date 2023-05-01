import React, { Fragment, useState } from "react";

const EditorHints = () => {
  const [visible, setVisible] = useState<boolean>(true);

  return (
    <Fragment>
      {visible && (
        <div className="bg-gray-700 flex flex-col items-center w-screen fixed left-0 bottom-0">
          <div className="w-full text-neutral-400 flex justify-end px-8 py-4">
            <button
              onClick={() => {
                setVisible(false);
              }}
            >
              X
            </button>
          </div>

          <div className="max-w-3xl text-neutral-400 pb-8 pt-4 px-24">
            <h3 className="">How to use the editor</h3>
            <p className="text-sm my-2">
              Your post remains private until you “publish” the article.
            </p>
            <p className="text-sm my-2">
              You can edit and format the main content of your article using
              Markdown. If you have never used Markdown, you can check out{" "}
              <a
                href="https://www.markdownguide.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="fancy-link"
              >
                this
              </a>{" "}
              free guide on{" "}
              <a
                href="https://www.markdownguide.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="fancy-link"
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
