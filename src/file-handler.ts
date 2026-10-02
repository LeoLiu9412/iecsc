import { extractCreateFiles } from "./file-handler/extract-create-files";
import { mergeExtractedData } from "./file-handler/merge-extracted-data";
import { saveMergedData } from "./file-handler/save-merged-data";

await extractCreateFiles();
const mergedData = await mergeExtractedData();
await saveMergedData(mergedData);
