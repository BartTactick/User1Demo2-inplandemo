import express from "express";
import { bookingRouter } from "./endpoints/bookings";
import { availabilityRouter } from "./endpoints/availability";

const app = express();

app.use((req, res, next) => {
  if (req.headers.origin) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
  }
  res.header(
    `Access-Control-Allow-Methods`,
    `GET,PUT,POST,DELETE,PATCH,OPTIONS`,
  );
  res.header(`Access-Control-Allow-Headers`, `Content-Type,include,x-orgid`);
  res.header(`Access-Control-Allow-Credentials`, `true`);
  next();
});
app.set("trust proxy", 1);

app.use(express.json());

app.use("/booking", bookingRouter);
app.use("/availability", availabilityRouter);

app.use((err: any, req: any, res: any, next: any) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err); // log the error
  const status = err.status || 400;
  // send back an easily understandable error message to the caller
  res.status(status).json(JSON.stringify(err.stack || err));
});
module.exports = app;
