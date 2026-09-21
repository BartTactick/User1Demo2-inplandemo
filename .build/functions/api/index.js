"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookings_1 = require("./endpoints/bookings");
const availability_1 = require("./endpoints/availability");
const app = (0, express_1.default)();
app.use((req, res, next) => {
    if (req.headers.origin) {
        res.header("Access-Control-Allow-Origin", req.headers.origin);
    }
    res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE,PATCH,OPTIONS`);
    res.header(`Access-Control-Allow-Headers`, `Content-Type,include,x-orgid`);
    res.header(`Access-Control-Allow-Credentials`, `true`);
    next();
});
app.set("trust proxy", 1);
app.use(express_1.default.json());
app.use("/booking", bookings_1.bookingRouter);
app.use("/availability", availability_1.availabilityRouter);
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error(err); // log the error
    const status = err.status || 400;
    // send back an easily understandable error message to the caller
    res.status(status).json(JSON.stringify(err.stack || err));
});
module.exports = app;
