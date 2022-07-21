
const express = require("express");
const app = express();

app.use("/js", express.static(__dirname+"/js"));
app.use("/styles", express.static(__dirname+"/styles"));
app.use("/images", express.static(__dirname+"/images"));


app.get('/',(req,res)=>{
   res.sendFile(__dirname+'/lobby.html')
})
app.get('/lobby',(req,res)=>{
  res.sendFile(__dirname+'/lobby.html')
})
app.get('/room.html', (req,res) => {
   res.sendFile(__dirname+"/room.html")
})

const handleListen = () => console.log('hihih0');
app.listen(3000, handleListen);

