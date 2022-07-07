import express from "express";
import {StaticTilesServer} from "./StaticTilesServer";
import proxy from "express-http-proxy";
import {ImageProcessing} from "./ImageProcessing";
import {PanoProcessing} from "./PanoProcessing";
const app = express();

StaticTilesServer.addRoutes(app);
ImageProcessing.addRoutes(app);
PanoProcessing.addRoutes(app);

app.use('/resources', express.static('./resources'));
app.use('/', proxy('http://localhost:3000/'));


const PORT = 5000;
app.listen(PORT, ()=> {
    console.log("Server running at port: " + PORT)
})