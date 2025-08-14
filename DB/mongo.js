const { MongoClient } = require('mongodb');

//mongo server
const uri = 'mongodb://127.0.0.1:27017';
//db name
const dbName = 'proj2024MongoDB';

//client obj
const client = new MongoClient(uri, { ignoreUndefined: true });
let db;

//connect to db
async function connectMongo() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log('MongoDB connected');
  }
  return db;
}

//get instance 
function getDb() {
  return db;
}


module.exports = { connectMongo, getDb };
