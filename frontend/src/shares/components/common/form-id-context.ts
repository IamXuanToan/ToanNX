import { createContext } from "react";

/** Id của `Form` gần nhất, cho nút submit đặt ngoài thẻ `<form>` (thanh nút đầu trang của `FormPage`). */
export const FormIdContext = createContext<string | undefined>(undefined);
