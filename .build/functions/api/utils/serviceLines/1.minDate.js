"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const services_1 = require("../services");
const utils_1 = require("./utils");
function default_1(service, mutations) {
    const serviceStartDate = (0, utils_1.sortDates)([service.startDate, service.billingInvoiceTill]
        .filter((e) => typeof e == "string")
        .map((e) => new Date(e)), "DESC")[0];
    const earliestMutationEffectiveFrom = (0, utils_1.sortDates)(mutations.filter((e) => !(0, services_1.isInvoiced)(e)).map((e) => e.Effective_from), "ASC")[0];
    //   console.log({ earliestMutationEffectiveFrom, serviceStartDate });
    if (earliestMutationEffectiveFrom &&
        earliestMutationEffectiveFrom < serviceStartDate) {
        return { earliestMutationEffectiveFrom, serviceStartDate };
    }
    return { serviceStartDate };
}
