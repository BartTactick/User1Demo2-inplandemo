"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthAmounts = void 0;
exports.default = default_1;
const helpers_1 = require("../helpers");
const services_1 = require("../services");
exports.monthAmounts = {
    Monthly: 1,
    Quarterly: 3,
    Yearly: 12,
    "2Yearly": 24,
    "3Yearly": 36,
};
function default_1(service, fromDate, serviceDate) {
    console.log(service);
    const maxDate = (0, services_1.getDateWithMax6YearsIntoTheFuture)(new Date(service.endDate || 0));
    maxDate.setHours(12);
    const startGenerationDate = new Date(fromDate);
    startGenerationDate.setHours(12);
    let billingPeriod = service.billingPeriod;
    if (billingPeriod.includes("Month"))
        billingPeriod = "Monthly";
    const lines = [];
    // console.log(startGenerationDate, maxDate);
    // startGenerationDate.setDate(serviceDate.getDate());
    if (!service.billingPeriod.includes("Month") &&
        !service.billingPeriod.includes("Quarter")) {
        startGenerationDate.setMonth(serviceDate.getMonth());
    }
    console.log(startGenerationDate, maxDate);
    while (startGenerationDate < maxDate) {
        const endDate = new Date(startGenerationDate);
        setMonthLimitLastOfMonth(exports.monthAmounts[billingPeriod], endDate, serviceDate.getDate());
        let needsProrato = false;
        if (endDate > maxDate) {
            endDate.setTime(maxDate.getTime());
            needsProrato = true;
        }
        // console.log(startGenerationDate, " - ", endDate);
        const line = {
            startDate: new Date(startGenerationDate),
            endDate,
            discount: service.discount,
            listPrice: service.listPrice,
            quantity: service.quantity,
            territoryPrice: service.territoryPrice,
            vendorPrice: service.vendorPrice,
            service: service.ROWID,
            origin: "S",
            originID: "S_" + service.CRMID,
            billingPeriod: service.billingPeriod,
            contractEndDate: service.endDate,
        };
        // fixServicePricing(line);
        lines.push(line);
        startGenerationDate.setTime(endDate.getTime());
    }
    return lines;
}
// zorg er voor dat als je een maand toevoeg dat hij of de targetMonth krijgt of de laatste van de juiste maand
// dit is om er voor te zorgen dat 31 Jan -> 28 Feb word
function setMonthLimitLastOfMonth(monthsToAdd, date, targetDayOfMonth) {
    const targetMonth = date.getMonth() + monthsToAdd;
    const clone = new Date(date);
    clone.setMonth(targetMonth);
    if (clone.getMonth() != targetMonth) {
        const firstOfMonth = new Date(date);
        firstOfMonth.setDate(1);
        firstOfMonth.setMonth(targetMonth);
        clone.setTime(firstOfMonth.getTime());
        clone.setDate(helpers_1.helpers.date.getDaysInMonth(clone));
        if (firstOfMonth.getFullYear() != clone.getFullYear()) {
            clone.setFullYear(firstOfMonth.getFullYear());
        }
    }
    else {
        clone.setMonth(targetMonth);
    }
    if (targetDayOfMonth > helpers_1.helpers.date.getDaysInMonth(clone)) {
        clone.setDate(helpers_1.helpers.date.getDaysInMonth(clone));
    }
    else {
        clone.setDate(targetDayOfMonth);
    }
    date.setTime(clone.getTime());
}
