import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireAuth, handleApiError } from '@/lib/middleware';

export const GET = handleApiError(async (req) => {
  const auth = await requireAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const notifications = await Notification.find({ userId: auth.user.id })
    .sort({ createdAt: -1 })
    .limit(50);

  return NextResponse.json({ data: notifications });
});

export const PUT = handleApiError(async (req) => {
  const auth = await requireAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await connectDB();
  const body = await req.json();

  if (body.markAllRead) {
    await Notification.updateMany(
      { userId: auth.user.id, isRead: false },
      { isRead: true }
    );
    return NextResponse.json({ message: 'All notifications marked as read' });
  }

  if (body.notificationId) {
    await Notification.findByIdAndUpdate(body.notificationId, { isRead: true });
    return NextResponse.json({ message: 'Notification marked as read' });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
});

export const POST = handleApiError(async (req) => {
  const { searchParams } = new URL(req.url);
  const broadcast = searchParams.get('broadcast') === 'true';

  if (broadcast) {
    const adminCheck = await requireAuth(req);
    // Admin broadcast handled via different path
  }

  await connectDB();
  const body = await req.json();

  const notification = await Notification.create({
    userId: body.userId,
    title: body.title,
    message: body.message,
    type: body.type || 'info',
    relatedId: body.relatedId,
    relatedModel: body.relatedModel,
  });

  return NextResponse.json({ data: notification }, { status: 201 });
});
