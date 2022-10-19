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
            this.annotationsRepository.query().then((annotations) => {
                res.json(annotations)
            }).catch(()=>{
                res.status(500);
                res.json([])
            })
        }))

        app.get("/annotations/:id", ((req, res) => {
            const id = Number(req.params.id);
            this.annotationsRepository.get(id).then((annotations) => {
                res.json(annotations)
            }, (code: number)=>{
                res.status(code);
                res.json([])
            })
        }))

        app.post("/annotations", ((req, res) => {
            const annotation = new Annotation();
            annotation.setName(req.body.name);
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

        app.put("/annotations", ((req, res) => {
            const annotation = new Annotation();
            annotation.setId(req.body.id);
            annotation.setName(req.body.name);
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

        app.patch("/annotations", ((req, res) => {
            const annotation = new Annotation();
            annotation.setId(req.body.id);
            annotation.setName(req.body.name);
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