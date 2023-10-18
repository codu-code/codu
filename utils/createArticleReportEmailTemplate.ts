interface ReportDetails {
  postUrl: string | undefined;
  postTitle: string;
  reportedOnName: string;
  postId: string | undefined;

  timeReportSent: Date;
  commentMadeByReporter: string;

  reportedByUser?: string | null;
  reportedByEmail?: string | null;
  reportedById?: string;
}

export const createArticleReportEmailTemplate = (
  reportDetails: ReportDetails,
) =>
  `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Report details</title>
  </head>
  <body>
    <div style="font-family: Arial, sans-serif;">
      <div style='padding:3rem; background-color:black; color:white;'>
          <p>Details of reported article:</p>
          <a style="color:yellow" href="${
            reportDetails.postUrl
          }">Article Link</a>
          <p style='padding:3rem; border: 2px solid white;'>Title : ${
            reportDetails.postTitle || ""
          }</p>
          <p>Article written by user : ${
            reportDetails.reportedOnName || ""
          } </p>
          <p>Article ID : ${reportDetails.postId || ""}</p>        
           <p>report timestamp : ${reportDetails.timeReportSent || ""} </p>
      </div>
     <br>
     <br>
     <br>
     <br>
     <p>Comment left by the reporter : ${
       reportDetails.commentMadeByReporter || ""
     } </p>
     <p>reported by user : ${reportDetails.reportedByUser || ""}</p>
     <p>users email : ${reportDetails.reportedByEmail || ""}</p>
     <p>users id : ${reportDetails.reportedById || ""}</p>
    </div>
  </body>
  </html>
  `;
