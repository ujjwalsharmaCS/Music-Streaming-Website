const mongoose = require("mongoose");

const Schema = mongoose.Schema({
  name: String,
  songs: [mongoose.Types.ObjectId],
  MainArtist: mongoose.Types.ObjectId,
  Artists: [mongoose.Types.ObjectId]
});

const Album = mongoose.model("Album", Schema);

module.exports.Album = Album;
module.exports.AlbumSchema = Schema;
