const { Sequelize } = require("sequelize");
const dns = require("dns");
const { Resolver } = require("dns");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../../../../.env"),
});
require("dotenv").config();

const resolver = new Resolver();
resolver.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");
const defaultLookup = dns.lookup.bind(dns);

dns.lookup = (hostname, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  resolver.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      callback(null, addresses[0], 4);
      return;
    }

    defaultLookup(hostname, options, callback);
  });
};

const originalSocketConnect = require("net").Socket.prototype.connect;
require("net").Socket.prototype.connect = function (
  portOrOpts,
  hostOrCb,
  ...rest
) {
  if (typeof portOrOpts === "number") {
    const host = typeof hostOrCb === "string" ? hostOrCb : "localhost";
    const cb = typeof hostOrCb === "function" ? hostOrCb : rest[0];
    return originalSocketConnect.apply(
      this,
      cb
        ? [{ port: portOrOpts, host, family: 4 }, cb]
        : [{ port: portOrOpts, host, family: 4 }],
    );
  }

  if (portOrOpts && typeof portOrOpts === "object") {
    portOrOpts = Object.assign({}, portOrOpts, { family: 4 });
  }

  return originalSocketConnect.call(this, portOrOpts, hostOrCb, ...rest);
};

console.log(
  "[youtube-playlist-service] DATABASE_URL:",
  process.env.DATABASE_URL ? "SET" : "NOT SET",
);

if (!process.env.DATABASE_URL) {
  throw new Error(
    "[youtube-playlist-service] Missing DATABASE_URL. Configure it in root .env before starting the service.",
  );
}

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

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: DB_DIALECT_OPTS,
  pool: DB_POOL_OPTS,
  logging: false,
});

module.exports = sequelize;
