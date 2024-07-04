const express = require("express");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const hasLoadBalancing =
  (process.argv[5] || process.env.LOAD_BALANCING || 'false') === 'true';

// Configuration Management
const getConfig = () => ({
  service: process.argv[2] || process.env.SERVICE || "roteamento",
  destinationHost: process.argv[3] || process.env.SERVER_HOST || "localhost",
  destinationPort: process.argv[4] || process.env.SERVER_PORT || 50052,
  port: 3000,
});

// Prepare Message
const prepareMessage = () => {
  const messageHex =
    "415344415344415344415344";
  let message = Buffer.from(messageHex, "hex");
  let buffer = Buffer.allocUnsafe(2 + message.length);
  buffer.writeUInt16BE(message.length, 0);
  message.copy(buffer, 2);
  return buffer;
};

// Create gRPC Client
const createGrpcClient = (service, destination) => {
  const options = {
    "grpc.service_config": JSON.stringify({
      loadBalancingConfig: [{ round_robin: {} }],
    }),
  };

  const PROTO_PATH = `./${service}.proto`;
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const echo_proto =
    grpc.loadPackageDefinition(packageDefinition).mypackage ||
    grpc.loadPackageDefinition(packageDefinition);
  return service === "roteamento"
    ? new echo_proto.br.com.elo.transacao.autorizacao.roteamento.grpc.Roteamento(
        destination,
        grpc.credentials.createInsecure(),
        hasLoadBalancing ? options : null
      )
    : new echo_proto.br.com.elo.transacao.autorizacao.nucleo.grpc.Nucleo(
        destination,
        grpc.credentials.createInsecure(),
        hasLoadBalancing ? options : null
      );
};

// Main
const main = () => {
  const { service, destinationHost, destinationPort, port } = getConfig();
  const destination = `${destinationHost}:${destinationPort}`;
  const client = createGrpcClient(service, destination);
  const message = prepareMessage();
  const app = express();

  app.get("/echo", async (req, res) => {
    const metadata = new grpc.Metadata();
    metadata.add("nrid", "12344");

    try {
      let i = 0;
      let errors = 0;
      while (i < 100) {
        let nrid = Math.floor(Math.random() * 1000000);
        // Wrap gRPC call in a promise
        await new Promise((resolve, reject) => {
          client.process(
            { nrid, clientAddress: "0.0.0.0:1233", data: message },
            metadata,
            (error, response) => {
              if (error) {
                errors++;
                console.error(error);
                reject(error);
              } else {
                console.log(
                  `Response: \n response.nrid: ${response.nrid} \n response.clientAddress: ${response.clientAddress} \n response.data: ${response.data}`
                );
                resolve();
              }
            }
          );
        });
        i++;
      }
      res.status(201).send(`Sent ${i} requests with ${errors} errors.`);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server error");
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

main();
