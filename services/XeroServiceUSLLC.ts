import { XeroServiceBase } from './XeroServiceBase';
import { Logger } from '../../../../core-protocols/services/webhook_manager';

export class XeroServiceUSLLC extends XeroServiceBase {

    constructor(tenant: string) {
        const config = require('../../config/oauth2/xero-us-llc.json');
        super(tenant, config);
    }

    async createInvoice(invoiceData: any) {
        await this.authenticate();
        try {
            const response = await this.xeroClient.accountingApi.createInvoices('', { Invoices: [invoiceData] });
            this.logger.info(`Invoice created: ${response.body}`);
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
        } catch (error) {
            this.logger.error('Failed to get contact', error);
            throw new Error(error.message);
        }
    }
}

