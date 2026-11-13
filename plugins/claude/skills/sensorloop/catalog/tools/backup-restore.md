---
title: Backup and restore
summary: The database's own tools for backing up and restoring, used to prove that a backup can actually be restored.
sensors: [smoke-probe]
layer: system
---

A backup is proven only by restoring it. This tool is the database's own backup and restore, or the managed service's
snapshots, found in the project's operations config rather than assumed.

## Finding it

- **The backup job**: a scheduled job, a Kubernetes `CronJob`, or the managed database's backup settings.
- **Where backups go**: the bucket or the list of snapshots, and who may read them.
- **The database's version**, so the restore tool matches it: `pg_restore` cannot read a file from a newer
  `pg_dump`.

## Using it

- **Restore the latest backup into a scratch database**, never over a live one:
  `pg_restore --dbname=<scratch> <file>`, or a new instance from a snapshot.
- **Check what came back**: the row counts of the main tables, and the newest row's time against the backup's.
- **Time the restore**: it bounds how long an outage lasts.
- **On a schedule**, and after any change to the backup job.

Examples: `pg_dump` and `pg_restore` (PostgreSQL), `mysqldump` (MySQL), `mongodump` and `mongorestore` (MongoDB), a
managed database's snapshots.
