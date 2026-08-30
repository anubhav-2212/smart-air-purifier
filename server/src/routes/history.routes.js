import express from "express";
import { getHistory } from "../controllers/history.controller.js";

const historyRouter = express.Router();

historyRouter.get("/history", getHistory);

export default historyRouter;