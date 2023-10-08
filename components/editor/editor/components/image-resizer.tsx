import Moveable from "react-moveable";
import { useEffect, useState } from "react";

export const MediaResizer = ({ editor }) => {
  const [moveableTarget, setMoveableTarget] = useState(null);

  useEffect(() => {
    const handleSelection = () => {
      const selectedNode = document.querySelector(".ProseMirror-selectednode");
      if (selectedNode && selectedNode.tagName === "IMG") {
        setMoveableTarget(selectedNode);
      } else {
        setMoveableTarget(null);
      }
    };

    document.addEventListener("selectionchange", handleSelection);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, []);

  const updateMediaSize = () => {
    const selectedNode = moveableTarget;
    const selection = editor.state.selection;
    if (selectedNode) {
      editor.commands.setImage({
        src: selectedNode.src,
        width: Number(selectedNode.style.width.replace("px", "")),
        height: Number(selectedNode.style.height.replace("px", "")),
      });
    }

    editor.commands.setNodeSelection(selection.from);
  };

  return (
    <>
      <Moveable
        target={moveableTarget}
        container={null}
        origin={false}
        edge={false}
        throttleDrag={0}
        keepRatio={true}
        resizable={true}
        throttleResize={0}
        onResize={({ target, width, height, delta }) => {
          delta[0] && (target.style.width = `${width}px`);
          delta[1] && (target.style.height = `${height}px`);
        }}
        onResizeEnd={updateMediaSize}
        scalable={true}
        throttleScale={0}
        renderDirections={["w", "e"]}
        onScale={({ target, transform }) => {
          target.style.transform = transform;
        }}
      />
    </>
  );
};
