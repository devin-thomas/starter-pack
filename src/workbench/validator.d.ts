declare module "progress-validator" {
  const validate: (value: unknown) => value is import("./model").Progress;
  export default validate;
}
