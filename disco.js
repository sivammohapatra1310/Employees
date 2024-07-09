import mongoose from 'mongoose';
import express from 'express';

const app = express();
// const uri = "mongodb+srv://sivammohapatra:User2004@cluster0.jlvlmmi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = "mongodb+srv://sivammohapatra:User2004@cluster0.jlvlmmi.mongodb.net/mydatabase?retryWrites=true&w=majority";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const mageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  power_type: {
    type: String,
    required: true
  },
  mana_power: Number,
  health: Number,
  gold: Number
});

const Mage = mongoose.model('Man', mageSchema);

app.get('/ddd', async (req, res) => {
  const mage_1 = new Mage({
    name: "Takashi",
    power_type: 'Element',
    mana_power: "300",
    health: 1000,
    gold: 10000
  });

  try {
    await mage_1.save();
    console.log(mage_1);
    res.send('Mage saved successfully');
  } catch (err) {
    console.error("message", err.message);
    res.status(500).json({
      status: "false",
      message: err?.message || "something went wrong"
    })
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
