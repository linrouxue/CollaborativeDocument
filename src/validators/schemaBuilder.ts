import { z, ZodTypeAny } from 'zod'

type FieldSchemaMap = Record<string, ZodTypeAny>

/**
 * 构建 zod schema 的辅助方法
 * @param fields - 一个由字段名到字段校验规则的映射
 * @returns z.object schema
 */
export function createSchema<T extends FieldSchemaMap>(fields: T) {
  return z.object(fields)
}

/**
 * 使用示例
 * 
 * import {emailField, passwordField, usernameField} from '@/validators/fields'
 * import { createSchema } from '@/validators/schemaBuilder'
 * 
 * const registerSchema = createSchema({
 *   email: emailField,
 *   password: passwordField,
 *   username: usernameField
 * })
 * 
 * const result = registerSchema.safeParse(req.body)
 */