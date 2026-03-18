import { Client } from "@notionhq/client";

// Fixed Internal Integration Secret as requested
export const NOTION_SECRET = "ntn_N27057434429IChawhJMUqJiYRxNeGytmQsM1Z4Mdey7nd";

export const notion = new Client({
  auth: NOTION_SECRET,
});
