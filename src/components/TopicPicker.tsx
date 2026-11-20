import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ChevronDown, Folder } from "lucide-react";

import type { Topic } from "@/lib/types";
import type { TopicChoice } from "@/lib/topic-choice";
import { MoveRow } from "./MovePopover";

type PickerOption = {
  value: TopicChoice;
  label: string;
  indented: boolean;
};

export function TopicPicker({
  topics,
  choice,
  saveWidth,
  onChange,
}: {
  topics: Topic[];
  choice: TopicChoice;
  saveWidth: number;
  onChange: (choice: TopicChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | undefined>(undefined);

  const options = useMemo<PickerOption[]>(() => {
    const topLevel = topics.filter((topic) => !topic.parentId);
    const childrenOf = (id: string) => topics.filter((topic) => topic.parentId === id);
    return [
      { value: "auto", label: "Auto", indented: false },
      { value: "unsorted", label: "Unsorted (later)", indented: false },
      ...topLevel.flatMap((topic) => [
        { value: topic.id, label: topic.name, indented: false },
        ...childrenOf(topic.id).map((subtopic) => ({
          value: subtopic.id,
          label: subtopic.name,
          indented: true,
        })),
      ]),
    ];
  }, [topics]);

  const currentOption = options.find((option) => option.value === choice);
  const currentLabel = currentOption?.label ?? "Auto";

  useEffect(() => {
    const measuredWidth = measureRef.current?.getBoundingClientRect().width;
    if (measuredWidth === undefined || saveWidth <= 0) return;
    setButtonWidth(Math.min(160, Math.max(saveWidth, measuredWidth + 18)));
  }, [currentLabel, saveWidth]);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === choice));
    setActiveIndex(selectedIndex);
    optionRefs.current[selectedIndex]?.focus();
  }, [open, options, choice]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const select = (option: PickerOption) => {
    onChange(option.value);
    close(true);
  };

  const onOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = options.length - 1;
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (nextIndex !== null) {
      event.preventDefault();
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
    }
  };

  const pickerLabel = choice === "auto" || choice === "unsorted"
    ? currentLabel
    : (() => {
        const topic = topics.find((item) => item.id === choice);
        const parent = topic?.parentId ? topics.find((item) => item.id === topic.parentId) : null;
        return topic ? (parent ? `${parent.name} / ${topic.name}` : topic.name) : "Auto";
      })();

  return (
    <div ref={containerRef} className="relative flex justify-end max-md:block">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Save topic: ${pickerLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="addbar-topic-options"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            close(true);
          }
        }}
        style={buttonWidth === undefined ? undefined : ({ "--picker-width": `${buttonWidth}px` } as CSSProperties)}
        className="flex h-8 w-[var(--picker-width)] min-w-0 max-w-40 items-center gap-2 rounded-2xl border border-hairline bg-raised px-2 text-sm font-medium text-ink hover:bg-surface-card max-md:w-full max-md:max-w-none"
      >
        <Folder aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{pickerLabel}</span>
        <ChevronDown aria-hidden className="size-3 shrink-0" />
        <span
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute flex w-max items-center gap-2 whitespace-nowrap"
        >
          <Folder aria-hidden className="size-4 shrink-0" />
          <span>{pickerLabel}</span>
          <ChevronDown aria-hidden className="size-3 shrink-0" />
        </span>
      </button>

      {open && (
        <div
          id="addbar-topic-options"
          role="listbox"
          aria-label="Choose where to save"
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[32px] border border-hairline bg-canvas p-2"
        >
          <p className="px-3 pb-1 pt-2 text-xs font-medium text-mute">Save to</p>
          {options.map((option, index) => (
            <MoveRow
              key={option.value}
              buttonRef={(node) => {
                optionRefs.current[index] = node;
              }}
              label={option.label}
              selected={choice === option.value}
              indented={option.indented}
              role="option"
              ariaSelected={choice === option.value}
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => select(option)}
              onKeyDown={(event) => onOptionKeyDown(event, index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}