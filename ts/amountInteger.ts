import { error } from "./error"

export type AMOUNT_TYPE = "NO_ACCOUNT" | "NO_DEPOSIT" | "SET"
export class AmountInteger {
    private n: number
    private state: AMOUNT_TYPE
    constructor(decimalStr: string) {
        if (decimalStr === "NoAccount") {
            this.n = 0
            this.state = "NO_ACCOUNT"
        } else if (decimalStr === "NoDeposit") {
            this.n = 0
            this.state = "NO_DEPOSIT"
        } else {
            this.n = this.decimalStrToTmpInt(decimalStr)
            if (Number.isInteger(this.n) === false) {
                const e = new Error("price (" + this.n.toString() + ") is not integer type, decimalStr=" + decimalStr)
                error(e)
                throw e
            }
            this.state = "SET"
        }
    }
    public getAmountType(): AMOUNT_TYPE {
        if (this.state === "NO_ACCOUNT") {
            return "NO_ACCOUNT"
        } else if (this.state === "NO_DEPOSIT") {
            return "NO_DEPOSIT"
        } else {
            return "SET"
        }
    }
    public getIntegerStr(): string | AMOUNT_TYPE {
        if (this.getAmountType() !== "SET") {
            const e = new Error("amount type is not set")
            error(e)
            throw e
        }
        return String(this.n)
    }
    public getNum(): number {
        if (this.state === "NO_ACCOUNT") {
            return 0
        } else if (this.state === "NO_DEPOSIT") {
            return 0
        } else {
            return this.n
        }
    }
    public getDecimalStr(): string {
        if (this.state === "NO_ACCOUNT") {
            return "no account"
        } else if (this.state === "NO_DEPOSIT") {
            return "no deposit"
        } else {
            return this.tmpIntStrToDecimalStr(this.n.toString())
        }
    }
    public getRemoveDecimalStr(): string {
        if (this.state === "NO_ACCOUNT") {
            return "no account"
        } else if (this.state === "NO_DEPOSIT") {
            return "no deposit"
        } else {
            return this.removeUnusedDecimal(this.getDecimalStr())
        }
    }
    public plus(amountInteger: AmountInteger): void {
        this.n = this.n + amountInteger.n
        if (Number.isInteger(this.n) === false) {
            const e = new Error("price is not integer")
            error(e)
            throw e
        }
    }
    public plus_int(i: number): void {
        this.n = this.n + i
        if (Number.isInteger(this.n) === false) {
            const e = new Error("price is not integer")
            error(e)
            throw e
        }
    }
    public minus(amountInteger: AmountInteger): void {
        this.n = this.n - amountInteger.n
        if (Number.isInteger(this.n) === false) {
            const e = new Error("price is not integer")
            error(e)
            throw e
        }
    }
    public minus_int(i: number): void {
        this.n = this.n - i
        if (Number.isInteger(this.n) === false) {
            const e = new Error("price is not integer")
            error(e)
            throw e
        }
    }
    private decimalStrToTmpInt(decimal: string): number {
        return parseInt((parseFloat(decimal) * 10000000).toFixed(0), 10)
    }
    private tmpIntStrToDecimalStr(tmpIntStr: string): string {
        return (parseFloat(tmpIntStr) / 10000000).toFixed(7).toString()
    }
    private tmpIntToDecimalStr(tmpInt: number): string {
        return (tmpInt / 10000000).toFixed(7).toString()
    }
    private removeUnusedDecimal(decimal: string) {
        return decimal.replace(/0+$/g, "").replace(/\.$/g, "")
    }
}
