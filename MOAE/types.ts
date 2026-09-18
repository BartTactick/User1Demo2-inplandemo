export {};

declare global {
    type CAT_BaseTable = {
        ROWID: string;
        CREATORID: number;
        CREATEDTIME: string;
        MODIFIEDTIME: string;
    };

    type CAT_services = CAT_BaseTable & {
        billingInvoiceTill?: Date;
        deliveryInvoiceTill?: Date;
        territoryInvoiceTill?: Date;
        startDate: Date;
        endDate: Date;
        project: string;
        product: string;
        billingOffice: string;
        delivery: string;
        territory: string;
        billingPeriod: string;
        quantity: number;
        listPrice: number;
        discount: number;
        description: string;
        customer: string;
        invoiceVia: string;
        totalExVat: number;
        territoryPrice: number;
        vendorPrice: number;
        CRMID: string;
        invoice_text: string;

        mutationIDS: string[];
    };

    type CAT_charges = CAT_BaseTable & {
        chargeName: string;
        charge: string;
        customer: string;
        invoiceVia: string;
        customerReferenceName: string;
        quantity: number;
        listPrice: number;
        discount: number;
        billingPeriod: string;
        billingOffice: string;
        delivery: string;
        territory: string;
        territoryPrice: number;
        vendorPrice: number;
        invoiceAgreement: string;
        invoiceIDBilling: string;
        invoiceIDTerritory: string;
        invoiceIDDelivery: string;
        project: string;
        totalExVat: number;
        CRMID: string;
        overviewID: string;
        invoiceDate: Date;
        description: string;
        invoice_text: string;
    };

    type CAT_timeEntries = CAT_BaseTable & {
        timeDelta: number;
        entryDate: Date;
        owner: string;
        billStatus: string;
        approvalStatus: string;
        projectID: string;
        taskID: string;
        entryID: string;
        delivery: string;
        product: string;
        invoice_text: string;
    };

    type CAT_tasks = CAT_BaseTable & {
        name: string;
        taskID: string;
        pricePerHour: number;
        projectID: string;
        internalTariff: number;
    };

    type CAT_projects = CAT_BaseTable & {
        name: string;
        potentialID: string;
        customerID: string;
        projectsID: string;
        financeChecked: boolean;
        territory: string;
        billingOffice: string;
        invoiceReference: string;
    };

    type CAT_mutations = CAT_BaseTable & {
        billingOfficeInvoice: string;
        billingOfficeInvoiceAmount: number;
        billingOfficeInvoicing: string;
        deliveryInvoice: string;
        deliveryInvoiceAmount: number;
        deliveryInvoicing: string;
        territoryInvoice: string;
        territoryInvoiceAmount: number;
        territoryInvoicing: string;
        effectiveFrom: Date;
        name: string;
        newAmount: number;
        newDiscount: number;
        newInternalRate: number;
        newPurchasePrice: number;
        newQuantity: number;
        previousAmount: number;
        previousDiscount: number;
        previousInternalRate: number;
        previousPurchasePrice: number;
        previousQuantity: number;
        service: string;
        status: string;

        billingInvoiceTill: Date;
        territoryInvoiceTill: Date;
        deliveryInvoiceTill: Date;
    };

    type CAT_customers = CAT_BaseTable & {
        CRMID: string;
        name: string;
    };
}
