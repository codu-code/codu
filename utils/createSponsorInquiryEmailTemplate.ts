import { escapeHtml, sanitizeHref } from "./escapeHtml";

type SponsorInquiryDetails = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  interests: string[];
  budgetRange: string;
  goals?: string;
  submittedAt: string;
};

export const createSponsorInquiryEmailTemplate = (
  details: SponsorInquiryDetails,
) => {
  const name = escapeHtml(details.name);
  const email = escapeHtml(details.email);
  const emailHref = sanitizeHref(`mailto:${details.email}`);
  const company = escapeHtml(details.company);
  const phone = escapeHtml(details.phone);
  const budgetRange = escapeHtml(details.budgetRange);
  const goals = escapeHtml(details.goals);
  const submittedAt = escapeHtml(details.submittedAt);
  const replyHref = sanitizeHref(
    `mailto:${details.email}?subject=Re: Codu Advertising Inquiry`,
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(to right, #fb923c, #db2777); padding: 30px; border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-size: 24px;">New Sponsor Inquiry</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Someone is interested in advertising with Codú!</p>
    </div>

    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <!-- Contact Details -->
      <h2 style="color: #171717; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Contact Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; color: #525252; width: 120px;">Name</td>
          <td style="padding: 8px 0; font-weight: 600;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #525252;">Email</td>
          <td style="padding: 8px 0;"><a href="${emailHref}" style="color: #db2777; text-decoration: none; font-weight: 600;">${email}</a></td>
        </tr>
        ${
          details.company
            ? `
        <tr>
          <td style="padding: 8px 0; color: #525252;">Company</td>
          <td style="padding: 8px 0; font-weight: 600;">${company}</td>
        </tr>
        `
            : ""
        }${
          details.phone
            ? `
        <tr>
          <td style="padding: 8px 0; color: #525252;">Phone</td>
          <td style="padding: 8px 0;">${phone}</td>
        </tr>
        `
            : ""
        }
      </table>

      <!-- Interests -->
      <h2 style="color: #171717; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Interested In</h2>
      <div style="margin-bottom: 24px;">
        ${details.interests
          .map(
            (interest) =>
              `<span style="display: inline-block; background: linear-gradient(to right, #fb923c, #db2777); color: white; padding: 6px 14px; border-radius: 9999px; font-size: 13px; margin: 4px 4px 4px 0;">${escapeHtml(interest)}</span>`,
          )
          .join("")}
      </div>

      <!-- Budget -->
      <h2 style="color: #171717; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Budget Range</h2>
      <p style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600; color: #171717;">${budgetRange}</p>

      <!-- Goals -->
      ${
        details.goals
          ? `
      <h2 style="color: #171717; font-size: 16px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5;">Goals & Requirements</h2>
      <div style="margin-bottom: 24px; padding: 16px; background: #fafafa; border-radius: 8px; border-left: 4px solid #db2777;">
        <p style="margin: 0; color: #404040; white-space: pre-wrap; line-height: 1.6;">${goals}</p>
      </div>
      `
          : ""
      }

      <!-- Timestamp -->
      <p style="color: #a3a3a3; font-size: 12px; margin: 0;">Submitted: ${submittedAt}</p>

      <!-- CTA -->
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
        <a href="${replyHref}"
           style="display: inline-block; background: linear-gradient(to right, #fb923c, #db2777); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Reply to ${name}
        </a>
      </div>
    </div>

    <p style="text-align: center; color: #a3a3a3; font-size: 12px; margin-top: 20px;">
      This inquiry was submitted through codu.co/advertise
    </p>
  </div>
</body>
</html>
`;
};
