require('dotenv').config();
const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE
);


function sendReStockUpdate(products) {
    let emailContent = generateHTMLBodyForRestockUpdate(products);
    /*
    const request = mailjet
        .post('send', { version: 'v3.1' })
        .request({
            Messages: [
                {
                    From: {
                        Email: "hello@sorkodev.com",
                        Name: "HverdagsKram StockUpdate"
                    },
                    Subject: "Dit lager skal snart genbestilles!",
                    TextPart: emailContent,
                    HTMLPart: emailContent,
                    Recipients: [
                        { Email: 'dkskdevelopment@gmail.com', Name: 'Daniel' },
                        { Email: 'marknorgaard96@gmail.com', Name: 'Mark' },
                    ]
                }
            ]
        })

    request
        .then((result) => {
            console.log(result.body)
        })
        .catch((err) => {
            console.log(err.statusCode)
        }) */
    const request = mailjet.post('send').request({
        FromEmail: 'hello@sorkodev.com',
        FromName: 'HverdagsKram StockUpdate',
        Subject: 'Dit lager skal snart genbestilles!',
        'Text-part': emailContent,
        'Html-part': emailContent,
        Recipients: [
            { Email: 'dkskdevelopment@gmail.com', Name: 'Daniel' },
            { Email: 'marknorgaard96@gmail.com', Name: 'Mark' },
        ],
    })
    request
        .then(result => {
            console.log(result.body)
        })
        .catch(err => {
            console.log(err.statusCode)
        })
}

function generateHTMLBodyForRestockUpdate(products) {
    let emailContent = "";
    emailContent += "<h3> Følgende produkter er ved at løbe tør for lager </h3>";
    emailContent += '<table>';
    emailContent += "<th>Productnavn</th><th>--Id--</th><th>---Forventes udsolgt---</th>";
    products.forEach(p => {
        emailContent += "<tr><td>" + p.name + "&#160; &#160; &#160;</td>" + "<td>  " + p.id + "&#160; &#160; &#160;</td>" + "<td>Udsolgt om: " + p.statistics[0].daysTillStockDry + " dage</td></tr>"
        // emailContent += "[<b>" + p.name + " (id: " + p.id + ") </b>] -> Udsolgt om: " + p.statistics[0].daysTillStockDry + " dage <br><br>";
    });
    emailContent += "</table>"
    return emailContent;
}


module.exports = { sendReStockUpdate };