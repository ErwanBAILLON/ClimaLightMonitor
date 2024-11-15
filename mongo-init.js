const rootUser = process.env.MONGO_INITDB_ROOT_USERNAME;
const rootPassword = process.env.MONGO_INITDB_ROOT_PASSWORD;
const backendUser = process.env.MONGO_BACKEND_USER;
const backendPassword = process.env.MONGO_BACKEND_PASSWORD;
const database = process.env.MONGO_DATABASE;

// Connect to the database
db = db.getSiblingDB(database);

db.createUser({
    user: backendUser,
    pwd: backendPassword,
    roles: [
        { role: "readWrite", db: database }
    ]
});

print(`User ${backendUser} created successfully for database ${database}!`);
