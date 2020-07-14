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
                pass: 'MPBank@1234'
            },
        });
        let test = `
            Ngân hàng MP bank trân trọng thông báo Quý khách ma ${subject} OTP
          để xác nhận  thời gian hết hạn trong 10 phút 
            `
        let mail = {
            from: from1,
            to: email,
            subject: subject,
            html: content
        };


        transporter.sendMail(mail, function (error, info) {
            if (error) {
                reject(error);
            } else {
                resolve({ message: 'success!', code: 200 });
            }

        });
    });
};
