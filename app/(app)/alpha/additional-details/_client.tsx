"use client";

import React, { useEffect, useState } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  type TypeSlideOneSchema,
  type TypeSlideTwoSchema,
  type TypeSlideThreeSchema,
  slideOneSchema,
  slideTwoSchema,
  slideThreeSchema,
} from "@/schema/additionalUserDetails";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { toast } from "sonner";
import {
  professionalOrStudentOptions,
  genderOptions,
  locationOptions,
  levelOfStudyOptions,
  monthsOptions,
} from "@/app/(app)/alpha/additional-details/selectOptions";
import {
  handleFormSlideOneSubmit,
  handleFormSlideThreeSubmit,
  handleFormSlideTwoSubmit,
} from "./_actions";

type UserDetails = {
  username: string;
  firstName: string;
  surname: string;
  gender: string;
  dateOfBirth: Date | undefined;
  location: string;
  professionalOrStudent: string;
  course: string;
  levelOfStudy: string;
  jobTitle: string;
  workplace: string;
};

export default function AdditionalSignUpDetails({
  details,
}: {
  details: UserDetails;
}) {
  const session = useSession();
  const searchParams = useSearchParams();

  const {
    surname,
    firstName,
    username,
    location,
    dateOfBirth,
    gender,
    professionalOrStudent,
  } = details;

  let slide: number;
  if (searchParams.get("slide")) {
    slide = Number(searchParams.get("slide"));
  } else if (!surname || !firstName || !username || !location) {
    slide = 1;
  } else if (!dateOfBirth || !gender) {
    slide = 2;
  } else if (!professionalOrStudent) {
    slide = 3;
  } else {
    return redirect("/settings");
  }

  if (!session) {
    return redirect("/get-started");
  }
  return (
    <div className="min-h-[41rem]">
      <SignupProgressBar currentSlide={slide} />

      {slide === 1 && <SlideOne details={details} />}
      {slide === 2 && <SlideTwo details={details} />}
      {slide === 3 && <SlideThree details={details} />}
    </div>
  );
}

