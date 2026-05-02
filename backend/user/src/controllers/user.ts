import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import type { Request, Response } from "express";
import { User } from "../model/User.js";
import { generateToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";

export const loginUser = TryCatch(async (req: Request, res: Response) => {
    const {email} = req.body;
    if (!email || !email.trim()) {
        return res.status(400).json({
            message: "Email is required"
        });
    }
    const rateLimitKey = `otp:ratelimit:${email}`;
    const rateLimit = await redisClient.get(rateLimitKey);
    if(rateLimit) {
        return res.status(429).json({
            message: "Too many requests. Please try again later."
        });
        return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;
    await redisClient.set(otpKey, otp, {
        ex: 300
    });
    await redisClient.set(rateLimitKey, "1", {
        ex: 60
    });
    const message = {
        to: email,
        subject: 'your otp for whatsapp',
        body: `your otp for whatsapp is ${otp}. It is valid for 5 minutes.`
    };
    await publishToQueue("send-otp", message);
    res.status(200).json({
        message: "OTP sent to email successfully"
    });  
});

export const verifyUser = TryCatch(async(req: Request, res: Response) => {
    const {email, otp: enteredOtp} = req.body;
    if(!email || !enteredOtp){
        return res.status(400).json({
            message: "Email and OTP are required"
        });
    }

    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);
    const storedOtpString = storedOtp !== null && storedOtp !== undefined ? String(storedOtp) : null;


    if(!storedOtpString) {
        return res.status(400).json({
            message: "OTP expired or not found"
        });
    }

    if(storedOtpString !== String(enteredOtp)) {
        return res.status(400).json({
            message: "Invalid OTP"
        });
    }

    await redisClient.del(otpKey);

    let user = await User.findOne({email});

    if(!user){
        const name = email.slice(0,8);
        user = await User.create({name, email});
    }

    const token = generateToken(user);
    return res.json({
        message: "user verified",
        user,
        token
    })

});

export const myProfile = TryCatch(async(req: AuthenticatedRequest, res) => {
    const user = req.user;

    res.json(user);
});

export const updateName = TryCatch(async(req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.user?._id);
    if(!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    user.name = req.body.name;

    await user.save();

    const token = generateToken(user);

    res.json({
        message: "Name updated successfully",
        user,
        token
    })
});

export const getAllUsers = TryCatch(async(req: AuthenticatedRequest, res) => {
    const users = await User.find();
    res.json(users);
});

export const getAUser = TryCatch(async(req: AuthenticatedRequest, res) => {
    const user = await User.findById(req.params.id);
    res.json(user);
});