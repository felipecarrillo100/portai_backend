import {Express} from "express";

import {AppConfig} from "./config";

import sharp, {ExtendOptions, Sharp} from "sharp";
var exif = require('exif-reader');

import {Dirent, readdir} from "fs";
import * as fs from "fs";

const scale_ratio = 1;

interface InputData {
    filename: string;
    service: string;
    format: string;
    x?: number;
    y?: number;
    z?: number;
}

interface VTilesInfo {
    levelCount: number;
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    aspectRatio?: number;
    aspectRatioWidth?: number;
    rows: number;
    columns: number;
    totalWidth: number;
    totalHeight: number;
}

enum FileTypes{
    Directory = 1,
    File = 2,
    All = 3,
}

interface GPSData {
    "GPSVersionID": number[],
    "GPSLatitudeRef": string,
    "GPSLatitude":number[],
    "GPSLongitudeRef":string,
    "GPSLongitude":number[],
    "GPSAltitudeRef":number,
    "GPSAltitude":number
}

function ParseGPS(input: GPSData) {
    const lat = ConvertDMSToDD(input.GPSLatitude[0], input.GPSLatitude[1], input.GPSLatitude[2], input.GPSLatitudeRef);
    const lng = ConvertDMSToDD(input.GPSLongitude[0], input.GPSLongitude[1], input.GPSLongitude[2], input.GPSLatitudeRef);
    return {
        longitude: lng,
        latitude: lat,
        altitude:  input.GPSAltitude - input.GPSAltitudeRef,
    }
}

function ConvertDMSToDD(degrees:number, minutes:number, seconds:number, direction: string) {
    var dd = degrees + minutes/60 + seconds/(60*60);
    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
}

function myDesiredSharpFormat(folder: string, file: any) {
    return new Promise((resolve, reject) => {
        const filename =  folder + "/" + file.name
        sharp(filename).metadata().then((meta: any)=>{
            resolve({
                filename: file.name,
                gps: exif(meta.exif).gps,
                size: file.size
            })
        })
    })
}