function SlideOne({ details }: { details: UserDetails }) {
  const router = useRouter();

  const { username, firstName, surname, location } = details;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TypeSlideOneSchema>({
    resolver: zodResolver(slideOneSchema),
    defaultValues: { username, firstName, surname, location },
  });

  const onFormSubmit = async (data: TypeSlideOneSchema) => {
    try {
      const isSuccess = await handleFormSlideOneSubmit(data);
      if (isSuccess) {
        toast.success("Saved");
        router.push(`?slide=${2}`, { scroll: false });
      } else {
        toast.error("Error, saving was unsuccessful.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="h-[9rem] sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-neutral-900 dark:text-white">
            Profile information
          </h2>
          <p>This information will be displayed on your profile</p>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-sm ">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-neutral-900 dark:text-white"
              >
                First Name
              </label>
              <div className="mt-2 ">
                <input
                  id="name"
                  {...register("firstName")}
                  placeholder="What should we call you?"
                  type="text"
                  className="block w-full rounded-md border-0 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-black focus:ring-2 focus:ring-inset focus:ring-red-500 dark:text-white sm:text-sm sm:leading-6"
                />
                {errors.firstName && <p>{`${errors.firstName.message}`}</p>}
              </div>
            </div>

            <div>
              <label
                htmlFor="surname"
                className="block text-sm font-medium leading-6 text-neutral-900 dark:text-white"
              >
                Surname
              </label>
              <div className="mt-2">
                <input
                  id="surname"
                  {...register("surname")}
                  type="text"
                  placeholder="And your surname?"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-black focus:ring-2 focus:ring-inset focus:ring-red-500 dark:text-white sm:text-sm sm:leading-6"
                />
                {errors.surname && <p>{`${errors.surname.message}`}</p>}
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-6 text-neutral-900 dark:text-white"
              >
                Username
              </label>
              <div className="relative flex items-center">
                <div className="flex h-[36px] w-[7rem] items-center justify-center rounded-l-md bg-black text-white ring-1 ring-inset ring-white dark:bg-white dark:text-black">
                  <span>codu.co/</span>
                </div>
                <input
                  id="username"
                  {...register("username")}
                  placeholder="thehacker"
                  type="text"
                  className="ring-white/10... relative top-[-2px] block rounded-r-md border-0 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-black focus:ring-2 focus:ring-inset focus:ring-red-500 dark:text-white sm:text-sm sm:leading-6"
                />
              </div>
              {errors.username && <p>{`${errors.username.message}`}</p>}
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium leading-6 text-neutral-900 dark:text-white"
              >
                Location
              </label>
              <select
                id="location"
                {...register("location")}
                className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-neutral-900 ring-1 ring-inset ring-black focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
              >
                <option value="" disabled>
                  Select
                </option>
                {locationOptions.map((location: string) => (
                  <option key={location}>{location}</option>
                ))}
              </select>
              {errors.location && <p>{`${errors.location.message}`}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-neutral-900 shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SlideTwo({ details }: { details: UserDetails }) {
  const router = useRouter();
  const { dateOfBirth, gender } = details;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TypeSlideTwoSchema>({
    resolver: zodResolver(slideTwoSchema),
    defaultValues: { dateOfBirth, gender },
  });

  const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
  const [year, setYear] = useState<number | undefined>(
    parsedDateOfBirth?.getFullYear(),
  );
  const [month, setMonth] = useState<number | undefined>(
    parsedDateOfBirth?.getMonth(),
  );
  const [day, setDay] = useState<number | undefined>(
    parsedDateOfBirth?.getDate(),
  );

  const [listOfDaysInSelectedMonth, setListOfDaysInSelectedMonth] = useState([
    0,
  ]);

  useEffect(() => {
    // If year or month change, recalculate how many days are in the specified month
    if (year && month !== undefined) {
      // Returns the last day of the month, by creating a date with day 0 of the following month.
      const nummberOfDaysInMonth = new Date(year, month + 1, 0).getDate();
      const daysArray = Array.from(
        { length: nummberOfDaysInMonth },
        (_, index) => index + 1,
      );
      setListOfDaysInSelectedMonth(daysArray);
    }

    // Update the date object when year, month or date change
    if (year && month !== undefined && day) {
      let selectedDate: Date;

      if (new Date(year, month, day).getDate() < day) {
        // If user switches to a month in which selected day does not exist
        // ie from 30/1 to feb(only 28 days), then set day to the 1st
        selectedDate = new Date(year, month, 1);
      } else {
        selectedDate = new Date(year, month, day);
      }
      setValue("dateOfBirth", selectedDate);
    }
  }, [year, month, day]);

  const startYearAgeDropdown = 1950;
  const endYearAgeDropdown = 2010;
  const years = Array.from(
    { length: endYearAgeDropdown - startYearAgeDropdown + 1 },
    (_, index) => startYearAgeDropdown + index,
  ).reverse();

  const onFormSubmit = async (data: TypeSlideTwoSchema) => {
    try {
      const isSuccess = await handleFormSlideTwoSubmit(data);

      if (isSuccess) {
        toast.success("Saved");
        router.push(`?slide=${3}`, { scroll: false });
      } else {
        toast.error("Error, saving was unsuccessful.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="h-[9rem] sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-neutral-900 dark:text-white">
            Demographic
          </h2>
          <p>This information is private, but helps us improve</p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-sm ">
          <div className="h-[21.75rem] space-y-6">
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium leading-6 text-neutral-900"
              >
                Gender
              </label>
              <select
                id="gender"
                {...register("gender")}
                className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-neutral-900 ring-1 ring-inset  ring-black focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
              >
                <option value="" disabled>
                  Gender
                </option>
                {genderOptions.map((gender: string) => (
                  <option key={gender}>{gender}</option>
                ))}
              </select>

              {errors.gender && <p>{`${errors.gender.message}`}</p>}
            </div>

            <fieldset>
              <legend>Date of Birth</legend>

              <div className="flex justify-between gap-1 sm:gap-8">
                <div className="flex-grow">
                  <label htmlFor="year" className="hidden">
                    Year
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={year ? year : ""}
                    required
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-neutral-900 ring-1 ring-inset ring-black focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                  >
                    <option value="" disabled>
                      Year
                    </option>
                    {years.map((year) => (
                      <option key={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-grow">
                  <label htmlFor="month" className="hidden">
                    Month
                  </label>
                  <select
                    id="month"
                    name="month"
                    value={month !== undefined ? monthsOptions[month] : ""}
                    required
                    className="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-neutral-900 ring-1 ring-inset ring-black focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                    onChange={(e) =>
                      setMonth(monthsOptions.indexOf(e.target.value))
                    }
                  >
                    <option value="" disabled>
                      Month
                    </option>
                    {monthsOptions.map((month) => (
                      <option key={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-grow">
                  <label htmlFor="day" className="hidden">
                    day
                  </label>
                  <select
                    id="day"
                    name="day"
                    value={day ? day : ""}
                    className="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-neutral-900 ring-1 ring-inset ring-black focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                    disabled={!year || undefined}
                    required
                    onChange={(e) => setDay(Number(e.target.value))}
                  >
                    <option value="" disabled>
                      Day
                    </option>

                    {listOfDaysInSelectedMonth.map((day) => (
                      <option key={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>
              {errors.dateOfBirth && <p>{`${errors.dateOfBirth.message}`}</p>}
            </fieldset>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`?slide=${1}`, { scroll: false })}
              className="mr-4 flex w-[6rem] justify-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-6 text-black shadow-sm ring-1 ring-inset hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              Go back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-neutral-900 shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function SlideThree({ details }: { details: UserDetails }) {
  const router = useRouter();

  const { professionalOrStudent, workplace, jobTitle, course, levelOfStudy } =
    details;

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TypeSlideThreeSchema>({
    resolver: zodResolver(slideThreeSchema),
    defaultValues: {
      professionalOrStudent,
      workplace,
      jobTitle,
      course,
      levelOfStudy,
    },
  });

  watch("professionalOrStudent");

  const onFormSubmit = async (data: TypeSlideThreeSchema) => {
    let isError = await trigger(["professionalOrStudent"]);
    const professionalOrStudent = getValues("professionalOrStudent");

    if (isError && professionalOrStudent === "Working professional") {
      isError = await trigger(["workplace", "jobTitle"]);
    }

    if (isError && professionalOrStudent === "Current student") {
      isError = await trigger(["levelOfStudy", "course"]);
    }

    if (isError) {
      try {
        const isSuccess = await handleFormSlideThreeSubmit(data);
        if (isSuccess) {
          toast.success("Saved");
          router.push(`/`, { scroll: false });
        } else {
          toast.error("Error, saving was unsuccessful.");
        }
      } catch (error) {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8"
    >
      <div className="h-[9rem] sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-neutral-900 dark:text-white">
          Work and education
        </h2>
        <p>
          This information is private but helpful to tailor our events and
          features.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="h-[21.75rem] space-y-6">
          <div>
            <label
              htmlFor="professional-or-student"
              className="block text-sm font-medium leading-6 text-neutral-900"
            >
              Which best describes you?
            </label>
            <select
              id="professional-or-student"
              {...register("professionalOrStudent")}
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-neutral-900 ring-1 ring-inset ring-black  focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
            >
              <option value="" disabled>
                Select one
              </option>

              {professionalOrStudentOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            {errors.professionalOrStudent && (
              <p>{`${errors.professionalOrStudent.message}`}</p>
            )}
          </div>

          {getValues("professionalOrStudent") === "Working professional" && (
            <>
              <div>
                <label
                  htmlFor="workplace"
                  className="block text-sm font-medium leading-6 text-neutral-900 dark:text-white"
                >
                  Where are you working?
                </label>
                <div className="mt-2">
                  <input
                    id="workplace"
                    {...register("workplace")}
                    type="text"
                    placeholder="Codú corp"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-black  focus:ring-2 focus:ring-inset focus:ring-red-500 dark:text-white sm:text-sm sm:leading-6"
                  />
                </div>
                {errors.workplace && <p>{`${errors.workplace.message}`}</p>}
              </div>

              <div>
                <label
                  htmlFor="job-title"
                  className="block text-sm font-medium leading-6 text-neutral-900 dark:text-white"
                >
                  What is your job title?
                </label>
                <div className="mt-2">
                  <input
                    id="job-title"
                    {...register("jobTitle")}
                    type="text"
                    placeholder="Chief transponster"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-black  focus:ring-2 focus:ring-inset focus:ring-red-500 dark:text-white sm:text-sm sm:leading-6"
                  />
                </div>
                {errors.jobTitle && <p>{`${errors.jobTitle.message}`}</p>}
              </div>
            </>
          )}

          {getValues("professionalOrStudent") === "Current student" && (
            <>
              <div>
                <label
                  htmlFor="level-of-study"
                  className="block text-sm font-medium leading-6 text-neutral-900"
                >
                  What is your current level of study?
                </label>
                <select
                  id="level-of-study"
                  {...register("levelOfStudy")}
                  className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-neutral-900 ring-1 ring-inset ring-black focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                >
                  <option value="" disabled>
                    Select level of study
                  </option>

                  {levelOfStudyOptions.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
                {errors.levelOfStudy && (
                  <p>{`${errors.levelOfStudy.message}`}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="course"
                  className="block text-sm font-medium leading-6 text-neutral-900 dark:text-white"
                >
                  What are you studying?
                </label>
                <div className="mt-2">
                  <input
                    id="course"
                    {...register("course")}
                    type="text"
                    placeholder="Course name"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-black focus:ring-2 focus:ring-inset focus:ring-red-500 dark:text-white sm:text-sm sm:leading-6"
                  />
                </div>
                {errors.course && <p>{`${errors.course.message}`}</p>}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => router.push(`?slide=${2}`, { scroll: false })}
            className="mr-4 flex w-[6rem] justify-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-6 text-black shadow-sm ring-1 ring-inset hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            Go back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6  text-neutral-900 shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-white"
          >
            Submit
          </button>
        </div>
      </div>
    </form>
  );
}

function SignupProgressBar({ currentSlide }: { currentSlide: number }) {
  const progressPercentage = (100 / 4) * currentSlide;

  return (
    <div className="flex h-2">
      <div className="h-full grow">
        <div
          style={{ width: `${progressPercentage}%` }}
          className="h-full bg-red-500"
        ></div>
      </div>
      <div className="pr-4">{progressPercentage}%</div>
    </div>
  );
}
