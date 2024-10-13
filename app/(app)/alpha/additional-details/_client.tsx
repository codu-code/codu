"use client";

import React, { useEffect, useRef, useState } from "react";
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
  slideOneSubmitAction,
  slideThreeSubmitAction,
  slideTwoSubmitAction,
} from "./_actions";
import {
  ErrorMessage,
  Field,
  Fieldset,
  Label,
  Legend,
} from "@/components/ui-components/fieldset";
import { Input } from "@/components/ui-components/input";
import { Select } from "@/components/ui-components/select";
import { Button } from "@/components/ui-components/button";
import { Heading, Subheading } from "@/components/ui-components/heading";
import { Divider } from "@/components/ui-components/divider";
import { Avatar } from "@/components/ui-components/avatar";
import { Text } from "@/components/ui-components/text";
import { api } from "@/server/trpc/react";
import { uploadFile } from "@/utils/s3helpers";

type UserDetails = {
  username: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  location: string;
  professionalOrStudent: string;
  course: string;
  levelOfStudy: string;
  jobTitle: string;
  workplace: string;
  image: string;
};

type ProfilePhoto = {
  status: "success" | "error" | "loading" | "idle";
  url: string;
};

export default function AdditionalSignUpDetails({
  details,
}: {
  details: UserDetails;
}) {
  const session = useSession();
  const searchParams = useSearchParams();

  const {
    name,
    username,
    location,
    dateOfBirth,
    gender,
    professionalOrStudent,
  } = details;

  let slide: number;
  if (searchParams.get("slide")) {
    slide = Number(searchParams.get("slide"));
  } else if (!name || !username || !location) {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState<ProfilePhoto>({
    status: "idle",
    url: details.image,
  });
  const { username, name, location } = details;
  const { mutateAsync: getUploadUrl } = api.profile.getUploadUrl.useMutation();
  const { mutateAsync: updateUserPhotoUrl } =
    api.profile.updateProfilePhotoUrl.useMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TypeSlideOneSchema>({
    resolver: zodResolver(slideOneSchema),
    defaultValues: { username, name, location },
  });
  const uploadToUrl = async (signedUrl: string, file: File) => {
    setProfilePhoto({ status: "loading", url: "" });

    if (!file) {
      setProfilePhoto({ status: "error", url: "" });
      toast.error("Invalid file upload.");
      return;
    }
    try {
      const response = await uploadFile(signedUrl, file);
      const { fileLocation } = response;
      await updateUserPhotoUrl({
        url: fileLocation,
      });

      return fileLocation;
    } catch (error) {
      setProfilePhoto({ status: "error", url: "" });
      toast.error("Failed to upload profile photo. Please try again.");
      return null;
    }
  };
  const imageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const { size, type } = file;

      await getUploadUrl(
        { size, type },
        {
          onError(error) {
            if (error) return toast.error(error.message);
            return toast.error(
              "Something went wrong uploading the photo, please retry.",
            );
          },
          async onSuccess(signedUrl) {
            const url = await uploadToUrl(signedUrl, file);
            if (!url) {
              return toast.error(
                "Something went wrong uploading the photo, please retry.",
              );
            }
            setProfilePhoto({ status: "success", url });
            toast.success(
              "Profile photo successfully updated. This may take a few minutes to update around the site.",
            );
          },
        },
      );
    }
  };

  const onFormSubmit = async (data: TypeSlideOneSchema) => {
    try {
      const isSuccess = await slideOneSubmitAction(data);
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
    <form className="mx-auto max-w-sm" onSubmit={handleSubmit(onFormSubmit)}>
      <div className="min-h-[32rem]">
        <div className="mx-4">
          <Heading className="mt-16">Profile information</Heading>
          <Subheading>
            This information will be displayed on your profile
          </Subheading>
        </div>
        <Divider className="my-4 mt-4" />

        <div className="mx-4 my-4">
          <Field className="flex-grow">
            <Label>Profile Picture</Label>
            <div className="mt-3 flex items-center justify-between gap-4 px-3">
              <Avatar
                square
                src={
                  profilePhoto.status === "error" ||
                  profilePhoto.status === "loading"
                    ? undefined
                    : `${profilePhoto.url}`
                }
                alt="Profile photo upload section"
                className="h-16 w-16 overflow-hidden rounded-full"
              />
              <div className="pt-[30px]">
                <Button
                  color="dark/white"
                  type="button"
                  className="h-[30px] rounded-md text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change avatar
                </Button>
                <Input
                  type="file"
                  id="file-input"
                  name="user-photo"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={imageChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Text className="mt-1 text-xs text-gray-500">
                  JPG, GIF or PNG. 10MB max.
                </Text>
              </div>
            </div>
          </Field>
        </div>
        <div className="mx-4">
          <Field>
            <Label>Full Name</Label>
            <Input
              id="full-name"
              placeholder="Enter full name"
              invalid={!!errors?.name}
              {...register("name")}
            />
            {errors?.name && (
              <ErrorMessage className="text-red-500">
                {errors.name.message}
              </ErrorMessage>
            )}
          </Field>
        </div>

        <div className="mx-4 mt-4">
          <Field>
            <Label>Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              invalid={!!errors?.username}
              {...register("username")}
            />
            {errors?.username && (
              <ErrorMessage className="text-red-500">
                {errors.username.message}
              </ErrorMessage>
            )}
          </Field>
        </div>

        <div className="mx-4 mt-4">
          <Field>
            <Label>Location</Label>
            <Select {...register("location")} defaultValue="" id="location">
              <option value="" disabled>
                Select country
              </option>
              {locationOptions.map((location: string) => (
                <option key={location}>{location}</option>
              ))}
            </Select>
            {errors?.location && (
              <ErrorMessage className="text-red-500">
                {errors.location.message}
              </ErrorMessage>
            )}
          </Field>
        </div>
      </div>

      <div className="mr-4 mt-6 flex justify-end sm:mr-0">
        <Button
          color={"dark/white"}
          className="w-24 cursor-pointer"
          type="submit"
          disabled={isSubmitting}
        >
          Next
        </Button>
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
      setValue("dateOfBirth", selectedDate.toISOString());
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
      const isSuccess = await slideTwoSubmitAction(data);

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
    <form className="mx-auto max-w-sm" onSubmit={handleSubmit(onFormSubmit)}>
      <div className="min-h-[32rem]">
        <div className="mx-4">
          <Heading className="mt-16">Demographic</Heading>
          <Subheading>
            This information is private, but helps us improve
          </Subheading>
        </div>
        <Divider className="my-4 mt-4" />

        <div className="mx-4 mt-4">
          <Field>
            <Label>Gender</Label>
            <Select {...register("gender")} defaultValue="" id="gender">
              <option value="" disabled>
                Gender
              </option>
              {genderOptions.map((gender: string) => (
                <option key={gender}>{gender}</option>
              ))}
            </Select>
            {errors?.gender && (
              <ErrorMessage className="text-red-500">
                {errors.gender.message}
              </ErrorMessage>
            )}
          </Field>
        </div>

        <Divider className="my-4 mt-4" />

        <Fieldset>
          <Legend className="mx-4">Date of Birth</Legend>
          <div className="mx-4 flex justify-between">
            <Field>
              <Select
                id="year"
                aria-label="Year"
                value={year ? year : ""}
                required
                onChange={(e) => setYear(Number(e.target.value))}
              >
                <option value="" disabled>
                  Year
                </option>
                {years.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </Select>
            </Field>

            <Field>
              <Select
                id="month"
                aria-label="month"
                value={month !== undefined ? monthsOptions[month] : ""}
                required
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
              </Select>
            </Field>

            <Field>
              <Select
                id="day"
                aria-label="day"
                value={day ? day : ""}
                disabled={!month || undefined}
                required
                onChange={(e) => setDay(Number(e.target.value))}
              >
                <option value="" disabled>
                  day
                </option>
                {listOfDaysInSelectedMonth.map((day) => (
                  <option key={day}>{day}</option>
                ))}
              </Select>
            </Field>
          </div>
          {errors.dateOfBirth && <p>{`${errors.dateOfBirth.message}`}</p>}
        </Fieldset>
      </div>

      <div className="mr-4 mt-6 flex justify-end gap-4 sm:mr-0">
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => router.push(`?slide=${1}`, { scroll: false })}
          className="w-24 cursor-pointer"
        >
          Go back
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          color={"dark/white"}
          className="w-24 cursor-pointer"
        >
          Next
        </Button>
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
        const isSuccess = await slideThreeSubmitAction(data);
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
    <form className="mx-auto max-w-sm" onSubmit={handleSubmit(onFormSubmit)}>
      <div className="min-h-[32rem]">
        <div className="mx-4">
          <Heading className="mt-16"> Work and education</Heading>
          <Subheading>
            This information is private but helpful to tailor our events and
            features.
          </Subheading>
        </div>
        <Divider className="my-4 mt-4" />
        <Fieldset>
          <Field className="mx-4 my-4">
            <Label>Which best describes you?</Label>

            <Select
              id="professional-or-student"
              {...register("professionalOrStudent")}
            >
              <option value="" disabled>
                Select one
              </option>

              {professionalOrStudentOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
            {errors.professionalOrStudent && (
              <ErrorMessage className="text-red-500">
                {errors.professionalOrStudent.message}
              </ErrorMessage>
            )}
          </Field>

          {getValues("professionalOrStudent") === "Working professional" && (
            <>
              <Field className="mx-4 my-4">
                <Label>Where are you working?</Label>
                <Input
                  id="workplace"
                  {...register("workplace")}
                  placeholder="Codú corp"
                />
                {errors.workplace && (
                  <ErrorMessage className="text-red-500">
                    {errors.workplace.message}
                  </ErrorMessage>
                )}
              </Field>

              <Field className="mx-4 my-4">
                <Label>What is your job title?</Label>
                <Input
                  id="job-title"
                  {...register("jobTitle")}
                  placeholder="Chief transponster"
                />
                {errors.jobTitle && (
                  <ErrorMessage className="text-red-500">
                    {errors.jobTitle.message}
                  </ErrorMessage>
                )}
              </Field>
            </>
          )}

          {getValues("professionalOrStudent") === "Current student" && (
            <>
              <Field className="mx-4 my-4">
                <Label> What is your current level of study?</Label>
                <Select id="level-of-study" {...register("levelOfStudy")}>
                  <option value="" disabled>
                    Select level of study
                  </option>

                  {levelOfStudyOptions.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </Select>
                {errors.levelOfStudy && (
                  <ErrorMessage className="text-red-500">
                    {errors.levelOfStudy.message}
                  </ErrorMessage>
                )}
              </Field>

              <Field className="mx-4 my-4">
                <Label>What are you studying?</Label>
                <Input
                  id="course"
                  {...register("course")}
                  placeholder="Course name"
                />
                {errors.course && (
                  <ErrorMessage className="text-red-500">
                    {errors.course.message}
                  </ErrorMessage>
                )}
              </Field>
            </>
          )}
        </Fieldset>
      </div>

      <div className="mr-4 mt-6 flex justify-end gap-4 sm:mr-0">
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => router.push(`?slide=${2}`, { scroll: false })}
          className="w-24 cursor-pointer"
        >
          Go back
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting}
          color={"dark/white"}
          className="w-24 cursor-pointer"
        >
          Submit
        </Button>
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
