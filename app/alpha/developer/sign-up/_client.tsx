"use client";

import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  type TypeDeveloperDetailsSchema,
  DeveloperDetailsSchema,
} from "@/schema/developerDetails";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Prisma } from "@prisma/client";
import { handleFormSubmit } from "./actions";
import { toast } from "sonner";
import {
  professionalOrStudentOptions,
  genderOptions,
  locationOptions,
  levelOfStudyOptions,
  monthsOptions,
} from "@/app/alpha/developer/sign-up/selectOptions";

type SlideProps = {
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
};

type DeveloperDetailsPayload = Prisma.UserGetPayload<{
  select: {
    name: true;
    username: true;
    developerDetails: {
      select: {
        course: true;
        dateOfBirth: true;
        gender: true;
        levelOfStudy: true;
        jobTitle: true;
        workplace: true;
        professionalOrStudent: true;
        location: true;
      };
    };
  };
}>;

export default function SignUp({
  details,
}: {
  details: DeveloperDetailsPayload | null;
}) {
  const { data: session } = useSession();
  if (!session) {
    redirect("/get-started");
  }

  const defaultDetails = {
    ...details,
    name: details?.name,
    username: details?.username || "",
    developerDetails: {
      dateOfBirth: details?.developerDetails?.dateOfBirth,
      course: details?.developerDetails?.course || "",
      gender: details?.developerDetails?.gender || "",
      levelOfStudy: details?.developerDetails?.levelOfStudy || "",
      jobTitle: details?.developerDetails?.jobTitle || "",
      workplace: details?.developerDetails?.workplace || "",
      professionalOrStudent:
        details?.developerDetails?.professionalOrStudent || "",
      location: details?.developerDetails?.location || "",
    },
  };

  const useFormObject = useForm<TypeDeveloperDetailsSchema>({
    resolver: zodResolver(DeveloperDetailsSchema),
    defaultValues: defaultDetails ?? {},
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  const onFormSubmit = async (data: TypeDeveloperDetailsSchema) => {
    const isSuccess = await handleFormSubmit(data);

    if (isSuccess) {
      toast.success("Saved");
    }
    if (!isSuccess) {
      toast.error("Error, saving was unsuccessful.");
    }
  };

  return (
    <>
      <FormProvider {...useFormObject}>
        <form
          className="min-h-[41rem]"
          onSubmit={useFormObject.handleSubmit((data) => onFormSubmit(data))}
        >
          <SignupProgressBar currentSlide={currentSlide} />

          {currentSlide === 0 && <SlideOne setCurrentSlide={setCurrentSlide} />}
          {currentSlide === 1 && <SlideTwo setCurrentSlide={setCurrentSlide} />}
          {currentSlide === 2 && (
            <SlideThree setCurrentSlide={setCurrentSlide} />
          )}
          {currentSlide === 3 && (
            <SlideFour setCurrentSlide={setCurrentSlide} />
          )}
        </form>
      </FormProvider>
    </>
  );
}

function SlideOne(props: SlideProps) {
  const { setCurrentSlide } = props;
  const {
    register,
    trigger,
    getFieldState,
    formState: { errors },
  } = useFormContext();

  let nameError = getFieldState("name").error;
  let usernameError = getFieldState("username").error;
  let locationError = getFieldState("developerDetails.location").error;

  const handleClickNextSlide = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    await trigger(["name", "username", "developerDetails.location"]);

    nameError = getFieldState("name").error;
    usernameError = getFieldState("username").error;
    locationError = getFieldState("developerDetails.location").error;

    if (!nameError && !usernameError && !locationError) {
      setCurrentSlide((curr) => curr + 1);
    }
  };

  return (
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
                {...register("name")}
                placeholder="What should we call you?"
                type="text"
                className="block w-full rounded-md border-0 bg-white/5  py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
              />
              {nameError && <p>{`${nameError.message}`}</p>}
            </div>
          </div>

          {/* ------------------------------------------------------------------------------------------------------------- */}

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium leading-6 text-white"
            >
              Last Name
            </label>
            <div className="mt-2">
              <input
                type="text"
                placeholder="And your last name?"
                disabled
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* ------------------------------------------------------------------------------------------------------------- */}

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
            {usernameError && <p>{`${usernameError.message}`}</p>}
          </div>
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Location
            </label>
            <select
              id="location"
              {...register("developerDetails.location")}
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
            >
              <option value="" disabled>
                Select
              </option>
              {locationOptions.map((location: string) => (
                <option key={location}>{location}</option>
              ))}
            </select>
            {locationError && <p>{`${locationError.message}`}</p>}
          </div>
        </div>
        <SlideButtons handleClickNextSlide={handleClickNextSlide} />
      </div>
    </div>
  );
}

