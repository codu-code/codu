"use client";

import { useForm, type FieldPath } from "react-hook-form";
import {
  VolunteerApplicationSchema,
  type VolunteerApplicationInput,
  volunteerAreas,
  volunteerAreaLabels,
  volunteerCommitments,
  volunteerCommitmentLabels,
} from "@/schema/volunteer";
import { Input } from "@/components/ui-components/input";
import { Textarea } from "@/components/ui-components/textarea";
import {
  Field,
  Label,
  ErrorMessage,
} from "@/components/ui-components/fieldset";
import { api } from "@/server/trpc/react";
import clsx from "clsx";
import { CheckIcon } from "@heroicons/react/24/outline";

function SuccessState() {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-8 text-center sm:p-12">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
        <CheckIcon className="h-10 w-10 text-success" />
      </div>
      <h2 className="font-display text-2xl text-fg">Thanks!</h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        We read every application and reply within 2 weeks. In the meantime, say
        hi in our{" "}
        <a
          href="https://www.codu.co/discord"
          className="text-accent hover:underline"
        >
          Discord
        </a>
        .
      </p>
    </div>
  );
}

export function VolunteerForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<VolunteerApplicationInput>({
    defaultValues: {
      name: "",
      email: "",
      link: "",
      location: "",
      workOn: "",
      experience: "",
      whyCodu: "",
      other: "",
      website: "",
    },
  });

  const submitMutation = api.volunteer.submit.useMutation();

  const onSubmit = async (data: VolunteerApplicationInput) => {
    const result = VolunteerApplicationSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as FieldPath<VolunteerApplicationInput>, {
          type: "manual",
          message: issue.message,
        });
      });
      return;
    }
    await submitMutation.mutateAsync(result.data);
  };

  if (isSubmitSuccessful && submitMutation.isSuccess) {
    return <SuccessState />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-xl border border-hairline bg-surface p-6 sm:p-8"
      noValidate
    >
      {/* Honeypot — visually hidden, tab-index removed, name "website" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden"
      >
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </label>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <Label>Name</Label>
          <Input
            type="text"
            placeholder="Your name"
            autoComplete="name"
            {...register("name")}
            invalid={!!errors.name}
          />
          {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </Field>

        <Field>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            invalid={!!errors.email}
          />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
        </Field>
      </div>

      <Field>
        <Label>
          LinkedIn or portfolio URL{" "}
          <span className="font-normal text-faint">(optional)</span>
        </Label>
        <Input
          type="url"
          placeholder="https://linkedin.com/in/you"
          {...register("link")}
          invalid={!!errors.link}
        />
        {errors.link && <ErrorMessage>{errors.link.message}</ErrorMessage>}
      </Field>

      <Field>
        <Label>Where are you based?</Label>
        <Input
          type="text"
          placeholder="Dublin, Cork, remote…"
          {...register("location")}
          invalid={!!errors.location}
        />
        {errors.location && (
          <ErrorMessage>{errors.location.message}</ErrorMessage>
        )}
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-muted">
          Which area interests you?
        </legend>
        <div className="mt-3 space-y-2">
          {volunteerAreas.map((area) => (
            <label
              key={area}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-inset px-4 py-3 text-fg transition-colors hover:border-strong has-[:checked]:border-accent/60 has-[:checked]:bg-gradient-to-br has-[:checked]:from-accent/10 has-[:checked]:to-accent/10"
            >
              <input
                type="radio"
                value={area}
                {...register("area")}
                className="h-4 w-4 accent-accent"
              />
              <span>{volunteerAreaLabels[area]}</span>
            </label>
          ))}
        </div>
        {errors.area && (
          <p className="mt-2 text-sm text-danger">{errors.area.message}</p>
        )}
      </fieldset>

      <Field>
        <Label>What would you like to work on?</Label>
        <Textarea
          rows={4}
          placeholder="Social, newsletter, partnerships, meetups, speakers, venues — tell us what excites you."
          {...register("workOn")}
          invalid={!!errors.workOn}
        />
        {errors.workOn && <ErrorMessage>{errors.workOn.message}</ErrorMessage>}
      </Field>

      <Field>
        <Label>
          Any relevant experience?{" "}
          <span className="font-normal text-faint">(optional)</span>
        </Label>
        <Textarea
          rows={4}
          placeholder="Professional, volunteer, college, side projects — anything counts. No experience is fine."
          {...register("experience")}
          invalid={!!errors.experience}
        />
        {errors.experience && (
          <ErrorMessage>{errors.experience.message}</ErrorMessage>
        )}
      </Field>

      <Field>
        <Label>Why Codú?</Label>
        <Textarea
          rows={4}
          placeholder="What draws you to helping out here?"
          {...register("whyCodu")}
          invalid={!!errors.whyCodu}
        />
        {errors.whyCodu && (
          <ErrorMessage>{errors.whyCodu.message}</ErrorMessage>
        )}
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-muted">
          Time commitment per month
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {volunteerCommitments.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-inset px-4 py-3 text-fg transition-colors hover:border-strong has-[:checked]:border-accent/60 has-[:checked]:bg-gradient-to-br has-[:checked]:from-accent/10 has-[:checked]:to-accent/10"
            >
              <input
                type="radio"
                value={c}
                {...register("commitment")}
                className="h-4 w-4 accent-accent"
              />
              <span>{volunteerCommitmentLabels[c]}</span>
            </label>
          ))}
        </div>
        {errors.commitment && (
          <p className="mt-2 text-sm text-danger">
            {errors.commitment.message}
          </p>
        )}
      </fieldset>

      <Field>
        <Label>
          Anything else?{" "}
          <span className="font-normal text-faint">(optional)</span>
        </Label>
        <Textarea
          rows={3}
          placeholder="Questions, context, or anything we should know."
          {...register("other")}
          invalid={!!errors.other}
        />
        {errors.other && <ErrorMessage>{errors.other.message}</ErrorMessage>}
      </Field>

      {submitMutation.error && (
        <div className="rounded-lg bg-danger/10 p-4 text-sm text-danger">
          {submitMutation.error.message}
        </div>
      )}

      <div className="flex justify-end border-t border-hairline pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx("primary-button", "disabled:cursor-not-allowed")}
        >
          {isSubmitting ? "Submitting..." : "Submit application"}
        </button>
      </div>
    </form>
  );
}
