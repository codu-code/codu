import type { NextPage } from "next";
import Head from "next/head";
const Meta: NextPage = () => {
  return (
    <Head>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="favicon-16x16.png"
      />
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="site.webmanifest" />
      <link rel="mask-icon" href="safari-pinned-tab.svg" color="#000000" />
      <link rel="shortcut icon" href="favicon.ico" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="msapplication-config" content="browserconfig.xml" />
      <meta name="theme-color" content="#000" />
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      <meta
        name="description"
        content={`Codú is the ultimate community for web developers.`}
        key="description"
      />
      <meta
        name="og:description"
        content={`Codú is the ultimate community for web developers.`}
        key="og:description"
      />
      <meta name="og:title" content={`Codú Community`} key="og:title" />
      <meta
        property="og:image"
        content="/images/og/home-og.png"
        key="og:image"
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://codu.co" />
    </Head>
  );
};

export default Meta;
