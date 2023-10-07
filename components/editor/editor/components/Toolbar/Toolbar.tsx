import React, { useState, ChangeEvent } from "react";
import styles from "./Toolbar.module.css";

function Toolbar() {
  const [isOpen, setIsOpen] = useState(true);

  const handleExpand = (e: ChangeEvent<HTMLInputElement>) => {
    setIsOpen(e.target.checked);
  };

  return (
    <div className={`${styles.sticky} bg-neutral-900`}>
      <div className={styles.flex}>
        <div
          className={styles.menu}
          style={{
            transition: "max-height 0.2s ease-in-out",
            maxHeight: isOpen ? "100vh" : "0",
            overflow: "hidden",
          }}
        >
          <div className={styles.buttons}>
            <button>H2</button>
            <button>H3</button>
            <button>Bullet List</button>
          </div>
        </div>
        <label className={styles.switch}>
          <input type="checkbox" checked={isOpen} onChange={handleExpand} />
          <span
            className={`${styles.slider} ${
              isOpen
                ? "bg-gradient-to-r from-orange-400 to-pink-600"
                : "bg-gray-300"
            } ml-5 shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:from-orange-300 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-30`}
          ></span>
        </label>
      </div>
    </div>
  );
}

export default Toolbar;
