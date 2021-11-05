import { hash } from "stellar-base"
import { Keypair } from "stellar-base"
import { Account as MyAccount } from "./account"

export type TRANSACTION_RESULT_TYPE = "OK" | "NOT_ENOUGH_AMOUNT" | "ERROR"
export type NETWORK_TYPE = "PUBLIC" | "TESTNET"
export const network: NETWORK_TYPE = "PUBLIC"

export class MyStellarLib {
    public getHorizonUrl(): string {
        let url: string
        if (network === "TESTNET") {
            url = "https://horizon-testnet.stellar.org"
        } else {
            url = "https://horizon.stellar.org"
        }
        return url
    }
    public createSecretkey(seed: string): string {
        // const keypair = Keypair.fromRawEd25519Seed( Buffer.from( seed ) )
        // const Ed25519Buffer:Buffer = StrKey.decodeEd25519PublicKey( StrKey.encodeEd25519PublicKey(hash( Buffer.from(seed) )) );
        const Ed25519Buffer: Buffer = hash(Buffer.from(seed))
        const keypair = Keypair.fromRawEd25519Seed(Ed25519Buffer)
        return keypair.secret()
    }
    public getPublickeyFromSecret(secret: string): string {
        const keypair = Keypair.fromSecret(secret)
        return keypair.publicKey()
    }
    public sign(plain: string, secret: string): string {
        // const keypair = Keypair.fromSecret(secret)
        // return sign( Buffer.from(plain,'hex'), keypair.rawSecretKey() ).toString()
        const keypair = Keypair.fromSecret(secret)
        return keypair.sign(Buffer.from(plain)).toString("hex")
    }
    public verify(plain: string, publickey: string, sign: string): boolean {
        // return verify( Buffer.from(plain), sign, Buffer.from(publickey) ).toString()
        const keypair = Keypair.fromPublicKey(publickey)
        return keypair.verify(Buffer.from(plain), Buffer.from(sign, "hex"))
    }
    public hash(str: string): string {
        // return StrKey.encodeEd25519PublicKey(hash( Buffer.from(str, 'hex') ))
        // return Keypair.fromRawEd25519Seed( StrKey.decodeEd25519PublicKey( StrKey.encodeEd25519PublicKey(hash( Buffer.from(str, 'hex') )) ) ).secret()
        return hash(Buffer.from(str)).toString("hex")
        // return _hashing.hash(str).toString("hex");
    }

    public hashFromTicketInfo(ticketId: string, dstPublickey: string, priceInt: string, srcPublickey: string): string {
        return this.hash(ticketId + dstPublickey + priceInt + srcPublickey)
    }

    public createAccount(myaccount: MyAccount): void {
        const keypair: Keypair = Keypair.random()
        myaccount.setSecret(keypair.secret())
    }
}
