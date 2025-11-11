import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { subscriptionPlans, userSubscriptions, users } from "../../shared/schema";

const addOneMonth = (date: Date) => {
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + 1);
  return result;
};

const parseEmergencyConsultations = (value?: string | null) => {
  if (!value || value === "unlimited") {
    return null;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const getLatestSubscription = async (userId: number) => {
  const [record] = await db
    .select({
      subscription: userSubscriptions,
      plan: subscriptionPlans,
    })
    .from(userSubscriptions)
    .leftJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
    .where(eq(userSubscriptions.userId, userId))
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(1);

  return record;
};

export const scheduleDowngradeIfNeeded = async (
  userId: number,
  targetPlan: typeof subscriptionPlans.$inferSelect,
) => {
  const currentRecord = await getLatestSubscription(userId);
  if (
    !currentRecord ||
    !currentRecord.plan ||
    !currentRecord.subscription.endDate ||
    currentRecord.plan.id === targetPlan.id
  ) {
    return { scheduled: false as const };
  }

  const now = new Date();
  const isDowngrade =
    currentRecord.plan.price > targetPlan.price &&
    currentRecord.subscription.endDate > now;

  if (!isDowngrade) {
    return { scheduled: false as const };
  }

  await db
    .update(userSubscriptions)
    .set({
      cancelAtPeriodEnd: true,
      scheduledPlanId: targetPlan.id,
      scheduledPlanApplied: false,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, currentRecord.subscription.id));

  return {
    scheduled: true as const,
    effectiveDate: currentRecord.subscription.endDate,
  };
};

export const applyScheduledDowngradeIfEligible = async (userId: number) => {
  const currentRecord = await getLatestSubscription(userId);

  if (
    !currentRecord ||
    !currentRecord.subscription.cancelAtPeriodEnd ||
    !currentRecord.subscription.scheduledPlanId ||
    currentRecord.subscription.scheduledPlanApplied
  ) {
    return currentRecord;
  }

  if (
    !currentRecord.subscription.endDate ||
    currentRecord.subscription.endDate > new Date()
  ) {
    return currentRecord;
  }

  const [scheduledPlan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, currentRecord.subscription.scheduledPlanId));

  if (!scheduledPlan) {
    return currentRecord;
  }

  const activationDate = currentRecord.subscription.endDate;
  const nextEndDate = addOneMonth(activationDate);

  await db.insert(userSubscriptions).values({
    userId,
    planId: scheduledPlan.id,
    status: "active",
    startDate: activationDate,
    endDate: nextEndDate,
    paymentMethod: scheduledPlan.price === 0 ? "free" : "card",
    price: scheduledPlan.price,
  });

  await db
    .update(userSubscriptions)
    .set({
      cancelAtPeriodEnd: false,
      scheduledPlanId: null,
      scheduledPlanApplied: true,
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, currentRecord.subscription.id));

  await db
    .update(users)
    .set({
      subscriptionPlan: scheduledPlan.name,
      subscriptionPlanId: scheduledPlan.id,
      subscriptionStatus: "active",
      subscriptionStartDate: activationDate,
      subscriptionEndDate: nextEndDate,
      subscriptionChangedAt: new Date(),
      emergencyConsultationsLeft:
        scheduledPlan.price === 0 ? 0 : parseEmergencyConsultations(scheduledPlan.emergencyConsultations),
    })
    .where(eq(users.id, userId));

  return getLatestSubscription(userId);
};
