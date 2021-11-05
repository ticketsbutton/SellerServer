import { MyStellarLib } from "./mystellarlib"
import { StellarServer } from "./stellarserver"
import { error } from "./error"
import { AmountInteger } from "./amountInteger"

export const GUEST_ACCOUNT = "guest_account"
export const GUEST_SECRET = "guest_secret"

export class Account {
    private Balance: AmountInteger | null
    private stellar: StellarServer
    constructor(stellarserver: StellarServer) {
        this.Balance = null
        this.stellar = stellarserver
    }
    public setSecret(secretkey: string): void {
        window.localStorage.setItem("secretkey", secretkey)
    }
    public setPublickey(publickey: string): void {
        window.localStorage.setItem("publickey", publickey)
    }
    public getSecret(): string {
        const secretkey: string | null = window.localStorage.getItem("secretkey")
        if (secretkey !== null) {
            return secretkey
        } else {
            return GUEST_SECRET
        }
    }
    public getSrcPublickey(): string {
        const publickey: string | null = window.localStorage.getItem("publickey")
        if (publickey !== null) {
            return publickey
        } else {
            return GUEST_ACCOUNT
        }
    }
    public getBalance(): AmountInteger {
        if (this.Balance === null) {
            const err = new Error("This balance has not yet been set")
            error(err)
            throw err
        }
        return this.Balance
    }
    public async createAccountIfNeeded(): Promise<void> {
        if (window.localStorage.getItem("publickey") === null) {
            if (window.localStorage.getItem("secretkey") === null) {
                await this.createAccount()
            } else {
                await this.recoverAccountFromSecret()
            }
        }
    }
    private async recoverAccountFromSecret(): Promise<void> {
        const mystellarlib = new MyStellarLib()
        this.setPublickey(mystellarlib.getPublickeyFromSecret(this.getSecret()))
    }
    private async createAccount(): Promise<void> {
        const mystellarlib = new MyStellarLib()
        mystellarlib.createAccount(this)
        this.setPublickey(mystellarlib.getPublickeyFromSecret(this.getSecret()))
    }
    public async updateBalance(): Promise<void> {
        if (this.getSecret() === GUEST_SECRET) {
            this.Balance = new AmountInteger("NoAccount")
        } else {
            const balanceTmpIntStr: AmountInteger = await this.stellar.requestBalance(this.getSrcPublickey())
            this.Balance = balanceTmpIntStr
        }
    }
}
