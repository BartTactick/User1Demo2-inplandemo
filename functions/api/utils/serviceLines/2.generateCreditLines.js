"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const fixServicePricing_1 = __importDefault(require("../fixServicePricing"));
const helpers_1 = require("../helpers");
const services_1 = require("../services");
function default_1(serviceLines, serviceStartDate, billingPeriod, serviceCRMID, earliestMutationEffectiveFrom) {
    if (!earliestMutationEffectiveFrom)
        return [];
    const linesBeforeMutation = serviceLines.filter((e) => !e.origin.startsWith("C") &&
        (0, services_1.isInvoiced)(e) &&
        e.refunded != true &&
        e.deleted == false &&
        !helpers_1.helpers.date.isSame(e.endDate, earliestMutationEffectiveFrom, "date") &&
        ((e.startDate < earliestMutationEffectiveFrom &&
            earliestMutationEffectiveFrom < e.endDate) ||
            e.startDate > earliestMutationEffectiveFrom) &&
        (e.startDate < serviceStartDate ||
            helpers_1.helpers.date.isSame(e.startDate, serviceStartDate, "date")));
    //   console.log(linesBeforeMutation, earliestMutationEffectiveFrom);
    //   if (globalThis) throw new Error("");
    const creditLines = linesBeforeMutation.map((e, i) => (Object.assign(Object.assign({}, e), { ROWID: undefined, invoiceIDTerritory: undefined, invoiceIDBilling: undefined, invoiceIDDelivery: undefined, invoicedOnBil: undefined, invoicedBy: undefined, invoicedByDel: undefined, invoicedOnDel: undefined, invoicedByBil: undefined, invoicedOnTer: undefined, invoicedByTer: undefined, refunded: undefined, quantity: -e.quantity, origin: "C", originID: "C_" + serviceCRMID, startDate: e.startDate < earliestMutationEffectiveFrom
            ? earliestMutationEffectiveFrom
            : e.startDate, parentID: e.ROWID })));
    for (const newLine of creditLines) {
        console.log(billingPeriod, serviceStartDate.getMonth(), newLine.startDate.getMonth());
        if ((!billingPeriod.includes("Monthly") &&
            serviceStartDate.getMonth() != newLine.startDate.getMonth()) ||
            (serviceStartDate.getDate() != newLine.startDate.getDate() &&
                helpers_1.helpers.date.getDaysInMonth(newLine.startDate) !=
                    newLine.startDate.getDate())) {
            (0, fixServicePricing_1.default)(newLine, true);
        }
    }
    return creditLines;
}
