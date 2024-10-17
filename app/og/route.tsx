import { ImageResponse } from "next/og";
import * as Sentry from "@sentry/nextjs";
import { Stars, Waves } from "@/components/background/background";

export const runtime = "edge";

const height = 630;
const width = 1200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`;

    const title = searchParams.get("title");
    const author = searchParams.get("author");
    const readTime = searchParams.get("readTime");
    const date = searchParams.get("date");

    if (!title || !author || !readTime || !date) {
      throw new Error("Missing required parameters");
    }

    const regularFontData = await fetch(
      new URL("@/assets/Lato-Regular.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    const boldFontData = await fetch(
      new URL("@/assets/Lato-Bold.ttf", import.meta.url),
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          tw="flex flex-col h-full w-full"
          style={{
            fontFamily: "'Lato'",
            backgroundColor: "#1d1b36",
            backgroundImage: `
              url('${origin}/images/og/noise.png'),
              radial-gradient(circle at top left, rgba(255, 255, 255, 0.15), transparent 40%),
              radial-gradient(circle at top right, rgba(255, 255, 255, 0.15), transparent 40%)
            `,
            backgroundRepeat: "repeat, no-repeat, no-repeat",
            backgroundSize: "100px 100px, 100% 100%, 100% 100%",
          }}
        >
          <Waves
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width,
              height,
            }}
          />
          <Stars
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width,
              height,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50px",
              left: 0,
              right: 0,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "50px",
              left: 0,
              right: 0,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50px",
              top: 0,
              bottom: 0,
              width: "40px",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: "50px",
              top: 0,
              bottom: 0,
              width: "40px",
              borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
          <img
            alt="planet"
            tw="h-[528px] w-[528px] absolute right-[-170px] top-[-170px]"
            src={`${origin}/images/og/planet.png`}
          />
          {/* Main content */}
          <div tw="flex flex-col h-full w-full px-28 py-28">
            <div tw="flex flex-grow">
              <img
                alt="Codu Logo"
                tw="h-10"
                src={`${origin}/images/codu.png`}
              />
            </div>
            <div tw="flex flex-col">
              <div
                tw="mb-8 font-bold"
                style={{
                  color: "white",
                  fontSize: "46px",
                  lineHeight: "1.2",
                  letterSpacing: "-0.025em",
                  fontFamily: "Lato-Bold",
                  display: "-webkit-box",
                  WebkitLineClamp: "3",
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  paddingBottom: "0.1em",
                }}
              >
                {title}
              </div>
              <div tw="flex items-center justify-between">
                <div tw="flex flex-col">
                  <div
                    tw="flex text-2xl text-neutral-100"
                    style={{ paddingBottom: "0.1em" }}
                  >
                    {author}
                  </div>
                  <div
                    tw="text-xl text-neutral-400"
                    style={{ paddingBottom: "0.1em" }}
                  >
                    {`${formatDate(date)} · ${readTime} min read`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        fonts: [
          {
            name: "Lato",
            data: regularFontData,
            style: "normal",
            weight: 400,
          },
          {
            name: "Lato-Bold",
            data: boldFontData,
            style: "normal",
            weight: 700,
          },
        ],
        height,
        width,
      },
    );
  } catch (err) {
    Sentry.captureException(err);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

function formatDate(dateString: string): string {
  try {
    let date: Date;
    if (dateString.includes(" ")) {
      // Handle the specific format from the URL
      const [datePart, timePart] = dateString.split(" ");
      const [year, month, day] = datePart.split("-");
      const [time] = timePart.split("."); // Remove milliseconds
      const isoString = `${year}-${month}-${day}T${time}Z`;
      date = new Date(isoString);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "";
  }
}
