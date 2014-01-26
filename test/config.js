module.exports = {
    host: process.env['WERCKER_RETHINKDB_HOST'] || "localhost",
    port: process.env['WERCKER_RETHINKDB_PORT'] || 29015,
    authKey: ""
}
