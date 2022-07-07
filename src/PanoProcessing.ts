import {Express} from "express";
import {Request, Response} from 'express';

import {AppConfig} from "./config";
import path from "path";

import sharp, {ExtendOptions, Sharp} from "sharp";
import * as fs from "fs";


interface InputData {
    filename: string;
    service: string;
    format: string;
    x?: number;
    y?: number;
    z?: number;
}

interface PanoTilesInfo {
    levelCount: number;
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    level0Rows: number;
    level0Columns: number;
    totalWidth: number;
    totalHeight: number;
}

const levelCount = 4;
const tileSize = 256;
const level0Columns = 16;
const level0Rows = 8;

const totalWidth = tileSize * level0Columns * powerOfTwo(levelCount-1);
const totalHeight = tileSize * level0Rows * powerOfTwo(levelCount-1);

class PanoProcessing {
    static getInfoTile(req: Request, res: Response, data: InputData) {
        PanoProcessing.getInfoData(data).then(tileInfo => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(tileInfo));
        })
    }

    static getInfoData(data: InputData) {
        return new Promise<PanoTilesInfo>((resolve) => {
            sharp(data.filename, {limitInputPixels: 30000 * 15000}).metadata().then((metadata) => {
                if (metadata && metadata.width && metadata.height) {
                    const tileWidth = tileSize;
                    const tileHeight = tileSize;

                    const info: PanoTilesInfo = {
                        width: metadata.width,
                        height: metadata.height,
                        tileWidth,
                        tileHeight,
                        totalWidth,
                        totalHeight,
                        level0Rows,
                        level0Columns,
                        levelCount: levelCount,
                    }
                    resolve(info);
                }
            });
        })
    }

    static addRoutes(app: Express) {
        app.get("/pano/features.json", ((req, res) => {
            fs.readFile("resources/json/features.json", (err, data) => {
                if (err) throw err;
                let features = JSON.parse(data as any);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(features));
            });
        }));

        app.get("/pano", ((req, res) => {
            const filename = AppConfig.images.panoramic + path.sep + req.query.filename;
            const service = req.query.service ? req.query.service as string : "GetVTile";
            const format = req.query.format ? req.query.format as string : "jpg";
            const x = req.query.x ? Number(req.query.x) : 0;
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
                    PanoProcessing.getInfoTile(req, res, data);
                    break;
                case "GetFull":
                    PanoProcessing.getFull(req, res, data);
                    break;
                case "GetThumb":
                    PanoProcessing.getThumb(req, res, data);
                    break;
                case "GetTile":
                    PanoProcessing.getTile(req, res, data);
                    break;
            }
        }))

    }

    private static getThumb(req: Request, res: Response, data: InputData) {
        sharp(data.filename, {limitInputPixels: 30000 * 15000}).metadata().then(metadata => {
            if (metadata.height) {
                const height = Math.round(metadata.height / 10);
                sharp(data.filename, {limitInputPixels: 30000 * 15000}).toFormat('jpeg').resize({height}).toBuffer().then((buffer) => {
                    if (buffer) {
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
        PanoProcessing.getInfoData(data).then(tileInfo => {
            if (tileInfo.height && tileInfo.width) {
                sharp(data.filename, {limitInputPixels: 30000 * 15000}).toFormat('jpeg').toBuffer().then((buffer) => {
                    if (buffer) {
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

    private static getTile(req: Request, res: Response, data: InputData) {
        const returnBuffer = (buffer: Buffer) => {
            if (buffer) {
                res.writeHead(200, {
                    'Content-Type': "image/jpeg",
                    'Content-Length': buffer.length
                });
                res.end(buffer);
            }
        }

        PanoProcessing.getInfoData(data).then(tileInfo => {
            if (tileInfo.height && tileInfo.width && typeof data.x !== "undefined" && typeof data.y !== "undefined" && typeof data.z !== "undefined") {
                const factor = powerOfTwo(tileInfo.levelCount - data.z - 1);
                const f = powerOfTwo(data.z);
                if (data.z < tileInfo.levelCount && data.x < tileInfo.level0Columns*f && data.y < tileInfo.level0Rows * f ) {
                    const dataDebug = {
                        error: "In range",
                        x: data.x,
                        y: data.y,
                        z: data.z,
                        factor,
                        height: 1.0 * tileInfo.totalHeight / factor,
                        heightof256: 1.0 * tileInfo.totalHeight / factor / 256,
                        tileInfo
                    }
                    // console.log(dataDebug);
                    sharp(data.filename, {limitInputPixels: 30000 * 15000})
                        .resize({height: tileInfo.totalHeight / factor})
                        .extract({
                            left: tileInfo.tileWidth * data.x, top: data.y * tileInfo.tileHeight,
                            width: tileInfo.tileWidth, height: tileInfo.tileHeight
                        })
                        .toFormat('jpeg').toBuffer().then((buffer) => returnBuffer(buffer));
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

function powerOfTwo(n: number) {
    let v =  1;
    for (let i=0; i<n; i++) {
        v *= 2;
    }
    return v;
}

export {
    PanoProcessing
}