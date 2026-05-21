import asyncHandler from "express-async-handler";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { env } from "../config/env.js";

function authResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    token: generateToken(user._id, user.role)
  };
}

function getGoogleClient() {
  if (!env.GOOGLE_CLIENT_ID) return null;
  return new OAuth2Client(env.GOOGLE_CLIENT_ID);
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error(exists.googleId ? "This email uses Google sign-in. Continue with Google." : "Email already exists");
  }
  const user = await User.create({ name, email, password });
  res.status(201).json(authResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }
  const passwordOk = await user.matchPassword(password);
  if (!passwordOk) {
    if (user.googleId) {
      res.status(400);
      throw new Error("This account is linked to Google. Please continue with Google.");
    }
    res.status(401);
    throw new Error("Invalid credentials");
  }
  res.json(authResponse(user));
});

export const googleAuth = asyncHandler(async (req, res) => {
  const client = getGoogleClient();
  if (!client) {
    res.status(503);
    throw new Error("Google sign-in is not configured on the server");
  }

  const { credential } = req.body;
  if (!credential) {
    res.status(400);
    throw new Error("Google credential is required");
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch {
    res.status(401);
    throw new Error("Invalid Google sign-in. Please try again.");
  }

  const googleId = payload.sub;
  const email = payload.email?.toLowerCase();
  const name = payload.name || payload.given_name || email?.split("@")[0] || "User";
  const avatar = payload.picture;

  if (!email) {
    res.status(400);
    throw new Error("Google account must have an email address");
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      if (avatar) user.avatar = avatar;
      await user.save();
    }
  } else {
    user = await User.createFromGoogle({ name, email, googleId, avatar });
  }

  res.json(authResponse(user));
});

export const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});
