import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type, targetUsers } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Get users to notify
    let users: Array<{ id: string; username: string }> = [];

    if (targetUsers === "all") {
      users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, username: true },
      });
    } else if (targetUsers === "buyers") {
      users = await prisma.user.findMany({
        where: {
          isActive: true,
          role: "BUYER",
        },
        select: { id: true, username: true },
      });
    } else if (targetUsers === "admins") {
      users = await prisma.user.findMany({
        where: {
          isActive: true,
          role: "ADMIN",
        },
        select: { id: true, username: true },
      });
    } else if (Array.isArray(targetUsers)) {
      users = await prisma.user.findMany({
        where: {
          id: { in: targetUsers },
          isActive: true,
        },
        select: { id: true, username: true },
      });
    }

    // Store notification in database
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || "INFO",
        sentBy: session.user?.id || "",
        sentAt: new Date(),
      },
    });

    // Create notification records for each user
    const notificationRecords = users.map((user) => ({
      notificationId: notification.id,
      userId: user.id,
      isRead: false,
    }));

    await prisma.userNotification.createMany({
      data: notificationRecords,
    });

    // In a real implementation, you would send push notifications here
    // using a service like Firebase Cloud Messaging or similar

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
      notificationId: notification.id,
      recipients: users.length,
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.id;

    // Get user's notifications
    const notifications = await prisma.userNotification.findMany({
      where: {
        userId,
        isRead: false,
      },
      include: {
        notification: true,
      },
      orderBy: {
        notification: {
          sentAt: "desc",
        },
      },
      take: 50,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.notification.title,
        message: n.notification.message,
        type: n.notification.type,
        sentAt: n.notification.sentAt,
        isRead: n.isRead,
      })),
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 });
  }
}
