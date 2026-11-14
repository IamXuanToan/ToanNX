import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/** Link/router có nhận biết locale và pathname đã dịch. Luôn dùng thay cho next/link. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
