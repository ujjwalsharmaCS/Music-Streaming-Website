const mongoose = require("mongoose");

const Schema = mongoose.Schema({
  name: String,
  Main_Artist: mongoose.Types.ObjectId,
  artists: [mongoose.Types.ObjectId],
  song: mongoose.Types.ObjectId,
  album: mongoose.Types.ObjectId,
  Timesplayed: {
    type: Number,
    default: 0
  },
  cover: String
});

const Songs = mongoose.model("Song", Schema);

module.exports.Songs = Songs;
module.exports.SongSchema = Schema;
