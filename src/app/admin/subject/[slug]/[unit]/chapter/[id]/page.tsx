"use client";
import ArticleCreator from "@/components/article-creator/ArticleCreator";
import { useUser } from "@/components/hooks/UserContext";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, UserRoundCog } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Link } from "@/app/admin/subject/link";
import { cn } from "@/lib/utils";

const Page = () => {
  const { user, loading } = useUser();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathParts = pathname.split("/").slice(-4);

  useEffect(() => {
    if ((!user || user?.access === "user") && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  return (
    <div className="flex grow flex-col px-10 pt-10 xl:px-20">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-min")}
          href={`/admin/subject/${pathParts[0]}`}
        >
          <ArrowLeft className="mr-2" />
          Return to Subject
        </Link>
        <h1 className="hidden text-center md:block">
          <b>{decodeURIComponent(searchParams.get("subject") ?? "")}</b> Unit{" "}
          {decodeURIComponent(searchParams.get("unitIndex") ?? "")}
          <br />
          {decodeURIComponent(searchParams.get("chapter") ?? "")}
        </h1>
        <Link
          className={cn(buttonVariants({ variant: "outline" }), "w-min")}
          href={`/admin`}
        >
          <UserRoundCog className="mr-2" />
          Return to Admin Dashboard
        </Link>
      </div>
      <ArticleCreator className="mt-4 grow" />
    </div>
  );
};

export default Page;
