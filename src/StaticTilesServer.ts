import {Express} from "express";
import {AppConfig} from "./config";
import path from "path";
import sharp from "sharp";

class StaticTilesServer {
    static addRoutes(app: Express) {
        app.get("/hello", ((req, res) => {
            res.send("Hello world!");
        }))

        app.get("/static-tiles/(*)", ((req, res) => {

            const pathStr = req.params[0] as string;
            const find = "/";
            const folder = pathStr.replace(new RegExp(find, 'g'), path.sep);

            const filename = AppConfig.tiles.panoramic + path.sep +folder;


            sharp(filename).toBuffer().then((buffer) => {
                res.writeHead(200, {
                    'Content-Type': "image/jpeg",
                    'Content-Length': buffer.length
                });
                res.end(buffer);
            }).catch((err)=>{
                res.writeHead(404, {
                    'Content-Type': "text/plain"
                });
                res.end("404. Not found");
            });
        }))
    }
}

export {
    StaticTilesServer
}