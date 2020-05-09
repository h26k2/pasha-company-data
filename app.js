const port = 3000
const express = require("express")
const app = express()
const axios = require("axios")
const cheerio = require("cheerio")
const fs = require("fs")
const csv = require('csv-parser')

app.use(express.static("public"));
app.set("view engine","ejs");

app.get("/",(req,res)=>{
    res.render("home");
});

app.post("/scrapeURLS",(req,res)=>{

    let {page} = req.query;
    let url = `https://www.pasha.org.pk/d/all/?_page=${page}`;
    console.log(`sending request for page : ${url}`);
    
    axios.get(url).then((a_res)=>{
        
        console.log(`found response from axios`);

        let $$ = cheerio.load(a_res.data);

        let container = $$(".drts-view-entities-list-row");
        let records = $$(container).find(".drts-entity");
        let urls = [];

        $$(records).each((i,r)=>{
            urls.push($$(r).find("a").eq(0).attr("href"));
        });

        console.log(` ==> Found ${urls.length} urls <==`);
        console.log(urls);

        res.status(200).json(urls);

    }).catch((err)=>{
        console.log(err);
        res.status(500).end();
    });


});

let scraped_links = [];

app.post("/loadCSV",(req,res)=>{

    try{
        fs.createReadStream(`pasha_company_urls.csv`).pipe(csv()).on('data', (data) => scraped_links.push(data))  
        .on('end', async() => {
            console.log(`no of records in csv : ${scraped_links.length}`);
            res.status(200).end(`${scraped_links.length-1}`);
        }); 
    }
    catch(err){
        res.status(502).end();
        console.log(err);
    }

});

app.post("/scrapeDetails",(req,res)=>{

    let {index} = req.query;
    
    let url = scraped_links[index];
    url = url.company_link;

    console.log(`request recieved for scpraing product : ${url}`);

    axios.get(url).then((a_res)=>{

        let $$ = cheerio.load(a_res.data);

        let name = $$("h1.entry-title").text();
        let summary = $$("div.company-summary-detailed ").text();

        let domains = ``;

        $$("div.directory-listing-terms").eq(0).find("a").each((i,elem)=>{
            domains += `${$$(elem).text()},`;
        })
        domains = domains.substr(0,domains.length - 1);

        let location = $$("div.drts-display-element-entity_field_location_address-1").text();
        let phone = $$("div.drts-display-element-entity_field_field_phone-1").text();
        let email = $$("div.drts-display-element-entity_field_field_email-1").text();
        let website = $$("div.drts-display-element-entity_field_field_website-1").text();

        let person = $$("div.drts-display-element-entity_field_field_authorized_representative-1").find("div.drts-entity-field-value").text();
        let designation = $$("div.drts-display-element-entity_field_field_designation-1").find("div.drts-entity-field-value").text();

        let details = {
           name , summary , domains , location , phone , email , website , person , designation
        }

        console.log(details);
        console.log(`successfully found details`);
        res.status(200).json(details);

    }).catch((err)=>{
        console.log(err);
        console.log('error occured');
        res.status(500).end();
    })


});



app.listen(port,()=>{
    console.log(`node app is live at port : ${port}`);
})