import z from "zod";

const zodStringInt = (nSchema: z.ZodInt, defaultVal?: number) => {
  return z.preprocess((val) => {
    if (typeof val !== "string") return val;
    if (val.trim() === "") return defaultVal;
    const parsed = parseInt(val, 10);
    if (Number.isNaN(parsed)) return val;
    return parsed;
  }, nSchema);
};

export { zodStringInt };
