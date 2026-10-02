import path from "path";

const BASE_PATH = __dirname;

export const CONSTANTS = {
  BASE_PATH,
  SOURCE_FOLDER_PATH: path.join(BASE_PATH, "source"),
  OUTPUT_FOLDER_PATH: path.join(BASE_PATH, "output"),
};