class PortSurveillance {
    private static getDirectoryContent = (source: string, type: FileTypes) => {
        function myFilter(file: Dirent) {
            switch (type) {
                case FileTypes.All:
                    return true;
                case FileTypes.Directory:
                    return file.isDirectory();
                case FileTypes.File:
                    return !file.isDirectory();
            }
        }

        return new Promise((resolve: any, reject:any)=>{
            readdir(source, { withFileTypes: true }, (err, files) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(
                        files
                            .filter(file => myFilter(file))
                            .map(file => {
                                const stats = fs.statSync(source + "/"+ file.name);
                                const fileSizeInBytes = stats.size;
                                return ({
                                    name:file.name,
                                    directory: file.isDirectory(),
                                    file: file.isFile(),
                                    size: fileSizeInBytes
                            })})
                    )
                }
            })
        })
    }


    static addRoutes(app: Express) {
        app.get("/portInfo", ((req, res) => {
            const rootFolder = AppConfig.portPhotos.root ;
             PortSurveillance.getDirectoryContent(rootFolder, FileTypes.Directory).then((data)=>{
                 console.log(data);
                 res.json(data);
             }, (err)=>{
                 console.log("Error");
                 res.status(500)
                 res.json([]);
             })
        }))

        app.get("/portInfo/:dataset", ((req, res) => {
            const dataset = req.params.dataset;
            const folder = AppConfig.portPhotos.root + "/" + dataset;
            PortSurveillance.getDirectoryContent(folder, FileTypes.File).then((data)=>{
                console.log(data);
                res.json(data);
            }, (err)=>{
                console.log("Error");
                res.status(500)
                res.json([]);
            })
        }))

        app.get("/portInfo/:dataset/Orthomosaic", ((req, res) => {
            const dataset = req.params.dataset;
            const folder = AppConfig.portPhotos.root + "/" + dataset + "/Orthomosaic";
            PortSurveillance.getDirectoryContent(folder, FileTypes.File).then((data)=>{
                console.log(data);
                res.json(data);
            }, (err)=>{
                console.log("Error");
                res.status(500)
                res.json([]);
            })
        }))

        app.get("/portInfo/:dataset/Orthomosaic/:orthophoto", ((req, res) => {
            const dataset = req.params.dataset;
            const orthophoto = req.params.orthophoto;
            const filepath = AppConfig.portPhotos.root + "/" + dataset + "/Orthomosaic/" + orthophoto;
            sharp(filepath).metadata().then(metadata=> {
                if (metadata.height) {
                    const height = Math.round(metadata.height * scale_ratio);
                  //  sharp(filepath).flatten({ background: { r: 255, g: 255, b: 255, alpha:0 } }).toFormat('png').resize({height}).toBuffer().then((buffer) => {
                    sharp(filepath).toFormat('png').resize({height}).toBuffer().then((buffer) => {
                        if(buffer) {
                            res.writeHead(200, {
                                'Content-Type': "image/png",
                                'Content-Length': buffer.length
                            });
                            res.end(buffer);
                        }
                    }, (err)=>{
                        console.log("Error");
                        res.status(500)
                        res.json(err);
                    }); // save
                }
            }, (err)=>{
                console.log(err);
                res.status(400)
                res.json(err);
            });
        }))

        app.get("/portInfo/:dataset/:jsonfile.json", ((req, res) => {
            const dataset = req.params.dataset;
            const jsonfile = req.params.jsonfile;
            const jsonfilePath = AppConfig.portPhotos.root + "/" + dataset + "/" + jsonfile + ".json";

            fs.readFile(jsonfilePath, (err, data) => {
                if (err) {
                    console.log("Error");
                    res.status(500)
                    res.json([]);
                    return;
                };
                let jsonContent = JSON.parse(data as any);
                res.json(jsonContent);
            });
        }))

        app.get("/portInfo/:dataset/Geotagged_Photos", ((req, res) => {
            const dataset = req.params.dataset;
            const relativePath = "/" + dataset + "/Geotagged_Photos";
            const folder = AppConfig.portPhotos.root + relativePath;
            PortSurveillance.getDirectoryContent(folder, FileTypes.File).then((fileList: any)=>{
                const promises = fileList.map((f: any) => myDesiredSharpFormat(folder,  f)  );
                Promise.all(promises).then((meta: any[])=>{
                    const features = meta.map((a:any)=>{
                        const gps = ParseGPS(a.gps);
                        return {
                            "type": "Feature",
                            "id": a.filename,
                            "properties": {
                                "filename": "/Geotagged_Photos/" + a.filename
                            },
                            "geometry": {
                                "type": "Point",
                                "coordinates": [gps.longitude, gps.latitude, gps.altitude]
                            }
                        };
                    });
                    res.status(200)
                    res.header(
                        'Content-Type', "application/json"
                    );
                    res.json({
                        "type": "FeatureCollection",
                        "features": features
                    });
                }, ()=>{
                    console.log("Catch!")
                    console.log("Error");
                    res.status(500)
                    res.json([]);
                }).catch(()=>{
                    console.log("Error");
                    res.status(500)
                    res.json([]);
                    console.log("Catch!")
                });
            }, (err)=>{
                console.log("Error");
                res.status(500)
                res.json([]);
            })
        }))

        app.get("/portInfo/:dataset/Geotagged_Photos/:photo", ((req, res) => {
            const dataset = req.params.dataset;
            const dronePhoto = req.params.photo;
            const filepath = AppConfig.portPhotos.root + "/" + dataset + "/Geotagged_Photos/" + dronePhoto;
            sharp(filepath).metadata().then(metadata=> {
                if (metadata.height) {
                    const height = Math.round(metadata.height * 1);
                    sharp(filepath).toFormat('jpeg').resize({height}).toBuffer().then((buffer) => {
                        if(buffer) {
                            res.writeHead(200, {
                                'Content-Type': "image/jpeg",
                                'Content-Length': buffer.length
                            });
                            res.end(buffer);
                        }
                    }, (err)=>{
                        console.log("Error");
                        res.status(500)
                        res.json(err);
                    }); // save
                }
            }, (err)=>{
                console.log(err);
                res.status(400)
                res.json(err);
            });
        }))
    }


}

export {
    PortSurveillance
}