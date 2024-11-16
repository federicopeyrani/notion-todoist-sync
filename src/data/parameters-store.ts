import { z } from "zod";

export class ParametersStore {
  private static readonly parametersSchema = z.object({
    todoistSyncToken: z.string().optional(),
    afterUpdateTimestamp: z.coerce.date().optional(),
  });

  private static readonly emptyParameters: z.infer<
    typeof ParametersStore.parametersSchema
  > = {};

  static new = async (filePath: string) => {
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      await Bun.write(
        filePath,
        JSON.stringify(ParametersStore.emptyParameters),
      );
    }

    return new ParametersStore(filePath);
  };

  private constructor(private readonly filePath: string) {}

  public async read() {
    const fileContent = await Bun.file(this.filePath).text();
    return ParametersStore.parametersSchema.parse(JSON.parse(fileContent));
  }

  public async write(
    parameters: z.infer<typeof ParametersStore.parametersSchema>,
  ) {
    await Bun.write(this.filePath, JSON.stringify(parameters));
  }
}
