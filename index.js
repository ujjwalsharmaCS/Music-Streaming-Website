const express = require("express");

const mongoose = require("mongoose");

const config = require("config");

const fs = require("fs");

const stream = require("stream");

const gridfs = require("gridfs-stream");

const cluster = require("cluster")

mongoose.Promise = global.Promise;

const app = express();

const { Artist } = require("./Schemas/Artists");
const { Songs } = require("./Schemas/Song");
const { Album } = require("./Schemas/Album");

const dbpass = config.get("dbUserPassword");
const dbname = config.get("dbName");
const dbUser = config.get('dbUser')
const db ="mongodb+srv://"+ dbUser +":" +dbpass + "@audiostreamingbasics.dvxnq.mongodb.net/" + dbname + "?retryWrites=true&w=majority"




app.use(express.static("public"));


app.use((req, res, next) => {
  if (cluster.isWorker) {
    console.log(`Worker ${cluster.worker.id} recieved request`);
  } else {
    console.log("Master recieved");
  }
  next();
});

mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });

gridfs.mongo = mongoose.mongo;

const connection = mongoose.connection;

connection.on("error", console.error.bind("Connection Error"));

connection.once("open", () => {
  const grid = gridfs(connection.db);


  app.get("/songs", async (req, res) => {
    let song;
    try {
      song = await Songs.find();
    } catch (err) {
      console.log(err.message);
    }
    let arr = [];
    for (let sn in song) {
      // console.log(song[sn]);
      arr.push(song[sn].name);
    }
    res.send(arr);
  });

  const artistName=''
  const albumName = ''

 
// *************************************************. Only for uploading .*************************************************

  // app.get("/addArtist", async (req, res) => {
  //   const artist = new Artist({
  //     name: artistName
  //   });
  //   await artist.save();
  //   res.send(artist);
  // });

  // app.get("/addAlbum", async (req, res) => {
  //   var albumname = albumName;
  //   var artist = await Artist.findOne({ name: artistName });
  //   console.log(artist);
  //   var album = new Album({
  //     name: albumname,
  //     MainArtist: artist._id,
  //     Artists: [artist._id]
  //   });
  //   // This is to be done atomically
  //   await album.save();
  //   artist.Albums.push(album._id);
  //   await artist.save();
  //   console.log(artist, album);
  //   res.send({ artist, album });
  // });



 // **************************. Streaming (Uploading) .**************************

  // const name = "";
  // app.get("/addSongInDB", async (req, res) => {
  //   let artist = await Artist.findOne({ name: artistName });
  //   let filepath = "";

  //   const writeStream = grid.createWriteStream({
  //     filename: name,
  //     artist: artist._id
  //   });
  //   fs.createReadStream(filepath).pipe(writeStream);
  //   writeStream.on("close", (file) => {
  //     console.log(file);
  //     res.send("File Created " + file.filename );
  //   });
  // });

  // app.get("/addSongInfo", async (req, res) => {
  //   let artist = await Artist.findOne({ name: artistName });
  //   var file = await grid.files.findOne({ filename: name });
  //   console.log(file);
  //   var album = await Album.findOne({ name: albumName });

  //   let song = new Songs({
  //     name: name,
  //     Main_Artist: artist._id,
  //     artists: [artist._id],
  //     song: file._id,
  //     album : album._id,
  //     cover : ""
  //   });
  //   await song.save();
  //   artist.songs.push(song._id)
  //   await artist.save()
  //   album.songs.push(song._id)
  //   await album.save()

  //   res.send(song);
  // });



// *************************************************. Only for uploading .*************************************************


// **************************. Streaming (Outgoing) .**************************

  app.get("/play", async (req, res) => {
    var nme = req.query.name;
    // console.log(nme);
    var song = await Songs.findOne({ name: nme });
    if (!song) {
      res.send("File Not Found");
      return;
    }
    var file = await grid.files.findOne({
      _id: song.song
    });
    var length = file.length;

    if (req.headers.range) {
      // console.log("Headers");
      var range = req.headers.range;
      var parts = range.replace(/bytes=/, "").split("-");
      var partialstart = parts[0];
      var partialend = parts[1]
      var chunk = 10 ** 6; // 1 M.B

      var start = parseInt(partialstart, 10);
      var end = Math.min(start + chunk, length - 1);
      var chunksize = end - start + 1;
      // console.log(
      //   "Start " + (start / length) * 100 + "end  " + (end / length) * 100
      // );

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${length}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "audio/mp3"
      };
      res.writeHead(206, headers);
      // For range queries use this range option
      const readstream = grid.createReadStream({
        filename: nme,
        range: {
          startPos: start,
          endPos: end
        }
      });
      readstream.pipe(res);
    } else {
      // console.log("No Headers");
      res.writeHead(200, {
        "Content-Length": 10 ** 6,
        "Content-Type": "audio/mpeg"
      });
      const readstream = grid.createReadStream(
        {
          filename: nme,
          range : {
          start: 0,
          end: start + 10**6
        }
        },
      );
      readstream.pipe(res);
    }
  });
  //AJAX
  app.get("/searchSong", async (req, res) => {
    const key = req.query.keyword;
    // console.log(key);
    const song = await Songs.findOne({
      name: key
    });
    // console.log(song);
    if (!song) {
      console.log("Not Found");
      res.status(404).send("Not Found");
      return;
    }
    const album = await Album.findById(song.album);
    const artist = await Artist.findById(song.Main_Artist);
    var name = song.name;
    var albumName = album.name + " - " + artist.name;
    song.Timesplayed += 1;
    await song.save();
    var cover = song.cover;
    var msg = {
      album: albumName,
      cover: cover,
      url: "/play?name=" + name,
      name: name
    };

    res.send(msg);
  });
})


function startServer() {
  const port = process.env.PORT || 3000;

  app.listen(port, () => console.log(`listining on ${port}`));
}


// For Clusters

if (require.main == module) {
  startServer();
} else {
  module.exports = startServer;
}

