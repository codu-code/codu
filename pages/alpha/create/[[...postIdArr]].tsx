// THIS FILE IS FOR ALPHA CHANGES ONLY
import type { NextPage, GetServerSideProps } from "next";
import { ZodError } from "zod";
import { useRouter } from "next/router";
import React, { useState, useEffect, Fragment, useRef } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { useForm } from "react-hook-form";
import CustomTextareaAutosize from "../../../components/CustomTextareAutosize/CustomTextareaAutosize";
import toast, { Toaster } from "react-hot-toast";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/solid";

import type { SavePostInput } from "../../../schema/post";
import { ConfirmPostSchema } from "../../../schema/post";
import LayoutEditor from "../../../components/Layout/LayoutEditor";
import { PromptDialog } from "../../../components/PromptService/PromptService";
import EditorHints from "../../../components/EditorHints/EditorHints";

import { trpc } from "../../../utils/trpc";
import { useDebounce } from "../../../hooks/useDebounce";
import Markdoc from "@markdoc/markdoc";
import { useMarkdownHotkeys } from "../../../markdoc/editor/hotkeys/hotkeys.markdoc";
import { useMarkdownShortcuts } from "../../../markdoc/editor/shortcuts/shortcuts.markdoc";
import { markdocComponents } from "../../../markdoc/components";
import { config } from "../../../markdoc/config";

import IconEye from "../../../icons/icon-eye.svg";
import IconEyeShut from "../../../icons/icon-eye-shut.svg";

const Create: NextPage = () => {
  const router = useRouter();
  const { postIdArr } = router.query;

  const postId = postIdArr?.[0] || "";

  const [viewPreview, setViewPreview] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagValue, setTagValue] = useState<string>("");
  const [savedTime, setSavedTime] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [shouldRefetch, setShouldRefetch] = useState<boolean>(true);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [delayDebounce, setDelayDebounce] = useState<boolean>(false);
  const allowUpdate = unsavedChanges && !delayDebounce;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useMarkdownHotkeys(textareaRef);
  useMarkdownShortcuts(textareaRef);

  const {
    handleSubmit,
    register,
    watch,
    reset,
    getValues,
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

  const { mutate: publish, status: publishStatus } =
    trpc.post.publish.useMutation();

  const { mutate: save, status: saveStatus } = trpc.post.update.useMutation({
    onError() {
      // TODO: Add error messages from field validations
      return toast.error("Something went wrong auto-saving");
    },
    onSuccess() {
      setSavedTime(
        new Date().toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      );
    },
  });
  const { mutate: create, data: createData } = trpc.post.create.useMutation({
    onError() {
      toast.error("Something went wrong creating draft");
    },
    onSuccess() {
      toast.success("Saved draft");
    },
  });

  // TODO get rid of this for standard get post
  // Should be allowed get draft post through regular mechanism if you own it
  const { data, status: dataStatus } = trpc.post.editDraft.useQuery(
    { id: postId },
    {
      onError() {
        toast.error(
          "Something went wrong fetching your draft, refresh your page or you may lose data",
          {
            duration: 5000,
          },
        );
      },
      enabled: !!postId && shouldRefetch,
    },
  );

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
      excerpt: data.excerpt || undefined,
    };
    return formData;
  };

  const savePost = async () => {
    const formData = getFormData();

    if (!formData.id) {
      create({ ...formData });
    } else {
      save({ ...formData, id: postId });
    }
    setUnsavedChanges(false);
  };

  const hasLoadingState =
    publishStatus === "loading" ||
    saveStatus === "loading" ||
    dataStatus === "loading";

  const published = !!data?.published || false;

  const onSubmit = async (data: SavePostInput) => {
    // vaidate markdoc syntax
    const ast = Markdoc.parse(data.body);
    const errors = Markdoc.validate(ast, config).filter(
      (e) => e.error.level === "critical",
    );

    if (errors.length > 0) {
      console.error(errors);
      errors.forEach((err) => {
        toast.error(err.error.message);
      });
      return;
    }
    if (!published) {
      try {
        const formData = getFormData();
        ConfirmPostSchema.parse(formData);
        await savePost();
        return await publish(
          { id: postId, published: !published },
          {
            onSuccess(response) {
              response?.slug && router.push(`/articles/${response.slug}`);
            },
            onError() {
              toast.error("Something went wrong publishing, please try again.");
            },
          },
        );
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
    reset({ body, excerpt, title, id });
  }, [data]);

  useEffect(() => {
    if (published) return;
    if ((title + body).length < 5) return;
    if (debouncedValue === (data?.title || "") + data?.body) return;
    if (allowUpdate) savePost();
  }, [debouncedValue]);

  useEffect(() => {
    if (!createData?.id) return;
    router.push(createData.id);
  }, [createData]);

  const hasContent = title.length >= 5 && body.length >= 10;

  const isDisabled = hasLoadingState || !hasContent;

  useEffect(() => {
    if ((title + body).length < 5) return;
    if (isDirty) setUnsavedChanges(true);
  }, [title, body]);

  return <div></div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/get-started",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default Create;
