const mongoose = require("mongoose");

const Schema = mongoose.Schema({
  name: String,
  songs: [mongoose.Types.ObjectId],
  dateOfBirth: Date,
  Albums: [mongoose.Types.ObjectId]
});

const Artist = mongoose.model("Artist", Schema);

module.exports.Artist = Artist;
module.exports.ArtistSchema = Schema;
