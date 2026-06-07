"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { api } from "@/server/trpc/react";
import {
  type SponsorInterest,
  sponsorInterestLabels,
} from "@/schema/sponsor";
import { Input } from "@/components/ui-components/input";
import { Textarea } from "@/components/ui-components/textarea";
import {
  Field,
  Label,
  ErrorMessage,
} from "@/components/ui-components/fieldset";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";

const ContactSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be 255 characters or less"),
  company: z
    .string()
    .max(100, "Company name must be 100 characters or less")
    .optional(),
  goals: z
    .string()
    .min(1, "Tell us a little about what you're after")
    .max(2000, "Message must be 2000 characters or less"),
});

type ContactInput = z.infer<typeof ContactSchema>;

export function ContactModal({
  open,
  onClose,
  defaultInterest = "NEWSLETTER",
  title = "Get in touch",
  subtitle = "Tell us what you're after and we'll come back to you within a day or two.",
}: {
  open: boolean;
  onClose: () => void;
  defaultInterest?: SponsorInterest;
  title?: string;
  subtitle?: string;
}) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    defaultValues: { name: "", email: "", company: "", goals: "" },
  });

  const submitMutation = api.sponsor.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Thanks — we'll be in touch soon.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSubmit = async (data: ContactInput) => {
    const parsed = ContactSchema.safeParse(data);
    if (!parsed.success) return;
    await submitMutation.mutateAsync({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      goals: parsed.data.goals,
      interests: [defaultInterest],
      budgetRange: "EXPLORING",
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-6 pb-6 pt-[11vh]"
      style={{ background: "rgba(4,5,7,0.62)", backdropFilter: "blur(6px)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[520px] overflow-hidden rounded-xl border border-strong bg-elevated shadow-lg"
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-fg">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {sponsorInterestLabels[defaultInterest]}
            </p>
          </div>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-faint transition-colors hover:bg-surface hover:text-fg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckIcon className="h-8 w-8 text-accent" />
            </div>
            <h3 className="font-display text-lg font-extrabold tracking-tight text-fg">
              Thanks — message received.
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              We&apos;ll come back to you within a day or two. In the meantime
              you can reach us at{" "}
              <a
                href="mailto:hello@codu.co"
                className="text-accent-soft hover:underline"
              >
                hello@codu.co
              </a>
              .
            </p>
            <button
              type="button"
              onClick={onClose}
              className="secondary-button mt-6 justify-center"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6">
            <p className="text-sm text-muted">{subtitle}</p>

            <div className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <Label>Name</Label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    {...register("name")}
                    invalid={!!errors.name}
                  />
                  {errors.name && (
                    <ErrorMessage>{errors.name.message}</ErrorMessage>
                  )}
                </Field>

                <Field>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    {...register("email")}
                    invalid={!!errors.email}
                  />
                  {errors.email && (
                    <ErrorMessage>{errors.email.message}</ErrorMessage>
                  )}
                </Field>
              </div>

              <Field>
                <Label>
                  Company{" "}
                  <span className="font-normal text-faint">(optional)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Company name"
                  {...register("company")}
                />
              </Field>

              <Field>
                <Label>What are you hoping to do?</Label>
                <Textarea
                  rows={4}
                  placeholder="A line or two on your goals — audience, timing, budget if you have one in mind…"
                  {...register("goals")}
                  invalid={!!errors.goals}
                />
                {errors.goals && (
                  <ErrorMessage>{errors.goals.message}</ErrorMessage>
                )}
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-hairline pt-5">
              <p className="font-mono text-xs text-faint">
                or email{" "}
                <a
                  href="mailto:hello@codu.co"
                  className="text-accent-soft hover:underline"
                >
                  hello@codu.co
                </a>
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-button justify-center disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
