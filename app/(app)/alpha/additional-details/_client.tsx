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
import { useForm, useFormContext } from "react-hook-form";

import { toast } from "sonner";
import {
  professionalOrStudentOptions,
  genderOptions,
  locationOptions,
  levelOfStudyOptions,
  monthsOptions,
} from "@/app/(app)/alpha/additional-details/selectOptions";

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

  const slide = Number(searchParams.get("slide")) || 1;
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
      // const isSuccess = await handleFormSlideOneSubmit(data); TODO add server action
      const isSuccess = true;
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
          <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
            Profile information
          </h2>
          <p>This information will be displayed on your profile</p>
        </div>
        <div className="mt-10... sm:mx-auto sm:w-full sm:max-w-sm ">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-white"
              >
                First Name
              </label>
              <div className="mt-2 ">
                <input
                  id="name"
                  {...register("firstName")}
                  placeholder="What should we call you?"
                  type="text"
                  className="block w-full rounded-md border-0 bg-white/5  py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
                />
                {errors.firstName && <p>{`${errors.firstName.message}`}</p>}
              </div>
            </div>

            <div>
              <label
                htmlFor="surname"
                className="block text-sm font-medium leading-6 text-white"
              >
                Surname
              </label>
              <div className="mt-2">
                <input
                  id="surname"
                  {...register("surname")}
                  type="text"
                  placeholder="And your surname?"
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
                />
                {errors.surname && <p>{`${errors.surname.message}`}</p>}
              </div>
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-6 text-white"
              >
                Username
              </label>
              <div className="relative flex items-center">
                <div className="flex h-[36px] w-[7rem] items-center justify-center rounded-l-md bg-white text-black">
                  <span>codu.co/</span>
                </div>
                <input
                  id="username"
                  {...register("username")}
                  placeholder="thehacker"
                  type="text"
                  className="relative top-[-2px] block rounded-r-md border-0 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
                />
              </div>
              {errors.username && <p>{`${errors.username.message}`}</p>}
            </div>
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium leading-6 text-white"
              >
                Location
              </label>
              <select
                id="location"
                {...register("location")}
                className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
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
              className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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

  const [year, setYear] = useState<number | undefined>(
    dateOfBirth?.getFullYear(),
  );
  const [month, setMonth] = useState<number | undefined>(
    dateOfBirth?.getMonth(),
  );
  const [day, setDay] = useState<number | undefined>(dateOfBirth?.getDate());

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
      // const isSuccess = await handleFormSlideTwoSubmit(data); TODO add server action
      const isSuccess = true;
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
          <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
            Demographic
          </h2>
          <p>This information is private, but helps us improve</p>
        </div>

        <div className="mt-10... sm:mx-auto sm:w-full sm:max-w-sm ">
          <div className="h-[21.75rem] space-y-6">
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Gender
              </label>
              <select
                id="gender"
                {...register("gender")}
                className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
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
                    className="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
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
                    className="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
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
                    className="mt-2 block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                    disabled={!year || month === undefined}
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
              className="mr-4 flex w-[6rem] justify-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-6 text-black shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              Go back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
        // const isSuccess = await handleFormSlideThreeSubmit(data); TODO add server action
        const isSuccess = true;
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
      <div className="bg-red-400... h-[9rem] sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
          Work and education
        </h2>
        <p>
          This information is private but helpful to tailor our events and
          features.
        </p>
      </div>

      <div className="mt-10... sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-yellow-400... h-[21.75rem] space-y-6">
          <div>
            <label
              htmlFor="professional-or-student"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Which best describes you?
            </label>
            <select
              id="professional-or-student"
              {...register("professionalOrStudent")}
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
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
                  className="block text-sm font-medium leading-6 text-white"
                >
                  Where are you working?
                </label>
                <div className="mt-2">
                  <input
                    id="workplace"
                    {...register("workplace")}
                    type="text"
                    placeholder="Codú corp"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
                  />
                </div>
                {errors.workplace && <p>{`${errors.workplace.message}`}</p>}
              </div>

              <div>
                <label
                  htmlFor="job-title"
                  className="block text-sm font-medium leading-6 text-white"
                >
                  What is your job title?
                </label>
                <div className="mt-2">
                  <input
                    id="job-title"
                    {...register("jobTitle")}
                    type="text"
                    placeholder="Codú corp"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
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
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  What is your current level of study?
                </label>
                <select
                  id="level-of-study"
                  {...register("levelOfStudy")}
                  className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
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
                  className="block text-sm font-medium leading-6 text-white"
                >
                  What are you studying?
                </label>
                <div className="mt-2">
                  <input
                    id="course"
                    {...register("course")}
                    type="text"
                    placeholder="Course name"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
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
            className="mr-4 flex w-[6rem] justify-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-6 text-black shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            Go back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Submit
          </button>
        </div>
      </div>
    </form>
  );
}

