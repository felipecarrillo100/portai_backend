import express from "express";
import {StaticTilesServer} from "./StaticTilesServer";
import proxy from "express-http-proxy";
import {ImageProcessing} from "./ImageProcessing";
import {PanoProcessing} from "./PanoProcessing";
import {PortSurveillance} from "./PortSurveillance";
import {DatabaseObject} from "./Database/DatabaseObject";
import {AnnotationsController} from "./Database/AnnotationsController";

const app = express();
app.use(express.json());

const myDatabase = new DatabaseObject('portai.db');
const annotationsController = new AnnotationsController(myDatabase);

// const annotationsRepository = new AnnotationsRepository(myDatabase);
// const annotation = new Annotation();
// annotation.name = "Subzero";
// annotation.geometry = {test: 123};
// annotation.properties = { title:"Title" , description:"Abc"};
// // annotationsRepository.add(annotation);
// annotationsRepository.replace(annotation);
// annotationsRepository.get(1).then((a)=>{
//     console.log(a);
// });
// annotationsRepository.query().then(annotations=>{
//     console.log(annotations)
// });

StaticTilesServer.addRoutes(app);
ImageProcessing.addRoutes(app);
PanoProcessing.addRoutes(app);
PortSurveillance.addRoutes(app);
annotationsController.addRoutes(app);


app.use('/resources', express.static('./resources'));
app.use('/', proxy('http://localhost:3000/'));


const PORT = 5000;
app.listen(PORT, ()=> {
    console.log("Server running at port: " + PORT)
})