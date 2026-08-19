import { redirect } from "next/navigation";

export default function VouchersRedirectPage() {
  redirect("/admin/coupons");
}
