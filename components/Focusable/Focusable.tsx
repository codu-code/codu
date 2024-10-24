import React, { cloneElement, ReactElement } from "react";

interface FocusableProps {
  children: ReactElement;
}

const Focusable: React.FC<FocusableProps> = ({ children }) => {
  return cloneElement(children, {
    className: `${children.props.className} rounded-md focus:outline-none focus:ring-white focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-pink-600`,
  });
};

export default Focusable;
