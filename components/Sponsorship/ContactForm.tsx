"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  SponsorInquirySchema,
  type SponsorInquiryInput,
  sponsorInterests,
  sponsorInterestLabels,
  sponsorBudgetRanges,
  sponsorBudgetLabels,
} from "@/schema/sponsor";
import { z } from "zod";
import { Input } from "@/components/ui-components/input";
import { Textarea } from "@/components/ui-components/textarea";
import { Select } from "@/components/ui-components/select";
import {
  Field,
  Label,
  ErrorMessage,
} from "@/components/ui-components/fieldset";
import { api } from "@/server/trpc/react";
import clsx from "clsx";
import {
  EnvelopeIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const TOTAL_STEPS = 3;

const interestIcons: Record<string, typeof EnvelopeIcon> = {
  NEWSLETTER: EnvelopeIcon,
  EVENTS: CalendarDaysIcon,
  WEBSITE: GlobeAltIcon,
  CONTENT: DocumentTextIcon,
};

const stepLabels = ["Interests", "Details", "Contact"];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-3">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-col items-center">
            {/* Circle with connecting lines */}
            <div className="relative flex w-full items-center justify-center">
              {/* Left line */}
              {step > 1 && (
                <div
                  className={clsx(
                    "absolute right-1/2 h-1 w-1/2 rounded-l-full",
                    step <= currentStep ? "bg-accent" : "bg-elevated",
                  )}
                />
              )}
              {/* Right line */}
              {step < 3 && (
                <div
                  className={clsx(
                    "absolute left-1/2 h-1 w-1/2 rounded-r-full",
                    step < currentStep ? "bg-accent" : "bg-elevated",
                  )}
                />
              )}
              <div
                className={clsx(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  step < currentStep
                    ? "bg-accent text-on-accent"
                    : step === currentStep
                      ? "bg-accent text-on-accent"
                      : "bg-elevated text-faint",
                )}
              >
                {step < currentStep ? <CheckIcon className="h-5 w-5" /> : step}
              </div>
            </div>
            <span className="mt-3 text-xs text-faint sm:text-sm">
              {stepLabels[step - 1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step1Interests({
  selectedInterests,
  onToggle,
  error,
}: {
  selectedInterests: string[];
  onToggle: (interest: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-fg">What interests you?</h3>
        <p className="mt-2 text-muted">
          Select all the advertising options you&apos;d like to learn more
          about.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sponsorInterests.map((interest) => {
          const Icon = interestIcons[interest];
          const isSelected = selectedInterests.includes(interest);

          return (
            <button
              key={interest}
              type="button"
              onClick={() => onToggle(interest)}
              className={clsx(
                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-accent/50 bg-accent/10"
                  : "border-hairline bg-elevated hover:border-accent/40 hover:bg-surface",
              )}
            >
              <div
                className={clsx(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                  isSelected ? "bg-accent" : "bg-inset",
                )}
              >
                <Icon
                  className={clsx(
                    "h-5 w-5",
                    isSelected ? "text-on-accent" : "text-fg",
                  )}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-fg">
                  {sponsorInterestLabels[interest]}
                </p>
              </div>
              <div
                className={clsx(
                  "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected ? "border-accent bg-accent" : "border-strong",
                )}
              >
                {isSelected && <CheckIcon className="h-4 w-4 text-fg" />}
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function Step2Details({
  register,
  errors,
  budgetValue,
}: {
  register: ReturnType<typeof useForm<SponsorInquiryInput>>["register"];
  errors: ReturnType<
    typeof useForm<SponsorInquiryInput>
  >["formState"]["errors"];
  budgetValue: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-fg">Tell us more</h3>
        <p className="mt-2 text-muted">
          Help us understand your budget and goals so we can prepare the best
          options for you.
        </p>
      </div>

      <Field>
        <Label>Budget Range</Label>
        <Select {...register("budgetRange")}>
          {sponsorBudgetRanges.map((range) => (
            <option key={range} value={range}>
              {sponsorBudgetLabels[range]}
            </option>
          ))}
        </Select>
      </Field>

      <Field>
        <Label>What are you hoping to achieve? (optional)</Label>
        <Textarea
          rows={4}
          placeholder="e.g., We're looking to hire senior developers, increase brand awareness among the tech community, promote our developer tools..."
          {...register("goals")}
        />
        {errors.goals && <ErrorMessage>{errors.goals.message}</ErrorMessage>}
      </Field>
    </div>
  );
}

function Step3Contact({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<SponsorInquiryInput>>["register"];
  errors: ReturnType<
    typeof useForm<SponsorInquiryInput>
  >["formState"]["errors"];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-fg">Your details</h3>
        <p className="mt-2 text-muted">
          We&apos;ll reach out within 24 hours to discuss your options.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <Label>Name</Label>
          <Input
            type="text"
            placeholder="Your name"
            {...register("name")}
            invalid={!!errors.name}
          />
          {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </Field>

        <Field>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="you@company.com"
            {...register("email")}
            invalid={!!errors.email}
          />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <Label>
            Company <span className="font-normal text-faint">(optional)</span>
          </Label>
          <Input
            type="text"
            placeholder="Company name"
            {...register("company")}
          />
        </Field>

        <Field>
          <Label>
            Phone <span className="font-normal text-faint">(optional)</span>
          </Label>
          <Input
            type="tel"
            placeholder="+1 555 123 4567"
            {...register("phone")}
          />
        </Field>
      </div>
    </div>
  );
}

function SuccessState({ onReset }: { onReset: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
        <CheckIcon className="h-10 w-10 text-accent" />
      </div>
      <h3 className="text-2xl font-bold text-fg">Thank you!</h3>
      <p className="mx-auto mt-3 max-w-md text-muted">
        We&apos;ve received your inquiry and will be in touch within 24 hours to
        discuss how we can help you reach our developer community.
      </p>
      <button
        onClick={onReset}
        className="mt-8 text-sm text-accent hover:underline"
      >
        Submit another inquiry
      </button>
    </div>
  );
}

export function ContactForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    clearErrors,
    setError,
  } = useForm<SponsorInquiryInput>({
    defaultValues: {
      interests: [],
      budgetRange: "EXPLORING",
      name: "",
      email: "",
      company: "",
      phone: "",
      goals: "",
    },
  });

  const selectedInterests = watch("interests") || [];
  const budgetValue = watch("budgetRange");

  const submitMutation = api.sponsor.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const toggleInterest = (interest: string) => {
    const current = selectedInterests as string[];
    const newInterests = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    setValue("interests", newInterests as typeof selectedInterests);
    // Clear any existing interests error when user makes a selection
    if (newInterests.length > 0) {
      clearErrors("interests");
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep === 1) {
      // Manual validation for step 1 - just check interests
      if (selectedInterests.length === 0) {
        setError("interests", {
          type: "manual",
          message: "Please select at least one option",
        });
        return;
      }
      clearErrors("interests");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Step 2 fields are optional or have defaults, so we can proceed
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: SponsorInquiryInput) => {
    // Validate with Zod before submission
    const result = SponsorInquirySchema.safeParse(data);

    if (!result.success) {
      // Set errors from Zod validation
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SponsorInquiryInput;
        setError(field, { type: "manual", message: issue.message });
      });
      return;
    }

    await submitMutation.mutateAsync(result.data);
  };

  const handleReset = () => {
    setSubmitted(false);
    setCurrentStep(1);
    reset();
  };

  if (submitted) {
    return <SuccessState onReset={handleReset} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StepIndicator currentStep={currentStep} />

      <div className="min-h-[320px]">
        {currentStep === 1 && (
          <Step1Interests
            selectedInterests={selectedInterests as string[]}
            onToggle={toggleInterest}
            error={
              errors.interests?.message ||
              (errors.interests?.root as { message?: string } | undefined)
                ?.message
            }
          />
        )}
        {currentStep === 2 && (
          <Step2Details
            register={register}
            errors={errors}
            budgetValue={budgetValue}
          />
        )}
        {currentStep === 3 && (
          <Step3Contact register={register} errors={errors} />
        )}
      </div>

      {submitMutation.error && (
        <div className="mt-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-500">
          {submitMutation.error.message}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-hairline pt-6">
        <button
          type="button"
          onClick={handleBack}
          className={clsx(
            "flex items-center gap-2 text-sm font-medium transition-colors",
            currentStep === 1 ? "invisible" : "text-muted hover:text-fg",
          )}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        {currentStep < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNext}
            className="primary-button flex items-center gap-2"
          >
            Next
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-button disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Inquiry"}
          </button>
        )}
      </div>
    </form>
  );
}
