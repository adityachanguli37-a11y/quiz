const nodemailer = require('nodemailer');

// Set up email transporter
// If credentials are placeholders, we skip actual sending and log to console
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
      user: process.env.SMTP_USER || 'test_user',
      pass: process.env.SMTP_PASS || 'test_pass'
    }
  });
};

const sendRegistrationEmail = async (candidateEmail, { name, candidateId, quizTitle, duration, passingPercentage, violationLimit }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Cybersecurity Platform" <noreply@yourdomain.com>',
      to: candidateEmail,
      subject: `Registration Confirmed - ${quizTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #1E293B; border-radius: 8px; background-color: #0F172A; color: #F8FAFC;">
          <h2 style="color: #38BDF8; text-align: center;">Cybersecurity Awareness Platform</h2>
          <hr style="border-color: #334155;" />
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your registration for the cybersecurity awareness assessment has been confirmed. Below are your credentials and assessment rules:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #1E293B;">
              <td style="padding: 10px; border: 1px solid #334155; font-weight: bold;">Candidate ID:</td>
              <td style="padding: 10px; border: 1px solid #334155; color: #F59E0B;">${candidateId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #334155; font-weight: bold;">Assessment:</td>
              <td style="padding: 10px; border: 1px solid #334155;">${quizTitle}</td>
            </tr>
            <tr style="background-color: #1E293B;">
              <td style="padding: 10px; border: 1px solid #334155; font-weight: bold;">Duration:</td>
              <td style="padding: 10px; border: 1px solid #334155;">${duration} Minutes</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #334155; font-weight: bold;">Passing Percentage:</td>
              <td style="padding: 10px; border: 1px solid #334155;">${passingPercentage}%</td>
            </tr>
          </table>

          <div style="background-color: #1E293B; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
            <h4 style="color: #EF4444; margin-top: 0;">CRITICAL ASSESSMENT RULES:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Time Limit:</strong> The quiz runs on a strict timer and will automatically submit at 0:00.</li>
              <li><strong>Fullscreen Mode:</strong> The assessment must be taken in Fullscreen. Exiting fullscreen logs a violation.</li>
              <li><strong>Tab Switching:</strong> Changing tabs, minimizing the window, or launching other apps logs a violation.</li>
              <li><strong>Copy/Paste Protection:</strong> Copying questions, pasting content, and right-clicking are strictly disabled.</li>
              <li><strong>Disqualification:</strong> Exceeding ${violationLimit} violations will immediately submit your quiz as <strong>Disqualified</strong>.</li>
            </ul>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <span style="background-color: #0284C7; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">Ready to Begin</span>
          </p>
          
          <hr style="border-color: #334155; margin-top: 30px;" />
          <p style="font-size: 11px; color: #64748B; text-align: center;">This is an automated system email. Please do not reply directly.</p>
        </div>
      `
    };

    // If local test configurations are default, skip SMTP calls and log to avoid errors
    if (process.env.SMTP_USER === 'your_email@gmail.com' || process.env.SMTP_USER === 'test_user') {
      console.log(`[Email Mock Logger] Dispatching registration email for Candidate: ${candidateId} (${candidateEmail})`);
      return;
    }

    await transporter.sendMail(mailOptions);
    console.log(`Registration email successfully sent to ${candidateEmail}`);
  } catch (error) {
    // Gracefully catch email issues to prevent registration workflow disruption
    console.error(`Failed to send email to ${candidateEmail}:`, error.message);
  }
};

module.exports = {
  sendRegistrationEmail
};
