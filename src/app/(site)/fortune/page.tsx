import { redirect } from "next/navigation";
import { LATEST_FORTUNE_YEAR, fortuneIndexPath } from "@/lib/fortune";

// /fortune 은 해마다 가리키는 곳이 바뀌므로 영구(308)가 아니라 임시(307) 리다이렉트
export default function FortuneRoot() {
  redirect(fortuneIndexPath(LATEST_FORTUNE_YEAR));
}
