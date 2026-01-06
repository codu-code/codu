"use client";
// @TODO make sure post is saved before publishing (should be fine but let's disable the button if it's not up to date)

import { ZodError } from "zod";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { SavePostInput } from "../schema/post";
import { ConfirmPostSchema } from "../schema/post";

import { api } from "@/server/trpc/react";
import { useDebounce } from "./useDebounce";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export type useCreatePageReturnType = {
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
  handleSubmit: any;
  register: any;
  watch: any;
  reset: any;
  getValues: any;
  control: any;
  trigger: any;
  isDirty: boolean;
  savePost: () => Promise<void>;
  debouncedValue: string;
  hasContent: boolean;
  isDisabled: boolean;
  onSubmit: (data: SavePostInput) => Promise<string | number | void>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (tag: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  handleOpenDialog: (res: string) => void;
  data: any;
  hasLoadingState: boolean;
  dataStatus: "pending" | "error" | "success";
  title: string;
  body: string;
  saveStatus: string;
};

type useCreatepagePropTypes = {
  postId: string;
};

function useCreatePage({
  postId,
}: useCreatepagePropTypes): useCreatePageReturnType {
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
  } = useForm<SavePostInput>({
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
  } = api.post.publish.useMutation();

  const { mutate: save, status: saveStatus } = api.post.update.useMutation({
    onError() {
      // TODO: Add error messages from field validations
      return toast.error("Something went wrong auto-saving");
    },
    onSuccess() {
      console.log("saved");

      // toast.success("Saved");
      setSavedTime(
        new Date().toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      );
    },
  });
  const { mutate: create, data: createData } = api.post.create.useMutation({
    onError() {
      toast.error("Something went wrong creating draft");
    },
    onSuccess() {
      console.log("saved");
      // toast.success("Saved draft");
    },
  });

  // TODO get rid of this for standard get post
  // Should be allowed get draft post through regular mechanism if you own it
  const {
    data,
    status: dataStatus,
    error: dataError,
  } = api.post.editDraft.useQuery(
    { id: postId },
    {
      enabled: !!postId && shouldRefetch,
    },
  );

  // Handle query error with useEffect (onError removed in React Query v5)
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

  const savePost = async () => {
    const formData = getFormData();
    const json = JSON.parse(formData.body);
    const titleText = json?.content?.[0]?.content?.[0]?.text || "My post";
    const updatedFormData = { ...formData, title: titleText };

    if (!formData.id) {
      // New posts default to article type
      create({ ...updatedFormData, type: "article" as const });
    } else {
      save({ ...updatedFormData, id: postId });
    }
    setHasUnsavedChanges(false);
  };

  const hasLoadingState =
    publishStatus === "pending" ||
    saveStatus === "pending" ||
    dataStatus === "pending";

  const published = !!data?.publishedAt || false;

  const onSubmit = async (data: SavePostInput) => {
    if (!published) {
      try {
        const formData = getFormData();
        ConfirmPostSchema.parse(formData);
        return publish({ id: postId, published: !published });
      } catch (err) {
        if (err instanceof ZodError) {
          return toast.error(err.issues[0].message);
        } else {
          return toast.error("Something went when trying to publish.");
        }
      }
    }
    await savePost();
  };

  if (
    publishStatus === "success" &&
    publishData?.slug &&
    session?.user?.username
  ) {
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
    const { body, excerpt, title, id, tags } = data;
    setTags(tags.map(({ tag }) => tag.title));
    // Convert null to undefined for form compatibility
    reset({
      body: body ?? undefined,
      excerpt: excerpt ?? undefined,
      title,
      id,
    });
  }, [data]);

  useEffect(() => {
    if (published) return;
    if ((title + body).length < 5) return;
    if (debouncedValue === (data?.title || "") + data?.body) return;
    if (allowUpdate) savePost();
  }, [debouncedValue]);

  useEffect(() => {
    if (!createData?.id) return;
    router.push(`/alpha/new/${createData.id}`);
  }, [createData, router]);

  const hasContent = title.length >= 5 && body.length >= 10;

  const isDisabled = hasLoadingState || !hasContent;

  useEffect(() => {
    if ((title + body).length < 5) return;
    if (isDirty) setHasUnsavedChanges(true);
  }, [title, body]);

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
        !published && savePost();
        break;
      default:
        // setting allowUpdate in this case
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
    savePost,
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

export default useCreatePage;
