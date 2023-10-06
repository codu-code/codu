interface ReportDetails {
    reportedById?: string;
    reportedByEmail?: string | null;
    reportedByUser?: string | null;
    reportedOnName: string;
    reportedOnEmail: string | null;
    reportedComment: string;
    commentId: number;
    timeReportSent: Date;
    postLink:string;
    commentMadeByReporter:string;
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
        <p>link to post : <a style="color:yellow" href=${reportDetails.postLink || ''}>${reportDetails.postLink || ''}</a></p>
        <p style='padding:3rem; border: 2px solid white;'>comment : ${reportDetails.reportedComment || ''}</p>
        <p>commment made by user : ${reportDetails.reportedOnName || ''} </p>
        <p>comment ID : ${reportDetails.commentId || ''}</p>
        <p>users email : ${reportDetails.reportedOnEmail || ''} </p>   
        <p>comment report timestamp : ${reportDetails.timeReportSent || ''} </p>
    </div>

   <br>
   <br>
   <br>
   <br>
   <p>Comment left the reporter : ${reportDetails.commentMadeByReporter || ''} </p>
   <p>reported by user : ${reportDetails.reportedByUser || '' }</p>
   <p>users email : ${reportDetails.reportedByEmail || ''}</p>
   <p>users id : ${reportDetails.reportedById || ''}</p>
  </div>

</body>
</html>
`