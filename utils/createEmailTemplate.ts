export const createWelcomeEmailTemplate = (fullName?: string | null) =>
  `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    style="font-family: arial, 'helvetica neue', helvetica, sans-serif"
  >
    <head>
      <meta charset="UTF-8" />
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="x-apple-disable-message-reformatting" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta content="telephone=no" name="format-detection" />
      <title>New message</title>
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
        .es-desk-hidden {
          display: none;
          float: left;
          overflow: hidden;
          width: 0;
          max-height: 0;
          line-height: 0;
          mso-hide: all;
        }
        .es-button-border:hover a.es-button,
        .es-button-border:hover button.es-button {
          background: #56d66b !important;
        }
        .es-button-border:hover {
          border-color: #42d159 #42d159 #42d159 #42d159 !important;
          background: #56d66b !important;
        }
        td .es-button-border:hover a.es-button-1 {
          background: #fb923c !important;
          color: #000000 !important;
        }
        td .es-button-border-2:hover {
          background: #fb923c !important;
          border-style: solid solid solid solid !important;
          border-color: #42d159 #42d159 #42d159 #42d159 !important;
        }
        [data-ogsb] .es-button.es-button-3 {
          padding: 10px 20px !important;
        }
        @media only screen and (max-width: 600px) {
          p,
          ul li,
          ol li,
          a {
            line-height: 150% !important;
          }
          h1,
          h2,
          h3,
          h1 a,
          h2 a,
          h3 a {
            line-height: 120%;
          }
          h1 {
            font-size: 30px !important;
            text-align: left;
          }
          h2 {
            font-size: 24px !important;
            text-align: left;
          }
          h3 {
            font-size: 20px !important;
            text-align: left;
          }
          .es-header-body h1 a,
          .es-content-body h1 a,
          .es-footer-body h1 a {
            font-size: 30px !important;
            text-align: left;
          }
          .es-header-body h2 a,
          .es-content-body h2 a,
          .es-footer-body h2 a {
            font-size: 24px !important;
            text-align: left;
          }
          .es-header-body h3 a,
          .es-content-body h3 a,
          .es-footer-body h3 a {
            font-size: 20px !important;
            text-align: left;
          }
          .es-menu td a {
            font-size: 14px !important;
          }
          .es-header-body p,
          .es-header-body ul li,
          .es-header-body ol li,
          .es-header-body a {
            font-size: 14px !important;
          }
          .es-content-body p,
          .es-content-body ul li,
          .es-content-body ol li,
          .es-content-body a {
            font-size: 14px !important;
          }
          .es-footer-body p,
          .es-footer-body ul li,
          .es-footer-body ol li,
          .es-footer-body a {
            font-size: 14px !important;
          }
          .es-infoblock p,
          .es-infoblock ul li,
          .es-infoblock ol li,
          .es-infoblock a {
            font-size: 12px !important;
          }
          *[class="gmail-fix"] {
            display: none !important;
          }
          .es-m-txt-c,
          .es-m-txt-c h1,
          .es-m-txt-c h2,
          .es-m-txt-c h3 {
            text-align: center !important;
          }
          .es-m-txt-r,
          .es-m-txt-r h1,
          .es-m-txt-r h2,
          .es-m-txt-r h3 {
            text-align: right !important;
          }
          .es-m-txt-l,
          .es-m-txt-l h1,
          .es-m-txt-l h2,
          .es-m-txt-l h3 {
            text-align: left !important;
          }
          .es-m-txt-r img,
          .es-m-txt-c img,
          .es-m-txt-l img {
            display: inline !important;
          }
          .es-button-border {
            display: inline-block !important;
          }
          a.es-button,
          button.es-button {
            font-size: 18px !important;
            display: inline-block !important;
          }
          .es-adaptive table,
          .es-left,
          .es-right {
            width: 100% !important;
          }
          .es-content table,
          .es-header table,
          .es-footer table,
          .es-content,
          .es-footer,
          .es-header {
            width: 100% !important;
            max-width: 600px !important;
          }
          .es-adapt-td {
            display: block !important;
            width: 100% !important;
          }
          .adapt-img {
            width: 100% !important;
            height: auto !important;
          }
          .es-m-p0 {
            padding: 0px !important;
          }
          .es-m-p0r {
            padding-right: 0px !important;
          }
          .es-m-p0l {
            padding-left: 0px !important;
          }
          .es-m-p0t {
            padding-top: 0px !important;
          }
          .es-m-p0b {
            padding-bottom: 0 !important;
          }
          .es-m-p20b {
            padding-bottom: 20px !important;
          }
          .es-mobile-hidden,
          .es-hidden {
            display: none !important;
          }
          tr.es-desk-hidden,
          td.es-desk-hidden,
          table.es-desk-hidden {
            width: auto !important;
            overflow: visible !important;
            float: none !important;
            max-height: inherit !important;
            line-height: inherit !important;
          }
          tr.es-desk-hidden {
            display: table-row !important;
          }
          table.es-desk-hidden {
            display: table !important;
          }
          td.es-desk-menu-hidden {
            display: table-cell !important;
          }
          .es-menu td {
            width: 1% !important;
          }
          table.es-table-not-adapt,
          .esd-block-html table {
            width: auto !important;
          }
          table.es-social {
            display: inline-block !important;
          }
          table.es-social td {
            display: inline-block !important;
          }
          .es-desk-hidden {
            display: table-row !important;
            width: auto !important;
            overflow: visible !important;
            max-height: inherit !important;
          }
        }
      </style>
    </head>
    <body
      data-new-gr-c-s-loaded="14.1101.0"
      style="
        width: 100%;
        font-family: arial, 'helvetica neue', helvetica, sans-serif;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        padding: 0;
        margin: 0;
      "
    >
      <div class="es-wrapper-color" style="background-color: #f6f6f6">
        <!--[if gte mso 9]>
          <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
            <v:fill type="tile" color="#f6f6f6"></v:fill>
          </v:background>
        <![endif]-->
        <table
          class="es-wrapper"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            border-collapse: collapse;
            border-spacing: 0px;
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            background-repeat: repeat;
            background-position: center top;
            background-color: #f6f6f6;
          "
        >
          <tr>
            <td valign="top" style="padding: 0; margin: 0">
              <table
                class="es-content"
                cellspacing="0"
                cellpadding="0"
                align="center"
                style="
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  border-collapse: collapse;
                  border-spacing: 0px;
                  table-layout: fixed !important;
                  width: 100%;
                "
              >
                <tr>
                  <td align="center" style="padding: 0; margin: 0">
                    <table
                      class="es-content-body"
                      cellspacing="0"
                      cellpadding="0"
                      bgcolor="#ffffff"
                      align="center"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        border-collapse: collapse;
                        border-spacing: 0px;
                        background-color: #ffffff;
                        width: 600px;
                      "
                    >
                      <tr>
                        <td
                          align="left"
                          style="
                            padding: 0;
                            margin: 0;
                            padding-top: 20px;
                            padding-left: 20px;
                            padding-right: 20px;
                          "
                        >
                          <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              border-collapse: collapse;
                              border-spacing: 0px;
                            "
                          >
                            <tr>
                              <td
                                valign="top"
                                align="center"
                                style="padding: 0; margin: 0; width: 560px"
                              >
                                <table
                                  width="100%"
                                  cellspacing="0"
                                  cellpadding="0"
                                  role="presentation"
                                  style="
                                    mso-table-lspace: 0pt;
                                    mso-table-rspace: 0pt;
                                    border-collapse: collapse;
                                    border-spacing: 0px;
                                  "
                                >
                                  <tr>
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: arial, 'helvetica neue',
                                            helvetica, sans-serif;
                                          line-height: 21px;
                                          color: #333333;
                                          font-size: 14px;
                                        "
                                      >
                                        Hey there${
                                          fullName ? " " + fullName : ""
                                        },<br /><br />
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: arial, 'helvetica neue',
                                            helvetica, sans-serif;
                                          line-height: 21px;
                                          color: #333333;
                                          font-size: 14px;
                                        "
                                      >
                                        Congratulations and a warm welcome to
                                        Codú! 🎉<br /><br />We're thrilled to have
                                        you as a part of our ever-growing family
                                        of passionate coders, developers, and tech
                                        enthusiasts.<br /><br />Your decision to
                                        join us is a testament to your passion for
                                        coding, and we're confident that you'll
                                        fit right in with our supportive and
                                        collaborative community.<br /><br />
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: arial, 'helvetica neue',
                                            helvetica, sans-serif;
                                          line-height: 21px;
                                          color: #333333;
                                          font-size: 14px;
                                        "
                                      >
                                        To kick-start your journey with us, we
                                        have a special invitation just for you!
                                        We'd love for you to join our free Discord
                                        community where you can connect with
                                        fellow members, engage in real-time
                                        discussions, and get answers to your
                                        coding questions.<br /><br />To join,
                                        simply click on the button below.<br />
                                      </p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      align="center"
                                      style="padding: 0; margin: 0"
                                    >
                                      <!--[if mso
                                        ]><a
                                          href="${
                                            process.env.DISCORD_INVITE_URL || ""
                                          }"
                                          target="_blank"
                                          hidden
                                        >
                                          <v:roundrect
                                            xmlns:v="urn:schemas-microsoft-com:vml"
                                            xmlns:w="urn:schemas-microsoft-com:office:word"
                                            esdevVmlButton
                                            href="${
                                              process.env.DISCORD_INVITE_URL ||
                                              ""
                                            }"
                                            style="
                                              height: 39px;
                                              v-text-anchor: middle;
                                              width: 300px;
                                            "
                                            arcsize="10%"
                                            stroke="f"
                                            fillcolor="#db2777"
                                          >
                                            <w:anchorlock></w:anchorlock>
                                            <center
                                              style="
                                                color: #ffffff;
                                                font-family: arial,
                                                  'helvetica neue', helvetica,
                                                  sans-serif;
                                                font-size: 14px;
                                                font-weight: 400;
                                                line-height: 14px;
                                                mso-text-raise: 1px;
                                              "
                                            >
                                              Free invite to the Discord community
                                            </center>
                                          </v:roundrect></a
                                        > <!
                                      [endif]--><!--[if !mso]><!-- --><span
                                        class="msohide es-button-border-2 es-button-border"
                                        style="
                                          border-style: solid;
                                          border-color: #2cb543;
                                          background: #db2777;
                                          border-width: 0px;
                                          display: inline-block;
                                          border-radius: 4px;
                                          width: auto;
                                          mso-border-alt: 10px;
                                          mso-hide: all;
                                        "
                                        ><a
                                          href="${
                                            process.env.DISCORD_INVITE_URL || ""
                                          }"
                                          class="es-button es-button-1"
                                          target="_blank"
                                          style="
                                            mso-style-priority: 100 !important;
                                            text-decoration: none;
                                            -webkit-text-size-adjust: none;
                                            -ms-text-size-adjust: none;
                                            mso-line-height-rule: exactly;
                                            color: #ffffff;
                                            font-size: 16px;
                                            display: inline-block;
                                            background: #db2777;
                                            border-radius: 4px;
                                            font-family: arial, 'helvetica neue',
                                              helvetica, sans-serif;
                                            font-weight: normal;
                                            font-style: normal;
                                            line-height: 19px;
                                            width: auto;
                                            text-align: center;
                                            padding: 10px 20px;
                                            border-color: #db2777;
                                          "
                                          >Free invite to the Discord community</a
                                        ></span
                                      ><!--<![endif]-->
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      align="left"
                                      style="padding: 0; margin: 0"
                                    >
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: arial, 'helvetica neue',
                                            helvetica, sans-serif;
                                          line-height: 21px;
                                          color: #333333;
                                          font-size: 14px;
                                        "
                                      >
                                        <br />Our Discord server offers various
                                        channels tailored to different programming
                                        languages, frameworks, and interests, so
                                        you'll never run out of opportunities to
                                        learn and grow. Plus, you can join our
                                        regular virtual meetups, workshops, and
                                        hackathons to sharpen your skills and
                                        network with like-minded individuals.
                                      </p>
                                      <p
                                        style="
                                          margin: 0;
                                          -webkit-text-size-adjust: none;
                                          -ms-text-size-adjust: none;
                                          mso-line-height-rule: exactly;
                                          font-family: arial, 'helvetica neue',
                                            helvetica, sans-serif;
                                          line-height: 21px;
                                          color: #333333;
                                          font-size: 14px;
                                        "
                                      >
                                        Once again, welcome to Codú!<br /><br />Don't
                                        hesitate to reach out if you have any
                                        questions or need assistance. We're here
                                        to help you every step of the way.<br /><br />Looking
                                        forward to getting to know you in the
                                        community!<br /><br />Happy coding! 😊<br /><br /><em
                                          >Niall &amp; the Codú community</em
                                        ><br />
                                      </p>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td
                                      align="center"
                                      style="
                                        padding: 20px;
                                        margin: 0;
                                        font-size: 0;
                                      "
                                    >
                                      <table
                                        border="0"
                                        width="100%"
                                        height="100%"
                                        cellpadding="0"
                                        cellspacing="0"
                                        role="presentation"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tr>
                                          <td
                                            style="
                                              padding: 0;
                                              margin: 0;
                                              border-bottom: 1px solid #cccccc;
                                              background: unset;
                                              height: 1px;
                                              width: 100%;
                                              margin: 0px;
                                            "
                                          ></td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 0; margin: 0">
                                      <table
                                        cellpadding="0"
                                        cellspacing="0"
                                        width="100%"
                                        class="es-menu"
                                        role="presentation"
                                        style="
                                          mso-table-lspace: 0pt;
                                          mso-table-rspace: 0pt;
                                          border-collapse: collapse;
                                          border-spacing: 0px;
                                        "
                                      >
                                        <tr class="links">
                                          <td
                                            align="center"
                                            valign="top"
                                            width="33%"
                                            id="esd-menu-id-0"
                                            style="
                                              margin: 0;
                                              padding-left: 5px;
                                              padding-right: 5px;
                                              padding-top: 10px;
                                              padding-bottom: 10px;
                                              border: 0;
                                            "
                                          >
                                            <a
                                              target="_blank"
                                              href="https://www.linkedin.com/company/codu-community/"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: none;
                                                display: block;
                                                font-family: arial,
                                                  'helvetica neue', helvetica,
                                                  sans-serif;
                                                color: #db2777;
                                                font-size: 14px;
                                              "
                                              >LinkedIn</a
                                            >
                                          </td>
                                          <td
                                            align="center"
                                            valign="top"
                                            width="33%"
                                            id="esd-menu-id-1"
                                            style="
                                              margin: 0;
                                              padding-left: 5px;
                                              padding-right: 5px;
                                              padding-top: 10px;
                                              padding-bottom: 10px;
                                              border: 0;
                                            "
                                          >
                                            <a
                                              target="_blank"
                                              href="https://www.youtube.com/@codu"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: none;
                                                display: block;
                                                font-family: arial,
                                                  'helvetica neue', helvetica,
                                                  sans-serif;
                                                color: #db2777;
                                                font-size: 14px;
                                              "
                                              >YouTube</a
                                            >
                                          </td>
                                          <td
                                            align="center"
                                            valign="top"
                                            width="33%"
                                            id="esd-menu-id-2"
                                            style="
                                              margin: 0;
                                              padding-left: 5px;
                                              padding-right: 5px;
                                              padding-top: 10px;
                                              padding-bottom: 10px;
                                              border: 0;
                                            "
                                          >
                                            <a
                                              target="_blank"
                                              href="https://twitter.com/coducommunity"
                                              style="
                                                -webkit-text-size-adjust: none;
                                                -ms-text-size-adjust: none;
                                                mso-line-height-rule: exactly;
                                                text-decoration: none;
                                                display: block;
                                                font-family: arial,
                                                  'helvetica neue', helvetica,
                                                  sans-serif;
                                                color: #db2777;
                                                font-size: 14px;
                                              "
                                              >Twitter</a
                                            >
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
    `;
