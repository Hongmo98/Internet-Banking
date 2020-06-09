var nodemailer = require('nodemailer');

exports.sentMailer = function (from1, { email }, subject, content) {
    return new Promise(async (resolve, reject) => {
        let transporter = nodemailer.createTransport({
            //service: 'Gmail',
            host: 'smtp.gmail.com',
            port: 465,

            secure: true,

            auth: {
                // type: 'OAuth2',
                user: 'mpbank.dack@gmail.com',
                pass: 'mpbank.dack2020'
            },
        });
        let test = `
        Ngân hàng TMCP Ngoại thương Việt Nam trân trọng thông báo Quý khách ma ${subject} OTP
      để xác nhận  
        `
        let mail = {
            from: from1,
            to: email,
            subject: test,
            html: content
        };

        transporter.verify(function (error, success) {
            if (error) {
                resolve({ message: 'Server is not ready to take our messages!', code: 400 });
            } else {
                console.log("Server is ready to take our messages");
            }
        });

        transporter.sendMail(mail, function (error, info) {

            if (error) {
                reject(error);
            } else {
                resolve({ message: 'success!', code: 200 });
            }

        });
    });
};
