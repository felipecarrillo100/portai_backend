import {DatabaseObject} from "./DatabaseObject";
import {Database} from "sqlite3";
import {Annotation, AnnotationProperties} from "./Annotation";

const TableName = "Annotations";

const sqlCreateTable =
    `CREATE TABLE IF NOT EXISTS ${TableName} (` +
    "   id INTEGER NOT NULL PRIMARY KEY," +
    "   name VARCHAR(128) NOT NULL UNIQUE," +
    "   geometry VARCHAR(8162)," +
    "   properties VARCHAR(1024)" +
    ");"

const sqlInsert = `INSERT INTO ${TableName} (name, geometry, properties) VALUES(?, ?, ?);`
const sqlSelectByID = `SELECT * FROM ${TableName} WHERE id=?;`
const sqlSelectByText = `SELECT * FROM ${TableName} WHERE name LIKE ?`
const sqlUpdatebyID = `UPDATE ${TableName} SET name=?, geometry=?, properties=? WHERE id=?`;

class AnnotationsRepository {
    private db: Database;

    constructor(databaseObject:DatabaseObject) {
        this.db = databaseObject.db;
        this.init();
    }

    init() {
        this.createTable();
    }

    private createTable() {
        const stmt = this.db.prepare(sqlCreateTable);
        stmt.run();
        stmt.finalize((err)=>{
            if (err) console.log(err);
        })
    }

    public add(annotation: Annotation) {
        return new Promise((resolve, reject)=>{
            this.db.run(sqlInsert, [annotation.getName(), JSON.stringify(annotation.getGeometry()), JSON.stringify(annotation.getProperties() )],(err)=>{
                if (err) {
                    console.log(err);
                    reject();
                    return;
                }
                resolve(true);
            });
        })
    }

    public get(annotationID: number) {
        return new Promise<Annotation>((resolve, reject)=> {
            this.db.get(sqlSelectByID, [annotationID], (err, row) => {
                if (err) {
                    reject(500);
                } else {
                    if (row) {
                        const annotation = new Annotation();
                        annotation.setId(row.id);
                        annotation.setName(row.name);
                        annotation.setGeometry(JSON.parse(row.geometry));
                        annotation.setProperties(JSON.parse(row.properties));
                        resolve(annotation);
                    } else {
                        reject(400);
                    }
                }
            });
        })
    }

    public query(search?: string) {
        return new Promise<Annotation[]>((resolve, reject)=> {
            const searchText = search ? `%${search}%` : "%%";
            this.db.all(sqlSelectByText, [searchText], (err, rows) => {
                if (err) {
                    console.log(err);
                    reject();
                    return;
                }
                const annotations = rows.map(row => {
                    const annotation = new Annotation();
                    annotation.setId(row.id);
                    annotation.setName(row.name);
                    annotation.setGeometry(JSON.parse(row.geometry));
                    annotation.setProperties(JSON.parse(row.properties));
                    return annotation
                })
                resolve(annotations);
            });
        })
    }

    public replace(annotation: Annotation) {
        return new Promise((resolve, reject)=>{
            if (annotation.getId()) {
                this.db.run(sqlUpdatebyID, [annotation.getName(), JSON.stringify(annotation.getGeometry()), JSON.stringify(annotation.getProperties() ), annotation.getId()], (err)=>{
                    if (err) {
                        console.log(err);
                        reject();
                        return;
                    }
                    resolve(true);
                })
            } else {
                reject();
            }
        })

    }

    public update(annotation: Annotation) {
        return new Promise((resolve, reject)=> {
            if (annotation.getId()) {
                this.get(annotation.getId() as number).then((oldAnnotation) => {
                    if (annotation.getName()) oldAnnotation.setName(annotation.getName());
                    if (annotation.getGeometry()) oldAnnotation.setGeometry(annotation.getGeometry());
                    if (annotation.getProperties()) {
                        if (annotation.getProperties().title) oldAnnotation.getProperties().title = annotation.getProperties().title;
                        if (annotation.getProperties().description) oldAnnotation.getProperties().description = annotation.getProperties().description;
                        if (annotation.getProperties().meta) oldAnnotation.getProperties().meta = annotation.getProperties().meta;
                        if (annotation.getProperties().video) oldAnnotation.getProperties().meta = annotation.getProperties().video;
                        if (annotation.getProperties().picture) oldAnnotation.getProperties().meta = annotation.getProperties().picture;
                    }
                    this.db.run(sqlUpdatebyID, [oldAnnotation.getName(), JSON.stringify(oldAnnotation.getGeometry()), JSON.stringify(oldAnnotation.getProperties()), annotation.getId()], (err) => {
                        if (err) {
                            console.log(err);
                            reject();
                            return;
                        }
                        resolve(true);
                    })
                })
            } else {
                reject();
            }
        })
    }


}

export {
    AnnotationsRepository
}