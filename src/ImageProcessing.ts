import {Express} from "express";
import { Request, Response} from 'express';

import {AppConfig} from "./config";
import path from "path";

import sharp, {ExtendOptions, Sharp} from "sharp";


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

class ImageProcessing {
    static getInfoVerticalTile(req: Request, res: Response, data: InputData) {
        ImageProcessing.getInfoVerticalData(data).then(tileInfo => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(tileInfo));
        })
    }

    static getInfoTile(req: Request, res: Response, data: InputData) {
        ImageProcessing.getInfoData(data).then(tileInfo => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(tileInfo));
        })
    }

    static getInfoVerticalData(data: InputData) {
        return new Promise<VTilesInfo>((resolve)=>{
            sharp(data.filename).metadata().then( (metadata) => {
                if (metadata && metadata.width && metadata.height) {
                    const tileWidth = 256;
                    const tileHeight = metadata.height;
                    const totalHeight = tileHeight;
                    const totalWidth = Math.ceil(metadata.width / tileWidth) * tileWidth;
                    const info: VTilesInfo = {
                        width: metadata.width,
                        height: metadata.height,
                        tileWidth,
                        tileHeight,
                        totalWidth,
                        totalHeight,
                        rows: 1,
                        columns: totalWidth / tileWidth,
                        levelCount: 1,
                    }
                    resolve(info);
                }
            });
        })
    }

    static getInfoData(data: InputData) {
        return new Promise<VTilesInfo>((resolve)=>{
            sharp(data.filename,{ limitInputPixels: 30000 * 15000}).metadata().then( (metadata) => {
                if (metadata && metadata.width && metadata.height) {
                    const tileWidth = 256;
                    const tileHeight = tileWidth;

                    const aspectRatio = metadata.width / metadata.height;
                    const totalHeight = Math.ceil(metadata.height / tileHeight) * tileHeight;
                    const totalWidth =  Math.ceil(totalHeight * aspectRatio / tileWidth) * tileWidth;
                    const info: VTilesInfo = {
                        width: metadata.width,
                        height: metadata.height,
                        tileWidth,
                        tileHeight: tileWidth,
                        aspectRatio,
                        aspectRatioWidth: totalHeight * aspectRatio,
                        totalWidth,
                        totalHeight,
                        rows: totalHeight / tileHeight,
                        columns: totalWidth  / tileWidth,
                        levelCount: 1,
                    }
                    resolve(info);
                }
            });
        })
    }

    static addRoutes(app: Express) {

        app.get("/tiff", ((req, res) => {
            const filename = AppConfig.images.tiff + path.sep +req.query.filename;
            const service = req.query.service ? req.query.service as string : "GetVTile";
            const format = req.query.format ? req.query.format as string : "jpg";
            const x = req.query.x ? Number(req.query.x)  : 0;
            const y = req.query.y ? Number(req.query.y) : 0;
            const z = req.query.z ? Number(req.query.z) : 0;
            const data: InputData = {
                filename,
                service,
                format,
                x,
                y,
                z
            }
            switch (service) {
                case "GetInfo":
                    ImageProcessing.getInfoVerticalTile(req, res, data);
                    break;
                case "GetFull":
                    ImageProcessing.getFull(req, res, data);
                    break;
                case "GetThumb":
                    ImageProcessing.getThumb(req, res, data);
                    break;
                case "GetVTile":
                    ImageProcessing.getVTile(req, res, data);
                    break;
            }
        }))

        app.get("/drone", ((req, res) => {
            const filename = AppConfig.images.drone + path.sep +req.query.filename;
            const service = req.query.service ? req.query.service as string : "GetVTile";
            const format = req.query.format ? req.query.format as string : "jpg";
            const x = req.query.x ? Number(req.query.x)  : 0;
            const y = req.query.y ? Number(req.query.y) : 0;
            const z = req.query.z ? Number(req.query.z) : 0;
            const data: InputData = {
                filename,
                service,
                format,
                x,
                y,
                z
            }
            switch (service) {
                case "GetInfo":
                    ImageProcessing.getInfoVerticalTile(req, res, data);
                    break;
                case "GetFull":
                    ImageProcessing.getFull(req, res, data);
                    break;
                case "GetThumb":
                    ImageProcessing.getThumb(req, res, data);
                    break;
                case "GetVTile":
                    ImageProcessing.getVTile(req, res, data);
                    break;
            }

        }))
    }

    private static getThumb(req: Request, res: Response, data: InputData) {
        sharp(data.filename).metadata().then(metadata=> {
            if (metadata.height) {
                const height = Math.round(metadata.height /10);
                sharp(data.filename).toFormat('jpeg').resize({height}).toBuffer().then((buffer) => {
                    if(buffer) {
                        res.writeHead(200, {
                            'Content-Type': "image/jpeg",
                            'Content-Length': buffer.length
                        });
                        res.end(buffer);
                    }
                }); // save
            }
        });
    }

    private static getFull(req: Request, res: Response, data: InputData) {
        ImageProcessing.getInfoVerticalData(data).then(tileInfo=> {
            if (tileInfo.height && tileInfo.width) {
                const height = tileInfo.height;
                const width = tileInfo.width ;
                sharp(data.filename).extend({
                    right: tileInfo.totalWidth-tileInfo.width,
                    bottom: tileInfo.totalHeight-tileInfo.height,
                    background: "#343034"
                }).toFormat('jpeg').toBuffer().then((buffer) => {
                    if(buffer) {
                        res.writeHead(200, {
                            'Content-Type': "image/jpeg",
                            'Content-Length': buffer.length
                        });
                        res.end(buffer);
                    }
                }); // save
            }
        });
    }
