import React, { useState, useEffect, useCallback } from "react";
import katex from "katex";
import { type questionInput } from "@/types/questions";
import "@/app/article-creator/katexStyling.css";
import Image from "next/image"

interface Props {
  content: questionInput;
}

// Utility to retrieve a file from IndexedDB based on unique ID
export function getFileFromIndexedDB(name: string): Promise<File | null> {
    return new Promise((resolve) => {
      const dbRequest = indexedDB.open("mediaFilesDB", 2);

      dbRequest.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
      
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains("mediaFiles")) {
          db.createObjectStore("mediaFiles", { keyPath: "id" });
  
        }
      };
  
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;

        const transaction = db.transaction("mediaFiles", "readonly");
        const objectStore = transaction.objectStore("mediaFiles");
  
        // Use the same unique ID to retrieve the file
        const uniqueId = `file_${name}`;

        const fileRequest = objectStore.get(uniqueId); // Fetch file by its unique ID

  
        fileRequest.onsuccess = () => {
          const fileBlob = fileRequest.result as File | Promise<File | null> | null;
          if (fileBlob) {
            resolve(fileBlob); // Return the file directly
          } else {
            resolve(null); // Return null if no file found
          }
        };
  
        fileRequest.onerror = () => {
          console.error("Error retrieving file from IndexedDB");
          resolve(null);
        };
      };
  
      dbRequest.onerror = (error) => {
        console.error("Error opening IndexedDB:", error);
        resolve(null);
      };
    });
  }

export const RenderContent: React.FC<Props> = ({ content }) => {
  const [elements, setElements] = useState<JSX.Element[]>([]);

  // Function to handle LaTeX and text rendering
  const renderTextContent = useCallback(() => {
    const tempElements: JSX.Element[] = [];

    if (content.value) {
      content.value.split("$@").forEach((line, lineIndex) => {
        // Convert to LaTeX syntax
        if (line.endsWith("$")) {
          tempElements.push(
            <div key={`latex-${lineIndex}`} style={{ color: 'black !important' }} className="my-2 custom-katex">
              <div
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(line.slice(0, -1), {
                    throwOnError: false,
                  }),
                }}
              />
            </div>
          );
        } else {
          // Render regular text
          tempElements.push(<div key={`text-${lineIndex}`}>{line}</div>);
        }
      });
    }
    setElements((prev) => [...prev, ...tempElements]); // Append text content to state
  }, [content.value]);

  // Function to handle file content rendering
  const renderFileContent = useCallback(() => {
    // See if the file is stored in IndexedDB (cached) first, then check if we can pull from Firebase Storage
    if (content.fileKey) {
      getFileFromIndexedDB(content.fileKey).then((file) => {
        // @ts-expect-error - file is an object incasing file, not the file itself
        if (file?.file) {
          // @ts-expect-error - file is an object incasing file, not the file itself
          const fileURL = URL.createObjectURL(file.file as Blob | MediaSource);
          
          if (content.fileKey!.startsWith("image/")) {
            setElements((prev) => [
              ...prev,
              <div key={content.fileKey} className="my-2">
                <Image
                  src={fileURL}
                  alt="Uploaded image"
                  width={16}         
                  height={9}         
                  layout="responsive"
                  className="h-auto max-w-full"
                />
              </div>,
            ]);
          } else if (content.fileKey!.startsWith("audio/")) {
            setElements((prev) => [
              ...prev,
              <div key={content.fileKey} className="my-2">
                <audio controls>
                  <source src={fileURL} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>,
            ]);
          }

          // Revoke the object URL after the component unmounts
          return () => {
            URL.revokeObjectURL(fileURL);
          };
        }
      }).catch((error) => {
        console.error("Error retrieving file from IndexedDB:", error);
      });
    }else if(content.fileURL) {
      // Set elements to the fileURL directly 
      if (content.fileKey!.startsWith("image/")) {
        setElements((prev) => [
          ...prev,
          <div key={content.fileKey} className="my-2">
            <Image
              src={content.fileURL!}
              alt="Uploaded image"
              width={16}         
              height={9}         
              layout="responsive"
              className="h-auto max-w-full"
            />
          </div>,
        ]);
      } else if (content.fileKey!.startsWith("audio/")) {
        setElements((prev) => [
          ...prev,
          <div key={content.fileKey} className="my-2">
            <audio controls>
              <source src={content.fileURL} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>,
        ]);
      }
    } 
  }, [content.fileKey, content.fileURL]);

  // useEffect to trigger rendering of text and file content
  useEffect(() => {
    setElements([]); // Reset elements before rendering new content
    renderTextContent();
    renderFileContent();
  }, [renderTextContent, renderFileContent]);

  return <div>{elements}</div>; // Render the content
};
