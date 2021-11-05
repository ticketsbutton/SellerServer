import { MyStellarLib } from "./mystellarlib"
import { VerifyTicket } from "./verifyticket"

export class Verifer {
    public ticketId: string | null = null
    public dstPublickey: string | null = null
    public integerPrice: string | null = null
    public srcPublickey: string | null = null
    public transactionId: string | null = null
    public sign: string | null = null
    private getValue(targetstr: string, key: string) {
        return targetstr.substr(key.length, targetstr.length)
    }
    private getPlain(requestUrl: string): string {
        let pos = requestUrl.indexOf("sign=")
        return requestUrl.substr(1, pos - 1) // remove / and sign=XXXX:
    }
    private parse(requestUrl: string) {
        let keyword = "?verify?"
        let pos = requestUrl.indexOf(keyword)
        let target = requestUrl.substr(pos + keyword.length, requestUrl.length - keyword.length)
        let infoArray = target.split(":")
        for (const info of infoArray) {
            if (info.indexOf("ticketId=") === 0) {
                this.ticketId = this.getValue(info, "ticketId=")
            } else if (info.indexOf("dstPublickey=") === 0) {
                this.dstPublickey = this.getValue(info, "dstPublickey=")
            } else if (info.indexOf("integerPrice=") === 0) {
                this.integerPrice = this.getValue(info, "integerPrice=")
            } else if (info.indexOf("srcPublickey=") === 0) {
                this.srcPublickey = this.getValue(info, "srcPublickey=")
            } else if (info.indexOf("transactionId=") === 0) {
                this.transactionId = this.getValue(info, "transactionId=")
            } else if (info.indexOf("sign=") === 0) {
                this.sign = this.getValue(info, "sign=")
            }
        }
    }
    public verifyClient(requestUrl: string): boolean {
        this.parse(requestUrl)
        let mystellarlib = new MyStellarLib()
        if (
            this.ticketId === null ||
            this.integerPrice === null ||
            this.srcPublickey === null ||
            this.dstPublickey === null ||
            this.sign === null
        ) {
            return false
        } else {
            let plain = this.getPlain(requestUrl)
            const hash = mystellarlib.hash(plain)
            return mystellarlib.verify(hash, this.srcPublickey, this.sign)
        }
    }
    public async verifyPayment(requestUrl: string, ticketId: string) {
        this.parse(requestUrl)
        let verifyTicket = new VerifyTicket()
        if (
            this.ticketId === null ||
            this.dstPublickey === null ||
            this.integerPrice === null ||
            this.srcPublickey === null ||
            this.transactionId === null
        ) {
            return false
        } else if (ticketId !== this.ticketId) {
            return false
        } else {
            const rtn = await verifyTicket.verify(
                this.ticketId,
                this.dstPublickey,
                this.integerPrice,
                this.srcPublickey,
                this.transactionId
            )
            return rtn
        }
    }
    public async verify(requestUrl: string, ticketId: string) {
        const rtn = this.verifyClient(requestUrl)
        if (rtn == false) {
            return false
        }
        return await this.verifyPayment(requestUrl, ticketId)
    }
}
