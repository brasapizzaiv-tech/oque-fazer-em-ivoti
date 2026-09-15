import { Suspense } from "react";
import Confirmacao from "./Confirmacao";

export const metadata = {
  title: "Confirmando",
  robots: { index: false, follow: false },
};

export default function Callback() {
  return (
    <Suspense>
      <Confirmacao />
    </Suspense>
  );
}
