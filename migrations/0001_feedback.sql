-- What the feedback dialog sends: a row per message, kept for a year and then
-- deleted by the Worker's daily purge. Rows are only ever added and deleted, and
-- the table has no index but its key, since every index costs a write per row.
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY,
  -- When it arrived, in UTC, as 2026-10-15T12:34:56.789Z.
  received TEXT NOT NULL,
  message TEXT NOT NULL
);
