import { MyStellarLib } from "./mystellarlib"

const plain: string = process.argv[2]
const publickey: string = process.argv[3]
const sign: string = process.argv[4]

//console.log( "publickey=" + publickey )
const mystellar = new MyStellarLib()
const result = mystellar.verify(plain, publickey, sign)

if (result === true) {
    console.log("true")
} else {
    console.log("false")
}
