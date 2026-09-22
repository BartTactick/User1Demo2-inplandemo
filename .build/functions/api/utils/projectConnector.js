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
exports.getProjectsToken = getProjectsToken;
exports.getModifiedTask = getModifiedTask;
exports.getTaskActivities = getTaskActivities;
exports.getProject = getProject;
exports.getOrCreateProject = getOrCreateProject;
exports.getUsers = getUsers;
exports.getModifiedTimeSheet = getModifiedTimeSheet;
exports.getProjectsTimeSheet = getProjectsTimeSheet;
exports.upsertProject = upsertProject;
const axios_1 = __importDefault(require("axios"));
const datastore_1 = require("./datastore");
const query_1 = require("./query");
const crmConnector_1 = require("./crmConnector");
const helpers_1 = require("./helpers");
const customersHelper_1 = require("./customersHelper");
const syncItems_1 = require("./syncItems");
function getProjectsToken(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const { PROJECTS_CLIENT_ID, PROJECTS_CLIENT_SECRET, PROJECTS_REFRESH_TOKEN } = process.env;
        const connector = app
            .connection({
            Projects: {
                client_id: PROJECTS_CLIENT_ID,
                client_secret: PROJECTS_CLIENT_SECRET,
                auth_url: "https://accounts.zoho.eu/oauth/v2/token",
                refresh_url: "https://accounts.zoho.eu/oauth/v2/token",
                refresh_token: PROJECTS_REFRESH_TOKEN,
            },
        })
            .getConnector("Projects");
        return yield connector.getAccessToken();
    });
}
function getModifiedTask(app, projectID, taskID) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getProjectsToken(app);
        const { PROJECT_TIMESHEET_URL } = process.env;
        const getTask = yield axios_1.default.get(PROJECT_TIMESHEET_URL +
            `/restapi/portal/20060094459/projects/${projectID}/tasks/${taskID}/`, {
            headers: {
                Authorization: "Zoho-oauthtoken " + token,
            },
        });
        return (_a = getTask.data) === null || _a === void 0 ? void 0 : _a.tasks[0];
    });
}
function getTaskActivities(app, projectID, taskID) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = yield getProjectsToken(app);
        const { PROJECT_TIMESHEET_URL } = process.env;
        const getTask = yield axios_1.default.get(PROJECT_TIMESHEET_URL +
            `/restapi/portal/20060094459/projects/${projectID}/tasks/${taskID}/activities/`, {
            headers: {
                Authorization: "Zoho-oauthtoken " + token,
            },
        });
        return (_a = getTask.data) === null || _a === void 0 ? void 0 : _a.activities;
    });
}
function getProject(app, projectID) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getProjectsToken(app);
        const { PROJECT_TIMESHEET_URL } = process.env;
        const getProject = yield axios_1.default
            .get(PROJECT_TIMESHEET_URL + "/restapi/portal/itq/projects/" + projectID + "/", {
            headers: {
                Authorization: "Zoho-oauthtoken " + token,
            },
        })
            .catch((e) => {
            var _a, _b, _c;
            console.error(((_b = (_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || ((_c = e === null || e === void 0 ? void 0 : e.response) === null || _c === void 0 ? void 0 : _c.data) || (e === null || e === void 0 ? void 0 : e.response) || e, projectID);
            return { data: { projects: [] } };
        });
        return getProject.data.projects[0];
    });
}
function getOrCreateProject(app, projectID) {
    return __awaiter(this, void 0, void 0, function* () {
        const getStoredProject = yield (0, query_1.executeQuery)(app, "select * from projects where projectsID = '" + projectID + "'");
        if (getStoredProject.length == 0) {
            return (yield upsertProject(app, projectID)).upsert;
        }
        return getStoredProject[0];
    });
}
function getUsers(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield getProjectsToken(app);
        const getUsers = yield axios_1.default.get(`https://crmplus.zoho.eu/portal/api/v3/portal/20060094459/users?type=1&view_type=1&sort=alphabetical%3Aasc&per_page=200&page=1`, {
            headers: {
                Authorization: "Zoho-oauthtoken " + token,
            },
        });
        return getUsers.data.users;
    });
}
function getModifiedTimeSheet(app, date) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { PROJECT_TIMESHEET_URL } = process.env;
        let timelogs = [];
        let timeAgo = new Date();
        // // only timeentries after this timestamp are allowed
        timeAgo.setMinutes(timeAgo.getMinutes() - 15);
        // timeAgo.setMinutes(timeAgo.getMinutes() - 120);
        if (date != null) {
            timeAgo = new Date(date);
            timeAgo.setHours(0, 0, 0, 0);
        }
        let page = 1;
        while (true) {
            const token = yield getProjectsToken(app);
            const getTimeSheet = yield axios_1.default.get(PROJECT_TIMESHEET_URL + "/restapi/portal/20060094459/logs", {
                params: {
                    users_list: "all",
                    view_type: "day",
                    date: helpers_1.helpers.date.formatProjectsDate(timeAgo),
                    bill_status: "All",
                    component_type: "task",
                    fetch_by_modifiedtime: true,
                    index: (page - 1) * 100,
                    range: 100,
                },
                headers: {
                    Authorization: "Zoho-oauthtoken " + token,
                },
            });
            page++;
            // console.log(getTimeSheet.data);
            const foundTime = (((_b = (_a = getTimeSheet === null || getTimeSheet === void 0 ? void 0 : getTimeSheet.data) === null || _a === void 0 ? void 0 : _a.timelogs) === null || _b === void 0 ? void 0 : _b.date) || [])
                .map((e) => e.tasklogs.map((l) => (Object.assign({ entryDate: e.date }, l))))
                .flat(1);
            timelogs = timelogs.concat(foundTime);
            console.log(foundTime.length, timelogs.length);
            if (foundTime.length != 100) {
                break;
            }
        }
        console.log("Found", timelogs.length, "logs");
        timelogs = timelogs.filter((e, i) => {
            if (new Date(e.last_modified_time_long) < timeAgo) {
                return false;
            }
            if (timelogs.findIndex((ot) => ot.id_string == e.id_string) == i)
                return true;
            return false;
        });
        console.log("Processing ", timelogs.length, "logs");
        return { timelogs };
    });
}
function getProjectsTimeSheet(app, projectID, startDate) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log({ startDate });
        const token = yield getProjectsToken(app);
        const { PROJECT_TIMESHEET_URL } = process.env;
        let timelogs = [];
        const now = new Date();
        now.setMonth(now.getMonth() + 2, 1);
        now.setDate(-1);
        console.log({ now });
        startDate = "01-01-2024";
        let promises = [];
        let start_date = new Date(2024, //year
        1, //month
        1, //day
        12, 0, 0, 0);
        while (start_date < now) {
            console.log({ getting: start_date });
            const end = new Date(start_date.getTime());
            end.setMonth(end.getMonth() + 5);
            promises.push(getTimeEntries(new Date(start_date.getTime()), new Date(end.getTime())));
            start_date = new Date(end.getTime());
        }
        yield Promise.all(promises);
        function getTimeEntries(startDate, end_date) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                startDate = startDate.toISOString().split("T")[0].split("-");
                startDate = [startDate[1], startDate[2], startDate[0]].join("-");
                end_date = end_date.toISOString().split("T")[0].split("-");
                end_date = [end_date[1], end_date[2], end_date[0]].join("-");
                let page = 1;
                while (true) {
                    const getTimeSheet = yield axios_1.default
                        .get(PROJECT_TIMESHEET_URL +
                        "/restapi/portal/20060094459/projects/" +
                        projectID +
                        "/logs/", {
                        params: {
                            users_list: "all",
                            view_type: "custom_date",
                            bill_status: "All",
                            component_type: "task",
                            index: (page - 1) * 100,
                            range: 100,
                            custom_date: JSON.stringify({
                                start_date: startDate,
                                end_date,
                            }),
                            date: startDate,
                        },
                        headers: {
                            Authorization: "Zoho-oauthtoken " + token,
                        },
                    })
                        .catch((e) => {
                        var _a;
                        console.error(((_a = e.response) === null || _a === void 0 ? void 0 : _a.data) || e.data || e.response, e);
                        console.error("Payload:", {
                            users_list: "all",
                            view_type: "custom_date",
                            bill_status: "All",
                            component_type: "task",
                            index: (page - 1) * 100,
                            range: 100,
                            custom_date: JSON.stringify({
                                start_date: startDate,
                                end_date,
                            }),
                            date: startDate,
                        });
                    });
                    page++;
                    // console.log({ getTimeSheet });
                    const foundTime = (((_b = (_a = getTimeSheet === null || getTimeSheet === void 0 ? void 0 : getTimeSheet.data) === null || _a === void 0 ? void 0 : _a.timelogs) === null || _b === void 0 ? void 0 : _b.date) || [])
                        .map((e) => e.tasklogs.map((l) => (Object.assign({ entryDate: e.date }, l))))
                        .flat(1);
                    // console.log({
                    //     totalGot: foundTime.length,
                    //     tll: timelogs.length,
                    //     startDate,
                    //     end_date,
                    // });
                    timelogs = timelogs.concat(foundTime);
                    // console.log(foundTime.length, timelogs.length);
                    if (foundTime.length != 100) {
                        break;
                    }
                }
            });
        }
        return { timelogs };
    });
}
function upsertProject(app, projectID, CRMID) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        let crmProject = (yield (0, crmConnector_1.COQLQuery)(app, `select id,Deal_Name,Projectnummer_NEW,Modified_Time,Modified_By.first_name,Modified_By.last_name,FinanceChecked,Check_Date,ProjectsId,Facturatie_klant_Naam.id,Account_Name.id, BillingOffice, ITQ_Territory, Referentie_voor_op_factuur  from Deals where ` +
            (projectID != null ? `ProjectsId = ` + projectID : "id = " + CRMID)))[0] || {};
        if (projectID == null && crmProject.ProjectsId != null)
            projectID = crmProject.ProjectsId;
        const getLiveProject = projectID == null ? {} : (yield getProject(app, projectID)) || {};
        if (Object.keys(crmProject).length == 0 &&
            Object.keys(getLiveProject).length > 0) {
            const customField = getLiveProject.custom_fields.find((e) => "OrderID" in e);
            console.log({ customField });
            if (customField != null) {
                const quote = yield (0, crmConnector_1.getItemByID)(app, "ITQ_Quotes", customField.OrderID);
                if (quote.length > 0) {
                    CRMID = (_a = quote[0].Opportunity) === null || _a === void 0 ? void 0 : _a.id;
                    if (CRMID != null) {
                        crmProject =
                            (yield (0, crmConnector_1.COQLQuery)(app, `select id,Deal_Name,Projectnummer_NEW,Modified_Time,Modified_By.first_name,Modified_By.last_name,FinanceChecked,Check_Date,ProjectsId,Facturatie_klant_Naam.id,Account_Name.id, BillingOffice, ITQ_Territory, Referentie_voor_op_factuur  from Deals where ` +
                                "id = " +
                                CRMID))[0] || {};
                    }
                }
            }
        }
        const data = {
            projectsID: projectID,
            name: getLiveProject.name || crmProject.Deal_Name,
            territory: (_b = crmProject.ITQ_Territory) === null || _b === void 0 ? void 0 : _b.id,
            billingOffice: (_c = crmProject.BillingOffice) === null || _c === void 0 ? void 0 : _c.id,
            invoiceReference: crmProject.Referentie_voor_op_factuur,
            potentialID: crmProject.id,
            invoiceVia: crmProject["Facturatie_klant_Naam.id"] || crmProject["Account_Name.id"],
            customerID: crmProject["Account_Name.id"],
            financeChecked: crmProject.FinanceChecked,
            checkDate: crmProject.Check_Date,
            ordernumber: crmProject.Projectnummer_NEW,
            projectsStatus: getLiveProject.custom_status_name,
        };
        if (data.customerID != null) {
            data.customerID = yield (0, customersHelper_1.getCustomerROWID)(app, data.customerID);
        }
        if (data.invoiceVia != null) {
            data.invoiceVia = yield (0, customersHelper_1.getCustomerROWID)(app, data.invoiceVia);
        }
        const getStoredProject = yield (0, query_1.executeQuery)(app, "select * from projects where projectsID = '" +
            projectID +
            "'" +
            (crmProject.id != null
                ? " OR potentialID = '" + crmProject.id + "'"
                : ""));
        // console.log({ getStoredProject });
        let response;
        if (getStoredProject.length == 0) {
            // console.log({ getLiveProject });
            const insert = yield (0, datastore_1.insertRows)(app, [data], "projects");
            // console.log(insert);
            response = {
                upsert: insert[0],
                accountID: data.customerID,
            };
        }
        else {
            // if (getStoredProject.length == 2) {
            //     const withProjectsID = getStoredProject.find(
            //         (e) => e.projectsID != null && e.potentialID == null
            //     );
            //     const withPotentialID = getStoredProject.find(
            //         (e) => e.potentialID != null && e.projectsID == null
            //     );
            //     if (withProjectsID != null && withPotentialID != null) {
            //         const getCharges = await executeGETALLQuery(
            //             app,
            //             `select ROWID from charges where project = '${withPotentialID.ROWID}'`
            //         );
            //         console.log(
            //             "Dedupe charges:",
            //             getCharges.map((e) => ({
            //                 ROWID: e.charges.ROWID,
            //                 project: withProjectsID.ROWID,
            //             }))
            //         );
            //         const promises = [];
            //         if (getCharges.length > 0)
            //             promises.push(
            //                 updateRows(
            //                     app,
            //                     getCharges.map((e) => ({
            //                         ROWID: e.charges.ROWID,
            //                         project: withProjectsID.ROWID,
            //                     })),
            //                     "charges"
            //                 )
            //             );
            //         const getServices = await executeGETALLQuery(
            //             app,
            //             `select ROWID from services where project = '${withPotentialID.ROWID}'`
            //         );
            //         console.log(
            //             "Dedupe services:",
            //             getServices.map((e) => ({
            //                 ROWID: e.charges.ROWID,
            //                 project: withProjectsID.ROWID,
            //             }))
            //         );
            //         if (getCharges.length > 0)
            //             promises.push(
            //                 updateRows(
            //                     app,
            //                     getServices.map((e) => ({
            //                         ROWID: e.services.ROWID,
            //                         project: withProjectsID.ROWID,
            //                     })),
            //                     "services"
            //                 )
            //             );
            //         await Promise.all(promises);
            //         await deleteRow(app,withPotentialID.ROWID,"projects")
            //     }
            // }
            const storedProject = getStoredProject[0];
            const update = yield (0, datastore_1.updateRows)(app, [
                Object.assign(Object.assign({}, data), { ROWID: storedProject.ROWID }),
            ], "projects");
            const checkKeys = [
                "projectsStatus",
                "territory",
                "billingOffice",
                "invoiceReference",
                "invoiceVia",
            ];
            let owner = getLiveProject.updated_by || "Onbekend";
            if (new Date(getLiveProject.updated_date_long) <
                new Date(crmProject.Modified_Time)) {
                owner =
                    [
                        crmProject["Modified_By.first_name"],
                        crmProject["Modified_By.last_name"],
                    ]
                        .filter(Boolean)
                        .join(" ") || "Onbekend";
            }
            const projectModifications = (0, syncItems_1.makeModifications)(app, storedProject.ROWID, "projects", storedProject.ROWID);
            const potentialModifications = (0, syncItems_1.makeModifications)(app, storedProject.ROWID, "potential", storedProject.ROWID);
            for (const key of checkKeys)
                if (storedProject[key] != data[key]) {
                    (key == "projectsStatus"
                        ? projectModifications
                        : potentialModifications).add(key, data[key], storedProject[key], owner);
                }
            yield potentialModifications.process();
            yield projectModifications.process();
            response = {
                upsert: update[0],
                accountID: data.customerID,
            };
        }
        return response;
    });
}
