import type { NextFunction, Request, Response } from "express";
import type { IUser } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try{
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ message: 'Unauthorized , Please login first' });
                return;
            }

            const [, token] = authHeader.split(' ');
            if (!token) {
                res.status(401).json({ message: 'Unauthorized , Please login first' });
                return;
            }

            const jwtSecret = process.env.JWT_SECRET as string;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not configured');
            }

            const decodedValue = jwt.verify(token, jwtSecret) as JwtPayload;
            if(!decodedValue || !decodedValue.user) {
                res.status(401).json({ message: 'invalid token' });
                return;
            }
            req.user = decodedValue.user;
            next();
        }catch(error){
            res.status(401).json({ message: 'Unauthorized , Please login first - JWT error' });
        }
    }