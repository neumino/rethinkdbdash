module.exports = {
  debug: false,
  //TODO Switch to 'rethinkdb' before pushing
  cmd: '/home/michel/projects/rethinkdb-all/rethinkdb/build/debug/rethinkdb',//'rethinkdb';
  dataDir: 'rethinkdbdash_datadir',
  initialOffset: 180,
  feedQuery: 'r.db("rethinkdb")\n .table("server_status")\n .union(["feedSeparator"])\n .union(r.db("rethinkdb").table("server_status").changes())',
  numServers: 3
}


