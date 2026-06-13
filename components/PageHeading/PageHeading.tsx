import React from "react";

const PageHeading = ({ children }: { children: React.ReactNode }) => (
  <h1 className="mt-8 border-b pb-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
    {children}
  </h1>
);

export default PageHeading;
