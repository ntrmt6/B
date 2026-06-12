import { config } from 'dotenv';
config();
import { getDatabase, disconnectMongo } from '../db/mongo';

async function createVectorIndex() {
  console.log('\n🚀 Initiating Vector Search Index creation...\n');

  try {
    const db = await getDatabase();
    const collection = db.collection('product_embeddings');

    // The exact JSON configuration required by MongoDB Atlas
    const indexConfig = {
      name: "vector_index",
      type: "vectorSearch",
      definition: {
        fields: [
          {
            numDimensions: 3072,
            path: "embedding",
            similarity: "cosine",
            type: "vector"
          },
          {
            path: "tenantId",
            type: "filter"
          }
        ]
      }
    };

    // Send the command to Atlas to build the index
    const result = await collection.createSearchIndex(indexConfig);
    
    console.log(`✅ Successfully triggered index build. Index Name: ${result}`);
    console.log('⏳ Note: It will take a minute or two for Atlas to build the index in the background.');

  } catch (error) {
    console.error('❌ Failed to create index. Error:', error);
  } finally {
    await disconnectMongo();
    console.log('\n🏁 Database connection closed.\n');
  }
}

createVectorIndex();
