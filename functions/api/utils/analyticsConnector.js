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
exports.getAnalyticsToken = getAnalyticsToken;
exports.getUsersAndGroups = getUsersAndGroups;
const axios_1 = __importDefault(require("axios"));
function getAnalyticsToken(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const { CRM_CLIENT_ID, CRM_CLIENT_SECRET, ANALYTICS_REFRESH_TOKEN } = process.env;
        const connector = app
            .connection({
            Analytics: {
                client_id: CRM_CLIENT_ID,
                client_secret: CRM_CLIENT_SECRET,
                auth_url: "https://accounts.zoho.eu/oauth/v2/token",
                refresh_url: "https://accounts.zoho.eu/oauth/v2/token",
                refresh_token: ANALYTICS_REFRESH_TOKEN,
            },
        })
            .getConnector("Analytics");
        return yield connector.getAccessToken();
    });
}
function getUsersAndGroups(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getAnalyticsToken(app);
        const getData = yield axios_1.default.get("https://analyticsapi.zoho.eu/restapi/v2/workspaces/15465000000005001/views/15465000003609009/data", {
            params: {
                CONFIG: JSON.stringify({
                    responseFormat: "json",
                }),
            },
            headers: {
                Authorization: "Zoho-oauthtoken " + token,
                "ZANALYTICS-ORGID": 20062524842,
            },
        });
        const getUsers = yield axios_1.default.get("https://analyticsapi.zoho.eu/restapi/v2/workspaces/15465000000005001/views/15465000000005016/data", {
            params: {
                CONFIG: JSON.stringify({
                    responseFormat: "json",
                }),
            },
            headers: {
                Authorization: "Zoho-oauthtoken " + token,
                "ZANALYTICS-ORGID": 20062524842,
            },
        });
        return {
            teams: getData === null || getData === void 0 ? void 0 : getData.data.data.map((e) => ({
                name: e["Team Name"],
                users: e["Team Users"].split(","),
            })),
            users: getUsers === null || getUsers === void 0 ? void 0 : getUsers.data.data.map((e) => ({
                ZUID: e["ZUID"],
                id: e["User ID"],
            })),
        };
    });
}
