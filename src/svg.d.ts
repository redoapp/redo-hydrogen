declare module "*.svg" {
  import { JSX } from "react";
  function component(props: any): JSX.Element;
  export default component;
}