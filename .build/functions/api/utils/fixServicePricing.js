"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const helpers_1 = require("./helpers");
function default_1(service, force = false) {
    // if (service.prorato == true) return;
    let billingPeriod = service.billingPeriod + "";
    if (billingPeriod.includes("Month")) {
        billingPeriod = "Monthly";
    }
    const startDateEOM = new Date(service.startDate);
    startDateEOM.setDate(1);
    startDateEOM.setMonth(startDateEOM.getMonth() + 1);
    startDateEOM.setDate(0);
    const endDateEOM = new Date(service.endDate);
    endDateEOM.setDate(1);
    endDateEOM.setMonth(endDateEOM.getMonth() + 1);
    endDateEOM.setDate(0);
    // console.log("Service:  " + JSON.stringify(service), force);
    if (service.endDate != null &&
        service.contractEndDate != null &&
        service.endDate.toISOString().split("T")[0] == service.contractEndDate) {
        const contractEndDate = new Date(service.contractEndDate);
        service.endDate = contractEndDate;
        const daysInPeriod1 = billingPeriod == "Monthly"
            ? helpers_1.helpers.date.getDaysInMonth(service.endDate)
            : helpers_1.helpers.date.getDaysInYear(service.endDate.getFullYear());
        const amountOfDaysDiff1 = helpers_1.helpers.date.getDaysBetweenDates(service.startDate, contractEndDate);
        const daysInPeriod2 = billingPeriod == "Monthly"
            ? helpers_1.helpers.date.getDaysInMonth(service.endDate)
            : helpers_1.helpers.date.getDaysInYear(service.endDate.getFullYear());
        const amountOfDaysDiff2 = helpers_1.helpers.date.getDaysBetweenDates(service.startDate, billingPeriod == "Monthly"
            ? new Date(service.startDate.getFullYear(), service.startDate.getMonth() + 1, 0)
            : new Date(service.startDate.getFullYear(), 11, 30));
        const daysInPeriod3 = billingPeriod == "Monthly"
            ? helpers_1.helpers.date.getDaysInMonth(contractEndDate)
            : helpers_1.helpers.date.getDaysInYear(contractEndDate.getFullYear() + 1);
        const amountOfDaysDiff3 = helpers_1.helpers.date.getDaysBetweenDates(billingPeriod == "Monthly"
            ? new Date(service.startDate.getFullYear(), service.startDate.getMonth() + 1, 0)
            : new Date(service.startDate.getFullYear() + 1, 0, 0), contractEndDate);
        // console.log("ProRato: " + service, {
        //     amountOfDaysDiff1,
        //     amountOfDaysDiff2,
        //     billingPeriod,
        //     lineStart: service.startDate,
        //     lineEnd: service.endDate,
        //     daysInPeriod1,
        // });
        if ((amountOfDaysDiff1 <= amountOfDaysDiff2 &&
            billingPeriod == "Monthly") ||
            (contractEndDate.getFullYear() == service.endDate.getFullYear() &&
                billingPeriod != "Monthly")) {
            service.listPrice =
                (service.listPrice / daysInPeriod1) * amountOfDaysDiff1;
            service.vendorPrice =
                (service.vendorPrice / daysInPeriod1) * amountOfDaysDiff1;
            service.territoryPrice =
                (service.territoryPrice / daysInPeriod1) * amountOfDaysDiff1;
            service.discount =
                (service.discount / daysInPeriod1) * amountOfDaysDiff1;
            // console.log(JSON.parse(JSON.stringify(service)));
        }
        else {
            // console.log("B END");
            service.listPrice =
                (service.listPrice / daysInPeriod2) * amountOfDaysDiff2 +
                    (service.listPrice / daysInPeriod3) * (amountOfDaysDiff3 - 1);
            service.vendorPrice =
                (service.vendorPrice / daysInPeriod2) * amountOfDaysDiff2 +
                    (service.vendorPrice / daysInPeriod3) *
                        (amountOfDaysDiff3 - 1);
            service.territoryPrice =
                (service.territoryPrice / daysInPeriod2) * amountOfDaysDiff2 +
                    (service.territoryPrice / daysInPeriod3) *
                        (amountOfDaysDiff3 - 1);
            service.discount =
                (service.discount / daysInPeriod2) * amountOfDaysDiff2 +
                    (service.discount / daysInPeriod3) * (amountOfDaysDiff3 - 1);
        }
        for (const key of [
            "listPrice",
            "vendorPrice",
            "territoryPrice",
            "discount",
        ]) {
            let currentValue = service[key];
            if (currentValue != null) {
                if (isNaN(currentValue)) {
                    // make sure that there is always a valid number
                    currentValue = 0;
                }
                else {
                    // cut off the amount after 2 decimals
                    currentValue = helpers_1.helpers.number.twoDecimals(currentValue);
                }
            }
            service[key] = currentValue;
        }
    }
    else if ((service.startDate.getDate() != service.endDate.getDate() &&
        service.startDate.getDate() != startDateEOM.getDate() &&
        service.endDate.getDate() != endDateEOM.getDate()) ||
        force) {
        console.log("PR2");
        service.listPrice = correctDate(service.listPrice, service.endDate, service.startDate, billingPeriod);
        service.discount = correctDate(service.discount, service.endDate, service.startDate, billingPeriod);
        service.territoryPrice = correctDate(service.territoryPrice, service.endDate, service.startDate, billingPeriod);
        service.vendorPrice = correctDate(service.vendorPrice, service.endDate, service.startDate, billingPeriod);
    }
}
const correctDate = (amount, endDate, fromDate, billingPeriod) => {
    const daysBetween = helpers_1.helpers.date.getDaysBetweenDates(fromDate, endDate);
    const daysInPeriod = billingPeriod == "Monthly"
        ? helpers_1.helpers.date.getDaysInMonth(fromDate)
        : helpers_1.helpers.date.getDaysInYear(fromDate.getFullYear() + 1);
    // console.log(
    //     "fromDate:" +
    //         fromDate +
    //         " endDate: " +
    //         endDate +
    //         " daysInPeriod: " +
    //         daysInPeriod +
    //         " daysBetween: " +
    //         daysBetween +
    //         " billingPeriod: " +
    //         billingPeriod
    // );
    return parseFloat(((amount / daysInPeriod) * daysBetween).toFixed(2));
};
