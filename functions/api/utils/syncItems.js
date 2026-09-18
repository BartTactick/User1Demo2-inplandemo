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
exports.syncCharge = syncCharge;
exports.syncService = syncService;
exports.getProjectIDByPotentialID = getProjectIDByPotentialID;
exports.syncTask = syncTask;
exports.syncMutation = syncMutation;
exports.makeModifications = makeModifications;
const recordMapping_1 = require("./recordMapping");
const crmConnector_1 = require("./crmConnector");
const helpers_1 = require("./helpers");
const projectConnector_1 = require("./projectConnector");
const datastore_1 = require("./datastore");
const customersHelper_1 = require("./customersHelper");
const query_1 = require("./query");
const getLedgerVAT_1 = require("./getLedgerVAT");
function syncCharge(app, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const mapping = recordMapping_1.recordMapping.charge;
        let getRecord = yield (0, crmConnector_1.getItemByID)(app, "Charges", id);
        if (getRecord.length == 0) {
            return {};
        }
        getRecord = getRecord[0];
        const insertRecord = {};
        for (const key in mapping) {
            insertRecord[key] =
                helpers_1.helpers.object.deepFind(getRecord, mapping[key]) || null;
        }
        if (insertRecord.discount == null)
            insertRecord.discount = 0;
        if (insertRecord.totalExVat == null)
            insertRecord.totalExVat = 0;
        if (insertRecord.listPrice == null)
            insertRecord.listPrice = 0;
        let getCustomer = true;
        if (insertRecord.project != null) {
            const project = (yield getProjectIDByPotentialID(app, insertRecord.project));
            console.log(project);
            insertRecord.project = project.ROWID;
            if (insertRecord.customer != null) {
                insertRecord.customer = project.customerID;
                getCustomer = false;
            }
        }
        const customerID = insertRecord.customer;
        if (insertRecord.customer != null && getCustomer) {
            const id = yield (0, customersHelper_1.getCustomerROWID)(app, customerID);
            insertRecord.customer = id;
        }
        if (customerID == insertRecord.invoiceVia ||
            insertRecord.invoiceVia == null) {
            insertRecord.invoiceVia = insertRecord.customer;
        }
        else {
            const id = yield (0, customersHelper_1.getCustomerROWID)(app, insertRecord.invoiceVia);
            insertRecord.invoiceVia = id;
        }
        if (getRecord.Delivery_Invoicing == "Not Applicable")
            insertRecord.invoiceIDDelivery = "-1";
        if (getRecord.Territory_Invoicing == "Not Applicable")
            insertRecord.invoiceIDTerritory = "-1";
        if (insertRecord.invoiceIDDelivery == null &&
            (getRecord.invoicedOnDel || "").length > 4) {
            insertRecord.invoiceIDDelivery = "-1";
        }
        if (insertRecord.invoiceIDTerritory == null &&
            (getRecord.invoicedOnTer || "").length > 4) {
            insertRecord.invoiceIDTerritory = "-1";
        }
        if (getRecord.Status == "Invoiced" && insertRecord.invoiceIDBilling == null) {
            insertRecord.invoiceIDBilling = "-1";
        }
        const search = yield (0, query_1.executeQuery)(app, "select * from charges where CRMID = " + id + " limit 1");
        const receiver = yield (0, crmConnector_1.COQLQuery)(app, `select Country_for_Billing,id from Accounts where id = '${getRecord.Organisation.id}'`);
        const customerCountry = receiver[0].Country_for_Billing;
        const LedgerCodes = yield (0, crmConnector_1.COQLQueryAll)(app, `select id,
                    Billing_Office,
                    Billing_To,
                    Product_Type,
                    Product_Property,
                    VAT,
                    Ledger_Invoice_Debet,
                    Ledger_Invoice_Credit,
                    VAT_Code
                from Ledger_Codes
                where Product_Type = 'Charges' and Billing_Office.id is not null`).then((e) => e.map((e) => (Object.assign(Object.assign({}, e), { Product_Type: e.Product_Type }))));
        const product = yield (0, crmConnector_1.getItemByID)(app, "Products", insertRecord.charge);
        // console.log({ product });
        const billingOffices = yield (0, crmConnector_1.COQLQueryAll)(app, `select Organisation.id,Organisation.Country_for_Billing,id from Billing_Offices where Organisation.id is not null`);
        const BOInfoEntries = [];
        for (const BO of ["B", "D", "T"]) {
            let BOID = insertRecord[BO == "B" ? "billingOffice" : BO == "T" ? "territory" : "delivery"];
            if (BOID == undefined || BOID.length == 0)
                continue;
            const BOINFO = billingOffices.find((e) => e.id == BOID);
            if (BOINFO == null)
                continue;
            let receiverCountry = customerCountry;
            if (BO != "D") {
                let BOID = insertRecord[BO == "D" ? "territory" : "billingOffice"];
                if (BOID == null)
                    continue;
                const BOINFO = billingOffices.find((e) => e.id == BOID);
                if (BOINFO == null)
                    continue;
                receiverCountry = BOINFO["Organisation.Country_for_Billing"];
            }
            const get = (0, getLedgerVAT_1.getLedgerAndVat)(BO, BOINFO["Organisation.Country_for_Billing"], receiverCountry, Object.assign(Object.assign({}, insertRecord), { charge: product[0] }), LedgerCodes);
            BOInfoEntries.push({
                ledgerCode: get.id,
                type: BO,
                officeID: BOINFO.id,
                officeOrgID: BOINFO["Organisation.id"],
            });
        }
        if (search.length == 0) {
            // console.log("Inserting...");
            const insert = yield (0, datastore_1.insertRows)(app, [insertRecord], "charges");
            return insert[0];
        }
        else {
            const { ROWID } = search[0];
            const update = yield (0, datastore_1.updateRows)(app, [
                Object.assign(Object.assign({}, insertRecord), { ROWID: ROWID }),
            ], "charges");
            return update[0];
        }
    });
}
function syncService(app, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const mapping = recordMapping_1.recordMapping.service;
        let getRecord = yield (0, crmConnector_1.getItemByID)(app, "Services", id);
        // console.log({ getRecord });
        if (getRecord.length == 0) {
            return {};
        }
        getRecord = getRecord[0];
        const insertRecord = {};
        for (const key in mapping) {
            insertRecord[key] =
                helpers_1.helpers.object.deepFind(getRecord, mapping[key]) || null;
        }
        // console.log(insertRecord);
        if (insertRecord.discount == null)
            insertRecord.discount = 0;
        if (insertRecord.totalExVat == null)
            insertRecord.totalExVat = 0;
        if (insertRecord.listPrice == null)
            insertRecord.listPrice = 0;
        if (insertRecord.quantity == null)
            insertRecord.quantity = 0;
        // console.log(insertRecord);
        let getCustomer = true;
        if (insertRecord.project != null) {
            const project = (yield getProjectIDByPotentialID(app, insertRecord.project));
            // console.log({ project });
            insertRecord.project = project.ROWID;
            if (project.customerID != null) {
                insertRecord.customer = project.customerID;
                getCustomer = false;
            }
        }
        const customerID = insertRecord.customer;
        if (insertRecord.customer != null && getCustomer) {
            const id = yield (0, customersHelper_1.getCustomerROWID)(app, customerID);
            insertRecord.customer = id;
        }
        if (customerID == insertRecord.invoiceVia ||
            insertRecord.invoiceVia == null) {
            insertRecord.invoiceVia = insertRecord.customer;
        }
        else {
            const id = yield (0, customersHelper_1.getCustomerROWID)(app, insertRecord.invoiceVia);
            insertRecord.invoiceVia = id;
        }
        const search = yield (0, query_1.executeQuery)(app, "select ROWID from services where CRMID = " + id + " limit 1");
        // const product = await getItemByID(app, "Products", insertRecord.product!);
        if (search.length == 0) {
            const insert = yield (0, datastore_1.insertRows)(app, [insertRecord], "services");
            return insert[0];
        }
        else {
            const update = yield (0, datastore_1.updateRows)(app, [
                Object.assign(Object.assign({}, insertRecord), { ROWID: search[0].ROWID }),
            ], "services");
            return update[0];
        }
    });
}
function getProjectIDByPotentialID(app, potentialID) {
    return __awaiter(this, void 0, void 0, function* () {
        let getPotential = yield (0, crmConnector_1.getItemByID)(app, "Deals", potentialID);
        // console.log({ getPotential });
        if (getPotential.length == 0) {
            return {};
        }
        const potential = getPotential[0];
        // console.log({ potential });
        if (potential.ProjectsId == null) {
            const getStoredProject = yield (0, query_1.executeQuery)(app, "select * from projects where potentialID	 = '" + potentialID + "'");
            if (getStoredProject.length == 0) {
                return (yield (0, projectConnector_1.upsertProject)(app, undefined, potentialID)).upsert;
            }
            return getStoredProject[0];
        }
        return (0, projectConnector_1.getOrCreateProject)(app, potential.ProjectsId);
    });
}
function syncTask(app, projectID, taskID) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // console.log({ projectID, taskID });
        const task = yield (0, projectConnector_1.getModifiedTask)(app, projectID, taskID).catch((e) => null);
        if (task == null) {
            return {
                error: true,
                msg: "Task not found!",
            };
        }
        let invoiceAgreement = task.custom_fields.find((e) => e.label_name == "Invoice Agreement");
        const project = yield (0, projectConnector_1.getOrCreateProject)(app, projectID);
        let projectCatalystID = project.ROWID;
        const taskSearch = yield (0, query_1.executeQuery)(app, "select * from tasks where taskID = '" + taskID + "'");
        // console.log({ taskSearch });
        //   console.log({ cf: task.custom_fields });
        let pricePerHour = task.custom_fields.find((e) => e.label_name == "Uurtarief");
        //   console.log({ task });
        if (pricePerHour != null) {
            pricePerHour = parseFloat(pricePerHour.value.replace(",", ""));
        }
        else {
            pricePerHour = 0;
        }
        let internalTariff = task.custom_fields.find((e) => e.label_name == "Internal Tariff");
        if (internalTariff != null) {
            internalTariff = parseFloat(internalTariff.value);
        }
        else {
            internalTariff = 0;
        }
        let productCode = task.custom_fields.find((e) => e.label_name == "Invoice Product Code");
        let totalHourBudget = 0;
        if (task.work && task.work.includes(":")) {
            const [hoursStr, minutesStr] = task.work.split(":");
            const hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);
            totalHourBudget = parseFloat((hours + minutes / 60).toFixed(2));
        }
        // console.log({ totalHourBudget, task: task.work });
        const taskObj = {
            pricePerHour,
            internalTariff,
            name: task.name,
            invoiceAgreement: (invoiceAgreement === null || invoiceAgreement === void 0 ? void 0 : invoiceAgreement.value) || "On Subsequent Calculation",
            hourBudget: totalHourBudget,
            productCode: productCode === null || productCode === void 0 ? void 0 : productCode.value,
            projectID: projectCatalystID,
            invoiceDescription: ((_a = task.custom_fields.find((e) => e.label_name == "Invoice Description")) === null || _a === void 0 ? void 0 : _a.value) || "",
            taskID: taskID,
        };
        if (taskSearch.length > 0) {
            const savedTask = taskSearch[0];
            const { ROWID } = savedTask;
            yield saveTaskModifications(app, taskObj, savedTask, taskID, projectID);
            const update = yield (0, datastore_1.updateRows)(app, [Object.assign(Object.assign({}, taskObj), { ROWID })], "tasks");
            // console.log({ update });
            return update[0];
        }
        else {
            yield saveTaskModifications(app, taskObj, taskObj, taskID, projectID);
            const create = yield (0, datastore_1.insertRows)(app, [taskObj], "tasks");
            // console.log({ create });
            return create[0];
        }
    });
}
function saveTaskModifications(app, task, savedTask, taskID, projectID) {
    return __awaiter(this, void 0, void 0, function* () {
        const getLastMod = yield (0, projectConnector_1.getTaskActivities)(app, projectID, taskID);
        // console.log(getLastMod);
        let modifiedBy = "unknown";
        if ((getLastMod || []).length > 1) {
            // console.error("Could not get task activities:", { projectID, taskID });
            modifiedBy = getLastMod[0].activity_by;
        }
        const taskSearch = yield (0, query_1.executeQuery)(app, "select * from modifications where module = 'tasks' and entityID = '" +
            taskID +
            "' limit 1");
        const checkKeys = [
            "internalTariff",
            "pricePerHour",
            "invoiceAgreement",
            "productCode",
            "hourBudget",
        ];
        const modifications = makeModifications(app, task.projectID, "tasks", taskID);
        if (taskSearch.length == 0) {
            for (const key of checkKeys) {
                if (task[key] != null)
                    modifications.add(key, task[key], task[key], modifiedBy, true);
            }
        }
        else {
            for (const key of checkKeys) {
                if (task[key] != savedTask[key]) {
                    modifications.add(key, task[key], savedTask[key], modifiedBy);
                }
            }
        }
        if (modifications.hasModification("hourBudget")) {
            // console.log({ totalProject, savedTask, task });
            let diff = parseFloat(task.hourBudget || "0") -
                parseFloat(savedTask.hourBudget || "0");
            if (diff != 0) {
                let totalProject = yield (0, query_1.executeQuery)(app, "select sum(hourBudget) from tasks where projectID = " + task.projectID).then((e) => parseFloat(e[0].hourBudget));
                // console.log({ totalProject, diff });
                // totalProject
                const mod = makeModifications(app, task.projectID, "projects", task.projectID);
                mod.add("hours_budget", diff + totalProject + "", totalProject + "", modifiedBy, false);
                // promises.push(mod.process());
                yield mod.process();
            }
        }
        yield modifications.process();
    });
}
function syncMutation(app, id) {
    return __awaiter(this, void 0, void 0, function* () {
        const mapping = recordMapping_1.recordMapping.mutation;
        let getRecord = yield (0, crmConnector_1.getItemByID)(app, "Mutations", id);
        if (getRecord.length == 0) {
            return {};
        }
        getRecord = getRecord[0];
        const insertRecord = {};
        for (const key in mapping) {
            insertRecord[key] =
                helpers_1.helpers.object.deepFind(getRecord, mapping[key]) || null;
        }
        if (insertRecord.service != null) {
            const search = yield (0, query_1.executeQuery)(app, "select ROWID from Services where CRMID = " +
                insertRecord.service +
                " limit 1");
            if (search.length == 0)
                insertRecord.service = (yield syncService(app, insertRecord.service)).ROWID;
            else
                insertRecord.service = search[0].ROWID;
        }
        const search = yield (0, query_1.executeQuery)(app, "select ROWID from mutations where CRMID = " + id + " limit 1");
        if (search.length == 0) {
            const insert = yield (0, datastore_1.insertRows)(app, [insertRecord], "mutations");
            return insert[0];
        }
        else {
            const update = yield (0, datastore_1.updateRows)(app, [
                Object.assign(Object.assign({}, insertRecord), { ROWID: search[0].ROWID }),
            ], "mutations");
            return update[0];
        }
    });
}
function makeModifications(app, projectID, module, entityID) {
    const modifications = {};
    return {
        add(apiName, newValue, oldValue, modifiedBy, checked = false) {
            modifications[apiName] = {
                newValue: newValue + "",
                oldValue: oldValue + "",
                modifiedBy,
                checked,
            };
        },
        hasModification(apiName) {
            return apiName in modifications;
        },
        process() {
            return __awaiter(this, void 0, void 0, function* () {
                if (Object.keys(modifications).length == 0)
                    return;
                const getProject = yield (0, query_1.executeQuery)(app, `select * from projects where ROWID = ${projectID}`);
                if (getProject.length == 0 || getProject[0].financeChecked != true) {
                    return;
                }
                let totalModifications = {};
                for (const apiNames of helpers_1.helpers.array.chunk(Object.keys(modifications), 200)) {
                    const getModifications = yield (0, query_1.executeGETALLQuery)(app, `select * from modifications where apiName in ('${apiNames.join("','")}') and module = '${module}' and entityID = '${entityID}' and checked = false and projectID = '${projectID}'`);
                    for (const mod of getModifications.map((e) => e.modifications)) {
                        mod.CREATEDTIME = new Date(mod.CREATEDTIME);
                        if (totalModifications[mod.apiName] == null ||
                            totalModifications[mod.apiName].CREATEDTIME > mod.CREATEDTIME) {
                            totalModifications[mod.apiName] = mod;
                        }
                    }
                }
                const creates = [], removeList = [];
                for (const apiName in modifications) {
                    const newModification = modifications[apiName];
                    const oldestModification = totalModifications[apiName];
                    if (oldestModification == null ||
                        oldestModification.oldValue != newModification.newValue) {
                        creates.push(Object.assign(Object.assign({}, modifications[apiName]), { module,
                            entityID,
                            projectID,
                            apiName }));
                        continue;
                    }
                    if (oldestModification.oldValue == newModification.newValue) {
                        removeList.push(apiName);
                        continue;
                    }
                }
                console.log({ totalModifications, creates, removeList });
                for (const apiNames of helpers_1.helpers.array.chunk(removeList, 200)) {
                    yield (0, query_1.executeQuery)(app, `delete from modifications 
                    where apiName in (${apiNames}) 
                        and module = '${module}' 
                        and entityID = '${entityID}' 
                        and checked = false 
                        and projectID = '${projectID}'`);
                }
                for (const chunk of helpers_1.helpers.array.chunk(creates, 100))
                    yield (0, datastore_1.insertRows)(app, chunk, "modifications");
            });
        },
    };
}
