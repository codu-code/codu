import { TEditableProps } from '@udecode/plate';
import { MyValue } from './plateTypes';

export const editableProps: TEditableProps<MyValue> = {
  spellCheck: false,
  autoFocus: false,
  placeholder: 'Enter your content here 💖',
  className: "text-xl leading-5 bg-neutral-900 focus:bg-black mt-4 focus:ring-2 focus:ring-gray-300 py-3 px-2 min-h-[40rem]",
};
