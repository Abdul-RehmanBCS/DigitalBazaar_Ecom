import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateToken = (id, role) =>
  jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: "7d" });
