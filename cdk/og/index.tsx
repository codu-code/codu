/* eslint-disable jsx-a11y/alt-text */
import satori from "satori";
import * as sharp from "sharp";
import axios from "axios";
import type { IncomingMessage, ServerResponse } from "http";
import * as React from "react";

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

    const fontFile = await axios.get(
      "https://og-playground.vercel.app/inter-latin-ext-700-normal.woff",
      {
        responseType: "arraybuffer",
      }
    );

    const svg = await satori(
      <div
        style={{
          padding: "0 88px",
          background: "black",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          width: "100%",
        }}
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
        <div
          style={{
            display: "flex",
            position: "relative",
          }}
        >
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
            style={{
              bottom: "-3rem",
              backgroundColor: "black",
              backgroundImage: "linear-gradient(to right, #fb923c, #db2777)",
              position: "absolute",
              height: 16,
              width: 288,
              left: 0,
            }}
          ></div>
        </div>
      </div>,
      {
        fonts: [
          {
            name: "Inter Latin",
            data: fontFile.data,
            style: "normal",
          },
        ],
        height,
        width,
      }
    );

    const png = await sharp(Buffer.from(svg)).webp().toBuffer();

    res.statusCode = 200;
    res.setHeader("Content-Type", `image/png`);
    res.setHeader(
      "Cache-Control",
      `public, immutable, no-transform, s-maxage=31536000, max-age=31536000`
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
