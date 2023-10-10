import { FunctionComponent, ReactNode } from "react";

import styles from "./Toolbar.module.css";

interface ToolBarItemButtonProps {
  isRootNode: () => boolean;
  children: ReactNode;
  title: string;
  onClick: () => boolean | void;
  className?: string;
}

const ToolBarItemButton: FunctionComponent<ToolBarItemButtonProps> = ({
  title,
  isRootNode,
  children,
  onClick,
  className,
}) => {
  return (
    <div className={styles.buttonContainer} data-tooltip={title}>
      <button
        disabled
        onClick={onClick}
        type="button"
        disabled={isRootNode()}
        className={className}
      >
        {children}
        <div className={styles.tooltip}>{title}</div>
      </button>
    </div>
  );
};

export default ToolBarItemButton;
