import { ImageResponse } from "next/server";

export const runtime = "edge";

const height = 630;
const width = 1200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?title=<title>
    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "My default title";

    const fontData = await fetch(
      new URL(
        "https://og-playground.vercel.app/inter-latin-ext-700-normal.woff",
        import.meta.url,
      ),
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
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
        </div>
      ),
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
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
