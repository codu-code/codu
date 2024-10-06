"use client";

import { Button } from "@headlessui/react";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

function Content({ userId }: { userId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = params.get("token");
    if (tokenParam && !token) {
      setToken(tokenParam);
    }
  }, [params, token]);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage(
          "No verification token found. Please check your email for the correct link.",
        );
        return;
      }
      setStatus("loading");

      try {
        const res = await fetch(`/api/verify_email?token=${token}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        console.log("data", data);
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
        setMessage(data.message);
      } catch (error) {
        setStatus("error");
        setMessage(
          "An error occurred during verification. Please try again later.",
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-[350px] rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6 text-center">
          <div className="text-2xl font-bold">Email Verification</div>
          <div className="text-gray-400">Verifying your email address</div>
        </div>
        <div className="min-h-12 p-6 pt-0">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader className="text-primary h-4 w-4 animate-spin" />
              <p className="text-muted-foreground mt-2 text-sm">
                Verifying your email...
              </p>
            </div>
          )}
          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="mt-2 text-center text-sm">{message}</p>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="mt-2 text-center text-sm">{message}</p>
            </div>
          )}
        </div>
        {status === "success" && (
          <div className="flex items-center justify-center p-6 pt-0">
            <Button
              onClick={() => router.push("/settings")}
              className="mt-4 h-10 rounded-md bg-gray-200 px-4 py-2 transition-colors hover:bg-gray-300"
            >
              Return to Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Content;
