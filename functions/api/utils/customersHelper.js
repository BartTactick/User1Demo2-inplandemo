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
exports.getCustomerROWID = getCustomerROWID;
exports.upsertCustomers = upsertCustomers;
const crmConnector_1 = require("./crmConnector");
const datastore_1 = require("./datastore");
const query_1 = require("./query");
const helpers_1 = require("./helpers");
function getCustomerROWID(app, CRMID) {
    return __awaiter(this, void 0, void 0, function* () {
        let existing = yield (0, query_1.executeQuery)(app, `select ROWID,CRMID from customers where CRMID = '${CRMID}'`);
        if (existing.length == 0) {
            const data = yield (0, crmConnector_1.COQLQuery)(app, `select Account_Name,id from Accounts where id = '${CRMID}'`);
            const inserted = yield (0, datastore_1.insertRows)(app, data.map((e) => ({
                CRMID: e.id,
                name: e.Account_Name,
            })), "customers").catch(() => {
                console.log({ COQLdata: data });
                return false;
            });
            if (inserted == false) {
                return null;
            }
            existing = yield (0, query_1.executeQuery)(app, `select ROWID,CRMID from customers where CRMID = '${CRMID}'`);
        }
        if (existing.length == 0)
            return null;
        return existing[0].ROWID;
    });
}
function upsertCustomers(app, CRMID) {
    return __awaiter(this, void 0, void 0, function* () {
        let array = CRMID;
        if (!Array.isArray(CRMID)) {
            array = [CRMID];
        }
        else {
            array = helpers_1.helpers.array.unique(CRMID);
        }
        let existingCustomers = [], customerData = [];
        for (const ids of helpers_1.helpers.array.chunk(array, 50)) {
            const existing = yield (0, query_1.executeQuery)(app, `select ROWID,CRMID from customers where CRMID in ('${ids.join("','")}')`);
            existingCustomers = existingCustomers.concat(existing);
            customerData = customerData.concat(yield (0, crmConnector_1.COQLQuery)(app, `select Country_for_Billing,Account_Name,id from Accounts where id in (${ids.join(",")})`));
        }
        const updates = [], creates = [];
        // console.log(existingCustomers, customerData, array);
        for (const customer of customerData) {
            const search = existingCustomers.find((e) => e.CRMID == customer.id);
            const data = {
                name: customer.Account_Name,
                CRMID: customer.id,
                billingCountry: customer.Country_for_Billing,
                EOID1: customer.EOID1,
                EOID2: customer.EOID2,
                EOID3: customer.EOID3,
                EOID4: customer.EOID4,
            };
            if (search == null) {
                creates.push(data);
            }
            else {
                updates.push(Object.assign({ ROWID: search.ROWID }, data));
            }
        }
        existingCustomers = [];
        if (creates.length > 0) {
            existingCustomers = existingCustomers.concat((yield (0, datastore_1.insertRows)(app, creates, "customers")));
        }
        if (updates.length > 0) {
            // console.log({ updates });
            existingCustomers = existingCustomers.concat((yield (0, datastore_1.updateRows)(app, updates, "customers")));
        }
        return existingCustomers;
    });
}
