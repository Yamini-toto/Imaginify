/* eslint-disable camelcase */
import { clerkClient } from "@clerk/nextjs/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { createUser, deleteUser, updateUser } from "../../../../lib/actions/user.actions";
import { connectToDatabase } from "../../../../lib/database/mongoose";
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOKS_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create Svix instance
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  // Verify webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log("Received webhook event:", eventType);
  console.log("Webhook data:", evt.data);

  await connectToDatabase(); // Ensure DB connection before processing

  // CREATE
  if (eventType === "user.created") {
    const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;

    const user = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      username: username || "unknown",
      firstName: first_name,
      lastName: last_name,
      photo: image_url,
    };

    try {
      const newUser = await createUser(user);

      if (newUser) {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(id, {
          publicMetadata: { userId: newUser._id },
        });
      }

      return NextResponse.json({ message: "User created", user: newUser });
    } catch (error) {
      console.error("Error saving user:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  }

  // UPDATE
  if (eventType === "user.updated") {
    const { id, image_url, first_name, last_name, username } = evt.data;

    const user = {
      firstName: first_name,
      lastName: last_name,
      username: username || "unknown",
      photo: image_url,
    };

    try {
      const updatedUser = await updateUser(id, user);
      return NextResponse.json({ message: "User updated", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
  }

  // DELETE
  if (eventType === "user.deleted") {
    try {
      const deletedUser = await deleteUser(id);
      return NextResponse.json({ message: "User deleted", user: deletedUser });
    } catch (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
