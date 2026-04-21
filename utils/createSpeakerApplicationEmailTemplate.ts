type TalkDetails = {
  title: string;
  lengthLabel: string;
  abstract: string;
};

type SpeakerApplicationDetails = {
  name: string;
  email: string;
  link?: string;
  location: string;
  bio: string;
  formatLabel: string;
  experienceLabel?: string;
  talks: TalkDetails[];
  other?: string;
  submittedAt: string;
};

const sectionBlock = (title: string, body: string) => `
      <h2 style="color: #171717; font-size: 16px; margin: 24px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">${title}</h2>
      <div style="margin-bottom: 16px; padding: 16px; background: #fafafa; border-radius: 8px; border-left: 4px solid #db2777;">
        <p style="margin: 0; color: #404040; white-space: pre-wrap; line-height: 1.6;">${body}</p>
      </div>
`;

const talkBlock = (talk: TalkDetails, idx: number) => `
      <div style="margin-bottom: 20px; padding: 18px; background: #fafafa; border-radius: 10px; border: 1px solid #e5e5e5;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #737373;">Talk ${idx + 1}</span>
          <span style="display: inline-block; background: linear-gradient(to right, #fb923c, #db2777); color: white; padding: 4px 10px; border-radius: 9999px; font-size: 11px;">${talk.lengthLabel}</span>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #171717;">${talk.title}</h3>
        <p style="margin: 0; color: #404040; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${talk.abstract}</p>
      </div>
`;

export const createSpeakerApplicationEmailTemplate = (
  details: SpeakerApplicationDetails,
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
      <h1 style="color: white; margin: 0; font-size: 24px;">New Speaker Pitch</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Someone wants to speak at a Codú meetup!</p>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #171717; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Speaker</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
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
        <tr>
          <td style="padding: 8px 0; color: #525252;">Format</td>
          <td style="padding: 8px 0;">${details.formatLabel}</td>
        </tr>
        ${
          details.experienceLabel
            ? `
        <tr>
          <td style="padding: 8px 0; color: #525252;">Experience</td>
          <td style="padding: 8px 0;">${details.experienceLabel}</td>
        </tr>
        `
            : ""
        }
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

      ${sectionBlock("Bio", details.bio)}

      <h2 style="color: #171717; font-size: 16px; margin: 24px 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Talks (${details.talks.length})</h2>
      ${details.talks.map((t, i) => talkBlock(t, i)).join("")}

      ${details.other ? sectionBlock("Anything else", details.other) : ""}

      <p style="color: #a3a3a3; font-size: 12px; margin: 24px 0 0 0;">Submitted: ${details.submittedAt}</p>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
        <a href="mailto:${details.email}?subject=Re: Codú Speaker Pitch"
           style="display: inline-block; background: linear-gradient(to right, #fb923c, #db2777); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reply to ${details.name}
        </a>
      </div>
    </div>

    <p style="text-align: center; color: #a3a3a3; font-size: 12px; margin-top: 20px;">
      Submitted via codu.co/speakers
    </p>
  </div>
</body>
</html>
`;
