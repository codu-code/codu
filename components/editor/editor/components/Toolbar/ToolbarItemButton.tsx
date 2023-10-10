import { FunctionComponent, ReactNode } from "react";

import styles from "./Toolbar.module.css";

interface ToolBarItemButtonProps {
  isRootNode: () => boolean;
  icon: ReactNode;
  title: string;
  onClick: () => boolean | void;
  className?: string;
}

const ToolBarItemButton: FunctionComponent<ToolBarItemButtonProps> = ({
  title,
  isRootNode,
  icon,
  onClick,
  className,
}) => {
  return (
    <div className={styles.buttonContainer} data-tooltip={title}>
      <button
        onClick={onClick}
        type="button"
        disabled={isRootNode()}
        className={className}
      >
        {icon}
        <div className={styles.tooltip}>{title}</div>
      </button>
    </div>
  );
};

export default ToolBarItemButton;
