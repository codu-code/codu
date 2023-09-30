interface ReportDetails {
    reportedById: string | undefined;
    reportedByEmail: string | null | undefined;
    reportedByUser: string | null | undefined;
    reportedOnName: string;
    reportedOnEmail: string | null;
    comment: string;
    commentId: number;
    timeReportSent: Date;
    postLink:string;
}


export const createReportEmailTemplate = (reportDetails:ReportDetails) =>
`
<!DOCTYPE html>
<html>
<head>
  <title>Report details</title>
</head>
<body>

  <div style="font-family: Arial, sans-serif;">
    <div style='padding:3rem; background-color:black; color:white;'>
        <p>Details of reported comment:</p>
        <p>link to post : <a style="color:yellow" href=${reportDetails.postLink ? reportDetails.postLink : ''}>${reportDetails.postLink ? reportDetails.postLink : ''}</a></p>
        <p style='padding:3rem; border: 2px solid white;'>comment : ${reportDetails.comment ? reportDetails.comment : ''}</p>
        <p>commment made by user : ${reportDetails.reportedOnName ? reportDetails.reportedOnName : ''} </p>
        <p>comment ID : ${reportDetails.commentId ? reportDetails.commentId : ''}</p>
        <p>users email : ${reportDetails.reportedOnEmail ? reportDetails.reportedOnEmail : ''} </p>   
        <p>comment report timestamp : ${reportDetails.timeReportSent ? reportDetails.timeReportSent : ''} </p>
    </div>

   <br>
   <br>
   <br>
   <br>

   <p>reported by user : ${reportDetails.reportedByUser ? reportDetails.reportedByUser : '' }</p>
   <p>users email : ${reportDetails.reportedByEmail ? reportDetails.reportedByEmail : ''}</p>
   <p>users id : ${reportDetails.reportedById ? reportDetails.reportedById : ''}</p>

  </div>

</body>
</html>
`