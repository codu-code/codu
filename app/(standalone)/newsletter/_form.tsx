"use client";

import { useFormState, useFormStatus } from "react-dom";
import { subscribeToNewsletter } from "./actions";
import { toast } from "sonner";
import { useEffect } from "react";

const initialState = {
  message: "",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      className="flex-none rounded-md bg-pink-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:hover:bg-pink-600"
    >
      {pending ? "Subscribing" : "Subscribe"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useFormState(subscribeToNewsletter, initialState);

  useEffect(() => {
    if (state.message === "success") {
      toast.success("You're subscribed!");
    } else if (state.message === "error") {
      toast.error("Something went wrong. Please try again.");
    }
  }, [state.message]);

  return (
    <form action={formAction} className="mt-6 flex max-w-md gap-x-4">
      <label htmlFor="email-address" className="sr-only">
        Email address
      </label>
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        id="email-address"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="mt-0 min-w-0 flex-auto rounded-md border-0 bg-white/5 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-pink-500 sm:text-sm sm:leading-6"
        placeholder="Enter your email"
        disabled={state.message === "success"}
      />
      <SubmitButton disabled={state.message === "success"} />
      <p aria-live="polite" className="sr-only" role="status">
        {state.message === "success"
          ? "You're subscribed! "
          : state.message === "error"
            ? "Something went wrong. Please try again."
            : null}
      </p>
    </form>
  );
}
