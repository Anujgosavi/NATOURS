const nodeMailer = require('nodemailer');

const sendEmail = async options => {
  //1 create a transporter
  const transporter = nodeMailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  //2) define the email options
  const mailOptions = {
    from: 'anuj gosavi <anujgosavi2005@gamil.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  //3) actully send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
