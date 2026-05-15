import { registerRootComponent } from "expo";
// Remove the .tsx extension - Metro handles this automatically
import App from "./artifacts/mobile/app/index";

registerRootComponent(App);