/*
    private static getTile(req: Request, res: Response, data: InputData) {
        ImageProcessing.getFullData(data).then(tileInfo => {
            if (tileInfo.image && typeof data.x !== "undefined" && typeof data.y !== "undefined" && typeof data.z !== "undefined") {
                tileInfo.image.crop(data.x * tileInfo.tileWidth,data.y * tileInfo.tileHeight, tileInfo.tileWidth, tileInfo.tileHeight ).
                getBufferAsync(Jimp.MIME_JPEG).then((buffer) => {
                    res.writeHead(200, {
                        'Content-Type': "image/jpeg",
                        'Content-Length': buffer.length
                    });
                    res.end(buffer);
                });
            }
        })
    }
*/
    private static getVTile(req: Request, res: Response, data: InputData) {
        const returnBuffer = (buffer: Buffer) => {
            if(buffer) {
                res.writeHead(200, {
                    'Content-Type': "image/jpeg",
                    'Content-Length': buffer.length
                });
                res.end(buffer);
            }
        }

        ImageProcessing.getInfoVerticalData(data).then(tileInfo=> {
            if (tileInfo.height && tileInfo.width && typeof data.x !== "undefined" && typeof data.y !== "undefined") {
                if (data.x<tileInfo.columns && data.y<tileInfo.rows) {
                    if (data.x===tileInfo.columns-1) {
                        const right = tileInfo.totalWidth - tileInfo.width;
                        const bottom = tileInfo.totalHeight - tileInfo.height;
                        sharp(data.filename)
                            .extract({
                                left: tileInfo.tileWidth*data.x, top: data.y*tileInfo.tileHeight,
                                width: tileInfo.tileWidth - right, height: tileInfo.tileHeight - bottom
                            })
                            .extend({
                                right,
                                bottom,
                                background: "#343034"
                            })
                            .toFormat('jpeg').toBuffer().then((buffer) => returnBuffer(buffer));
                    } else {
                        sharp(data.filename)
                            .extract({  left: tileInfo.tileWidth*data.x, top: data.y*tileInfo.tileHeight,width: tileInfo.tileWidth, height: tileInfo.tileHeight})
                            .toFormat('jpeg').toBuffer().then((buffer) => returnBuffer(buffer));
                    }

                } else {
                    const error = {
                        error: "Out of range"
                    }
                    res.setHeader('Content-Type', 'application/json');
                    res.status(400).end(JSON.stringify(error));
                }
            }
        });
    }

}

export {
    ImageProcessing
}