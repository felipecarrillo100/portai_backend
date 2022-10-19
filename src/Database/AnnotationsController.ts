import {Express} from "express";
import {DatabaseObject} from "./DatabaseObject";
import {AnnotationsRepository} from "./AnnotationsRepository";
import {Annotation} from "./Annotation";

class AnnotationsController {
    private annotationsRepository: AnnotationsRepository;

    constructor(databaseObject:DatabaseObject) {
        this.annotationsRepository = new AnnotationsRepository(databaseObject);
    }

    addRoutes(app: Express, ) {
        app.get("/annotations", ((req, res) => {
            this.annotationsRepository.queryLike().then((annotations) => {
                res.json(annotations)
            }).catch(()=>{
                res.status(500);
                res.json([])
            })
        }))

        app.get("/annotations/:dataset", ((req, res) => {
            const dataset = req.params.dataset;
            this.annotationsRepository.query(dataset).then((annotations) => {
                res.json(annotations)
            }).catch(()=>{
                res.status(500);
                res.json([])
            })
        }))

        app.get("/annotations/:dataset/:id", ((req, res) => {
            const id = Number(req.params.id);
            this.annotationsRepository.get(id).then((annotations) => {
                res.json(annotations)
            }, (code: number)=>{
                res.status(code);
                res.json([])
            })
        }))

        app.post("/annotations/:dataset", ((req, res) => {
            const dataset = req.params.dataset;
            const annotation = new Annotation();
            annotation.setDataset(dataset);
            annotation.setGeometry(req.body.geometry);
            annotation.setProperties(req.body.properties);
            this.annotationsRepository.add(annotation).then(()=>{
                res.status(200);
                res.json([]);
            }).catch((err)=>{
                res.status(409);
                res.json([]);
            });
        }))

        app.put("/annotations/:dataset", ((req, res) => {
            const dataset = req.params.dataset;
            const annotation = new Annotation();
            annotation.setId(req.body.id);
            annotation.setDataset(dataset);
            annotation.setGeometry(req.body.geometry);
            annotation.setProperties(req.body.properties);
            this.annotationsRepository.replace(annotation).then(()=>{
                res.status(200);
                res.json([]);
            }, (err)=>{
                res.status(409);
                res.json([]);
            } );
        }))

        app.patch("/annotations/:dataset", ((req, res) => {
            const dataset = req.params.dataset;
            const annotation = new Annotation();
            annotation.setId(req.body.id);
            annotation.setDataset(dataset);
            annotation.setGeometry(req.body.geometry);
            annotation.setProperties(req.body.properties);
            this.annotationsRepository.update(annotation).then(()=>{
                res.status(200);
                res.json([]);
            }).catch((err)=>{
                res.status(409);
                res.json([]);
            });
        }))
    }
}

export {
    AnnotationsController
}