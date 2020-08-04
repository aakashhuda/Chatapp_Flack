const temp = Handlebars.compile(document.querySelector("#temp").innerHTML)
document.addEventListener('DOMContentLoaded', ()=>{
    const submitBtn = document.querySelector("button");
    submitBtn.disabled = true;   
    document.querySelector("#name").onkeyup = ()=>{
        var dsplyName = document.querySelector("#name").value;
        if(dsplyName.length > 0){
            console.log(dsplyName)
            submitBtn.disabled = false;
            localStorage.setItem('user',dsplyName);
            const request = new XMLHttpRequest();
            request.open("GET", `/dsplyname?name=${dsplyName}`,true);
            request.onload = ()=>{
                var response = JSON.parse(request.responseText)
                if(response.message){
                    submitBtn.disabled = true
                    const show = "Already Taken"
                    const content = temp({'response':show})
                    document.querySelector("#disclaimer").innerHTML = content;
                }
                else{
                    submitBtn.disabled = false;
                    const show = "Unique";
                    const content = temp({'response':show});
                    document.querySelector("#disclaimer").innerHTML = content;
                    localStorage.setItem('user',response.name_check);
                };
                
            };
            request.send()
        }
        else {
            submitBtn.disabled = true;
        };
    };
    
})