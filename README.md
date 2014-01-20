rethinkdbdash
=============

An attempt for another JavaScript driver for RethinkDB


What's different?
- Backtraces for driver error if possible
- Query is built as soon as the method is called and therefore don't need to be rebuilt everytime you execute `run`
- Promises
