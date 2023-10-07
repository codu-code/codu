import React from "react";

function Toolbar() {
  return (
    <div className="pr-4 sm:pr-6 lg:pr-8 lg:flex-shrink-0 xl:pr-0">
      <div className="h-full sm:pl-6 xl:pl-4 py-6 lg:w-80 pl-4">
        {/* Start right column area */}
        <div className="bg-neutral-900 text-neutral-600 shadow-xl p-6">
          <h3 className="text-xl tracking-tight font-semibold text-white">
            How to use the editor
          </h3>
          <p className="mt-1 text-neutral-400">
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
        {/* End right column area */}
      </div>
    </div>
  );
}

export default Toolbar;

// {/* <div className="xl:flex-shrink-0 xl:w-64 ">
//                   <div className="h-full pl-4 pr-6 py-6 sm:pl-6 xl:pl-0  lg:px-4">
//                     {/* Start left column area */}
//                     <div className="h-full relative">
//                       <div className="bg-neutral-900 text-neutral-600 shadow-xl p-6">
//                         <h1 className="text-3xl tracking-tight font-extrabold text-white">
//                           {viewPreview ? "Previewing" : "Editing"} your post
//                         </h1>
//                         <p className="mt-1 text-neutral-400">
//                           The body of your content can be edited using markdown.
//                           Your post remains private until you
//                           &#8220;publish&#8221; the article.
//                         </p>
//                         <div className="flex">
//                           <button
//                             type="button"
//                             className="bg-white border border-neutral-300 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-neutral-600 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-300 mt-4"
//                             onClick={() =>
//                               setViewPreview((current) => !current)
//                             }
//                           >
//                             {viewPreview ? "Back to editing" : "View preview"}
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                     {/* End left column area */}
//                   </div>
//                 </div> */}
