const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  subscriberName: String,
  email: String,
  planSubscribed: String,
  amount: String
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
