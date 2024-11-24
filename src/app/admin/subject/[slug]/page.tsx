"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Edit, Trash, PlusCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/hooks/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import apClassesData from "@/app/admin/apClasses.json";
import type { Subject } from "@/types";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import usePathname from "@/components/client/pathname";

const apClasses = apClassesData.apClasses;

// Empty subject template
const emptyData: Subject = {
  title: "",
  units: [
    {
      unit: 1,
      title: "",
      chapters: [
        {
          chapter: 1,
          title: "",
        },
      ],
      test: {
        questions: [],
        time: 0,
        optedIn: false,
        instanceId: "",
      },
    },
  ],
};

const Page = ({ params }: { params: { slug: string } }) => {
  const pathname = usePathname();
  const { user, error, setError, setLoading } = useUser();
  const [subject, setSubject] = useState<Subject>();
  const [expandedUnits, setExpandedUnits] = useState<number[]>([]);

  const [editingUnit, setEditingUnit] = useState<{
    unitIndex: number | null;
  }>({ unitIndex: null });

  const [editingChapter, setEditingChapter] = useState<{
    unitIndex: number | null;
    chapterIndex: number | null;
  }>({ unitIndex: null, chapterIndex: null });
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [newChapterTitle, setNewChapterTitle] = useState("");

  const unitTitleInputRef = useRef<HTMLInputElement | null>(null);
  const chapterInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        if (user && (user?.access === "admin" || user?.access === "member")) {
          const docRef = doc(db, "subjects", params.slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setSubject(docSnap.data() as Subject);
          } else {
            emptyData.title =
              apClasses.find(
                (apClass) =>
                  apClass
                    .replace(/AP /g, "")
                    .toLowerCase()
                    .replace(/[^a-z1-9 ]+/g, "")
                    .replace(/\s/g, "-") === params.slug,
              ) || "";
            setSubject(emptyData);
          }
        }
      } catch (error) {
        setError("Failed to fetch subject data.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [user, params.slug, setError, setLoading]);

  const addUnit = () => {
    if (!newUnitTitle.trim()) return;
    const newUnit = {
      unit: subject!.units.length + 1,
      title: newUnitTitle,
      chapters: [
        {
          chapter: 1,
          title: "",
        },
      ],
      test: {
        questions: [],
        time: 0,
        optedIn: false,
        instanceId: "",
      },
    };
    setSubject({ ...subject!, units: [...subject?.units!, newUnit] });
    setNewUnitTitle("");
  };

  const deleteUnit = (unitIndex: number) => {
    const updatedUnits = [...subject?.units!];
    updatedUnits.splice(unitIndex, 1);
    setSubject({ ...subject!, units: updatedUnits });
  };

  const addChapter = (unitIndex: number) => {
    if (!newChapterTitle.trim()) return;
    const newChapter = {
      chapter: subject!.units[unitIndex]!.chapters.length + 1 || 1,
      title: newChapterTitle,
    };
    const updatedUnits = [...subject?.units!];
    updatedUnits[unitIndex]!.chapters.push(newChapter);
    setSubject({ ...subject!, units: updatedUnits });
    setNewChapterTitle("");
  };

  const editUnitTitle = (unitIndex: number, newTitle: string) => {
    const updatedUnits = [...subject?.units!];
    updatedUnits[unitIndex]!.title = newTitle;
    setSubject({ ...subject!, units: updatedUnits });
    setEditingUnit({ unitIndex: null });
  };

  const editChapterTitle = (
    unitIndex: number,
    chapterIndex: number,
    newTitle: string,
  ) => {
    const updatedUnits = [...subject?.units!];
    updatedUnits[unitIndex]!.chapters[chapterIndex]!.title = newTitle;
    setSubject({ ...subject!, units: updatedUnits });
    setEditingChapter({ unitIndex: null, chapterIndex: null });
  };

  const deleteChapter = (unitIndex: number, chapterIndex: number) => {
    const updatedUnits = [...subject?.units!];
    updatedUnits[unitIndex]!.chapters.splice(chapterIndex, 1);
    setSubject({ ...subject!, units: updatedUnits });
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(db, "subjects", params.slug), subject);
      alert("Subject units and chapters saved.");
    } catch (error) {
      console.error("Error saving:", error);
    }
  };

  const optInForUnitTest = (unitIndex: number): void => {
    const updatedSubject = { ...subject! };
    console.log("Updated subject:", updatedSubject);
    if (updatedSubject && updatedSubject.units[unitIndex]?.test) {
      updatedSubject.units[unitIndex].test.optedIn = true;
      updatedSubject.units[unitIndex].test.instanceId =
        `test_${params.slug}_${unitIndex}`;
    }
    setSubject(updatedSubject);
  };

  const optOutOfUnitTest = (unitIndex: number): void => {
    const updatedSubject = { ...subject! };
    if (updatedSubject && updatedSubject.units[unitIndex]?.test) {
      updatedSubject.units[unitIndex].test.optedIn = false;
    }
    setSubject(updatedSubject);
  };

  if (!subject) {
    return (
      <div className="flex min-h-screen items-center justify-center text-3xl">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen">
        <Navbar />

        <main className="container max-w-3xl flex-grow px-4 py-8 md:px-10 lg:px-14 2xl:px-20">
          <h1 className="text-center text-4xl font-bold">{subject?.title}</h1>
          <h2 className="min-w-full px-4 py-6 text-center text-2xl font-black underline md:px-10 lg:px-14 2xl:px-20">
            BEFORE CLICKING ANY LINKS OR LEAVING THE PAGE, click "Save Changes"
            at the bottom of this page to avoid losing your changes.
          </h2>
          <div className="mb-8 space-y-4">
            {subject?.units.map((unit, unitIndex) => (
              <div key={unit.unit} className="rounded-lg border shadow-sm">
                <div className="flex items-center">
                  <Edit
                    onClick={() => setEditingUnit({ unitIndex })}
                    className="ml-4 cursor-pointer hover:text-blue-400"
                  />

                  <Trash
                    onClick={() => deleteUnit(unitIndex)}
                    className="mx-2 cursor-pointer hover:text-red-500"
                  />
                  <button
                    className="flex w-full items-center justify-between p-4 text-lg font-semibold"
                    onClick={() =>
                      setExpandedUnits((prev) =>
                        prev.includes(unitIndex)
                          ? prev.filter((i) => i !== unitIndex)
                          : [...prev, unitIndex],
                      )
                    }
                  >
                    {editingUnit.unitIndex === unitIndex ? (
                      <input
                        defaultValue={unit.title}
                        ref={unitTitleInputRef}
                        onBlur={(e) => editUnitTitle(unitIndex, e.target.value)}
                        className="border border-blue-500"
                      />
                    ) : (
                      <span>
                        Unit {unit.unit}: {unit.title}
                      </span>
                    )}
                    {expandedUnits.includes(unitIndex) ? (
                      <ChevronUp />
                    ) : (
                      <ChevronDown />
                    )}
                  </button>
                </div>
                {expandedUnits.includes(unitIndex) && (
                  <div className="border-t p-4">
                    {unit.chapters.map((chapter, chapterIndex) => (
                      <div
                        key={chapter.chapter}
                        className="mb-3 flex items-center justify-between gap-4"
                      >
                        <a
                          className={buttonVariants({ variant: "outline" })}
                          href={`${pathname.split("/").slice(0, 4).join("/")}/${unit.title
                            .toLowerCase()
                            .replace(/[^a-z1-9 ]+/g, "")
                            .replace(/\s/g, "-")}/${chapter.chapter}`}
                        >
                          Edit Content
                        </a>

                        {editingChapter.unitIndex === unitIndex &&
                        editingChapter.chapterIndex === chapterIndex ? (
                          <>
                            <p className="text-nowrap px-2">
                              Chapter {chapter.chapter}:
                            </p>
                            <input
                              autoFocus
                              className="-ml-5 w-full"
                              defaultValue={chapter.title}
                              ref={chapterInputRef}
                              onBlur={(e) =>
                                editChapterTitle(
                                  unitIndex,
                                  chapterIndex,
                                  e.target.value,
                                )
                              }
                            />
                          </>
                        ) : (
                          <p
                            onDoubleClick={() =>
                              setEditingChapter({ unitIndex, chapterIndex })
                            }
                            className="w-full cursor-pointer rounded-sm px-2 py-1 hover:bg-accent"
                          >
                            Chapter {chapter.chapter}: {chapter.title}
                          </p>
                        )}

                        <Button
                          className="ml-auto"
                          variant={"destructive"}
                          onClick={() => deleteChapter(unitIndex, chapterIndex)}
                        >
                          <Trash />
                        </Button>
                      </div>
                    ))}
                    <div className="mt-4 flex gap-2">
                      <Input
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        placeholder="New chapter title"
                        className="w-1/2"
                      />
                      <Button
                        onClick={() => addChapter(unitIndex)}
                        className="cursor-pointer bg-green-500 hover:bg-green-600"
                      >
                        <PlusCircle className="mr-2" /> Add Chapter
                      </Button>
                    </div>

                    {unit.test && unit.test.optedIn ? (
                      <div className="flex items-center">
                        <Link
                          href={`${pathname.split("/").slice(0, 4).join("/")}/${unitIndex + 1}`}
                        >
                          <p className="mt-4 text-green-500 hover:underline">
                            Edit Unit Test
                          </p>
                        </Link>

                        <Button
                          className="ml-4 mt-4"
                          variant={"destructive"}
                          onClick={() => optOutOfUnitTest(unitIndex)}
                        >
                          Remove Unit Test
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="mt-4"
                        onClick={() => optInForUnitTest(unitIndex)}
                      >
                        Add Unit Test
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mb-4 flex items-center">
            <input
              className="mr-2 rounded border p-2"
              value={newUnitTitle}
              onChange={(e) => setNewUnitTitle(e.target.value)}
              placeholder="New unit title"
            />
            <Button
              onClick={addUnit}
              className="cursor-pointer bg-green-500 hover:bg-green-600"
            >
              <PlusCircle className="mr-2" /> Add Unit
            </Button>
          </div>
          <Button className="bg-blue-600 text-white" onClick={handleSave}>
            Save Changes
          </Button>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Page;