const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Problem = require('./models/Problem');
const { Tag, PREDEFINED_TOPICS } = require('./models/Tag');

const clearVault = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa_vault');
    console.log('Connected to MongoDB...');

    const countBefore = await Problem.countDocuments();
    console.log(`Current problems in database: ${countBefore}`);

    const result = await Problem.deleteMany({});
    console.log(`Deleted ${result.deletedCount} problems.`);

    // Remove temporary/seed custom tags while ensuring predefined topics exist
    const customTagsResult = await Tag.deleteMany({ category: 'custom' });
    console.log(`Cleaned up ${customTagsResult.deletedCount} custom tags from seed data.`);

    // Re-ensure standard 30 predefined topics are present
    for (const name of PREDEFINED_TOPICS) {
      await Tag.findOneAndUpdate(
        { name },
        { name, category: 'predefined' },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`Predefined topics intact (${PREDEFINED_TOPICS.length} topics).`);

    const countAfter = await Problem.countDocuments();
    console.log(`Remaining problems in database: ${countAfter}`);

    console.log('\nDSA Vault database is now completely clean and ready for your personal problems!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing vault:', error);
    process.exit(1);
  }
};

clearVault();
