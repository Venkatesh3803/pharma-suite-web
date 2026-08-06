import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// ... (keep your existing setup logic above intact)

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client
      .connect()
      .then(connectedClient => {
        console.log(
          "🚀 [MongoDB]: Connection Pool successfully opened in Dev Mode.",
        );
        return connectedClient;
      })
      .catch(err => {
        console.error("❌ [MongoDB]: Dev Mode Connection Failure:", err);
        throw err;
      });
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().then(connectedClient => {
    console.log("🚀 [MongoDB]: Production Connection Instance mounted.");
    return connectedClient;
  });
}

export default clientPromise;
