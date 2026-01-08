import { toast } from "sonner";
import type { EditorState } from "@tiptap/pm/state";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { EditorView } from "@tiptap/pm/view";
import { getUploadUrl } from "@/app/actions/getUploadUrl";
import { uploadFile } from "@/utils/s3helpers";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const uploadKey = new PluginKey<DecorationSet>("s3-upload-image");

/**
 * ProseMirror plugin for handling image uploads with placeholder decorations.
 * Shows a preview while uploading, then replaces with the final image.
 */
export const S3ImageUploadPlugin = () =>
  new Plugin({
    key: uploadKey as unknown as PluginKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        // Map decorations to account for document changes
        set = set.map(tr.mapping, tr.doc);

        // Handle add/remove placeholder actions
         
        const action = tr.getMeta(uploadKey as any);
        if (action?.add) {
          const { id, pos, src } = action.add;

          // Create placeholder element with preview
          const placeholder = document.createElement("div");
          placeholder.setAttribute("class", "img-upload-placeholder relative");

          const wrapper = document.createElement("div");
          wrapper.setAttribute(
            "class",
            "relative rounded-lg overflow-hidden my-4",
          );

          const image = document.createElement("img");
          image.setAttribute(
            "class",
            "opacity-40 rounded-lg border border-neutral-200 dark:border-neutral-700 max-w-full",
          );
          image.src = src;

          const loadingOverlay = document.createElement("div");
          loadingOverlay.setAttribute(
            "class",
            "absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg",
          );
          loadingOverlay.innerHTML = `
            <div class="flex items-center gap-2 bg-white dark:bg-neutral-800 px-3 py-2 rounded-full shadow-lg">
              <svg class="animate-spin h-4 w-4 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Uploading...</span>
            </div>
          `;

          wrapper.appendChild(image);
          wrapper.appendChild(loadingOverlay);
          placeholder.appendChild(wrapper);

          const deco = Decoration.widget(pos + 1, placeholder, { id });
          set = set.add(tr.doc, [deco]);
        } else if (action?.remove) {
          set = set.remove(
            set.find(
              undefined,
              undefined,
              (spec) => spec.id === action.remove.id,
            ),
          );
        }
        return set;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });

/**
 * Find the position of a placeholder decoration by ID
 */
function findPlaceholder(state: EditorState, id: object): number | null {
  const decos = uploadKey.getState(state);
  if (!decos) return null;

  const found = decos.find(
    undefined,
    undefined,
    (spec: { id: object }) => spec.id === id,
  );
  return found.length ? found[0].from : null;
}

/**
 * Validate an image file before upload
 */
function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Invalid file type. Accepted formats: JPG, PNG, GIF, WebP`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`;
  }
  return null;
}

/**
 * Upload an image file to S3 using presigned URL
 */
async function uploadImageToS3(file: File): Promise<string> {
  const result = await getUploadUrl({
    type: file.type,
    size: file.size,
    uploadType: "uploads",
  });

  if (result?.serverError) {
    throw new Error(result.serverError);
  }

  const signedUrl = result?.data;
  if (!signedUrl) {
    throw new Error("Failed to get upload URL");
  }

  const uploadResult = await uploadFile(signedUrl, file);

  if (!uploadResult.ok) {
    throw new Error("Failed to upload image");
  }

  return uploadResult.fileLocation;
}

/**
 * Start uploading an image file with placeholder decoration
 */
export function startImageUpload(file: File, view: EditorView, pos: number) {
  // Validate file
  const validationError = validateImageFile(file);
  if (validationError) {
    toast.error(validationError);
    return;
  }

  // Create unique ID for this upload
  const id = {};

  // Delete selection if any
  const tr = view.state.tr;
  if (!tr.selection.empty) tr.deleteSelection();

  // Read file for preview and add placeholder
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    tr.setMeta(uploadKey, {
      add: {
        id,
        pos,
        src: reader.result,
      },
    });
    view.dispatch(tr);
  };

  // Upload to S3
  toast.promise(
    uploadImageToS3(file).then((imageUrl) => {
      const { schema } = view.state;
      const placeholderPos = findPlaceholder(view.state, id);

      // If placeholder was deleted, don't insert image
      if (placeholderPos === null) return;

      // Insert image node and remove placeholder
      const node = schema.nodes.image.create({ src: imageUrl });
      const transaction = view.state.tr
        .replaceWith(placeholderPos, placeholderPos, node)
        .setMeta(uploadKey, { remove: { id } });
      view.dispatch(transaction);

      return imageUrl;
    }),
    {
      loading: "Uploading image...",
      success: "Image uploaded successfully",
      error: (e) => e.message || "Failed to upload image",
    },
  );
}

/**
 * Handle file drop event on the editor
 */
export function handleImageDrop(
  view: EditorView,
  event: DragEvent,
  _slice: unknown,
  moved: boolean,
): boolean {
  if (moved || !event.dataTransfer?.files.length) {
    return false;
  }

  const file = event.dataTransfer.files[0];
  if (!file || !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return false;
  }

  event.preventDefault();

  const coordinates = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });

  if (coordinates) {
    startImageUpload(file, view, coordinates.pos);
  }

  return true;
}

/**
 * Handle paste event with images
 */
export function handleImagePaste(
  view: EditorView,
  event: ClipboardEvent,
): boolean {
  const items = event.clipboardData?.items;
  if (!items) return false;

  for (const item of items) {
    if (ACCEPTED_IMAGE_TYPES.includes(item.type)) {
      const file = item.getAsFile();
      if (file) {
        event.preventDefault();
        const { from } = view.state.selection;
        startImageUpload(file, view, from);
        return true;
      }
    }
  }

  return false;
}

/**
 * Trigger image upload from a file input
 */
export function triggerImageUpload(view: EditorView, file: File) {
  const { from } = view.state.selection;
  startImageUpload(file, view, from);
}
