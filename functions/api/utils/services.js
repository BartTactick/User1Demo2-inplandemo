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
exports.getServiceStartDate = getServiceStartDate;
exports.getDateWithMax6YearsIntoTheFuture = getDateWithMax6YearsIntoTheFuture;
exports.getMutations = getMutations;
exports.setMinDateBasedOnMutationsAndServiceLines = setMinDateBasedOnMutationsAndServiceLines;
exports.addMutationsToLines = addMutationsToLines;
exports.isInvoiced = isInvoiced;
exports.toDate = toDate;
const crmConnector_1 = require("./crmConnector");
function getServiceStartDate(service) {
    const serviceStartDate = new Date(service.billingInvoiceTill || service.startDate);
    serviceStartDate.setHours(12);
    return serviceStartDate;
}
function getDateWithMax6YearsIntoTheFuture(endDate) {
    let generateUntilDate = new Date(endDate); // dit is de uiterste datum tot wanneer die moet genererern
    const sixYearsInTheFuture = new Date();
    sixYearsInTheFuture.setFullYear(sixYearsInTheFuture.getFullYear() + 6);
    if (endDate.getFullYear() == 1970 || sixYearsInTheFuture < endDate) {
        generateUntilDate = sixYearsInTheFuture;
        generateUntilDate.setDate(endDate.getDate());
    }
    return generateUntilDate;
}
function getMutations(app, CRMID) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, crmConnector_1.COQLQueryAll)(app, `select 
            New_Amount,
            New_Discount,
            New_Internal_Rate,
            New_Purchase_Price,
            New_Quantity,
            Previous_Amount,
            Previous_Discount,
            Previous_Internal_Rate,
            Previous_Purchase_Price,
            Previous_Quantity,
            Effective_from,
            Territory_Invoice,
            Delivery_Invoice,
            Billing_Office_Invoice
        from Mutations where Service.id = ${CRMID} and Status != 'Void'`).then((mutations) => {
            console.log({ mutations });
            return mutations;
        });
    });
}
function setMinDateBasedOnMutationsAndServiceLines(serviceMinStartDate, mutationMinDate, serviceStartDate, mutations, getServiceLines) {
    if (getServiceLines.length > 0) {
        const findMutationBeforeServiceMinStartDate = mutations
            .filter((e) => e.Territory_Invoice == null &&
            e.Delivery_Invoice == null &&
            e.Billing_Office_Invoice == null &&
            e.Effective_from < serviceMinStartDate)
            .sort((a, b) => {
            if (a.Effective_from > b.Effective_from)
                return 1;
            if (a.Effective_from < b.Effective_from)
                return -1;
            return 0;
        });
        if (findMutationBeforeServiceMinStartDate.length > 0) {
            const minDate = new Date(findMutationBeforeServiceMinStartDate[0].Effective_from);
            serviceMinStartDate = minDate;
            mutationMinDate.setTime(minDate.getTime());
            console.log("A");
        }
        else {
            console.log("B");
            serviceMinStartDate.setDate(serviceStartDate.getDate());
            mutationMinDate.setTime(serviceMinStartDate.getTime());
        }
        // hier gaan we de mutaties die nog niet in de servicelines staan scannen voor de mutationMinDate
        const firstNonBilledMutation = mutations.find((e) => !isInvoiced(e));
        if (firstNonBilledMutation != null &&
            new Date(firstNonBilledMutation.Effective_from) < mutationMinDate) {
            const effectiveFrom = new Date(firstNonBilledMutation.Effective_from);
            console.log({ firstNonBilledMutation, effectiveFrom });
            mutationMinDate.setTime(effectiveFrom.getTime());
            serviceMinStartDate = effectiveFrom;
            serviceMinStartDate.setDate(serviceStartDate.getDate());
        }
        console.log(firstNonBilledMutation, mutationMinDate);
        mutationMinDate.setHours(12);
        serviceMinStartDate.setDate(serviceStartDate.getDate());
        serviceMinStartDate.setHours(12);
        console.log(serviceMinStartDate, mutationMinDate);
    }
}
function addMutationsToLines(mutations, serviceLines, mutationMinDate, lines) {
    var _a, _b;
    for (const mutation of mutations) {
        mutation.origin = "M";
        mutation.originID = "M_" + mutation.id;
        const find = serviceLines.find((e) => e.originID == mutation.originID);
        // we slaan alle geinvoicde/onnodige mutaties er uit
        if ((find != null && isInvoiced(find)) ||
            mutation.Effective_from.setHours(12) < mutationMinDate ||
            ((_a = mutation.Billing_Office_Invoice) === null || _a === void 0 ? void 0 : _a.id) != null) {
            console.log("SKIP Mutation: " + mutation.Effective_from, mutationMinDate, [
                find != null && isInvoiced(find),
                mutation.Effective_from.setHours(12) < mutationMinDate,
                ((_b = mutation.Billing_Office_Invoice) === null || _b === void 0 ? void 0 : _b.id) != null,
            ]);
            continue;
        }
        const current = lines[toDate(mutation.Effective_from)];
        if (current == null) {
            lines[toDate(mutation.Effective_from)] = Object.assign({}, mutation);
            // als er al 1 is, moeten we de laatste hebben
        }
        else if (current.originID < mutation.originID)
            lines[toDate(mutation.Effective_from)] = Object.assign({}, mutation);
    }
}
// check of een serviceline/mutatie al gefactureerd is
function isInvoiced(search) {
    // console.log({ search });
    return ((search.invoiceIDTerritory ||
        search.invoiceIDDelivery ||
        search.invoiceIDBilling ||
        search.Billing_Office_Invoice ||
        search.Delivery_Invoice ||
        search.Territory_Invoice) != null);
}
// toDate zet datum om naar YYYY-MM-dd formaat
function toDate(date) {
    if (!date)
        return "";
    return new Date(date).toISOString().split("T")[0];
}
