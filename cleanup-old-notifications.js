const { db } = require('./server/db');
const { notifications } = require('./shared/schema');
const { eq, and } = require('drizzle-orm');

async function cleanupOldNotifications() {
  try {
    console.log('🧹 Cleaning up old emergency notifications without relatedId...');
    
    // Mark all emergency notifications without relatedId as read
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.type, 'emergency'),
          eq(notifications.relatedId, null)
        )
      )
      .returning();
    
    console.log(`✅ Marked ${result.length} old notifications as read`);
    
    // Show current emergency notifications
    const currentNotifications = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.type, 'emergency'),
          eq(notifications.isRead, false)
        )
      );
    
    console.log(`📊 Current unread emergency notifications: ${currentNotifications.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOldNotifications();