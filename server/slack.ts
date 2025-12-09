import type { Contact } from "@shared/schema";

/**
 * Gửi thông báo contact form đến Slack channel
 */
export async function sendSlackNotification(contact: Contact): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not set, skipping Slack notification");
    return;
  }

  try {
    const message = {
      text: "📧 New Contact Form Submission",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "📧 New Contact Form Submission",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Full Name:*\n${contact.fullName}`,
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${contact.email}`,
            },
            {
              type: "mrkdwn",
              text: `*Company:*\n${contact.company || "N/A"}`,
            },
            {
              type: "mrkdwn",
              text: `*Newsletter:*\n${contact.newsletter ? "✅ Yes" : "❌ No"}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Message:*\n${contact.message}`,
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Submitted at: ${contact.createdAt ? new Date(contact.createdAt).toLocaleString() : new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} ${errorText}`);
    }

    console.log("Slack notification sent successfully");
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    // Không throw error để không ảnh hưởng đến việc save database
    // Chỉ log error để debug
  }
}
