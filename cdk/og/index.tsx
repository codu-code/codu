import * as React from "react";
import { ImageResponse } from "@vercel/og";

exports.handler = async () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 128,
          background: "lavender",
        }}
      >
        Hello!
      </div>
    )
  );
