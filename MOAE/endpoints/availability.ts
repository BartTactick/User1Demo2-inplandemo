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

router.get("/:id", async (req, res) => {
  const app = catalyst.initialize(req as any);
  console.log(Object.keys(req.params));
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
  const startDateTime = new Date();
  startDateTime.setHours(12, 0, 0, 1);
  startDateTime.setDate(startDateTime.getDate() + 1);

  const franciseEvents = await COQLQuery(
    app,
    `
    select 
      Start_DateTime,
      End_DateTime,
      Event_Title
    from Events where 'What_Id->Accounts.id' = ${row["Account_Name.id"]} or 'What_Id->Deals.Account_Name.id' = ${row["Account_Name.id"]}`,
  );
  const availableTimeslots: {
    date: Date;
    timeslots: {
      available: boolean;
      time: string;
    }[];
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startDateTime);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
    const entity = {
      date: date,
      timeslots: [] as {
        available: boolean;
        time: string;
      }[],
    };
    for (const time of [10, 12, 14, 16]) {
      const hasFranciseEvent = franciseEvents.some((event: any) => {
        date.setHours(time, 0, 0, 1);
        const startDate = new Date(event.Start_DateTime);
        const endDate = new Date(event.End_DateTime);
        return startDate <= date && date <= endDate;
      });
      entity.timeslots.push({
        available: !hasFranciseEvent,
        time: `${time}:00`,
      });
    }
    availableTimeslots.push(entity);
  }

  res.status(200).json({ franciseEvents, availableTimeslots });
});

export const availabilityRouter = router;
