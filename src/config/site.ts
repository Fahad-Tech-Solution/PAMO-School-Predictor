export const siteConfig = {
  name: "PAMO",
  fullName: "Physician Assistant Mentor Online",
  description:
    "Private PA school admissions predictor based on anonymous historical application data.",
} as const;

/**
 * Primary navigation.
 * Note: anonymous "applicant" records (home_state only) are created as part of the
 * application data-entry workflow — not as a separate identity directory.
 */
export const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { title: "Schools", href: "/schools", icon: "schools" },
  { title: "Applications", href: "/applications", icon: "applications" },
  { title: "School Predictor", href: "/predictor", icon: "predictor" },
  { title: "Settings", href: "/settings", icon: "settings" },
] as const;
