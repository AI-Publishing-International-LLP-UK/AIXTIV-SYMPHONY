import { collections } from './firebaseConfig';
import { addDoc, batchCommit, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { convertPrismaToFirebase } from './models/firebaseSchema';
import winston from 'winston';

// Path to your SQL migration file
const migrationFilePath = path.join(
    __dirname,
    '../prisma/migrations/20240925060252_/migration.sql'
);

// Function to read SQL migration file
async function readMigrationFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Function to parse SQL data
function parseSQLData(sql: string): any {
    // Parse SQL data and convert to JSON format
    // This needs to be customized based on your SQL structure
    // Example: regex parsing for INSERT statements
}

// Main migration function
async function migrateData() {
    try {
        const sqlData = await readMigrationFile(migrationFilePath);
        const parsedData = parseSQLData(sqlData);

        // Create Firestore batch
        const batch = batchCommit();

        // Process and migrate data
        for (const tableName in parsedData) {
            if (collections[tableName]) {
                parsedData[tableName].forEach((record) => {
                    const firestoreDoc = convertPrismaToFirebase(record);
                    batch.set(doc(collections[tableName]), firestoreDoc);
                });
            }
        }

        // Commit the batch
        await batch.commit();
        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

// Run migration
migrateData();

