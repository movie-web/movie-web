import { useEffect, useState } from "react";
import type { DragEvent, ReactNode } from "react";

interface FileDropHandlerProps {
  children: ReactNode;
  className: string;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDraggingChange: (isDragging: boolean) => void;
}

export function FileDropHandler(props: FileDropHandlerProps) {
  const [dragging, setDragging] = useState(false);

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDragging(false);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    props.onDrop(event);
  };

  useEffect(() => {
    props.onDraggingChange(dragging);
  }, [dragging, props]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={props.className}
    >
      {props.children}
    </div>
  );
}
