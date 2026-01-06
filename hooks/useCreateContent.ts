"use client";

import { ZodError } from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ConfirmContentSchema } from "../schema/content";
import type { UpdateContentInput } from "../schema/content";

import { api } from "@/server/trpc/react";
import { useDebounce } from "./useDebounce";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export type SaveContentInput = {
  id?: string;
  title: string;
  body: string;
  excerpt?: string;
  canonicalUrl?: string;
};

export type useCreateContentReturnType = {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagValue: string;
  setTagValue: React.Dispatch<React.SetStateAction<string>>;
  savedTime: string;
  setSavedTime: React.Dispatch<React.SetStateAction<string>>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  allowUpdate: boolean;
  handleSubmit: ReturnType<typeof useForm<SaveContentInput>>["handleSubmit"];
  register: ReturnType<typeof useForm<SaveContentInput>>["register"];
  watch: ReturnType<typeof useForm<SaveContentInput>>["watch"];
  reset: ReturnType<typeof useForm<SaveContentInput>>["reset"];
  getValues: ReturnType<typeof useForm<SaveContentInput>>["getValues"];
  control: ReturnType<typeof useForm<SaveContentInput>>["control"];
  trigger: ReturnType<typeof useForm<SaveContentInput>>["trigger"];
  isDirty: boolean;
  saveContent: () => Promise<void>;
  debouncedValue: string;
  hasContent: boolean;
  isDisabled: boolean;
  onSubmit: (data: SaveContentInput) => Promise<string | number | void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (tag: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  handleOpenDialog: (res: string) => void;
  data: ReturnType<typeof api.content.editDraft.useQuery>["data"];
  hasLoadingState: boolean;
  dataStatus: "pending" | "error" | "success";
  title: string;
  body: string;
  saveStatus: string;
};

type useCreateContentPropTypes = {
  contentId: string;
};

function useCreateContent({
  contentId,
}: useCreateContentPropTypes): useCreateContentReturnType {
  const { data: session } = useSession();
  const [tags, setTags] = useState<string[]>([]);
  const [tagValue, setTagValue] = useState<string>("");
  const [savedTime, setSavedTime] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [shouldRefetch, setShouldRefetch] = useState<boolean>(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [delayDebounce, setDelayDebounce] = useState<boolean>(false);
  const allowUpdate = hasUnsavedChanges && !delayDebounce;
  const router = useRouter();

  const {
    handleSubmit,
    register,
    watch,
    reset,
    getValues,
    control,
    trigger,
    formState: { isDirty },
  } = useForm<SaveContentInput>({
    mode: "onSubmit",
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const { title, body } = watch();
  const debouncedValue = useDebounce(title + body, 1500);

  const {
    mutate: publish,
    status: publishStatus,
    data: publishData,
  } = api.content.publish.useMutation();

  const { mutate: save, status: saveStatus } = api.content.update.useMutation({
    onError() {
      return toast.error("Something went wrong auto-saving");
    },
    onSuccess() {
      console.log("saved");
      setSavedTime(
        new Date().toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      );
    },
  });

  const { mutate: create, data: createData } = api.content.create.useMutation({
    onError() {
      toast.error("Something went wrong creating draft");
    },
    onSuccess() {
      console.log("saved");
    },
  });

  const {
    data,
    status: dataStatus,
    error: dataError,
  } = api.content.editDraft.useQuery(
    { id: contentId },
    {
      enabled: !!contentId && shouldRefetch,
    },
  );

  // Handle query error with useEffect
  useEffect(() => {
    if (dataError) {
      toast.error(
        "Something went wrong fetching your draft, refresh your page or you may lose data",
        {
          duration: 5000,
        },
      );
    }
  }, [dataError]);

  useEffect(() => {
    if (shouldRefetch) {
      setShouldRefetch(!(dataStatus === "success"));
    }
  }, [dataStatus, shouldRefetch]);

  const getFormData = () => {
    const data = getValues();
    const formData = {
      ...data,
      tags,
      canonicalUrl: data.canonicalUrl || undefined,
      excerpt: data.excerpt || "",
    };
    return formData;
  };

  const saveContent = async () => {
    const formData = getFormData();
    const json = JSON.parse(formData.body);
    const titleText = json?.content?.[0]?.content?.[0]?.text || "My article";
    const updatedFormData = { ...formData, title: titleText };

    if (!formData.id) {
      // Create new content as ARTICLE type
      create({
        type: "POST",
        title: updatedFormData.title,
        body: updatedFormData.body,
        excerpt: updatedFormData.excerpt,
        canonicalUrl: updatedFormData.canonicalUrl,
        tags: updatedFormData.tags,
        published: false,
      });
    } else {
      // Update existing content
      save({
        id: contentId,
        title: updatedFormData.title,
        body: updatedFormData.body,
        excerpt: updatedFormData.excerpt,
        canonicalUrl: updatedFormData.canonicalUrl,
        tags: updatedFormData.tags,
      });
    }
    setHasUnsavedChanges(false);
  };

  const hasLoadingState =
    publishStatus === "pending" ||
    saveStatus === "pending" ||
    dataStatus === "pending";

  const published = !!data?.published || false;

  const onSubmit = async (formInput: SaveContentInput) => {
    if (!published) {
      try {
        const formData = getFormData();
        ConfirmContentSchema.parse(formData);
        return publish({ id: contentId, published: true });
      } catch (err) {
        if (err instanceof ZodError) {
          return toast.error(err.issues[0].message);
        } else {
          return toast.error("Something went wrong when trying to publish.");
        }
      }
    }
    await saveContent();
  };

  if (publishStatus === "success" && publishData?.slug && session?.user?.username) {
    redirect(`/${session.user.username}/${publishData.slug}`);
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const { value } = e.target;
    setTagValue(value);
  };

  const onDelete = (tag: string) => {
    setTags((t) => t.filter((t) => t !== tag));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { key } = e;
    const trimmedInput = tagValue
      .trim()
      .toUpperCase()
      .replace(/[^\w\s]/gi, "");
    if (
      (key === "," || key === "." || key === "Enter") &&
      trimmedInput.length &&
      !tags.includes(trimmedInput)
    ) {
      e.preventDefault();
      setTags((prevState) => [...prevState, trimmedInput]);
      setTagValue("");
    }
  };

  useEffect(() => {
    if (!data) return;
    const { body, excerpt, title, id, tags: contentTags } = data;
    setTags(contentTags.map(({ tag }) => tag.title.toUpperCase()));
    reset({ body: body || "", excerpt: excerpt || "", title: title || "", id });
  }, [data, reset]);

  useEffect(() => {
    if (published) return;
    if ((title + body).length < 5) return;
    if (debouncedValue === (data?.title || "") + (data?.body || "")) return;
    if (allowUpdate) saveContent();
  }, [debouncedValue]);

  useEffect(() => {
    if (!createData?.id) return;
    router.push(`/create/${createData.id}`);
  }, [createData, router]);

  const hasContent = title.length >= 5 && body.length >= 10;

  const isDisabled = hasLoadingState || !hasContent;

  useEffect(() => {
    if ((title + body).length < 5) return;
    if (isDirty) setHasUnsavedChanges(true);
  }, [title, body, isDirty]);

  const handleOpenDialog = (res: string) => {
    switch (res) {
      case "initial":
        setDelayDebounce(true);
        break;
      case "confirm":
        setHasUnsavedChanges(false);
        setDelayDebounce(false);
        break;
      case "cancel":
        setDelayDebounce(false);
        !published && saveContent();
        break;
      default:
        setDelayDebounce(false);
        setHasUnsavedChanges(true);
    }
  };

  return {
    tags,
    setTags,
    tagValue,
    setTagValue,
    savedTime,
    setSavedTime,
    open,
    setOpen,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    allowUpdate,
    handleSubmit,
    register,
    watch,
    reset,
    getValues,
    control,
    trigger,
    isDirty,
    saveContent,
    debouncedValue,
    hasContent,
    isDisabled,
    onSubmit,
    onChange,
    onDelete,
    onKeyDown,
    handleOpenDialog,
    data,
    hasLoadingState,
    dataStatus,
    title,
    body,
    saveStatus,
  };
}

export default useCreateContent;
