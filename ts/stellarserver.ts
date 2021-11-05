import { MyStellarLib } from "./mystellarlib"
import { AmountInteger } from "./amountInteger"
import { Server } from "stellar-sdk"
import { AccountResponse } from "stellar-sdk"
import { Account as MyAccount } from "./account"
import { Account as StellarAccount } from "stellar-base"
import { Keypair } from "stellar-base"
import { Transaction } from "stellar-base"
import { Memo } from "stellar-base"
import { Asset } from "stellar-base"
import { TransactionBuilder } from "stellar-base"
import { Operation } from "stellar-base"
import { Networks } from "stellar-base"
import { error } from "./error"
import { network } from "./mystellarlib"
import { TRANSACTION_RESULT_TYPE } from "./mystellarlib"
import { xdr } from "stellar-base"

export const unit = 10000000
export type OPERATION_TYPE = "PAYMENT" | "CREATEACCOUNT"
export type checkAndBalanceParams = [TRANSACTION_RESULT_TYPE, string, AmountInteger, Server, AccountResponse]
export type payRtnParams = [TRANSACTION_RESULT_TYPE, string]

export class StellarServer {
    mystellarlib: MyStellarLib
    constructor() {
        this.mystellarlib = new MyStellarLib()
    }

    public async requestBalance(publickey: string): Promise<AmountInteger> {
        try {
            const server: Server = new Server(this.mystellarlib.getHorizonUrl())
            const accountRes: AccountResponse = await server.loadAccount(publickey)
            return new AmountInteger(accountRes.balances[0].balance)
        } catch (e) {
            return new AmountInteger("NoDeposit")
        }
    }

    public async checkAccountExist(publickey: string): Promise<boolean> {
        const server: Server = new Server(this.mystellarlib.getHorizonUrl())
        try {
            await server.loadAccount(publickey)
            return true
        } catch (e) {
            return false
        }
    }
    public async getStellarFee(): Promise<AmountInteger> {
        const server: Server = new Server(this.mystellarlib.getHorizonUrl())
        const minimumStellarFee: number = await server.fetchBaseFee()
        const fee = new AmountInteger("0")
        fee.plus_int(minimumStellarFee * 100)
        return fee
    }

    public async checkPriceAndBalance(
        priceTmpIntStr: AmountInteger,
        myFeeInt: AmountInteger,
        stellarFee: AmountInteger,
        myAccountSrc: MyAccount
    ): Promise<checkAndBalanceParams> {
        const server: Server = new Server(this.mystellarlib.getHorizonUrl())
        const keypairSrc: Keypair = Keypair.fromSecret(myAccountSrc.getSecret())
        // console.log("  loadAccount start"+ "<br>")

        const accountRes: AccountResponse = await server.loadAccount(keypairSrc.publicKey())
        // console.log("  loadAccount finish"+ "<br>")
        const balance = accountRes.balances[0].balance
        // console.log("  balance.balance=" + balance );
        const needremain = new AmountInteger("0")
        needremain.plus_int(unit)
        const totalcost = new AmountInteger("0")

        totalcost.plus(priceTmpIntStr)
        totalcost.plus(stellarFee)
        totalcost.plus(myFeeInt)
        totalcost.plus(needremain)

        const balanceTmpInt = new AmountInteger(balance)
        if (balanceTmpInt.getNum() < totalcost.getNum()) {
            return ["NOT_ENOUGH_AMOUNT", "", stellarFee, server, accountRes]
        } else {
            // console.log("async func pay start")
            try {
                if (balanceTmpInt.getNum() < totalcost.getNum()) {
                    return [
                        "NOT_ENOUGH_AMOUNT",
                        "" + " fee " + stellarFee.getRemoveDecimalStr() + "is needed.",
                        stellarFee,
                        server,
                        accountRes,
                    ]
                } else {
                    return ["OK", "", stellarFee, server, accountRes]
                }
            } catch (error) {
                return ["ERROR", error.message, stellarFee, server, accountRes]
            }
        }
    }

