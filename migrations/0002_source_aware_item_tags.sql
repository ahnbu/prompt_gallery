CREATE TABLE item_tags_new (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('manual', 'auto')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (item_id, tag_id, source)
);

INSERT INTO item_tags_new (item_id, tag_id, source, created_at)
SELECT item_id, tag_id, 'manual', created_at
FROM item_tags;

DROP TABLE item_tags;

ALTER TABLE item_tags_new RENAME TO item_tags;
