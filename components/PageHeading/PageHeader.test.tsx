import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PageHeading from "./PageHeading";

describe("Page Header", () => {
  it("renders the ui with the correct heading value", () => {
    const { getByText } = render(<PageHeading>Hello Codu</PageHeading>);

    expect(getByText("Hello Codu")).toBeInTheDocument();
  });
});