    public async pay(
        server: Server,
        accountRes: AccountResponse,
        myFeeInt: AmountInteger,
        stellarFeeTmpInt: AmountInteger,
        operation: OPERATION_TYPE,
        publickeyDst: string,
        priceTmpInt: AmountInteger,
        myAccountSrc: MyAccount,
        ticketHash: string
    ): Promise<payRtnParams> {
        const keypairSrc: Keypair = Keypair.fromSecret(myAccountSrc.getSecret())

        let net: Networks
        if (network === "TESTNET") {
            net = Networks.TESTNET
        } else {
            net = Networks.PUBLIC
        }
        const payment = Operation.payment({
            destination: publickeyDst,
            asset: Asset.native(),
            amount: priceTmpInt.getDecimalStr(),
        })
        const feepayment = Operation.payment({
            destination: "GBF7A6WK3CJPUHUQSHGBZUQM5KHP4COOYNPZTDJCXDTGTB7JDAV6Q4PP",
            asset: Asset.native(),
            amount: myFeeInt.getDecimalStr(),
        })
        const createAcc = Operation.createAccount({
            destination: publickeyDst,
            startingBalance: priceTmpInt.getDecimalStr(),
        })

        let op: xdr.Operation<Operation.Payment>
        if (operation === "PAYMENT") {
            op = payment
        } else {
            op = createAcc
        }

        const memo: Memo = new Memo("hash", Buffer.from(ticketHash, "hex"))
        const fee: string = stellarFeeTmpInt.getIntegerStr()
        const stellarAccount = new StellarAccount(accountRes.accountId(), accountRes.sequence)
        const tx: Transaction = new TransactionBuilder(stellarAccount, {
            fee,
            networkPassphrase: net,
        })
            .addOperation(op)
            .addOperation(feepayment)
            .addMemo(memo)
            .setTimeout(10000)
            .build()

        // console.log("tx.hash()=" + ticketHash)
        // console.log("sign"+ "<br>")
        tx.sign(keypairSrc)
        // console.log("submitTransaction"+ "<br>")
        try {
            const response = await server.submitTransaction(tx)
            // console.log(JSON.stringify(response))
            const obj = JSON.parse(JSON.stringify(response))
            if (obj.successful.toString() !== "true") {
                const e = new Error("successful != true")
                error(e)
                throw e
            }
            return ["OK", obj.id]
        } catch (error2) {
            // console.log("JSON.stringify(error)=" + JSON.stringify(error))
            const e: Error = new Error(JSON.stringify(error2))
            error(e)
            return ["ERROR", error2]
        }
    }

    public async getOperations(transactionId: string): Promise<AmountInteger> {
        const server: Server = new Server(this.mystellarlib.getHorizonUrl())
        try {
            const result = await server.operations().forTransaction(transactionId).call()

            const obj = JSON.parse(JSON.stringify(result))
            // console.log(JSON.stringify(result) + "<BR>")
            const amountInt = new AmountInteger("0")
            if (obj.records[0].type === "create_account") {
                const s1: string = obj.records[0].starting_balance
                const a = new AmountInteger(s1)
                amountInt.plus(a)
            } else if (obj.records[0].type === "payment") {
                const s2 = obj.records[0].amount
                const b = new AmountInteger(s2)
                amountInt.plus(b)
            } else {
                const e: Error = new Error("operation error")
                error(e)
                throw e
            }
            return amountInt
        } catch (error3) {
            const e: Error = new Error(JSON.stringify(error3))
            error3(e)
            throw e
        }
    }

    public async getTransactions(transactionId: string): Promise<string> {
        const server: Server = new Server(this.mystellarlib.getHorizonUrl())

        try {
            const result = await server.transactions().transaction(transactionId).call()

            // console.log(JSON.stringify(result))
            const obj = JSON.parse(JSON.stringify(result))
            const buf = Buffer.from(obj.memo, "base64")
            return buf.toString("hex")
        } catch (err) {
            const e: Error = new Error(JSON.stringify(err))
            error(e)
            throw e
        }
    }
}
