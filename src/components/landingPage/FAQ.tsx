import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";

// Goes in backend

// If multiple questions have the same answer, the opening of the accordion breaks
const FAQData = [
  {
    question: "What types of resources do you offer for AP students?",
    answer:
      "We offer a wide range of resources for AP students, including study notes, practice exams, and helpful tips. Our resources are designed to help students prepare for AP exams and achieve their academic goals. Whether you're a first-time AP student or a seasoned AP student, we have something for you.",
  },
  {
    question: "Who creates the resources?",
    answer:
      "People from all over the world have contributed to our resource library. We welcome contributions from AP students like you! Whether you have study notes, practice exams, or helpful tips to share, you can submit your content to be reviewed and added to our resource library. Join us in building a community-driven platform for AP exam preparation.",
  },
  {
    question: "How can I contribute?",
    answer:
      "We welcome contributions from AP students like you! Whether you have study notes, practice exams, or helpful tips to share, you can submit your content to be reviewed and added to our resource library. Join us in building a community-driven platform for AP exam preparation.",
  },
];

const FAQ = () => {
  return (
    <>
      {FAQData.map((FAQ, index) => (
        <AccordionItem value={`item-${index + 1}`} key={FAQ.question}>
          <AccordionTrigger
            className={`${index === 0 && "text-left"} text-2xl font-bold`}
          >
            {`${FAQ.question}`}
          </AccordionTrigger>
          <AccordionContent>
            {`${FAQ.answer}`}
            <Link
              href="https://docs.google.com/document/d/1nV0nmzRKbgmVucE93ujft6tY-rQ-xPxLEahjuSpFz3s"
              className="font-bold text-blue-500 hover:underline"
            >
              {FAQ.answer.length > 0 && " "}
              Apply Here!
            </Link>
          </AccordionContent>
        </AccordionItem>
      ))}
    </>
  );
};

export default FAQ;
