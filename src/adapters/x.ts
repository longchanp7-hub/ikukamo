import type { OutingEvent } from "@/lib/types";
export async function fetchFromX(): Promise<{events:OutingEvent[];status:"skipped";reason:string}> {
  return {events:[],status:"skipped",reason:"Xの公式APIは従量課金のため、この無課金運用では使用しません。直接検索は未対応です。"};
}
