const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { users, partners, corporateSubscriptions } = require('./dist/shared/schema.js');
const { eq, and } = require('drizzle-orm');

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkSubscription() {
  try {
    // First get user
    const user = await db.select().from(users).where(eq(users.email, 'lucas.canova@me.com')).limit(1);
    
    if (!user.length) {
      console.log('User not found');
      return;
    }
    
    // Get partner info
    const partner = await db.select().from(partners).where(eq(partners.userId, user[0].id)).limit(1);
    
    if (!partner.length) {
      console.log('Partner not found');
      return;
    }
    
    console.log('Partner info:', {
      businessName: partner[0].businessName,
      isCorporate: partner[0].isCorporate,
      partnerId: partner[0].id
    });
    
    // Check for active subscription
    const subscription = await db.select().from(corporateSubscriptions)
      .where(and(
        eq(corporateSubscriptions.partnerId, partner[0].id),
        eq(corporateSubscriptions.status, 'active')
      ))
      .limit(1);
    
    if (subscription.length) {
      console.log('\nActive subscription found:', subscription[0]);
    } else {
      console.log('\nNo active corporate subscription found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSubscription();