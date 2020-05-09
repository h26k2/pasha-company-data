let scraped_urls = [];

const scrapeURLS = () => {

    console.log(`scraping urls...`);

    let s_page , e_page , btn;

    s_page = parseInt(document.getElementById("s_page").value);
    e_page = parseInt(document.getElementById("e_page").value);
    btn = document.getElementById("url-scrape-btn");

    if(btn.hasAttribute("data-page-current") == false){
        btn.setAttribute("data-page-current",s_page);
        btn.setAttribute("data-page-start",s_page);
        btn.setAttribute("data-page-end",e_page);
        scrapeURLS();
        return;
    }

    let current_page = btn.getAttribute("data-page-current");

    if(current_page >= s_page && current_page <= e_page){

        console.log(`sending request for page : ${current_page}`);

        fetch(`/scrapeURLS?page=${current_page}`,{
            method : "POST"
        }).then((res)=>{
            
            console.log(`got repsonse from the server`);
            console.log(res);

            if(res.status == 200){
                
                res.json().then((data)=>{
                    scraped_urls.push([...data]);
                });

                if(current_page < e_page){
                    current_page++;
                    btn.setAttribute("data-page-current",current_page);
                    console.log(`timing out for 3 seconds...`);
                    setTimeout(()=>{
                        scrapeURLS();
                    },3000);

                }

            }
            

        }).catch((err)=>{
            console.log('error occured');
            console.log(err);
        });

    }


}

const exportScrapedURLS = () => {

    let rows = [
        'company_link\n'
    ]

    for(let pageURLs of scraped_urls){
        for(let url of pageURLs){
            rows.push(`\"${url}\"\n`);
        }
    }

    let csvString = "";

    for(let elements of rows){
        csvString += elements;
    }


    const blob = new Blob([csvString] , {type : 'text/csv'});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('hidden','');
    a.setAttribute('href',url);
    a.setAttribute('download','pasha_company_urls.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

}

const loadCSV = () => {
    
    fetch('/loadCSV',{method : 'POST'}).then((res)=>{
        if(res.status == 200){
            console.log(`loaded csv file`);
            console.log(res);

            res.json().then((data)=>{
                
                let btn = document.getElementById("detail-scrape-btn");
                btn.setAttribute("data-start" , 0);
                btn.setAttribute("data-current",0);
                btn.setAttribute("data-end",data);

            });

        }
    }).catch((err)=>{
        console.log(err);
    });

}

let scraped_details = [];

const scrapeProducts = () => {

    let btn , start , end , current;

    btn  = document.getElementById("detail-scrape-btn");
    start = parseInt(btn.getAttribute("data-start"));
    end = parseInt(btn.getAttribute("data-end"));
    current = parseInt(btn.getAttribute("data-current"));

    if(current >= start && current <= end){

        console.log(`sending request for scraping : ${current}`);

        fetch(`/scrapeDetails?index=${current}`,{method : 'POST'}).then((res)=>{

            console.log(`got response`);
            console.log(res);

            if(res.status == 200){
                res.json().then((data)=>{
                   
                    let { name , summary , domains , location , phone , email , website , person , designation} = data;

                    summary = summary.replace(/\"/gi,`\'`);
                    domains = domains.replace(/\"/gi,`\'`);
                    location = location.replace(/\"/gi,`\'`);

                    let new_details = {
                        name , summary , location , phone , email , website , person , designation
                    }

                    scraped_details.push(new_details);
                    console.log(`timing out for 3 seconds..`);

                    setTimeout(()=>{
                        current++;
                        if(current <= end){
                            btn.setAttribute("data-current",current);
                            scrapeProducts();
                        }
                    },3000);

                });
            }

        }).catch((err)=>{
            console.log(err);
        });

    }


}


const exportDetails = () => {

    let rows = [
        `name,`, `summary,`, `location,`, `phone,`, `email,`, `website,`,
        `person,`, `designation\n`, 
    ]  

    for(let detail of scraped_details){

        let {name , summary , location , phone , email , website , person , designation} = detail;

       
        if(name.includes(",")){
            name = `\"${name}\"`
        }

        summary = `\"${summary}\"`;
        location = `\"${location}\"`;

        if(phone.includes(",")){
            phone = `\"${phone}\"`
        }

        if(email.includes(",")){
            email = `\"${email}\"`
        }
        
        
        rows.push(
            `${name},`,`${summary},`,`${location},`,`${phone},`,
            `${email},`,`${website},`,`${person},`,`${designation}\n`
        );


    }

    
    let csvString = ``;

    for(let r of rows){
        csvString += r;
    }

    const blob = new Blob([csvString] , {type : 'text/csv'});
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('hidden','');
    a.setAttribute('href',url);
    a.setAttribute('download','pasha_companies_directory.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);


}
