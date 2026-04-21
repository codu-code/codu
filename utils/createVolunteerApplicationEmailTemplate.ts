type VolunteerApplicationDetails = {
  name: string;
  email: string;
  link?: string;
  location: string;
  areaLabel: string;
  workOn: string;
  experience?: string;
  whyCodu: string;
  commitmentLabel: string;
  other?: string;
  submittedAt: string;
};

const section = (title: string, body: string) => `
      <h2 style="color: #171717; font-size: 16px; margin: 24px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">${title}</h2>
      <div style="margin-bottom: 16px; padding: 16px; background: #fafafa; border-radius: 8px; border-left: 4px solid #db2777;">
        <p style="margin: 0; color: #404040; white-space: pre-wrap; line-height: 1.6;">${body}</p>
      </div>
`;

export const createVolunteerApplicationEmailTemplate = (
  details: VolunteerApplicationDetails,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #fb923c, #db2777); padding: 30px; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">New Volunteer Application</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Someone wants to help run Codú!</p>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #171717; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Contact</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="padding: 8px 0; color: #525252; width: 120px;">Name</td>
          <td style="padding: 8px 0; font-weight: 600;">${details.name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #525252;">Email</td>
          <td style="padding: 8px 0;"><a href="mailto:${details.email}" style="color: #db2777; text-decoration: none; font-weight: 600;">${details.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #525252;">Location</td>
          <td style="padding: 8px 0;">${details.location}</td>
        </tr>
        ${
          details.link
            ? `
        <tr>
          <td style="padding: 8px 0; color: #525252;">Link</td>
          <td style="padding: 8px 0;"><a href="${details.link}" style="color: #db2777; text-decoration: none;">${details.link}</a></td>
        </tr>
        `
            : ""
        }
      </table>

      <h2 style="color: #171717; font-size: 16px; margin: 24px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Area of interest</h2>
      <p style="margin: 0 0 8px 0;">
        <span style="display: inline-block; background: linear-gradient(to right, #fb923c, #db2777); color: white; padding: 6px 14px; border-radius: 9999px; font-size: 13px;">${details.areaLabel}</span>
      </p>

      <h2 style="color: #171717; font-size: 16px; margin: 24px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Time commitment</h2>
      <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #171717;">${details.commitmentLabel}</p>

      ${section("What they want to work on", details.workOn)}
      ${details.experience ? section("Relevant experience", details.experience) : ""}
      ${section("Why Codú", details.whyCodu)}
      ${details.other ? section("Anything else", details.other) : ""}

      <p style="color: #a3a3a3; font-size: 12px; margin: 24px 0 0 0;">Submitted: ${details.submittedAt}</p>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
        <a href="mailto:${details.email}?subject=Re: Codú Volunteer Application"
           style="display: inline-block; background: linear-gradient(to right, #fb923c, #db2777); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reply to ${details.name}
        </a>
      </div>
    </div>

    <p style="text-align: center; color: #a3a3a3; font-size: 12px; margin-top: 20px;">
      Submitted via codu.co/volunteer
    </p>
  </div>
</body>
</html>
`;
