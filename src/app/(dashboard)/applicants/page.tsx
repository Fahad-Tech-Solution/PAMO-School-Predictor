import { redirect } from "next/navigation";

export const instant = false;

/** Applicants are not a nav directory — send people to applications. */
export default function ApplicantsIndexPage() {
  redirect("/applications");
}
