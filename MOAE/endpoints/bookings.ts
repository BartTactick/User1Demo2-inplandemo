import express from "express";
import catalyst from "zcatalyst-sdk-node";
import {
  COQLQuery,
  COQLQueryAll,
  createItems,
  CRMUpsert,
  updateItems,
} from "../utils/crmConnector";
import { helpers } from "../utils/helpers";
import { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import { format, toZonedTime } from "date-fns-tz";

const router = express.Router();

router.get("/:id/create", async (req, res) => {
  const app = catalyst.initialize(req as any);

  const getPAT = await COQLQuery(
    app,
    `
    select 
      Contact_Name.id,
      Account_Name.id
    from Deals where id = ${req.params.id}`,
  );

  const [row] = getPAT;

  if (!row) return res.status(404).json({ error: "Details not found" });
  const { date, time, type } = req.query as any;
  console.log(req.query);

  const [hours, minutes] = time.split(":").map(Number);
  const startDateTime = new Date(date);
  startDateTime.setHours(hours, minutes);
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + 1); // Assuming the event lasts 1 hour

  const create = await createItems(app, "Events", [
    {
      Who_Id: row["Contact_Name.id"],
      What_Id: req.params.id,
      Start_DateTime: helpers.date.CRMFormat(startDateTime),
      End_DateTime: helpers.date.CRMFormat(endDateTime),
      Event_Title: "Inmeten " + type,
      $se_module: "Deals",
    },
  ]);
  await updateItems(app, "Deals", [
    {
      id: req.params.id,
      Datum_tijd_inmeten: helpers.date.CRMFormat(startDateTime),
    },
  ]);
  //Datum/tijd inmeten
  console.log(create);
  res.status(200).json({ message: "Booking created successfully" });
});

router.get("/:id", async (req, res) => {
  const app = catalyst.initialize(req as any);

  const getPAT = await COQLQuery(
    app,
    `
    select 
      Contact_Name.Last_Name,Contact_Name.First_Name,
      Contact_Name.Email,Contact_Name.Phone,
      Contact_Name.Mailing_City,Contact_Name.Mailing_Zip,
      Contact_Name.Mailing_Street,
      Account_Name.Account_Name,
      Soort_aanvrag
    from Deals where id = ${req.params.id}`,
  );

  const [row] = getPAT;

  if (!row) return res.status(404).json({ error: "Details not found" });
  // const getAvailability = await COQLQueryAll(
  //   app,
  //   "select Event_Title from Events where id > 0",
  // );
  res.json({
    contact: {
      name: [row["Contact_Name.First_Name"], row["Contact_Name.Last_Name"]]
        .filter(Boolean)
        .join(" "),
      email: row["Contact_Name.Email"],
      phone: row["Contact_Name.Phone"],
    },
    address: {
      street: row["Contact_Name.Mailing_Street"],
      zip: row["Contact_Name.Mailing_Zip"],
      city: row["Contact_Name.Mailing_City"],
    },
    franchise: row["Account_Name.Account_Name"],
    type: row.Soort_aanvrag,
  });
});

export const bookingRouter = router;
