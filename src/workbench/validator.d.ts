declare module "progress-validator" {
  interface ValidationError {
    instancePath?: string;
    keyword?: string;
    params?: Record<string, unknown>;
  }
  interface Validator {
    (value: unknown): value is import("./model").Progress;
    errors?: ValidationError[] | null;
  }
  const validate: Validator;
  export default validate;
}
