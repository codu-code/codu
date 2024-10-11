import { ImageResponse } from "next/og";
import PostHogClient from "@/app/posthog";
export const runtime = "edge";

const height = 630;
const width = 1200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const posthogClient = PostHogClient()
    const flags = await getData()
    const origin = `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get("host")}`
    posthogClient.capture({
      distinctId:"south-in",
      event:"Og image generated"
    })
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
    if (flags['og-image']){
      return new ImageResponse(
      (
        <div
          tw="flex flex-col h-full w-full justify-center"
          style={{padding: "0 88px",backgroundColor:"#1d1b36",backgroundRepeat:"repeat",background:  `
          url('${origin}/images/og/noise.svg'),
          radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.1), transparent 40%),
          radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent 40%)
        ` }}
        >
          <div className="line1" style={{
            width:"1200px",
            height:"30px",
            borderTop:"1px solid #39374E",
            borderBottom:"1px solid #39374E",
            position:"absolute",
            top:"50px"
          }}></div>
          <div className="line2" style={{
            width:"1200px",
            height:"30px",
            borderTop:"1px solid #39374E",
            borderBottom:"1px solid #39374E",
            position:"absolute",
            bottom:"50px"
          }}></div>
          <div className="line3" style={{
            width:"30px",
            height:"100%",
            borderRight:"1px solid #39374E",
            position:"absolute",
            left:"50px"
          }}></div>
          <div className="line4" style={{
            width:"30px",
            height:"100%",
            borderLeft:"1px solid #39374E",
            position:"absolute",
            right:"50px"
          }}></div>
          <img src={`${origin}/images/og/waves.svg`} style={{
            position:"absolute",
            top:"0",
            left:"0",
            width:"1200",
            height:"630"
            }}/>
          <img src={`${origin}/images/og/stars.svg`} style={{position:"absolute",
            top:"0",
            left:"0",
            width:"1200",
            height:"630"
            }}/>
          <img src={`${origin}/images/og/planet.svg`} style={{
            position:"absolute",
            height:"188px",
            width:"188px",
            right:"0",
            top:"10px"
          }}/>
          
          <img
            alt="Codu Logo"
            style={{
              position: "absolute",
              height: "53px",
              width: "163px",
              top: "88px",
              left: "86px",
            }}
            src="https://www.codu.co/_next/image?url=%2Fimages%2Fcodu.png&w=1920&q=75"
          />
          <div tw="flex relative flex-col" style={{marginTop:"200px"}}>
            <div
              style={{
                color: "white",
                fontSize: "52px",
                lineHeight: 1,
                fontWeight: "800",
                letterSpacing: "-.025em",
                fontFamily:"Lato",
                lineClamp: 3,
                
              }}
            >
              {title}
            </div>
            <div tw="flex justify-between mt-7 text-white">
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
              <div>Ben Gover</div>
              <span>26th January 2024 . 4 min read</span>
              </div>
              <button style={{
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'transparent', 
                background: 'linear-gradient(to bottom right, #FCE9A7 0%, #FF7379 53%, #F963ED 100%)',
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                border: '2px solid #FF7379',
                
              }}>
                Article
              </button>
            </div>
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
    } else {
      return new ImageResponse(
      (
        <div
          tw="bg-black flex flex-col h-full w-full justify-center"
          style={{ padding: "0 88px" }}
        >
          <img
            alt="Codu Logo"
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
                fontWeight:"bold",
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
  
    }
    
  } catch {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

async function getData(){
  const postHog = PostHogClient()
  const flags = await postHog.getAllFlags("south-in")
  return flags
}