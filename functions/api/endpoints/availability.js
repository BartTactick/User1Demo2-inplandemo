"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityRouter = void 0;
const express_1 = __importDefault(require("express"));
const zcatalyst_sdk_node_1 = __importDefault(require("zcatalyst-sdk-node"));
const crmConnector_1 = require("../utils/crmConnector");
const router = express_1.default.Router();
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const app = zcatalyst_sdk_node_1.default.initialize(req);
    console.log(Object.keys(req.params));
    const getPAT = yield (0, crmConnector_1.COQLQuery)(app, `
    select 
      Contact_Name.id,
      Account_Name.id
    from Deals where id = ${req.params.id}`);
    const [row] = getPAT;
    if (!row)
        return res.status(404).json({ error: "Details not found" });
    const startDateTime = new Date();
    startDateTime.setHours(12, 0, 0, 1);
    startDateTime.setDate(startDateTime.getDate() + 1);
    const franciseEvents = yield (0, crmConnector_1.COQLQuery)(app, `
    select 
      Start_DateTime,
      End_DateTime,
      Event_Title
    from Events where 'What_Id->Accounts.id' = ${row["Account_Name.id"]} or 'What_Id->Deals.Account_Name.id' = ${row["Account_Name.id"]}`);
    const availableTimeslots = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDateTime);
        date.setDate(date.getDate() + i);
        if (date.getDay() === 0 || date.getDay() === 6)
            continue; // Skip weekends
        const entity = {
            date: date,
            timeslots: [],
        };
        for (const time of [10, 12, 14, 16]) {
            const hasFranciseEvent = franciseEvents.some((event) => {
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
}));
exports.availabilityRouter = router;
