"use client";

import React, { memo, useState } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chapter } from "@/types/firestore";
import { Link } from "../../link";

interface ChapterComponentProps {
  chapter: Chapter;
  index: number; // for display if needed
  unitId: string; // if you need the unit ID
  subjectSlug: string; // if you need the subject slug
  subjectSlugLink: string; // an example link if you want
  onDeleteChapter: (chapterId: string) => void;
  onUpdateChapter: (chapterId: string, newTitle: string) => void;
  setChapterVisibility: (chapterId: string, isPublic: boolean) => void;
}

/**
 * Renders a single Chapter row with "Delete" and "Edit".
 */
function ChapterComponent({
  chapter,
  index,
  unitId,
  subjectSlug,
  onDeleteChapter,
  onUpdateChapter,
  setChapterVisibility,
}: ChapterComponentProps) {
  const [editing, setEditing] = useState<boolean>(false);
  const [localTitle, setLocalTitle] = useState<string>(chapter.title);

  const handleBlur = () => {
    setEditing(false);
    if (localTitle.trim().length === 0) {
      alert("Title cannot be empty.");
      setLocalTitle(chapter.title);
      return;
    }
    // If changed, notify parent
    if (localTitle !== chapter.title) {
      onUpdateChapter(chapter.id, localTitle);
    }
  };

  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div className="grid">
        <label htmlFor={`visibility-${chapter.id}`}>Public</label>
        <input
          type="checkbox"
          id={`visibility-${chapter.id}`}
          checked={chapter.isPublic}
          onChange={(e) => setChapterVisibility(chapter.id, e.target.checked)}
        />
      </div>

      <Link
        className="whitespace-nowrap rounded-full border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        href={`/admin/subject/${subjectSlug}/${unitId}/chapter/${chapter.id}`}
      >
        Edit Content
      </Link>

      {/* Chapter title: double click to edit */}
      {editing ? (
        <>
          <p className="text-nowrap px-2">Chapter {index + 1}:</p>
          <input
            className="-ml-5 w-full"
            autoFocus
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleBlur}
          />
        </>
      ) : (
        <p
          onDoubleClick={() => setEditing(true)}
          className="w-full cursor-pointer rounded-sm px-2 py-1 hover:bg-accent"
        >
          Chapter {index + 1}: {localTitle}
        </p>
      )}

      <Button
        className="ml-auto"
        variant={"destructive"}
        onClick={() => onDeleteChapter(chapter.id)}
      >
        <Trash />
      </Button>
    </div>
  );
}

// memo() helps avoid rerenders if props haven't changed
export default memo(ChapterComponent);
