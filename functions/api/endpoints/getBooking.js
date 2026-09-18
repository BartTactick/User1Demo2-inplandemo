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
exports.bookingRouter = void 0;
const express_1 = __importDefault(require("express"));
const zcatalyst_sdk_node_1 = __importDefault(require("zcatalyst-sdk-node"));
const crmConnector_1 = require("../utils/crmConnector");
const router = express_1.default.Router();
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const app = zcatalyst_sdk_node_1.default.initialize(req);
    const getPAT = yield (0, crmConnector_1.COQLQuery)(app, `
    select 
      Contact_Name.Last_Name,Contact_Name.First_Name,
      Contact_Name.Email,Contact_Name.Phone,
      Contact_Name.Mailing_City,Contact_Name.Mailing_Zip,
      Contact_Name.Mailing_Street,
      Account_Name.Account_Name,
      Soort_aanvrag
    from Deals where id = ${req.params.id}`);
    const [row] = getPAT;
    if (!row)
        return res.status(404).json({ error: "Details not found" });
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
}));
exports.bookingRouter = router;
