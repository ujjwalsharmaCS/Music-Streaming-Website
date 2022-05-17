const cluster = require("cluster");

const startWorker = () => {
  const worker = cluster.fork();
  console.log("Cluster Started", worker.id);
};

if (cluster.isMaster) {
  const cpus = require("os").cpus();
  cpus.forEach((cpu) => {
    console.log("Cpu : ", cpu.model);
    console.log("Starting Cluster");
    startWorker();

    cluster.on("disconnect", (worker) => {
      console.log(`Worker ${worker.id} , disconnected`);
    });

    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker ${worker.id} Exited with code ${code}`);
      console.log("Creating New Worker");
      startWorker();
    });
  });
} else {
  const startServer = require("./index");
  startServer();
}
