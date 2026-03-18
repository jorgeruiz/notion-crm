import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { NOTION_SECRET } from "@/lib/notion";

export async function POST(request: Request) {
    try {
        const { pageId } = await request.json();

        if (!pageId) {
            return NextResponse.json(
                { error: "Page ID is required" },
                { status: 400 }
            );
        }

        const notion = new Client({ auth: NOTION_SECRET });

        // Archive the page (Notion's way of deleting)
        const response = await (notion.pages as any).update({
            page_id: pageId,
            archived: true,
        });

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Notion Delete Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete page in Notion" },
            { status: 500 }
        );
    }
}
