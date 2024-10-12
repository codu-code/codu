import { ImageResponse } from "next/og";
export const runtime = "edge";

const height = 630;
const width = 1200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get("host")}`
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
          tw="flex flex-col h-full w-full justify-center"
          style={{padding: "0 114px",backgroundColor:"#1d1b36",backgroundRepeat:"repeat",background:  `
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
          <img alt="waves" src={`${origin}/images/og/waves.svg`} style={{
            position:"absolute",
            top:"0",
            left:"0",
            width:"1200",
            height:"630"
            }}/>
          <img alt="stars" src={`${origin}/images/og/stars.svg`} style={{position:"absolute",
            top:"0",
            left:"0",
            width:"1200",
            height:"630"
            }}/>
          <img alt="planet" src={`${origin}/images/og/planet.svg`} style={{
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
              top: "114px",
              left: "114px",
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
                textWrap:"balance"
                
              }}
            >
              {title}
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
  } catch {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
