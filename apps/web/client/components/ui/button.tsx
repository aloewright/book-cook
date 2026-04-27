import { type ComponentProps } from "react";

export function Button(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 " +
        (props.className ?? "")
      }
    />
  );
}
