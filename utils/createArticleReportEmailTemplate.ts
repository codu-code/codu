type ReportDetails = {
  reason: string;
  url: string;
  id: string;
  email: string;
  title: string;
  username: string;
  userId: string;
  reportedBy: {
    username: string;
    id: string;
    email: string;
  };
};

export const createArticleReportEmailTemplate = (
  reportDetails: ReportDetails,
) => {
  function getBaseUrl() {
    if (typeof window !== "undefined") return "";
    const env = process.env.DOMAIN_NAME || process.env.VERCEL_URL;
    if (env) return "https://" + env;
    return "http://localhost:3000";
  }

  return `
  <!DOCTYPE html>
  <html>
  <body>
    <div style="font-family: Arial, sans-serif;">
      <div style='padding:3rem; background-color:black; color:white;'>
          <p>Details of reported article: ${reportDetails.reason}</p>
          <a style="color:yellow" href="${reportDetails.url}">Article Link</a>
          <p style='padding:3rem; border: 2px solid white;'>Title : ${
            reportDetails.title || ""
          }</p>
          <p>Article written by user <a href="${getBaseUrl()}/${
            reportDetails.username
          }" target="_blank" rel="nofollow">@${
            reportDetails.username || ""
          }</a> (ID: ${reportDetails.userId})</p>
          <p>Article ID : ${reportDetails.id || ""}</p>
      </div>
     <br>
     <br>
     <br>
     <br>
     <p>Comment left by the reporter : <a href="${getBaseUrl()}/${
       reportDetails.reportedBy.username
     }" target="_blank" rel="nofollow">@${
       reportDetails.reportedBy.username || ""
     }</a></p>
     <p>reported by user : @${reportDetails.reportedBy.username || ""}</p>
     <p>users email : ${reportDetails.reportedBy.email || ""}</p>
     <p>users id : ${reportDetails.reportedBy.id || ""}</p>
    </div>
  </body>
  </html>
  `;
};
