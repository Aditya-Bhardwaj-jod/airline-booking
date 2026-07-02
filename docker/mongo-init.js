/**
 * This script runs once when the MongoDB container starts for the first time.
 * It initiates a single-node replica set called "rs0".
 *
 * WHY: MongoDB multi-document transactions REQUIRE a replica set.
 * Even one node ("rs0" with a single member) satisfies this requirement
 * and enables transactions in development without running 3 full nodes.
 *
 * In production: you'd have rs0 with 3 members across availability zones
 * for high availability + automatic failover.
 */
rs.initiate({
  _id: 'rs0',
  members: [{ _id: 0, host: 'mongo:27017' }],
});
