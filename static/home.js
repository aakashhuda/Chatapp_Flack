const channeltemp = Handlebars.compile(document.querySelector("#channeladd").innerHTML)
const loadtemp = Handlebars.compile(document.querySelector("#loaded").innerHTML)
const namecontentt = Handlebars.compile(document.querySelector("#chan_name").innerHTML)
const msg = Handlebars.compile(document.querySelector("#socketmsg").innerHTML)
const onlinetemp = Handlebars.compile(document.querySelector("#online").innerHTML)
const entermsg = Handlebars.compile(document.querySelector("#entermsg").innerHTML)
let users_list = [];
document.addEventListener('DOMContentLoaded',()=>{
    if(!localStorage.getItem('channel_name'))
        localStorage.setItem('channel_name','General');
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    userLoad(socket);
    setInterval(checkUser,10000);
    if(!localStorage.getItem('pm_name')){
        load(localStorage.getItem('channel_name'),socket);
    }
    else {
        pM(localStorage.getItem('pm_name'))
    };
    document.querySelector("#logout").onclick = ()=>{
        localStorage.setItem('channel_name','');
        localStorage.setItem('user','');
        localStorage.setItem('pm_name','');
    };
    socket.on('connect', ()=>{
        document.querySelectorAll(".channel-link").forEach((link)=>{
            link.onclick = ()=>{
                localStorage.setItem('pm_name','');
                localStorage.setItem('channel_name',link.dataset.value);
                load(localStorage.getItem('channel_name'),socket);
                socket.emit("entermsg", {"name":localStorage.getItem('user'),"chnl":localStorage.getItem('channel_name')});
            };
        });
        document.querySelector('#creatBtn').onclick = ()=>{
            const channelName = prompt('Enter Channel Name');
            console.log(channelName)
            if(channelName == null || channelName == ''){
                alert("No Channel Created")
            }
            else {
                localStorage.setItem('channel_name',channelName);
                socket.emit('create',{"channelName":channelName});
            }
        };
        document.querySelector("#sendmsg").onclick = ()=>{
            console.log("Connected");
            if(!localStorage.getItem("channel_name")){
                var roomname = localStorage.getItem("pm_name")
                var text = document.querySelector("#msg").value;
                var time = new Date();
                socket.emit("sendmessage", {"roomname":roomname,"text":text, "time":time});
                document.querySelector("#msg").value = '';
                return false;
            }
            else{
                var roomname = localStorage.getItem('channel_name');
                var text = document.querySelector("#msg").value;
                var time = new Date();
                socket.emit("sendmessage", {"roomname":roomname,"text":text, "time":time});
                document.querySelector("#msg").value = '';
                return false;
            }; 

        };
    }); 
    socket.on("showentermsg", (data)=>{
        if(data.roomname === localStorage.getItem('channel_name')){
            const content = entermsg({"name":data.name});
            document.querySelector('#socketmsgnow').innerHTML +=content;
        };
    });
    socket.on("submit",(data)=>{
        const newChannel = data.channel;
        console.log(newChannel);
        const content = channeltemp({'newChannel':newChannel});
        document.querySelector("#list").innerHTML+=content;
        if(data.usr===localStorage.getItem('user')){
            document.querySelector("#socketmsgnow").innerHTML='';
            load(newChannel,socket);
            
        };
        
    });
    socket.on("showmsg",(data)=>{
        if(localStorage.getItem('channel_name') === data.roomname){
            var flag = false;
            if(data.nick === localStorage.getItem('user')){
                flag = true;
            };
            var content = msg({"nick":data.nick,"txtmsg":data.txtmsg,"clock":data.clock,"flag":flag});
            document.querySelector("#socketmsgnow").innerHTML +=content;
            document.querySelectorAll(".delete").forEach((dlt)=>{
                dlt.onclick = ()=>{
                    dltMessage(dlt.dataset.name,dlt.dataset.text,dlt.dataset.time,socket);
                };
            });
        }
        else if(localStorage.getItem('pm_name') === data.roomname || localStorage.getItem('user') === data.roomname){
            var flag = false;
            if(data.nick === localStorage.getItem('pm_name') || data.nick === localStorage.getItem('user')){
                if(data.nick === localStorage.getItem('user')){
                    flag = true;
                };
                var content = msg({"nick":data.nick,"txtmsg":data.txtmsg,"clock":data.clock,"flag":flag});
                document.querySelector("#socketmsgnow").innerHTML +=content;
            }
            else{
                return
            };
            document.querySelectorAll(".delete").forEach((dlt)=>{
                dlt.onclick = ()=>{
                    dlt.parentElement.remove();
                };
            });
        }
        else{
            return
        };
    });
    socket.on("deleted",(data)=>{
        alert(`${data.message}`);
        document.querySelector("#socketmsgnow").innerHTML = "";
        load(localStorage.getItem('channel_name'),socket);
        
    });
    socket.on("online",(data)=>{
        var users_online = []
        for(let i = 0; i < data.users_online.length; i++){
            if(data.users_online[i]!==localStorage.getItem('user')){
                users_online.push(data.users_online[i]);
            }
            else {
                continue
            };
        };
        const content = onlinetemp({"users_online":users_online});
        document.querySelector("#userlist").innerHTML = content;
        document.querySelectorAll(".user-link").forEach((link)=>{
            link.onclick = ()=>{
                localStorage.setItem('pm_name',link.dataset.value);
                pM(localStorage.getItem('pm_name'));
            };
        });
    });
    
 
});
function load(chnName,socket){
    let huda = chnName;
    localStorage.setItem('channel_name',chnName)
    document.querySelector("#exampleFormControlTextarea").innerHTML='';
    socket.emit("entermsg", {"name":localStorage.getItem('user'),"chnl":localStorage.getItem('channel_name')});
    console.log(huda);
    messages = [];
    const request = new XMLHttpRequest();
    request.open("GET", `/load?name=${chnName}`);
    request.onload = ()=>{
        const contentt = namecontentt({"name":chnName});
        document.querySelector("#Channelname").innerHTML = contentt;
        const data = JSON.parse(request.responseText);
        if(data.msgList){
            for(let i = 0; i < data.msgList.length; i++){
                var nick = data.msgList[i][0];
                var text = data.msgList[i][1];
                var clock = data.msgList[i][2];
                var nameFlag = false;
                if(nick===localStorage.getItem('user')){
                    nameFlag = true;
                };
                const content = msg({"nick":nick,"txtmsg":text,"clock":clock,"flag":nameFlag});
                document.querySelector("#exampleFormControlTextarea").innerHTML += content;
            };
        }
        else{
            const content = msg({"nick":null,"txtmsg":null,"clock":null});
            document.querySelector("#exampleFormControlTextarea").innerHTML = content;
        };
        document.querySelectorAll(".delete").forEach((dlt)=>{
            dlt.onclick = ()=>{
                dltMessage(dlt.dataset.name,dlt.dataset.text,dlt.dataset.time,socket);
            };
        });

    };
    request.send();
};
function pM(pmname){
    document.querySelector("#exampleFormControlTextarea").innerHTML='';
    localStorage.setItem('channel_name','');
    const contentt = namecontentt({"name":pmname});
    document.querySelector("#Channelname").innerHTML = contentt;
};

function dltMessage(name,text,time,socket){
    socket.emit("deletemessage",{"name":name,"text":text,"time":time,"roomname":localStorage.getItem('channel_name')});
};

function userLoad(socket){
    socket.emit("loadusers");
};

function checkUser(){
    const request = new XMLHttpRequest();
    request.open("GET", "/checkuser");
    request.onload = ()=>{
        const data = JSON.parse(request.responseText);
        var users_online = []
        for(let i = 0; i < data.users_online.length; i++){
            if(data.users_online[i]!==localStorage.getItem('user')){
                users_online.push(data.users_online[i]);
            }
            else {
                continue
            };
        };
        const content = onlinetemp({"users_online":users_online});
        document.querySelector("#userlist").innerHTML = content;
        document.querySelectorAll(".user-link").forEach((link)=>{
            link.onclick = ()=>{
                localStorage.setItem('pm_name',link.dataset.value);
                pM(localStorage.getItem('pm_name'));
            };
        });
    };
    request.send();
};