import { useEffect } from "react";

export interface KeyboardShortcutActions {
  onEscape?: () => void;
  onEnter?: () => void;

  onSearch?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;

  onPrevious?: () => void;
  onNext?: () => void;
  onFirst?: () => void;
  onLast?: () => void;

  onView?: () => void;
  onPrint?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;

  onFilterAll?: () => void;
  onFilterDineIn?: () => void;
  onFilterTakeaway?: () => void;
}

interface KeyboardShortcutOptions extends KeyboardShortcutActions {
  enabled?: boolean;
  allowShortcutsInInputs?: boolean;
}

export const useKeyboardShortcuts = ({
  enabled = true,
  allowShortcutsInInputs = false,

  onEscape,
  onEnter,

  onSearch,
  onRefresh,
  onExport,

  onPrevious,
  onNext,
  onFirst,
  onLast,

  onView,
  onPrint,
  onEdit,
  onDelete,

  onFilterAll,
  onFilterDineIn,
  onFilterTakeaway,
}: KeyboardShortcutOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;

      const target = event.target as HTMLElement | null;

      const isTyping =
        !!target?.closest(
          "input, textarea, select, [contenteditable='true']"
        );

      /*
       * Normal typing should always work.
       * Only F-keys/navigation shortcuts work while typing.
       */
      if (
        isTyping &&
        !allowShortcutsInInputs &&
        ![
          "F2",
          "F4",
          "F5",
          "F6",
          "F7",
          "Escape",
        ].includes(event.key)
      ) {
        return;
      }

      // ESCAPE
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
        return;
      }

      // F2 - SEARCH
      if (event.key === "F2") {
        event.preventDefault();
        onSearch?.();
        return;
      }

      // F4 - VIEW
      if (event.key === "F4") {
        event.preventDefault();
        onView?.();
        return;
      }

      // F5 - REFRESH
      if (event.key === "F5") {
        event.preventDefault();
        onRefresh?.();
        return;
      }

      // F6 - PRINT
      if (event.key === "F6") {
        event.preventDefault();
        onPrint?.();
        return;
      }

      // F7 - EDIT
      if (event.key === "F7") {
        event.preventDefault();
        onEdit?.();
        return;
      }

      // DELETE - DEACTIVATE
      if (event.key === "Delete" && !isTyping) {
        event.preventDefault();
        onDelete?.();
        return;
      }

      // ENTER
      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !isTyping
      ) {
        event.preventDefault();
        onEnter?.();
        return;
      }

      // ARROW LEFT
      if (event.key === "ArrowLeft" && !isTyping) {
        event.preventDefault();
        onPrevious?.();
        return;
      }

      // ARROW RIGHT
      if (event.key === "ArrowRight" && !isTyping) {
        event.preventDefault();
        onNext?.();
        return;
      }

      // ARROW UP
      if (event.key === "ArrowUp" && !isTyping) {
        event.preventDefault();
        onPrevious?.();
        return;
      }

      // ARROW DOWN
      if (event.key === "ArrowDown" && !isTyping) {
        event.preventDefault();
        onNext?.();
        return;
      }

      // HOME
      if (event.key === "Home" && !isTyping) {
        event.preventDefault();
        onFirst?.();
        return;
      }

      // END
      if (event.key === "End" && !isTyping) {
        event.preventDefault();
        onLast?.();
        return;
      }

      // CTRL + E
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "e"
      ) {
        event.preventDefault();
        onExport?.();
        return;
      }

      // FILTER SHORTCUTS
      if (!isTyping && !event.ctrlKey && !event.altKey && !event.metaKey) {
        if (event.key === "1") {
          event.preventDefault();
          onFilterAll?.();
          return;
        }

        if (event.key === "2") {
          event.preventDefault();
          onFilterDineIn?.();
          return;
        }

        if (event.key === "3") {
          event.preventDefault();
          onFilterTakeaway?.();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    allowShortcutsInInputs,

    onEscape,
    onEnter,

    onSearch,
    onRefresh,
    onExport,

    onPrevious,
    onNext,
    onFirst,
    onLast,

    onView,
    onPrint,
    onEdit,
    onDelete,

    onFilterAll,
    onFilterDineIn,
    onFilterTakeaway,
  ]);
};