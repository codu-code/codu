type ReportDetails = {
  reason: string;
  url: string;
  id: number;
  email: string;
  comment: string;
  username: string;
  userId: string;
  reportedBy: {
    username: string;
    id: string;
    email: string;
  };
};

export const createCommentReportEmailTemplate = (
  reportDetails: ReportDetails,
) =>
  `
  <!DOCTYPE html>
  <html>
  <body>
    <div style="font-family: Arial, sans-serif;">
      <div style='padding:3rem; background-color:black; color:white;'>
          <p>Details of reported post: ${reportDetails.reason}</p>
          <a style="color:yellow" href="${reportDetails.url}">Post Link</a>
          <p style='padding:3rem; border: 2px solid white;'>Comment : ${reportDetails.comment}</p>
          <p>commment made by user : ${reportDetails.comment} </p>
          <p>comment ID : ${reportDetails.id}</p>
          <p>Comment user information: Username - ${reportDetails.username}, Email - ${reportDetails.email}, User ID - ${reportDetails.userId} </p>   
      </div>
     <br>
     <br>
     <p>Comment left by the reporter : @${reportDetails.reportedBy.username} </p>
     <p>users email : ${reportDetails.reportedBy.email}</p>
     <p>users id : ${reportDetails.reportedBy.id}</p>
    </div>
  </body>
  </html>
  `;
