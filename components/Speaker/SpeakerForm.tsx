"use client";

import { useForm, useFieldArray, type FieldPath } from "react-hook-form";
import {
  SpeakerApplicationSchema,
  type SpeakerApplicationInput,
  speakerFormats,
  speakerFormatLabels,
  speakerExperiences,
  speakerExperienceLabels,
  talkLengths,
  talkLengthLabels,
} from "@/schema/speaker";
import { Input } from "@/components/ui-components/input";
import { Textarea } from "@/components/ui-components/textarea";
import {
  Field,
  Label,
  ErrorMessage,
} from "@/components/ui-components/fieldset";
import { api } from "@/server/trpc/react";
import clsx from "clsx";
import { CheckIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const MAX_TALKS = 3;

function SuccessState() {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-8 text-center sm:p-12">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
        <CheckIcon className="h-10 w-10 text-success" />
      </div>
      <h2 className="font-display text-2xl text-fg">Thanks for pitching!</h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        We read every submission and reply within 2 weeks. In the meantime, say
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

export function SpeakerForm() {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<SpeakerApplicationInput>({
    defaultValues: {
      name: "",
      email: "",
      link: "",
      location: "",
      bio: "",
      talks: [{ title: "", length: "STANDARD_20", abstract: "" }],
      other: "",
      website: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "talks",
  });

  const submitMutation = api.speaker.submit.useMutation();

  const onSubmit = async (data: SpeakerApplicationInput) => {
    const result = SpeakerApplicationSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        setError(issue.path.join(".") as FieldPath<SpeakerApplicationInput>, {
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
          LinkedIn / Twitter / website{" "}
          <span className="font-normal text-faint">(optional)</span>
        </Label>
        <Input
          type="url"
          placeholder="Wherever we can learn more about you"
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

      <Field>
        <Label>Short bio</Label>
        <Textarea
          rows={3}
          placeholder="One or two sentences — we'll use this to introduce you."
          {...register("bio")}
          invalid={!!errors.bio}
        />
        {errors.bio && <ErrorMessage>{errors.bio.message}</ErrorMessage>}
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-muted">
          Format preference
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {speakerFormats.map((f) => (
            <label
              key={f}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-inset px-4 py-3 text-fg transition-colors hover:border-strong has-[:checked]:border-accent/60 has-[:checked]:bg-gradient-to-br has-[:checked]:from-accent/10 has-[:checked]:to-accent/10"
            >
              <input
                type="radio"
                value={f}
                {...register("format")}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-sm">{speakerFormatLabels[f]}</span>
            </label>
          ))}
        </div>
        {errors.format && (
          <p className="mt-2 text-sm text-danger">{errors.format.message}</p>
        )}
      </fieldset>

      <div className="border-t border-hairline pt-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-base text-fg">
              Your talk{fields.length === 1 ? "" : "s"}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Pitch up to 3. Short abstracts are perfect — we&apos;re not
              looking for a full outline.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-lg border border-hairline bg-inset p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Talk {idx + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <Field>
                  <Label>Title</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Shipping a SaaS solo with Next.js"
                    {...register(`talks.${idx}.title` as const)}
                    invalid={!!errors.talks?.[idx]?.title}
                  />
                  {errors.talks?.[idx]?.title && (
                    <ErrorMessage>
                      {errors.talks[idx]?.title?.message}
                    </ErrorMessage>
                  )}
                </Field>

                <fieldset>
                  <legend className="text-sm font-medium text-muted">
                    Length
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {talkLengths.map((l) => (
                      <label
                        key={l}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-canvas px-3 py-2 text-fg transition-colors hover:border-strong has-[:checked]:border-accent/60 has-[:checked]:bg-gradient-to-br has-[:checked]:from-accent/10 has-[:checked]:to-accent/10"
                      >
                        <input
                          type="radio"
                          value={l}
                          {...register(`talks.${idx}.length` as const)}
                          className="h-4 w-4 accent-accent"
                        />
                        <span className="text-sm">{talkLengthLabels[l]}</span>
                      </label>
                    ))}
                  </div>
                  {errors.talks?.[idx]?.length && (
                    <p className="mt-2 text-sm text-danger">
                      {errors.talks[idx]?.length?.message}
                    </p>
                  )}
                </fieldset>

                <Field>
                  <Label>Abstract</Label>
                  <Textarea
                    rows={3}
                    placeholder="What's the talk about, in 2–3 sentences?"
                    {...register(`talks.${idx}.abstract` as const)}
                    invalid={!!errors.talks?.[idx]?.abstract}
                  />
                  {errors.talks?.[idx]?.abstract && (
                    <ErrorMessage>
                      {errors.talks[idx]?.abstract?.message}
                    </ErrorMessage>
                  )}
                </Field>
              </div>
            </div>
          ))}
        </div>

        {fields.length < MAX_TALKS && (
          <button
            type="button"
            onClick={() =>
              append({ title: "", length: "STANDARD_20", abstract: "" })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-hairline px-4 py-2 text-sm text-muted hover:border-accent/60 hover:text-fg"
          >
            <PlusIcon className="h-4 w-4" />
            Add another talk
          </button>
        )}

        {errors.talks &&
          typeof errors.talks === "object" &&
          !Array.isArray(errors.talks) &&
          "message" in errors.talks &&
          errors.talks.message && (
            <p className="mt-2 text-sm text-danger">
              {errors.talks.message as string}
            </p>
          )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-muted">
          Speaking experience{" "}
          <span className="font-normal text-faint">(optional)</span>
        </legend>
        <div className="mt-3 space-y-2">
          {speakerExperiences.map((e) => (
            <label
              key={e}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-hairline bg-inset px-4 py-3 text-fg transition-colors hover:border-strong has-[:checked]:border-accent/60 has-[:checked]:bg-gradient-to-br has-[:checked]:from-accent/10 has-[:checked]:to-accent/10"
            >
              <input
                type="radio"
                value={e}
                {...register("experience")}
                className="h-4 w-4 accent-accent"
              />
              <span>{speakerExperienceLabels[e]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field>
        <Label>
          Anything else?{" "}
          <span className="font-normal text-faint">(optional)</span>
        </Label>
        <Textarea
          rows={3}
          placeholder="Access needs, availability, context — anything we should know."
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
          {isSubmitting ? "Submitting..." : "Submit pitch"}
        </button>
      </div>
    </form>
  );
}
