import { Glob } from "bun";
import { CONSTANTS } from "../../constants";
import path from "path";

/**
 * Execute files in src/file-handler/create-file-handler
 */
export async function extractCreateFiles() {
  const create_file_handler_path = path.join(
    CONSTANTS.BASE_PATH,
    "src",
    "file-handler",
    "create-file-handler",
  );

  const scripts = (
    await Array.fromAsync(
      new Glob("*/*.ts").scan({ cwd: create_file_handler_path }),
    )
  ).sort();

  const failed: string[] = [];

  for (const script of scripts) {
    try {
      // Import and execute the script
      await import(path.join(create_file_handler_path, script));
    } catch (error) {
      failed.push(script);
      console.error(`Failed to execute ${script}:`, error);
    }
  }

  if (failed.length > 0) {
    console.error(`Failed scripts:\n${failed.join("\n")}`);
  } else {
    console.log(`All scripts executed successfully.`);
  }
}
