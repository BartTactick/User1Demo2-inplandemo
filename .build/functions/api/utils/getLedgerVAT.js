"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLedgerAndVat = getLedgerAndVat;
function getLedgerAndVat(receiverType, senderCountry, receiverCountry, entity, CRMledgerCodes) {
    if (senderCountry == null)
        return {
            vatCode: "",
            ledgerCode: "",
            tax: 0,
            verlegd: false,
            id: "",
        };
    let billingTo = "";
    if (receiverType != "B") {
        //intern
        if (senderCountry == receiverCountry) {
            billingTo = "IC local";
        }
        else {
            billingTo = "IC in Europe";
        }
    }
    else {
        if (senderCountry == receiverCountry) {
            billingTo = "Customers local";
        }
        else {
            billingTo = "Customers outside Europe";
        }
    }
    const mapped = {
        B: entity.billingOffice,
        T: entity.territory,
        D: entity.delivery,
    };
    const ledgerCodes = CRMledgerCodes.filter((e) => e.Billing_Office.id == mapped[receiverType[0]] &&
        e.Billing_To == billingTo);
    // if (receiverType == "B")
    //     console.log({
    //         // ledgerCodes,
    //         // CRMledgerCodes,
    //         // billingTo,
    //         // boid: mapped[receiverType[0]],
    //         mapped,
    //         rec: receiverType[0],
    //         entity,
    //     });
    // Hours
    if ("entryDate" in entity) {
        if ([
            "On Subsequent Calculation",
            "Service - Fixed",
            "On Subsequent Calculation with limit",
        ].includes(entity.invoiceAgreement)) {
            const fixedCode = ledgerCodes.find((e) => e.Product_Type == "Hours" &&
                e.Product_Property == "Fixed Price");
            if (fixedCode == null)
                return {
                    ledgerCode: "",
                    tax: 0,
                    verlegd: false,
                    vatCode: "",
                    id: "",
                };
            return Object.assign({ ledgerCode: entity.totalAmount < 0
                    ? fixedCode.Ledger_Invoice_Credit
                    : fixedCode.Ledger_Invoice_Debet, vatCode: fixedCode.VAT_Code, id: fixedCode.id }, parseTax(fixedCode.VAT));
        }
        const find = ledgerCodes.find((e) => e.Product_Property == entity.invoiceAgreement);
        if (find == null)
            return {
                vatCode: "",
                ledgerCode: "",
                tax: 0,
                verlegd: false,
                id: "",
            };
        return Object.assign({ ledgerCode: entity.totalAmount < 0
                ? find.Ledger_Invoice_Credit
                : find.Ledger_Invoice_Debet, vatCode: find.VAT_Code, id: find.id }, parseTax(find.VAT));
    }
    //Charges
    if ("charge" in entity) {
        const product = entity.charge;
        if (product.Producttype == "Hours") {
            const fixedCode = ledgerCodes.find((e) => e.Product_Type == "Hours" &&
                e.Product_Property == "Fixed Price");
            if (fixedCode == null)
                return {
                    id: "",
                    ledgerCode: "",
                    vatCode: "",
                    tax: 0,
                    verlegd: false,
                };
            return Object.assign({ ledgerCode: entity.totalAmount < 0
                    ? fixedCode.Ledger_Invoice_Credit
                    : fixedCode.Ledger_Invoice_Debet, vatCode: fixedCode.VAT_Code, id: fixedCode.id }, parseTax(fixedCode.VAT));
        }
        else {
            const find = ledgerCodes.find((e) => e.Product_Type == product.Producttype);
            if (find == null)
                return {
                    vatCode: "",
                    ledgerCode: "",
                    tax: 0,
                    verlegd: false,
                    id: "",
                };
            return Object.assign({ ledgerCode: entity.totalAmount < 0
                    ? find.Ledger_Invoice_Credit
                    : find.Ledger_Invoice_Debet, vatCode: find.VAT_Code, id: find.id }, parseTax(find.VAT));
        }
    }
    if ("startDate" in entity) {
        const product = entity.product;
        const find = ledgerCodes.find((e) => e.Product_Property == product.Product_Property);
        if (find == null) {
            return {
                ledgerCode: "",
                tax: 0,
                verlegd: false,
                vatCode: "",
                id: "",
            };
        }
        return Object.assign({ ledgerCode: entity.totalAmount < 0
                ? find.Ledger_Invoice_Credit
                : find.Ledger_Invoice_Debet, vatCode: find.VAT_Code, id: find.id }, parseTax(find.VAT));
    }
    return {
        vatCode: "",
        ledgerCode: "",
        tax: 0,
        verlegd: false,
        id: "",
    };
}
function parseTax(tax) {
    if (tax == "ICP") {
        return { verlegd: true, tax: 0 };
    }
    const parsed = parseFloat(tax);
    if (isNaN(parsed))
        return { verlegd: false, tax: 0 };
    return { verlegd: false, tax: parsed };
}