function SlideTwo(props: SlideProps) {
  const { setCurrentSlide } = props;

  const {
    getValues,
    setValue,
    register,
    getFieldState,
    trigger,
    formState: { errors },
  } = useFormContext();

  const dob = getValues("developerDetails.dateOfBirth");
  const [year, setYear] = useState<number | undefined>(dob?.getFullYear());
  const [month, setMonth] = useState<number | undefined>(dob?.getMonth());
  const [day, setDay] = useState<number | undefined>(dob?.getDate());

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
      setValue("developerDetails.dateOfBirth", selectedDate);
    }
  }, [year, month, day]);

  const startYearAgeDropdown = 1950;
  const endYearAgeDropdown = 2010;
  const years = Array.from(
    { length: endYearAgeDropdown - startYearAgeDropdown + 1 },
    (_, index) => startYearAgeDropdown + index,
  ).reverse();

  let genderError = getFieldState("developerDetails.gender").error;

  const handleClickNextSlide = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();

    await trigger(["developerDetails.gender"]);

    genderError = getFieldState("developerDetails.gender").error;

    if (!genderError && dob !== undefined) {
      setCurrentSlide((curr) => curr + 1);
    }
  };

  const handleClickPreviousSlide = () => {
    setCurrentSlide((curr) => curr - 1);
  };

  return (
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
              {...register("developerDetails.gender")}
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
            >
              <option value="" disabled>
                Gender
              </option>
              {genderOptions.map((gender: string) => (
                <option key={gender}>{gender}</option>
              ))}
            </select>
            {genderError && <p>{`${genderError.message}`}</p>}
          </div>

          <fieldset>
            <legend>Date of Birth</legend>

            <div className="flex justify-between gap-1">
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
          </fieldset>
        </div>

        <SlideButtons
          handleClickNextSlide={handleClickNextSlide}
          handleClickPreviousSlide={handleClickPreviousSlide}
        />
      </div>
    </div>
  );
}

function SlideThree(props: SlideProps) {
  const { setCurrentSlide } = props;

  const handleClickPreviousSlide = () => {
    setCurrentSlide((curr) => curr - 1);
  };

  const {
    getValues,
    register,
    watch,
    trigger,
    getFieldState,
    formState: { errors },
  } = useFormContext();

  watch("developerDetails.professionalOrStudent");

  const professionalOrStudentError = getFieldState(
    "developerDetails.professionalOrStudent",
  ).error;

  let workplaceError = getFieldState("developerDetails.workplace").error;
  let jobTitleError = getFieldState("developerDetails.jobTitle").error;

  let levelOfStudyError = getFieldState("developerDetails.levelOfStudy").error;
  let courseError = getFieldState("developerDetails.course").error;

  const handleClickNextSlide = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    await trigger(["developerDetails.professionalOrStudent"]);

    if (!professionalOrStudentError) {
      const professionalOrStudent = getValues(
        "developerDetails.professionalOrStudent",
      );

      if (professionalOrStudent === "Working professional") {
        await trigger([
          "developerDetails.workplace",
          "developerDetails.jobTitle",
        ]);
        workplaceError = getFieldState("developerDetails.workplace").error;
        jobTitleError = getFieldState("developerDetails.jobTitle").error;

        if (!workplaceError && !jobTitleError) {
          setCurrentSlide((curr) => curr + 1);
        }
      } else if (professionalOrStudent === "Current student") {
        await trigger([
          "developerDetails.levelOfStudy",
          "developerDetails.course",
        ]);
        levelOfStudyError = getFieldState(
          "developerDetails.levelOfStudy",
        ).error;
        courseError = getFieldState("developerDetails.course").error;

        if (!levelOfStudyError && !courseError) {
          setCurrentSlide((curr) => curr + 1);
        }
      } else if (professionalOrStudent === "None of the above") {
        setCurrentSlide((curr) => curr + 1);
      }
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
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
              {...register("developerDetails.professionalOrStudent")}
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
            >
              <option value="" disabled>
                Select one
              </option>

              {professionalOrStudentOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
            {professionalOrStudentError && (
              <p>{`${professionalOrStudentError.message}`}</p>
            )}
          </div>

          {getValues("developerDetails.professionalOrStudent") ===
            "Working professional" && (
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
                    {...register("developerDetails.workplace")}
                    type="text"
                    placeholder="Codú corp"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
                  />
                </div>
                {workplaceError && <p>{`${workplaceError.message}`}</p>}
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
                    {...register("developerDetails.jobTitle")}
                    type="text"
                    placeholder="Codú corp"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
                  />
                </div>
                {jobTitleError && <p>{`${jobTitleError.message}`}</p>}
              </div>
            </>
          )}

          {getValues("developerDetails.professionalOrStudent") ===
            "Current student" && (
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
                  {...register("developerDetails.levelOfStudy")}
                  className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-600 sm:text-sm sm:leading-6"
                >
                  <option value="" disabled>
                    Select level of study
                  </option>

                  {levelOfStudyOptions.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
                {levelOfStudyError && <p>{`${levelOfStudyError.message}`}</p>}
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
                    {...register("developerDetails.course")}
                    type="text"
                    placeholder="Course name"
                    className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
                  />
                </div>
                {courseError && <p>{`${courseError.message}`}</p>}
              </div>
            </>
          )}
        </div>

        <SlideButtons
          handleClickPreviousSlide={handleClickPreviousSlide}
          handleClickNextSlide={handleClickNextSlide}
        />
      </div>
    </div>
  );
}

function SlideFour(props: SlideProps) {
  const { setCurrentSlide } = props;

  const {
    getValues,
    formState: { errors },
  } = useFormContext();

  const name = getValues("name");
  const username = getValues("username");
  const location = getValues("developerDetails.location");
  const gender = getValues("developerDetails.gender");
  const dateOfBirth = getValues("developerDetails.dateOfBirth");
  const professionalOrStudent = getValues(
    "developerDetails.professionalOrStudent",
  );
  const workplace = getValues("developerDetails.workplace");
  const jobTitle = getValues("developerDetails.jobTitle");
  const levelOfStudy = getValues("developerDetails.levelOfStudy");
  const course = getValues("developerDetails.course");

  const handleClickPreviousSlide = () => {
    setCurrentSlide((curr) => curr - 1);
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
            <p className="bg-red-400... w-1/2">Name: </p>{" "}
            <p className="w-1/2"> {name}</p>
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
  const progressPercentage = (100 / 4) * (currentSlide + 1);

  return (
    <div className="mx-auto flex h-2 max-w-7xl items-center">
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
