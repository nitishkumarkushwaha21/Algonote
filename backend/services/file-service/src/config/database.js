const { Sequelize } = require("sequelize");
const dns = require("dns");
const { Resolver } = require("dns");
require("dotenv").config();

// Force Google DNS (8.8.8.8) to bypass local ISP/router blocking of Neon hostname
const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");
const _lookup = dns.lookup.bind(dns);
dns.lookup = (hostname, options, callback) => {
  if (typeof options === "function") { callback = options; options = {}; }
  resolver.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      callback(null, addresses[0], 4);
    } else {
      _lookup(hostname, options, callback);
    }
  });
};

// Fix Happy Eyeballs ETIMEDOUT in Docker/WSL2:
// Neon resolves to both IPv4+IPv6; Node.js v20 tries all simultaneously.
// pg calls socket.connect(port, host) — patch it to force family:4.
const _socketConnect = require("net").Socket.prototype.connect;
require("net").Socket.prototype.connect = function (
  portOrOpts,
  hostOrCb,
  ...rest
) {
  if (typeof portOrOpts === "number") {
    const host = typeof hostOrCb === "string" ? hostOrCb : "localhost";
    const cb = typeof hostOrCb === "function" ? hostOrCb : rest[0];
    return _socketConnect.apply(
      this,
      cb
        ? [{ port: portOrOpts, host, family: 4 }, cb]
        : [{ port: portOrOpts, host, family: 4 }],
    );
  }
  if (portOrOpts && typeof portOrOpts === "object") {
    portOrOpts = Object.assign({}, portOrOpts, { family: 4 });
  }
  return _socketConnect.call(this, portOrOpts, hostOrCb, ...rest);
};

console.log(
  "[file-service] DATABASE_URL:",
  process.env.DATABASE_URL ? "SET" : "NOT SET",
);

const DB_DIALECT_OPTS = {
  ssl: { require: true, rejectUnauthorized: false },
  connectTimeout: 60000,
  connectionTimeoutMillis: 60000,
  autoSelectFamily: false, // disable Happy Eyeballs (Node.js v20 ETIMEDOUT fix)
};

const DB_POOL_OPTS = {
  max: 2,
  acquire: 60000,
  idle: 10000,
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: DB_DIALECT_OPTS,
      pool: DB_POOL_OPTS,
      logging: false,
    })
  : new Sequelize("neondb", "neondb_owner", "npg_1hg3AXQFYyfU", {
      dialect: "postgres",
      host: "ep-summer-queen-aifl7d78-pooler.c-4.us-east-1.aws.neon.tech",
      port: 5432,
      dialectOptions: DB_DIALECT_OPTS,
      pool: DB_POOL_OPTS,
      logging: false,
    });

module.exports = sequelize;
