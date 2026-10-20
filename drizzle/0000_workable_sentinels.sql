CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`revision` integer NOT NULL,
	`expires` integer NOT NULL
);
