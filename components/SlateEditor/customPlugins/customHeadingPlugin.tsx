import { PlateRenderElementProps } from "@udecode/plate-core";

export const CustomH3Component = (props: PlateRenderElementProps) => {
  const { attributes, children, element } = props;

  return (
      <h3 className="text-white py-2 text-3xl" {...attributes}>
        {children}
      </h3>
    );
};

export const CustomH4Component = (props: PlateRenderElementProps) => {
  const { attributes, children, element } = props;

  return (
      <h4 className="text-white py-2 text-2xl" {...attributes}>
        {children}
      </h4>
    );
};

