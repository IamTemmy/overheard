import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{code:text('code').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull(),expires:integer('expires').notNull()});
