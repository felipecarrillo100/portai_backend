import sqlite3, {Database} from "sqlite3";

class DatabaseObject {
    private _db: Database;

    constructor(filename?: string) {
        this._db = new sqlite3.Database(filename?filename : ':memory:');
    }

    destroy() {
        this._db.close();
    }


    get db(): Database {
        return this._db;
    }

    set db(value: Database) {
        this._db = value;
    }
}

export {
    DatabaseObject
}