import type { SectionData } from "./types";

const str = (data: SectionData, key: string): string => {
  const v = data[key];
  return typeof v === "string" ? v : "";
};

export function backgroundColour(data: SectionData, key = "section_background_colour"): string {
  const v = str(data, key);
  return v ? `bg-${v}` : "";
}

export function textColour(data: SectionData, key: string): string {
  const v = str(data, key);
  return v ? `text-${v}` : "";
}

export function sectionWrapperClasses(data: SectionData): string {
  return [
    "section",
    backgroundColour(data),
    str(data, "section_padding_top") || "pt-16",
    str(data, "section_padding_bottom") || "pb-16",
    str(data, "section_text_alignment"),
  ]
    .filter(Boolean)
    .join(" ");
}

export function containerClass(data: SectionData): string {
  return str(data, "section_container_size") || "container";
}

export function fontSizeClass(data: SectionData): string {
  return str(data, "section_font_size");
}

export function headlineClass(data: SectionData, key: string): string {
  return str(data, key) || "text-5xl font-bold";
}

export function anchorId(data: SectionData): string | undefined {
  const id = str(data, "id");
  return id || undefined;
}
