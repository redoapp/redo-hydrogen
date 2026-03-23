declare module "*.svg" {
  import { JSX } from "react";
  function component(props: React.SVGProps<SVGSVGElement>): JSX.Element;
  export default component;
}
