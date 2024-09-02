const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        required: true
    },
});

const Counter = mongoose.model('Counter', counterSchema);

const getSequenceNextValue = async (seqName) => {
    try {
        const counter = await Counter.findByIdAndUpdate(
            { "_id": seqName },
            { "$inc": { "seq": 1 } },
            { new: true }  // Return the updated document
        );

        if (counter) {
            return counter.seq;  // Return the updated sequence value
        } else {
            return null;  // Handle case where the document is not found
        }
    } catch (error) {
        throw error;  // Handle errors properly
    }
};

const insertCounter = async (seqName) => {
    const newCounter = new Counter({ _id: seqName, seq: 1 });
    try {
        const data = await newCounter.save();
        return data.seq;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    Counter,
    getSequenceNextValue,
    insertCounter,
};
