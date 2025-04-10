import { prisma } from "../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

// GET handler to fetch comments for a specific entry
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');
    
    if (!entryId) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        entryId,
      },
      orderBy: {
        createdAt: 'desc', // Newest first
      },
      include: {
        author: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST handler to create a new comment
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { entryId, content } = await request.json();
    
    if (!entryId || !content) {
      return NextResponse.json(
        { error: "Entry ID and content are required" },
        { status: 400 }
      );
    }
    
    // Validate content length (approximately 200 words)
    if (content.length > 1200) {
      return NextResponse.json(
        { error: "Comment exceeds the 200 word limit" },
        { status: 400 }
      );
    }

    // Check if the entry exists
    const entryExists = await prisma.entry.findUnique({
      where: { id: entryId },
    });

    if (!entryExists) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        author: {
          connect: { id: user.id },
        },
        entry: {
          connect: { id: entryId },
        },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
} 