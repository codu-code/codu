import React from "react";

const PageHeading = ({ children }: { children: React.ReactNode }) => (
  <h1 className="text-3xl tracking-tight font-extrabold text-gray-50 sm:text-4xl my-8 border-b-2 pb-4">
    {children}
  </h1>
);

export default PageHeading;
