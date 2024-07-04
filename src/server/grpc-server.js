const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const service = process.argv[2] || "roteamento"; // Default service is roteamento, can be also nucleo
const PROTO_PATH = `./${service}.proto`;
const host = `0.0.0.0:${process.argv[3] || 50052}`;

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

function echo(call, callback) {
    console.log(`Request received: NRID: ${call.request.nrid}`);
    callback(null, {
        nrid: call.request.nrid,
        clientAddress: call.request.clientAddress,
        data: call.request.data,
    });
}

function main() {
    const server = new grpc.Server();
    server.addService(
        service === "roteamento"
            ? echo_proto.br.com.elo.transacao.autorizacao.roteamento.grpc.Roteamento
                .service
            : echo_proto.br.com.elo.transacao.autorizacao.nucleo.grpc.Nucleo.service,
        { process: echo }
    );
    server.bindAsync(
        host,
        grpc.ServerCredentials.createInsecure(),
        () => {
            server.start();
        }
    );
}

main();