import { XeroServiceBase } from './XeroServiceBase';

export class XeroServiceUKLLP extends XeroServiceBase {

    constructor(tenant: string) {
        const config = require('../../config/oauth2/xero-uk-llp.json');
        super(tenant, config);
    }

    async createInvoice(invoiceData: any) {
        await this.authenticate();
        try {
            const response = await this.xeroClient.accountingApi.createInvoices('', { Invoices: [invoiceData] });
            this.logger.info(`Invoice created: ${response.body}`);
            return response.body;
        } catch (error) {
            this.logger.error('Failed to create invoice', error);
            throw new Error(error.message);
        }
    }

    async getContact(contactId: string) {
        await this.authenticate();
        try {
            const response = await this.xeroClient.accountingApi.getContact('', contactId);
            this.logger.info(`Contact retrieved: ${response.body}`);
            return response.body;
        } catch (error) {
            this.logger.error('Failed to get contact', error);
            throw new Error(error.message);
        }
    }

    async getPayments() {
        await this.authenticate();
        try {
            const response = await this.xeroClient.accountingApi.getPayments('');
            this.logger.info(`Payments retrieved: ${response.body}`);
            return response.body;
        } catch (error) {
            this.logger.error('Failed to get payments', error);
            throw new Error(error.message);
        }
    }

    async createPayment(paymentData: any) {
        await this.authenticate();
        try {
            const response = await this.xeroClient.accountingApi.createPayments('', { Payments: [paymentData] });
            this.logger.info(`Payment created: ${response.body}`);
            return response.body;
        } catch (error) {
            this.logger.error('Failed to create payment', error);
            throw new Error(error.message);
        }
    }

    // UK specific functionality for VAT reporting
    async getVATReport(reportDate: string) {
        await this.authenticate();
        try {
            const response = await this.xeroClient.accountingApi.getReportBAS('', {
                reportDate: reportDate
            });
            this.logger.info(`VAT report retrieved: ${response.body}`);
            return response.body;
        } catch (error) {
            this.logger.error('Failed to get VAT report', error);
            throw new Error(error.message);
        }
    }
}
