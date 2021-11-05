import * as https from 'https';
import * as fs from 'fs';
import { Verifer } from './verifier'

let key  = fs.readFileSync('ssl/key.pem')
let cert = fs.readFileSync('ssl/certificate.pem')
const options = { key, cert };

https.createServer( options, async function( request, response ){
    let html:string
    console.log( request.url )

    let default_html:string
    default_html =  '<HTML><BODY>\n'
    default_html += '	hello world!!! <BR>\n'
    default_html += '<iframe id=\'ticket_iframe\' src=\'https://ticketsbutton.com/ticket.html?ticket_id=TICKET_ID_TO_BE_REPLACED:\' width=506.453125px height=168px scrolling=\'no\' marginwidth=\'0\' marginheight=\'0\' frameborder=\'0\'></iframe><BR>'
    default_html += '</BODY></HTML>\n'
    html = default_html

    if ( request.url!.indexOf( '?verify?' ) !== -1 ){
        let verifier = new Verifer()
        let ticket_id= 'TICKET_ID_TO_BE_REPLACED'
        let result: boolean | null= await verifier.verify( request.url!, ticket_id )
        console.log( 'verify payment result  = ' + result )
        if ( result === true ){
            let success_html:string
            success_html =  '<HTML><BODY>\n'
            success_html += 'Verification success!!<BR>\n'
            success_html += 'ID is ' + verifier.srcPublickey + '<BR>\n'
            success_html += 'Plase start your service.<BR>\n'
            success_html += '</BODY></HTML>\n'
            html = success_html
        } else {
            let fail_html:string
            fail_html    =  '<HTML><BODY>\n'
            fail_html    += 'Verification fail!!<BR>\n'
            fail_html    += 'Plase stop your service.<BR>\n'
            fail_html    += '</BODY></HTML>\n'
            html = fail_html
        }
    }
    response.writeHead(200)
    response.end(html);

}).listen(443, () => {
    console.log( 'server start' )	
})

