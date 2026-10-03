import type { OutingEvent } from "@/lib/types";
export async function fetchFromInstagram(): Promise<{events:OutingEvent[];status:"skipped";reason:string}> {
  return {events:[],status:"skipped",reason:"利用者の指定により公式APIのアカウント連携を使用しません。ログイン不要の公開HTML・公式埋め込みの取得結果は日次収集の巡回記録に表示します。手動登録も利用できます。"};
}
