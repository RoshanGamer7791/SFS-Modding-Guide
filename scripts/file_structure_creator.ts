import { generateFileStructure } from "../src/api-generation/api-fs-generator";
import config from "../config/generation_config";
import * as fs from "fs";

const manifest = JSON.parse(
  fs.readFileSync("src/manifests/manifest.json", "utf8")
);
generateFileStructure(manifest, "../api-test");
console.log("File structure created in ../api-test");
