import { z } from "zod";

export const SignIn = z.object({
  rail_line: z.enum(["blue", "orange", "red"]),
  signed_in_at: z.string(),
  signed_in_by_user: z.string(),
  signed_in_employee: z.string(),
});

export type SignIn = z.infer<typeof SignIn>;

export const SignInList = z.array(SignIn);
export type SignInList = z.infer<typeof SignInList>;
