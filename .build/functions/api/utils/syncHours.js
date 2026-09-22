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
exports.default = default_1;
const analyticsConnector_1 = require("./analyticsConnector");
const crmConnector_1 = require("./crmConnector");
const datastore_1 = require("./datastore");
const helpers_1 = require("./helpers");
const projectConnector_1 = require("./projectConnector");
const query_1 = require("./query");
const syncItems_1 = require("./syncItems");
const getDirectoryEmployeeGroup_1 = require("./getDirectoryEmployeeGroup");
function default_1(app, timelogs) {
    return __awaiter(this, void 0, void 0, function* () {
        // timelogs = timelogs.filter((e) => e.id_string == "9195000005090315");
        var _a;
        let logs = [];
        for (const log of timelogs) {
            if (logs.find((e) => e.entryID == log.id_string)) {
                console.log("Duplicate log found, skipping", log.id_string);
                continue;
            }
            const [month, day, year] = log.entryDate.split("-");
            const formatedDate = year + "-" + month + "-" + day;
            const { owner_name, owner_id, total_minutes, project, bill_status, approval_status, id_string, task, } = log;
            // console.log(id_string);
            const Ilog = {
                timeDelta: total_minutes,
                entryDate: formatedDate,
                owner: owner_name,
                owner_id,
                billStatus: bill_status,
                entryID: id_string,
                project: Object.assign(Object.assign({}, project), { id: undefined }),
                approvalStatus: approval_status,
                task: Object.assign(Object.assign({}, task), { id: undefined }),
            };
            if (Ilog.task.name == null) {
                Ilog.task.name = log.name;
                Ilog.task.id_string = log.name;
            }
            logs.push(Ilog);
        }
        console.log("Getting usergroups");
        const { teams, users } = yield (0, analyticsConnector_1.getUsersAndGroups)(app);
        console.log("Getting teams");
        const CRMteams = yield (0, crmConnector_1.COQLQuery)(app, `select 
                id,Name,Billing_Office.id
                from Teams  
                where Billing_Office.id is not null`);
        let products = yield (0, crmConnector_1.COQLQuery)(app, `select id,Email_Consultant,Product_Name,Invoicing_Code from Products where (Product_Active = true and Producttype = 'Hours') limit 2000`);
        console.log("Getting projectIDS");
        const projectIDS = yield getProjectIDs(app, logs);
        const taskIDS = yield getTaskIDs(app, logs);
        const { FALLBACK_PRODUCT } = process.env;
        for (const log of logs) {
            const task = taskIDS.find((e) => e.taskID == log.task.id_string);
            // console.log({ task });
            log.taskID = task.ROWID;
            delete log.task;
            log.projectID = (_a = projectIDS.find((e) => e.projectsID == log.project.id_string)) === null || _a === void 0 ? void 0 : _a.ROWID;
            delete log.project;
            const product = products.find((e) => e.Invoicing_Code == task.productCode) ||
                products.find((e) => e.Email_Consultant == log.owner) ||
                products.find((e) => e.id == FALLBACK_PRODUCT);
            // console.log(log.owner, product);
            if (product != null) {
                log.product = product.id;
            }
            else {
                log.product = FALLBACK_PRODUCT;
            }
            let team = teams.find((e) => e.users.includes(log.owner_id));
            if (!team && (log.owner_id + "")[0] == "2") {
                const user = users.find((e) => e.ZUID == log.owner_id);
                if (!user) {
                    console.error(log.entryID, "Could not find user!", { log });
                    continue;
                }
                const findTeam = teams.find((e) => e.users.includes(user.id));
                if (findTeam) {
                    team = findTeam;
                }
                else {
                    const getTeamNameFromDirectory = yield (0, getDirectoryEmployeeGroup_1.getDirectoryGroupBasedOnName)(app, log.owner);
                    if ("projectsTeam" in getTeamNameFromDirectory) {
                        team = teams.find((e) => e.Name == getTeamNameFromDirectory.projectsTeam);
                        yield fetch("https://api.synccentral.eu/v1/org/92/webhook/ec11b436-71e6-47ec-a88c-8a54dad77bb2", {
                            body: JSON.stringify({
                                teamName: getTeamNameFromDirectory.projectsTeam,
                                userName: log.owner,
                            }),
                            headers: {
                                "content-type": "application/json",
                            },
                            method: "POST",
                        });
                    }
                }
            }
            if (team != null) {
                const CRMTeam = CRMteams.find((e) => e.Name == team.name);
                if (CRMTeam == null) {
                    console.error(log.entryID, "No CRM team with the name '" + team.name + "'");
                    continue;
                }
                log.delivery = CRMTeam["Billing_Office.id"];
                log.team = CRMTeam.id;
                if (log.delivery == null) {
                    console.error(log.entryID, team.name, "has no delivery/bo office attached");
                }
            }
            else {
                console.error(log.entryID, log.owner + " has no team attached", JSON.stringify({ teams, ownerLog: log.owner_id }, null, 2));
            }
            delete log.owner_id;
            // console.log(products, log.owner, log.product);
        }
        const entriesWithoutDelivery = logs.filter((e) => e.delivery == null);
        if (entriesWithoutDelivery.length > 0) {
            console.error("Entries without delivery office found", {
                entryIDS: entriesWithoutDelivery.map((e) => e.entryID),
            });
        }
        logs = logs.filter((e) => e.delivery != null);
        if (logs.length == 0) {
            console.error("No entries with delivery office found");
            return;
        }
        // console.log({ projectIDS, taskIDS });
        const entryIDS = helpers_1.helpers.array.unique(logs.map((e) => e.entryID));
        let storedLogs = [];
        for (const IDChunk of helpers_1.helpers.array.chunk(entryIDS, 200)) {
            const logsQuery = yield (0, query_1.executeQuery)(app, `select ROWID,billStatus,timeDelta,entryID,owner,product,approvalStatus,entryDate,delivery,invoiceIDDelivery,invoiceIDBilling,invoiceIDTerritory,taskID from timeEntries where entryID in ('${IDChunk.join("','")}')`);
            storedLogs = storedLogs.concat(logsQuery);
        }
        // console.log(storedLogs);
        // console.log({ existingEntryCount: storedLogs.length });
        const nonExistendLogs = logs.filter((log) => storedLogs.find((slog) => slog.entryID == log.entryID) == null &&
            log.billStatus == "Billable");
        // console.log({ nonexistingEntryCount: nonExistendLogs.length });
        const createdIDs = {};
        for (const createChunk of helpers_1.helpers.array.chunk(nonExistendLogs, 200)) {
            const createResult = yield (0, datastore_1.insertRows)(app, createChunk, "timeEntries");
            for (const res of createResult) {
                createdIDs[res.entryID] = res.ROWID;
            }
        }
        // const pids = projectIDS.map((e) => e.ROWID);
        // console.log({ pids, projectIDS });
        // const customerCountries: {
        //     ProjectID: string;
        //     country: string;
        //     billingOffice: string;
        //     territory: string;
        // }[] = [];
        // for (const inArr of helpers.array.chunk(pids, 200)) {
        //     const getCustomerCountries = await executeQuery(
        //         app,
        //         `select
        //         customers.billingCountry,
        //         projects.ROWID,
        //         projects.billingOffice,
        //         projects.territory
        //     from customers
        //     join projects on projects.customerID = customers.ROWID
        //     where projects.ROWID in ('${inArr.join("','")}')`,
        //         false
        //     );
        //     for (const { customers, projects } of getCustomerCountries) {
        //         if (
        //             customerCountries.find((e) => e.ProjectID == projects.ROWID) ==
        //             null
        //         )
        //             customerCountries.push({
        //                 country: customers.billingCountry,
        //                 ProjectID: projects.ROWID,
        //                 billingOffice: projects.billingOffice,
        //                 territory: projects.territory,
        //             });
        //     }
        //     // console.log({ getCustomerCountries });
        // }
        const existingRows = logs.filter((log) => storedLogs.find((slog) => slog.entryID == log.entryID) != null);
        let logUpdates = [], logsToRemoveBasedOnID = [];
        for (const existingRow of existingRows) {
            const storedLog = storedLogs.find((e) => e.entryID == existingRow.entryID);
            const delta = existingRow.timeDelta - (storedLog.timeDelta || 0);
            if (delta == 0 &&
                existingRow.owner == storedLog.owner &&
                existingRow.approvalStatus == storedLog.approvalStatus &&
                existingRow.entryDate == storedLog.entryDate &&
                existingRow.delivery == storedLog.delivery &&
                existingRow.billStatus == storedLog.billStatus &&
                existingRow.taskID == storedLog.taskID &&
                existingRow.product == storedLog.product)
                continue;
            if (existingRow.billStatus != "Billable") {
                if (storedLog.invoiceIDBilling == null &&
                    storedLog.invoiceIDDelivery == null &&
                    storedLog.invoiceIDTerritory == null) {
                    logsToRemoveBasedOnID.push(existingRow.entryID);
                    continue;
                }
            }
            logUpdates.push(Object.assign(Object.assign({}, existingRow), { ROWID: storedLog.ROWID }));
        }
        console.log({
            amountOfUpdates: logUpdates.length,
            amountOfCreates: nonExistendLogs.length,
        });
        const processDeletedTimeEntries = deleteNonBillableTimeEntries(app, logsToRemoveBasedOnID);
        for (const updateChunk of helpers_1.helpers.array.chunk(logUpdates, 200)) {
            yield (0, datastore_1.updateRows)(app, updateChunk, "timeEntries");
        }
        yield processDeletedTimeEntries;
        console.log("Done");
    });
}
function deleteNonBillableTimeEntries(app, logsToRemoveBasedOnID) {
    return __awaiter(this, void 0, void 0, function* () {
        if (logsToRemoveBasedOnID.length == 0)
            return;
        const promises = [];
        console.log("Deleting entries with entryids: ", logsToRemoveBasedOnID);
        for (const entryIDs of helpers_1.helpers.array.chunk(logsToRemoveBasedOnID, 50)) {
            promises.push((0, query_1.executeQuery)(app, "delete from timeEntries where entryID in ('" +
                entryIDs.join("','") +
                "')"));
            promises.push((0, crmConnector_1.COQLQuery)(app, `select id from Hours where EntryID in ('${entryIDs.join("','")}')`).then((e) => __awaiter(this, void 0, void 0, function* () {
                yield (0, crmConnector_1.deleteItems)(app, "Hours", e.map((e) => e.id));
            })));
        }
        yield Promise.all(promises);
    });
}
function getProjectIDs(app, logs) {
    return __awaiter(this, void 0, void 0, function* () {
        const projects = helpers_1.helpers.array.dedupeByField(logs.map((e) => e.project).filter((e) => e != null), "id_string");
        // console.log(logs[0]);
        const projectIDS = projects.map((e) => e.id_string);
        let storedProjects = [];
        for (const IDChunk of helpers_1.helpers.array.chunk(projectIDS, 200)) {
            const projectQuery = yield (0, query_1.executeQuery)(app, `select ROWID, projectsID from projects where projectsID in ('${IDChunk.join("','")}')`);
            storedProjects = storedProjects.concat(projectQuery);
        }
        const projectsToCreate = projects.filter((project) => storedProjects.find((e) => e.projectsID == project.id_string) == null);
        for (const project of projectsToCreate) {
            console.log({ project });
            const up = yield (0, projectConnector_1.upsertProject)(app, project.id_string);
            storedProjects.push(up.upsert);
        }
        if (projectIDS.length != storedProjects.length) {
            throw new Error("Not all projects are created!");
        }
        return storedProjects;
    });
}
function getTaskIDs(app, logs) {
    return __awaiter(this, void 0, void 0, function* () {
        const tasks = helpers_1.helpers.array.dedupeByField(logs
            .map((e) => (Object.assign(Object.assign({}, e.task), { projectID: e.project.id_string })))
            .filter((e) => e != null), "id_string");
        const taskIDS = tasks.map((e) => e.id_string);
        let storedTasks = [];
        for (const IDChunk of helpers_1.helpers.array.chunk(taskIDS, 200)) {
            const taskQuery = yield (0, query_1.executeQuery)(app, `select * from tasks where taskID in ('${IDChunk.join("','")}')`);
            storedTasks = storedTasks.concat(taskQuery);
        }
        const tasksToCreate = tasks.filter((task) => storedTasks.find((e) => e.taskID == task.id_string) == null);
        for (const task of tasksToCreate) {
            const syncedTask = yield (0, syncItems_1.syncTask)(app, task.projectID, task.id_string);
            // console.log(syncedTask, task);
            storedTasks.push(syncedTask);
        }
        if (taskIDS.length != storedTasks.length) {
            throw new Error("Not all tasks are created!");
        }
        return storedTasks;
    });
}
