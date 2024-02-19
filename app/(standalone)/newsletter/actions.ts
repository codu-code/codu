"use server";

import { z } from "zod";

const FormDataSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Must be a valid email address",
    })
    .email(),
});

//@TODO - Add sentry to eat errors

const errorResponse = { message: "error" };

export async function subscribeToNewsletter(
  prevState: { message: string },
  formData: FormData,
): Promise<{ message: string }> {
  try {
    const result = FormDataSchema.parse({
      email: formData.get("email"),
    });

    const { email } = result;

    const EMAIL_API_ENDPOINT = process.env.EMAIL_API_ENDPOINT;
    const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
    const EMAIL_NEWSLETTER_ID = process.env.EMAIL_NEWSLETTER_ID;

    if (!EMAIL_API_ENDPOINT || !EMAIL_API_KEY || !EMAIL_NEWSLETTER_ID) {
      console.log("Email API not configured");
      return errorResponse;
    }

    const payload = new URLSearchParams({
      email,
      api_key: EMAIL_API_KEY,
      list: EMAIL_NEWSLETTER_ID,
      boolean: "true",
    }).toString();

    const response = await fetch(`${EMAIL_API_ENDPOINT}/subscribe`, {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });

    if (response.ok) {
      // Send confirmation email to user
      return {
        message: "success",
      };
    } else {
      console.log("Error:", response.status);
      return errorResponse;
    }
  } catch (error) {
    console.log(error);
    return errorResponse;
  }
}