function SlideFour() {
  const {
    getValues,
    formState: { errors },
  } = useFormContext();

  const router = useRouter();

  const firstName = getValues("firstName");
  const surname = getValues("surname");
  const username = getValues("username");
  const location = getValues("location");
  const gender = getValues("gender");
  const dateOfBirth = getValues("dateOfBirth");
  const professionalOrStudent = getValues("professionalOrStudent");
  const workplace = getValues("workplace");
  const jobTitle = getValues("jobTitle");
  const levelOfStudy = getValues("levelOfStudy");
  const course = getValues("course");

  const handleClickPreviousSlide = () => {
    router.push(`?slide=${3}`, { scroll: false });
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="h-[9rem] sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
          Review
        </h2>
        <p>Please review the details before submitting.</p>
      </div>

      <div className="mt-10... sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="bg-yellow-400... flex h-[21.75rem] flex-col items-start space-y-3 ">
          <div className="flex min-w-[20rem]">
            <p className="bg-red-400... w-1/2">First name: </p>{" "}
            <p className="w-1/2"> {firstName}</p>
          </div>
          <div className="flex min-w-[20rem]">
            <p className="bg-red-400... w-1/2">Surname: </p>{" "}
            <p className="w-1/2"> {surname}</p>
          </div>
          <div className="flex min-w-[20rem]">
            <p className="w-1/2">Username: </p>{" "}
            <p className="w-1/2"> {username}</p>
          </div>

          <div className="flex min-w-[20rem]">
            <p className="w-1/2">Location: </p>{" "}
            <p className="w-1/2"> {location}</p>
          </div>

          <div className="flex min-w-[20rem]">
            <p className="w-1/2">Gender: </p> <p className="w-1/2"> {gender}</p>
          </div>

          <div className="flex min-w-[20rem]">
            <p className="w-1/2">Date of birth: </p>{" "}
            <p className="w-1/2">
              {" "}
              {dateOfBirth.getDate()}
              {" / "}
              {dateOfBirth.getMonth() + 1} {" / "}
              {dateOfBirth.getFullYear()}
            </p>
          </div>

          <div className="flex min-w-[20rem]">
            <p className="w-1/2">Occupation Status: </p>{" "}
            <p className="w-1/2"> {professionalOrStudent}</p>
          </div>

          {workplace && (
            <div className="flex min-w-[20rem]">
              <p className="w-1/2">Workplace: </p>{" "}
              <p className="w-1/2"> {workplace}</p>
            </div>
          )}

          {jobTitle && (
            <div className="flex min-w-[20rem]">
              <p className="w-1/2">Job title: </p>{" "}
              <p className="w-1/2"> {jobTitle}</p>
            </div>
          )}

          {levelOfStudy && (
            <div className="flex min-w-[20rem]">
              <p className="w-1/2">Level of study: </p>{" "}
              <p className="w-1/2"> {levelOfStudy}</p>
            </div>
          )}

          {course && (
            <div className="flex min-w-[20rem]">
              <p className="w-1/2">Course: </p>{" "}
              <p className="w-1/2"> {course}</p>
            </div>
          )}
        </div>
        <SlideButtons
          handleClickPreviousSlide={handleClickPreviousSlide}
          isSubmitButton={true}
        />
      </div>
    </div>
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

type SlideButtonsProps = {
  handleClickNextSlide?: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  handleClickPreviousSlide?: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void;
  isSubmitButton?: boolean;
};

function SlideButtons(props: SlideButtonsProps) {
  const { handleClickNextSlide, handleClickPreviousSlide, isSubmitButton } =
    props;

  const {
    formState: { isSubmitting },
  } = useFormContext();

  return (
    <div className="mt-6 flex justify-end">
      {handleClickPreviousSlide && (
        <button
          onClick={(e) => handleClickPreviousSlide(e)}
          className="mr-4 flex w-[6rem] justify-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-6 text-black shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
        >
          Go back
        </button>
      )}

      {handleClickNextSlide && (
        <button
          onClick={(e) => handleClickNextSlide(e)}
          className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Next
        </button>
      )}

      {isSubmitButton && (
        <button
          disabled={isSubmitting}
          type="submit"
          className="flex w-[6rem] justify-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white "
        >
          Submit
        </button>
      )}
    </div>
  );
}
