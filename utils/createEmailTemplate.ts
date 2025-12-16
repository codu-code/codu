export const createWelcomeEmailTemplate = (fullName?: string | null) =>
  `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
  >
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>Welcome to Codú</title>
      <!--[if (mso 16)]>
        <style type="text/css">
          a {
            text-decoration: none;
          }
        </style>
      <![endif]-->
      <!--[if gte mso 9
        ]><style>
          sup {
            font-size: 100% !important;
          }
        </style><!
      [endif]-->
      <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG></o:AllowPNG>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      <![endif]-->
      <style type="text/css">
        #outlook a {
          padding: 0;
        }
        .es-button {
          mso-style-priority: 100 !important;
          text-decoration: none !important;
        }
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }
        .es-button-border:hover a.es-button,
        .es-button-border:hover button.es-button {
          background: #be185d !important;
        }
        .es-button-border:hover {
          background: #be185d !important;
        }
        @media only screen and (max-width: 600px) {
          .es-content-body {
            width: 100% !important;
          }
          .es-content {
            width: 100% !important;
          }
          .mobile-padding {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          h1 {
            font-size: 28px !important;
          }
          .es-button {
            font-size: 16px !important;
            padding: 14px 28px !important;
          }
        }
      </style>
    </head>
    <body
      style="
        width: 100%;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        padding: 0;
        margin: 0;
        background-color: #f3f4f6;
      "
    >
      <table
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="
          border-collapse: collapse;
          padding: 0;
          margin: 0;
          background-color: #f3f4f6;
        "
      >
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <!-- Main Container -->
            <table
              class="es-content-body"
              cellspacing="0"
              cellpadding="0"
              align="center"
              style="
                border-collapse: collapse;
                background-color: #ffffff;
                width: 600px;
                max-width: 600px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              "
            >
              <!-- Header with Logo -->
              <tr>
                <td
                  align="center"
                  style="
                    padding: 32px 40px;
                    background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
                    background-color: #db2777;
                  "
                >
                  <h1
                    style="
                      margin: 0;
                      font-size: 32px;
                      font-weight: 700;
                      color: #ffffff;
                      letter-spacing: -0.5px;
                    "
                  >
                    Codú
                  </h1>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td class="mobile-padding" style="padding: 40px;">
                  <!-- Greeting -->
                  <h2
                    style="
                      margin: 0 0 24px 0;
                      font-size: 24px;
                      font-weight: 600;
                      color: #111827;
                      line-height: 1.3;
                    "
                  >
                    Welcome to Codú${fullName ? ", " + fullName : ""}! 🎉
                  </h2>

                  <!-- Intro Text -->
                  <p
                    style="
                      margin: 0 0 20px 0;
                      font-size: 16px;
                      line-height: 1.6;
                      color: #374151;
                    "
                  >
                    We're thrilled to have you join our community of passionate developers and tech enthusiasts!
                  </p>

                  <p
                    style="
                      margin: 0 0 20px 0;
                      font-size: 16px;
                      line-height: 1.6;
                      color: #374151;
                    "
                  >
                    Your journey with Codú starts now. Whether you're here to learn, share knowledge, or connect with fellow coders, you've found the right place.
                  </p>

                  <!-- Discord CTA Section -->
                  <table
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                      margin: 32px 0;
                      border-collapse: collapse;
                    "
                  >
                    <tr>
                      <td
                        style="
                          background-color: #fdf2f8;
                          border-radius: 8px;
                          padding: 24px;
                          border-left: 4px solid #db2777;
                        "
                      >
                        <p
                          style="
                            margin: 0 0 16px 0;
                            font-size: 16px;
                            font-weight: 600;
                            color: #111827;
                          "
                        >
                          Join our Discord Community
                        </p>
                        <p
                          style="
                            margin: 0 0 20px 0;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #4b5563;
                          "
                        >
                          Connect with fellow developers, get help with your coding questions, and participate in our events and workshops.
                        </p>
                        <!-- Button -->
                        <table cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                          <tr>
                            <td
                              align="center"
                              style="
                                background-color: #db2777;
                                border-radius: 6px;
                              "
                            >
                              <!--[if mso]>
                              <a href="${process.env.DISCORD_INVITE_URL || ""}" target="_blank" hidden>
                                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                                  href="${process.env.DISCORD_INVITE_URL || ""}"
                                  style="height:44px;v-text-anchor:middle;width:200px;"
                                  arcsize="14%"
                                  stroke="f"
                                  fillcolor="#db2777">
                                  <w:anchorlock/>
                                  <center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;">
                                    Join Discord
                                  </center>
                                </v:roundrect>
                              </a>
                              <![endif]-->
                              <!--[if !mso]><!-->
                              <a
                                href="${process.env.DISCORD_INVITE_URL || ""}"
                                target="_blank"
                                class="es-button"
                                style="
                                  display: inline-block;
                                  padding: 14px 32px;
                                  font-size: 16px;
                                  font-weight: 600;
                                  color: #ffffff;
                                  text-decoration: none;
                                  border-radius: 6px;
                                  background-color: #db2777;
                                "
                              >
                                Join Discord
                              </a>
                              <!--<![endif]-->
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- What's Next Section -->
                  <p
                    style="
                      margin: 0 0 16px 0;
                      font-size: 16px;
                      font-weight: 600;
                      color: #111827;
                    "
                  >
                    What you can do on Codú:
                  </p>

                  <table width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px 0; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; font-size: 15px; line-height: 1.5; color: #374151;">
                        ✍️ &nbsp; Write and publish articles to share your knowledge
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 15px; line-height: 1.5; color: #374151;">
                        💬 &nbsp; Engage with other developers in discussions
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 15px; line-height: 1.5; color: #374151;">
                        🎯 &nbsp; Build your profile and grow your network
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-size: 15px; line-height: 1.5; color: #374151;">
                        📚 &nbsp; Learn from tutorials and community resources
                      </td>
                    </tr>
                  </table>

                  <!-- Sign off -->
                  <p
                    style="
                      margin: 0 0 8px 0;
                      font-size: 16px;
                      line-height: 1.6;
                      color: #374151;
                    "
                  >
                    Happy coding! 🚀
                  </p>
                  <p
                    style="
                      margin: 0;
                      font-size: 16px;
                      line-height: 1.6;
                      color: #374151;
                      font-style: italic;
                    "
                  >
                    — Niall &amp; the Codú team
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td
                  style="
                    padding: 24px 40px;
                    background-color: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                  "
                >
                  <!-- Social Links -->
                  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <table cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                          <tr>
                            <td style="padding: 0 12px;">
                              <a
                                href="https://www.linkedin.com/company/codu-community/"
                                target="_blank"
                                style="
                                  font-size: 14px;
                                  color: #db2777;
                                  text-decoration: none;
                                  font-weight: 500;
                                "
                              >
                                LinkedIn
                              </a>
                            </td>
                            <td style="padding: 0 12px;">
                              <a
                                href="https://www.youtube.com/@codu"
                                target="_blank"
                                style="
                                  font-size: 14px;
                                  color: #db2777;
                                  text-decoration: none;
                                  font-weight: 500;
                                "
                              >
                                YouTube
                              </a>
                            </td>
                            <td style="padding: 0 12px;">
                              <a
                                href="https://x.com/coducommunity"
                                target="_blank"
                                style="
                                  font-size: 14px;
                                  color: #db2777;
                                  text-decoration: none;
                                  font-weight: 500;
                                "
                              >
                                X
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p
                          style="
                            margin: 0;
                            font-size: 12px;
                            color: #9ca3af;
                            line-height: 1.5;
                          "
                        >
                          © ${new Date().getFullYear()} Codú. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
    `;
