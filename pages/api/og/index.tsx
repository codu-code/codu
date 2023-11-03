/* eslint-disable jsx-a11y/alt-text */
import satori from "satori";
import sharp from "sharp";
import type { IncomingMessage, ServerResponse } from "http";

const height = 630;
const width = 1200;

interface Req extends IncomingMessage {
  query?: {
    title?: string;
  };
}

// TODO: Get emojis to work

const Og = async (req: Req, res: ServerResponse) => {
  try {
    const title = req.query?.title;
    if (!title) throw new Error("No title present");

    const fontFile = await fetch(
      "https://og-playground.vercel.app/inter-latin-ext-700-normal.woff",
    );

    const fontData: ArrayBuffer = await fontFile.arrayBuffer();

    const svg = await satori(
      <div
        tw="bg-black flex flex-col h-full w-full justify-center"
        style={{ padding: "0 88px" }}
      >
        <img
          style={{
            position: "absolute",
            height: "28px",
            width: "86px",
            top: "88px",
            left: "86px",
          }}
          src="https://www.codu.co/_next/image?url=%2Fimages%2Fcodu.png&w=1920&q=75"
        />
        <div tw="flex relative">
          <div
            style={{
              color: "white",
              fontSize: "64px",
              lineHeight: 1,
              fontWeight: "800",
              letterSpacing: "-.025em",
              lineClamp: 3,
            }}
          >
            {`${title}`}
          </div>
          <div
            tw="h-4 w-72 absolute left-0 bg-gradient-to-r bg-red-500"
            style={{
              bottom: "-3rem",
              backgroundImage: "linear-gradient(to right, #fb923c, #db2777)",
            }}
          ></div>
        </div>
      </div>,
      {
        fonts: [
          {
            name: "Inter Latin",
            data: fontData,
            style: "normal",
          },
        ],
        height,
        width,
      },
    );

    const png = await sharp(Buffer.from(svg)).webp().toBuffer();

    res.statusCode = 200;
    res.setHeader("Content-Type", `image/png`);
    res.setHeader(
      "Cache-Control",
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`,
    );
    res.end(png);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html");
    res.end("<h1>Internal Error</h1><p>Sorry, there was a problem</p>");
    console.error(error);
  }
};

export default Og;
