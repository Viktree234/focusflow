import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { plannerBlocks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PlannerClient from "./client";

export default async function PlannerPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) redirect("/api/auth/signin");

  const userBlocks = await db
    .select()
    .from(plannerBlocks)
    .where(eq(plannerBlocks.userId, user.id))
    .orderBy(plannerBlocks.startsAt);

  return <PlannerClient blocks={userBlocks} />;
}