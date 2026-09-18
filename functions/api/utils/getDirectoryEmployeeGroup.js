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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirectoryToken = getDirectoryToken;
exports.getDirectoryGroupBasedOnName = getDirectoryGroupBasedOnName;
function getDirectoryToken(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const { CRM_CLIENT_ID, CRM_CLIENT_SECRET, DIRECTORY_REFRESH_TOKEN } = process.env;
        const connector = app
            .connection({
            Directory: {
                client_id: CRM_CLIENT_ID,
                client_secret: CRM_CLIENT_SECRET,
                auth_url: "https://accounts.zoho.eu/oauth/v2/token",
                refresh_url: "https://accounts.zoho.eu/oauth/v2/token",
                refresh_token: DIRECTORY_REFRESH_TOKEN,
            },
        })
            .getConnector("Directory");
        return yield connector.getAccessToken();
    });
}
// Directory -> Projects
const teamMapping = {
    "AMS Managed Services NL": "Team MSP AMS NL",
    "Automaiton Managed Services NL": "Team MSP Automation NL",
    "CNA Consultancy BE": "Belgium",
    "CNA Consultancy DE": "Team Germany",
    "CNA Consultancy FR": "Team France",
    "CNA Consultancy LU": "Team Lux",
    "CNA Consultancy NL": "CNA",
    "CTO Office": "CTO Office",
    "Delivery Managed Services NL": "Team MSP Service & Delivery NL",
    "Digital Workspace Managed Services NL": "Team MSP Digital Workspace",
    "Enterprise Sales NL": "Sales",
    "EUC Consultancy BE": "Belgium",
    "EUC Consultancy LU": "Team Lux",
    "EUC Consultancy NL": "EUC",
    "Hybrid Cloud Managed Services NL": "Team MSP Hybrid Cloud NL",
    "Inside Sales LU": "Team Lux",
    "Inside Sales NL": "Sales",
    "ITTS Consultancy FR": "Team France",
    "ITTS Consultancy NL": "ITTS",
    "Managed Services Healthcare": "Belgium",
    Marketing: "Marketing",
    "Sales BE": "Belgium",
    "Sales DE": "Sales",
    "Sales FR": "Sales",
    "Sales Healthcare NL": "Sales",
    "Sales NL": "Sales",
    "Sales Support NL": "Sales",
    "SDDC Consultancy BE": "Belgium",
    "SDDC Consultancy DE": "Team Germany",
    "SDDC Consultancy FR": "Team France",
    "SDDC Consultancy LU": "Team Lux",
    "SDDC Consultancy NL": "SDDC",
    "Security Managed Services NL": "Team MSP Security NL",
    "Support Manageg Services NL": "Team MSP Support NL",
};
const mappingCache = {};
function getDirectoryGroupBasedOnName(app, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const searchParameters = new URLSearchParams();
        // sort=first_name&fields=first_name%2Clast_name%2Cuser_status%2Cuser_type%2Cis_light_user%2Cuser_role&page=1&per_page=100
        searchParameters.append("include", "emails,user.departmentinfo");
        searchParameters.append("filter_advanced", "false");
        searchParameters.append("filter_status", "active");
        searchParameters.append("sort", "first_name");
        searchParameters.append("fields", "first_name,last_name,user_status,user_type,is_light_user,user_role");
        searchParameters.append("per_page", "100");
        if (mappingCache[name]) {
            return mappingCache[name];
        }
        function fetchPage() {
            return __awaiter(this, arguments, void 0, function* (page = 1) {
                searchParameters.set("page", page + "");
                const users = yield fetch("https://directory.zoho.eu/api/v1/orgs/20071740848/allusers?" +
                    searchParameters.toString(), {
                    headers: {
                        authorization: "Bearer " + (yield getDirectoryToken(app)),
                    },
                    method: "GET",
                })
                    .then((e) => e.json())
                    .then((e) => {
                    const users = e.allusers || [];
                    return users.map((user) => { var _a; return ({
                        departmentName: (_a = user === null || user === void 0 ? void 0 : user.department_info) === null || _a === void 0 ? void 0 : _a.group_name,
                        name: user.first_name + " " + user.last_name,
                    }); });
                });
                if (users.length == 100) {
                    return [...users, ...(yield fetchPage(page + 1))];
                }
                return users;
            });
        }
        for (const { departmentName, name } of yield fetchPage()) {
            if (!departmentName) {
                mappingCache[name] = {
                    error: true,
                    msg: "User not found or department is empty!",
                };
                continue;
            }
            if (!teamMapping[departmentName]) {
                mappingCache[name] = {
                    error: true,
                    msg: departmentName + " not found in teammapping!",
                };
                continue;
            }
            mappingCache[name] = { projectsTeam: teamMapping[departmentName] };
        }
        return mappingCache[name];
    });
}
