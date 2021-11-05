import { MyStellarLib } from "./mystellarlib"
import { StellarServer } from "./stellarserver"

export class VerifyTicket {
    private createHashMsg(ticketID: string, dstPublickey: string, price: string, srcPublickey: string): string {
        let str = ""
        str += "---this hash is created by---" + "\n"
        str += "this.ticketId                        =" + ticketID + "\n"
        str += "this.getPublickey()                  =" + dstPublickey + "\n"
        str += "this.getPriceTmpInt().getDecimalStr()=" + price + "\n"
        str += "srcPublickey                         =" + srcPublickey + "\n"
        str += "----------------------------"
        return str
    }
    public createHash(ticketID: string, dstPublickey: string, integerPrice: string, srcPublickey: string): string {
        const mystellarlib = new MyStellarLib()
        const rtn: string = mystellarlib.hashFromTicketInfo(ticketID, dstPublickey, integerPrice, srcPublickey)
        const version = "1"
        const hash = version + rtn.slice(1)
        return hash
    }
    public async verify(
        ticketID: string,
        dstPublickey: string,
        integerPrice: string,
        srcPublickey: string,
        transactionId: string
    ): Promise<boolean> {
        const stellarServer = new StellarServer()
        if (ticketID === null) {
            const e = new Error("ticketID must not be null")
            throw e
        }
        const amount = await stellarServer.getOperations(transactionId)

        if (amount.getIntegerStr() !== integerPrice) {
            // const err = "hash verify error\n price is not valid" // + " amount=" + parseFloat(amount) + " " + "price=" + parseFloat(this.getPrice())
            // const err = new Error("price is not valid value")
            // console.log( err )
            return false
        } else {
            const hash = await stellarServer.getTransactions(transactionId)
            const thishash: string = this.createHash(ticketID, dstPublickey, integerPrice, srcPublickey)
            if (hash !== thishash) {
                // if ( hash !== "ate" ){ //for test
                // const errmsg = "hash verify error"
                // let err = errmsg + "\n"
                // err += "hash    =" + hash + "\n"
                // err += "thishash=" + thishash + "\n"
                // err += this.createHashMsg(ticketID, dstPublickey, integerPrice, srcPublickey)
                // console.log( err )
                return false
            } else {
                return true
            }
        }
    }
}
