const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: String,  // This will be the name of the collection (e.g., 'user', 'product')
  seq: { type: Number, default: 0 }  // Sequence number for that collection
});

const Counter = mongoose.model('Counter', counterSchema);

const getNextSequenceValue = async (sequenceName) => {
  try {
    const sequence = await Counter.findByIdAndUpdate(
      { _id: sequenceName },
      { $inc: { seq: 1 } },  // Increment the sequence number by 1
      { new: true, upsert: true }  // Create a new counter doc if it doesn't exist
    );
    return sequence.seq;
  } catch (error) {
    console.error(`Error while getting next sequence value for ${sequenceName}:`, error);
    throw error;  // Re-throw the error so it can be handled where this function is called
  }
};

module.exports = {
  Counter,
  getNextSequenceValue,
};
