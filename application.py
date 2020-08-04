import os

from flask import Flask,render_template,request,json,jsonify,session,redirect,url_for
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)
channels = {"General":[]}
users = {}
users_online = []
class Message:
    def __init__(self,name,text,time):
        self.name = name
        self.text = text
        self.time = time
    def msg(self):
        return [self.name,self.text,self.time]



@app.route("/")
def index():
    if "dsply_name" in session:
        name_name = session["dsply_name"]
        return render_template("home.html", name=name_name, channels = channels)
    return render_template('index.html')
@app.route('/home', methods = ["POST","GET"])
def home():
    if request.method == "POST":
        name = request.form.get("name")
        session["dsply_name"] = name
        if name not in users:
            users[name] = []
        users_online.append(name)
        return render_template("home.html", name=name, channels = channels)
    else:
        if "dsply_name" in session:
            name = session["dsply_name"]
            return render_template("home.html", name=name, channels=channels)
        return redirect(url_for('index'))
@app.route('/dsplyname')
def dsplyname():
    name_check = request.args.get("name")
    for user in users_online:
        if name_check == user:
            return jsonify({"message":True})
    return jsonify({"message":False,"name_check":name_check})
    
@app.route("/logout", methods = ["GET"])
def logout():
    if "dsply_name" in session:
        name = session["dsply_name"]
        session.pop('dsply_name')
        del users[name]
        users_online.remove(name)
        return render_template("index.html")
    return redirect(url_for('home'))
@app.route("/load", methods = ["GET"])
def load():
    setchannel = request.args.get("name")
    msgList=[]
    print(setchannel)
    for channel in channels:
        if channel == setchannel:
            for i in range(len(channels[setchannel])):
                print(channels[setchannel][i].msg())
                message = channels[setchannel][i].msg()
                msgList.append(message)
            return jsonify({"msgList":msgList})
        else:
            continue
    return jsonify({"msgList":False})
@app.route("/pm", methods = ["GET"])
def pm():
    name = request.args.get("pmname")
    list = []
    for user in users:
        if name == user:
            for i in range(len(users[name])):
                message = users[name][i].msg()
                list.append(message)
            return jsonify({"list":list})
        else:
            continue
    return jsonify({"list":False})

@app.route("/checkuser", methods = ["GET"])
def checkuser():
    return jsonify({"users_online":users_online})
@socketio.on("create")
def create(data):
    print(channels)
    channelName = data["channelName"]
    usr = session["dsply_name"]
    if not channelName in channels:
        channels[channelName] = []
        emit("submit", {"channel":channelName,"usr":usr}, broadcast = True)
    else:
        return redirect(url_for('home'))

@socketio.on("sendmessage")
def recievemessage(data):
    roomname = data["roomname"]
    text = data["text"]
    time = data["time"]
    name = session["dsply_name"]
    msg = Message(name,text,time)
    if roomname in  channels:
        channels[roomname].append(msg)
        length = len(channels[roomname])
        print(length)
        if length>99:
            channels[roomname].remove(channels[roomname][0])
        emit("showmsg",{"nick":name,"txtmsg":text, "clock":time,"roomname":roomname}, broadcast= True)
    else:
        emit("showmsg",{"nick":name,"txtmsg":text, "clock":time,"roomname":roomname}, broadcast= True)


@socketio.on("deletemessage")
def delete(data):
    name = data["name"]
    text = data["text"]
    time = data["time"]
    roomname = data["roomname"]
    print(name)
    count = 0
    for obj in channels[roomname]:
        if name == obj.name and text == obj.text and time == obj.time:
            channels[roomname].remove(channels[roomname][count])
        else:
            count +=1    
    emit("deleted",{"message":"Message have been deleted by"}, broadcast = True)

@socketio.on("loadusers")
def loadusers():
    emit("online", {"users_online":users_online}, broadcast = True)

@socketio.on("entermsg")
def entermsg(data):
    name = data["name"]
    rmname=data["chnl"]
    emit("showentermsg", {"name":name, "roomname":rmname}, broadcast = True)
