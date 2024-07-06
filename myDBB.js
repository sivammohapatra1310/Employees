import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = "mongodb+srv://sivammohapatra:User2004@cluster0.jlvlmmi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        console.log("Connected to MongoDB");

        // Access the database (if it doesn't exist, MongoDB will create it)
        const database = client.db("myNewDatabase");

        // Create a collection (if it doesn't exist, MongoDB will create it)
        const collection = database.collection("myNewCollection");

        // Insert a document into the collection
        const insertResult = await collection.insertOne({ name: "Alice", age: 25 });
        console.log(`A document was inserted with the _id: ${insertResult.insertedId}`);

        // Find a document in the collection
        const findResult = await collection.findOne({ name: "Alice" });
        console.log('Found a document in the collection:', findResult);

        // Update a document in the collection
        const updateResult = await collection.updateOne(
            { name: "Alice" }, 
            { $set: { age: 26 } }
        );
        console.log(`Updated ${updateResult.modifiedCount} document(s)`);

        // Delete a document in the collection
        const deleteResult = await collection.deleteOne({ name: "Alice" });
        console.log(`Deleted ${deleteResult.deletedCount} document(s)`);

        // List all collections in the database
        const collections = await database.collections();
        console.log('Collections in the database:');
        collections.forEach(coll => console.log(coll.collectionName));

        // List all databases in the server
        const adminDb = client.db().admin();
        const dbs = await adminDb.listDatabases();
        console.log('Databases in the server:');
        dbs.databases.forEach(db => console.log(db.name));

    } catch (err) {
        console.error(err);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}

run().catch(console.dir);
