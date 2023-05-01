import type { NextPage } from "next";
import Nav from "../Nav/Nav";

type Props = {
  children: JSX.Element;
};

const LayoutEditor: NextPage<Props> = ({ children }) => {
  return (
    <>
      <Nav />
      {children}
    </>
  );
};

export default LayoutEditor;
