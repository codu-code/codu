import type { NextPage } from "next";
import Footer from "../Footer/Footer";
import Nav from "../Nav/Nav";

type Props = {
  children: JSX.Element;
};

const Layout: NextPage<Props> = ({ children }) => {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
