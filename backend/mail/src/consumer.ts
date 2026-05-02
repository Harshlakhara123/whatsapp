import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.RABBITMQ_HOST,
      port: 5672,
      username: process.env.RABBITMQ_USER,
      password: process.env.RABBITMQ_PASSWORD,
    });
    const channel = await connection.createChannel();
    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });
    console.log(
      "mail service consumer started listensing for otp emails ",
      queueName,
    );
    channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());
          if (!to || !to.trim()) {
            console.log('No recipient provided in message');
            channel.ack(msg);
            return;
          }
          const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            auth: {
              user: process.env.USER,
              pass: process.env.PASSWORD,
            },
          });
          await transporter.sendMail({
            from: 'whatsapp',
            to,
            subject,
            text: body,
          });
          console.log(`OTP email sent to ${to} successfully`);
          channel.ack(msg);
        } catch (error) {
            console.log('failed to send otp', error)
        }
      }
    });
  } catch (error) {
    console.error("Error in start rabbitmq consumer:", error);
  }
};
