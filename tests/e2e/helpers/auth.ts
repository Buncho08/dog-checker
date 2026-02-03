import dotenv from "dotenv";
import { createSessionToken } from "../../../lib/auth";

dotenv.config();

export const getSessionToken = async (subject = "user") => {
	if (!process.env.AUTH_SECRET) {
		// fallback for local test runs; should align with app .env
		process.env.AUTH_SECRET = "test-secret";
	}
	return createSessionToken(subject);
};
