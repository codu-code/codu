

import type { NextApiRequest, NextApiResponse } from 'next';
import sendEmail from '../../../utils/sendEmail';

export default async function SendReportEmail(req: NextApiRequest, res: NextApiResponse) {
  const { recipient, htmlMessage, subject } = req.body;

  try {
    await sendEmail({
      recipient,
      htmlMessage,
      subject,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Error sending email' });
  }
}
