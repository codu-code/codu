import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const config = {
  runtime: "experimental-edge",
};

export default function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // ?title=<title>
    const hasTitle = searchParams.has("title");
    const title = hasTitle
      ? searchParams.get("title")?.slice(0, 100)
      : "My default title";

    return new ImageResponse(
      (
        <div
          tw="bg-black flex flex-col h-full w-full justify-center"
          style={{ padding: "0 88px" }}
        >
          <svg
            style={{
              position: "absolute",
              height: "28px",
              width: "86px",
              top: "88px",
              left: "86px",
            }}
            viewBox="0 0 479 151"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M115.66 116.604C116.986 116.595 118.298 116.867 119.51 117.404C120.675 117.923 121.741 118.64 122.66 119.524C123.581 120.423 124.319 121.493 124.83 122.674C125.361 123.905 125.63 125.233 125.62 126.574C125.608 127.913 125.328 129.235 124.795 130.463C124.263 131.692 123.489 132.8 122.52 133.724C109.187 144.647 92.4553 150.565 75.22 150.454C54.4067 150.454 36.6667 143.121 22 128.454C7.33333 113.787 0 96.0472 0 75.2339C0 54.4873 7.33333 36.7772 22 22.1039C36.6667 7.43058 54.4067 0.0639063 75.22 0.00390625C93.0333 0.00390625 109.113 5.86724 123.46 17.5939C124.353 18.4903 125.049 19.5638 125.502 20.7454C125.955 21.9269 126.155 23.1902 126.09 24.4539C126.108 25.8076 125.853 27.151 125.34 28.4039C124.848 29.5812 124.132 30.6513 123.23 31.5539C122.316 32.4673 121.228 33.1882 120.03 33.6739C118.228 34.4156 116.249 34.6148 114.336 34.247C112.423 33.8793 110.658 32.9606 109.26 31.6039C104.532 27.8582 99.2077 24.9341 93.51 22.9539C87.6276 20.924 81.4427 19.9095 75.22 19.9539C67.9566 19.9447 60.7628 21.3685 54.0505 24.1438C47.3383 26.9191 41.2395 30.9914 36.1035 36.1274C30.9675 41.2634 26.8953 47.3622 24.1199 54.0744C21.3446 60.7867 19.9208 67.9805 19.93 75.2439C19.93 90.5772 25.29 103.617 36.01 114.364C45.6791 123.974 58.5451 129.693 72.1578 130.43C85.7705 131.168 99.1791 126.873 109.83 118.364C111.556 117.211 113.585 116.599 115.66 116.604Z"
              fill="white"
            />
            <path
              d="M244.67 97.7839C244.67 112.451 239.53 124.861 229.25 135.014C218.843 145.294 206.43 150.434 192.01 150.434C185.034 150.53 178.109 149.239 171.636 146.636C165.163 144.033 159.273 140.17 154.306 135.271C149.339 130.372 145.395 124.535 142.703 118.099C140.011 111.662 138.624 104.755 138.624 97.7789C138.624 90.8024 140.011 83.8955 142.703 77.4593C145.395 71.0231 149.339 65.186 154.306 60.287C159.273 55.388 165.163 51.5247 171.636 48.9217C178.109 46.3187 185.034 45.0278 192.01 45.1239C206.43 45.1239 218.843 50.2639 229.25 60.5439C234.183 65.3852 238.097 71.1656 240.76 77.5439C243.345 83.9787 244.672 90.8494 244.67 97.7839ZM192.01 64.7839C187.541 64.7463 183.113 65.6421 179.01 67.4139C171.137 70.7956 164.884 77.102 161.57 85.0039C159.869 89.0517 158.993 93.3982 158.993 97.7889C158.993 102.18 159.869 106.526 161.57 110.574C164.884 118.476 171.137 124.782 179.01 128.164C183.1 129.899 187.497 130.794 191.94 130.794C196.383 130.794 200.78 129.899 204.87 128.164C208.787 126.471 212.345 124.044 215.35 121.014C218.338 117.992 220.732 114.438 222.41 110.534C224.119 106.504 225 102.171 225 97.7939C225 93.4165 224.119 89.0839 222.41 85.0539C220.735 81.1459 218.34 77.5875 215.35 74.5639C212.345 71.5339 208.787 69.1069 204.87 67.4139C200.812 65.6544 196.433 64.7587 192.01 64.7839Z"
              fill="white"
            />
            <path
              d="M312.37 45.1439C324.389 44.9882 336.076 49.0823 345.37 56.704V9.78395C345.333 8.48949 345.56 7.20106 346.038 5.99763C346.517 4.7942 347.236 3.70111 348.151 2.78541C349.067 1.86971 350.16 1.15069 351.364 0.672404C352.567 0.194116 353.856 -0.0333572 355.15 0.00394663C356.443 -0.0216744 357.728 0.211003 358.93 0.688364C360.132 1.16573 361.227 1.87817 362.15 2.78395C363.089 3.6865 363.828 4.77562 364.321 5.98121C364.814 7.1868 365.048 8.48217 365.01 9.78395V97.7839C365.01 112.451 359.87 124.861 349.59 135.014C339.19 145.294 326.78 150.434 312.36 150.434C305.384 150.53 298.459 149.239 291.986 146.636C285.513 144.033 279.623 140.17 274.656 135.271C269.689 130.372 265.745 124.535 263.053 118.099C260.361 111.662 258.974 104.755 258.974 97.7789C258.974 90.8025 260.361 83.8955 263.053 77.4594C265.745 71.0232 269.689 65.186 274.656 60.287C279.623 55.388 285.513 51.5248 291.986 48.9218C298.459 46.3187 305.384 45.0278 312.36 45.1239L312.37 45.1439ZM345.37 97.8039C345.412 93.4264 344.544 89.088 342.82 85.0639C339.465 77.1466 333.186 70.8282 325.29 67.424C321.2 65.6884 316.803 64.794 312.36 64.794C307.917 64.794 303.52 65.6884 299.43 67.424C291.553 70.8003 285.299 77.1085 281.99 85.014C280.281 89.0596 279.4 93.407 279.4 97.799C279.4 102.191 280.281 106.538 281.99 110.584C285.299 118.489 291.553 124.798 299.43 128.174C303.52 129.909 307.917 130.804 312.36 130.804C316.803 130.804 321.2 129.909 325.29 128.174C329.209 126.479 332.769 124.052 335.78 121.024C338.746 117.997 341.12 114.443 342.78 110.544C344.519 106.516 345.401 102.171 345.37 97.7839V97.8039Z"
              fill="white"
            />
            <path
              d="M468.27 150.454C466.971 150.501 465.676 150.274 464.47 149.788C463.264 149.303 462.174 148.569 461.27 147.634C459.471 145.803 458.459 143.341 458.45 140.774C454.35 144.033 449.7 146.532 444.72 148.154C439.637 149.729 434.341 150.505 429.02 150.454C422.484 150.492 416.013 149.163 410.02 146.554C398.259 141.498 388.885 132.125 383.83 120.364C381.221 114.371 379.892 107.9 379.93 101.364V54.9239C379.909 53.6378 380.152 52.3611 380.644 51.1726C381.136 49.9841 381.866 48.9091 382.79 48.0139C383.7 47.0844 384.79 46.3505 385.994 45.857C387.198 45.3635 388.489 45.1208 389.79 45.1439C392.382 45.1492 394.867 46.1813 396.7 48.0143C398.533 49.8472 399.565 52.3317 399.57 54.9239V101.374C399.544 105.314 400.327 109.218 401.87 112.844C404.851 119.904 410.47 125.523 417.53 128.504C421.148 130.022 425.032 130.804 428.955 130.804C432.878 130.804 436.762 130.022 440.38 128.504C447.477 125.495 453.14 119.864 456.19 112.784C457.736 109.177 458.519 105.288 458.49 101.364V54.9239C458.471 53.6372 458.716 52.3602 459.21 51.1717C459.703 49.9833 460.435 48.9086 461.36 48.0139C462.269 47.0825 463.359 46.3473 464.563 45.8537C465.767 45.3601 467.059 45.1185 468.36 45.1439C470.952 45.1492 473.437 46.1813 475.27 48.0143C477.103 49.8472 478.135 52.3317 478.14 54.9239V140.674C478.14 141.966 477.884 143.245 477.387 144.437C476.89 145.63 476.161 146.712 475.244 147.621C474.326 148.531 473.237 149.249 472.04 149.735C470.843 150.222 469.562 150.466 468.27 150.454ZM447.82 16.8439L429.02 35.5539C428.129 36.4287 427.069 37.1131 425.906 37.5652C424.742 38.0174 423.498 38.2279 422.25 38.1839C420.954 38.2271 419.663 38.0036 418.457 37.5274C417.251 37.0512 416.155 36.3324 415.238 35.4155C414.322 34.4986 413.603 33.4031 413.127 32.197C412.65 30.9909 412.427 29.6999 412.47 28.4039C412.369 25.9766 413.212 23.6045 414.82 21.7839L433.63 3.0639C434.541 2.13329 435.631 1.39595 436.834 0.895964C438.036 0.395974 439.328 0.143587 440.63 0.153899C441.933 0.116946 443.228 0.353253 444.434 0.847564C445.64 1.34187 446.728 2.08322 447.63 3.02389C448.535 3.94688 449.247 5.04171 449.723 6.2439C450.198 7.44608 450.429 8.73132 450.4 10.0239C450.45 11.2757 450.247 12.5247 449.804 13.6964C449.361 14.8681 448.686 15.9386 447.82 16.8439Z"
              fill="white"
            />
          </svg>
          <div tw="flex relative">
            <div
              style={{
                color: "white",
                fontSize: "64px",
                lineHeight: 1,
                fontWeight: "800",
                letterSpacing: "-.025em",
                fontFamily: "sans-serif",
                lineClamp: 3,
              }}
            >
              {title}
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
        width: 1200,
        height: 630,
      }
    );
  } catch (err) {
    if (err instanceof Error) {
      // ✅ TypeScript knows err is Error
      console.log(err.message);
    } else {
      console.log("Unexpected error", err);
    }
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
