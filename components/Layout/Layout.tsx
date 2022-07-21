import type { NextPage } from "next";
import Footer from "../Footer/Footer";
import Nav from "../Nav/Nav";
import Meta from "../Meta/Meta";

type Props = {
  children: JSX.Element;
};

const Layout: NextPage<Props> = ({ children }) => {
  return (
    <>
      <Meta />
      <Nav />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
